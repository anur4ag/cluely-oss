import React, { useEffect, useRef } from 'react';
import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';
import { useChatStore } from './store/chatStore';

// Declare the Electron API types directly in this file as a fallback
declare global {
  interface Window {
    electronAPI: {
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
    };
  }
}

const App: React.FC = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const chatSectionRef = useRef<HTMLDivElement>(null);

  // Zustand store
  const {
    messages,
    inputValue,
    placeholder,
    isLoading,
    isProcessing,
    currentScreenData,
    isScreenCaptured,
    streamContent,
    isStreaming,
    addMessage,
    setInputValue,
    setPlaceholder,
    setLoading,
    setProcessing,
    setScreenData,
    setScreenCaptured,
    startStreaming,
    appendStreamContent,
    finishStreaming,
    clearState,
  } = useChatStore();

  // Configure marked for markdown parsing
  useEffect(() => {
    marked.setOptions({
      breaks: true,
      gfm: true,
    });

    marked.use({
      renderer: {
        code(token) {
          const lang = token.lang || 'plaintext';
          const language = hljs.getLanguage(lang) ? lang : 'plaintext';
          const highlighted = hljs.highlight(token.text, { language }).value;
          return `<pre><code class="hljs language-${language}">${highlighted}</code></pre>`;
        },
      },
    });
  }, []);

  // Setup Electron listeners
  useEffect(() => {
    if (!window.electronAPI) {
      return;
    }

    const handleOverlayShown = () => {
      focusInput();
    };

    const handleOverlayHidden = () => {
      clearState();
    };

    const handleInitiateChatWithScreen = (screenData: string | null) => {
      handleScreenCapture(screenData);
    };

    const handleStreamChunk = (chunk: string) => {
      appendStreamContent(chunk);
    };

    const handleStreamEnd = () => {
      finishStreaming();
    };

    const handleStreamError = (error: unknown) => {
      console.error('Stream error:', error);
      addMessage('Sorry, there was an error processing your request.', 'assistant');
      finishStreaming();
    };

    window.electronAPI.onOverlayShown(handleOverlayShown);
    window.electronAPI.onOverlayHidden(handleOverlayHidden);
    window.electronAPI.onInitiateChatWithScreen(handleInitiateChatWithScreen);
    window.electronAPI.onChatMessageStreamChunk(handleStreamChunk);
    window.electronAPI.onChatMessageStreamEnd(handleStreamEnd);
    window.electronAPI.onChatMessageStreamError(handleStreamError);

    return () => {
      // Cleanup would go here if needed
    };
  }, [appendStreamContent, finishStreaming, addMessage, clearState]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatSectionRef.current) {
      chatSectionRef.current.scrollTop = chatSectionRef.current.scrollHeight;
    }
  }, [messages, streamContent]);

  const focusInput = () => {
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, 100);
  };

  const handleScreenCapture = (screenData: string | null) => {
    setScreenData(screenData);
    setScreenCaptured(!!screenData);
    if (screenData) {
      setPlaceholder('What would you like to know about this screen?');
      focusInput();
    }
  };

  const captureAndSendMessage = async () => {
    if (isProcessing || !window.electronAPI) {
      return;
    }

    try {
      setScreenCaptured(true);
      const screenData = await window.electronAPI.captureScreen();
      setScreenData(screenData);

      if (screenData) {
        setPlaceholder('What would you like to know about this screen?');
        focusInput();
      } else {
        addMessage('Failed to capture screen. Please try again.', 'assistant');
        setScreenCaptured(false);
      }
    } catch (error) {
      console.error('Error capturing screen:', error);
      addMessage('Error capturing screen.', 'assistant');
      setScreenCaptured(false);
    }
  };

  const sendMessage = async () => {
    if (isProcessing || !inputValue.trim() || !window.electronAPI) {
      return;
    }

    const message = inputValue.trim();

    // Set processing and loading states
    setProcessing(true);
    setLoading(true);
    startStreaming();

    try {
      // Add user message
      addMessage(message, 'user');

      // Clear input and reset placeholder
      setInputValue('');
      setPlaceholder('Ask me anything... (Enter to chat, ⌘+Enter to capture screen)');

      // Send to LLM with streaming
      await window.electronAPI.sendChatMessageStream(message, currentScreenData || undefined);

      // Clear screen data after use
      setScreenData(null);
      setScreenCaptured(false);
    } catch (error) {
      console.error('Error sending message:', error);
      addMessage('Sorry, there was an error processing your request.', 'assistant');
      finishStreaming();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (e.metaKey || e.ctrlKey) {
        captureAndSendMessage();
      } else {
        sendMessage();
      }
    } else if (e.key === 'Escape') {
      hideOverlay();
    }
  };

  const hideOverlay = async () => {
    if (window.electronAPI) {
      await window.electronAPI.hideOverlay();
    }
  };

  const parseMarkdown = (text: string): string => {
    try {
      const result = marked.parse(text);
      return typeof result === 'string' ? result : String(result);
    } catch (error) {
      console.error('Error parsing markdown:', error);
      return text;
    }
  };

  const shouldShowChat = messages.length > 0 || isStreaming;

  return (
    <div className="flex flex-col h-full p-2 px-4 bg-black/10 backdrop-blur-sm border border-white/10 rounded-xl">
      {/* Screen capture indicator */}
      <div
        className={`absolute top-1 right-2 w-1.5 h-1.5 bg-red-400 rounded-full ${
          isScreenCaptured ? 'block animate-pulse-glow' : 'hidden'
        }`}
      />

      {/* Input section */}
      <div className="flex items-center gap-3 min-h-11">
        {/* Status indicator */}
        <div className="w-2 h-2 bg-brand-green rounded-full animate-pulse-glow flex-shrink-0" />

        {/* Input field */}
        <input
          ref={inputRef}
          type="text"
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none transition-all duration-200 focus:bg-white/10 focus:border-brand-green/50 focus:shadow-[0_0_0_2px_rgba(0,255,136,0.2)] placeholder:text-white/60 disabled:opacity-50 backdrop-blur-sm"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isProcessing}
        />

        {/* Shortcuts */}
        <div className="text-xs text-white/50 whitespace-nowrap flex-shrink-0">⌘↩ capture</div>
      </div>

      {/* Loading indicator */}
      <div
        className={`flex items-center gap-2 text-white/70 text-xs px-3 py-2 ${
          isLoading ? 'flex' : 'hidden'
        }`}
      >
        <div className="w-3 h-3 border-2 border-white/30 border-t-brand-green rounded-full animate-spin" />
        <span>Processing...</span>
      </div>

      {/* Chat section */}
      <div
        ref={chatSectionRef}
        className={`flex-1 max-h-[300px] overflow-y-auto mt-2 custom-scrollbar ${
          shouldShowChat ? 'block' : 'hidden'
        }`}
      >
        {messages.map(message => (
          <div
            key={message.id}
            className={`rounded-lg p-3 mb-2 text-white text-sm leading-relaxed border-l-[3px] backdrop-blur-sm ${
              message.type === 'user'
                ? 'bg-brand-green/5 border-l-brand-green'
                : 'bg-white/5 border-l-brand-blue'
            }`}
          >
            {message.type === 'assistant' ? (
              <div
                className="break-words [&_h1]:mt-2 [&_h1]:mb-1 [&_h1]:text-brand-green [&_h2]:mt-2 [&_h2]:mb-1 [&_h2]:text-brand-green [&_h3]:mt-2 [&_h3]:mb-1 [&_h3]:text-brand-green [&_code]:bg-white/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_pre]:bg-white/10 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-2 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_blockquote]:border-l-[3px] [&_blockquote]:border-l-brand-blue [&_blockquote]:pl-3 [&_blockquote]:my-2 [&_blockquote]:text-white/80 [&_ul]:pl-5 [&_ul]:my-2 [&_ol]:pl-5 [&_ol]:my-2 [&_li]:my-1"
                dangerouslySetInnerHTML={{ __html: parseMarkdown(message.content) }}
              />
            ) : (
              <div>{message.content}</div>
            )}
          </div>
        ))}

        {isStreaming && streamContent && (
          <div className="bg-white/5 border-l-[3px] border-l-brand-blue rounded-lg p-3 mb-2 text-white text-sm leading-relaxed backdrop-blur-sm">
            <div
              className="break-words [&_h1]:mt-2 [&_h1]:mb-1 [&_h1]:text-brand-green [&_h2]:mt-2 [&_h2]:mb-1 [&_h2]:text-brand-green [&_h3]:mt-2 [&_h3]:mb-1 [&_h3]:text-brand-green [&_code]:bg-white/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_pre]:bg-white/10 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-2 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_blockquote]:border-l-[3px] [&_blockquote]:border-l-brand-blue [&_blockquote]:pl-3 [&_blockquote]:my-2 [&_blockquote]:text-white/80 [&_ul]:pl-5 [&_ul]:my-2 [&_ol]:pl-5 [&_ol]:my-2 [&_li]:my-1"
              dangerouslySetInnerHTML={{
                __html:
                  parseMarkdown(streamContent) +
                  '<span class="text-brand-green animate-blink">▋</span>',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
