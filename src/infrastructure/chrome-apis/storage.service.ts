// Chrome Storage Service Implementation
// Following Clean Architecture patterns and TDD approach

import type { IStorageService } from '@/types/services';
import { StorageExtensionError } from '@/types';

/**
 * Chrome Storage Service - Provides type-safe access to Chrome extension storage
 *
 * This service abstracts Chrome's storage APIs with:
 * - Promise-based interface instead of callbacks
 * - Comprehensive error handling
 * - Type safety for storage operations
 * - Quota management utilities
 */
export class StorageService implements IStorageService {
  /**
   * Retrieves a value from Chrome storage sync
   *
   * @param key - The key to retrieve
   * @returns Promise resolving to the value or null if not found
   * @throws StorageExtensionError if the operation fails
   */
  public async get<T>(key: string): Promise<T | null> {
    try {
      return new Promise<T | null>((resolve, reject) => {
        chrome.storage.sync.get(key, (result: Record<string, T>) => {
          if (chrome.runtime.lastError) {
            reject(
              new StorageExtensionError(
                `Failed to get key '${key}': ${chrome.runtime.lastError.message}`,
                'STORAGE_GET',
                { key, error: chrome.runtime.lastError }
              )
            );
            return;
          }

          const value = result[key];
          resolve(value !== undefined ? value : null);
        });
      });
    } catch (error) {
      throw new StorageExtensionError(
        `Storage get operation failed for key '${key}'`,
        'STORAGE_GET',
        { key, error }
      );
    }
  }

  /**
   * Stores a value in Chrome storage sync
   *
   * @param key - The key to store under
   * @param value - The value to store
   * @throws StorageExtensionError if the operation fails
   */
  public async set<T>(key: string, value: T): Promise<void> {
    try {
      return new Promise<void>((resolve, reject) => {
        const items = { [key]: value };

        chrome.storage.sync.set(items, () => {
          if (chrome.runtime.lastError) {
            reject(
              new StorageExtensionError(
                `Failed to set key '${key}': ${chrome.runtime.lastError.message}`,
                'STORAGE_SET',
                { key, value, error: chrome.runtime.lastError }
              )
            );
            return;
          }

          resolve();
        });
      });
    } catch (error) {
      throw new StorageExtensionError(
        `Storage set operation failed for key '${key}'`,
        'STORAGE_SET',
        { key, value, error }
      );
    }
  }

  /**
   * Removes a key from Chrome storage sync
   *
   * @param key - The key to remove
   * @throws StorageExtensionError if the operation fails
   */
  public async remove(key: string): Promise<void> {
    try {
      return new Promise<void>((resolve, reject) => {
        chrome.storage.sync.remove(key, () => {
          if (chrome.runtime.lastError) {
            reject(
              new StorageExtensionError(
                `Failed to remove key '${key}': ${chrome.runtime.lastError.message}`,
                'STORAGE_REMOVE',
                { key, error: chrome.runtime.lastError }
              )
            );
            return;
          }

          resolve();
        });
      });
    } catch (error) {
      throw new StorageExtensionError(
        `Storage remove operation failed for key '${key}'`,
        'STORAGE_REMOVE',
        { key, error }
      );
    }
  }

  /**
   * Clears all data from Chrome storage sync
   *
   * @throws StorageExtensionError if the operation fails
   */
  public async clear(): Promise<void> {
    try {
      return new Promise<void>((resolve, reject) => {
        chrome.storage.sync.clear(() => {
          if (chrome.runtime.lastError) {
            reject(
              new StorageExtensionError(
                `Failed to clear storage: ${chrome.runtime.lastError.message}`,
                'STORAGE_CLEAR',
                { error: chrome.runtime.lastError }
              )
            );
            return;
          }

          resolve();
        });
      });
    } catch (error) {
      throw new StorageExtensionError('Storage clear operation failed', 'STORAGE_CLEAR', { error });
    }
  }

