// Chrome API Mock Setup
// Following the pseudocode from Phase 4.2 - Chrome API Mocking Algorithm

import chrome from 'sinon-chrome';
import sinon from 'sinon';
import { beforeEach, afterEach } from 'vitest';
import type { Domain, ChromeMessage, ChromeStorageSchema } from '@types';

// Global Chrome API mock setup
global.chrome = chrome;

// Chrome API Mock Builder
export class ChromeApiMockBuilder {
  public static storage() {
    return {
      withApiKey: (apiKey: string) => {
        chrome.storage.sync.get.withArgs('geminiApiKey').yields({ geminiApiKey: apiKey });
        return ChromeApiMockBuilder.storage();
      },

      withSettings: (settings: Record<string, any>) => {
        chrome.storage.sync.get.withArgs(sinon.match.string).yields(settings);
        return ChromeApiMockBuilder.storage();
      },

      withCompleteStorage: (storageData: Partial<ChromeStorageSchema>) => {
        chrome.storage.sync.get.withArgs(null).yields(storageData);
        Object.keys(storageData).forEach(key => {
          chrome.storage.sync.get
            .withArgs(key)
            .yields({ [key]: storageData[key as keyof ChromeStorageSchema] });
        });
        return ChromeApiMockBuilder.storage();
      },

      withError: (error: string) => {
        chrome.storage.sync.get.throws(new Error(error));
        return ChromeApiMockBuilder.storage();
      },

      withStorageQuota: (bytesInUse: number, quota: number) => {
        chrome.storage.sync.getBytesInUse.yields(bytesInUse);
        chrome.storage.sync.QUOTA_BYTES = quota;
        return ChromeApiMockBuilder.storage();
      },
    };
  }

  public static messaging() {
    return {
      withResponse: <T>(response: T) => {
        chrome.runtime.sendMessage.yields(response);
        return ChromeApiMockBuilder.messaging();
      },

      withError: (error: string) => {
        chrome.runtime.sendMessage.throws(new Error(error));
        return ChromeApiMockBuilder.messaging();
      },

      withMessageHandler: <TRequest extends ChromeMessage, TResponse>(
        handler: (message: TRequest) => TResponse
      ) => {
        chrome.runtime.onMessage.addListener.callsFake(listener => {
          // Store the listener for manual triggering in tests
          (chrome as any)._messageListener = listener;
        });
        return ChromeApiMockBuilder.messaging();
      },

      triggerMessage: <TRequest extends ChromeMessage>(
        message: TRequest,
        sender?: chrome.runtime.MessageSender
      ) => {
        const listener = (chrome as any)._messageListener;
        if (listener) {
          listener(message, sender || { id: 'test-extension' }, () => {});
        }
      },
    };
  }

  public static tabs() {
    return {
      withActiveTab: (tab: chrome.tabs.Tab) => {
        chrome.tabs.query.withArgs({ active: true, currentWindow: true }).yields([tab]);
        return ChromeApiMockBuilder.tabs();
      },

      withAllTabs: (tabs: chrome.tabs.Tab[]) => {
        chrome.tabs.query.withArgs({}).yields(tabs);
        return ChromeApiMockBuilder.tabs();
      },

      withTabById: (tabId: number, tab: chrome.tabs.Tab | null) => {
        if (tab) {
          chrome.tabs.get.withArgs(tabId).yields(tab);
        } else {
          chrome.tabs.get.withArgs(tabId).throws(new Error('Tab not found'));
        }
        return ChromeApiMockBuilder.tabs();
      },

      withScriptExecution: <T>(result: T[]) => {
        chrome.tabs.executeScript.yields(result);
        return ChromeApiMockBuilder.tabs();
      },
    };
  }

  public static runtime() {
    return {
      withExtensionId: (id: string) => {
        chrome.runtime.id = id;
        return ChromeApiMockBuilder.runtime();
      },

      withManifest: (manifest: chrome.runtime.Manifest) => {
        chrome.runtime.getManifest.returns(manifest);
        return ChromeApiMockBuilder.runtime();
      },

      withInstallReason: (reason: chrome.runtime.OnInstalledReason) => {
        chrome.runtime.onInstalled.addListener.callsFake(listener => {
          (chrome as any)._installListener = listener;
        });
        // Trigger immediately for testing
        setTimeout(() => {
          const listener = (chrome as any)._installListener;
          if (listener) {
            listener({ reason, id: chrome.runtime.id });
          }
        }, 0);
        return ChromeApiMockBuilder.runtime();
      },
    };
  }

  public static contextMenus() {
    return {
      withMenuCreation: () => {
        chrome.contextMenus.create.callsFake((options, callback) => {
          if (callback) callback();
          return options.id || 'generated-id';
        });
        return ChromeApiMockBuilder.contextMenus();
      },

      withMenuClick: (
        menuItemId: string,
        info: chrome.contextMenus.OnClickData,
        tab?: chrome.tabs.Tab
      ) => {
        chrome.contextMenus.onClicked.addListener.callsFake(listener => {
          (chrome as any)._contextMenuListener = listener;
        });
        // Trigger menu click
        setTimeout(() => {
          const listener = (chrome as any)._contextMenuListener;
          if (listener) {
            listener(info, tab);
          }
        }, 0);
        return ChromeApiMockBuilder.contextMenus();
      },
    };
  }
}

