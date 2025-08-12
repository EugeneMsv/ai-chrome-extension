// Popup Main Entry Point - UI Layer
// Following Clean Architecture patterns - Simplified version for build system

import { StorageService } from '@infrastructure/chrome-apis/storage.service';
import { ApiKeyService } from '@domain/api-key/api-key.service';
import { PromptTemplateService } from '@domain/prompt-template/prompt-template.service';

/**
 * Popup Manager - Manages the extension popup UI and interactions
 *
 * This service handles popup tab navigation and settings management.
 */
class PopupManager {
  private readonly storageService: StorageService;
  private readonly apiKeyService: ApiKeyService;
  private readonly promptTemplateService: PromptTemplateService;
  private isInitialized = false;

  constructor() {
    // Initialize infrastructure services
    this.storageService = new StorageService();

    // Initialize domain services with dependencies
    this.apiKeyService = new ApiKeyService(this.storageService);
    this.promptTemplateService = new PromptTemplateService(this.storageService);
  }

  /**
   * Initializes the popup manager and UI components
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('PopupManager: Already initialized, skipping...');
      return;
    }

    try {
      console.log('PopupManager: Initializing popup...');

      // Setup UI components
      this.setupTabNavigation();
      this.setupEventHandlers();

      // Load initial data
      await this.loadInitialData();

      this.isInitialized = true;
      console.log('PopupManager: Popup initialized successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
      console.error('PopupManager: Failed to initialize:', errorMessage);
      this.showErrorMessage(`Failed to initialize popup: ${errorMessage}`);
    }
  }

  /**
   * Sets up tab navigation functionality
   */
  private setupTabNavigation(): void {
    const tabButtons = document.querySelectorAll('.tablinks');
    const tabContents = document.querySelectorAll('.tabcontent');

    tabButtons.forEach(button => {
      button.addEventListener('click', event => {
        const target = event.currentTarget as HTMLButtonElement;
        const tabName = target.dataset['tab'];

        if (tabName) {
          this.openTab(tabName, tabButtons, tabContents);
        }
      });
    });

    console.log('PopupManager: Tab navigation setup complete');
  }

  /**
   * Opens a specific tab
   */
  private openTab(
    tabName: string,
    tabButtons: NodeListOf<HTMLButtonElement>,
    tabContents: NodeListOf<HTMLElement>
  ): void {
    // Hide all tab contents
    tabContents.forEach(content => {
      content.classList.remove('active');
    });

    // Remove active state from all tab buttons
    tabButtons.forEach(button => {
      button.classList.remove('active');
    });

    // Show selected tab content
    const targetContent = document.getElementById(tabName);
    if (targetContent) {
      targetContent.classList.add('active');
    }

    // Set active state on selected tab button
    const targetButton = document.querySelector(`[data-tab="${tabName}"]`) as HTMLButtonElement;
    if (targetButton) {
      targetButton.classList.add('active');
    }

    console.log(`PopupManager: Switched to tab: ${tabName}`);
  }

  /**
   * Sets up event handlers
   */
  private setupEventHandlers(): void {
    try {
      // Setup apply buttons
      const promptApplyButton = document.getElementById(
        'promptTemplates-apply'
      ) as HTMLButtonElement;
      if (promptApplyButton) {
        promptApplyButton.addEventListener('click', this.handleApplyPromptTemplates.bind(this));
      }

      const aiApplyButton = document.getElementById('aiSettings-apply') as HTMLButtonElement;
      if (aiApplyButton) {
        aiApplyButton.addEventListener('click', this.handleApplyAiSettings.bind(this));
      }

      // Setup reset button
      const resetButton = document.getElementById('resetPrompts') as HTMLButtonElement;
      if (resetButton) {
        resetButton.addEventListener('click', this.handleResetPrompts.bind(this));
      }

      // Setup blocked domains functionality
      const addDomainButton = document.getElementById('addDomainButton') as HTMLButtonElement;
      if (addDomainButton) {
        addDomainButton.addEventListener('click', this.handleAddDomain.bind(this));
      }

      console.log('PopupManager: Event handlers setup complete');
    } catch (error) {
      console.error('PopupManager: Failed to setup event handlers:', error);
    }
  }

  /**
   * Loads initial data for all tabs
   */
  private async loadInitialData(): Promise<void> {
    try {
      await Promise.all([
        this.loadPromptTemplates(),
        this.loadAiSettings(),
        this.loadBlockedDomains(),
      ]);

      console.log('PopupManager: Initial data loaded');
    } catch (error) {
      console.error('PopupManager: Failed to load initial data:', error);
      this.showErrorMessage('Failed to load settings');
    }
  }

