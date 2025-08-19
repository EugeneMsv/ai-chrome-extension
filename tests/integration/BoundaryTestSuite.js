/**
 * Boundary Test Suite
 * 
 * Comprehensive boundary value testing for Chrome extension API key storage.
 * Tests edge cases, limits, and boundary conditions with realistic API key generation.
 * 
 * @class BoundaryTestSuite
 */
class BoundaryTestSuite {
  constructor() {
    this.CHROME_ITEM_LIMIT = 8192; // 8KB per item
    this.CHROME_TOTAL_LIMIT = 102400; // 100KB total
    this.API_KEY_PREFIX = 'AIza'; // Google API key prefix
    this.KEY_OVERHEAD = 30; // Approximate JSON + key overhead
  }
  
  /**
   * Get all boundary test scenarios
   * 
   * @returns {Array} Array of test scenario objects
   */
  getTestScenarios() {
    return [
      // Item size boundaries
      ...this.getItemSizeBoundaries(),
      
      // Total quota boundaries
      ...this.getTotalQuotaBoundaries(),
      
      // Unicode and encoding boundaries
      ...this.getUnicodeBoundaries(),
      
      // Key length boundaries
      ...this.getKeyLengthBoundaries(),
      
      // API key format boundaries
      ...this.getApiKeyFormatBoundaries(),
      
      // Edge case scenarios
      ...this.getEdgeCaseScenarios()
    ];
  }
  
  /**
   * Generate item size boundary test scenarios
   * 
   * @returns {Array} Item size boundary scenarios
   */
  getItemSizeBoundaries() {
    return [
      {
        name: 'item-size-far-below-limit',
        description: 'API key well below item size limit',
        apiKey: this.generateApiKey(1000),
        expectedResult: 'success',
        category: 'item-size'
      },
      {
        name: 'item-size-below-limit',
        description: 'API key just below item size limit',
        apiKey: this.generateApiKey(this.CHROME_ITEM_LIMIT - 100),
        expectedResult: 'success',
        category: 'item-size'
      },
      {
        name: 'item-size-at-limit',
        description: 'API key exactly at item size limit',
        apiKey: this.generateApiKey(this.CHROME_ITEM_LIMIT),
        expectedResult: 'success',
        category: 'item-size'
      },
      {
        name: 'item-size-just-over-limit',
        description: 'API key just over item size limit',
        apiKey: this.generateApiKey(this.CHROME_ITEM_LIMIT + 1),
        expectedResult: 'quota_exceeded',
        category: 'item-size'
      },
      {
        name: 'item-size-far-over-limit',
        description: 'API key far over item size limit',
        apiKey: this.generateApiKey(this.CHROME_ITEM_LIMIT * 2),
        expectedResult: 'quota_exceeded',
        category: 'item-size'
      }
    ];
  }
  
  /**
   * Generate total quota boundary test scenarios
   * 
   * @returns {Array} Total quota boundary scenarios
   */
  getTotalQuotaBoundaries() {
    return [
      {
        name: 'quota-50-percent',
        description: 'Storage at 50% quota usage',
        setupQuota: 0.50,
        apiKey: this.generateApiKey(1000),
        expectedResult: 'success',
        category: 'total-quota'
      },
      {
        name: 'quota-90-percent',
        description: 'Storage at 90% quota usage',
        setupQuota: 0.90,
        apiKey: this.generateApiKey(1000),
        expectedResult: 'success',
        category: 'total-quota'
      },
      {
        name: 'quota-95-percent',
        description: 'Storage at 95% quota usage',
        setupQuota: 0.95,
        apiKey: this.generateApiKey(1000),
        expectedResult: 'success',
        category: 'total-quota'
      },
      {
        name: 'quota-99-percent',
        description: 'Storage at 99% quota usage',
        setupQuota: 0.99,
        apiKey: this.generateApiKey(500),
        expectedResult: 'success',
        category: 'total-quota'
      },
      {
        name: 'quota-at-limit',
        description: 'Storage exactly at quota limit',
        setupQuota: 1.0,
        apiKey: this.generateApiKey(100),
        expectedResult: 'quota_exceeded',
        category: 'total-quota'
      },
      {
        name: 'quota-over-limit-small',
        description: 'Storage just over quota limit with small key',
        setupQuota: 0.99,
        apiKey: this.generateApiKey(2000),
        expectedResult: 'quota_exceeded',
        category: 'total-quota'
      }
    ];
  }
  