// Test Data Builder
export class TestDataBuilder {
  public static promptTemplate(
    overrides: Partial<Domain.PromptTemplate> = {}
  ): Domain.PromptTemplate {
    return {
      id: 'test-template',
      name: 'Test Template',
      prompt: 'Summarize: {text}',
      category: 'general',
      variables: ['text'],
      metadata: {
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
        version: 1,
        author: 'test',
        tags: [],
      },
      ...overrides,
    };
  }

  public static executionConfig(
    overrides: Partial<Domain.ExecutionConfig> = {}
  ): Domain.ExecutionConfig {
    return {
      maxOutputTokens: 1000,
      temperature: 0.7,
      topP: 0.9,
      ...overrides,
    };
  }

  public static userSettings(overrides: Partial<Domain.UserSettings> = {}): Domain.UserSettings {
    return {
      maxOutputTokens: 2000,
      blockedDomains: ['example.com'],
      promptTemplates: [TestDataBuilder.promptTemplate()],
      autoSummarize: true,
      ...overrides,
    };
  }

  public static apiKey(overrides: Partial<Domain.ApiKey> = {}): Domain.ApiKey {
    return {
      value: 'test-api-key-12345',
      isValid: true,
      validatedAt: new Date('2024-01-01T00:00:00.000Z'),
      source: 'user',
      ...overrides,
    };
  }

  public static chromeTab(overrides: Partial<chrome.tabs.Tab> = {}): chrome.tabs.Tab {
    return {
      id: 123,
      url: 'https://example.com',
      title: 'Test Page',
      active: true,
      windowId: 1,
      index: 0,
      pinned: false,
      highlighted: false,
      incognito: false,
      selected: false,
      discarded: false,
      autoDiscardable: true,
      ...overrides,
    };
  }

  public static executionResult(
    overrides: Partial<Domain.ExecutionResult> = {}
  ): Domain.ExecutionResult {
    return {
      success: true,
      content: 'Test execution result',
      metadata: {
        requestId: 'test-request-123',
        timestamp: new Date('2024-01-01T00:00:00.000Z'),
        duration: 1500,
        tokenUsage: {
          promptTokens: 100,
          completionTokens: 50,
          totalTokens: 150,
        },
      },
      ...overrides,
    };
  }

  public static chromeMessage<T extends ChromeMessage>(action: T['action'], payload?: any): T {
    return {
      action,
      requestId: `test-${Date.now()}`,
      timestamp: Date.now(),
      ...(payload && { payload }),
    } as T;
  }

  public static storageData(
    overrides: Partial<ChromeStorageSchema> = {}
  ): Partial<ChromeStorageSchema> {
    return {
      geminiApiKey: 'test-api-key',
      userSettings: TestDataBuilder.userSettings(),
      promptTemplates: [TestDataBuilder.promptTemplate()],
      blockedDomains: ['blocked.com'],
      maxOutputTokens: 2000,
      apiKeyValidation: {
        isValid: true,
        lastValidated: new Date().toISOString(),
      },
      extensionSettings: {
        theme: 'light',
        shortcuts: {},
        notifications: true,
      },
      ...overrides,
    };
  }
}

// Async Test Helper
export async function waitForAsync(
  condition: () => boolean | Promise<boolean>,
  timeout = 1000
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await condition()) return;
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  throw new Error(`Timeout waiting for condition after ${timeout}ms`);
}

// Mock Chrome Extension Environment
export function mockChromeEnvironment(): void {
  // Mock chrome.runtime properties
  chrome.runtime.id = 'test-extension-id';
  chrome.runtime.getURL.returns('chrome-extension://test-extension-id/');

  // Mock chrome.storage with default behavior
  chrome.storage.sync.get.yields({});
  chrome.storage.sync.set.yields();
  chrome.storage.sync.remove.yields();
  chrome.storage.sync.clear.yields();
  chrome.storage.sync.getBytesInUse.yields(0);

  chrome.storage.local.get.yields({});
  chrome.storage.local.set.yields();
  chrome.storage.local.remove.yields();
  chrome.storage.local.clear.yields();
  chrome.storage.local.getBytesInUse.yields(0);

  // Mock chrome.tabs with default behavior
  chrome.tabs.query.yields([]);
  chrome.tabs.get.yields(null);
  chrome.tabs.create.yields(TestDataBuilder.chromeTab());
  chrome.tabs.update.yields(TestDataBuilder.chromeTab());
  chrome.tabs.remove.yields();
  chrome.tabs.executeScript.yields([]);
  chrome.tabs.sendMessage.yields({});

  // Mock chrome.runtime messaging
  chrome.runtime.sendMessage.yields({});
  chrome.runtime.sendNativeMessage.yields({});

  // Mock chrome.contextMenus
  chrome.contextMenus.create.returns('menu-id');
  chrome.contextMenus.update.yields();
  chrome.contextMenus.remove.yields();
  chrome.contextMenus.removeAll.yields();
}

// Test setup and teardown
beforeEach(() => {
  chrome.flush();
  mockChromeEnvironment();
});

afterEach(() => {
  chrome.flush();
});
