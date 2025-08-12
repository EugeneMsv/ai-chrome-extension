// Validation Type Definitions
// Following the pseudocode from Phase 2.1 - Core Type Definitions Creation Algorithm

import { Domain } from './domain';

export interface ValidationRule<T> {
  readonly validate: (value: unknown) => value is T;
  readonly message: string;
}

export interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly ValidationError[];
}

export interface ValidationError {
  readonly field: string;
  readonly message: string;
  readonly code: string;
}

export type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E };

// Type Guards
export const TypeGuards = {
  isString: (value: unknown): value is string => typeof value === 'string',

  isNumber: (value: unknown): value is number => typeof value === 'number' && !isNaN(value),

  isBoolean: (value: unknown): value is boolean => typeof value === 'boolean',

  isObject: (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value),

  isArray: <T>(value: unknown, itemGuard?: (item: unknown) => item is T): value is T[] =>
    Array.isArray(value) && (itemGuard ? value.every(itemGuard) : true),

  isValidApiKey: (value: unknown): value is string =>
    TypeGuards.isString(value) && value.length > 0 && /^[A-Za-z0-9_-]+$/.test(value),

  isValidUrl: (value: unknown): value is string =>
    TypeGuards.isString(value) && /^https?:\/\/.+/.test(value),

  isValidEmail: (value: unknown): value is string =>
    TypeGuards.isString(value) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),

  isPromptTemplate: (value: unknown): value is Domain.PromptTemplate => {
    return (
      TypeGuards.isObject(value) &&
      'id' in value &&
      'name' in value &&
      'prompt' in value &&
      'category' in value &&
      'variables' in value &&
      'metadata' in value &&
      TypeGuards.isString((value as any).id) &&
      TypeGuards.isString((value as any).name) &&
      TypeGuards.isString((value as any).prompt) &&
      TypeGuards.isString((value as any).category) &&
      TypeGuards.isArray((value as any).variables, TypeGuards.isString) &&
      TypeGuards.isTemplateMetadata((value as any).metadata)
    );
  },

  isTemplateMetadata: (value: unknown): value is Domain.TemplateMetadata => {
    return (
      TypeGuards.isObject(value) &&
      'createdAt' in value &&
      'updatedAt' in value &&
      'version' in value &&
      'author' in value &&
      'tags' in value &&
      (value as any).createdAt instanceof Date &&
      (value as any).updatedAt instanceof Date &&
      TypeGuards.isNumber((value as any).version) &&
      TypeGuards.isString((value as any).author) &&
      TypeGuards.isArray((value as any).tags, TypeGuards.isString)
    );
  },

  isExecutionConfig: (value: unknown): value is Domain.ExecutionConfig => {
    return (
      TypeGuards.isObject(value) &&
      'maxOutputTokens' in value &&
      'temperature' in value &&
      'topP' in value &&
      TypeGuards.isNumber((value as any).maxOutputTokens) &&
      TypeGuards.isNumber((value as any).temperature) &&
      TypeGuards.isNumber((value as any).topP) &&
      (value as any).maxOutputTokens > 0 &&
      (value as any).maxOutputTokens <= 32768 &&
      (value as any).temperature >= 0 &&
      (value as any).temperature <= 2 &&
      (value as any).topP >= 0 &&
      (value as any).topP <= 1 &&
      (!('topK' in value) || TypeGuards.isNumber((value as any).topK)) &&
      (!('stopSequences' in value) ||
        TypeGuards.isArray((value as any).stopSequences, TypeGuards.isString))
    );
  },

  isUserSettings: (value: unknown): value is Domain.UserSettings => {
    return (
      TypeGuards.isObject(value) &&
      'maxOutputTokens' in value &&
      'blockedDomains' in value &&
      'promptTemplates' in value &&
      'autoSummarize' in value &&
      TypeGuards.isNumber((value as any).maxOutputTokens) &&
      TypeGuards.isArray((value as any).blockedDomains, TypeGuards.isString) &&
      TypeGuards.isArray((value as any).promptTemplates, TypeGuards.isPromptTemplate) &&
      TypeGuards.isBoolean((value as any).autoSummarize)
    );
  },

  isDomainBlockingRule: (value: unknown): value is Domain.DomainBlockingRule => {
    return (
      TypeGuards.isObject(value) &&
      'domain' in value &&
      'isBlocked' in value &&
      'addedAt' in value &&
      TypeGuards.isString((value as any).domain) &&
      TypeGuards.isBoolean((value as any).isBlocked) &&
      (value as any).addedAt instanceof Date &&
      (!('reason' in value) || TypeGuards.isString((value as any).reason))
    );
  },
} as const;