  /**
   * Loads and displays prompt templates
   */
  private async loadPromptTemplates(): Promise<void> {
    try {
      const promptTemplates = await chrome.runtime.sendMessage({ action: 'getPromptTemplates' });
      this.renderPromptTemplates(promptTemplates);
    } catch (error) {
      console.error('PopupManager: Failed to load prompt templates:', error);
    }
  }

  /**
   * Renders prompt templates in the UI (matching original format)
   */
  private renderPromptTemplates(promptTemplates: Record<string, string>): void {
    const container = document.getElementById('promptTemplatesContainer');
    if (!container) {
      console.error('PopupManager: Prompt templates container not found');
      return;
    }

    container.innerHTML = ''; // Clear existing inputs

    for (const key in promptTemplates) {
      const containerDiv = document.createElement('div');
      containerDiv.classList.add('prompt-container');

      const header = document.createElement('div');
      header.classList.add('prompt-header');

      const label = document.createElement('label');
      label.textContent = key.charAt(0).toUpperCase() + key.slice(1); // Capitalize first letter
      header.appendChild(label);

      const resetButton = document.createElement('button');
      resetButton.textContent = 'Reset';
      resetButton.classList.add('reset-button');
      resetButton.addEventListener('click', async () => {
        const defaultTemplates = await chrome.runtime.sendMessage({
          action: 'getDefaultPromptTemplates',
        });
        textarea.value = defaultTemplates[key];
        this.showConfirmationMessage('Template reset');
      });

      containerDiv.appendChild(header);

      const textarea = document.createElement('textarea');
      textarea.id = key;
      textarea.setAttribute('data-template-id', key);
      textarea.value = promptTemplates[key] || '';
      containerDiv.appendChild(textarea);
      containerDiv.appendChild(resetButton);

      container.appendChild(containerDiv);
    }
  }

  /**
   * Loads and displays AI settings
   */
  private async loadAiSettings(): Promise<void> {
    try {
      // Load API key
      const apiKey = await this.apiKeyService.getApiKey();
      const apiKeyInput = document.getElementById('geminiApiKey') as HTMLInputElement;
      if (apiKeyInput) {
        apiKeyInput.value = apiKey?.value || '';
      }

      // Load max output tokens
      const maxTokens = await this.storageService.get<number>('maxOutputTokens');
      const maxTokensInput = document.getElementById('maxOutputTokens') as HTMLInputElement;
      if (maxTokensInput) {
        maxTokensInput.value = (maxTokens || 1000).toString();
      }
    } catch (error) {
      console.error('PopupManager: Failed to load AI settings:', error);
    }
  }

  /**
   * Event Handlers
   */

  private async handleResetPrompts(): Promise<void> {
    try {
      const defaultTemplates = this.promptTemplateService.getDefaultTemplates();

      // Save default templates
      for (const template of defaultTemplates) {
        await this.promptTemplateService.saveTemplate(template);
      }

      await this.loadPromptTemplates();
      this.showConfirmationMessage('Prompt templates reset to defaults');
    } catch (error) {
      console.error('PopupManager: Failed to reset prompts:', error);
      this.showErrorMessage('Failed to reset prompt templates');
    }
  }

  private async handleApplyPromptTemplates(): Promise<void> {
    try {
      // Get all template textareas and build templates object
      const container = document.getElementById('promptTemplatesContainer');
      if (!container) return;

      const textareas = container.querySelectorAll('textarea');
      const newPromptTemplates: Record<string, string> = {};

      textareas.forEach(textarea => {
        const templateId = textarea.getAttribute('data-template-id');
        if (templateId) {
          newPromptTemplates[templateId] = textarea.value;
        }
      });

      await chrome.runtime.sendMessage({
        action: 'savePromptTemplates',
        promptTemplates: newPromptTemplates,
      });

      this.showConfirmationMessage('Prompt templates saved');
    } catch (error) {
      console.error('PopupManager: Failed to apply prompt templates:', error);
      this.showErrorMessage('Failed to save prompt templates');
    }
  }

  private async handleApplyAiSettings(): Promise<void> {
    try {
      const apiKeyInput = document.getElementById('geminiApiKey') as HTMLInputElement;
      const maxTokensInput = document.getElementById('maxOutputTokens') as HTMLInputElement;

      // Save API key
      if (apiKeyInput && apiKeyInput.value.trim()) {
        await this.apiKeyService.setApiKey(apiKeyInput.value.trim());
      }

      // Save max tokens
      if (maxTokensInput) {
        const maxTokens = parseInt(maxTokensInput.value, 10);
        if (maxTokens >= 1 && maxTokens <= 3000) {
          await this.storageService.set('maxOutputTokens', maxTokens);
        }
      }

      this.showConfirmationMessage('AI settings saved');
    } catch (error) {
      console.error('PopupManager: Failed to apply AI settings:', error);
      this.showErrorMessage('Failed to save AI settings');
    }
  }

