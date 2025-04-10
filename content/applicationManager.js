// content/applicationManager.js

import { AiButton } from './aiButton.js';
import { BubbleButton } from './bubbleButton.js';
import { PopupHandler } from './popupHandler.js';

let debounceTimeout = null;

export class ApplicationManager {
  constructor() {
    // Initialize properties that are core to the manager's identity
    // and don't depend on the current page state immediately.
    this.currentAiButton = null;
    this.isBlocked = false; // Initial assumption, will be checked in start()
    this.popupHandler = new PopupHandler(); // Core dependency

    console.log("ApplicationManager instance created.");
    // Domain check and event listeners are moved to start()
  }

  /**
   * Starts the ApplicationManager by performing initial checks and setting up listeners.
   * Should be called after the instance is created.
   */
  async start() {
    console.log("ApplicationManager starting...");
    try {
      await this._checkDomainBlocked(); // Perform initial domain block check

      if (this.isBlocked) {
        console.log("ApplicationManager: Domain is blocked. Event listeners will not be set up.");
        // Optionally, you could add logic here to completely disable the extension's UI
        // on this page if needed, beyond just not showing the button.
      } else {
        console.log("ApplicationManager: Domain is not blocked. Setting up event listeners.");
        this._setupEventListeners(); // Setup listeners only if not blocked
        console.log("ApplicationManager started successfully and listening for events.");
      }
    } catch (error) {
      console.error("Error during ApplicationManager startup:", error);
      // Decide how to handle startup errors
    }
  }

  async _checkDomainBlocked() {
    this.isBlocked = await this._isCurrentDomainBlocked();
    console.log(`Initial domain blocked status: ${this.isBlocked}`);
  }