// Validation Rules Factory
export class ValidationRulesFactory {
  static createApiKeyRule(): ValidationRule<string> {
    return {
      validate: TypeGuards.isValidApiKey,
      message:
        'API key must be a non-empty string containing only alphanumeric characters, hyphens, and underscores',
    };
  }

  static createRequiredStringRule(fieldName: string): ValidationRule<string> {
    return {
      validate: (value): value is string => TypeGuards.isString(value) && value.trim().length > 0,
      message: `${fieldName} is required and must be a non-empty string`,
    };
  }

  static createNumberRangeRule(
    fieldName: string,
    min: number,
    max: number
  ): ValidationRule<number> {
    return {
      validate: (value): value is number =>
        TypeGuards.isNumber(value) && value >= min && value <= max,
      message: `${fieldName} must be a number between ${min} and ${max}`,
    };
  }

  static createArrayRule<T>(
    fieldName: string,
    itemValidator: (item: unknown) => item is T
  ): ValidationRule<T[]> {
    return {
      validate: (value): value is T[] => TypeGuards.isArray(value, itemValidator),
      message: `${fieldName} must be an array with valid items`,
    };
  }
}

// Validator Class for Complex Validations
export class Validator {
  static validateApiKey(apiKey: unknown): Result<string, ValidationError> {
    if (!TypeGuards.isString(apiKey)) {
      return {
        success: false,
        error: new ValidationError('apiKey', 'API key must be a string', 'INVALID_TYPE'),
      };
    }

    if (apiKey.length < 10) {
      return {
        success: false,
        error: new ValidationError('apiKey', 'API key too short', 'INVALID_LENGTH'),
      };
    }

    if (!/^[A-Za-z0-9_-]+$/.test(apiKey)) {
      return {
        success: false,
        error: new ValidationError(
          'apiKey',
          'API key contains invalid characters',
          'INVALID_FORMAT'
        ),
      };
    }

    return { success: true, data: apiKey };
  }

  static validatePromptInput(input: unknown): Result<string, ValidationError> {
    if (!TypeGuards.isString(input)) {
      return {
        success: false,
        error: new ValidationError('input', 'Prompt input must be a string', 'INVALID_TYPE'),
      };
    }

    if (input.length === 0) {
      return {
        success: false,
        error: new ValidationError('input', 'Prompt input cannot be empty', 'EMPTY_INPUT'),
      };
    }

    if (input.length > 32000) {
      // Approximate token limit
      return {
        success: false,
        error: new ValidationError('input', 'Prompt input too long', 'INPUT_TOO_LONG'),
      };
    }

    return { success: true, data: input };
  }

  static validateExecutionConfig(config: unknown): Result<Domain.ExecutionConfig, ValidationError> {
    if (!TypeGuards.isExecutionConfig(config)) {
      return {
        success: false,
        error: new ValidationError('config', 'Invalid execution configuration', 'INVALID_CONFIG'),
      };
    }

    return { success: true, data: config };
  }

  static validateUserSettings(settings: unknown): Result<Domain.UserSettings, ValidationError> {
    if (!TypeGuards.isUserSettings(settings)) {
      return {
        success: false,
        error: new ValidationError('settings', 'Invalid user settings', 'INVALID_SETTINGS'),
      };
    }

    return { success: true, data: settings };
  }
}

// Custom Error Class
export class ValidationError extends Error {
  constructor(
    public readonly field: string,
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// HTML/Input Sanitization Utilities
export class SanitizationUtils {
  static sanitizeHtmlInput(input: string): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  static sanitizeForFilename(input: string): string {
    return input
      .replace(/[^\w\s.-]/g, '')
      .replace(/\s+/g, '_')
      .toLowerCase();
  }

  static sanitizeUrl(url: string): string {
    try {
      const urlObject = new URL(url);
      return urlObject.toString();
    } catch {
      return '';
    }
  }
}
