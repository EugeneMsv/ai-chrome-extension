/**
 * Message Helper
 * 
 * Handles Chrome extension message communication for testing.
 * Provides proper message routing and response handling that
 * mimics real Chrome extension behavior.
 * 
 * @class MessageHelper
 */
class MessageHelper {
  constructor() {
    this.messageListeners = new Set();
    this.messageHistory = [];
    this.responseTimeout = 5000; // 5 seconds default timeout
    
    // Bind methods to preserve context
    this.sendMessage = this.sendMessage.bind(this);
    this.addListener = this.addListener.bind(this);
    this.removeListener = this.removeListener.bind(this);
  }
  
  /**
   * Send a message to the background script
   * Simulates chrome.runtime.sendMessage behavior
   * 
   * @param {Object} message - Message to send
   * @param {Function} responseCallback - Optional response callback
   * @returns {Promise} Promise that resolves with response
   */
  async sendMessage(message, responseCallback) {
    return new Promise((resolve, reject) => {
      // Track message in history
      const messageId = this.generateMessageId();
      const messageRecord = {
        id: messageId,
        message: JSON.parse(JSON.stringify(message)),
        timestamp: Date.now(),
        type: 'outgoing'
      };
      this.messageHistory.push(messageRecord);
      
      // Set up timeout
      const timeoutId = setTimeout(() => {
        const error = new Error('Message timeout');
        error.code = 'TIMEOUT';
        global.chrome.runtime.lastError = { message: error.message };
        
        if (responseCallback) {
          responseCallback(undefined);
        }
        reject(error);
      }, this.responseTimeout);
      
      // Simulate Chrome's async message handling
      setTimeout(() => {
        try {
          // Clear timeout since we're responding
          clearTimeout(timeoutId);
          
          // Process message through registered listeners
          const response = this.processMessage(message);
          
          // Record response
          const responseRecord = {
            id: messageId,
            response: response,
            timestamp: Date.now(),
            type: 'response'
          };
          this.messageHistory.push(responseRecord);
          
          // Clear any previous error
          global.chrome.runtime.lastError = null;
          
          // Call response callback if provided
          if (responseCallback) {
            responseCallback(response);
          }
          
          resolve(response);
        } catch (error) {
          global.chrome.runtime.lastError = { message: error.message };
          
          if (responseCallback) {
            responseCallback(undefined);
          }
          reject(error);
        }
      }, 10); // Small delay to simulate async behavior
    });
  }
  
  /**
   * Process a message through registered listeners
   * Simulates background script message handling
   * 
   * @param {Object} message - Message to process
   * @returns {any} Response from message handler
   */
  processMessage(message) {
    // Default message processing logic for API key operations
    switch (message.action) {
      case 'getApiKey':
        return this.handleGetApiKey();
        
      case 'saveApiKey':
        return this.handleSaveApiKey(message.apiKey);
        
      default:
        // Call custom listeners if any are registered
        for (const listener of this.messageListeners) {
          try {
            const response = listener(message, {}, () => {}); // Mock sender and sendResponse
            if (response !== undefined) {
              return response;
            }
          } catch (error) {
            throw error;
          }
        }
        return undefined;
    }
  }
  
  /**
   * Handle getApiKey message
   * 
   * @returns {string} API key or empty string
   */
  handleGetApiKey() {
    return new Promise((resolve) => {
      global.chrome.storage.sync.get(['geminiApiKey'], (result) => {
        if (global.chrome.runtime.lastError) {
          resolve('');
        } else {
          resolve(result.geminiApiKey || '');
        }
      });
    });
  }
  
  /**
   * Handle saveApiKey message
   * 
   * @param {string} apiKey - API key to save
   * @returns {Promise} Promise that resolves when saved
   */
  handleSaveApiKey(apiKey) {
    return new Promise((resolve) => {
      global.chrome.storage.sync.set({ geminiApiKey: apiKey }, () => {
        resolve();
      });
    });
  }
  