  _isCurrentDomainBlocked() {
    return new Promise((resolve) => {
      if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
        console.warn("Chrome runtime not available. Assuming domain is not blocked.");
        resolve(false);
        return;
      }
      chrome.runtime.sendMessage({ action: 'isDomainBlocked' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error checking domain blocked status:', chrome.runtime.lastError.message);
          resolve(false); // Assume not blocked on error
        } else {
          resolve(response?.isBlocked ?? false);
        }
      });
    });
  }

  _setupEventListeners() {
    // Listen for mouse up events to detect text selection
    document.addEventListener('mouseup', this._handleSelectionChange); // Bind `this`

    // Listen for messages from the background script (e.g., domain block changes)
    if (chrome.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener(this._handleBackgroundMessages); // Bind `this`
    } else {
      console.warn("Chrome runtime.onMessage not available. Domain block updates won't be received.");
    }
    console.log("Event listeners set up.");
  }

  // Using bound methods or arrow functions for event handlers to maintain `this` context
  _handleBackgroundMessages = (message, sender, sendResponse) => {
    if (message.action === 'domainBlockStatusChanged') {
      console.log("Domain block status potentially changed, re-checking...");
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
  }

  _handleSelectionChange = (event) => { // Use arrow function for `this`
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(async () => {
      // Always check the current blocked status before showing the button
      if (this.isBlocked) {
        this.removeCurrentAiButton(); // Ensure button is removed if domain becomes blocked
        return;
      }

      const selection = window.getSelection();
      const selectedText = selection?.toString().trim() ?? '';

      if (selectedText && selection.rangeCount > 0) {
        // Use event coordinates for initial calculation relative to viewport
        const position = this._calculateButtonPosition(event.clientX, event.clientY);
        // Add scroll offsets for absolute page positioning
        const pageX = position.x + window.scrollX;
        const pageY = position.y + window.scrollY;

        if (this.currentAiButton) {
          const positionChanged = Math.abs(this.currentAiButton.positionX - pageX) > 5 || Math.abs(this.currentAiButton.positionY - pageY) > 5;
          // If text or position changed significantly, replace the button
          if (this.currentAiButton.selectedText !== selectedText || positionChanged) {
            this.removeCurrentAiButton();
            this.createAndShowAiButton(selectedText, pageX, pageY);
          } else {
            // If text and position are the same, just ensure it's visible (might have been hidden)
            this.currentAiButton.show();
          }
        } else {
          // No current button, create a new one
          this.createAndShowAiButton(selectedText, pageX, pageY);
        }
      } else {
        // No text selected, remove any existing button
        this.removeCurrentAiButton();
      }
    }, 150); // Debounce time to avoid flickering during selection adjustments
  }

  _calculateButtonPosition(clientX, clientY) {
    // Calculate position relative to the viewport, trying to stay near the cursor
    const buttonSize = 40; // Approximate size of the main AI button icon
    const margin = 10;     // Minimum space from window edges
    const offset = 15;     // How far below and right of the cursor to initially place it

    let targetX = clientX + offset;
    let targetY = clientY + offset;

    // Adjust if it goes off-screen (right or bottom)
    targetX = Math.min(targetX, window.innerWidth - buttonSize - margin);
    targetY = Math.min(targetY, window.innerHeight - buttonSize - margin);

    // Ensure it doesn't go off-screen (left or top)
    targetX = Math.max(margin, targetX);
    targetY = Math.max(margin, targetY);

    return { x: targetX, y: targetY };
  }

  // --- Action Handlers ---
  // No changes needed here, they already use this.popupHandler correctly

  handleSummarizeClick = (selectedText, aiButton) => {
    this.popupHandler.showPopupForAction(
      'summarize',
      '<i>Summarizing...</i>',
      selectedText,
      aiButton
    ).finally(() => {
      aiButton?.hide();
    });
  }

  handleMeaningClick = (selectedText, aiButton) => {
    this.popupHandler.showPopupForAction(
      'meaning',
      '<i>Fetching meaning...</i>',
      selectedText,
      aiButton
    ).finally(() => {
      aiButton?.hide();
    });
  }

  handleRephraseClick = (selectedText, aiButton) => {
    this.popupHandler.showPopupForAction(
      'rephrase',
      '<i>Rephrasing...</i>',
      selectedText,
      aiButton
    ).finally(() => {
      aiButton?.hide();
    });
  }

  handleTranslateClick = (selectedText, aiButton) => {
    this.popupHandler.showPopupForAction(
      'translate',
      '<i>Translating...</i>',
      selectedText,
      aiButton,
      { targetLanguage: 'Russian' } // Example additional params
    ).finally(() => {
      aiButton?.hide();
    });
  }

  // --- Button Creation & Removal ---
  // No fundamental changes needed here

  createAndShowAiButton(selectedText, pageX, pageY) {
    if (this.currentAiButton) {
      console.warn("Attempted to create an AI button when one already exists. Removing old one.");
      this.removeCurrentAiButton();
    }

    console.log(`Creating AI button for text: "${selectedText.substring(0, 30)}..." at (${pageX}, ${pageY})`);
    this.currentAiButton = new AiButton(pageX, pageY);
    this.currentAiButton.selectedText = selectedText;
    this.currentAiButton.positionX = pageX;
    this.currentAiButton.positionY = pageY;

    const bubbleButtonConfigs = [
      { name: 'Summarize', handler: this.handleSummarizeClick },
      { name: 'Meaning', handler: this.handleMeaningClick },
      { name: 'Rephrase', handler: this.handleRephraseClick },
      { name: 'Translate', handler: this.handleTranslateClick },
    ];

    const bubbleButtons = bubbleButtonConfigs.map(config => {
      const boundHandler = (text) => config.handler(text, this.currentAiButton);
      return new BubbleButton(config.name, selectedText, boundHandler);
    });

    this.currentAiButton.addBubbleButtons(bubbleButtons);
    this.currentAiButton.show();
  }

  removeCurrentAiButton() {
    if (this.currentAiButton) {
      console.log("Removing current AI button.");
      this.currentAiButton.remove();
      this.currentAiButton = null;
      this.popupHandler.closeCurrentPopup(); // Close popup when button is removed
    }
  }
}