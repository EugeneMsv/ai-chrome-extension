// Global Test Setup
// Following the pseudocode from Phase 4.1 - Testing Framework Setup Algorithm

import { beforeEach, afterEach, vi } from 'vitest';

// Create Chrome API mock
const createChromeMock = () => ({
  storage: {
    sync: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
      getBytesInUse: vi.fn(),
      QUOTA_BYTES: 102400, // 100KB
    },
    local: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
      getBytesInUse: vi.fn(),
    },
  },
  runtime: {
    id: 'test-extension-id',
    lastError: null,
    getURL: vi.fn(() => 'chrome-extension://test-extension-id/'),
    getManifest: vi.fn(() => ({})),
    sendMessage: vi.fn(),
    sendNativeMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    onInstalled: {
      addListener: vi.fn(),
    },
    onStartup: {
      addListener: vi.fn(),
    },
  },
  tabs: {
    query: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    executeScript: vi.fn(),
    sendMessage: vi.fn(),
  },
  contextMenus: {
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    removeAll: vi.fn(),
    onClicked: {
      addListener: vi.fn(),
    },
  },
});

// Global Chrome API mock setup
global.chrome = createChromeMock();

// Mock global objects that might be used in Chrome extension context
global.browser = chrome;

// Mock Web APIs that might not be available in test environment
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock fetch for API testing
global.fetch = vi.fn();

// Mock DOM APIs commonly used in Chrome extensions
Object.defineProperty(window, 'getSelection', {
  writable: true,
  value: vi.fn(() => ({
    toString: vi.fn(() => 'selected text'),
    rangeCount: 1,
    getRangeAt: vi.fn(() => ({
      cloneContents: vi.fn(() => document.createElement('div')),
    })),
  })),
});

// Mock console methods to avoid noise in tests
const originalConsole = console;
global.console = {
  ...originalConsole,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
};

// Global test utilities
global.testUtils = {
  // Create a mock DOM element
  createMockElement: (tag: string, attributes?: Record<string, string>) => {
    const element = document.createElement(tag);
    if (attributes) {
      Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
      });
    }
    return element;
  },

  // Wait for next tick
  nextTick: () => new Promise(resolve => setTimeout(resolve, 0)),

  // Create a promise that resolves after specified time
  delay: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  // Create a mock event
  createMockEvent: (type: string, properties?: Record<string, any>) => {
    const event = new Event(type, { bubbles: true, cancelable: true });
    if (properties) {
      Object.assign(event, properties);
    }
    return event;
  },
};

// Clean up after each test
beforeEach(() => {
  // Reset all mocks
  vi.clearAllMocks();

  // Recreate chrome mock for clean state
  global.chrome = createChromeMock();
  global.browser = global.chrome;

  // Reset DOM
  document.body.innerHTML = '';
  document.head.innerHTML = '';

  // Reset any global state
  if (global.fetch) {
    vi.mocked(global.fetch).mockClear();
  }
});

afterEach(() => {
  // Clean up any remaining timers
  vi.clearAllTimers();

  // Clean up DOM
  document.body.innerHTML = '';
  document.head.innerHTML = '';
});

// Extend global types for test utilities
declare global {
  const testUtils: {
    createMockElement: (tag: string, attributes?: Record<string, string>) => Element;
    nextTick: () => Promise<void>;
    delay: (ms: number) => Promise<void>;
    createMockEvent: (type: string, properties?: Record<string, any>) => Event;
  };
}
