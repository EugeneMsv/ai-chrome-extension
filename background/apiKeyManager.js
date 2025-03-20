// background/apiKeyManager.js

export const API_KEY_STORAGE_KEY = 'geminiApiKey';

export async function getApiKey() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get([API_KEY_STORAGE_KEY], (result) => {
      if (!result[API_KEY_STORAGE_KEY]) {
        console.error("Gemini API Key is not configured. Please set it up in the extension options.");
        reject("Gemini API Key is not configured. Please set it up in the extension options.");
      } else {
        resolve(result[API_KEY_STORAGE_KEY]);
      }
    });
  });
}

export async function saveApiKey(apiKey) {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ [API_KEY_STORAGE_KEY]: apiKey }, () => {
      resolve();
    });
  });
}

// Add a listener for API key related messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.module === 'apiKeyManager') {
    console.log(`apiKeyManager: Received action=${request.action}`);
    if (request.action === 'getApiKey') {
      (async () => {
        try {
          const apiKey = await getApiKey();
          sendResponse(apiKey);
        } catch (error) {
          sendResponse('');
        }
      })();
      return true;
    }
    if (request.action === 'saveApiKey') {
      (async () => {
        await saveApiKey(request.apiKey);
        sendResponse();
      })();
      return true;
    }
  }
});