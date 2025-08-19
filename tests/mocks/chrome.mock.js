/**
 * Chrome Extension API Mock
 * 
 * Comprehensive mock implementation of Chrome extension APIs
 * for testing purposes. Provides realistic behavior simulation
 * including error conditions and quota enforcement.
 */

// Mock storage state - will be managed by ChromeStorageSimulator
let mockStorageState = {};

// Mock Chrome runtime error state
let mockLastError = null;

// Mock Chrome API object
const chrome = {
  storage: {
    sync: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
      getBytesInUse: jest.fn()
    },
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
      getBytesInUse: jest.fn()
    },
    onChanged: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
      hasListener: jest.fn()
    }
  },
  
  runtime: {
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
      hasListener: jest.fn()
    },
    sendMessage: jest.fn(),
    connect: jest.fn(),
    getURL: jest.fn(),
    getManifest: jest.fn(() => ({
      manifest_version: 3,
      name: 'Test Extension',
      version: '1.0.0'
    })),
    get lastError() {
      return mockLastError;
    },
    set lastError(error) {
      mockLastError = error;
    }
  },
  
  tabs: {
    query: jest.fn(),
    get: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
    remove: jest.fn(),
    onUpdated: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    }
  },
  
  // Extension specific APIs
  extension: {
    getURL: jest.fn(),
    getBackgroundPage: jest.fn()
  }
};

// Set up default mock implementations
chrome.storage.sync.get.mockImplementation((keys, callback) => {
  if (typeof keys === 'function') {
    callback = keys;
    keys = null;
  }
  
  // Simulate async behavior
  setTimeout(() => {
    if (mockLastError) {
      callback({});
    } else {
      if (keys === null || keys === undefined) {
        callback(mockStorageState);
      } else if (Array.isArray(keys)) {
        const result = {};
        keys.forEach(key => {
          if (mockStorageState.hasOwnProperty(key)) {
            result[key] = mockStorageState[key];
          }
        });
        callback(result);
      } else if (typeof keys === 'string') {
        const result = {};
        if (mockStorageState.hasOwnProperty(keys)) {
          result[keys] = mockStorageState[keys];
        }
        callback(result);
      } else if (typeof keys === 'object') {
        const result = {};
        Object.keys(keys).forEach(key => {
          result[key] = mockStorageState.hasOwnProperty(key) 
            ? mockStorageState[key] 
            : keys[key]; // default value
        });
        callback(result);
      }
    }
  }, 0);
});

chrome.storage.sync.set.mockImplementation((items, callback) => {
  // Default implementation - will be overridden by ChromeStorageSimulator
  setTimeout(() => {
    Object.assign(mockStorageState, items);
    mockLastError = null;
    if (callback) callback();
  }, 0);
});

chrome.runtime.sendMessage.mockImplementation((message, callback) => {
  // Default implementation for message passing
  setTimeout(() => {
    if (callback) {
      // Simulate different responses based on message action
      switch (message.action) {
        case 'getApiKey':
          callback(mockStorageState.geminiApiKey || '');
          break;
        case 'saveApiKey':
          mockStorageState.geminiApiKey = message.apiKey;
          callback();
          break;
        default:
          callback();
      }
    }
  }, 0);
});

// Export mock functions for test access
chrome._mockHelpers = {
  setStorageState: (state) => {
    mockStorageState = { ...state };
  },
  getStorageState: () => ({ ...mockStorageState }),
  setLastError: (error) => {
    mockLastError = error;
  },
  clearLastError: () => {
    mockLastError = null;
  },
  resetState: () => {
    mockStorageState = {};
    mockLastError = null;
  }
};

// Make chrome API available globally
global.chrome = chrome;
global.browser = chrome; // For compatibility

module.exports = chrome;