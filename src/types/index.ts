// Central Type Exports for Clean Imports
// Following the pseudocode from Phase 2.1 - Core Type Definitions Creation Algorithm

// Core type exports
export * from './chrome-messages';
export * from './domain';
export * from './services';
export * from './validation';
export * from './chrome-extensions';

// Re-export commonly used types with shorter aliases
export type { ChromeMessage, ChromeMessageResponse, MessageAction } from './chrome-messages';

import { Domain } from './domain';

export { Domain };

// Re-export Domain namespace types with aliases
export type ApiKey = Domain.ApiKey;
export type PromptTemplate = Domain.PromptTemplate;
export type ExecutionConfig = Domain.ExecutionConfig;
export type ExecutionResult = Domain.ExecutionResult;
export type UserSettings = Domain.UserSettings;
export type ErrorCode = Domain.ErrorCode;

export type {
  IStorageService,
  IMessagingService,
  IGeminiClient,
  IPromptExecutor,
  IApiKeyService,
} from './services';

export type { ValidationResult, ValidationError, Result } from './validation';

export type {
  ChromeStorageSchema,
  StorageKey,
  StorageValue,
  TypedStorageArea,
} from './chrome-extensions';

// Utility Types
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type Nullable<T> = T | null;

export type NonNullable<T> = T extends null | undefined ? never : T;

// Branded types for type safety
export type ApiKeyString = string & { readonly brand: unique symbol };
export type TemplateId = string & { readonly brand: unique symbol };
export type TabId = number & { readonly brand: unique symbol };
export type RequestId = string & { readonly brand: unique symbol };

// Type helper functions
export const createApiKey = (value: string): ApiKeyString => value as ApiKeyString;
export const createTemplateId = (value: string): TemplateId => value as TemplateId;
export const createTabId = (value: number): TabId => value as TabId;
export const createRequestId = (): RequestId =>
  `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` as RequestId;

// Generic response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  metadata?: {
    timestamp: Date;
    requestId: RequestId;
    duration?: number;
  };
}

// Event types
export interface DomainEvent<T = any> {
  type: string;
  payload: T;
  timestamp: Date;
  source: string;
}

export interface SystemEvent extends DomainEvent {
  type: 'system.startup' | 'system.shutdown' | 'system.error';
  payload: {
    message: string;
    details?: unknown;
  };
}

export interface UserEvent extends DomainEvent {
  type: 'user.action' | 'user.setting_changed' | 'user.error';
  payload: {
    action: string;
    context?: string;
    data?: unknown;
  };
}

export interface ApiEvent extends DomainEvent {
  type: 'api.request' | 'api.response' | 'api.error';
  payload: {
    endpoint: string;
    method?: string;
    statusCode?: number;
    data?: unknown;
  };
}

export type ExtensionEvent = SystemEvent | UserEvent | ApiEvent;

// Configuration types
export interface ExtensionConfig {
  readonly api: {
    readonly baseUrl: string;
    readonly timeout: number;
    readonly retries: number;
  };
  readonly ui: {
    readonly theme: 'light' | 'dark' | 'auto';
    readonly animations: boolean;
    readonly compactMode: boolean;
  };
  readonly features: {
    readonly autoSummarize: boolean;
    readonly smartTemplates: boolean;
    readonly analyticsEnabled: boolean;
  };
  readonly performance: {
    readonly maxCacheSize: number;
    readonly backgroundTimeout: number;
    readonly contentScriptTimeout: number;
  };
}

// Error types hierarchy
export abstract class BaseExtensionError extends Error {
  abstract readonly code: string;
  abstract readonly context: string;
  readonly timestamp: Date = new Date();

  constructor(
    message: string,
    public readonly metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationExtensionError extends BaseExtensionError {
  readonly code = 'VALIDATION_ERROR';
  constructor(
    message: string,
    public readonly context: string,
    metadata?: Record<string, unknown>
  ) {
    super(message, metadata);
  }
}

export class NetworkExtensionError extends BaseExtensionError {
  readonly code = 'NETWORK_ERROR';
  constructor(
    message: string,
    public readonly context: string,
    metadata?: Record<string, unknown>
  ) {
    super(message, metadata);
  }
}

export class StorageExtensionError extends BaseExtensionError {
  readonly code = 'STORAGE_ERROR';
  constructor(
    message: string,
    public readonly context: string,
    metadata?: Record<string, unknown>
  ) {
    super(message, metadata);
  }
}

export class ChromeApiExtensionError extends BaseExtensionError {
  readonly code = 'CHROME_API_ERROR';
  constructor(
    message: string,
    public readonly context: string,
    metadata?: Record<string, unknown>
  ) {
    super(message, metadata);
  }
}

// Type assertion helpers
export const assertIsString = (value: unknown, fieldName: string): asserts value is string => {
  if (typeof value !== 'string') {
    throw new ValidationExtensionError(`${fieldName} must be a string`, 'TYPE_ASSERTION');
  }
};

export const assertIsNumber = (value: unknown, fieldName: string): asserts value is number => {
  if (typeof value !== 'number' || isNaN(value)) {
    throw new ValidationExtensionError(`${fieldName} must be a number`, 'TYPE_ASSERTION');
  }
};

export const assertIsObject = (
  value: unknown,
  fieldName: string
): asserts value is Record<string, unknown> => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new ValidationExtensionError(`${fieldName} must be an object`, 'TYPE_ASSERTION');
  }
};

// Promise utility types
export type PromiseResolveType<T> = T extends Promise<infer U> ? U : T;
export type AsyncReturnType<T extends (...args: any) => Promise<any>> = PromiseResolveType<
  ReturnType<T>
>;

// Function utility types
export type AsyncFunction<TArgs extends readonly unknown[] = any[], TReturn = any> = (
  ...args: TArgs
) => Promise<TReturn>;

export type SyncFunction<TArgs extends readonly unknown[] = any[], TReturn = any> = (
  ...args: TArgs
) => TReturn;

// Array utility types
export type NonEmptyArray<T> = [T, ...T[]];
export type ArrayElement<T> = T extends readonly (infer U)[] ? U : never;
