// background/promptTemplateManager.js

export const PROMPT_TEMPLATES_STORAGE_KEY = 'promptTemplates';

export const defaultPromptTemplates = {
  summarize: `Summarize the following text concisely: "{{text}}"`,
  meaning: `Explain the meaning of the following text concisely: "{{text}}"`,
  rephrase: `Rephrase the following text concisely: "{{text}}"`,
  translate: `Translate the following text to {{targetLanguage}} concisely: "{{text}}"`
};

export async function getPromptTemplates() {
  return new Promise((resolve) => {
    chrome.storage.sync.get([PROMPT_TEMPLATES_STORAGE_KEY], (result) => {
      resolve(result[PROMPT_TEMPLATES_STORAGE_KEY] || defaultPromptTemplates);
    });
  });
}

export async function savePromptTemplates(promptTemplates) {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ [PROMPT_TEMPLATES_STORAGE_KEY]: promptTemplates }, () => {
      resolve();
    });
  });
}

export async function resetPromptTemplates() {
  await savePromptTemplates(defaultPromptTemplates);
}

// Add a listener for prompt template related messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.module === 'promptTemplateManager') {
    console.log(`promptTemplateManager: Received action=${request.action}`);
    if (request.action === 'getPromptTemplates') {
      (async () => {
        sendResponse(await getPromptTemplates());
      })();
      return true;
    }
    if (request.action === 'getDefaultPromptTemplates') {
      (async () => {
        sendResponse(defaultPromptTemplates);
      })();
      return true;
    }
    if (request.action === 'savePromptTemplates') {
      (async () => {
        await savePromptTemplates(request.promptTemplates);
        sendResponse();
      })();
      return true;
    }
    if (request.action === 'resetPromptTemplates') {
      (async () => {
        await resetPromptTemplates();
        sendResponse();
      })();
      return true;
    }
  }
});