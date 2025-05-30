// content/popupHandler.js

import { marked } from 'marked'; // Assuming marked is installed and bundled

export class PopupHandler {
  constructor() {
    this.currentPopup = null;
    this.associatedAiButton = null;
    this.clickOutsideHandler = null;
    this._boundClickOutsideHandler = null;
  }

  /**
   * Internal method to send requests to the background script.
   * @param {string} action - The action to perform.
   * @param {string} text - The text data for the action.
   * @param {object} [additionalParams={}] - Additional parameters for the request.
   * @returns {Promise<object>} A promise that resolves with the response object or rejects with an error.
   * @private
   */
  _sendRequestToBackground(action, text, additionalParams = {}) {
    return new Promise((resolve, reject) => {
      if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
        console.error("Chrome runtime is not available to send message.");
        // Reject the promise so the caller can handle the error display
        reject(new Error("Cannot communicate with background script."));
        return;
      }

      try {
        chrome.runtime.sendMessage(
          { action: action, text: text, ...additionalParams },
          (response) => {
            if (chrome.runtime.lastError) {
              console.error(`Error receiving response for ${action}:`, chrome.runtime.lastError.message);
              reject(new Error(chrome.runtime.lastError.message));
            } else if (response?.error) {
              console.error(`Error from background for ${action}:`, response.error);
              reject(new Error(response.error));
            } else if (response?.responseText !== undefined) {
              resolve(response);
            } else {
              console.warn(`No response or unexpected format for ${action}:`, response);
              reject(new Error("Received no response or an unexpected response."));
            }
          }
        );
      } catch (e) {
        console.error(`Error sending message for ${action}:`, e);
        reject(new Error(`Error sending request: ${e.message}`));
      }
    });
  }

  /**
   * Displays a popup with a loading message, sends a request, and updates the popup.
   * @param {string} action - The action name for the background request.
   * @param {string} loadingMessage - The initial message to display (e.g., "<i>Summarizing...</i>").
   * @param {string} text - The text data for the action.
   * @param {AiButton} aiButton - The button instance that triggered the action.
   * @param {object} [additionalParams={}] - Additional parameters for the request.
   * @returns {Promise<object>} The promise returned by _sendRequestToBackground.
   */
  showPopupForAction(action, loadingMessage, text, aiButton, additionalParams = {}) {
    // 1. Show the initial loading state popup
    this.showPopup(loadingMessage, aiButton, false); // Don't add close listeners yet

    // 2. Send the request internally
    const requestPromise = this._sendRequestToBackground(action, text, additionalParams);

    // 3. Handle the response (success or error) by updating the popup
    requestPromise
      .then(response => {
      // Update existing popup with success content
      this.updatePopupContent(response.responseText);
    })
      .catch(error => {
      // Update existing popup (or show a new one if needed) with error content
      // Ensure listeners are added now since it's a final state (error)
      this.showPopup(`Error: ${error.message || 'Request failed'}`, aiButton, true);
    });

    // 4. Return the original promise so the caller can attach .finally() etc.
    return requestPromise;
  }


  // --- Popup Display Logic (Mostly unchanged, but simplified error handling) ---

  closeCurrentPopup() {
    if (this.currentPopup && this.currentPopup.parentNode) {
      this.currentPopup.remove();
    }
    if (this._boundClickOutsideHandler) {
      document.removeEventListener('click', this._boundClickOutsideHandler, true);
    }
    this.currentPopup = null;
    this.associatedAiButton = null;
    this.clickOutsideHandler = null;
    this._boundClickOutsideHandler = null;
  }

  updatePopupContent(newContent) {
    if (!this.currentPopup) {
      // If popup was closed before update, maybe log or handle gracefully
      console.warn("Attempted to update content, but popup no longer exists.");
      return;
    }

    const contentArea = this.currentPopup.querySelector('.popup-content-area');
    const closeButton = this.currentPopup.querySelector('.popup-close-button');
    if (contentArea) {
      try {
        contentArea.innerHTML = marked.parse(newContent);
      } catch (parseError) {
        console.error("Error parsing markdown:", parseError);
        contentArea.textContent = "Error displaying content.";
      }
    }
    // Ensure close button listener is attached after content update (success case)
    if (closeButton && !closeButton.onclick) {
      this._addCloseFunctionality(closeButton);
    }
    // Ensure click outside listener is attached after content update (success case)
    if (this.associatedAiButton && !this._boundClickOutsideHandler) {
      this._addClickOutsideListener();
    }
  }

  // This method now primarily creates the popup structure.
  // Content update and listener attachment might happen later via updatePopupContent.
  showPopup(content, aiButton, addListeners = true) {
    this.closeCurrentPopup();
    this.associatedAiButton = aiButton;
    const popup = document.createElement('div');
    this.currentPopup = popup;

    // --- Styles ---
    Object.assign(popup.style, {
      position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
      background: '#282c34', border: '1px solid #444', padding: '20px', zIndex: '10000',
      width: '450px', maxWidth: '90vw', maxHeight: '80vh', color: '#abb2bf',
      fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif', borderRadius: '8px',
      boxShadow: '0 8px 25px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', fontSize: '14px',
    });

    // --- Content Area ---
    const contentArea = document.createElement('div');
    contentArea.className = 'popup-content-area';
    Object.assign(contentArea.style, {
      marginBottom: '15px', lineHeight: '1.6', overflowY: 'auto', flexGrow: '1', minHeight: '50px',
    });
    try {
      contentArea.innerHTML = marked.parse(content); // Set initial content
    } catch (parseError) {
      console.error("Error parsing initial markdown:", parseError);
      contentArea.textContent = "Error displaying content.";
    }

    // --- Close Button ---
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.className = 'popup-close-button';
    Object.assign(closeButton.style, {
      padding: '8px 15px', background: '#4f5666', color: '#c8ccd4', border: 'none',
      borderRadius: '5px', cursor: 'pointer', fontSize: '13px', alignSelf: 'flex-end',
      marginTop: 'auto', transition: 'background-color 0.2s ease',
    });
    closeButton.addEventListener('mouseover', () => closeButton.style.backgroundColor = '#6b7385');
    closeButton.addEventListener('mouseout', () => closeButton.style.backgroundColor = '#4f5666');

    // Add close functionality conditionally (e.g., for error popups shown directly)
    if (addListeners) {
      this._addCloseFunctionality(closeButton);
    }

    popup.appendChild(contentArea);
    popup.appendChild(closeButton);
    document.body.appendChild(popup);

    // Add click outside listener conditionally
    if (addListeners) {
      this._addClickOutsideListener();
    }
  }

  _addCloseFunctionality(button) {
    button.onclick = () => {
      this.closeCurrentPopup();
    };
  }

  _addClickOutsideListener() {
    // Debounce adding the listener slightly
    setTimeout(() => {
      // Prevent adding multiple listeners if called rapidly
      if (this._boundClickOutsideHandler) {
        document.removeEventListener('click', this._boundClickOutsideHandler, true);
      }

      this.clickOutsideHandler = (event) => {
        if (this.currentPopup && !this.currentPopup.contains(event.target) &&
        this.associatedAiButton && !this.associatedAiButton.buttonContainer?.contains(event.target))
        {
          this.closeCurrentPopup();
        }
      };
      this._boundClickOutsideHandler = this.clickOutsideHandler.bind(this);
      document.addEventListener('click', this._boundClickOutsideHandler, true);
    }, 0);
  }
}