/**
 * State Builders
 * 
 * Composition-based state builders for setting up different test scenarios.
 * Each builder creates specific system states for testing various conditions.
 */

/**
 * Clean State Builder
 * 
 * Creates a fresh, clean extension state for testing normal operations.
 * 
 * @class CleanStateBuilder
 */
class CleanStateBuilder {
  constructor() {
    this.state = {
      storage: {},
      errors: [],
      networkOnline: true,
      permissionsGranted: true,
      syncEnabled: true
    };
  }
  
  /**
   * Set initial storage data
   * 
   * @param {Object} storageData - Initial storage state
   * @returns {CleanStateBuilder} Builder instance for chaining
   */
  withStorage(storageData) {
    this.state.storage = { ...storageData };
    return this;
  }
  
  /**
   * Add an API key to the clean state
   * 
   * @param {string} apiKey - API key to include
   * @returns {CleanStateBuilder} Builder instance for chaining
   */
  withApiKey(apiKey) {
    this.state.storage.geminiApiKey = apiKey;
    return this;
  }
  
  /**
   * Build the clean state
   * 
   * @returns {Object} Clean state configuration
   */
  build() {
    return {
      storage: { ...this.state.storage },
      errors: [...this.state.errors],
      networkOnline: this.state.networkOnline,
      permissionsGranted: this.state.permissionsGranted,
      syncEnabled: this.state.syncEnabled,
      isOnline: this.state.networkOnline
    };
  }
}

/**
 * Quota State Builder
 * 
 * Creates storage states that are near or at quota limits for testing
 * quota-related scenarios and boundary conditions.
 * 
 * @class QuotaStateBuilder
 */
class QuotaStateBuilder {
  constructor() {
    this.quotaUsagePercentage = 90; // Default to 90% quota usage
    this.itemCount = 10; // Default number of items to create
    this.state = {
      storage: {},
      errors: [],
      networkOnline: true,
      permissionsGranted: true,
      syncEnabled: true
    };
  }
  
  /**
   * Set quota usage percentage
   * 
   * @param {number} percentage - Percentage of quota to use (0-100)
   * @returns {QuotaStateBuilder} Builder instance for chaining
   */
  withQuotaUsage(percentage) {
    this.quotaUsagePercentage = Math.max(0, Math.min(100, percentage));
    return this;
  }
  
  /**
   * Set number of items to generate
   * 
   * @param {number} count - Number of storage items
   * @returns {QuotaStateBuilder} Builder instance for chaining
   */
  withItemCount(count) {
    this.itemCount = Math.max(1, count);
    return this;
  }
  
  /**
   * Create storage at specific quota usage (simplified)
   * 
   * @param {number} targetBytes - Target storage size in bytes
   * @returns {Object} Storage object with specified size
   */
  createStorageAtSize(targetBytes) {
    const storage = {};
    const TOTAL_QUOTA_LIMIT = 102400; // 100KB Chrome sync storage limit
    const actualTarget = Math.min(targetBytes, TOTAL_QUOTA_LIMIT);
    
    // Simplified approach: create fewer, predictable items
    const itemSize = Math.floor(actualTarget / 3); // Create 3 items
    const filler = 'x'.repeat(Math.max(1, itemSize - 20)); // Leave room for JSON overhead
    
    storage['item1'] = filler;
    storage['item2'] = filler;
    storage['item3'] = filler.substring(0, Math.max(1, filler.length / 2)); // Smaller third item
    
    return storage;
  }
  
  /**
   * Generate a string value of approximately the specified size
   * 
   * @param {number} targetSize - Target size in bytes
   * @returns {string} Generated value
   */
  generateValueOfSize(targetSize) {
    const baseString = 'quota_test_data_';
    const repeatCount = Math.max(1, Math.floor(targetSize / baseString.length));
    return baseString.repeat(repeatCount);
  }
  
  /**
   * Build quota state with near-full storage
   * 
   * @returns {Object} Quota state configuration
   */
  build() {
    const TOTAL_QUOTA_LIMIT = 102400; // 100KB
    const targetSize = Math.floor(TOTAL_QUOTA_LIMIT * this.quotaUsagePercentage / 100);
    
    return {
      storage: this.createStorageAtSize(targetSize),
      errors: [...this.state.errors],
      networkOnline: this.state.networkOnline,
      permissionsGranted: this.state.permissionsGranted,
      syncEnabled: this.state.syncEnabled,
      isOnline: this.state.networkOnline,
      quotaUsagePercentage: this.quotaUsagePercentage
    };
  }
}

/**
 * Error State Builder
 * 
 * Creates states with various error conditions for testing
 * error handling and recovery scenarios.
 * 
 * @class ErrorStateBuilder
 */
class ErrorStateBuilder {
  constructor() {
    this.errorType = null;
    this.corruptionType = null;
    this.state = {
      storage: {},
      errors: [],
      networkOnline: true,
      permissionsGranted: true,
      syncEnabled: true
    };
  }
  
  /**
   * Set network offline state
   * 
   * @returns {ErrorStateBuilder} Builder instance for chaining
   */
  withNetworkOffline() {
    this.errorType = 'NETWORK_OFFLINE';
    this.state.networkOnline = false;
    this.state.errors.push('Chrome storage sync is offline');
    return this;
  }
  
  /**
   * Set permission denied state
   * 
   * @returns {ErrorStateBuilder} Builder instance for chaining
   */
  withPermissionDenied() {
    this.errorType = 'PERMISSION_DENIED';
    this.state.permissionsGranted = false;
    this.state.syncEnabled = false;
    this.state.errors.push('Chrome storage sync permissions denied');
    return this;
  }
  
