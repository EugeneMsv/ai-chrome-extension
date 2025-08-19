# Chrome Extension API Key Storage Testing Framework

A comprehensive Jest-based testing framework for Chrome extension API key storage integration testing. This framework provides realistic Chrome API simulation, boundary testing, concurrency testing, and performance monitoring.

## Architecture Overview

### Core Components

1. **ChromeStorageSimulator** - Accurate Chrome storage sync simulation with precise quota enforcement
2. **MessageHelper** - Chrome extension message communication simulation
3. **State Builders** - Composition-based test state setup (Clean, Quota, Error, Concurrent)
4. **BoundaryTestSuite** - Comprehensive boundary value testing with realistic API key generation
5. **ConcurrencyTestSuite** - Concurrent operation testing with race condition detection
6. **PerformanceMonitor** - Memory usage and timing performance monitoring

### Design Principles

- **Composition over Inheritance** - All components use composition patterns
- **Single Responsibility** - Each component has a focused, clear purpose
- **Realistic Simulation** - Accurate Chrome API behavior including quota enforcement
- **Performance First** - Targets: <1.5s for 25 test scenarios, <30MB memory usage

## Quick Start

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test suites
npm test -- __tests__/integration/
npm test -- __tests__/unit/
```

### Example Test Structure

```javascript
describe('Given clean extension state', () => {
  beforeEach(() => {
    const state = new CleanStateBuilder().build();
    storageSimulator.setState(state);
  });

  describe('When saving API key', () => {
    test('Then key is stored and undefined returned', async () => {
      // Given
      const testKey = 'AIzaSyDxKXBV7zX8Q9J2YmNxRvWqZ3pL4kM7nE0';
      
      // When
      const response = await messageHelper.sendMessage({
        action: 'saveApiKey',
        apiKey: testKey
      });
      
      // Then
      expect(response).toBeUndefined();
      expect(await storageVerifier.getStoredKey()).toBe(testKey);
    });
  });
});
```

## Component Guide

### ChromeStorageSimulator

Provides accurate Chrome storage sync simulation with:
- **Precise Quota Enforcement** - 8KB item limit, 100KB total limit
- **UTF-8 Byte Calculation** - Matches Chrome's internal calculations
- **Error State Simulation** - Network offline, permissions denied, quota exceeded
- **Performance Tracking** - Operation count, timing, memory usage

```javascript
const simulator = new ChromeStorageSimulator();
simulator.install(); // Install as Chrome storage mock

// Set up quota state
simulator.setState({
  storage: { existingKey: 'value' },
  isOnline: false // Simulate offline state
});
```

### MessageHelper

Handles Chrome extension message communication:
- **Proper Callback Patterns** - Matches Chrome's async behavior
- **Message History Tracking** - For debugging and verification
- **Timeout Handling** - Configurable message timeouts
- **Background Listener Setup** - Simulates actual extension message handlers

```javascript
const messageHelper = new MessageHelper();
messageHelper.install();
messageHelper.setupBackgroundListeners();

// Send message
const response = await messageHelper.sendMessage({
  action: 'saveApiKey',
  apiKey: 'test_key'
});
```

### State Builders

Composition-based builders for different test scenarios:

#### CleanStateBuilder
```javascript
const state = new CleanStateBuilder()
  .withApiKey('initial_key')
  .build();
```

#### QuotaStateBuilder
```javascript
const state = new QuotaStateBuilder()
  .withQuotaUsage(95) // 95% quota usage
  .withItemCount(10)
  .build();
```

#### ErrorStateBuilder
```javascript
const state = new ErrorStateBuilder()
  .withNetworkOffline()
  .withCustomError('Custom error message')
  .build();
```

### BoundaryTestSuite

Comprehensive boundary value testing:
- **Item Size Boundaries** - Test 8KB item limits
- **Total Quota Boundaries** - Test 100KB total limits  
- **Unicode Boundaries** - Test multibyte character handling
- **API Key Format Boundaries** - Test various key formats
- **Edge Cases** - Test null, undefined, non-string values

```javascript
const boundaryTestSuite = new BoundaryTestSuite();
const scenarios = boundaryTestSuite.getTestScenarios();

// Generate specific boundary conditions
const largeKey = boundaryTestSuite.generateApiKey(8000); // 8KB key
const realisticKey = boundaryTestSuite.generateRealisticApiKey();
```

### ConcurrencyTestSuite

Tests concurrent operations and race conditions:
- **Simultaneous Operations** - Multiple concurrent saves/gets
- **Race Condition Detection** - Timing analysis for potential races
- **Last Write Wins** - Verification of Chrome's behavior
- **Quota Contention** - Multiple operations competing for quota

```javascript
const concurrencyTestSuite = new ConcurrencyTestSuite(messageHelper, storageSimulator);