  /**
   * Add a message listener
   * Simulates chrome.runtime.onMessage.addListener
   * 
   * @param {Function} listener - Message listener function
   */
  addListener(listener) {
    this.messageListeners.add(listener);
    
    // Store original Chrome implementation if available
    if (global.chrome && global.chrome.runtime && global.chrome.runtime.onMessage) {
      const originalAddListener = global.chrome.runtime.onMessage.addListener;
      if (originalAddListener && typeof originalAddListener === 'function' && !originalAddListener._isMessageHelper) {
        originalAddListener(listener);
      }
    }
  }
  
  /**
   * Remove a message listener
   * 
   * @param {Function} listener - Message listener to remove
   */
  removeListener(listener) {
    this.messageListeners.delete(listener);
    
    // Also remove from Chrome mock if available
    if (global.chrome && global.chrome.runtime && global.chrome.runtime.onMessage) {
      global.chrome.runtime.onMessage.removeListener(listener);
    }
  }
  
  /**
   * Setup background script listeners
   * Registers the actual background script message handlers for testing
   */
  setupBackgroundListeners() {
    // Import and register the actual apiKeyManager listener
    const messageHandler = (request, sender, sendResponse) => {
      console.log(`MessageHelper: Received action=${request.action}`);
      
      if (request.action === 'getApiKey') {
        (async () => {
          try {
            const result = await this.handleGetApiKey();
            sendResponse(result);
          } catch (error) {
            sendResponse('');
          }
        })();
        return true; // Indicates async response
      }
      
      if (request.action === 'saveApiKey') {
        (async () => {
          await this.handleSaveApiKey(request.apiKey);
          sendResponse();
        })();
        return true; // Indicates async response
      }
      
      return false;
    };
    
    this.addListener(messageHandler);
  }
  
  /**
   * Generate unique message ID
   * 
   * @returns {string} Unique message identifier
   */
  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Get message history for debugging
   * 
   * @returns {Array} Array of message records
   */
  getMessageHistory() {
    return [...this.messageHistory];
  }
  
  /**
   * Clear message history
   */
  clearHistory() {
    this.messageHistory = [];
  }
  
  /**
   * Set response timeout
   * 
   * @param {number} timeout - Timeout in milliseconds
   */
  setTimeout(timeout) {
    this.responseTimeout = timeout;
  }
  
  /**
   * Get the last sent message
   * 
   * @returns {Object|null} Last sent message record
   */
  getLastMessage() {
    const outgoingMessages = this.messageHistory.filter(record => record.type === 'outgoing');
    return outgoingMessages.length > 0 ? outgoingMessages[outgoingMessages.length - 1] : null;
  }
  
  /**
   * Get the last received response
   * 
   * @returns {Object|null} Last received response record
   */
  getLastResponse() {
    const responses = this.messageHistory.filter(record => record.type === 'response');
    return responses.length > 0 ? responses[responses.length - 1] : null;
  }
  
  /**
   * Wait for a specific message action
   * Useful for testing async message flows
   * 
   * @param {string} action - Action to wait for
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise} Promise that resolves when message is received
   */
  waitForMessage(action, timeout = 1000) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Timeout waiting for message with action: ${action}`));
      }, timeout);
      
      const checkHistory = () => {
        const found = this.messageHistory.find(record => 
          record.type === 'outgoing' && record.message.action === action
        );
        
        if (found) {
          clearTimeout(timeoutId);
          resolve(found);
        } else {
          setTimeout(checkHistory, 10);
        }
      };
      
      checkHistory();
    });
  }
  
  /**
   * Reset helper to clean state
   */
  reset() {
    this.messageListeners.clear();
    this.clearHistory();
    global.chrome.runtime.lastError = null;
  }
  
  /**
   * Install this helper as the Chrome runtime message mock
   */
  install() {
    if (global.chrome && global.chrome.runtime) {
      global.chrome.runtime.sendMessage = this.sendMessage;
      
      // Enhance onMessage mock with actual functionality
      if (global.chrome.runtime.onMessage) {
        const originalAddListener = global.chrome.runtime.onMessage.addListener;
        global.chrome.runtime.onMessage.addListener = (listener) => {
          this.messageListeners.add(listener);
          if (originalAddListener && originalAddListener.mockImplementation) {
            originalAddListener(listener);
          }
        };
        global.chrome.runtime.onMessage.addListener._isMessageHelper = true;
      }
    }
  }
}

module.exports = MessageHelper;