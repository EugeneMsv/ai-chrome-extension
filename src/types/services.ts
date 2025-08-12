// Service Interface Definitions
// Following the pseudocode from Phase 2.1 - Core Type Definitions Creation Algorithm

import { Domain } from './domain';
import { ChromeMessage, ChromeMessageResponse } from './chrome-messages';

export interface IStorageService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}

export interface IMessagingService {
  sendMessage<TRequest extends ChromeMessage, TResponse extends ChromeMessageResponse>(
    message: TRequest
  ): Promise<TResponse>;
  onMessage<TRequest extends ChromeMessage, TResponse extends ChromeMessageResponse>(
    handler: (message: TRequest) => Promise<TResponse>
  ): void;
  removeMessageListener(): void;
}

export interface IGeminiClient {
  generateContent(prompt: string, config: Domain.GenerationConfig): Promise<Domain.GeminiResponse>;
  validateApiKey(apiKey: string): Promise<boolean>;
  testConnection(): Promise<boolean>;
}

export interface IPromptExecutor {
  execute(
    text: string,
    template: Domain.PromptTemplate,
    config: Domain.ExecutionConfig
  ): Promise<Domain.ExecutionResult>;
  validateTemplate(template: Domain.PromptTemplate): boolean;
}

export interface IApiKeyService {
  getApiKey(): Promise<Domain.ApiKey | null>;
  setApiKey(apiKey: string): Promise<void>;
  validateApiKey(apiKey: string): Promise<boolean>;
  clearApiKey(): Promise<void>;
}

export interface IPromptTemplateService {
  getTemplates(): Promise<Domain.PromptTemplate[]>;
  getTemplate(id: string): Promise<Domain.PromptTemplate | null>;
  saveTemplate(template: Domain.PromptTemplate): Promise<void>;
  deleteTemplate(id: string): Promise<void>;
  getDefaultTemplates(): Domain.PromptTemplate[];
}

export interface IUserSettingsService {
  getSettings(): Promise<Domain.UserSettings>;
  updateSettings(settings: Partial<Domain.UserSettings>): Promise<void>;
  resetSettings(): Promise<void>;
}

export interface IDomainBlockerService {
  isBlocked(domain: string): Promise<boolean>;
  addBlockedDomain(domain: string, reason?: string): Promise<void>;
  removeBlockedDomain(domain: string): Promise<void>;
  getBlockedDomains(): Promise<Domain.DomainBlockingRule[]>;
}

export interface IContentProcessorService {
  extractText(element: Element): string;
  analyzeContent(text: string): Domain.ContentAnalysis;
  processSelectedText(text: string, action: string): Promise<string>;
}

export interface ITabsService {
  getCurrentTab(): Promise<chrome.tabs.Tab | null>;
  executeScript<T>(tabId: number, func: () => T): Promise<T>;
  sendMessageToTab<T>(tabId: number, message: ChromeMessage): Promise<T>;
}

export interface ILoggerService {
  info(message: string, context?: string, metadata?: Record<string, unknown>): void;
  warn(message: string, context?: string, metadata?: Record<string, unknown>): void;
  error(message: string, error?: Error, context?: string, metadata?: Record<string, unknown>): void;
  debug(message: string, context?: string, metadata?: Record<string, unknown>): void;
}

export interface IEnvironmentService {
  isDevelopment(): boolean;
  isProduction(): boolean;
  getApiEndpoint(): string;
  getFeatureFlag(flag: string): boolean;
}

// Service locator interface for dependency injection
export interface IServiceContainer {
  register<T>(key: string, service: T): void;
  resolve<T>(key: string): T;
  registerSingleton<T>(key: string, factory: () => T): void;
}

// Factory interfaces
export interface IPromptTemplateFactory {
  createTemplate(
    name: string,
    prompt: string,
    category: string,
    variables: string[]
  ): Domain.PromptTemplate;
}

export interface IMessageFactory {
  createMessage<T extends ChromeMessage>(action: T['action'], payload?: any): T;
}

// Event handling interfaces
export interface IEventBus {
  emit<T>(event: string, data: T): void;
  on<T>(event: string, handler: (data: T) => void): void;
  off(event: string, handler: Function): void;
}

export interface IUIStateManager {
  getState(): UIState;
  setState(updates: Partial<UIState>): void;
  subscribe(callback: (state: UIState) => void): () => void;
}

export interface UIState {
  readonly isProcessing: boolean;
  readonly lastError: string | null;
  readonly selectedText: string | null;
  readonly currentPage: {
    url: string;
    title: string;
  } | null;
  readonly apiKeyStatus: {
    isConfigured: boolean;
    isValid: boolean;
    lastValidated: Date | null;
  };
}
