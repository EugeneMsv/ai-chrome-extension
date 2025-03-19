// background/background.js

const API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=';

// Default prompt templates
const defaultPromptTemplates = {
    summarize: `Summarize the following text concisely: "{{text}}"`,
    meaning: `Explain the meaning of the following text concisely: "{{text}}"`,
    rephrase: `Rephrase the following text concisely: "{{text}}"`,
    translate: `Translate the following text to {{targetLanguage}} concisely: "{{text}}"`
};

// Default maxOutputTokens
const defaultMaxOutputTokens = 1000;


// Cache for storing responses
const responseCache = new Map();

async function getApiKey() {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get(['geminiApiKey'], (result) => {
            if (!result.geminiApiKey) {
                console.error("Gemini API Key is not configured. Please set it up in the extension options.");
                reject("Gemini API Key is not configured. Please set it up in the extension options.");
            } else {
                resolve(result.geminiApiKey);
            }
        });
    });
}

// Function to save API key to storage
async function saveApiKey(apiKey) {
    return new Promise((resolve) => {
        chrome.storage.sync.set({ geminiApiKey: apiKey }, () => {
            resolve();
        });
    });
}

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
async function getMaxOutputTokens() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['maxOutputTokens'], (result) => {
            resolve(result.maxOutputTokens || defaultMaxOutputTokens);
        });
    });
}

// Function to save maxOutputTokens to storage
async function saveMaxOutputTokens(maxOutputTokens) {
    return new Promise((resolve) => {
        chrome.storage.sync.set({ maxOutputTokens: maxOutputTokens }, () => {
            resolve();
        });
    });
}

// Function to get the current prompt templates from storage or use defaults
async function getPromptTemplates() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['promptTemplates'], (result) => {
            resolve(result.promptTemplates || defaultPromptTemplates);
        });
    });
}

// Function to save prompt templates to storage
async function savePromptTemplates(promptTemplates) {
    return new Promise((resolve) => {
        chrome.storage.sync.set({ promptTemplates: promptTemplates }, () => {
            resolve();
        });
    });
}

// Function to reset prompt templates to defaults
async function resetPromptTemplates() {
    await savePromptTemplates(defaultPromptTemplates);
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

async function executeSummaryPrompt(text) {
    const promptTemplates = await getPromptTemplates();
    const prompt = promptTemplates.summarize.replace('{{text}}', text);
    return await executePrompt(prompt);
}

async function executeMeaningPrompt(text) {
    const promptTemplates = await getPromptTemplates();
    const prompt = promptTemplates.meaning.replace('{{text}}', text);
    return await executePrompt(prompt);
}

async function executeRephrasePrompt(text) {
    const promptTemplates = await getPromptTemplates();
    const prompt = promptTemplates.rephrase.replace('{{text}}', text);
    return await executePrompt(prompt);
}

async function executeTranslatePrompt(text, targetLanguage) {
    const promptTemplates = await getPromptTemplates();
    const prompt = promptTemplates.translate.replace('{{text}}', text).replace('{{targetLanguage}}', targetLanguage);
    return await executePrompt(prompt);
}

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Received action=', request.action);
    if (request.action === 'summarize') {
        (async () => {
            sendResponse(await executeSummaryPrompt(request.text));
        })();
        return true; // Keep the message channel open for async response
    }
    if (request.action === 'meaning') {
        (async () => {
            sendResponse(await executeMeaningPrompt(request.text));
        })();
        return true;
    }
    if (request.action === 'rephrase') {
        (async () => {
            sendResponse(await executeRephrasePrompt(request.text));
        })();
        return true;
    }
    if (request.action === 'translate') {
        (async () => {
            sendResponse(await executeTranslatePrompt(request.text, request.targetLanguage));
        })();
        return true;
    }
    // We do not need to do anythin with buttonCreated
    if (request.action === 'buttonCreated') {
        console.log('buttonCreated request received but not handled in background', request);
    }
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
});
