/**
 * Unit Tests for ChromeStorageSimulator
 * 
 * Tests the Chrome storage simulator component in isolation
 * to verify accurate Chrome API behavior simulation.
 */

const ChromeStorageSimulator = require('../../tests/integration/ChromeStorageSimulator');

describe('ChromeStorageSimulator', () => {
  let simulator;

  beforeEach(() => {
    simulator = new ChromeStorageSimulator();
    global.chrome = {
      runtime: { lastError: null }
    };
  });

  afterEach(() => {
    simulator.reset();
  });

  describe('Byte Size Calculation', () => {
    test('calculates UTF-8 byte size correctly', () => {
      expect(simulator.calculateByteSize('hello')).toBe(7); // 5 chars + 2 quotes
      expect(simulator.calculateByteSize('🔑')).toBe(6); // 4-byte emoji + 2 quotes
      expect(simulator.calculateByteSize('')).toBe(2); // Empty string with quotes
    });

    test('handles complex objects', () => {
      const obj = { key: 'value', number: 123 };
      const size = simulator.calculateByteSize(obj);
      expect(size).toBeGreaterThan(20);
    });

    test('throws error for non-serializable values', () => {
      const circular = {};
      circular.self = circular;
      
      expect(() => {
        simulator.calculateByteSize(circular);
      }).toThrow('INVALID_VALUE');
    });
  });

  describe('Quota Validation', () => {
    test('validates item size limits correctly', () => {
      const largeValue = 'x'.repeat(8200);
      
      expect(() => {
        simulator.validateItemSize('test', largeValue);
      }).toThrow('QUOTA_EXCEEDED');
    });

    test('validates total quota limits', () => {
      // Fill storage to near capacity using setState for proper setup
      const largeValue = 'x'.repeat(25000); // 25KB each item, should exceed 100KB total when adding another
      simulator.setState({
        storage: {
          'item1': largeValue,
          'item2': largeValue,
          'item3': largeValue,
          'item4': largeValue // Total should be around 100KB, adding another should exceed
        }
      });
      
      
      expect(() => {
        simulator.validateTotalQuota('newItem', largeValue);
      }).toThrow('QUOTA_EXCEEDED');
    });

    test('allows items within quota', () => {
      const smallValue = 'small_value';
      
      expect(() => {
        simulator.validateItemSize('test', smallValue);
        simulator.validateTotalQuota('test', smallValue);
      }).not.toThrow();
    });
  });

  describe('Storage Operations', () => {
    test('get operation returns empty object for missing keys', (done) => {
      simulator.get(['nonexistent'], (result) => {
        expect(result).toEqual({});
        expect(global.chrome.runtime.lastError).toBeNull();
        done();
      });
    });

    test('get operation returns all items when keys is null', (done) => {
      simulator.storage.set('key1', 'value1');
      simulator.storage.set('key2', 'value2');
      
      simulator.get(null, (result) => {
        expect(result).toEqual({
          key1: 'value1',
          key2: 'value2'
        });
        done();
      });
    });

    test('set operation stores values correctly', (done) => {
      const items = { testKey: 'testValue' };
      
      simulator.set(items, () => {
        expect(simulator.storage.get('testKey')).toBe('testValue');
        expect(global.chrome.runtime.lastError).toBeNull();
        done();
      });
    });

    test('set operation validates quota before storing', (done) => {
      const largeValue = 'x'.repeat(8200);
      const items = { testKey: largeValue };
      
      simulator.set(items, () => {
        expect(global.chrome.runtime.lastError).not.toBeNull();
        expect(global.chrome.runtime.lastError.message).toMatch(/QUOTA_EXCEEDED/);
        expect(simulator.storage.has('testKey')).toBe(false);
        done();
      });
    });

    test('remove operation deletes specified keys', (done) => {
      simulator.storage.set('key1', 'value1');
      simulator.storage.set('key2', 'value2');
      
      simulator.remove(['key1'], () => {
        expect(simulator.storage.has('key1')).toBe(false);
        expect(simulator.storage.has('key2')).toBe(true);
        done();
      });
    });

    test('clear operation removes all items', (done) => {
      simulator.storage.set('key1', 'value1');
      simulator.storage.set('key2', 'value2');
      
      simulator.clear(() => {
        expect(simulator.storage.size).toBe(0);
        done();
      });
    });

    test('getBytesInUse returns correct sizes', (done) => {
      const testValue = 'test_value';
      simulator.storage.set('testKey', testValue);
      
      simulator.getBytesInUse(['testKey'], (bytes) => {
        expect(bytes).toBeGreaterThan(0);
        done();
      });
    });
  });

  describe('Error State Simulation', () => {
    test('simulates network offline state', (done) => {
      simulator.isOnline = false;
      
      simulator.get(['test'], () => {
        expect(global.chrome.runtime.lastError).not.toBeNull();
        expect(global.chrome.runtime.lastError.message).toMatch(/offline/i);
        done();
      });
    });

    test('simulates permission denied state', (done) => {
      simulator.syncEnabled = false;
      
      simulator.set({ test: 'value' }, () => {
        expect(global.chrome.runtime.lastError).not.toBeNull();
        expect(global.chrome.runtime.lastError.message).toMatch(/denied|disabled/i);
        done();
      });
    });
  });

  describe('Performance Tracking', () => {
    test('tracks operation count and timing', () => {
      const initialMetrics = simulator.getPerformanceMetrics();
      expect(initialMetrics.operationCount).toBe(0);
      
      simulator.trackOperation();
      
      const updatedMetrics = simulator.getPerformanceMetrics();
      expect(updatedMetrics.operationCount).toBe(1);
      expect(updatedMetrics.lastOperationTime).toBeTruthy();
    });

    test('calculates storage metrics correctly', () => {
      simulator.storage.set('test', 'value');
      
      const metrics = simulator.getPerformanceMetrics();
      expect(metrics.totalStorageSize).toBeGreaterThan(0);
      expect(metrics.itemCount).toBe(1);
      expect(metrics.quotaUsagePercent).toBeGreaterThan(0);
      expect(metrics.quotaUsagePercent).toBeLessThan(100);
    });
  });

  describe('State Management', () => {
    test('setState updates simulator configuration', () => {
      const testState = {
        storage: { existingKey: 'existingValue' },
        isOnline: false,
        syncEnabled: false,
        errors: ['Test error']
      };
      
      simulator.setState(testState);
      
      expect(simulator.storage.get('existingKey')).toBe('existingValue');
      expect(simulator.isOnline).toBe(false);
      expect(simulator.syncEnabled).toBe(false);
      expect(global.chrome.runtime.lastError.message).toBe('Test error');
    });

    test('reset clears all state', () => {
      simulator.storage.set('test', 'value');
      simulator.operationCount = 5;
      simulator.isOnline = false;
      
      simulator.reset();
      
      expect(simulator.storage.size).toBe(0);
      expect(simulator.operationCount).toBe(0);
      expect(simulator.isOnline).toBe(true);
      expect(global.chrome.runtime.lastError).toBeNull();
    });
  });

  describe('Chrome API Compatibility', () => {
    test('handles callback-only get operations', (done) => {
      simulator.storage.set('test', 'value');
      
      // Simulate chrome.storage.sync.get(callback) - keys is function
      simulator.get((result) => {
        expect(result).toEqual({ test: 'value' });
        done();
      });
    });

    test('handles object keys with defaults', (done) => {
      const keysWithDefaults = {
        existingKey: 'default1',
        missingKey: 'default2'
      };
      
      simulator.storage.set('existingKey', 'actualValue');
      
      simulator.get(keysWithDefaults, (result) => {
        expect(result.existingKey).toBe('actualValue');
        expect(result.missingKey).toBe('default2');
        done();
      });
    });

    test('handles string key parameter', (done) => {
      simulator.storage.set('singleKey', 'singleValue');
      
      simulator.get('singleKey', (result) => {
        expect(result).toEqual({ singleKey: 'singleValue' });
        done();
      });
    });
  });

  describe('Deep Clone Behavior', () => {
    test('returns deep clones to prevent mutation', (done) => {
      const originalObject = { nested: { value: 'original' } };
      simulator.storage.set('object', originalObject);
      
      simulator.get(['object'], (result) => {
        result.object.nested.value = 'modified';
        
        // Original in storage should be unchanged
        expect(simulator.storage.get('object').nested.value).toBe('original');
        done();
      });
    });

    test('stores deep clones to prevent external mutation', (done) => {
      const externalObject = { value: 'external' };
      
      simulator.set({ test: externalObject }, () => {
        externalObject.value = 'modified';
        
        // Stored value should be unchanged
        expect(simulator.storage.get('test').value).toBe('external');
        done();
      });
    });
  });
});