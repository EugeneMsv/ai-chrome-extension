// Storage Service Tests
// Following TDD approach: Write tests FIRST, then implement

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageService } from '@infrastructure/chrome-apis/storage.service';
import { StorageExtensionError } from '@types';

describe('StorageService', () => {
  let storageService: StorageService;

  beforeEach(() => {
    storageService = new StorageService();
  });

  describe('get', () => {
    it('should retrieve a value from Chrome storage sync', async () => {
      // Arrange
      const testKey = 'testKey';
      const testValue = 'testValue';

      vi.mocked(chrome.storage.sync.get).mockImplementation((key, callback) => {
        callback({ [testKey]: testValue });
      });

      // Act
      const result = await storageService.get<string>(testKey);

      // Assert
      expect(result).toBe(testValue);
      expect(chrome.storage.sync.get).toHaveBeenCalledWith(testKey, expect.any(Function));
    });

    it('should return null when key does not exist', async () => {
      // Arrange
      const testKey = 'nonExistentKey';

      vi.mocked(chrome.storage.sync.get).mockImplementation((key, callback) => {
        callback({});
      });

      // Act
      const result = await storageService.get<string>(testKey);

      // Assert
      expect(result).toBeNull();
    });

    it('should handle Chrome runtime errors', async () => {
      // Arrange
      const testKey = 'testKey';

      vi.mocked(chrome.storage.sync.get).mockImplementation((key, callback) => {
        // Simulate Chrome runtime error
        chrome.runtime.lastError = { message: 'Storage quota exceeded' };
        callback({});
      });

      // Act & Assert
      await expect(storageService.get<string>(testKey)).rejects.toThrow(StorageExtensionError);

      // Reset the error
      chrome.runtime.lastError = null;
    });
  });

  describe('set', () => {
    it('should store a value in Chrome storage sync', async () => {
      // Arrange
      const testKey = 'testKey';
      const testValue = 'testValue';

      vi.mocked(chrome.storage.sync.set).mockImplementation((items, callback) => {
        if (callback) callback();
      });

      // Act
      await storageService.set(testKey, testValue);

      // Assert
      expect(chrome.storage.sync.set).toHaveBeenCalledWith(
        { [testKey]: testValue },
        expect.any(Function)
      );
    });

    it('should handle Chrome runtime errors during set', async () => {
      // Arrange
      const testKey = 'testKey';
      const testValue = 'testValue';

      vi.mocked(chrome.storage.sync.set).mockImplementation((items, callback) => {
        chrome.runtime.lastError = { message: 'Permission denied' };
        if (callback) callback();
      });

      // Act & Assert
      await expect(storageService.set(testKey, testValue)).rejects.toThrow(StorageExtensionError);

      // Reset the error
      chrome.runtime.lastError = null;
    });
  });

  describe('remove', () => {
    it('should remove a key from Chrome storage sync', async () => {
      // Arrange
      const testKey = 'testKey';

      vi.mocked(chrome.storage.sync.remove).mockImplementation((key, callback) => {
        if (callback) callback();
      });

      // Act
      await storageService.remove(testKey);

      // Assert
      expect(chrome.storage.sync.remove).toHaveBeenCalledWith(testKey, expect.any(Function));
    });
  });

  describe('clear', () => {
    it('should clear all data from Chrome storage sync', async () => {
      // Arrange
      vi.mocked(chrome.storage.sync.clear).mockImplementation(callback => {
        if (callback) callback();
      });

      // Act
      await storageService.clear();

      // Assert
      expect(chrome.storage.sync.clear).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe('getBytesInUse', () => {
    it('should return bytes in use for specific keys', async () => {
      // Arrange
      const testKey = 'testKey';
      const bytesInUse = 1024;

      vi.mocked(chrome.storage.sync.getBytesInUse).mockImplementation((keys, callback) => {
        callback(bytesInUse);
      });

      // Act
      const result = await storageService.getBytesInUse(testKey);

      // Assert
      expect(result).toBe(bytesInUse);
      expect(chrome.storage.sync.getBytesInUse).toHaveBeenCalledWith(testKey, expect.any(Function));
    });

    it('should return total bytes when no key specified', async () => {
      // Arrange
      const totalBytes = 2048;

      vi.mocked(chrome.storage.sync.getBytesInUse).mockImplementation((keys, callback) => {
        callback(totalBytes);
      });

      // Act
      const result = await storageService.getBytesInUse();

      // Assert
      expect(result).toBe(totalBytes);
      expect(chrome.storage.sync.getBytesInUse).toHaveBeenCalledWith(null, expect.any(Function));
    });
  });

  describe('isQuotaExceeded', () => {
    it('should return false when under quota', async () => {
      // Arrange
      const bytesInUse = 50000; // 50KB
      chrome.storage.sync.QUOTA_BYTES = 102400; // 100KB

      vi.mocked(chrome.storage.sync.getBytesInUse).mockImplementation((keys, callback) => {
        callback(bytesInUse);
      });

      // Act
      const result = await storageService.isQuotaExceeded();

      // Assert
      expect(result).toBe(false);
    });

    it('should return true when over quota', async () => {
      // Arrange
      const bytesInUse = 150000; // 150KB
      chrome.storage.sync.QUOTA_BYTES = 102400; // 100KB

      vi.mocked(chrome.storage.sync.getBytesInUse).mockImplementation((keys, callback) => {
        callback(bytesInUse);
      });

      // Act
      const result = await storageService.isQuotaExceeded();

      // Assert
      expect(result).toBe(true);
    });
  });
});