// Test concurrent saves
const results = await concurrencyTestSuite.testSimultaneousSaveOperations(5);
expect(results.lastWriteWins.verified).toBe(true);
```

### PerformanceMonitor

Tracks and validates performance metrics:
- **Memory Usage Monitoring** - Real-time memory tracking
- **Timing Analysis** - Operation and test suite timing
- **Target Compliance** - Validates against performance targets
- **Performance Recommendations** - Actionable optimization suggestions

```javascript
const performanceMonitor = new PerformanceMonitor();
performanceMonitor.startMonitoring();

const timer = performanceMonitor.startTimer('test-operation', 'test');
// ... perform operation
const metrics = performanceMonitor.endTimer(timer);

const report = performanceMonitor.getPerformanceReport();
```

## Test Categories

### Integration Tests

Located in `__tests__/integration/`, these tests verify end-to-end functionality:
- **API Key Storage Flow** - Complete save/retrieve workflows
- **Error Handling** - Network errors, quota exceeded, permissions
- **Boundary Conditions** - Size limits, Unicode handling
- **Concurrency** - Race conditions, data consistency
- **Performance** - Memory usage, timing compliance

### Unit Tests

Located in `__tests__/unit/`, these test individual components:
- **ChromeStorageSimulator** - Storage simulation accuracy
- **BoundaryTestSuite** - Boundary scenario generation
- **MessageHelper** - Message routing and callbacks
- **State Builders** - State configuration correctness

## Performance Targets

### Memory Usage
- **Maximum**: 30MB peak memory usage
- **Monitoring**: Real-time memory tracking during tests
- **Validation**: Automatic compliance checking

### Timing Targets
- **Test Suite**: <1.5 seconds for 25 test scenarios
- **Individual Test**: <60ms average execution time
- **State Setup**: <30ms for state builder operations
- **State Teardown**: <30ms for cleanup operations

### Quota Simulation
- **Item Limit**: 8KB per storage item (Chrome's actual limit)
- **Total Limit**: 100KB total storage (Chrome's actual limit)
- **Calculation**: UTF-8 byte-accurate size calculations
- **Overhead**: Includes Chrome's internal storage overhead

## Error Simulation

### Network Errors
```javascript
const state = new ErrorStateBuilder()
  .withNetworkOffline()
  .build();
```

### Permission Errors
```javascript
const state = new ErrorStateBuilder()
  .withPermissionDenied()
  .build();
```

### Quota Errors
```javascript
const state = new ErrorStateBuilder()
  .withQuotaExceeded()
  .build();
```

## Best Practices

### Test Structure
- Use **Given/When/Then** pattern for clarity
- Set up clean state in `beforeEach`
- Verify storage state directly after operations
- Include performance timing for critical paths

### Error Testing
- Test both error conditions and recovery
- Verify consistent error messages
- Check that errors don't corrupt storage state
- Test error handling at quota boundaries

### Concurrency Testing  
- Test realistic concurrent operation counts (3-8 operations)
- Verify last-write-wins behavior
- Check for race condition indicators
- Validate data consistency after concurrent operations

### Performance Testing
- Monitor memory usage throughout test runs
- Verify individual test timing compliance
- Check overall test suite performance
- Review performance recommendations

## Troubleshooting

### Common Issues

**Tests timing out**
- Check message helper timeout configuration
- Verify Chrome mock setup in beforeEach
- Ensure proper async/await usage

**Memory usage exceeding targets**
- Review test data sizes
- Check for proper cleanup in afterEach
- Verify mock resets between tests

**Quota calculations incorrect**
- Verify UTF-8 encoding for test data
- Check storage overhead calculations
- Ensure realistic API key sizes

**Race condition false positives**
- Review operation timing thresholds
- Check for proper async operation handling
- Verify race condition detector configuration

### Debug Mode

Enable detailed logging:
```javascript
// In jest.setup.js
global.console = {
  ...console,
  log: console.log, // Enable console.log
  debug: console.debug
};
```

### Performance Analysis

Generate detailed performance reports:
```javascript
const report = performanceMonitor.exportMetrics();
console.log(JSON.stringify(report, null, 2));
```

## Contributing

### Adding New Test Scenarios

1. **Boundary Tests**: Add scenarios to `BoundaryTestSuite.getTestScenarios()`
2. **State Builders**: Extend builders with new state configuration methods
3. **Error Conditions**: Add new error types to `ErrorStateBuilder`
4. **Performance Tests**: Add timing validation for new operations

### Component Extension

- Follow composition over inheritance patterns
- Maintain single responsibility principle
- Include comprehensive unit tests for new components
- Update performance targets if needed

### Documentation

- Update this README for new components
- Add JSDoc comments for all public methods
- Include usage examples for new features
- Document performance implications

---

This testing framework provides comprehensive coverage for Chrome extension API key storage functionality while maintaining high performance and realistic behavior simulation.