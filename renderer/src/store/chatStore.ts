import { create } from 'zustand';

interface ChatMessage {
  id: string;
  content: string;
  type: 'user' | 'assistant';
  timestamp: number;
}

interface ChatState {
  // Messages
  messages: ChatMessage[];
  addMessage: (content: string, type: 'user' | 'assistant') => void;
  clearMessages: () => void;

  // Input
  inputValue: string;
  setInputValue: (value: string) => void;
  placeholder: string;
  setPlaceholder: (value: string) => void;

  // Streaming
  isStreaming: boolean;
  streamContent: string;
  startStreaming: () => void;
  appendStreamContent: (chunk: string) => void;
  finishStreaming: () => void;
  clearStreamContent: () => void;

  // Loading and processing
  isLoading: boolean;
  isProcessing: boolean;
  setLoading: (loading: boolean) => void;
  setProcessing: (processing: boolean) => void;

  // Screen capture
  currentScreenData: string | null;
  isScreenCaptured: boolean;
  setScreenData: (data: string | null) => void;
  setScreenCaptured: (captured: boolean) => void;

  // Actions
  clearState: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  // Messages
  messages: [],
  addMessage: (content: string, type: 'user' | 'assistant') =>
    set(state => ({
      messages: [
        ...state.messages,
        {
          id: `${Date.now()}-${Math.random()}`,
          content,
          type,
          timestamp: Date.now(),
        },
      ],
    })),
  clearMessages: () => set({ messages: [] }),

  // Input
  inputValue: '',
  setInputValue: (value: string) => set({ inputValue: value }),
  placeholder: 'Ask me anything... (Enter to chat, ⌘+Enter to capture screen)',
  setPlaceholder: (value: string) => set({ placeholder: value }),

  // Streaming
  isStreaming: false,
  streamContent: '',
  startStreaming: () => set({ isStreaming: true, streamContent: '' }),
  appendStreamContent: (chunk: string) =>
    set(state => ({ streamContent: state.streamContent + chunk })),
  finishStreaming: () => {
    const { streamContent } = get();
    const finalContent = streamContent.trim();

    // First clear the streaming state to prevent showing both stream and final message
    set({
      isStreaming: false,
      streamContent: '',
      isLoading: false,
      isProcessing: false,
    });

    // Then add the final message if there's content
    if (finalContent) {
      const { addMessage } = get();
      addMessage(finalContent, 'assistant');
    }
  },
  clearStreamContent: () => set({ streamContent: '' }),

  // Loading and processing
  isLoading: false,
  isProcessing: false,
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  setProcessing: (processing: boolean) => set({ isProcessing: processing }),

  // Screen capture
  currentScreenData: null,
  isScreenCaptured: false,
  setScreenData: (data: string | null) => set({ currentScreenData: data }),
  setScreenCaptured: (captured: boolean) => set({ isScreenCaptured: captured }),

  // Actions
  clearState: () =>
    set({
      inputValue: '',
      currentScreenData: null,
      isScreenCaptured: false,
      isLoading: false,
      isProcessing: false,
      isStreaming: false,
      streamContent: '',
      placeholder: 'Ask me anything... (Enter to chat, ⌘+Enter to capture screen)',
    }),
}));
