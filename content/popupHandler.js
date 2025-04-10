// content/popupHandler.js

import { marked } from 'marked'; // Assuming marked is installed and bundled

let currentPopup = null;
let associatedAiButton = null; // Keep track of which button triggered the popup
let clickOutsideHandler = null; // Store the handler reference for removal

// Function to send requests to the background script
function sendRequestToBackground(action, text, callback, additionalParams = {}, aiButton) {
  if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
    console.error("Chrome runtime is not available to send message.");
    showPopup("Error: Cannot communicate with background script.", aiButton);
    aiButton?.hide(); // Use optional chaining and hide
    return;
  }

  try {
    chrome.runtime.sendMessage(
      { action: action, text: text, ...additionalParams },
      (response) => {
        try {
          if (chrome.runtime.lastError) {
            console.error(`Error receiving response for ${action}:`, chrome.runtime.lastError.message);
            showPopup(`Error: ${chrome.runtime.lastError.message}`, aiButton);
          } else if (response?.error) { // Check for explicit error property from background
            console.error(`Error from background for ${action}:`, response.error);
            showPopup(`Error: ${response.error}`, aiButton);
          } else if (response?.responseText) { // Check if responseText exists
            callback(response); // Execute the success callback
          } else {
            console.warn(`No response or unexpected format for ${action}:`, response);
            showPopup("Received no response or an unexpected response.", aiButton);
          }
        } catch (callbackError) {
          console.error(`Error executing callback for ${action}:`, callbackError);
          showPopup(`Error processing response: ${callbackError.message}`, aiButton);
        } finally {
          // Hide the specific AI button that triggered this, regardless of success/error
          // Use hide() so it can reappear on next selection, not remove()
          aiButton?.hide(); // Use optional chaining
        }
      }
    );
  } catch (e) {
    console.error(`Error sending message for ${action}:`, e);
    showPopup(`Error sending request: ${e.message}`, aiButton);
    aiButton?.hide(); // Use optional chaining
  }
}

// --- Action Handlers ---
// These are called by the BubbleButtons via the ButtonManager
// They now receive the aiButton instance to pass to sendRequestToBackground

export function handleSummarizeClick(selectedText, aiButton) {
  showPopup("<i>Summarizing...</i>", aiButton, false); // Show loading state, don't add close listener yet
  sendRequestToBackground('summarize', selectedText, (response) => {
    updatePopupContent(response.responseText); // Update existing popup
  }, {}, aiButton);
}

export function handleMeaningClick(selectedText, aiButton) {
  showPopup("<i>Fetching meaning...</i>", aiButton, false);
  sendRequestToBackground('meaning', selectedText, (response) => {
    updatePopupContent(response.responseText);
  }, {}, aiButton);
}

export function handleRephraseClick(selectedText, aiButton) {
  showPopup("<i>Rephrasing...</i>", aiButton, false);
  sendRequestToBackground('rephrase', selectedText, (response) => {
    updatePopupContent(response.responseText);
  }, {}, aiButton);
}

export function handleTranslateClick(selectedText, aiButton) {
  showPopup("<i>Translating...</i>", aiButton, false);
  // TODO: Make targetLanguage configurable via options or popup
  sendRequestToBackground('translate', selectedText, (response) => {
    updatePopupContent(response.responseText);
  }, { targetLanguage: 'Russian' }, aiButton);
}


// --- Popup Display Logic ---

function closeCurrentPopup() {
  if (currentPopup && currentPopup.parentNode) {
    currentPopup.remove();
  }
  if (clickOutsideHandler) {
    document.removeEventListener('click', clickOutsideHandler, true); // Clean up listener
  }
  currentPopup = null;
  associatedAiButton = null;
  clickOutsideHandler = null;
}

