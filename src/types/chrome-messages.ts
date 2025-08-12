// Chrome Message Type Definitions
// Following the pseudocode from Phase 2.1 - Core Type Definitions Creation Algorithm

// Message Actions Enum
export const MessageActions = {
  GET_API_KEY: 'GET_API_KEY',
  SET_API_KEY: 'SET_API_KEY',
  VALIDATE_API_KEY: 'VALIDATE_API_KEY',
  EXECUTE_PROMPT: 'EXECUTE_PROMPT',
  GET_PROMPT_TEMPLATES: 'GET_PROMPT_TEMPLATES',
  GET_SETTINGS: 'GET_SETTINGS',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  PROCESS_SELECTED_TEXT: 'PROCESS_SELECTED_TEXT',
  EXTRACT_PAGE_CONTENT: 'EXTRACT_PAGE_CONTENT',
  // Legacy message actions for backward compatibility
  getApiKey: 'getApiKey',
  saveApiKey: 'saveApiKey',
  validateApiKey: 'validateApiKey',
  getPromptTemplates: 'getPromptTemplates',
  savePromptTemplate: 'savePromptTemplate',
  deletePromptTemplate: 'deletePromptTemplate',
  isDomainBlocked: 'isDomainBlocked',
  getBlockedDomains: 'getBlockedDomains',
  addBlockedDomain: 'addBlockedDomain',
  removeBlockedDomain: 'removeBlockedDomain',
  domainBlockStatusChanged: 'domainBlockStatusChanged',
  apiKeyUpdated: 'apiKeyUpdated',
  ping: 'ping',
} as const;

export type MessageAction = (typeof MessageActions)[keyof typeof MessageActions];

// Base message interface
export interface BaseMessage {
  action: MessageAction;
  requestId?: string;
  timestamp?: number;
}

// Simple message interface for legacy support
export interface SimpleMessage {
  action: string;
  payload?: unknown;
}

// Request/Response type definitions
export interface GetApiKeyRequest extends BaseMessage {
  action: 'GET_API_KEY';
}

export interface GetApiKeyResponse {
  success: boolean;
  apiKey?: string;
  data?: unknown;
  error?: string;
}

export interface SetApiKeyRequest extends BaseMessage {
  action: 'SET_API_KEY';
  payload: {
    apiKey: string;
  };
}

export interface SetApiKeyResponse {
  success: boolean;
  data?: unknown;
  error?: string | { code: string; message: string; details?: unknown };
}

export interface ValidateApiKeyRequest extends BaseMessage {
  action: 'VALIDATE_API_KEY';
  payload: {
    apiKey: string;
  };
}

export interface ValidateApiKeyResponse {
  success: boolean;
  isValid: boolean;
  error?: string;
}

export interface ExecutePromptRequest extends BaseMessage {
  action: 'EXECUTE_PROMPT';
  payload: {
    text: string;
    templateId: string;
    config: ExecutionConfig;
  };
}

export interface ExecutePromptResponse {
  success: boolean;
  result?: string;
  error?: string;
  metadata?: ExecutionMetadata;
}

export interface GetPromptTemplatesRequest extends BaseMessage {
  action: 'GET_PROMPT_TEMPLATES';
}

export interface GetPromptTemplatesResponse {
  success: boolean;
  templates?: PromptTemplate[];
  error?: string;
}

export interface GetSettingsRequest extends BaseMessage {
  action: 'GET_SETTINGS';
}

export interface GetSettingsResponse {
  success: boolean;
  settings?: UserSettings;
  error?: string;
}

export interface UpdateSettingsRequest extends BaseMessage {
  action: 'UPDATE_SETTINGS';
  payload: {
    settings: Partial<UserSettings>;
  };
}

export interface UpdateSettingsResponse {
  success: boolean;
  error?: string;
}

export interface ProcessSelectedTextRequest extends BaseMessage {
  action: 'PROCESS_SELECTED_TEXT';
  payload: {
    text: string;
    action: string;
  };
}

export interface ProcessSelectedTextResponse {
  success: boolean;
  result?: string;
  error?: string;
}

export interface ExtractPageContentRequest extends BaseMessage {
  action: 'EXTRACT_PAGE_CONTENT';
}

export interface ExtractPageContentResponse {
  success: boolean;
  content?: string;
  error?: string;
}

// Union type for all messages
export type ChromeMessage =
  | GetApiKeyRequest
  | SetApiKeyRequest
  | ValidateApiKeyRequest
  | ExecutePromptRequest
  | GetPromptTemplatesRequest
  | GetSettingsRequest
  | UpdateSettingsRequest
  | ProcessSelectedTextRequest
  | ExtractPageContentRequest
  | SimpleMessage;

// Generic response interface
export interface GenericResponse {
  success: boolean;
  data?: unknown;
  error?: string | { code: string; message: string; details?: unknown };
}

// Union type for all responses
export type ChromeMessageResponse =
  | GetApiKeyResponse
  | SetApiKeyResponse
  | ValidateApiKeyResponse
  | ExecutePromptResponse
  | GetPromptTemplatesResponse
  | GetSettingsResponse
  | UpdateSettingsResponse
  | ProcessSelectedTextResponse
  | ExtractPageContentResponse
  | GenericResponse;

// Forward declarations for types that will be defined in domain.ts
export interface ExecutionConfig {
  readonly maxOutputTokens: number;
  readonly temperature: number;
  readonly topP: number;
  readonly topK?: number;
  readonly stopSequences?: readonly string[];
}

export interface ExecutionMetadata {
  readonly requestId: string;
  readonly timestamp: Date;
  readonly duration: number;
  readonly tokenUsage: TokenUsage;
}

export interface TokenUsage {
  readonly promptTokens: number;
  readonly completionTokens: number;
  readonly totalTokens: number;
}

export interface PromptTemplate {
  readonly id: string;
  readonly name: string;
  readonly prompt: string;
  readonly category: string;
  readonly variables: readonly string[];
  readonly metadata: TemplateMetadata;
}

export interface TemplateMetadata {
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly version: number;
  readonly author: string;
  readonly tags: readonly string[];
}

export interface UserSettings {
  readonly maxOutputTokens: number;
  readonly blockedDomains: readonly string[];
  readonly promptTemplates: readonly PromptTemplate[];
  readonly autoSummarize: boolean;
}
