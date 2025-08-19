/**
 * Concurrency Test Suite
 * 
 * Tests concurrent operations on Chrome extension API key storage
 * to detect race conditions, data corruption, and consistency issues.
 * 
 * @class ConcurrencyTestSuite
 */
class ConcurrencyTestSuite {
  constructor(messageHelper, storageSimulator) {
    this.messageHelper = messageHelper;
    this.storageSimulator = storageSimulator;
    this.operationId = 0;
    this.operationResults = new Map();
    this.raceConditionDetector = new RaceConditionDetector();
    
    // Configuration
    this.defaultConcurrency = 5;
    this.defaultTimeout = 2000;
    this.maxOperationDelay = 100;
  }
  
  /**
   * Test simultaneous save operations
   * Verifies that multiple concurrent saves don't corrupt data
   * 
   * @param {number} operationCount - Number of concurrent operations
   * @returns {Promise<Object>} Test results
   */
  async testSimultaneousSaveOperations(operationCount = this.defaultConcurrency) {
    const testId = `save_concurrent_${Date.now()}`;
    const operations = [];
    const startTime = Date.now();
    
    // Create multiple save operations with different API keys
    for (let i = 0; i < operationCount; i++) {
      const apiKey = `test_key_${testId}_${i}_${Date.now()}`;
      const operation = this.createSaveOperation(apiKey, i);
      operations.push(operation);
    }
    
    // Execute all operations concurrently
    const results = await Promise.allSettled(operations);
    const endTime = Date.now();
    
    // Verify results
    const analysis = this.analyzeConcurrentResults(results, startTime, endTime);
    
    // Check final storage state
    const finalState = await this.getFinalStorageState();
    
    // Detect race conditions
    const raceConditions = this.raceConditionDetector.analyzeOperations(
      this.operationResults,
      'save'
    );
    
    return {
      testType: 'simultaneous_save',
      operationCount,
      duration: endTime - startTime,
      results: analysis,
      finalState,
      raceConditions,
      dataConsistency: this.verifyDataConsistency(finalState),
      lastWriteWins: this.verifyLastWriteWins(results, finalState)
    };
  }
  
  /**
   * Test mixed concurrent operations (save and get)
   * 
   * @param {number} operationCount - Total number of operations
   * @returns {Promise<Object>} Test results
   */
  async testMixedOperations(operationCount = this.defaultConcurrency) {
    const testId = `mixed_concurrent_${Date.now()}`;
    const operations = [];
    const startTime = Date.now();
    
    // Create mixed save and get operations
    for (let i = 0; i < operationCount; i++) {
      if (i % 2 === 0) {
        // Save operation
        const apiKey = `mixed_key_${testId}_${i}`;
        operations.push(this.createSaveOperation(apiKey, i));
      } else {
        // Get operation
        operations.push(this.createGetOperation(i));
      }
    }
    
    // Execute all operations concurrently
    const results = await Promise.allSettled(operations);
    const endTime = Date.now();
    
    // Analyze results
    const analysis = this.analyzeConcurrentResults(results, startTime, endTime);
    const raceConditions = this.raceConditionDetector.analyzeOperations(
      this.operationResults,
      'mixed'
    );
    
    return {
      testType: 'mixed_operations',
      operationCount,
      duration: endTime - startTime,
      results: analysis,
      raceConditions,
      readWriteConsistency: this.verifyReadWriteConsistency(results)
    };
  }
  