  /**
   * Gets the bytes in use for specified keys or all keys if none specified
   *
   * @param keys - Optional key or array of keys to check, null for all
   * @returns Promise resolving to bytes in use
   * @throws StorageExtensionError if the operation fails
   */
  public async getBytesInUse(keys?: string | string[] | null): Promise<number> {
    try {
      return new Promise<number>((resolve, reject) => {
        chrome.storage.sync.getBytesInUse(keys ?? null, (bytesInUse: number) => {
          if (chrome.runtime.lastError) {
            reject(
              new StorageExtensionError(
                `Failed to get bytes in use: ${chrome.runtime.lastError.message}`,
                'STORAGE_BYTES_IN_USE',
                { keys, error: chrome.runtime.lastError }
              )
            );
            return;
          }

          resolve(bytesInUse);
        });
      });
    } catch (error) {
      throw new StorageExtensionError(
        'Storage getBytesInUse operation failed',
        'STORAGE_BYTES_IN_USE',
        { keys, error }
      );
    }
  }

  /**
   * Checks if storage quota is exceeded
   *
   * @returns Promise resolving to true if quota is exceeded
   * @throws StorageExtensionError if the operation fails
   */
  public async isQuotaExceeded(): Promise<boolean> {
    try {
      const bytesInUse = await this.getBytesInUse();
      const quota = chrome.storage.sync.QUOTA_BYTES;

      return bytesInUse >= quota;
    } catch (error) {
      throw new StorageExtensionError('Failed to check storage quota', 'STORAGE_QUOTA_CHECK', {
        error,
      });
    }
  }

  /**
   * Gets storage statistics
   *
   * @returns Promise resolving to storage statistics
   */
  public async getStorageStats(): Promise<StorageStats> {
    try {
      const bytesInUse = await this.getBytesInUse();
      const quota = chrome.storage.sync.QUOTA_BYTES;
      const quotaPercentage = Math.round((bytesInUse / quota) * 100);

      return {
        bytesInUse,
        quota,
        quotaPercentage,
        remainingBytes: quota - bytesInUse,
        isNearQuota: quotaPercentage >= 80,
        isQuotaExceeded: bytesInUse >= quota,
      };
    } catch (error) {
      throw new StorageExtensionError('Failed to get storage statistics', 'STORAGE_STATS', {
        error,
      });
    }
  }

  /**
   * Batch get multiple keys at once
   *
   * @param keys - Array of keys to retrieve
   * @returns Promise resolving to record of key-value pairs
   */
  public async getMultiple<T>(keys: string[]): Promise<Record<string, T | null>> {
    try {
      return new Promise<Record<string, T | null>>((resolve, reject) => {
        chrome.storage.sync.get(keys, (result: Record<string, T>) => {
          if (chrome.runtime.lastError) {
            reject(
              new StorageExtensionError(
                `Failed to get multiple keys: ${chrome.runtime.lastError.message}`,
                'STORAGE_GET_MULTIPLE',
                { keys, error: chrome.runtime.lastError }
              )
            );
            return;
          }

          // Ensure all requested keys are present in the result, with null for missing ones
          const normalizedResult: Record<string, T | null> = {};
          keys.forEach(key => {
            normalizedResult[key] = result[key] !== undefined ? result[key] : null;
          });

          resolve(normalizedResult);
        });
      });
    } catch (error) {
      throw new StorageExtensionError(
        'Storage getMultiple operation failed',
        'STORAGE_GET_MULTIPLE',
        { keys, error }
      );
    }
  }

  /**
   * Batch set multiple key-value pairs at once
   *
   * @param items - Record of key-value pairs to store
   */
  public async setMultiple<T>(items: Record<string, T>): Promise<void> {
    try {
      return new Promise<void>((resolve, reject) => {
        chrome.storage.sync.set(items, () => {
          if (chrome.runtime.lastError) {
            reject(
              new StorageExtensionError(
                `Failed to set multiple items: ${chrome.runtime.lastError.message}`,
                'STORAGE_SET_MULTIPLE',
                { items, error: chrome.runtime.lastError }
              )
            );
            return;
          }

          resolve();
        });
      });
    } catch (error) {
      throw new StorageExtensionError(
        'Storage setMultiple operation failed',
        'STORAGE_SET_MULTIPLE',
        { items, error }
      );
    }
  }
}

/**
 * Storage statistics interface
 */
export interface StorageStats {
  readonly bytesInUse: number;
  readonly quota: number;
  readonly quotaPercentage: number;
  readonly remainingBytes: number;
  readonly isNearQuota: boolean;
  readonly isQuotaExceeded: boolean;
}

/**
 * Default storage service instance
 */
export const storageService = new StorageService();
