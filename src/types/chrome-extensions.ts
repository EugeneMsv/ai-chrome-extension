// Chrome API Type Extensions
// Following the pseudocode from Phase 2.2 - Chrome API Type Extensions Algorithm

import { Domain } from './domain';

// Extended Chrome API Type Definitions
declare namespace chrome {
  // eslint-disable-line @typescript-eslint/no-unused-vars
  namespace storage {
    interface StorageArea {
      get<T = any>(callback: (items: T) => void): void;
      get<T = any>(keys: string | string[] | null, callback: (items: T) => void): void;
      set<T = any>(items: T, callback?: () => void): void;
    }
  }

  namespace runtime {
    interface Port {
      onMessage: {
        addListener<T = any>(callback: (message: T, port: Port) => void): void;
      };
      postMessage<T = any>(message: T): void;
    }
  }

  namespace tabs {
    interface Tab {
      id?: number;
      url?: string;
      title?: string;
      active: boolean;
      windowId: number;
    }
  }
}

// Type-safe Chrome Storage Schema
export type ChromeStorageSchema = {
  geminiApiKey: string;
  userSettings: Domain.UserSettings;
  promptTemplates: Domain.PromptTemplate[];
  blockedDomains: string[];
  maxOutputTokens: number;
  apiKeyValidation: {
    isValid: boolean;
    lastValidated: string; // ISO string date
  };
  extensionSettings: {
    theme: 'light' | 'dark' | 'auto';
    shortcuts: Record<string, string>;
    notifications: boolean;
  };
};

export type StorageKey = keyof ChromeStorageSchema;
export type StorageValue<K extends StorageKey> = ChromeStorageSchema[K];

// Chrome Message Type Safety
export interface ChromeMessageEnvelope<T = any> {
  type: string;
  payload: T;
  sender?: any;
  sendResponse?: (response: any) => void;
}

// Chrome Storage Wrapper Types
export interface TypedStorageArea {
  get<K extends StorageKey>(key: K): Promise<ChromeStorageSchema[K] | undefined>;
  get<K extends StorageKey>(keys: K[]): Promise<Partial<Pick<ChromeStorageSchema, K>>>;
  set<K extends StorageKey>(items: Partial<Pick<ChromeStorageSchema, K>>): Promise<void>;
  remove<K extends StorageKey>(keys: K | K[]): Promise<void>;
  clear(): Promise<void>;
}

// Chrome Runtime Message Handler Types
export type MessageHandler<TRequest, TResponse> = (
  message: TRequest,
  sender: any,
  sendResponse: (response: TResponse) => void
) => boolean | void;

export type AsyncMessageHandler<TRequest, TResponse> = (
  message: TRequest,
  sender: any
) => Promise<TResponse>;

// Chrome Notifications Types
export interface NotificationOptions {
  id: string;
  type: string;
  iconUrl: string;
  title: string;
  message: string;
  contextMessage?: string;
  priority?: number;
  eventTime?: number;
  buttons?: any[];
  imageUrl?: string;
  items?: any[];
  progress?: number;
  isClickable?: boolean;
}

// Chrome Script Injection Types
export interface ScriptInjectionOptions {
  tabId: number;
  code?: string;
  file?: string;
  allFrames?: boolean;
  frameId?: number;
  matchAboutBlank?: boolean;
  runAt?: string;
}

// Chrome Extension API Response Types
export interface ChromeApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
}

// Chrome Extension Lifecycle Events
export interface ExtensionLifecycleEvents {
  onInstalled: (details: any) => void;
  onStartup: () => void;
  onSuspend: () => void;
  onSuspendCanceled: () => void;
  onUpdateAvailable: (details: any) => void;
}

// Chrome Extension Permissions
export interface ExtensionPermissions {
  origins?: string[];
  permissions?: string[];
}

// Chrome Extension State Management
export interface ExtensionState {
  isActive: boolean;
  currentTab: any | null;
  apiKeyStatus: {
    configured: boolean;
    valid: boolean;
    lastChecked: Date | null;
  };
  recentActions: ExtensionAction[];
  errorLog: ExtensionError[];
}

export interface ExtensionAction {
  id: string;
  type: 'prompt_execution' | 'settings_update' | 'template_save';
  timestamp: Date;
  details: Record<string, any>;
  success: boolean;
}

export interface ExtensionError {
  id: string;
  message: string;
  stack?: string;
  timestamp: Date;
  context: string;
  metadata?: Record<string, any>;
}

// Utility Types for Chrome APIs
export type ChromeApiCallback<T> = (result: T) => void;
export type ChromeApiCallbackWithError<T> = (result?: T, error?: any) => void;

// Promise-wrapped Chrome API types
export interface PromisifiedChromeStorage {
  sync: {
    get: <T>(keys?: string | string[] | null) => Promise<T>;
    set: (items: Record<string, any>) => Promise<void>;
    remove: (keys: string | string[]) => Promise<void>;
    clear: () => Promise<void>;
    getBytesInUse: (keys?: string | string[]) => Promise<number>;
  };
  local: {
    get: <T>(keys?: string | string[] | null) => Promise<T>;
    set: (items: Record<string, any>) => Promise<void>;
    remove: (keys: string | string[]) => Promise<void>;
    clear: () => Promise<void>;
    getBytesInUse: (keys?: string | string[]) => Promise<number>;
  };
}

export interface PromisifiedChromeTabs {
  query: (queryInfo: any) => Promise<any[]>;
  get: (tabId: number) => Promise<any>;
  create: (createProperties: any) => Promise<any>;
  update: (tabId: number, updateProperties: any) => Promise<any>;
  remove: (tabIds: number | number[]) => Promise<void>;
  executeScript: <T>(tabId: number, details: any) => Promise<T[]>;
  sendMessage: <T>(tabId: number, message: any, options?: any) => Promise<T>;
}

export interface PromisifiedChromeRuntime {
  sendMessage: <T>(message: any, options?: any) => Promise<T>;
  sendNativeMessage: <T>(application: string, message: any) => Promise<T>;
  getBackgroundPage: () => Promise<Window | null>;
  openOptionsPage: () => Promise<void>;
  setUninstallURL: (url: string) => Promise<void>;
}

// Chrome Extension Error Types
export class ChromeExtensionError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context: string,
    public readonly chromeError?: any
  ) {
    super(message);
    this.name = 'ChromeExtensionError';
  }
}

// Type Guards for Chrome APIs
export const ChromeTypeGuards = {
  isTab: (value: unknown): value is any => {
    return (
      typeof value === 'object' &&
      value !== null &&
      'id' in value &&
      'windowId' in value &&
      typeof (value as any).id === 'number' &&
      typeof (value as any).windowId === 'number'
    );
  },

  isMessageSender: (value: unknown): value is any => {
    return (
      typeof value === 'object' &&
      value !== null &&
      (('tab' in value && ChromeTypeGuards.isTab((value as any).tab)) ||
        ('id' in value && typeof (value as any).id === 'string'))
    );
  },

  isChromeError: (value: unknown): value is any => {
    return (
      typeof value === 'object' &&
      value !== null &&
      'message' in value &&
      typeof (value as any).message === 'string'
    );
  },
} as const;
