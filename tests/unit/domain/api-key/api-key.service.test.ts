// API Key Service Tests
// Following TDD approach: Write tests FIRST, then implement

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ApiKeyService } from '@domain/api-key/api-key.service';
import { StorageService } from '@infrastructure/chrome-apis/storage.service';
import type { Domain } from '@types';
import { ValidationError } from '@types';

// Mock the storage service
vi.mock('@infrastructure/chrome-apis/storage.service');

describe('ApiKeyService', () => {
  let apiKeyService: ApiKeyService;
  let mockStorageService: StorageService;

  beforeEach(() => {
    mockStorageService = new StorageService() as any;
    apiKeyService = new ApiKeyService(mockStorageService);
    vi.clearAllMocks();
  });

  describe('getApiKey', () => {
    it('should return a valid API key when stored', async () => {
      // Arrange
      const storedApiKey = 'valid-api-key-12345';
      const validationResult = {
        isValid: true,
        lastValidated: new Date('2024-01-01T00:00:00.000Z').toISOString(),
      };

      vi.mocked(mockStorageService.get).mockImplementation((key: string) => {
        if (key === 'geminiApiKey') return Promise.resolve(storedApiKey);
        if (key === 'apiKeyValidation') return Promise.resolve(validationResult);
        return Promise.resolve(null);
      });

      // Act
      const result = await apiKeyService.getApiKey();

      // Assert
      expect(result).not.toBeNull();
      expect(result?.value).toBe(storedApiKey);
      expect(result?.isValid).toBe(true);
      expect(result?.source).toBe('user');
      expect(mockStorageService.get).toHaveBeenCalledWith('geminiApiKey');
      expect(mockStorageService.get).toHaveBeenCalledWith('apiKeyValidation');
    });

    it('should return null when no API key is stored', async () => {
      // Arrange
      vi.mocked(mockStorageService.get).mockResolvedValue(null);

      // Act
      const result = await apiKeyService.getApiKey();

      // Assert
      expect(result).toBeNull();
      expect(mockStorageService.get).toHaveBeenCalledWith('geminiApiKey');
    });

    it('should return API key with isValid false when validation data is missing', async () => {
      // Arrange
      const storedApiKey = 'valid-api-key-12345';
      vi.mocked(mockStorageService.get).mockImplementation((key: string) => {
        if (key === 'geminiApiKey') return Promise.resolve(storedApiKey);
        return Promise.resolve(null);
      });

      // Act
      const result = await apiKeyService.getApiKey();

      // Assert
      expect(result).not.toBeNull();
      expect(result?.value).toBe(storedApiKey);
      expect(result?.isValid).toBe(false);
      expect(result?.validatedAt).toBeNull();
    });

    it('should handle storage errors gracefully', async () => {
      // Arrange
      vi.mocked(mockStorageService.get).mockRejectedValue(new Error('Storage error'));

      // Act & Assert
      await expect(apiKeyService.getApiKey()).rejects.toThrow('Storage error');
    });
  });

  describe('setApiKey', () => {
    it('should store a valid API key', async () => {
      // Arrange
      const validApiKey = 'AIzaSyDemoKey123456789_ValidGeminiApiKey';
      vi.mocked(mockStorageService.set).mockResolvedValue(void 0);

      // Act
      await apiKeyService.setApiKey(validApiKey);

      // Assert
      expect(mockStorageService.set).toHaveBeenCalledWith('geminiApiKey', validApiKey);
      expect(mockStorageService.set).toHaveBeenCalledWith('apiKeyValidation', {
        isValid: false, // Not yet validated
        lastValidated: null,
      });
    });

    it('should reject invalid API key format', async () => {
      // Arrange
      const invalidApiKey = 'invalid-key!@#$%';

      // Act & Assert
      await expect(apiKeyService.setApiKey(invalidApiKey)).rejects.toThrow(ValidationError);

      expect(mockStorageService.set).not.toHaveBeenCalled();
    });

    it('should reject empty API key', async () => {
      // Arrange
      const emptyApiKey = '';

      // Act & Assert
      await expect(apiKeyService.setApiKey(emptyApiKey)).rejects.toThrow(ValidationError);

      expect(mockStorageService.set).not.toHaveBeenCalled();
    });

    it('should handle storage errors during set', async () => {
      // Arrange
      const validApiKey = 'AIzaSyDemoKey123456789_ValidGeminiApiKey';
      vi.mocked(mockStorageService.set).mockRejectedValue(new Error('Storage quota exceeded'));

      // Act & Assert
      await expect(apiKeyService.setApiKey(validApiKey)).rejects.toThrow('Storage quota exceeded');
    });
  });

  describe('validateApiKey', () => {
    it('should validate a legitimate API key format', async () => {
      // Arrange
      const validApiKey = 'AIzaSyDemoKey123456789_ValidGeminiApiKey';

      // Act
      const isValid = await apiKeyService.validateApiKey(validApiKey);

      // Assert
      expect(isValid).toBe(true);
    });

    it('should reject API key with invalid characters', async () => {
      // Arrange
      const invalidApiKey = 'AIzaSy-invalid@key#$%';

      // Act
      const isValid = await apiKeyService.validateApiKey(invalidApiKey);

      // Assert
      expect(isValid).toBe(false);
    });

    it('should reject API key that is too short', async () => {
      // Arrange
      const shortApiKey = 'AIza123';

      // Act
      const isValid = await apiKeyService.validateApiKey(shortApiKey);

      // Assert
      expect(isValid).toBe(false);
    });

    it('should update validation status after successful validation', async () => {
      // Arrange
      const validApiKey = 'AIzaSyDemoKey123456789_ValidGeminiApiKey';
      vi.mocked(mockStorageService.set).mockResolvedValue(void 0);
      vi.mocked(mockStorageService.get).mockResolvedValue(validApiKey);

      // Act
      const isValid = await apiKeyService.validateApiKey(validApiKey);

      // Assert
      expect(isValid).toBe(true);
      expect(mockStorageService.set).toHaveBeenCalledWith('apiKeyValidation', {
        isValid: true,
        lastValidated: expect.any(String),
      });
    });
  });

  describe('clearApiKey', () => {
    it('should remove API key and validation data', async () => {
      // Arrange
      vi.mocked(mockStorageService.remove).mockResolvedValue(void 0);

      // Act
      await apiKeyService.clearApiKey();

      // Assert
      expect(mockStorageService.remove).toHaveBeenCalledWith('geminiApiKey');
      expect(mockStorageService.remove).toHaveBeenCalledWith('apiKeyValidation');
    });

    it('should handle storage errors during clear', async () => {
      // Arrange
      vi.mocked(mockStorageService.remove).mockRejectedValue(new Error('Permission denied'));

      // Act & Assert
      await expect(apiKeyService.clearApiKey()).rejects.toThrow('Permission denied');
    });
  });

  describe('isApiKeyConfigured', () => {
    it('should return true when API key exists', async () => {
      // Arrange
      vi.mocked(mockStorageService.get).mockResolvedValue('some-api-key');

      // Act
      const isConfigured = await apiKeyService.isApiKeyConfigured();

      // Assert
      expect(isConfigured).toBe(true);
    });

    it('should return false when no API key exists', async () => {
      // Arrange
      vi.mocked(mockStorageService.get).mockResolvedValue(null);

      // Act
      const isConfigured = await apiKeyService.isApiKeyConfigured();

      // Assert
      expect(isConfigured).toBe(false);
    });
  });

  describe('refreshValidation', () => {
    it('should re-validate existing API key', async () => {
      // Arrange
      const storedApiKey = 'AIzaSyDemoKey123456789_ValidGeminiApiKey';
      vi.mocked(mockStorageService.get).mockResolvedValue(storedApiKey);
      vi.mocked(mockStorageService.set).mockResolvedValue(void 0);

      // Act
      const isValid = await apiKeyService.refreshValidation();

      // Assert
      expect(isValid).toBe(true);
      expect(mockStorageService.set).toHaveBeenCalledWith('apiKeyValidation', {
        isValid: true,
        lastValidated: expect.any(String),
      });
    });

    it('should return false when no API key is stored', async () => {
      // Arrange
      vi.mocked(mockStorageService.get).mockResolvedValue(null);

      // Act
      const isValid = await apiKeyService.refreshValidation();

      // Assert
      expect(isValid).toBe(false);
      expect(mockStorageService.set).not.toHaveBeenCalled();
    });
  });
});