  /**
   * Test rapid successive operations
   * Tests operations with minimal delays to stress test the system
   * 
   * @param {number} operationCount - Number of operations
   * @returns {Promise<Object>} Test results
   */
  async testRapidSuccessiveOperations(operationCount = 10) {
    const testId = `rapid_${Date.now()}`;
    const results = [];
    const timings = [];
    const startTime = Date.now();
    
    // Execute operations in rapid succession
    for (let i = 0; i < operationCount; i++) {
      const operationStart = performance.now();
      const apiKey = `rapid_key_${testId}_${i}`;
      
      try {
        const result = await this.messageHelper.sendMessage({
          action: 'saveApiKey',
          apiKey: apiKey
        });
        
        const operationEnd = performance.now();
        timings.push(operationEnd - operationStart);
        results.push({ success: true, result, apiKey, index: i });
      } catch (error) {
        const operationEnd = performance.now();
        timings.push(operationEnd - operationStart);
        results.push({ success: false, error: error.message, apiKey, index: i });
      }
    }
    
    const endTime = Date.now();
    const finalState = await this.getFinalStorageState();
    
    return {
      testType: 'rapid_successive',
      operationCount,
      duration: endTime - startTime,
      results,
      timings,
      averageOperationTime: timings.reduce((a, b) => a + b, 0) / timings.length,
      finalState,
      operationConsistency: this.verifyOperationSequence(results, finalState)
    };
  }
  
  /**
   * Test quota contention scenarios
   * Multiple operations competing for quota space
   * 
   * @param {number} operationCount - Number of operations
   * @returns {Promise<Object>} Test results
   */
  async testQuotaContention(operationCount = 8) {
    const testId = `quota_${Date.now()}`;
    
    // Set up near-quota state
    const quotaBuilder = require('./StateBuilders').QuotaStateBuilder;
    const quotaState = new quotaBuilder()
      .withQuotaUsage(85) // 85% quota usage
      .build();
    
    this.storageSimulator.setState(quotaState);
    
    const operations = [];
    const startTime = Date.now();
    
    // Create operations that will compete for remaining quota
    for (let i = 0; i < operationCount; i++) {
      const largeApiKey = `quota_test_${testId}_${'x'.repeat(1000)}_${i}`;
      operations.push(this.createSaveOperation(largeApiKey, i));
    }
    
    const results = await Promise.allSettled(operations);
    const endTime = Date.now();
    
    const analysis = this.analyzeConcurrentResults(results, startTime, endTime);
    const quotaHandling = this.analyzeQuotaHandling(results);
    
    return {
      testType: 'quota_contention',
      operationCount,
      duration: endTime - startTime,
      results: analysis,
      quotaHandling,
      consistentErrorHandling: this.verifyConsistentErrorHandling(results)
    };
  }
  
  /**
   * Create a save operation with timing tracking
   * 
   * @param {string} apiKey - API key to save
   * @param {number} index - Operation index
   * @returns {Promise} Save operation promise
   */
  createSaveOperation(apiKey, index) {
    const operationId = ++this.operationId;
    const startTime = performance.now();
    
    const operation = this.messageHelper.sendMessage({
      action: 'saveApiKey',
      apiKey: apiKey
    }).then(result => {
      const endTime = performance.now();
      this.operationResults.set(operationId, {
        type: 'save',
        apiKey,
        index,
        startTime,
        endTime,
        duration: endTime - startTime,
        success: true,
        result
      });
      return { operationId, success: true, result, apiKey, index };
    }).catch(error => {
      const endTime = performance.now();
      this.operationResults.set(operationId, {
        type: 'save',
        apiKey,
        index,
        startTime,
        endTime,
        duration: endTime - startTime,
        success: false,
        error: error.message
      });
      return { operationId, success: false, error: error.message, apiKey, index };
    });
    
    return operation;
  }
  
  /**
   * Create a get operation with timing tracking
   * 
   * @param {number} index - Operation index
   * @returns {Promise} Get operation promise
   */
  createGetOperation(index) {
    const operationId = ++this.operationId;
    const startTime = performance.now();
    
    const operation = this.messageHelper.sendMessage({
      action: 'getApiKey'
    }).then(result => {
      const endTime = performance.now();
      this.operationResults.set(operationId, {
        type: 'get',
        index,
        startTime,
        endTime,
        duration: endTime - startTime,
        success: true,
        result
      });
      return { operationId, success: true, result, index };
    }).catch(error => {
      const endTime = performance.now();
      this.operationResults.set(operationId, {
        type: 'get',
        index,
        startTime,
        endTime,
        duration: endTime - startTime,
        success: false,
        error: error.message
      });
      return { operationId, success: false, error: error.message, index };
    });
    
    return operation;
  }
  
