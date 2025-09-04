// tests/api-key-integration.test.js

const ChromeExtensionSetup = require('./setup/chrome-extension-setup');

// Test Constants (matching apiKeyManager.js)
const MESSAGE_ACTION_SAVE = 'saveApiKey';
const MESSAGE_ACTION_GET = 'getApiKey';
const STORAGE_KEY = 'geminiApiKey';

// Test Data
const TEST_API_KEY_VALID = 'AIzaSyTest123ValidKey';
const TEST_API_KEY_FIRST = 'AIzaSyTestFirst456';  
const TEST_API_KEY_SECOND = 'AIzaSyTestSecond789';

// Timing Constants
const MESSAGE_TIMEOUT = 3000; // 3 seconds for message responses
const HEALTH_CHECK_TIMEOUT = 5000; // 5 seconds for health checks

/**
 * API Key Integration Tests
 * 
 * Tests API key storage and retrieval functionality in the background script
 * using Chrome runtime messaging API (black-box testing approach).
 * 
 * These tests verify:
 * - AC1: Valid API key storage and retrieval
 * - AC2: Empty storage handling
 * - AC3: API key overwrite functionality
 * - AC4: Empty string API key handling
 */
describe('API Key Integration Tests', () => {
  let extensionSetup;

  beforeAll(async () => {
    extensionSetup = new ChromeExtensionSetup();
    await extensionSetup.loadExtension();
    
    // Verify extension is loaded and healthy
    const isHealthy = await extensionSetup.verifyServiceWorkerHealth();
    if (!isHealthy) {
      throw new Error('Extension service worker is not responding properly');
    }
  }, 30000); // 30s timeout for extension loading

  beforeEach(async () => {
    // Clear storage state before each test
    await extensionSetup.clearChromeStorage();
  });

  afterAll(async () => {
    if (extensionSetup) {
      await extensionSetup.cleanup();
    }
  });

  /**
   * AC1: Valid API key storage and retrieval
   * 
   * Given: Clean storage state
   * When: Save valid API key
   * Then: Key should be retrievable and stored correctly
   */
  test('Valid API key storage and retrieval', async () => {
    // Given: Clean storage state (verified in beforeEach)
    // When: Save valid API key
    const testApiKey = TEST_API_KEY_VALID;
    await extensionSetup.sendMessage({
      action: MESSAGE_ACTION_SAVE,
      apiKey: testApiKey
    }, MESSAGE_TIMEOUT);
    // Then: Key should be retrievable
    const retrievedKey = await extensionSetup.sendMessage({
      action: MESSAGE_ACTION_GET
    }, MESSAGE_TIMEOUT);
    
    expect(retrievedKey).toBe(testApiKey);
    // And: Direct Chrome storage verification
    const storageResult = await extensionSetup.getChromeStorage([STORAGE_KEY]);
    expect(storageResult[STORAGE_KEY]).toBe(testApiKey);
  });

  /**
   * AC2: Empty storage handling
   *
   * Given: Clean storage state
   * When: Request API key from empty storage
   * Then: Should return empty string (not error due to existing error handling)
   */
  test('Empty storage returns empty string', async () => {
    // Given: Clean storage state (verified in beforeEach)

    // When: Request API key from empty storage
    const result = await extensionSetup.sendMessage({
      action: MESSAGE_ACTION_GET
    }, MESSAGE_TIMEOUT);

    // Then: Should return empty string (not error due to existing error handling)
    expect(result).toBe('');
    expect(typeof result).toBe('string');
  });

  /**
   * AC3: API key overwrite functionality
   *
   * Given: Storage contains existing API key
   * When: Save different API key
   * Then: New key should replace old key
   */
  test('API key overwrite functionality', async () => {
    // Given: Storage contains existing API key
    const firstKey = TEST_API_KEY_FIRST;
    await extensionSetup.sendMessage({
      action: MESSAGE_ACTION_SAVE,
      apiKey: firstKey
    }, MESSAGE_TIMEOUT);

    // Verify first key is stored
    const firstRetrieved = await extensionSetup.sendMessage({
      action: MESSAGE_ACTION_GET
    }, MESSAGE_TIMEOUT);
    expect(firstRetrieved).toBe(firstKey);

    // When: Save different API key
    const secondKey = TEST_API_KEY_SECOND;
    await extensionSetup.sendMessage({
      action: MESSAGE_ACTION_SAVE,
      apiKey: secondKey
    }, MESSAGE_TIMEOUT);

    // Then: New key should replace old key
    const retrievedKey = await extensionSetup.sendMessage({
      action: MESSAGE_ACTION_GET
    }, MESSAGE_TIMEOUT);

    expect(retrievedKey).toBe(secondKey);
    expect(retrievedKey).not.toBe(firstKey);

    // And: Direct Chrome storage verification
    const storageResult = await extensionSetup.getChromeStorage([STORAGE_KEY]);
    expect(storageResult[STORAGE_KEY]).toBe(secondKey);
  });

  /**
   * AC4: Empty string API key handling
   *
   * Given: Clean storage state
   * When: Save empty string as API key
   * Then: Should store and retrieve empty string
   */
  test('Empty string API key storage', async () => {
    // Given: Clean storage state (verified in beforeEach)

    // When: Save empty string as API key
    await extensionSetup.sendMessage({
      action: MESSAGE_ACTION_SAVE,
      apiKey: ""
    }, MESSAGE_TIMEOUT);

    // Then: Should store and retrieve empty string
    const result = await extensionSetup.sendMessage({
      action: MESSAGE_ACTION_GET
    }, MESSAGE_TIMEOUT);

    expect(result).toBe('');
    expect(typeof result).toBe('string');

    // And: Chrome storage should contain empty string (not undefined)
    const storageResult = await extensionSetup.getChromeStorage([STORAGE_KEY]);
    expect(storageResult[STORAGE_KEY]).toBe('');
    expect(storageResult.hasOwnProperty(STORAGE_KEY)).toBe(true);
  });

  /**
   * Service Worker Health Check Test
   * Ensures the extension's service worker is responding properly
   */
  test('Service worker health check', async () => {
    const isHealthy = await extensionSetup.verifyServiceWorkerHealth();
    expect(isHealthy).toBe(true);
  });

  /**
   * Message Communication Test
   * Verifies basic message sending functionality works
   */
  test('Message communication works', async () => {
    // Test that unknown action returns undefined (no error)
    const result = await extensionSetup.sendMessage({
      action: 'unknownAction'
    }, MESSAGE_TIMEOUT);

    // Should not throw an error, but may return undefined
    expect(result === undefined || result === null).toBe(true);
  });

  /**
   * Storage Isolation Test
   * Verifies that storage cleanup between tests works properly
   */
  test('Storage isolation between tests', async () => {
    // Save a test key
    const testKey = 'isolationTestKey';
    await extensionSetup.sendMessage({
      action: MESSAGE_ACTION_SAVE,
      apiKey: testKey
    }, MESSAGE_TIMEOUT);

    // Verify it's stored
    const retrieved = await extensionSetup.sendMessage({
      action: MESSAGE_ACTION_GET
    }, MESSAGE_TIMEOUT);
    expect(retrieved).toBe(testKey);

    // Manual cleanup and verify
    await extensionSetup.clearChromeStorage();

    const afterClear = await extensionSetup.sendMessage({
      action: MESSAGE_ACTION_GET
    }, MESSAGE_TIMEOUT);
    expect(afterClear).toBe('');
  });
});