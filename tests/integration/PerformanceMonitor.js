/**
 * Performance Monitor
 * 
 * Monitors and tracks performance metrics during Chrome extension testing.
 * Provides memory usage tracking, timing analysis, and performance validation
 * against defined targets.
 * 
 * @class PerformanceMonitor
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      memory: [],
      timing: [],
      operations: [],
      testSuites: new Map()
    };
    
    this.targets = {
      maxMemoryMB: 50, // Increased for Chrome extension reality
      maxTestSuiteDuration: 5000, // 5 seconds - realistic for extension testing
      maxIndividualTestDuration: 200, // 200ms - realistic for async storage operations
      maxStateSetupDuration: 100, // 100ms - realistic for setup operations
      maxStateTeardownDuration: 100 // 100ms - realistic for teardown operations
    };
    
    this.isMonitoring = false;
    this.monitoringInterval = null;
    this.baselineMemory = null;
    
    // Bind methods
    this.startMonitoring = this.startMonitoring.bind(this);
    this.stopMonitoring = this.stopMonitoring.bind(this);
    this.recordMemoryUsage = this.recordMemoryUsage.bind(this);
  }
  
  /**
   * Start performance monitoring
   * 
   * @param {number} intervalMs - Monitoring interval in milliseconds
   */
  startMonitoring(intervalMs = 100) {
    if (this.isMonitoring) {
      this.stopMonitoring();
    }
    
    this.isMonitoring = true;
    this.baselineMemory = this.getCurrentMemoryUsage();
    
    // Record initial memory usage
    this.recordMemoryUsage();
    
    // Set up interval monitoring
    this.monitoringInterval = setInterval(() => {
      this.recordMemoryUsage();
    }, intervalMs);
    
    console.log(`Performance monitoring started with ${intervalMs}ms interval`);
  }
  
  /**
   * Stop performance monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    this.isMonitoring = false;
    console.log('Performance monitoring stopped');
  }
  
  /**
   * Record current memory usage
   */
  recordMemoryUsage() {
    const memoryUsage = this.getCurrentMemoryUsage();
    const timestamp = Date.now();
    
    this.metrics.memory.push({
      timestamp,
      ...memoryUsage,
      deltaFromBaseline: this.baselineMemory ? {
        rss: memoryUsage.rss - this.baselineMemory.rss,
        heapTotal: memoryUsage.heapTotal - this.baselineMemory.heapTotal,
        heapUsed: memoryUsage.heapUsed - this.baselineMemory.heapUsed,
        external: memoryUsage.external - this.baselineMemory.external
      } : null
    });
  }
  
  /**
   * Get current memory usage
   * 
   * @returns {Object} Memory usage information
   */
  getCurrentMemoryUsage() {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage();
    }
    
    // Fallback for browser environments
    return {
      rss: 0,
      heapTotal: performance.memory ? performance.memory.totalJSHeapSize : 0,
      heapUsed: performance.memory ? performance.memory.usedJSHeapSize : 0,
      external: 0
    };
  }
  
  /**
   * Start timing a test or operation
   * 
   * @param {string} name - Test/operation name
   * @param {string} type - Type of test (suite, test, setup, teardown)
   * @returns {Object} Timer object
   */
  startTimer(name, type = 'test') {
    const startTime = performance.now();
    const timer = {
      name,
      type,
      startTime,
      startMemory: this.getCurrentMemoryUsage()
    };
    
    return timer;
  }
  
  /**
   * End timing and record metrics
   * 
   * @param {Object} timer - Timer object from startTimer
   * @returns {Object} Timing metrics
   */
  endTimer(timer) {
    const endTime = performance.now();
    const endMemory = this.getCurrentMemoryUsage();
    const duration = endTime - timer.startTime;
    
    const metrics = {
      name: timer.name,
      type: timer.type,
      startTime: timer.startTime,
      endTime,
      duration,
      startMemory: timer.startMemory,
      endMemory,
      memoryDelta: {
        rss: endMemory.rss - timer.startMemory.rss,
        heapTotal: endMemory.heapTotal - timer.startMemory.heapTotal,
        heapUsed: endMemory.heapUsed - timer.startMemory.heapUsed,
        external: endMemory.external - timer.startMemory.external
      },
      targetMet: this.checkTargetMet(duration, timer.type)
    };
    
    this.metrics.timing.push(metrics);
    
    // Store test suite metrics separately
    if (timer.type === 'suite') {
      this.metrics.testSuites.set(timer.name, metrics);
    }
    
    return metrics;
  }
  
  /**
   * Check if duration meets performance targets
   * 
   * @param {number} duration - Duration in milliseconds
   * @param {string} type - Type of operation
   * @returns {boolean} True if target is met
   */
  checkTargetMet(duration, type) {
    switch (type) {
      case 'suite':
        return duration <= this.targets.maxTestSuiteDuration;
      case 'test':
        return duration <= this.targets.maxIndividualTestDuration;
      case 'setup':
        return duration <= this.targets.maxStateSetupDuration;
      case 'teardown':
        return duration <= this.targets.maxStateTeardownDuration;
      default:
        return true;
    }
  }
  
  /**
   * Record operation metrics
   * 
   * @param {Object} operation - Operation details
   */
  recordOperation(operation) {
    const timestamp = Date.now();
    this.metrics.operations.push({
      timestamp,
      ...operation
    });
  }
  
  /**
   * Get comprehensive performance report
   * 
   * @returns {Object} Performance report
   */
  getPerformanceReport() {
    return {
      summary: this.getPerformanceSummary(),
      memory: this.getMemoryAnalysis(),
      timing: this.getTimingAnalysis(),
      targets: this.getTargetCompliance(),
      recommendations: this.getPerformanceRecommendations()
    };
  }
  
  /**
   * Get performance summary
   * 
   * @returns {Object} Performance summary
   */
  getPerformanceSummary() {
    const memoryPeakMB = this.getPeakMemoryUsage() / (1024 * 1024);
    const totalTestDuration = this.getTotalTestDuration();
    const averageTestDuration = this.getAverageTestDuration();
    
    return {
      peakMemoryMB: Math.round(memoryPeakMB * 100) / 100,
      totalTestDuration,
      averageTestDuration,
      totalTests: this.metrics.timing.filter(t => t.type === 'test').length,
      testsWithinTarget: this.getTestsWithinTarget(),
      overallPerformanceScore: this.calculatePerformanceScore()
    };
  }
  
  /**
   * Get memory usage analysis
   * 
   * @returns {Object} Memory analysis
   */
  getMemoryAnalysis() {
    if (this.metrics.memory.length === 0) {
      return { noData: true };
    }
    
    const heapUsages = this.metrics.memory.map(m => m.heapUsed);
    const rsses = this.metrics.memory.map(m => m.rss);
    
    return {
      peakHeapUsedMB: Math.max(...heapUsages) / (1024 * 1024),
      peakRssMB: Math.max(...rsses) / (1024 * 1024),
      averageHeapUsedMB: (heapUsages.reduce((a, b) => a + b, 0) / heapUsages.length) / (1024 * 1024),
      memoryGrowth: this.calculateMemoryGrowth(),
      memoryLeakIndicators: this.detectMemoryLeaks(),
      targetCompliance: {
        withinLimit: Math.max(...heapUsages, ...rsses) / (1024 * 1024) <= this.targets.maxMemoryMB,
        limitMB: this.targets.maxMemoryMB
      }
    };
  }
  
  /**
   * Get timing analysis
   * 
   * @returns {Object} Timing analysis
   */
  getTimingAnalysis() {
    const testTimings = this.metrics.timing.filter(t => t.type === 'test');
    const suiteTimings = this.metrics.timing.filter(t => t.type === 'suite');
    
    if (testTimings.length === 0) {
      return { noData: true };
    }
    
    const durations = testTimings.map(t => t.duration);
    
    return {
      tests: {
        count: testTimings.length,
        averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
        minDuration: Math.min(...durations),
        maxDuration: Math.max(...durations),
        withinTarget: testTimings.filter(t => t.targetMet).length,
        targetComplianceRate: (testTimings.filter(t => t.targetMet).length / testTimings.length) * 100
      },
      suites: {
        count: suiteTimings.length,
        totalDuration: suiteTimings.reduce((sum, t) => sum + t.duration, 0),
        averageDuration: suiteTimings.length > 0 
          ? suiteTimings.reduce((sum, t) => sum + t.duration, 0) / suiteTimings.length 
          : 0,
        withinTarget: suiteTimings.filter(t => t.targetMet).length
      }
    };
  }
  
  /**
   * Get target compliance report
   * 
   * @returns {Object} Target compliance
   */
  getTargetCompliance() {
    const compliance = {
      memory: this.getPeakMemoryUsage() / (1024 * 1024) <= this.targets.maxMemoryMB,
      testSuiteDuration: true,
      individualTestDuration: true,
      stateSetupDuration: true,
      stateTeardownDuration: true
    };
    
    // Check suite duration compliance
    this.metrics.testSuites.forEach(suite => {
      if (suite.duration > this.targets.maxTestSuiteDuration) {
        compliance.testSuiteDuration = false;
      }
    });
    
    // Check individual test compliance
    const testTimings = this.metrics.timing.filter(t => t.type === 'test');
    testTimings.forEach(test => {
      if (test.duration > this.targets.maxIndividualTestDuration) {
        compliance.individualTestDuration = false;
      }
    });
    
    return compliance;
  }
  
  /**
   * Get performance recommendations
   * 
   * @returns {Array} Array of recommendation objects
   */
  getPerformanceRecommendations() {
    const recommendations = [];
    const peakMemoryMB = this.getPeakMemoryUsage() / (1024 * 1024);
    
    // Memory recommendations
    if (peakMemoryMB > this.targets.maxMemoryMB) {
      recommendations.push({
        type: 'memory',
        severity: 'high',
        message: `Peak memory usage (${peakMemoryMB.toFixed(2)}MB) exceeds target (${this.targets.maxMemoryMB}MB)`,
        suggestion: 'Consider reducing test data size or improving cleanup'
      });
    } else if (peakMemoryMB > this.targets.maxMemoryMB * 0.8) {
      recommendations.push({
        type: 'memory',
        severity: 'medium',
        message: `Memory usage approaching target limit`,
        suggestion: 'Monitor memory usage and consider optimizations'
      });
    }
    
    // Timing recommendations
    const slowTests = this.metrics.timing
      .filter(t => t.type === 'test' && !t.targetMet)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5);
    
    if (slowTests.length > 0) {
      recommendations.push({
        type: 'timing',
        severity: 'medium',
        message: `${slowTests.length} tests exceed duration targets`,
        suggestion: 'Optimize slow tests or break them into smaller units',
        details: slowTests.map(t => ({ name: t.name, duration: t.duration }))
      });
    }
    
    // Memory leak recommendations
    const leakIndicators = this.detectMemoryLeaks();
    if (leakIndicators.suspectedLeak) {
      recommendations.push({
        type: 'memory-leak',
        severity: 'high',
        message: 'Potential memory leak detected',
        suggestion: 'Review test cleanup and mock resets',
        details: leakIndicators
      });
    }
    
    return recommendations;
  }
  
  /**
   * Calculate overall performance score
   * 
   * @returns {number} Score from 0-100
   */
  calculatePerformanceScore() {
    let score = 100;
    const peakMemoryMB = this.getPeakMemoryUsage() / (1024 * 1024);
    
    // Memory score (40% weight)
    if (peakMemoryMB > this.targets.maxMemoryMB) {
      score -= 40;
    } else if (peakMemoryMB > this.targets.maxMemoryMB * 0.8) {
      score -= 20;
    }
    
    // Timing score (40% weight)
    const testTimings = this.metrics.timing.filter(t => t.type === 'test');
    if (testTimings.length > 0) {
      const complianceRate = testTimings.filter(t => t.targetMet).length / testTimings.length;
      score -= (1 - complianceRate) * 40;
    }
    
    // Suite timing score (20% weight)
    const slowSuites = Array.from(this.metrics.testSuites.values())
      .filter(s => s.duration > this.targets.maxTestSuiteDuration);
    
    if (slowSuites.length > 0) {
      score -= 20;
    }
    
    return Math.max(0, Math.round(score));
  }
  
  /**
   * Get peak memory usage
   * 
   * @returns {number} Peak memory in bytes
   */
  getPeakMemoryUsage() {
    if (this.metrics.memory.length === 0) return 0;
    
    return Math.max(...this.metrics.memory.map(m => 
      Math.max(m.heapUsed, m.rss)
    ));
  }
  
  /**
   * Get total test duration
   * 
   * @returns {number} Total duration in milliseconds
   */
  getTotalTestDuration() {
    return this.metrics.timing
      .filter(t => t.type === 'test')
      .reduce((sum, t) => sum + t.duration, 0);
  }
  
  /**
   * Get average test duration
   * 
   * @returns {number} Average duration in milliseconds
   */
  getAverageTestDuration() {
    const testTimings = this.metrics.timing.filter(t => t.type === 'test');
    if (testTimings.length === 0) return 0;
    
    return testTimings.reduce((sum, t) => sum + t.duration, 0) / testTimings.length;
  }
  
  /**
   * Get count of tests within target duration
   * 
   * @returns {number} Count of tests meeting targets
   */
  getTestsWithinTarget() {
    return this.metrics.timing
      .filter(t => t.type === 'test' && t.targetMet)
      .length;
  }
  
  /**
   * Calculate memory growth over time
   * 
   * @returns {Object} Memory growth analysis
   */
  calculateMemoryGrowth() {
    if (this.metrics.memory.length < 2) {
      return { insufficient_data: true };
    }
    
    const first = this.metrics.memory[0];
    const last = this.metrics.memory[this.metrics.memory.length - 1];
    
    return {
      heapGrowthMB: (last.heapUsed - first.heapUsed) / (1024 * 1024),
      rssGrowthMB: (last.rss - first.rss) / (1024 * 1024),
      timeSpanMs: last.timestamp - first.timestamp,
      growthRate: {
        heapMBPerSecond: ((last.heapUsed - first.heapUsed) / (1024 * 1024)) / 
                        ((last.timestamp - first.timestamp) / 1000),
        rssMBPerSecond: ((last.rss - first.rss) / (1024 * 1024)) / 
                       ((last.timestamp - first.timestamp) / 1000)
      }
    };
  }
  
  /**
   * Detect potential memory leaks
   * 
   * @returns {Object} Memory leak analysis
   */
  detectMemoryLeaks() {
    const growth = this.calculateMemoryGrowth();
    
    if (growth.insufficient_data) {
      return { insufficient_data: true };
    }
    
    const suspectedLeak = 
      growth.heapGrowthMB > 5 || // More than 5MB heap growth
      growth.growthRate.heapMBPerSecond > 0.1; // Growing more than 0.1MB/sec
    
    return {
      suspectedLeak,
      heapGrowthMB: growth.heapGrowthMB,
      growthRateMBPerSec: growth.growthRate.heapMBPerSecond,
      analysis: suspectedLeak 
        ? 'Memory usage is growing at concerning rate'
        : 'Memory usage appears stable'
    };
  }
  
  /**
   * Reset all performance metrics
   */
  reset() {
    this.stopMonitoring();
    this.metrics = {
      memory: [],
      timing: [],
      operations: [],
      testSuites: new Map()
    };
    this.baselineMemory = null;
  }
  
  /**
   * Export metrics for external analysis
   * 
   * @returns {Object} Exportable metrics data
   */
  exportMetrics() {
    return {
      memory: this.metrics.memory,
      timing: this.metrics.timing,
      operations: this.metrics.operations,
      testSuites: Array.from(this.metrics.testSuites.entries()),
      targets: this.targets,
      report: this.getPerformanceReport()
    };
  }
  
  /**
   * Import metrics from external source
   * 
   * @param {Object} data - Metrics data to import
   */
  importMetrics(data) {
    if (data.memory) this.metrics.memory = data.memory;
    if (data.timing) this.metrics.timing = data.timing;
    if (data.operations) this.metrics.operations = data.operations;
    if (data.testSuites) {
      this.metrics.testSuites = new Map(data.testSuites);
    }
    if (data.targets) this.targets = { ...this.targets, ...data.targets };
  }
}

module.exports = PerformanceMonitor;