// background/model/gemini/auth/geminiApiKeyManager.ts

class GeminiApiKeyManager { // eslint-disable-line no-unused-vars
  static API_KEY_STORAGE_KEY: string = 'geminiApiKey';

  async getApiKey(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      chrome.storage.sync.get([GeminiApiKeyManager.API_KEY_STORAGE_KEY], (result: { [key: string]: string }) => {
        if (!result[GeminiApiKeyManager.API_KEY_STORAGE_KEY]) {
          console.error("Gemini API Key is not configured. Please set it up in the extension options.");
          reject("Gemini API Key is not configured. Please set it up in the extension options.");
        } else {
          resolve(result[GeminiApiKeyManager.API_KEY_STORAGE_KEY]);
        }
      });
    });
  }

  async setApiKey(apiKey: string): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ [GeminiApiKeyManager.API_KEY_STORAGE_KEY]: apiKey }, () => {
        resolve();
      });
    });
  }
}

// Add a listener for API key related messages
chrome.runtime.onMessage.addListener((request: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
  console.log(`apiKeyManager: Received action=${request.action}`);
  const apiKeyManager = new GeminiApiKeyManager();
  if (request.action === 'getApiKey') { // eslint-disable-line no-lonely-if
    (async () => {
      try {
        const apiKey = await apiKeyManager.getApiKey();
        sendResponse(apiKey);
      } catch (error) {
        sendResponse('');
      }
    })();
    return true;
  } else if (request.action === 'saveApiKey') {
    (async () => {
      await apiKeyManager.setApiKey(request.apiKey);
      sendResponse();
    })();
    return true;
  }
});