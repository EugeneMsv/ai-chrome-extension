// Content Script Main Entry Point - Application Manager
// Following Clean Architecture patterns with original business logic

import { AiButton } from '../components/ai-button.component';
import { BubbleButton } from '../components/bubble-button.component';
import { PopupHandler } from '../components/popup-handler.component';

let debounceTimeout: NodeJS.Timeout | null = null;

/**
 * ApplicationManager - Manages AI button interactions on web pages
 * This is the complete recreation of the original ApplicationManager with exact logic
 */
class ApplicationManager {
  private currentAiButton: AiButton | null = null;
  private isBlocked: boolean = false; // Initial assumption, will be checked in start()
  private popupHandler: PopupHandler; // Core dependency

  constructor() {
    // Initialize properties that are core to the manager's identity
    // and don't depend on the current page state immediately.
    this.currentAiButton = null;
    this.isBlocked = false; // Initial assumption, will be checked in start()
    this.popupHandler = new PopupHandler(); // Core dependency

    console.log('ApplicationManager: instance created.');
    // Domain check and event listeners are moved to start()
  }

  /**
   * Starts the ApplicationManager by performing initial checks and setting up listeners.
   * Should be called after the instance is created.
   */
  public async start(): Promise<void> {
    console.log('ApplicationManager: starting...');
    try {
      await this._checkDomainBlocked(); // Perform initial domain block check

      if (this.isBlocked) {
        console.log('ApplicationManager: Domain is blocked. Event listeners will not be set up.');
        // Optionally, you could add logic here to completely disable the extension's UI
        // on this page if needed, beyond just not showing the button.
      } else {
        console.log('ApplicationManager: Domain is not blocked. Setting up event listeners.');
        this._setupEventListeners(); // Setup listeners only if not blocked
        console.log('ApplicationManager started successfully and listening for events.');
      }
    } catch (error) {
      console.error('Error during ApplicationManager startup:', error);
      // Decide how to handle startup errors
    }
  }

  private async _checkDomainBlocked(): Promise<void> {
    this.isBlocked = await this._fetchDomainBlockedStatus();
    console.log(`ApplicationManager: initial domain blocked status: ${this.isBlocked}`);
  }

  private _fetchDomainBlockedStatus(): Promise<boolean> {
    return new Promise(resolve => {
      if (!this._isChromeRuntimeAvailable()) {
        console.warn(
          'ApplicationManager: Chrome runtime not available. Assuming domain is not blocked.'
        );
        resolve(false);
        return;
      }
      chrome.runtime.sendMessage({ action: 'isDomainBlocked' }, response => {
        if (chrome.runtime.lastError) {
          console.error(
            'ApplicationManager: Error checking domain blocked status:',
            chrome.runtime.lastError.message
          );
          resolve(false); // Assume not blocked on error
        } else {
          resolve(response?.isBlocked ?? false);
        }
      });
    });
  }

  private _isChromeRuntimeAvailable(): boolean {
    return (
      typeof chrome !== 'undefined' &&
      chrome.runtime &&
      typeof chrome.runtime.sendMessage === 'function'
    );
  }

  private _setupEventListeners(): void {
    // Listen for mouse up events to detect text selection
    document.addEventListener('mouseup', this._handleSelectionChange); // Bind `this`

    // Listen for messages from the background script (e.g., domain block changes)
    if (chrome.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener(this._handleBackgroundMessages); // Bind `this`
    } else {
      console.warn(
        "ApplicationManager: Chrome runtime.onMessage not available. Domain block updates won't be received."
      );
    }
    console.log('ApplicationManager: Event listeners set up.');
  }