  /**
   * Analyze concurrent operation results
   * 
   * @param {Array} results - Promise.allSettled results
   * @param {number} startTime - Test start time
   * @param {number} endTime - Test end time
   * @returns {Object} Analysis results
   */
  analyzeConcurrentResults(results, startTime, endTime) {
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success);
    const failed = results.filter(r => r.status === 'rejected' || !r.value.success);
    
    return {
      total: results.length,
      successful: successful.length,
      failed: failed.length,
      successRate: (successful.length / results.length) * 100,
      totalDuration: endTime - startTime,
      errors: failed.map(f => f.reason?.message || f.value?.error || 'Unknown error')
    };
  }
  
  /**
   * Get final storage state after operations
   * 
   * @returns {Promise<Object>} Storage state
   */
  async getFinalStorageState() {
    return new Promise((resolve) => {
      this.storageSimulator.get(null, (result) => {
        resolve(result);
      });
    });
  }
  
  /**
   * Verify data consistency after concurrent operations
   * 
   * @param {Object} finalState - Final storage state
   * @returns {Object} Consistency verification results
   */
  verifyDataConsistency(finalState) {
    return {
      hasApiKey: finalState.hasOwnProperty('geminiApiKey'),
      apiKeyType: typeof finalState.geminiApiKey,
      isValidString: typeof finalState.geminiApiKey === 'string',
      isEmpty: finalState.geminiApiKey === '',
      length: finalState.geminiApiKey ? finalState.geminiApiKey.length : 0
    };
  }
  
  /**
   * Verify last write wins behavior
   * 
   * @param {Array} results - Operation results
   * @param {Object} finalState - Final storage state
   * @returns {Object} Last write wins verification
   */
  verifyLastWriteWins(results, finalState) {
    const saveOperations = results
      .filter(r => r.status === 'fulfilled' && r.value.success && r.value.apiKey)
      .map(r => r.value);
    
    if (saveOperations.length === 0) {
      return { verified: false, reason: 'No successful save operations' };
    }
    
    // Find the operation that should have won (last to complete)
    const lastOperation = saveOperations.reduce((latest, current) => {
      const latestOp = this.operationResults.get(latest.operationId);
      const currentOp = this.operationResults.get(current.operationId);
      return currentOp.endTime > latestOp.endTime ? current : latest;
    });
    
    return {
      verified: finalState.geminiApiKey === lastOperation.apiKey,
      expectedKey: lastOperation.apiKey,
      actualKey: finalState.geminiApiKey,
      lastOperationId: lastOperation.operationId
    };
  }
  
  /**
   * Verify read-write consistency
   * 
   * @param {Array} results - Mixed operation results
   * @returns {Object} Consistency verification
   */
  verifyReadWriteConsistency(results) {
    const reads = results.filter(r => 
      r.status === 'fulfilled' && 
      this.operationResults.get(r.value.operationId)?.type === 'get'
    );
    
    const writes = results.filter(r => 
      r.status === 'fulfilled' && 
      this.operationResults.get(r.value.operationId)?.type === 'save'
    );
    
    return {
      totalReads: reads.length,
      totalWrites: writes.length,
      consistentReads: reads.filter(r => typeof r.value.result === 'string').length,
      allReadsSuccessful: reads.every(r => r.value.success)
    };
  }
  
  /**
   * Verify operation sequence consistency
   * 
   * @param {Array} results - Sequential operation results
   * @param {Object} finalState - Final storage state
   * @returns {Object} Sequence verification
   */
  verifyOperationSequence(results, finalState) {
    const lastSuccessfulOperation = results
      .filter(r => r.success)
      .pop();
    
    return {
      allOperationsSuccessful: results.every(r => r.success),
      finalStateMatches: lastSuccessfulOperation && 
        finalState.geminiApiKey === lastSuccessfulOperation.apiKey,
      sequenceIntegrity: this.checkSequenceIntegrity(results)
    };
  }
  
  /**
   * Check sequence integrity
   * 
   * @param {Array} results - Operation results
   * @returns {boolean} True if sequence is valid
   */
  checkSequenceIntegrity(results) {
    // Verify that operations completed in order or with acceptable concurrency
    for (let i = 1; i < results.length; i++) {
      const current = results[i];
      const previous = results[i - 1];
      
      // Check if index sequence is maintained
      if (current.index !== previous.index + 1) {
        return false;
      }
    }
    return true;
  }
  
  /**
   * Analyze quota handling in concurrent scenarios
   * 
   * @param {Array} results - Operation results
   * @returns {Object} Quota handling analysis
   */
  analyzeQuotaHandling(results) {
    const quotaErrors = results.filter(r => 
      (r.status === 'rejected' && r.reason?.message?.includes('QUOTA_EXCEEDED')) ||
      (r.value && !r.value.success && r.value.error?.includes('QUOTA_EXCEEDED'))
    );
    
    return {
      quotaErrorCount: quotaErrors.length,
      hasQuotaErrors: quotaErrors.length > 0,
      consistentErrorMessage: this.checkConsistentErrorMessages(quotaErrors),
      properErrorHandling: quotaErrors.length > 0 && quotaErrors.length < results.length
    };
  }
  
  /**
   * Verify consistent error handling
   * 
   * @param {Array} results - Operation results
   * @returns {Object} Error handling verification
   */
  verifyConsistentErrorHandling(results) {
    const errors = results.filter(r => 
      r.status === 'rejected' || !r.value?.success
    );
    
    if (errors.length === 0) {
      return { consistent: true, reason: 'No errors to verify' };
    }
    
    return {
      consistent: this.checkConsistentErrorMessages(errors),
      errorCount: errors.length,
      errorTypes: this.categorizeErrors(errors)
    };
  }
  
  /**
   * Check if error messages are consistent
   * 
   * @param {Array} errors - Error results
   * @returns {boolean} True if consistent
   */
  checkConsistentErrorMessages(errors) {
    if (errors.length <= 1) return true;
    
    const firstError = errors[0].reason?.message || errors[0].value?.error;
    return errors.every(error => {
      const errorMessage = error.reason?.message || error.value?.error;
      return errorMessage === firstError;
    });
  }
  
  /**
   * Categorize different types of errors
   * 
   * @param {Array} errors - Error results
   * @returns {Object} Error categorization
   */
  categorizeErrors(errors) {
    const categories = {
      quota: 0,
      timeout: 0,
      network: 0,
      permission: 0,
      unknown: 0
    };
    
    errors.forEach(error => {
      const message = error.reason?.message || error.value?.error || '';
      
      if (message.includes('QUOTA_EXCEEDED')) {
        categories.quota++;
      } else if (message.includes('timeout') || message.includes('TIMEOUT')) {
        categories.timeout++;
      } else if (message.includes('NETWORK')) {
        categories.network++;
      } else if (message.includes('PERMISSION')) {
        categories.permission++;
      } else {
        categories.unknown++;
      }
    });
    
    return categories;
  }
  
  /**
   * Reset suite state for fresh testing
   */
  reset() {
    this.operationId = 0;
    this.operationResults.clear();
    this.raceConditionDetector.reset();
  }
  
  /**
   * Get performance metrics from completed tests
   * 
   * @returns {Object} Performance metrics
   */
  getPerformanceMetrics() {
    const operations = Array.from(this.operationResults.values());
    
    if (operations.length === 0) {
      return { noData: true };
    }
    
    const durations = operations.map(op => op.duration);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    
    return {
      totalOperations: operations.length,
      averageDuration: avgDuration,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      successRate: (operations.filter(op => op.success).length / operations.length) * 100
    };
  }
}