  /**
   * Generate Unicode and encoding boundary scenarios
   * 
   * @returns {Array} Unicode boundary scenarios
   */
  getUnicodeBoundaries() {
    return [
      {
        name: 'unicode-ascii-only',
        description: 'API key with ASCII characters only',
        apiKey: this.generateApiKey(1000, 'ascii'),
        expectedResult: 'success',
        category: 'unicode'
      },
      {
        name: 'unicode-multibyte-small',
        description: 'API key with multibyte Unicode characters',
        apiKey: this.API_KEY_PREFIX + '🔑'.repeat(500),
        expectedResult: 'success',
        category: 'unicode'
      },
      {
        name: 'unicode-multibyte-boundary',
        description: 'API key with multibyte chars at boundary',
        apiKey: this.generateUnicodeKeyAtBoundary(this.CHROME_ITEM_LIMIT - 100),
        expectedResult: 'success',
        category: 'unicode'
      },
      {
        name: 'unicode-emoji-mixed',
        description: 'API key with mixed ASCII and emoji',
        apiKey: this.API_KEY_PREFIX + 'abc123🚀def456⭐ghi789🔐',
        expectedResult: 'success',
        category: 'unicode'
      },
      {
        name: 'unicode-special-chars',
        description: 'API key with special Unicode characters',
        apiKey: this.API_KEY_PREFIX + 'ñáéíóú中文한국어العربية',
        expectedResult: 'success',
        category: 'unicode'
      }
    ];
  }
  
  /**
   * Generate key length boundary scenarios
   * 
   * @returns {Array} Key length boundary scenarios
   */
  getKeyLengthBoundaries() {
    return [
      {
        name: 'key-length-minimal',
        description: 'Minimal valid API key length',
        apiKey: this.API_KEY_PREFIX + 'SyA',
        expectedResult: 'success',
        category: 'key-length'
      },
      {
        name: 'key-length-typical',
        description: 'Typical Google API key length (39 chars)',
        apiKey: this.generateRealisticApiKey(),
        expectedResult: 'success',
        category: 'key-length'
      },
      {
        name: 'key-length-long',
        description: 'Unusually long API key',
        apiKey: this.generateApiKey(500),
        expectedResult: 'success',
        category: 'key-length'
      },
      {
        name: 'key-length-empty',
        description: 'Empty API key',
        apiKey: '',
        expectedResult: 'success',
        category: 'key-length'
      }
    ];
  }
  
  /**
   * Generate API key format boundary scenarios
   * 
   * @returns {Array} API key format scenarios
   */
  getApiKeyFormatBoundaries() {
    return [
      {
        name: 'format-valid-google',
        description: 'Valid Google API key format',
        apiKey: this.generateRealisticApiKey(),
        expectedResult: 'success',
        category: 'format'
      },
      {
        name: 'format-invalid-prefix',
        description: 'Invalid API key prefix',
        apiKey: 'INVALID' + this.generateRandomString(34),
        expectedResult: 'success', // Storage doesn't validate format
        category: 'format'
      },
      {
        name: 'format-special-chars',
        description: 'API key with special characters',
        apiKey: this.API_KEY_PREFIX + 'abc-123_def.456/ghi',
        expectedResult: 'success',
        category: 'format'
      },
      {
        name: 'format-whitespace',
        description: 'API key with whitespace',
        apiKey: '  ' + this.generateRealisticApiKey() + '  ',
        expectedResult: 'success',
        category: 'format'
      },
      {
        name: 'format-newlines',
        description: 'API key with newlines',
        apiKey: this.generateRealisticApiKey() + '\n\r\t',
        expectedResult: 'success',
        category: 'format'
      }
    ];
  }
  
  /**
   * Generate edge case scenarios
   * 
   * @returns {Array} Edge case scenarios
   */
  getEdgeCaseScenarios() {
    return [
      {
        name: 'edge-null-key',
        description: 'Null API key value',
        apiKey: null,
        expectedResult: 'success',
        category: 'edge-case'
      },
      {
        name: 'edge-undefined-key',
        description: 'Undefined API key value',
        apiKey: undefined,
        expectedResult: 'success',
        category: 'edge-case'
      },
      {
        name: 'edge-numeric-key',
        description: 'Numeric API key value',
        apiKey: 12345,
        expectedResult: 'success',
        category: 'edge-case'
      },
      {
        name: 'edge-boolean-key',
        description: 'Boolean API key value',
        apiKey: true,
        expectedResult: 'success',
        category: 'edge-case'
      },
      {
        name: 'edge-object-key',
        description: 'Object API key value',
        apiKey: { key: 'value' },
        expectedResult: 'success',
        category: 'edge-case'
      },
      {
        name: 'edge-array-key',
        description: 'Array API key value',
        apiKey: ['key1', 'key2'],
        expectedResult: 'success',
        category: 'edge-case'
      }
    ];
  }
  