// Updates the content of the currently displayed popup
function updatePopupContent(newContent) {
  if (!currentPopup) return;

  const contentArea = currentPopup.querySelector('.popup-content-area');
  const closeButton = currentPopup.querySelector('.popup-close-button');
  if (contentArea) {
    try {
      // Consider sanitizing HTML before inserting if using marked or similar
      contentArea.innerHTML = marked.parse(newContent);
    } catch (parseError) {
      console.error("Error parsing markdown:", parseError);
      contentArea.textContent = "Error displaying content."; // Fallback
    }
  }
  // Ensure close button is visible and listener is attached after content update
  if (closeButton && !closeButton.onclick) {
    addCloseFunctionality(closeButton);
  }
  if (associatedAiButton && !clickOutsideHandler) {
    addClickOutsideListener(); // Add listener only after content is loaded
  }
}


export function showPopup(content, aiButton, addListeners = true) {
  closeCurrentPopup(); // Close any existing popup first

  associatedAiButton = aiButton; // Associate this popup with the button instance

  const popup = document.createElement('div');
  currentPopup = popup; // Store reference

  // --- Styles (Consider moving to a CSS file) ---
  Object.assign(popup.style, {
    position: 'fixed',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    background: '#282c34', // Darker, slightly blue background
    border: '1px solid #444',
    padding: '20px',
    zIndex: '10000', // Ensure it's on top
    width: '450px',
    maxWidth: '90vw',
    maxHeight: '80vh',
    color: '#abb2bf', // Light gray text
    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
    borderRadius: '8px',
    boxShadow: '0 8px 25px rgba(0,0,0,0.6)',
    display: 'flex',
    flexDirection: 'column',
    fontSize: '14px',
  });

  // --- Content Area ---
  const contentArea = document.createElement('div');
  contentArea.className = 'popup-content-area'; // Add class for selection
  Object.assign(contentArea.style, {
    marginBottom: '15px',
    lineHeight: '1.6',
    overflowY: 'auto', // Scroll content area only
    flexGrow: '1', // Take available space
    minHeight: '50px', // Ensure some height even when loading
  });
  try {
    contentArea.innerHTML = marked.parse(content); // Initial content (might be "Loading...")
  } catch (parseError) {
    console.error("Error parsing initial markdown:", parseError);
    contentArea.textContent = "Error displaying content.";
  }

  // --- Close Button ---
  const closeButton = document.createElement('button');
  closeButton.textContent = 'Close';
  closeButton.className = 'popup-close-button'; // Add class
  Object.assign(closeButton.style, {
    padding: '8px 15px',
    background: '#4f5666', // Button background
    color: '#c8ccd4', // Button text
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '13px',
    alignSelf: 'flex-end', // Align to bottom-right
    marginTop: 'auto', // Push to bottom
    transition: 'background-color 0.2s ease',
  });

  // Add hover effect for close button
  closeButton.addEventListener('mouseover', () => closeButton.style.backgroundColor = '#6b7385');
  closeButton.addEventListener('mouseout', () => closeButton.style.backgroundColor = '#4f5666');

  // Add close functionality (conditionally)
  if (addListeners) {
    addCloseFunctionality(closeButton);
  }

  // --- Assemble Popup ---
  popup.appendChild(contentArea);
  popup.appendChild(closeButton);
  document.body.appendChild(popup);

  // Add click outside listener (conditionally)
  if (addListeners) {
    addClickOutsideListener();
  }
}

function addCloseFunctionality(button) {
  button.onclick = () => { // Use onclick for simplicity here
    closeCurrentPopup();
    // We don't hide the associatedAiButton here, let its own timeout handle it
  };
}

function addClickOutsideListener() {
  // Use a timeout to prevent the listener from catching the initial click/mouseup
  setTimeout(() => {
    clickOutsideHandler = (event) => {
      // Close if click is outside popup and not on the associated AI button/container
      if (currentPopup && !currentPopup.contains(event.target) &&
      associatedAiButton && !associatedAiButton.buttonContainer?.contains(event.target))
      {
        closeCurrentPopup();
      }
    };
    document.addEventListener('click', clickOutsideHandler, true); // Use capture phase
  }, 0);
}