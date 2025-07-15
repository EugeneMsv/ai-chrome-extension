// background/maxOutputTokensManager.js

export const MAX_OUTPUT_TOKENS_STORAGE_KEY = 'maxOutputTokens';
export const DEFAULT_MAX_OUTPUT_TOKENS = 1000;

// Function to get maxOutputTokens from storage or use default
export async function getMaxOutputTokens() {
  return new Promise((resolve) => {
    chrome.storage.sync.get([MAX_OUTPUT_TOKENS_STORAGE_KEY], (result) => {
      resolve(result[MAX_OUTPUT_TOKENS_STORAGE_KEY] || DEFAULT_MAX_OUTPUT_TOKENS);
    });
  });
}

// Function to save maxOutputTokens to storage
export async function saveMaxOutputTokens(maxOutputTokens) {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ [MAX_OUTPUT_TOKENS_STORAGE_KEY]: maxOutputTokens }, () => {
      resolve();
    });
  });
}

// Add a listener for maxOutputTokens related messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log(`maxOutputTokensManager: Received action=${request.action}`);
  if (request.action === 'getMaxOutputTokens') {
    (async () => {
      sendResponse(await getMaxOutputTokens());
    })();
    return true;
  }
  if (request.action === 'saveMaxOutputTokens') {
    (async () => {
      await saveMaxOutputTokens(request.maxOutputTokens);
      sendResponse();
    })();
    return true;
  }
});