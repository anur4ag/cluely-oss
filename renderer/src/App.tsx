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
    <div className="container">
      <div className={`screen-capture-indicator ${isScreenCaptured ? 'active' : ''}`}></div>

      <div className="input-section">
        <div className="status-indicator"></div>
        <input
          ref={inputRef}
          type="text"
          className="input-field"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isProcessing}
        />
        <div className="shortcuts">⌘↩ capture</div>
      </div>

      <div className={`loading ${isLoading ? 'visible' : ''}`}>
        <div className="loading-spinner"></div>
        <span>Processing...</span>
      </div>

      <div ref={chatSectionRef} className={`chat-section ${shouldShowChat ? 'visible' : ''}`}>
        {messages.map(message => (
          <div key={message.id} className={`chat-message ${message.type}`}>
            {message.type === 'assistant' ? (
              <div
                className="markdown-content"
                dangerouslySetInnerHTML={{ __html: parseMarkdown(message.content) }}
              />
            ) : (
              <div>{message.content}</div>
            )}
          </div>
        ))}

        {isStreaming && streamContent && (
          <div className="chat-message assistant">
            <div
              className="markdown-content"
              dangerouslySetInnerHTML={{
                __html: parseMarkdown(streamContent) + '<span class="streaming-cursor">▋</span>',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
