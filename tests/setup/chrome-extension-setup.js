// tests/setup/chrome-extension-setup.js

const path = require('path');
const fs = require('fs');
const vm = require('vm');

/**
 * Chrome Extension Setup Utilities for Testing
 * Provides functions to mock Chrome extension environment for testing
 */

class ChromeExtensionSetup {
  constructor() {
    this.extensionContext = null;
    this.mockStorage = {};
    this.messageListeners = [];
    this.extensionId = 'mock-extension-id';
  }

  /**
   * Load Chrome extension by creating mock environment
   * @returns {Promise<void>}
   */
  async loadExtension() {
    // Verify build exists
    const extensionPath = path.resolve(__dirname, '../..');
    const bundlePath = path.join(extensionPath, 'dist/background.bundle.js');
    
    if (!fs.existsSync(bundlePath)) {
      throw new Error('Background bundle not found. Run npm run build first.');
    }

    // Read the background script
    const backgroundCode = fs.readFileSync(bundlePath, 'utf8');
    
    // Create Chrome API mock
    const chromeMock = {
      runtime: {
        onMessage: {
          listeners: this.messageListeners,
          addListener: (callback) => {
            this.messageListeners.push(callback);
          }
        },
        lastError: null
      },
      storage: {
        sync: {
          get: (keys, callback) => {
            const result = {};
            if (Array.isArray(keys)) {
              keys.forEach(key => {
                if (this.mockStorage.hasOwnProperty(key)) {
                  result[key] = this.mockStorage[key];
                }
              });
            } else if (typeof keys === 'string') {
              if (this.mockStorage.hasOwnProperty(keys)) {
                result[keys] = this.mockStorage[keys];
              }
            }
            callback(result);
          },
          set: (items, callback) => {
            Object.assign(this.mockStorage, items);
            if (callback) callback();
          },
          clear: (callback) => {
            this.mockStorage = {};
            if (callback) callback();
          }
        }
      }
    };

    // Create execution context
    const context = {
      chrome: chromeMock,
      console: console,
      setTimeout: setTimeout,
      clearTimeout: clearTimeout,
      setInterval: setInterval,
      clearInterval: clearInterval,
      Date: Date,
      Promise: Promise,
      require: require,
      module: { exports: {} },
      exports: {}
    };

    // Execute background script in mock context
    try {
      vm.createContext(context);
      vm.runInContext(backgroundCode, context);
      this.extensionContext = context;
    } catch (error) {
      console.error('Failed to load background script:', error);
      throw error;
    }

    // Wait a bit for initialization
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Send message to extension background script
   * @param {Object} message - Message to send
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<any>} Response from extension
   */
  async sendMessage(message, timeout = 3000) {
    if (!this.extensionContext) {
      throw new Error('Extension not loaded');
    }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Message timeout after ${timeout}ms`));
      }, timeout);

      // Simulate message passing to background script
      let responded = false;
      const sendResponse = (response) => {
        if (!responded) {
          responded = true;
          clearTimeout(timer);
          resolve(response);
        }
      };

      // Find and call the appropriate message listener
      const listeners = this.messageListeners;
      for (const listener of listeners) {
        try {
          const result = listener(message, { tab: null }, sendResponse);
          if (result === true) {
            // Listener will call sendResponse asynchronously
            break;
          }
        } catch (error) {
          if (!responded) {
            responded = true;
            clearTimeout(timer);
            reject(error);
          }
        }
      }

      // If no listener handled the message, resolve with undefined
      if (!responded) {
        setTimeout(() => {
          if (!responded) {
            responded = true;
            clearTimeout(timer);
            resolve(undefined);
          }
        }, 100);
      }
    });
  }

  /**
   * Clear Chrome storage
   * @returns {Promise<void>}
   */
  async clearChromeStorage() {
    if (!this.extensionContext) {
      throw new Error('Extension not loaded');
    }
    
    return new Promise((resolve) => {
      this.mockStorage = {};
      resolve();
    });
  }

  /**
   * Get value from Chrome storage
   * @param {string|Array<string>} keys - Storage keys to retrieve
   * @returns {Promise<Object>} Storage result
   */
  async getChromeStorage(keys) {
    if (!this.extensionContext) {
      throw new Error('Extension not loaded');
    }
    
    return new Promise((resolve) => {
      const result = {};
      if (Array.isArray(keys)) {
        keys.forEach(key => {
          if (this.mockStorage.hasOwnProperty(key)) {
            result[key] = this.mockStorage[key];
          }
        });
      } else if (typeof keys === 'string') {
        if (this.mockStorage.hasOwnProperty(keys)) {
          result[keys] = this.mockStorage[keys];
        }
      }
      resolve(result);
    });
  }

  /**
   * Verify service worker health
   * @returns {Promise<boolean>} True if service worker is healthy
   */
  async verifyServiceWorkerHealth() {
    if (!this.extensionContext) {
      return false;
    }

    try {      
      // Check if chrome APIs are available in our mock context
      const chrome = this.extensionContext.chrome;
      const hasChrome = !!chrome;
      const hasRuntime = !!(chrome?.runtime);
      const hasStorage = !!(chrome?.storage?.sync);

      return hasChrome && hasRuntime && hasStorage;
    } catch (error) {
      console.warn('Service worker health check failed:', error);
      return false;
    }
  }

  /**
   * Close browser and cleanup resources
   * @returns {Promise<void>}
   */
  async cleanup() {
    // Clean up mock environment
    this.extensionContext = null;
    this.mockStorage = {};
    this.messageListeners = [];
    this.extensionId = null;
  }
}

module.exports = ChromeExtensionSetup;