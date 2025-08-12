// Options Page Entry Point - UI Layer
// Following Clean Architecture patterns - Simplified version for build system

import { StorageService } from '@infrastructure/chrome-apis/storage.service';
import { MessagingService } from '@infrastructure/chrome-apis/messaging.service';
import { ApiKeyService } from '@domain/api-key/api-key.service';

/**
 * Options Page Manager - Manages the extension options page
 *
 * This service handles API key configuration and extension settings management.
 */
class OptionsPageManager {
  private readonly storageService: StorageService;
  private readonly messagingService: MessagingService;
  private readonly apiKeyService: ApiKeyService;
  private isInitialized = false;

  constructor() {
    // Initialize infrastructure services
    this.storageService = new StorageService();
    this.messagingService = new MessagingService();

    // Initialize domain services with dependencies
    this.apiKeyService = new ApiKeyService(this.storageService);
  }

  /**
   * Initializes the options page manager
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('OptionsPageManager: Already initialized, skipping...');
      return;
    }

    try {
      console.log('OptionsPageManager: Initializing options page...');

      // Setup UI components and event handlers
      this.setupEventHandlers();

      // Load current settings
      await this.loadCurrentSettings();

      this.isInitialized = true;
      console.log('OptionsPageManager: Options page initialized successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
      console.error('OptionsPageManager: Failed to initialize:', errorMessage);
      this.showErrorMessage(`Failed to initialize options page: ${errorMessage}`);
    }
  }

  /**
   * Sets up event handlers for form elements
   */
  private setupEventHandlers(): void {
    try {
      // Setup save button handler
      const saveButton = document.getElementById('saveApiKey') as HTMLButtonElement;
      if (saveButton) {
        saveButton.addEventListener('click', this.handleSaveApiKey.bind(this));
      }

      // Setup API key input handlers
      const apiKeyInput = document.getElementById('geminiApiKey') as HTMLInputElement;
      if (apiKeyInput) {
        apiKeyInput.addEventListener('input', this.handleApiKeyInputChange.bind(this));

        // Handle Enter key
        apiKeyInput.addEventListener('keypress', event => {
          if (event.key === 'Enter') {
            this.handleSaveApiKey();
          }
        });
      }

      console.log('OptionsPageManager: Event handlers setup complete');
    } catch (error) {
      console.error('OptionsPageManager: Failed to setup event handlers:', error);
    }
  }

  /**
   * Loads current settings and populates the form
   */
  private async loadCurrentSettings(): Promise<void> {
    try {
      // Load API key
      const apiKey = await this.apiKeyService.getApiKey();
      const apiKeyInput = document.getElementById('geminiApiKey') as HTMLInputElement;

      if (apiKeyInput) {
        apiKeyInput.value = apiKey?.value || '';
      }

      console.log('OptionsPageManager: Current settings loaded');
    } catch (error) {
      console.error('OptionsPageManager: Failed to load current settings:', error);
      this.showErrorMessage('Failed to load current settings');
    }
  }

  /**
   * Handles saving the API key
   */
  private async handleSaveApiKey(): Promise<void> {
    try {
      const apiKeyInput = document.getElementById('geminiApiKey') as HTMLInputElement;
      const saveButton = document.getElementById('saveApiKey') as HTMLButtonElement;

      if (!apiKeyInput) {
        throw new Error('API key input not found');
      }

      const apiKey = apiKeyInput.value.trim();

      if (!apiKey) {
        this.showErrorMessage('Please enter an API key');
        return;
      }

      // Disable button during save
      if (saveButton) {
        saveButton.disabled = true;
        saveButton.textContent = 'Saving...';
      }

      try {
        // Save API key
        await this.apiKeyService.setApiKey(apiKey);

        this.showSuccessMessage('API key saved successfully!');

        // Notify background script of change
        try {
          await this.messagingService.sendMessage({
            action: 'apiKeyUpdated',
          });
        } catch (messagingError) {
          console.warn('OptionsPageManager: Failed to notify background script:', messagingError);
          // Don't fail the operation for messaging errors
        }
      } catch (error) {
        this.showErrorMessage('Failed to save API key. Please try again.');
        console.error('OptionsPageManager: API key save failed:', error);
      }
    } catch (error) {
      console.error('OptionsPageManager: Error in handleSaveApiKey:', error);
      this.showErrorMessage('An unexpected error occurred');
    } finally {
      // Re-enable button
      const saveButton = document.getElementById('saveApiKey') as HTMLButtonElement;
      if (saveButton) {
        saveButton.disabled = false;
        saveButton.textContent = 'Save API Key';
      }
    }
  }

  /**
   * Handles API key input changes with real-time validation
   */
  private handleApiKeyInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();

    // Basic format validation
    if (value) {
      if (!value.startsWith('AIzaSy')) {
        this.showInputError(input, 'Gemini API keys typically start with "AIzaSy"');
      } else if (value.length < 35) {
        this.showInputError(input, 'API key appears to be too short');
      } else if (value.length > 50) {
        this.showInputError(input, 'API key appears to be too long');
      } else {
        this.clearInputError(input);
      }
    } else {
      this.clearInputError(input);
    }
  }

  /**
   * UI Helper Methods
   */

  private showInputError(input: HTMLInputElement, message: string): void {
    input.style.borderColor = '#dc3545';
    input.title = message;
  }

  private clearInputError(input: HTMLInputElement): void {
    input.style.borderColor = '';
    input.title = '';
  }

  private showSuccessMessage(message: string): void {
    this.showMessage(message, 'success');
  }

  private showErrorMessage(message: string): void {
    this.showMessage(message, 'error');
  }

  private showMessage(message: string, type: 'success' | 'error'): void {
    // Remove existing messages
    const existingMessage = document.getElementById('status-message');
    if (existingMessage) {
      existingMessage.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.id = 'status-message';
    messageDiv.textContent = message;

    let backgroundColor: string;
    let color: string;
    let borderColor: string;

    switch (type) {
      case 'success':
        backgroundColor = '#d4edda';
        color = '#155724';
        borderColor = '#c3e6cb';
        break;
      case 'error':
        backgroundColor = '#f8d7da';
        color = '#721c24';
        borderColor = '#f5c6cb';
        break;
    }

    messageDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      background-color: ${backgroundColor};
      color: ${color};
      border: 1px solid ${borderColor};
      border-radius: 4px;
      font-size: 14px;
      z-index: 1000;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    `;

    document.body.appendChild(messageDiv);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (messageDiv.parentNode) {
        messageDiv.remove();
      }
    }, 5000);
  }
}

// Initialize options page when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('OptionsPage: DOM loaded, initializing options page manager...');

  const optionsPageManager = new OptionsPageManager();
  optionsPageManager.initialize().catch(error => {
    console.error('OptionsPage: Critical initialization failure:', error);
  });
});

// Export for testing
export { OptionsPageManager };
