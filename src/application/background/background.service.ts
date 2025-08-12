// Background Service - Application Layer Entry Point
// Following Clean Architecture patterns - Simplified version for build system

import { StorageService } from '@infrastructure/chrome-apis/storage.service';
import { ApiKeyService } from '@domain/api-key/api-key.service';
import { PromptTemplateService } from '@domain/prompt-template/prompt-template.service';
import { PromptExecutorService } from './prompt-executor.service';
import { DomainBlockerService } from '@domain/domain-blocker/domain-blocker.service';

/**
 * Background Service - Main entry point for Chrome extension background script
 *
 * This service initializes and coordinates all background operations.
 */
class BackgroundService {
  private readonly storageService: StorageService;
  private readonly apiKeyService: ApiKeyService;
  private readonly promptTemplateService: PromptTemplateService;
  private readonly promptExecutorService: PromptExecutorService;
  private readonly domainBlockerService: DomainBlockerService;
  private isInitialized = false;

  constructor() {
    // Initialize infrastructure services
    this.storageService = new StorageService();

    // Initialize domain services with dependencies
    this.apiKeyService = new ApiKeyService(this.storageService);
    this.promptTemplateService = new PromptTemplateService(this.storageService);
    this.domainBlockerService = new DomainBlockerService(this.storageService);

    // Initialize application services
    this.promptExecutorService = new PromptExecutorService(
      this.storageService,
      this.apiKeyService,
      this.promptTemplateService
    );
  }

  /**
   * Initializes the background service and all dependencies
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Initializing background services

      // Setup message handling
      await this.setupMessageHandlers();

      this.isInitialized = true;
      // Background services initialized successfully
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
      console.error('BackgroundService: Failed to initialize:', errorMessage);
    }
  }

  /**
   * Sets up Chrome runtime message handlers
   */
  private async setupMessageHandlers(): Promise<void> {
    try {
      chrome.runtime.onMessage.addListener(
        (
          message: any,
          sender: chrome.runtime.MessageSender,
          sendResponse: (response: any) => void
        ) => {
          this.handleMessage(message, sender, sendResponse);
          return true; // Keep message channel open for async responses
        }
      );

      // Message handlers registered
    } catch (error) {
      console.error('BackgroundService: Failed to setup message handlers:', error);
    }
  }

