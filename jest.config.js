/**
 * Jest Configuration for Chrome Extension Testing
 * 
 * This configuration is specifically designed for testing Chrome extension
 * API key storage functionality with proper Chrome API mocking and 
 * environment setup.
 */

module.exports = {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Root directory for tests
  rootDir: '.',
  
  // Test file patterns
  testMatch: [
    '<rootDir>/__tests__/**/*.test.js',
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/src/**/__tests__/**/*.js'
  ],
  
  // Setup files to configure testing environment
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup/jest.setup.js'
  ],
  
  // Module name mapping for Chrome extension APIs
  moduleNameMapper: {
    // Map Chrome APIs to mocks
    '^chrome$': '<rootDir>/tests/mocks/chrome.mock.js',
    '^chrome/(.*)$': '<rootDir>/tests/mocks/chrome/$1.mock.js'
  },
  
  // Coverage configuration
  collectCoverageFrom: [
    'background/**/*.js',
    '!background/background.js', // Entry point, tested via integration
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/*.config.js'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Test timeout (5 seconds for integration tests)
  testTimeout: 5000,
  
  // Verbose output for better debugging
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
  
  // Transform configuration for ES6 modules
  transform: {
    '^.+\\.js$': ['babel-jest', {
      presets: [['@babel/preset-env', { targets: { node: 'current' } }]]
    }]
  },
  
  // Globals configuration for Chrome extension environment
  globals: {
    'chrome': {},
    'browser': {}
  }
};