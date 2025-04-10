// content/applicationManager.js

import { AiButton } from './aiButton.js';
import { BubbleButton } from './bubbleButton.js';
import { PopupHandler } from './popupHandler.js'; // Only import PopupHandler

let debounceTimeout = null;

export class ApplicationManager {
  constructor() {
    this.currentAiButton = null;
    this.isBlocked = false;
    this.popupHandler = new PopupHandler();
    this._checkDomainBlocked();
    this._setupEventListeners();
    console.log("ApplicationManager initialized.");
  }

  async _checkDomainBlocked() {
    this.isBlocked = await this._isCurrentDomainBlocked();
  }

  _isCurrentDomainBlocked() {
    // ... (implementation unchanged)
    return new Promise((resolve) => {
      if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
        console.warn("Chrome runtime not available. Assuming domain is not blocked.");
        resolve(false); return;
      }
      chrome.runtime.sendMessage({ action: 'isDomainBlocked' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error checking domain blocked status:', chrome.runtime.lastError.message); resolve(false);
        } else { resolve(response?.isBlocked ?? false); }
      });
    });
  }

  _setupEventListeners() {
    // ... (implementation unchanged)
    document.addEventListener('mouseup', (event) => this._handleSelectionChange(event));
    if (chrome.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'domainBlockStatusChanged') {
          console.log("Domain block status potentially changed, re-checking...");
          this._checkDomainBlocked().then(() => {
            if (this.currentAiButton && this.isBlocked) { this.removeCurrentAiButton(); }
          });
          sendResponse({ received: true }); return true;
        }
      });
    } else { console.warn("Chrome runtime.onMessage not available."); }
  }

  _handleSelectionChange(event) {
    // ... (implementation unchanged)
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(async () => {
      if (this.isBlocked) { this.removeCurrentAiButton(); return; }
      const selectedText = window.getSelection().toString().trim();
      const selection = window.getSelection();
      if (selectedText && selection.rangeCount > 0) {
        const position = this._calculateButtonPosition(event.clientX, event.clientY);
        const pageX = position.x + window.pageXOffset;
        const pageY = position.y + window.pageYOffset;
        if (this.currentAiButton) {
          const positionChanged = Math.abs(this.currentAiButton.positionX - pageX) > 5 || Math.abs(this.currentAiButton.positionY - pageY) > 5;
          if (this.currentAiButton.selectedText !== selectedText || positionChanged) {
            this.removeCurrentAiButton(); this.createAndShowAiButton(selectedText, pageX, pageY);
          } else { this.currentAiButton.show(); }
        } else { this.createAndShowAiButton(selectedText, pageX, pageY); }
      } else { this.removeCurrentAiButton(); }
    }, 150);
  }

  _calculateButtonPosition(clientX, clientY) {
    // ... (implementation unchanged)
    let x = clientX; let y = clientY;
    const windowWidth = window.innerWidth; const windowHeight = window.innerHeight;
    const containerSize = 200; const buttonRadius = containerSize / 2; const margin = 20;
    let targetX = x + buttonRadius / 2; let targetY = y + buttonRadius / 2;
    if (targetX + buttonRadius > windowWidth - margin) { targetX = x - buttonRadius * 1.5; }
    if (targetY + buttonRadius > windowHeight - margin) { targetY = y - buttonRadius * 1.5; }
    targetX = Math.max(margin + buttonRadius, targetX); targetY = Math.max(margin + buttonRadius, targetY);
    return { x: targetX, y: targetY };
  }

  // --- Action Handlers (Use the generic popupHandler method) ---

  handleSummarizeClick = (selectedText, aiButton) => {
    this.popupHandler.showPopupForAction(
      'summarize',                // Action name
      '<i>Summarizing...</i>',    // Loading message
      selectedText,               // Text data
      aiButton                    // Associated button
      // No additional params needed here
    )
    // We don't need .then() or .catch() here anymore for popup updates
      .finally(() => {
      // Still hide the button when the operation (success or fail) completes
      aiButton?.hide();
    });
  }

  handleMeaningClick = (selectedText, aiButton) => {
    this.popupHandler.showPopupForAction(
      'meaning',
      '<i>Fetching meaning...</i>',
      selectedText,
      aiButton
    )
      .finally(() => {
      aiButton?.hide();
    });
  }

  handleRephraseClick = (selectedText, aiButton) => {
    this.popupHandler.showPopupForAction(
      'rephrase',
      '<i>Rephrasing...</i>',
      selectedText,
      aiButton
    )
      .finally(() => {
      aiButton?.hide();
    });
  }

  handleTranslateClick = (selectedText, aiButton) => {
    this.popupHandler.showPopupForAction(
      'translate',
      '<i>Translating...</i>',
      selectedText,
      aiButton,
      { targetLanguage: 'Russian' } // Pass additional params
    )
      .finally(() => {
      aiButton?.hide();
    });
  }

  // --- Button Creation (Unchanged) ---

  createAndShowAiButton(selectedText, pageX, pageY) {
    if (this.currentAiButton) { this.removeCurrentAiButton(); }
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
      this.currentAiButton.remove();
      this.currentAiButton = null;
      this.popupHandler.closeCurrentPopup(); // Close popup when button is removed
    }
  }
}