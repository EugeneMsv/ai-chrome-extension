/**
 * Unit Tests for BoundaryTestSuite
 * 
 * Tests the boundary test suite component to verify
 * proper generation of boundary test scenarios.
 */

const BoundaryTestSuite = require('../../tests/integration/BoundaryTestSuite');

describe('BoundaryTestSuite', () => {
  let boundaryTestSuite;

  beforeEach(() => {
    boundaryTestSuite = new BoundaryTestSuite();
  });

  describe('Test Scenario Generation', () => {
    test('generates comprehensive test scenarios', () => {
      const scenarios = boundaryTestSuite.getTestScenarios();
      
      expect(scenarios).toBeInstanceOf(Array);
      expect(scenarios.length).toBeGreaterThan(20);
      
      // Verify all scenarios have required properties
      scenarios.forEach(scenario => {
        expect(scenario).toHaveProperty('name');
        expect(scenario).toHaveProperty('description');
        expect(scenario).toHaveProperty('expectedResult');
        expect(scenario).toHaveProperty('category');
      });
    });

    test('generates scenarios for all categories', () => {
      const scenarios = boundaryTestSuite.getTestScenarios();
      const categories = [...new Set(scenarios.map(s => s.category))];
      
      expect(categories).toContain('item-size');
      expect(categories).toContain('total-quota');
      expect(categories).toContain('unicode');
      expect(categories).toContain('key-length');
      expect(categories).toContain('format');
      expect(categories).toContain('edge-case');
    });

    test('validates all generated scenarios', () => {
      const scenarios = boundaryTestSuite.getTestScenarios();
      
      scenarios.forEach(scenario => {
        const isValid = boundaryTestSuite.validateScenario(scenario);
        expect(isValid).toBe(true);
      });
    });
  });

  describe('API Key Generation', () => {
    test('generates API keys of specified byte size', () => {
      const targetBytes = 1000;
      const apiKey = boundaryTestSuite.generateApiKey(targetBytes);
      const actualSize = boundaryTestSuite.calculateActualSize(apiKey);
      
      expect(actualSize).toBeLessThanOrEqual(targetBytes + 50); // Allow small tolerance
      expect(actualSize).toBeGreaterThan(targetBytes - 50);
    });

    test('generates realistic Google API keys', () => {
      const apiKey = boundaryTestSuite.generateRealisticApiKey();
      
      expect(apiKey).toMatch(/^AIza[a-zA-Z0-9_-]+$/);
      expect(apiKey.length).toBe(39); // AIza + 35 characters
    });

    test('generates ASCII-only keys when specified', () => {
      const apiKey = boundaryTestSuite.generateApiKey(500, 'ascii');
      
      // Should only contain ASCII characters
      expect(apiKey).toMatch(/^[a-zA-Z0-9]*$/);
      expect(apiKey).toMatch(/^AIza/); // Should start with prefix
    });

    test('generates Unicode keys when specified', () => {
      const apiKey = boundaryTestSuite.generateApiKey(500, 'unicode');
      
      expect(apiKey).toMatch(/^AIza/); // Should start with prefix
      // May contain Unicode characters (hard to test specific Unicode)
    });

    test('handles minimum size gracefully', () => {
      const minKey = boundaryTestSuite.generateApiKey(10);
      
      expect(minKey).toMatch(/^AIza/);
      expect(minKey.length).toBeGreaterThanOrEqual(4); // At least the prefix
    });
  });

  describe('Size Calculations', () => {
    test('calculates storage overhead correctly', () => {
      const key = 'test_key';
      const overhead = boundaryTestSuite.calculateStorageOverhead(key);
      
      expect(overhead).toBeGreaterThan(key.length);
      expect(overhead).toBeGreaterThan(0);
    });

    test('calculates actual storage size', () => {
      const apiKey = 'AIzaSyTestKey123';
      const size = boundaryTestSuite.calculateActualSize(apiKey);
      
      expect(size).toBeGreaterThan(apiKey.length);
      expect(size).toBeGreaterThan(0);
    });

    test('handles empty string size calculation', () => {
      const size = boundaryTestSuite.calculateActualSize('');
      
      expect(size).toBeGreaterThan(0); // JSON overhead
    });
  });

  describe('Scenario Filtering', () => {
    test('filters scenarios by category', () => {
      const itemSizeScenarios = boundaryTestSuite.getScenariosByCategory('item-size');
      
      expect(itemSizeScenarios.length).toBeGreaterThan(0);
      itemSizeScenarios.forEach(scenario => {
        expect(scenario.category).toBe('item-size');
      });
    });

    test('filters success scenarios', () => {
      const successScenarios = boundaryTestSuite.getSuccessScenarios();
      
      expect(successScenarios.length).toBeGreaterThan(0);
      successScenarios.forEach(scenario => {
        expect(scenario.expectedResult).toBe('success');
      });
    });

    test('filters failure scenarios', () => {
      const failureScenarios = boundaryTestSuite.getFailureScenarios();
      
      expect(failureScenarios.length).toBeGreaterThan(0);
      failureScenarios.forEach(scenario => {
        expect(scenario.expectedResult).not.toBe('success');
      });
    });
  });

  describe('Item Size Boundaries', () => {
    test('generates item size boundary scenarios', () => {
      const scenarios = boundaryTestSuite.getItemSizeBoundaries();
      
      expect(scenarios.length).toBeGreaterThan(3);
      
      const scenarioNames = scenarios.map(s => s.name);
      expect(scenarioNames).toContain('item-size-at-limit');
      expect(scenarioNames).toContain('item-size-just-over-limit');
    });

    test('creates scenarios with correct expected results', () => {
      const scenarios = boundaryTestSuite.getItemSizeBoundaries();
      
      const atLimit = scenarios.find(s => s.name === 'item-size-at-limit');
      const overLimit = scenarios.find(s => s.name === 'item-size-just-over-limit');
      
      expect(atLimit.expectedResult).toBe('success');
      expect(overLimit.expectedResult).toBe('quota_exceeded');
    });
  });

  describe('Total Quota Boundaries', () => {
    test('generates quota boundary scenarios', () => {
      const scenarios = boundaryTestSuite.getTotalQuotaBoundaries();
      
      expect(scenarios.length).toBeGreaterThan(4);
      
      const quotaScenarios = scenarios.filter(s => s.setupQuota);
      expect(quotaScenarios.length).toBeGreaterThan(0);
    });

    test('creates scenarios with appropriate quota setups', () => {
      const scenarios = boundaryTestSuite.getTotalQuotaBoundaries();
      
      const atLimit = scenarios.find(s => s.name === 'quota-at-limit');
      expect(atLimit.setupQuota).toBe(1.0);
      expect(atLimit.expectedResult).toBe('quota_exceeded');
      
      const belowLimit = scenarios.find(s => s.name === 'quota-50-percent');
      expect(belowLimit.setupQuota).toBe(0.50);
      expect(belowLimit.expectedResult).toBe('success');
    });
  });

  describe('Unicode Boundaries', () => {
    test('generates Unicode boundary scenarios', () => {
      const scenarios = boundaryTestSuite.getUnicodeBoundaries();
      
      expect(scenarios.length).toBeGreaterThan(3);
      
      const scenarioNames = scenarios.map(s => s.name);
      expect(scenarioNames).toContain('unicode-ascii-only');
      expect(scenarioNames).toContain('unicode-multibyte-small');
    });

    test('creates Unicode keys with different character sets', () => {
      const scenarios = boundaryTestSuite.getUnicodeBoundaries();
      
      const asciiScenario = scenarios.find(s => s.name === 'unicode-ascii-only');
      const unicodeScenario = scenarios.find(s => s.name === 'unicode-multibyte-small');
      
      expect(asciiScenario.apiKey).toMatch(/^[a-zA-Z0-9_-]+$/);
      expect(unicodeScenario.apiKey).toMatch(/🔑/); // Contains emoji
    });
  });

  describe('Edge Case Scenarios', () => {
    test('generates edge case scenarios', () => {
      const scenarios = boundaryTestSuite.getEdgeCaseScenarios();
      
      expect(scenarios.length).toBeGreaterThan(5);
      
      const scenarioNames = scenarios.map(s => s.name);
      expect(scenarioNames).toContain('edge-null-key');
      expect(scenarioNames).toContain('edge-undefined-key');
      expect(scenarioNames).toContain('edge-numeric-key');
    });

    test('includes various data types as edge cases', () => {
      const scenarios = boundaryTestSuite.getEdgeCaseScenarios();
      
      const nullScenario = scenarios.find(s => s.name === 'edge-null-key');
      const numericScenario = scenarios.find(s => s.name === 'edge-numeric-key');
      const objectScenario = scenarios.find(s => s.name === 'edge-object-key');
      
      expect(nullScenario.apiKey).toBeNull();
      expect(typeof numericScenario.apiKey).toBe('number');
      expect(typeof objectScenario.apiKey).toBe('object');
    });
  });

  describe('Concurrent Boundary Data', () => {
    test('generates concurrent boundary test data', () => {
      const operations = boundaryTestSuite.generateConcurrentBoundaryData(5);
      
      expect(operations.length).toBe(5);
      operations.forEach(op => {
        expect(op).toHaveProperty('id');
        expect(op).toHaveProperty('scenario');
        expect(op).toHaveProperty('delay');
        expect(op).toHaveProperty('expectedResult');
      });
    });

    test('assigns random delays to operations', () => {
      const operations = boundaryTestSuite.generateConcurrentBoundaryData(10);
      
      const delays = operations.map(op => op.delay);
      const uniqueDelays = [...new Set(delays)];
      
      // Should have some variation in delays
      expect(uniqueDelays.length).toBeGreaterThan(1);
    });

    test('cycles through scenarios for multiple operations', () => {
      const operations = boundaryTestSuite.generateConcurrentBoundaryData(50);
      
      const scenarioNames = operations.map(op => op.scenario.name);
      const uniqueScenarios = [...new Set(scenarioNames)];
      
      // Should use multiple different scenarios
      expect(uniqueScenarios.length).toBeGreaterThan(5);
    });
  });

  describe('Unicode Key Generation', () => {
    test('generates Unicode key at specific boundary', () => {
      const targetBytes = 1000;
      const unicodeKey = boundaryTestSuite.generateUnicodeKeyAtBoundary(targetBytes);
      
      expect(unicodeKey).toMatch(/^AIza/);
      expect(unicodeKey.length).toBeGreaterThan(4); // At least contains base prefix + content
      
      const actualSize = boundaryTestSuite.calculateActualSize(unicodeKey);
      expect(actualSize).toBeLessThanOrEqual(targetBytes);
    });

    test('handles small boundary sizes', () => {
      const smallKey = boundaryTestSuite.generateUnicodeKeyAtBoundary(100);
      
      expect(smallKey).toMatch(/^AIza/);
      expect(smallKey.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Random String Generation', () => {
    test('generates random strings of specified length', () => {
      const length = 20;
      const randomString = boundaryTestSuite.generateRandomString(length);
      
      expect(randomString.length).toBe(length);
      expect(randomString).toMatch(/^[a-zA-Z0-9]+$/);
    });

    test('generates different strings on multiple calls', () => {
      const string1 = boundaryTestSuite.generateRandomString(15);
      const string2 = boundaryTestSuite.generateRandomString(15);
      
      expect(string1).not.toBe(string2);
    });

    test('handles zero length', () => {
      const emptyString = boundaryTestSuite.generateRandomString(0);
      
      expect(emptyString).toBe('');
    });
  });
});