  // Using bound methods or arrow functions for event handlers to maintain `this` context
  private _handleBackgroundMessages = (
    message: any,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: any) => void
  ): boolean => {
    if (message.action === 'domainBlockStatusChanged') {
      console.log('Domain block status potentially changed, re-checking...');
      this._checkDomainBlocked().then(() => {
        // If the domain is now blocked, remove any existing button
        if (this.currentAiButton && this.isBlocked) {
          this.removeCurrentAiButton();
        }
      });
      sendResponse({ received: true });
      return true; // Indicate async response
    }
    // Handle other potential messages if needed
    return false;
  };

  private _handleSelectionChange = (_event: MouseEvent): void => {
    if (this.isBlocked) {
      console.log('ApplicationManager: Domain is blocked. Ignoring selection change.');
      return;
    }

    // Clear any existing debounce timeout
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    // Debounce the selection handling
    debounceTimeout = setTimeout(() => {
      const selectedText = this._getSelectedText();

      if (!selectedText || selectedText.length < 10) {
        this.removeCurrentAiButton();
        return;
      }

      console.log(
        `ApplicationManager: Text selected (${selectedText.length} chars): "${selectedText.substring(0, 30)}..."`
      );

      // Get selection coordinates
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // Calculate position for AI button (center of selection + scroll offset)
      const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;
      const positionX = rect.left + scrollX + rect.width / 2;
      const positionY = rect.bottom + scrollY + 10;

      this.showAiButton(selectedText, positionX, positionY);
    }, 200); // 200ms debounce
  };

  private _getSelectedText(): string | null {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return null;
    }

    const text = selection.toString().trim();
    return text.length > 0 ? text : null;
  }

  /**
   * Creates and shows the AI button with bubble buttons
   */
  private showAiButton(selectedText: string, positionX: number, positionY: number): void {
    // Remove existing button first
    this.removeCurrentAiButton();

    // Create new AI button
    this.currentAiButton = new AiButton(positionX, positionY);

    // Create bubble buttons with handlers
    const bubbleButtons = [
      new BubbleButton('Summarize', selectedText, (text: string) => {
        this.popupHandler.showPopupForAction(
          'summarize',
          '<i>Summarizing...</i>',
          text,
          this.currentAiButton!
        );
      }),
      new BubbleButton('Meaning', selectedText, (text: string) => {
        this.popupHandler.showPopupForAction(
          'meaning',
          '<i>Getting meaning...</i>',
          text,
          this.currentAiButton!
        );
      }),
      new BubbleButton('Rephrase', selectedText, (text: string) => {
        this.popupHandler.showPopupForAction(
          'rephrase',
          '<i>Rephrasing...</i>',
          text,
          this.currentAiButton!
        );
      }),
      new BubbleButton('Translate', selectedText, (text: string) => {
        const targetLanguage = prompt('Enter target language (e.g., Spanish, French):');
        if (targetLanguage) {
          this.popupHandler.showPopupForAction(
            'translate',
            '<i>Translating...</i>',
            text,
            this.currentAiButton!,
            { targetLanguage }
          );
        }
      }),
    ];

    // Add bubble buttons to AI button
    this.currentAiButton.addBubbleButtons(bubbleButtons);

    // Show the AI button
    this.currentAiButton.show();
  }

  /**
   * Removes the current AI button
   */
  public removeCurrentAiButton(): void {
    if (this.currentAiButton) {
      this.currentAiButton.remove();
      this.currentAiButton = null;
    }
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    this.removeCurrentAiButton();
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
      debounceTimeout = null;
    }
    console.log('ApplicationManager: Cleanup completed');
  }
}

// Initialize content script manager
console.log('ContentScript: Loading main content script...');

// Create the manager instance
// The constructor now does less work, mainly setting up internal state.
const manager = new ApplicationManager();

// --- Start the Application ---
// The start method handles async setup like checking domain status
// and attaching event listeners.
manager
  .start()
  .then(() => {
    // Optional: Log success or perform actions after successful start
    console.log('ApplicationManager successfully initialized and started.');
  })
  .catch(error => {
    // Handle potential errors during the async start process
    console.error('Failed to start ApplicationManager:', error);
    // Depending on the error, you might want to disable functionality
  });

// The ApplicationManager instance will now handle events internally.
console.log('main.js execution finished, ApplicationManager is running.');

// Export for testing
export { ApplicationManager };
