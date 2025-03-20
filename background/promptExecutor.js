// background/promptExecutor.js

import { getApiKey } from './apiKeyManager.js';
import { getPromptTemplates } from './promptTemplateManager.js';

export const API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=';
export const MAX_OUTPUT_TOKENS_STORAGE_KEY = 'maxOutputTokens';
export const DEFAULT_MAX_OUTPUT_TOKENS = 1000;

// Cache for storing responses
const responseCache = new Map();

function getCacheKey(str) {
  // djb2 hash algorithm
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i); /* hash * 33 + c */
  }
  // Convert to a positive 32-bit integer
  hash = hash >>> 0;
  return hash.toString(16); // Convert to hexadecimal string
}

function addToCache(key, response) {
  responseCache.set(key, response);
}

async function sendToGeminiApi(apiKey, prompt, maxOutputTokens) {
  const response = await fetch(API_BASE_URL + apiKey, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        maxOutputTokens: maxOutputTokens, // Set the desired token limit here
        temperature: 0.9,
        topP: 1,
        topK: 1
      }
    }),
  });
  return await response.json();
}

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

function extractSummaryFromResponse(data) {
  if (data.error) {
    console.error('Error with Gemini API', data.error);
    return { error: data.error.message };
  }
  // Check if the structure is correct and extract the text
  if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text) {
    return { responseText: data.candidates[0].content.parts[0].text };
  } else {
    console.error('Unexpected response structure from Gemini API', data);
    return { error: 'Unexpected response structure from Gemini API' };
  }
}

async function executePrompt(prompt) {
  const cacheKey = getCacheKey(prompt);
  if (responseCache.has(cacheKey)) {
    console.log('Cache hit for prompt:', prompt);
    return responseCache.get(cacheKey);
  }

  try {
    const apiKey = await getApiKey();
    const maxOutputTokens = await getMaxOutputTokens();
    const response = await sendToGeminiApi(apiKey, prompt, maxOutputTokens);
    const result = extractSummaryFromResponse(response);
    if (responseCache.size >= 100) {
      responseCache.delete(responseCache.keys().next().value);
    }
    addToCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error in executePrompt:', error);
    return { error: error };
  }
}

async function executeSummaryPrompt(text, promptTemplates) {
  const prompt = promptTemplates.summarize.replace('{{text}}', text);
  return await executePrompt(prompt);
}

async function executeMeaningPrompt(text, promptTemplates) {
  const prompt = promptTemplates.meaning.replace('{{text}}', text);
  return await executePrompt(prompt);
}

async function executeRephrasePrompt(text, promptTemplates) {
  const prompt = promptTemplates.rephrase.replace('{{text}}', text);
  return await executePrompt(prompt);
}

async function executeTranslatePrompt(text, targetLanguage, promptTemplates) {
  const prompt = promptTemplates.translate.replace('{{text}}', text).replace('{{targetLanguage}}', targetLanguage);
  return await executePrompt(prompt);
}

// Add a listener for prompt execution related messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log(`promptExecutor: Received action=${request.action}`);
    if (request.action === 'summarize') {
      (async () => {
        const promptTemplates = await getPromptTemplates();
        sendResponse(await executeSummaryPrompt(request.text, promptTemplates));
      })();
      return true;
    }
    if (request.action === 'meaning') {
      (async () => {
        const promptTemplates = await getPromptTemplates();
        sendResponse(await executeMeaningPrompt(request.text, promptTemplates));
      })();
      return true;
    }
    if (request.action === 'rephrase') {
      (async () => {
        const promptTemplates = await getPromptTemplates();
        sendResponse(await executeRephrasePrompt(request.text, promptTemplates));
      })();
      return true;
    }
    if (request.action === 'translate') {
      (async () => {
        const promptTemplates = await getPromptTemplates();
        sendResponse(await executeTranslatePrompt(request.text, request.targetLanguage, promptTemplates));
      })();
      return true;
    }
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