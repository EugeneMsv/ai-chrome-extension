// jest.config.js

module.exports = {
  // Test environment
  testEnvironment: 'node', // Use node environment for Puppeteer integration
  
  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  
  // Setup files
  setupFilesAfterEnv: [],
  
  // Test timeout (increased for extension loading)
  testTimeout: 60000,
  
  // Coverage settings
  collectCoverageFrom: [
    'background/**/*.js',
    '!background/**/*.test.js',
    '!dist/**',
    '!node_modules/**'
  ],
  
  // Module resolution
  moduleFileExtensions: ['js', 'json'],
  
  // Verbose output for debugging
  verbose: true,
  
  // Prevent Jest from caching between runs
  clearMocks: true,
  restoreMocks: true,
  
  // Handle ES modules
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  
  // Global setup/teardown
  globalSetup: undefined,
  globalTeardown: undefined
};