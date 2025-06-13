#include <nan.h>
#include <node.h>
#import <Cocoa/Cocoa.h>
#import <ApplicationServices/ApplicationServices.h>

using namespace v8;

// Function to exclude a window from screen capture on macOS
void ExcludeFromCapture(const Nan::FunctionCallbackInfo<Value>& info) {
    Nan::HandleScope scope;
    
    if (info.Length() < 1 || !info[0]->IsNumber()) {
        Nan::ThrowTypeError("Expected window handle as first argument");
        return;
    }
    
    // Get the window handle from Electron
    uint64_t windowHandle = info[0]->NumberValue(Nan::GetCurrentContext()).FromJust();
    
    @autoreleasepool {
        // Find the NSWindow using the handle
        NSArray *windows = [[NSApplication sharedApplication] windows];
        
        for (NSWindow *window in windows) {
            if ((uint64_t)window == windowHandle) {
                // Set the window sharing type to exclude from capture
                [window setSharingType:NSWindowSharingNone];
                
                // Also set the window level to be above screen capture
                [window setLevel:NSScreenSaverWindowLevel + 1];
                
                // Make window non-activating to prevent focus issues
                [window setIgnoresMouseEvents:NO];
                
                info.GetReturnValue().Set(Nan::True());
                return;
            }
        }
    }
    
    info.GetReturnValue().Set(Nan::False());
}

// Function to include a window in screen capture (restore normal behavior)
void IncludeInCapture(const Nan::FunctionCallbackInfo<Value>& info) {
    Nan::HandleScope scope;
    
    if (info.Length() < 1 || !info[0]->IsNumber()) {
        Nan::ThrowTypeError("Expected window handle as first argument");
        return;
    }
    
    uint64_t windowHandle = info[0]->NumberValue(Nan::GetCurrentContext()).FromJust();
    
    @autoreleasepool {
        NSArray *windows = [[NSApplication sharedApplication] windows];
        
        for (NSWindow *window in windows) {
            if ((uint64_t)window == windowHandle) {
                // Restore normal sharing behavior
                [window setSharingType:NSWindowSharingReadWrite];
                
                // Restore normal window level
                [window setLevel:NSFloatingWindowLevel];
                
                info.GetReturnValue().Set(Nan::True());
                return;
            }
        }
    }
    
    info.GetReturnValue().Set(Nan::False());
}

// Check if screen capture exclusion is supported
void IsSupported(const Nan::FunctionCallbackInfo<Value>& info) {
    Nan::HandleScope scope;
    
    #ifdef __APPLE__
        // Check macOS version - NSWindowSharingNone requires 10.5+
        if (@available(macOS 10.5, *)) {
            info.GetReturnValue().Set(Nan::True());
        } else {
            info.GetReturnValue().Set(Nan::False());
        }
    #else
        info.GetReturnValue().Set(Nan::False());
    #endif
}

// Module initialization
void Init(Local<Object> exports) {
    Nan::Set(exports, 
        Nan::New("excludeFromCapture").ToLocalChecked(),
        Nan::New<FunctionTemplate>(ExcludeFromCapture)->GetFunction(Nan::GetCurrentContext()).ToLocalChecked());
    
    Nan::Set(exports, 
        Nan::New("includeInCapture").ToLocalChecked(),
        Nan::New<FunctionTemplate>(IncludeInCapture)->GetFunction(Nan::GetCurrentContext()).ToLocalChecked());
    
    Nan::Set(exports, 
        Nan::New("isSupported").ToLocalChecked(),
        Nan::New<FunctionTemplate>(IsSupported)->GetFunction(Nan::GetCurrentContext()).ToLocalChecked());
}

NODE_MODULE(screen_privacy, Init) 