// content/buttonManager.js

import { AiButton } from './aiButton.js';
import { BubbleButton } from './bubbleButton.js';
import {
handleSummarizeClick,
handleMeaningClick,
handleRephraseClick,
handleTranslateClick
} from './popupHandler.js'; // Import action handlers

let debounceTimeout = null;

export class ButtonManager {
  constructor() {
    this.currentAiButton = null;
    this.isBlocked = false; // Cache the blocked status
    this._checkDomainBlocked(); // Check initially
    this._setupEventListeners();
    console.log("ButtonManager initialized.");
  }

  // Fetches and caches the domain blocked status
  async _checkDomainBlocked() {
    this.isBlocked = await this._isCurrentDomainBlocked();
    // console.log("Domain blocked status:", this.isBlocked);
  }

  // Promise wrapper for checking domain block status
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
          resolve(false); // Default to not blocked on error
        } else {
          resolve(response?.isBlocked ?? false); // Use nullish coalescing
        }
      });
    });
  }

  // Sets up global event listeners
  _setupEventListeners() {
    // Use mouseup as the primary trigger for selection changes
    document.addEventListener('mouseup', (event) => this._handleSelectionChange(event));

    // Optional: Keyup can also trigger, but might be less intuitive
    // document.addEventListener('keyup', (event) => this._handleSelectionChange(event));

    // Listen for messages from other parts of the extension (e.g., background)
    if (chrome.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'domainBlockStatusChanged') {
          console.log("Domain block status potentially changed, re-checking...");
          this._checkDomainBlocked().then(() => {
            // If a button is currently shown and the domain is now blocked, hide it
            if (this.currentAiButton && this.isBlocked) {
              this.removeCurrentAiButton();
            }
          });
          sendResponse({ received: true }); // Acknowledge message
          return true; // Indicate async response if needed elsewhere
        }
        // Handle other messages if necessary
      });
    } else {
      console.warn("Chrome runtime.onMessage not available.");
    }
  }

  // Handles debounced selection changes
  _handleSelectionChange(event) {
    clearTimeout(debounceTimeout); // Clear previous debounce timer

    debounceTimeout = setTimeout(async () => {
      // Re-check blocked status in case it changed via message
      if (this.isBlocked) {
        this.removeCurrentAiButton(); // Ensure button is hidden if domain is blocked
        return;
      }

      const selectedText = window.getSelection().toString().trim();
      const selection = window.getSelection();

      if (selectedText && selection.rangeCount > 0) {
        // Calculate position near the mouse cursor
        const position = this._calculateButtonPosition(event.clientX, event.clientY);
        const pageX = position.x + window.pageXOffset;
        const pageY = position.y + window.pageYOffset;

        // If button exists but selection/position changed significantly, replace it
        if (this.currentAiButton) {
          const positionChanged = Math.abs(this.currentAiButton.positionX - pageX) > 5 || Math.abs(this.currentAiButton.positionY - pageY) > 5;
          if (this.currentAiButton.selectedText !== selectedText || positionChanged) {
            this.removeCurrentAiButton();
            this.createAndShowAiButton(selectedText, pageX, pageY);
          } else {
            // If text and position are the same, just ensure it's shown (might have timed out)
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
    }, 150); // Debounce delay (150ms)
  }

  // Calculates the desired position for the AI button container (viewport relative)
  _calculateButtonPosition(clientX, clientY) {
    let x = clientX;
    let y = clientY;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const containerSize = 200; // Match AiButton's container size
    const buttonRadius = containerSize / 2;
    const margin = 20; // Minimum distance from edge

    // Try positioning slightly below and to the right
    let targetX = x + buttonRadius / 2;
    let targetY = y + buttonRadius / 2;

    // Adjust if it goes off-screen
    if (targetX + buttonRadius > windowWidth - margin) {
      targetX = x - buttonRadius * 1.5; // Move left
    }
    if (targetY + buttonRadius > windowHeight - margin) {
      targetY = y - buttonRadius * 1.5; // Move up
    }

    // Ensure it's not off-screen top/left
    targetX = Math.max(margin + buttonRadius, targetX);
    targetY = Math.max(margin + buttonRadius, targetY);

    // Return viewport coordinates (pageX/Y will be added later)
    // The coordinates are for the *center* of the AiButton container
    return { x: targetX, y: targetY };
  }

  // Creates the AiButton and its associated BubbleButtons
  createAndShowAiButton(selectedText, pageX, pageY) {
    if (this.currentAiButton) {
      this.removeCurrentAiButton(); // Ensure only one instance
    }

    // 1. Create the AiButton instance (needs position first)
    this.currentAiButton = new AiButton(pageX, pageY);
    // Store details for comparison later
    this.currentAiButton.selectedText = selectedText;
    this.currentAiButton.positionX = pageX;
    this.currentAiButton.positionY = pageY;


    // 2. Define configurations for Bubble Buttons
    const bubbleButtonConfigs = [
      { name: 'Summarize', handler: handleSummarizeClick },
      { name: 'Meaning', handler: handleMeaningClick },
      { name: 'Rephrase', handler: handleRephraseClick },
      { name: 'Translate', handler: handleTranslateClick },
      // Add more actions here if needed
    ];

    // 3. Create BubbleButton instances, binding the current AiButton to their handlers
    const bubbleButtons = bubbleButtonConfigs.map(config => {
      // Create a new function that calls the original handler with the selected text
      // AND the currentAiButton instance. BubbleButton itself doesn't need the aiButton.
      const boundHandler = (text) => config.handler(text, this.currentAiButton);
      return new BubbleButton(config.name, selectedText, boundHandler);
    });

    // 4. Pass the created BubbleButtons to the AiButton
    this.currentAiButton.addBubbleButtons(bubbleButtons);

    // 5. Show the AiButton (which internally shows its container and positioned bubbles)
    this.currentAiButton.show();
  }

  // Removes the currently active AI button and its children
  removeCurrentAiButton() {
    if (this.currentAiButton) {
      this.currentAiButton.remove(); // Use the AiButton's comprehensive remove method
      this.currentAiButton = null;
    }
  }
}