// API Key Service - Domain Layer Implementation
// Following Clean Architecture patterns and TDD approach

import type { IApiKeyService, IStorageService } from '@/types/services';
import type { Domain } from '@/types/domain';
import { Validator, ValidationError } from '@/types/validation';

/**
 * API Key Service - Manages Gemini API key storage, validation, and lifecycle
 *
 * This service handles:
 * - Secure storage and retrieval of API keys
 * - API key format validation
 * - Validation status tracking
 * - API key lifecycle management
 */
export class ApiKeyService implements IApiKeyService {
  private static readonly API_KEY_STORAGE_KEY = 'geminiApiKey';
  private static readonly API_KEY_VALIDATION_KEY = 'apiKeyValidation';

  constructor(private readonly storageService: IStorageService) {}

  /**
   * Retrieves the stored API key with validation status
   *
   * @returns Promise resolving to API key domain object or null if not found
   */
  public async getApiKey(): Promise<Domain.ApiKey | null> {
    try {
      const storedKey = await this.storageService.get<string>(ApiKeyService.API_KEY_STORAGE_KEY);

      if (!storedKey) {
        return null;
      }

      // Get validation status
      const validationData = await this.storageService.get<ApiKeyValidationData>(
        ApiKeyService.API_KEY_VALIDATION_KEY
      );

      return {
        value: storedKey,
        isValid: validationData?.isValid ?? false,
        validatedAt: validationData?.lastValidated ? new Date(validationData.lastValidated) : null,
        source: 'user',
      };
    } catch (error) {
      throw new Error(
        `Failed to retrieve API key: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Stores an API key after validation
   *
   * @param apiKey - The API key to store
   * @throws ValidationExtensionError if the API key format is invalid
   */
  public async setApiKey(apiKey: string): Promise<void> {
    // Validate API key format before storing
    const validationResult = Validator.validateApiKey(apiKey);
    if (!validationResult.success) {
      throw validationResult.error;
    }

    // Additional format validation for Gemini API keys
    if (!this.isValidGeminiApiKeyFormat(apiKey)) {
      throw new ValidationError(
        'apiKey',
        'Invalid Gemini API key format. Expected format: AIzaSy followed by alphanumeric characters',
        'API_KEY_FORMAT'
      );
    }

    try {
      // Store the API key
      await this.storageService.set(ApiKeyService.API_KEY_STORAGE_KEY, apiKey);

      // Initialize validation status
      const validationData: ApiKeyValidationData = {
        isValid: false, // Not yet validated
        lastValidated: null,
      };

      await this.storageService.set(ApiKeyService.API_KEY_VALIDATION_KEY, validationData);
    } catch (error) {
      throw new Error(
        `Failed to store API key: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Validates an API key format and optionally updates validation status
   *
   * @param apiKey - The API key to validate
   * @returns Promise resolving to true if valid
   */
  public async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const isValidFormat = this.isValidGeminiApiKeyFormat(apiKey);

      // Check if this is the currently stored API key
      const storedKey = await this.storageService.get<string>(ApiKeyService.API_KEY_STORAGE_KEY);

      if (storedKey === apiKey && isValidFormat) {
        // Update validation status for stored key
        const validationData: ApiKeyValidationData = {
          isValid: true,
          lastValidated: new Date().toISOString(),
        };

        await this.storageService.set(ApiKeyService.API_KEY_VALIDATION_KEY, validationData);
      }

      return isValidFormat;
    } catch (error) {
      console.error('Error validating API key:', error);
      return false;
    }
  }

  /**
   * Removes the stored API key and validation data
   */
  public async clearApiKey(): Promise<void> {
    try {
      await Promise.all([
        this.storageService.remove(ApiKeyService.API_KEY_STORAGE_KEY),
        this.storageService.remove(ApiKeyService.API_KEY_VALIDATION_KEY),
      ]);
    } catch (error) {
      throw new Error(
        `Failed to clear API key: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Checks if an API key is configured (exists in storage)
   *
   * @returns Promise resolving to true if API key exists
   */
  public async isApiKeyConfigured(): Promise<boolean> {
    try {
      const storedKey = await this.storageService.get<string>(ApiKeyService.API_KEY_STORAGE_KEY);
      return storedKey !== null && storedKey.length > 0;
    } catch (error) {
      console.error('Error checking API key configuration:', error);
      return false;
    }
  }

  /**
   * Re-validates the currently stored API key
   *
   * @returns Promise resolving to true if the stored key is valid
   */
  public async refreshValidation(): Promise<boolean> {
    try {
      const storedKey = await this.storageService.get<string>(ApiKeyService.API_KEY_STORAGE_KEY);

      if (!storedKey) {
        return false;
      }

      return await this.validateApiKey(storedKey);
    } catch (error) {
      console.error('Error refreshing API key validation:', error);
      return false;
    }
  }

  /**
   * Gets API key statistics and metadata
   *
   * @returns Promise resolving to API key statistics
   */
  public async getApiKeyStats(): Promise<ApiKeyStats> {
    try {
      const apiKey = await this.getApiKey();

      if (!apiKey) {
        return {
          isConfigured: false,
          isValid: false,
          validatedAt: null,
          daysSinceValidation: null,
          needsRevalidation: true,
        };
      }

      const daysSinceValidation = apiKey.validatedAt
        ? Math.floor((Date.now() - apiKey.validatedAt.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      // Consider revalidation needed if > 7 days or never validated
      const needsRevalidation =
        !apiKey.validatedAt || (daysSinceValidation !== null && daysSinceValidation > 7);

      return {
        isConfigured: true,
        isValid: apiKey.isValid,
        validatedAt: apiKey.validatedAt,
        daysSinceValidation,
        needsRevalidation,
      };
    } catch (error) {
      throw new Error(
        `Failed to get API key stats: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Validates Gemini API key format
   *
   * @param apiKey - The API key to check
   * @returns boolean indicating if format is valid
   */
  private isValidGeminiApiKeyFormat(apiKey: string): boolean {
    if (!apiKey || typeof apiKey !== 'string') {
      return false;
    }

    // Gemini API keys typically start with "AIzaSy" followed by alphanumeric characters
    const geminiApiKeyPattern = /^AIzaSy[A-Za-z0-9_-]+$/;

    return (
      apiKey.length >= 35 && // Minimum realistic length
      apiKey.length <= 50 && // Maximum realistic length
      geminiApiKeyPattern.test(apiKey)
    );
  }
}

/**
 * API Key validation data interface
 */
interface ApiKeyValidationData {
  isValid: boolean;
  lastValidated: string | null;
}

/**
 * API Key statistics interface
 */
export interface ApiKeyStats {
  readonly isConfigured: boolean;
  readonly isValid: boolean;
  readonly validatedAt: Date | null;
  readonly daysSinceValidation: number | null;
  readonly needsRevalidation: boolean;
}

/**
 * Factory function to create API Key Service with default storage
 */
export const createApiKeyService = (storageService: IStorageService): ApiKeyService => {
  return new ApiKeyService(storageService);
};
