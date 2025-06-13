/// <reference types="vite/client" />

interface ElectronAPI {
  captureScreen: () => Promise<string | null>;
  sendChatMessage: (message: string, screenData?: string) => Promise<string>;
  sendChatMessageStream: (message: string, screenData?: string) => Promise<void>;
  hideOverlay: () => Promise<void>;
  onOverlayShown: (callback: () => void) => void;
  onOverlayHidden: (callback: () => void) => void;
  onInitiateChatWithScreen: (callback: (screenData: string | null) => void) => void;
  onChatMessageStreamChunk: (callback: (chunk: string) => void) => void;
  onChatMessageStreamEnd: (callback: () => void) => void;
  onChatMessageStreamError: (callback: (error: unknown) => void) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