/**
 * Race Condition Detector
 * 
 * Analyzes operation timing to detect potential race conditions
 */
class RaceConditionDetector {
  constructor() {
    this.overlappingOperations = [];
    this.suspiciousTimings = [];
  }
  
  /**
   * Analyze operations for race conditions
   * 
   * @param {Map} operations - Map of operation results
   * @param {string} testType - Type of test being analyzed
   * @returns {Object} Race condition analysis
   */
  analyzeOperations(operations, testType) {
    const ops = Array.from(operations.values());
    
    this.detectOverlappingOperations(ops);
    this.detectSuspiciousTimings(ops);
    
    return {
      testType,
      overlappingOperations: this.overlappingOperations.length,
      suspiciousTimings: this.suspiciousTimings.length,
      raceConditionLikelihood: this.calculateRaceConditionLikelihood(ops),
      details: {
        overlapping: this.overlappingOperations,
        suspicious: this.suspiciousTimings
      }
    };
  }
  
  /**
   * Detect overlapping operations
   * 
   * @param {Array} operations - Operation list
   */
  detectOverlappingOperations(operations) {
    this.overlappingOperations = [];
    
    for (let i = 0; i < operations.length; i++) {
      for (let j = i + 1; j < operations.length; j++) {
        const op1 = operations[i];
        const op2 = operations[j];
        
        // Check for time overlap
        if (this.isTimeOverlapping(op1, op2)) {
          this.overlappingOperations.push({
            operation1: { type: op1.type, startTime: op1.startTime, endTime: op1.endTime },
            operation2: { type: op2.type, startTime: op2.startTime, endTime: op2.endTime },
            overlapDuration: this.calculateOverlap(op1, op2)
          });
        }
      }
    }
  }
  
