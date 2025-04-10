// content/applicationManager.js

import { AiButton } from "./aiButton.js";
import { BubbleButton } from "./bubbleButton.js";
import { PopupHandler } from "./popupHandler.js";

let debounceTimeout = null;
export class ApplicationManager {
  constructor() {
    // Initialize properties that are core to the manager's identity
    // and don't depend on the current page state immediately.
    this.currentAiButton = null;
    this.isBlocked = false; // Initial assumption, will be checked in start()
    this.popupHandler = new PopupHandler(); // Core dependency

    console.log("ApplicationManager: instance created.");
    // Domain check and event listeners are moved to start()
  }

  /**
   * Starts the ApplicationManager by performing initial checks and setting up listeners.
   * Should be called after the instance is created.
   */
  async start() {
    console.log("ApplicationManager: starting...");
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
    this.isBlocked = await this._fetchDomainBlockedStatus();
    console.log(`ApplicationManager: initial domain blocked status: ${this.isBlocked}`);
  }

  _fetchDomainBlockedStatus() {
    return new Promise((resolve) => {
      if (!this._isChromeRuntimeAvailable()) {
        console.warn("ApplicationManager: Chrome runtime not available. Assuming domain is not blocked.");
        resolve(false);
        return;
      }
      chrome.runtime.sendMessage({ action: "isDomainBlocked" }, (response) => {
        if (chrome.runtime.lastError) {
          console.error("ApplicationManager: Error checking domain blocked status:", chrome.runtime.lastError.message);
          resolve(false); // Assume not blocked on error
        } else {
          resolve(response?.isBlocked ?? false);
        }
      });
    });
  }

  _isChromeRuntimeAvailable() {
    return (
      typeof chrome !== "undefined" &&
      chrome.runtime &&
      chrome.runtime.sendMessage
    );
  }

  _setupEventListeners() {
    // Listen for mouse up events to detect text selection
    document.addEventListener('mouseup', this._handleSelectionChange); // Bind `this`

    // Listen for messages from the background script (e.g., domain block changes)
    if (chrome.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener(this._handleBackgroundMessages); // Bind `this`
    } else {      console.warn("ApplicationManager: Chrome runtime.onMessage not available. Domain block updates won't be received.");
    }
    console.log("ApplicationManager: Event listeners set up.");
  }

  // Using bound methods or arrow functions for event handlers to maintain `this` context
  _handleBackgroundMessages = (message, sender, sendResponse) => {
    if (message.action === "domainBlockStatusChanged") {
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
    this._debounceSelectionChange(() => this._processSelectionChange(event));
  };

  _debounceSelectionChange(callback) {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(callback, 150);
  }

  async _processSelectionChange(event) {
    if (this.isBlocked) {
      this.removeCurrentAiButton();
      return;
    }

    const selectedText = this._getSelectedText();
    if (!selectedText) {
      this.removeCurrentAiButton();
      return;
    }

    const { pageX, pageY } = this._calculateButtonPagePosition(event);
    this._handleAiButtonVisibility(selectedText, pageX, pageY);
  }

  _getSelectedText() {
    const selection = window.getSelection();
    return selection?.toString().trim() && selection.rangeCount > 0 ? selection.toString().trim() : null;
  }

  _calculateButtonPagePosition(event) {
    const position = this._calculateButtonPosition(event.clientX, event.clientY);
    return {
      pageX: position.x + window.scrollX,
      pageY: position.y + window.scrollY,
    };
  }

  _handleAiButtonVisibility(selectedText, pageX, pageY) {
    if (this.currentAiButton) {
      const positionChanged = Math.abs(this.currentAiButton.positionX - pageX) > 5 || Math.abs(this.currentAiButton.positionY - pageY) > 5;
      if (this.currentAiButton.selectedText !== selectedText || positionChanged) {
        this.removeCurrentAiButton();
        this.createAndShowAiButton(selectedText, pageX, pageY);
      } else {
        this.currentAiButton.show();
      }
    } else {
      this.createAndShowAiButton(selectedText, pageX, pageY);
    }
  }

  _calculateButtonPosition(clientX, clientY) {
    const buttonSize = 40;
    const margin = 10;
    const offset = 15;

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

  // No changes needed here, they already use this.popupHandler correctly

  handleSummarizeClick = (selectedText, aiButton) => {
    this.popupHandler.showPopupForAction(
      'summarize',
      '<i>Summarizing...</i>',
      selectedText,
      aiButton,
    ).finally(() => {
      aiButton?.hide();
    });
  }

  handleMeaningClick = (selectedText, aiButton) => {
    this.popupHandler.showPopupForAction(
      'meaning',
      '<i>Fetching meaning...</i>',
      selectedText,
      aiButton,
    ).finally(() => {
      aiButton?.hide();
    });
  }

  handleRephraseClick = (selectedText, aiButton) => {
    this.popupHandler.showPopupForAction(
      'rephrase',
      '<i>Rephrasing...</i>',
      selectedText,
      aiButton,
    ).finally(() => {
      aiButton?.hide();
    });
  }

  handleTranslateClick = (selectedText, aiButton) => {
    this.popupHandler.showPopupForAction(
      'translate',
      '<i>Translating...</i>',
      selectedText,
      aiButton, { targetLanguage: 'Russian' }
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
      console.log("ApplicationManager: Removing current AI button.");
      this.currentAiButton.remove();
      this.currentAiButton = null;
      this.popupHandler.closeCurrentPopup(); // Close popup when button is removed
    }
  }
}