  /**
   * Generate an API key of specific byte size
   * 
   * @param {number} targetBytes - Target size in bytes
   * @param {string} charSet - Character set to use ('ascii', 'unicode', 'mixed')
   * @returns {string} Generated API key
   */
  generateApiKey(targetBytes, charSet = 'ascii') {
    const baseKey = this.API_KEY_PREFIX;
    const remainingBytes = targetBytes - this.calculateStorageOverhead(baseKey);
    
    if (remainingBytes <= 0) {
      return baseKey;
    }
    
    let characters;
    switch (charSet) {
      case 'unicode':
        characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789🔑⭐🚀🔐';
        break;
      case 'mixed':
        characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_';
        break;
      default: // ascii
        characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    }
    
    // Generate key iteratively to reach target size
    let key = baseKey;
    let attempts = 0;
    const maxAttempts = 1000;
    
    while (this.calculateActualSize(key) < targetBytes && attempts < maxAttempts) {
      const randomChar = characters.charAt(Math.floor(Math.random() * characters.length));
      key += randomChar;
      attempts++;
    }
    
    // Trim if we went over
    while (this.calculateActualSize(key) > targetBytes && key.length > baseKey.length) {
      key = key.slice(0, -1);
    }
    
    return key;
  }
  
  /**
   * Generate a realistic Google API key
   * 
   * @returns {string} Realistic API key
   */
  generateRealisticApiKey() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_';
    const keyLength = 35; // Typical length after prefix
    let key = this.API_KEY_PREFIX;
    
    for (let i = 0; i < keyLength; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return key;
  }
  
  /**
   * Generate a Unicode key at specific boundary
   * 
   * @param {number} targetBytes - Target size in bytes
   * @returns {string} Unicode API key
   */
  generateUnicodeKeyAtBoundary(targetBytes) {
    if (targetBytes < 10) {
      return this.API_KEY_PREFIX;
    }
    
    // Simplified approach: use mostly ASCII with some Unicode
    const baseKey = this.API_KEY_PREFIX;
    const remainingBytes = Math.max(0, targetBytes - new TextEncoder().encode(baseKey).length - 20); // Leave overhead
    const asciiChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    
    let key = baseKey;
    for (let i = 0; i < remainingBytes && key.length < targetBytes; i++) {
      key += asciiChars[Math.floor(Math.random() * asciiChars.length)];
    }
    
    return key;
  }
  
  /**
   * Generate random string of specified length
   * 
   * @param {number} length - String length
   * @returns {string} Random string
   */
  generateRandomString(length) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
  
  /**
   * Calculate storage overhead for API key
   * 
   * @param {string} key - API key
   * @returns {number} Overhead in bytes
   */
  calculateStorageOverhead(key) {
    const storageKey = 'geminiApiKey';
    const keySize = new TextEncoder().encode(storageKey).length;
    const valueSize = new TextEncoder().encode(key || '').length;
    const jsonOverhead = 20; // Approximate JSON structure overhead
    
    return keySize + valueSize + jsonOverhead;
  }
  
  /**
   * Calculate actual storage size for API key
   * 
   * @param {string} apiKey - API key to measure
   * @returns {number} Size in bytes
   */
  calculateActualSize(apiKey) {
    const storageObject = { geminiApiKey: apiKey };
    return new TextEncoder().encode(JSON.stringify(storageObject)).length;
  }
  
  /**
   * Validate scenario configuration
   * 
   * @param {Object} scenario - Test scenario
   * @returns {boolean} True if valid
   */
  validateScenario(scenario) {
    const requiredFields = ['name', 'description', 'expectedResult', 'category'];
    return requiredFields.every(field => scenario.hasOwnProperty(field));
  }
  
  /**
   * Get scenarios by category
   * 
   * @param {string} category - Category to filter by
   * @returns {Array} Filtered scenarios
   */
  getScenariosByCategory(category) {
    return this.getTestScenarios().filter(scenario => scenario.category === category);
  }
  
  /**
   * Get scenarios that should succeed
   * 
   * @returns {Array} Success scenarios
   */
  getSuccessScenarios() {
    return this.getTestScenarios().filter(scenario => scenario.expectedResult === 'success');
  }
  
  /**
   * Get scenarios that should fail
   * 
   * @returns {Array} Failure scenarios
   */
  getFailureScenarios() {
    return this.getTestScenarios().filter(scenario => scenario.expectedResult !== 'success');
  }
  
  /**
   * Generate test data for concurrent boundary testing
   * 
   * @param {number} operationCount - Number of concurrent operations
   * @returns {Array} Array of operations with boundary conditions
   */
  generateConcurrentBoundaryData(operationCount = 5) {
    const operations = [];
    const scenarios = this.getTestScenarios();
    
    for (let i = 0; i < operationCount; i++) {
      const scenario = scenarios[i % scenarios.length];
      operations.push({
        id: `boundary_op_${i}`,
        scenario: scenario,
        delay: Math.random() * 100, // Random delay 0-100ms
        expectedResult: scenario.expectedResult
      });
    }
    
    return operations;
  }
}

module.exports = BoundaryTestSuite;