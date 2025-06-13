class OverlayRenderer {
  constructor() {
    this.chatInput = document.getElementById('chatInput');
    this.chatSection = document.getElementById('chatSection');
    this.loadingIndicator = document.getElementById('loadingIndicator');
    this.screenIndicator = document.getElementById('screenIndicator');

    this.currentScreenData = null;
    this.isProcessing = false;

    this.initializeEventListeners();
    this.setupElectronListeners();
  }

  initializeEventListeners() {
    // Handle input events
    this.chatInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        if (e.metaKey || e.ctrlKey) {
          // CMD+Enter: Capture screen and send message
          this.captureAndSendMessage();
        } else {
          // Enter: Send message without screen capture
          this.sendMessage();
        }
      } else if (e.key === 'Escape') {
        // Escape: Hide overlay
        this.hideOverlay();
      }
    });

    // Prevent default drag behavior
    document.addEventListener('dragover', e => e.preventDefault());
    document.addEventListener('drop', e => e.preventDefault());
  }

  setupElectronListeners() {
    // Listen for overlay events
    window.electronAPI.onOverlayShown(() => {
      this.focusInput();
    });

    window.electronAPI.onOverlayHidden(() => {
      this.clearState();
    });

    window.electronAPI.onInitiateChatWithScreen(screenData => {
      this.handleScreenCapture(screenData);
    });
  }

  focusInput() {
    setTimeout(() => {
      this.chatInput.focus();
      this.chatInput.select();
    }, 100);
  }

  clearState() {
    this.chatInput.value = '';
    this.currentScreenData = null;
    this.hideScreenIndicator();
    this.hideLoading();
  }

  async captureAndSendMessage() {
    if (this.isProcessing) return;

    try {
      this.showScreenIndicator();
      const screenData = await window.electronAPI.captureScreen();
      this.currentScreenData = screenData;

      if (screenData) {
        // Auto-focus input for user to type their question
        this.chatInput.placeholder = 'What would you like to know about this screen?';
        this.focusInput();
      } else {
        this.addMessage('Failed to capture screen. Please try again.', 'assistant');
        this.hideScreenIndicator();
      }
    } catch (error) {
      console.error('Error capturing screen:', error);
      this.addMessage('Error capturing screen.', 'assistant');
      this.hideScreenIndicator();
    }
  }

  async sendMessage() {
    if (this.isProcessing) return;

    const message = this.chatInput.value.trim();
    if (!message) return;

    this.isProcessing = true;
    this.showLoading();

    try {
      // Add user message to chat
      this.addMessage(message, 'user');

      // Clear input
      this.chatInput.value = '';
      this.chatInput.placeholder = 'Ask me anything... (⌘+Enter to capture screen)';

      // Send to LLM
      const response = await window.electronAPI.sendChatMessage(message, this.currentScreenData);

      // Add response to chat
      this.addMessage(response, 'assistant');

      // Clear screen data after use
      this.currentScreenData = null;
      this.hideScreenIndicator();
    } catch (error) {
      console.error('Error sending message:', error);
      this.addMessage('Sorry, there was an error processing your request.', 'assistant');
    } finally {
      this.isProcessing = false;
      this.hideLoading();
    }
  }

  addMessage(content, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${type}`;
    messageDiv.textContent = content;

    this.chatSection.appendChild(messageDiv);
    this.showChatSection();

    // Scroll to bottom
    this.chatSection.scrollTop = this.chatSection.scrollHeight;

    // Expand window height if needed
    this.adjustWindowHeight();
  }

  showChatSection() {
    this.chatSection.classList.add('visible');
  }

  adjustWindowHeight() {
    // Calculate required height
    const container = document.querySelector('.container');
    const inputHeight = 60; // Fixed input section height
    const chatHeight = Math.min(this.chatSection.scrollHeight, 300);
    const totalHeight = inputHeight + chatHeight + 16; // 16px for padding

    // Update window height (this would need to be communicated to main process)
    document.body.style.height = totalHeight + 'px';
  }

  showLoading() {
    this.loadingIndicator.classList.add('visible');
  }

  hideLoading() {
    this.loadingIndicator.classList.remove('visible');
  }

  showScreenIndicator() {
    this.screenIndicator.classList.add('active');
  }

  hideScreenIndicator() {
    this.screenIndicator.classList.remove('active');
  }

  async hideOverlay() {
    await window.electronAPI.hideOverlay();
  }

  handleScreenCapture(screenData) {
    this.currentScreenData = screenData;
    if (screenData) {
      this.showScreenIndicator();
      this.chatInput.placeholder = 'What would you like to know about this screen?';
      this.focusInput();
    }
  }
}

// Initialize the overlay renderer when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new OverlayRenderer();
});