  /**
   * Handles incoming messages from content scripts and popup
   */
  private async handleMessage(
    message: any,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: any) => void
  ): Promise<void> {
    try {
      // Processing message action: ${message.action}

      switch (message.action) {
        // API Key management
        case 'getApiKey':
          await this.handleGetApiKey(sendResponse);
          break;

        case 'saveApiKey':
          await this.handleSaveApiKey(message.payload?.apiKey || message.apiKey, sendResponse);
          break;

        case 'validateApiKey':
          await this.handleValidateApiKey(message.payload?.apiKey || message.apiKey, sendResponse);
          break;

        // Prompt Templates management
        case 'getPromptTemplates':
          await this.handleGetPromptTemplates(sendResponse);
          break;

        case 'getDefaultPromptTemplates':
          await this.handleGetDefaultPromptTemplates(sendResponse);
          break;

        case 'savePromptTemplates':
          await this.handleSavePromptTemplates(message.promptTemplates, sendResponse);
          break;

        case 'resetPromptTemplates':
          await this.handleResetPromptTemplates(sendResponse);
          break;

        // AI Prompt execution
        case 'summarize':
          await this.handleSummarize(message.text, sendResponse);
          break;

        case 'meaning':
          await this.handleMeaning(message.text, sendResponse);
          break;

        case 'rephrase':
          await this.handleRephrase(message.text, sendResponse);
          break;

        case 'translate':
          await this.handleTranslate(message.text, message.targetLanguage, sendResponse);
          break;

        // Domain blocking
        case 'isDomainBlocked':
          await this.handleIsDomainBlocked(sendResponse, _sender);
          break;

        case 'getBlockedDomains':
          await this.handleGetBlockedDomains(sendResponse);
          break;

        case 'addBlockedDomain':
          await this.handleAddBlockedDomain(message.domain, sendResponse);
          break;

        case 'removeBlockedDomain':
          await this.handleRemoveBlockedDomain(message.domain, sendResponse);
          break;

        case 'updateBlockedDomains':
          await this.handleUpdateBlockedDomains(message.domains, sendResponse);
          break;

        case 'ping':
          sendResponse({ success: true, data: 'pong' });
          break;

        default:
          // Unknown action received: ${message.action}
          sendResponse({
            success: false,
            error: 'Unknown action',
          });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown message handling error';
      console.error(`BackgroundService: Message handling error:`, errorMessage);

      sendResponse({
        success: false,
        error: errorMessage,
      });
    }
  }

  /**
   * Handles API key retrieval requests
   */
  private async handleGetApiKey(sendResponse: (response: any) => void): Promise<void> {
    try {
      const apiKey = await this.apiKeyService.getApiKey();
      sendResponse({
        success: true,
        data: apiKey?.value || null,
      });
    } catch (error) {
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get API key',
      });
    }
  }

  /**
   * Handles API key save requests
   */
  private async handleSaveApiKey(
    apiKey: string,
    sendResponse: (response: any) => void
  ): Promise<void> {
    try {
      if (!apiKey) {
        throw new Error('API key is required');
      }
      await this.apiKeyService.setApiKey(apiKey);
      sendResponse({ success: true });
    } catch (error) {
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save API key',
      });
    }
  }

  /**
   * Handles API key validation requests
   */
  private async handleValidateApiKey(
    apiKey: string,
    sendResponse: (response: any) => void
  ): Promise<void> {
    try {
      if (!apiKey) {
        throw new Error('API key is required');
      }
      const isValid = await this.apiKeyService.validateApiKey(apiKey);
      sendResponse({ success: true, data: isValid });
    } catch (error) {
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to validate API key',
      });
    }
  }

  /**
   * Handles prompt templates retrieval requests
   */
  private async handleGetPromptTemplates(sendResponse: (response: any) => void): Promise<void> {
    try {
      const templates = await this.promptTemplateService.getTemplates();
      // Convert to object format that original JS expected
      const templatesObj: Record<string, string> = {};
      templates.forEach(template => {
        templatesObj[template.id] = template.prompt;
      });
      sendResponse(templatesObj);
    } catch (error) {
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get prompt templates',
      });
    }
  }

  /**
   * Handles default prompt templates retrieval requests
   */
  private async handleGetDefaultPromptTemplates(
    sendResponse: (response: any) => void
  ): Promise<void> {
    try {
      const defaultTemplates = this.promptTemplateService.getDefaultTemplates();
      // Convert to object format that original JS expected
      const templatesObj: Record<string, string> = {};
      defaultTemplates.forEach(template => {
        templatesObj[template.id] = template.prompt;
      });
      sendResponse(templatesObj);
    } catch (error) {
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get default prompt templates',
      });
    }
  }

  /**
   * Handles saving prompt templates
   */
  private async handleSavePromptTemplates(
    promptTemplates: Record<string, string>,
    sendResponse: (response: any) => void
  ): Promise<void> {
    try {
      // Convert from object format to array format
      for (const [id, prompt] of Object.entries(promptTemplates)) {
        const template = {
          id,
          name: id,
          prompt,
          category: 'default' as const,
          variables: [],
          metadata: {
            createdAt: new Date(),
            updatedAt: new Date(),
            version: 1,
            author: 'system',
            tags: [],
          },
        };
        await this.promptTemplateService.saveTemplate(template);
      }
      sendResponse({ success: true });
    } catch (error) {
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save prompt templates',
      });
    }
  }

  /**
   * Handles resetting prompt templates to defaults
   */
  private async handleResetPromptTemplates(sendResponse: (response: any) => void): Promise<void> {
    try {
      const defaultTemplates = this.promptTemplateService.getDefaultTemplates();
      for (const template of defaultTemplates) {
        await this.promptTemplateService.saveTemplate(template);
      }
      sendResponse({ success: true });
    } catch (error) {
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reset prompt templates',
      });
    }
  }

  /**
   * AI Prompt Execution Handlers
   */

  /**
   * Handles summarize requests
   */
  private async handleSummarize(
    text: string,
    sendResponse: (response: any) => void
  ): Promise<void> {
    try {
      const result = await this.promptExecutorService.executeSummaryPrompt(text);
      sendResponse(result);
    } catch (error) {
      sendResponse({
        error: error instanceof Error ? error.message : 'Failed to summarize text',
      });
    }
  }

  /**
   * Handles meaning requests
   */
  private async handleMeaning(text: string, sendResponse: (response: any) => void): Promise<void> {
    try {
      const result = await this.promptExecutorService.executeMeaningPrompt(text);
      sendResponse(result);
    } catch (error) {
      sendResponse({
        error: error instanceof Error ? error.message : 'Failed to get meaning',
      });
    }
  }

  /**
   * Handles rephrase requests
   */
  private async handleRephrase(text: string, sendResponse: (response: any) => void): Promise<void> {
    try {
      const result = await this.promptExecutorService.executeRephrasePrompt(text);
      sendResponse(result);
    } catch (error) {
      sendResponse({
        error: error instanceof Error ? error.message : 'Failed to rephrase text',
      });
    }
  }

  /**
   * Handles translate requests
   */
  private async handleTranslate(
    text: string,
    targetLanguage: string,
    sendResponse: (response: any) => void
  ): Promise<void> {
    try {
      const result = await this.promptExecutorService.executeTranslatePrompt(text, targetLanguage);
      sendResponse(result);
    } catch (error) {
      sendResponse({
        error: error instanceof Error ? error.message : 'Failed to translate text',
      });
    }
  }

  /**
   * Domain Blocking Handlers
   */

  /**
   * Handles domain blocked status requests
   */
  private async handleIsDomainBlocked(
    sendResponse: (response: any) => void,
    sender: chrome.runtime.MessageSender
  ): Promise<void> {
    try {
      if (!sender.tab?.url) {
        sendResponse({ isBlocked: false });
        return;
      }
      const url = new URL(sender.tab.url);
      const isBlocked = await this.domainBlockerService.isDomainBlocked(url.hostname);
      sendResponse({ isBlocked });
    } catch (error) {
      console.error('BackgroundService: Error checking domain blocked status:', error);
      sendResponse({ isBlocked: false });
    }
  }

  /**
   * Handles getting blocked domains
   */
  private async handleGetBlockedDomains(sendResponse: (response: any) => void): Promise<void> {
    try {
      const blockedDomains = await this.domainBlockerService.getBlockedDomains();
      sendResponse(blockedDomains);
    } catch (error) {
      sendResponse({
        error: error instanceof Error ? error.message : 'Failed to get blocked domains',
      });
    }
  }

  /**
   * Handles adding blocked domain
   */
  private async handleAddBlockedDomain(
    domain: string,
    sendResponse: (response: any) => void
  ): Promise<void> {
    try {
      await this.domainBlockerService.addBlockedDomain(domain);
      sendResponse({ success: true });
    } catch (error) {
      sendResponse({
        error: error instanceof Error ? error.message : 'Failed to add blocked domain',
      });
    }
  }

  /**
   * Handles removing blocked domain
   */
  private async handleRemoveBlockedDomain(
    domain: string,
    sendResponse: (response: any) => void
  ): Promise<void> {
    try {
      await this.domainBlockerService.removeBlockedDomain(domain);
      sendResponse({ success: true });
    } catch (error) {
      sendResponse({
        error: error instanceof Error ? error.message : 'Failed to remove blocked domain',
      });
    }
  }

  /**
   * Handles updating blocked domains
   */
  private async handleUpdateBlockedDomains(
    domains: string[],
    sendResponse: (response: any) => void
  ): Promise<void> {
    try {
      await this.domainBlockerService.updateBlockedDomains(domains);
      sendResponse({ success: true });
    } catch (error) {
      sendResponse({
        error: error instanceof Error ? error.message : 'Failed to update blocked domains',
      });
    }
  }
}

// Initialize and start the background service
const backgroundService = new BackgroundService();

// Handle Chrome extension lifecycle events
chrome.runtime.onStartup.addListener(async () => {
  // Chrome startup detected
  await backgroundService.initialize();
});

chrome.runtime.onInstalled.addListener(async details => {
  // Extension installed/updated: ${details.reason}
  await backgroundService.initialize();
});

// Initialize immediately for development and testing
backgroundService.initialize().catch(error => {
  console.error('BackgroundService: Critical initialization failure:', error);
});

// Export for testing
export { BackgroundService };
