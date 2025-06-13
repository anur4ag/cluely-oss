import { contextBridge, ipcRenderer } from 'electron';

// Define the API interface
interface ElectronAPI {
  captureScreen: () => Promise<string | null>;
  sendChatMessage: (message: string, screenData?: string) => Promise<string>;
  hideOverlay: () => Promise<void>;
  onOverlayShown: (callback: () => void) => void;
  onOverlayHidden: (callback: () => void) => void;
  onInitiateChatWithScreen: (callback: (screenData: string | null) => void) => void;
}

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  captureScreen: (): Promise<string | null> => {
    return ipcRenderer.invoke('capture-screen');
  },

  sendChatMessage: (message: string, screenData?: string): Promise<string> => {
    return ipcRenderer.invoke('send-chat-message', message, screenData);
  },

  hideOverlay: (): Promise<void> => {
    return ipcRenderer.invoke('hide-overlay');
  },

  onOverlayShown: (callback: () => void): void => {
    ipcRenderer.on('overlay-shown', callback);
  },

  onOverlayHidden: (callback: () => void): void => {
    ipcRenderer.on('overlay-hidden', callback);
  },

  onInitiateChatWithScreen: (callback: (screenData: string | null) => void): void => {
    ipcRenderer.on('initiate-chat-with-screen', (_event, screenData) => {
      callback(screenData);
    });
  },
});

// Declare the global interface for TypeScript
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
