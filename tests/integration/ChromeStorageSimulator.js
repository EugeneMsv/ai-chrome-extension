/**
 * Chrome Storage Simulator
 * 
 * Provides accurate simulation of Chrome storage sync with precise quota enforcement.
 * Implements realistic Chrome storage behavior including UTF-8 byte calculations,
 * quota limits, and error conditions.
 * 
 * @class ChromeStorageSimulator
 */
class ChromeStorageSimulator {
  constructor() {
    this.storage = new Map();
    this.ITEM_SIZE_LIMIT = 8192; // 8KB in bytes (Chrome sync storage item limit)
    this.TOTAL_QUOTA_LIMIT = 102400; // 100KB in bytes (Chrome sync storage total limit)
    this.KEY_OVERHEAD_BYTES = 2; // Chrome's internal key storage overhead
    this.VALUE_OVERHEAD_BYTES = 4; // Chrome's internal value storage overhead
    this.isOnline = true;
    this.syncEnabled = true;
    
    // Performance tracking
    this.operationCount = 0;
    this.lastOperationTime = null;
    
    // Bind methods to preserve context
    this.get = this.get.bind(this);
    this.set = this.set.bind(this);
    this.remove = this.remove.bind(this);
    this.clear = this.clear.bind(this);
    this.getBytesInUse = this.getBytesInUse.bind(this);
  }
  
  /**
   * Calculate byte size of a value using UTF-8 encoding
   * Matches Chrome's internal calculation method
   * 
   * @param {any} value - Value to calculate size for
   * @returns {number} Size in bytes
   */
  calculateByteSize(value) {
    try {
      const jsonString = JSON.stringify(value);
      return new TextEncoder().encode(jsonString).length;
    } catch (error) {
      throw new Error('INVALID_VALUE: Value cannot be serialized to JSON');
    }
  }
  
  /**
   * Calculate storage overhead for a key-value pair
   * Includes Chrome's internal storage overhead
   * 
   * @param {string} key - Storage key
   * @param {any} value - Storage value
   * @returns {number} Total overhead in bytes
   */
  calculateStorageOverhead(key, value) {
    const keySize = new TextEncoder().encode(key).length;
    const valueSize = this.calculateByteSize(value);
    return keySize + valueSize + this.KEY_OVERHEAD_BYTES + this.VALUE_OVERHEAD_BYTES;
  }
  
  /**
   * Validate individual item size against Chrome limits
   * 
   * @param {string} key - Storage key
   * @param {any} value - Storage value
   * @throws {Error} If item exceeds size limit
   */
  validateItemSize(key, value) {
    const totalSize = this.calculateStorageOverhead(key, value);
    if (totalSize > this.ITEM_SIZE_LIMIT) {
      const error = new Error(`QUOTA_EXCEEDED: Item size ${totalSize} bytes exceeds Chrome storage sync item limit of ${this.ITEM_SIZE_LIMIT} bytes`);
      throw error;
    }
  }
  
  /**
   * Validate total storage quota
   * 
   * @param {string} key - Storage key being added/updated
   * @param {any} value - Storage value
   * @throws {Error} If total storage exceeds quota
   */
  validateTotalQuota(key, value) {
    const newItemSize = this.calculateStorageOverhead(key, value);
    const currentItemSize = this.storage.has(key) 
      ? this.calculateStorageOverhead(key, this.storage.get(key))
      : 0;
    const currentTotal = this.getTotalStorageSize();
    const newTotal = currentTotal - currentItemSize + newItemSize;
    
    if (newTotal > this.TOTAL_QUOTA_LIMIT) {
      const error = new Error(`QUOTA_EXCEEDED: Total storage ${newTotal} bytes would exceed Chrome storage sync quota of ${this.TOTAL_QUOTA_LIMIT} bytes`);
      throw error;
    }
  }
  
  /**
   * Get current total storage size
   * 
   * @returns {number} Total storage size in bytes
   */
  getTotalStorageSize() {
    let total = 0;
    for (const [key, value] of this.storage) {
      total += this.calculateStorageOverhead(key, value);
    }
    return total;
  }
  
  /**
   * Simulate network and permission checks
   * 
   * @throws {Error} If offline or permissions denied
   */
  validateOperationPermissions() {
    if (!this.isOnline) {
      const error = new Error('NETWORK_ERROR');
      error.message = 'Chrome storage sync is offline';
      throw error;
    }
    
    if (!this.syncEnabled) {
      const error = new Error('PERMISSION_DENIED');
      error.message = 'Chrome storage sync is disabled';
      throw error;
    }
  }
  
  /**
   * Track operation performance
   */
  trackOperation() {
    this.operationCount++;
    this.lastOperationTime = Date.now();
  }
  
  /**
   * Get items from storage (Chrome storage.sync.get simulation)
   * 
   * @param {string|Array|Object|null} keys - Keys to retrieve
   * @param {Function} callback - Callback function
   */
  get(keys, callback) {
    if (typeof keys === 'function') {
      callback = keys;
      keys = null;
    }
    
    // Simulate async behavior
    setTimeout(() => {
      try {
        this.validateOperationPermissions();
        this.trackOperation();
        
        let result = {};
        
        if (keys === null || keys === undefined) {
          // Get all items
          for (const [key, value] of this.storage) {
            result[key] = JSON.parse(JSON.stringify(value)); // Deep clone
          }
        } else if (Array.isArray(keys)) {
          // Get specific keys
          keys.forEach(key => {
            if (this.storage.has(key)) {
              result[key] = JSON.parse(JSON.stringify(this.storage.get(key)));
            }
          });
        } else if (typeof keys === 'string') {
          // Get single key
          if (this.storage.has(keys)) {
            result[keys] = JSON.parse(JSON.stringify(this.storage.get(keys)));
          }
        } else if (typeof keys === 'object') {
          // Get keys with defaults
          Object.keys(keys).forEach(key => {
            result[key] = this.storage.has(key) 
              ? JSON.parse(JSON.stringify(this.storage.get(key)))
              : keys[key];
          });
        }
        
        global.chrome.runtime.lastError = null;
        callback(result);
      } catch (error) {
        global.chrome.runtime.lastError = { message: error.message };
        callback({});
      }
    }, 5); // Realistic Chrome storage latency (5ms)
  }
  