  /**
   * Set permissions denied state (alias)
   * 
   * @returns {ErrorStateBuilder} Builder instance for chaining
   */
  withPermissionsDenied() {
    return this.withPermissionDenied();
  }
  
  /**
   * Set sync disabled state
   * 
   * @returns {ErrorStateBuilder} Builder instance for chaining
   */
  withSyncDisabled() {
    this.errorType = 'SYNC_DISABLED';
    this.state.syncEnabled = false;
    this.state.errors.push('Chrome storage sync is disabled');
    return this;
  }
  
  /**
   * Set corrupted storage state
   * 
   * @returns {ErrorStateBuilder} Builder instance for chaining
   */
  withCorruptedStorage() {
    this.corruptionType = 'MALFORMED_JSON';
    this.state.storage = this.createCorruptedStorage();
    this.state.errors.push('Storage contains corrupted data');
    return this;
  }
  
  /**
   * Set quota exceeded state
   * 
   * @returns {ErrorStateBuilder} Builder instance for chaining
   */
  withQuotaExceeded() {
    this.errorType = 'QUOTA_EXCEEDED';
    this.state.storage = new QuotaStateBuilder()
      .withQuotaUsage(100)
      .createStorageAtSize(102400); // Full quota
    this.state.errors.push('Chrome storage quota exceeded');
    return this;
  }
  
  /**
   * Add a custom error
   * 
   * @param {string} errorMessage - Custom error message
   * @returns {ErrorStateBuilder} Builder instance for chaining
   */
  withCustomError(errorMessage) {
    this.state.errors.push(errorMessage);
    return this;
  }
  
  /**
   * Create corrupted storage data
   * 
   * @returns {Object} Storage with corruption scenarios
   */
  createCorruptedStorage() {
    return {
      // Valid key
      validKey: 'valid_value',
      
      // Key with circular reference (simulated)
      circularRef: '[Circular Reference]',
      
      // Extremely long key that might cause issues
      [`${'x'.repeat(500)}`]: 'long_key_value',
      
      // Value that simulates JSON parsing issues
      malformedJson: '{"unclosed": "object"',
      
      // Empty or null values that might cause issues
      emptyValue: '',
      nullValue: null,
      undefinedValue: undefined
    };
  }
  
  /**
   * Build error state
   * 
   * @returns {Object} Error state configuration
   */
  build() {
    return {
      storage: { ...this.state.storage },
      errors: [...this.state.errors],
      networkOnline: this.state.networkOnline,
      permissionsGranted: this.state.permissionsGranted,
      syncEnabled: this.state.syncEnabled,
      isOnline: this.state.networkOnline,
      errorType: this.errorType,
      corruptionType: this.corruptionType
    };
  }
}

/**
 * Concurrent State Builder
 * 
 * Creates states for testing concurrent operations and race conditions.
 * 
 * @class ConcurrentStateBuilder
 */
class ConcurrentStateBuilder {
  constructor() {
    this.operationCount = 3;
    this.operationType = 'mixed'; // 'save', 'get', 'mixed'
    this.delayRange = [0, 50]; // Delay range in milliseconds
    this.state = {
      storage: {},
      errors: [],
      networkOnline: true,
      permissionsGranted: true,
      syncEnabled: true
    };
  }
  
  /**
   * Set number of concurrent operations
   * 
   * @param {number} count - Number of operations
   * @returns {ConcurrentStateBuilder} Builder instance for chaining
   */
  withOperationCount(count) {
    this.operationCount = Math.max(1, count);
    return this;
  }
  
  /**
   * Set operation type
   * 
   * @param {string} type - 'save', 'get', or 'mixed'
   * @returns {ConcurrentStateBuilder} Builder instance for chaining
   */
  withOperationType(type) {
    this.operationType = type;
    return this;
  }
  
  /**
   * Set delay range for operations
   * 
   * @param {number} min - Minimum delay in milliseconds
   * @param {number} max - Maximum delay in milliseconds
   * @returns {ConcurrentStateBuilder} Builder instance for chaining
   */
  withDelayRange(min, max) {
    this.delayRange = [min, max];
    return this;
  }
  
  /**
   * Generate operations for concurrent testing
   * 
   * @returns {Array} Array of operation functions
   */
  generateOperations() {
    const operations = [];
    
    for (let i = 0; i < this.operationCount; i++) {
      const delay = Math.random() * (this.delayRange[1] - this.delayRange[0]) + this.delayRange[0];
      
      if (this.operationType === 'save' || (this.operationType === 'mixed' && Math.random() > 0.5)) {
        // Save operation
        operations.push({
          type: 'save',
          delay: delay,
          data: { [`concurrent_key_${i}`]: `value_${i}_${Date.now()}` }
        });
      } else {
        // Get operation
        operations.push({
          type: 'get',
          delay: delay,
          key: 'geminiApiKey'
        });
      }
    }
    
    return operations;
  }
  
  /**
   * Build concurrent state
   * 
   * @returns {Object} Concurrent state configuration
   */
  build() {
    return {
      storage: { ...this.state.storage },
      errors: [...this.state.errors],
      networkOnline: this.state.networkOnline,
      permissionsGranted: this.state.permissionsGranted,
      syncEnabled: this.state.syncEnabled,
      isOnline: this.state.networkOnline,
      operations: this.generateOperations(),
      operationCount: this.operationCount,
      operationType: this.operationType
    };
  }
}

module.exports = {
  CleanStateBuilder,
  QuotaStateBuilder,
  ErrorStateBuilder,
  ConcurrentStateBuilder
};