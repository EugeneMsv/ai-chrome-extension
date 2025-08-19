/**
 * Jest Setup Configuration for Chrome Extension Testing
 * 
 * This file sets up the testing environment with proper Chrome API mocks
 * and global configurations needed for extension testing.
 */

// TextEncoder/TextDecoder polyfill for JSDOM
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Import Chrome API mocks
require('../mocks/chrome.mock.js');

// Global test configuration
global.console = {
  ...console,
  // Suppress console.log in tests unless needed
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Setup global timeout for async operations
jest.setTimeout(5000);

// Global beforeEach to reset Chrome API mocks
beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks();
  
  // Reset Chrome runtime lastError
  if (global.chrome && global.chrome.runtime) {
    global.chrome.runtime.lastError = null;
  }
  
  // Reset any global state
  if (global.chrome && global.chrome.storage && global.chrome.storage.sync) {
    // Reset storage state will be handled by ChromeStorageSimulator
  }
});

// Global afterEach for cleanup
afterEach(() => {
  // Clean up any timers or async operations
  jest.useRealTimers();
});

// Performance monitoring setup
global.performance = global.performance || {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  clearMarks: jest.fn(),
  clearMeasures: jest.fn()
};

// Memory usage monitoring for performance tests
global.process = global.process || {
  memoryUsage: jest.fn(() => ({
    rss: 0,
    heapTotal: 0,
    heapUsed: 0,
    external: 0
  }))
};