  /**
   * Check if two operations overlap in time
   * 
   * @param {Object} op1 - First operation
   * @param {Object} op2 - Second operation
   * @returns {boolean} True if overlapping
   */
  isTimeOverlapping(op1, op2) {
    return op1.startTime < op2.endTime && op2.startTime < op1.endTime;
  }
  
  /**
   * Calculate overlap duration
   * 
   * @param {Object} op1 - First operation
   * @param {Object} op2 - Second operation
   * @returns {number} Overlap duration in milliseconds
   */
  calculateOverlap(op1, op2) {
    const start = Math.max(op1.startTime, op2.startTime);
    const end = Math.min(op1.endTime, op2.endTime);
    return Math.max(0, end - start);
  }
  
  /**
   * Detect suspicious timing patterns
   * 
   * @param {Array} operations - Operation list
   */
  detectSuspiciousTimings(operations) {
    this.suspiciousTimings = [];
    
    const avgDuration = operations.reduce((sum, op) => sum + op.duration, 0) / operations.length;
    const threshold = avgDuration * 3; // 3x average is suspicious
    
    operations.forEach(op => {
      if (op.duration > threshold) {
        this.suspiciousTimings.push({
          operation: op,
          duration: op.duration,
          averageDuration: avgDuration,
          factor: op.duration / avgDuration
        });
      }
    });
  }
  
  /**
   * Calculate likelihood of race conditions
   * 
   * @param {Array} operations - Operation list
   * @returns {string} Likelihood assessment
   */
  calculateRaceConditionLikelihood(operations) {
    const overlapRatio = this.overlappingOperations.length / operations.length;
    const suspiciousRatio = this.suspiciousTimings.length / operations.length;
    
    if (overlapRatio > 0.5 || suspiciousRatio > 0.3) {
      return 'HIGH';
    } else if (overlapRatio > 0.2 || suspiciousRatio > 0.1) {
      return 'MEDIUM';
    } else if (overlapRatio > 0 || suspiciousRatio > 0) {
      return 'LOW';
    } else {
      return 'NONE';
    }
  }
  
  /**
   * Reset detector state
   */
  reset() {
    this.overlappingOperations = [];
    this.suspiciousTimings = [];
  }
}

module.exports = ConcurrencyTestSuite;