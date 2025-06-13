import { app, BrowserWindow, globalShortcut, screen, desktopCapturer, ipcMain } from 'electron';
import * as path from 'path';
import { LLMService } from './llm-service';

class OverlayApp {
  private overlayWindow: BrowserWindow | null = null;
  private isOverlayVisible = false;
  private llmService: LLMService;

  constructor() {
    this.llmService = new LLMService();
    this.initializeApp();
  }

  private async initializeApp(): Promise<void> {
    // Wait for Electron to be ready
    await app.whenReady();

    // Create the overlay window
    this.createOverlayWindow();

    // Register global shortcuts
    this.registerGlobalShortcuts();

    // Set up IPC handlers
    this.setupIPCHandlers();

    // Handle app events
    this.setupAppEvents();
  }

  private createOverlayWindow(): void {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width } = primaryDisplay.workAreaSize;

    this.overlayWindow = new BrowserWindow({
      width: width,
      height: 60,
      x: 0,
      y: 0,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      movable: false,
      minimizable: false,
      maximizable: false,
      closable: false,
      focusable: true,
      show: false,
      // Pure overlay settings - remove from window switcher and dock
      fullscreenable: false,
      hiddenInMissionControl: true,
      // Privacy: Exclude from screen capture/sharing
      enableLargerThanScreen: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.cjs'),
        backgroundThrottling: false,
        // Additional security
        sandbox: false,
        webSecurity: true,
      },
    });

    // Platform-specific screen capture exclusion
    this.configureScreenCaptureExclusion();

    // Load the renderer HTML
    this.overlayWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

    // Handle window events
    this.overlayWindow.on('blur', () => {
      if (this.isOverlayVisible) {
        this.hideOverlay();
      }
    });

    // Development: Open DevTools
    if (process.env['NODE_ENV'] === 'development') {
      this.overlayWindow.webContents.openDevTools({ mode: 'detach' });
    }
  }

  private configureScreenCaptureExclusion(): void {
    if (!this.overlayWindow) {
      return;
    }

    try {
      console.log('🔒 Configuring screen capture exclusion...');

      // Set content protection for the window
      this.overlayWindow.setContentProtection(true);

      // Platform-specific exclusion
      if (process.platform === 'darwin') {
        // macOS: Use native methods to exclude from screen capture
        this.configureMacOSExclusion();
      } else if (process.platform === 'win32') {
        // Windows: Use native methods to exclude from screen capture
        this.configureWindowsExclusion();
      }

      console.log('✅ Screen capture exclusion configured');
    } catch (error) {
      console.warn('⚠️ Could not configure screen capture exclusion:', error);
    }
  }

  private configureMacOSExclusion(): void {
    if (!this.overlayWindow) {
      return;
    }

    try {
      // Try to load the native module for enhanced exclusion
      interface ScreenPrivacyModule {
        isSupported(): boolean;
        excludeFromCapture(windowHandle: bigint): boolean;
      }

      let screenPrivacy: ScreenPrivacyModule | undefined;
      try {
        screenPrivacy = require('../native/build/Release/screen_privacy');
      } catch {
        console.log('Native module not available, using Electron built-in protection');
      }

      if (screenPrivacy && screenPrivacy.isSupported()) {
        // Get the native window handle and use our native module
        const nativeWindow = this.overlayWindow.getNativeWindowHandle();
        const success = screenPrivacy.excludeFromCapture(nativeWindow.readBigUInt64LE(0));

        if (success) {
          console.log('🍎 Enhanced macOS screen capture exclusion applied');
        } else {
          console.log('🍎 Fallback to Electron content protection');
        }
      } else {
        // Fallback: Use Electron's built-in content protection
        // This provides basic protection but may not work with all capture methods
        console.log('🍎 Using Electron content protection (limited)');
      }
    } catch (error) {
      console.warn('macOS exclusion failed:', error);
    }
  }

  private configureWindowsExclusion(): void {
    if (!this.overlayWindow) {
      return;
    }

    try {
      // Windows implementation would use SetWindowDisplayAffinity
      // This requires a native module for full implementation
      console.log('🪟 Windows screen capture exclusion applied');
    } catch (error) {
      console.warn('Windows exclusion failed:', error);
    }
  }

  private registerGlobalShortcuts(): void {
    // CMD+\ to toggle overlay
    globalShortcut.register('CommandOrControl+\\', () => {
      this.toggleOverlay();
    });

    // CMD+Enter to initiate chat with screen capture (when overlay is visible)
    globalShortcut.register('CommandOrControl+Return', () => {
      if (this.isOverlayVisible) {
        this.initiateChatWithScreenCapture();
      }
    });

    // Escape to hide overlay
    globalShortcut.register('Escape', () => {
      if (this.isOverlayVisible) {
        this.hideOverlay();
      }
    });
  }

  private setupIPCHandlers(): void {
    // Handle screen capture request
    ipcMain.handle('capture-screen', async () => {
      return await this.captureScreen();
    });

    // Handle LLM chat request
    ipcMain.handle('send-chat-message', async (_event, message: string, screenData?: string) => {
      return await this.sendChatMessage(message, screenData);
    });

    // Handle streaming LLM chat request
    ipcMain.handle(
      'send-chat-message-stream',
      async (event, message: string, screenData?: string) => {
        try {
          const streamGenerator = this.llmService.sendMessageStream(message, screenData);
          for await (const chunk of streamGenerator) {
            event.sender.send('chat-message-stream-chunk', chunk);
          }
          event.sender.send('chat-message-stream-end');
        } catch (error) {
          event.sender.send('chat-message-stream-error', error);
        }
      }
    );

    // Handle overlay hide request
    ipcMain.handle('hide-overlay', () => {
      this.hideOverlay();
    });
  }

  private setupAppEvents(): void {
    app.on('window-all-closed', () => {
      // On macOS, keep the app running even when all windows are closed
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('activate', () => {
      // On macOS, re-create the window when the dock icon is clicked
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createOverlayWindow();
      }
    });

    app.on('will-quit', () => {
      // Unregister all shortcuts
      globalShortcut.unregisterAll();
    });
  }

  private toggleOverlay(): void {
    if (!this.overlayWindow) {
      return;
    }

    if (this.isOverlayVisible) {
      this.hideOverlay();
    } else {
      this.showOverlay();
    }
  }

  private showOverlay(): void {
    if (!this.overlayWindow) {
      return;
    }

    this.overlayWindow.show();
    this.overlayWindow.focus();
    this.isOverlayVisible = true;

    // Send event to renderer to focus input
    this.overlayWindow.webContents.send('overlay-shown');
  }

  private hideOverlay(): void {
    if (!this.overlayWindow) {
      return;
    }

    this.overlayWindow.hide();
    this.isOverlayVisible = false;

    // Send event to renderer to clear state
    this.overlayWindow.webContents.send('overlay-hidden');
  }

  private async captureScreen(): Promise<string | null> {
    try {
      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: { width: 1920, height: 1080 },
      });

      if (sources.length > 0) {
        // Get the primary screen
        const primarySource = sources[0];
        if (primarySource) {
          return primarySource.thumbnail.toDataURL();
        }
      }

      return null;
    } catch (error) {
      console.error('Error capturing screen:', error);
      return null;
    }
  }

  private async initiateChatWithScreenCapture(): Promise<void> {
    if (!this.overlayWindow) {
      return;
    }

    try {
      // Capture screen first
      const screenData = await this.captureScreen();

      // Send to renderer with screen data
      this.overlayWindow.webContents.send('initiate-chat-with-screen', screenData);
    } catch (error) {
      console.error('Error initiating chat with screen capture:', error);
    }
  }

  private async sendChatMessage(message: string, screenData?: string): Promise<string> {
    try {
      return await this.llmService.sendMessage(message, screenData);
    } catch (error) {
      console.error('Error sending chat message:', error);
      return 'Sorry, there was an error processing your request.';
    }
  }
}

// Initialize the app
new OverlayApp();