  /**
   * Set items in storage (Chrome storage.sync.set simulation)
   * 
   * @param {Object} items - Items to store
   * @param {Function} callback - Callback function
   */
  set(items, callback) {
    setTimeout(() => {
      try {
        this.validateOperationPermissions();
        
        // Validate all items before storing any
        for (const [key, value] of Object.entries(items)) {
          this.validateItemSize(key, value);
          this.validateTotalQuota(key, value);
        }
        
        // Store all items
        for (const [key, value] of Object.entries(items)) {
          this.storage.set(key, JSON.parse(JSON.stringify(value))); // Deep clone
        }
        
        this.trackOperation();
        global.chrome.runtime.lastError = null;
        
        if (callback) callback();
      } catch (error) {
        global.chrome.runtime.lastError = { message: error.message };
        if (callback) callback();
      }
    }, 5); // Realistic Chrome storage latency (5ms)
  }
  
  /**
   * Remove items from storage
   * 
   * @param {string|Array} keys - Keys to remove
   * @param {Function} callback - Callback function
   */
  remove(keys, callback) {
    setTimeout(() => {
      try {
        this.validateOperationPermissions();
        
        const keysArray = Array.isArray(keys) ? keys : [keys];
        keysArray.forEach(key => this.storage.delete(key));
        
        this.trackOperation();
        global.chrome.runtime.lastError = null;
        
        if (callback) callback();
      } catch (error) {
        global.chrome.runtime.lastError = { message: error.message };
        if (callback) callback();
      }
    }, 5); // Realistic Chrome storage latency (5ms)
  }
  
  /**
   * Clear all storage
   * 
   * @param {Function} callback - Callback function
   */
  clear(callback) {
    setTimeout(() => {
      try {
        this.validateOperationPermissions();
        
        this.storage.clear();
        this.trackOperation();
        global.chrome.runtime.lastError = null;
        
        if (callback) callback();
      } catch (error) {
        global.chrome.runtime.lastError = { message: error.message };
        if (callback) callback();
      }
    }, 5); // Realistic Chrome storage latency (5ms)
  }
  
  /**
   * Get bytes in use for specific keys
   * 
   * @param {string|Array|null} keys - Keys to check
   * @param {Function} callback - Callback function
   */
  getBytesInUse(keys, callback) {
    if (typeof keys === 'function') {
      callback = keys;
      keys = null;
    }
    
    setTimeout(() => {
      try {
        this.validateOperationPermissions();
        
        let totalBytes = 0;
        
        if (keys === null) {
          totalBytes = this.getTotalStorageSize();
        } else {
          const keysArray = Array.isArray(keys) ? keys : [keys];
          keysArray.forEach(key => {
            if (this.storage.has(key)) {
              totalBytes += this.calculateStorageOverhead(key, this.storage.get(key));
            }
          });
        }
        
        this.trackOperation();
        global.chrome.runtime.lastError = null;
        
        callback(totalBytes);
      } catch (error) {
        global.chrome.runtime.lastError = { message: error.message };
        callback(0);
      }
    }, 5); // Realistic Chrome storage latency (5ms)
  }
  
  /**
   * Install this simulator as the Chrome storage sync mock
   */
  install() {
    if (global.chrome && global.chrome.storage && global.chrome.storage.sync) {
      global.chrome.storage.sync.get = this.get;
      global.chrome.storage.sync.set = this.set;
      global.chrome.storage.sync.remove = this.remove;
      global.chrome.storage.sync.clear = this.clear;
      global.chrome.storage.sync.getBytesInUse = this.getBytesInUse;
    }
  }
  
  /**
   * Reset simulator to clean state
   */
  reset() {
    this.storage.clear();
    this.operationCount = 0;
    this.lastOperationTime = null;
    this.isOnline = true;
    this.syncEnabled = true;
    global.chrome.runtime.lastError = null;
  }
  
  /**
   * Set simulator state for testing
   * 
   * @param {Object} options - State options
   */
  setState(options = {}) {
    if (options.storage) {
      this.storage.clear();
      Object.entries(options.storage).forEach(([key, value]) => {
        this.storage.set(key, value);
      });
    }
    
    if (options.isOnline !== undefined) {
      this.isOnline = options.isOnline;
    }
    
    if (options.syncEnabled !== undefined) {
      this.syncEnabled = options.syncEnabled;
    }
    
    if (options.errors && options.errors.length > 0) {
      global.chrome.runtime.lastError = { message: options.errors[0] };
    }
  }
  
  /**
   * Get performance metrics
   * 
   * @returns {Object} Performance metrics
   */
  getPerformanceMetrics() {
    return {
      operationCount: this.operationCount,
      lastOperationTime: this.lastOperationTime,
      totalStorageSize: this.getTotalStorageSize(),
      itemCount: this.storage.size,
      quotaUsagePercent: (this.getTotalStorageSize() / this.TOTAL_QUOTA_LIMIT) * 100
    };
  }
}

module.exports = ChromeStorageSimulator;