  /**
   * Loads and displays blocked domains
   */
  private async loadBlockedDomains(): Promise<void> {
    try {
      await this.renderBlockedDomains();
      await this.setCurrentDomainInInput();
    } catch (error) {
      console.error('PopupManager: Failed to load blocked domains:', error);
    }
  }

  private async renderBlockedDomains(): Promise<void> {
    const blockedDomainsListColumn1 = document.getElementById('blockedDomainsListColumn1');
    const blockedDomainsListColumn2 = document.getElementById('blockedDomainsListColumn2');

    if (!blockedDomainsListColumn1 || !blockedDomainsListColumn2) {
      console.error('PopupManager: Blocked domains list elements not found');
      return;
    }

    // Clear existing lists
    blockedDomainsListColumn1.innerHTML = '';
    blockedDomainsListColumn2.innerHTML = '';

    try {
      const blockedDomains = await chrome.runtime.sendMessage({ action: 'getBlockedDomains' });

      if (Array.isArray(blockedDomains)) {
        const column1: string[] = [];
        const column2: string[] = [];

        blockedDomains.forEach((domain, index) => {
          if (index % 2 === 0) {
            column1.push(domain);
          } else {
            column2.push(domain);
          }
        });

        column1.forEach(domain => this.createDomainListItem(domain, blockedDomainsListColumn1));
        column2.forEach(domain => this.createDomainListItem(domain, blockedDomainsListColumn2));
      }
    } catch (error) {
      console.error('PopupManager: Failed to get blocked domains:', error);
    }
  }

  private createDomainListItem(domain: string, parentElement: HTMLElement): void {
    const listItem = document.createElement('li');
    listItem.textContent = domain;

    const removeButton = document.createElement('button');
    removeButton.textContent = '-';
    removeButton.classList.add('remove-domain-button');
    removeButton.addEventListener('click', async () => {
      try {
        await chrome.runtime.sendMessage({ action: 'removeBlockedDomain', domain });
        await this.renderBlockedDomains();
        this.showConfirmationMessage('Domain removed from blocked list');
      } catch (error) {
        console.error('PopupManager: Failed to remove blocked domain:', error);
        this.showErrorMessage('Failed to remove domain');
      }
    });

    const buttonsContainer = document.createElement('div');
    buttonsContainer.classList.add('domain-list-buttons');
    buttonsContainer.appendChild(removeButton);
    listItem.appendChild(buttonsContainer);
    parentElement.appendChild(listItem);
  }

  private async setCurrentDomainInInput(): Promise<void> {
    try {
      const addDomainInput = document.getElementById('addDomainInput') as HTMLInputElement;
      if (addDomainInput) {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs[0] && tabs[0].url) {
          const currentUrl = new URL(tabs[0].url);
          addDomainInput.value = currentUrl.hostname;
        }
      }
    } catch (error) {
      console.error('PopupManager: Failed to set current domain in input:', error);
    }
  }

  private async handleAddDomain(): Promise<void> {
    try {
      const addDomainInput = document.getElementById('addDomainInput') as HTMLInputElement;
      if (!addDomainInput) return;

      const domain = addDomainInput.value.trim();
      if (domain) {
        await chrome.runtime.sendMessage({ action: 'addBlockedDomain', domain });
        addDomainInput.value = '';
        await this.renderBlockedDomains();
        await this.setCurrentDomainInInput(); // Reset to current domain
        this.showConfirmationMessage('Domain added to blocked list');
      }
    } catch (error) {
      console.error('PopupManager: Failed to add blocked domain:', error);
      this.showErrorMessage('Failed to add domain');
    }
  }

  /**
   * UI Helper Methods
   */

  private showConfirmationMessage(message: string): void {
    const confirmationElement = document.getElementById('globalConfirmation');
    if (confirmationElement) {
      confirmationElement.textContent = message;
      confirmationElement.classList.add('show');

      setTimeout(() => {
        confirmationElement.classList.remove('show');
      }, 3000);
    }
  }

  private showErrorMessage(message: string): void {
    const confirmationElement = document.getElementById('globalConfirmation');
    if (confirmationElement) {
      confirmationElement.textContent = message;
      confirmationElement.classList.add('show', 'error');

      setTimeout(() => {
        confirmationElement.classList.remove('show', 'error');
      }, 5000);
    }
  }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('Popup: DOM loaded, initializing popup manager...');

  const popupManager = new PopupManager();
  popupManager.initialize().catch(error => {
    console.error('Popup: Critical initialization failure:', error);
  });
});

// Export for testing
export { PopupManager };
