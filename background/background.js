// background/background.js

// Core services and managers
import './apiKeyManager.js'; // Manages API key storage and retrieval
import './promptTemplateManager.js'; // Manages prompt templates
import './config/domainBlocker.js'; // Manages domain blocking

// Model Abstraction and Implementations
// import { AIModel } from './models/aiModel.js'; // Base class, not directly instantiated here
import { Gemini2FlashModel } from './models/gemini/gemini2FlashModel.js';
// Example: import { AnotherModel } from './models/another/anotherModel.js';

// Storage for model preferences
import { ModelStorage } from './storage/modelStorage.js';

// New Prompt Executor and its context definitions
import { PromptExecutor } from './promptExecutor.js';
import { PromptExecutionContext, PromptType } from './promptExecutionContext.js';

console.log('background.js: Background script starting setup...');

// --- 1. Initialize Models ---
// Create instances of all supported AI models
const gemini2Flash = new Gemini2FlashModel();
// const anotherModel = new AnotherModel(); // If you have other models

// Create a dictionary of supported models, keyed by their names
const supportedModels = {
  [gemini2Flash.getModelName()]: gemini2Flash,
  // [anotherModel.getModelName()]: anotherModel,
};
console.log('background.js: Supported models initialized:', Object.keys(supportedModels));

// --- 2. Initialize Storage Service for Model Choice ---
const modelStorage = new ModelStorage();
console.log('background.js: ModelStorage initialized.');

// --- 3. Initialize Prompt Executor ---
let promptExecutorInstance;
try {
  // Inject supported models and model storage into the executor
  promptExecutorInstance = new PromptExecutor(supportedModels, modelStorage);
  console.log('background.js: PromptExecutor initialized.');
} catch (error) {
  console.error('background.js: CRITICAL - Failed to initialize PromptExecutor:', error);
  // Consider how to handle this critical failure (e.g., disable extension features)
}

// --- 4. Setup Main Message Listener for Chrome Runtime ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (!promptExecutorInstance) {
    console.error("background.js: PromptExecutor not available to handle message. Initialization might have failed.");
    sendResponse({ error: "PromptExecutor service is not initialized.", modelUsed: "N/A" });
    return false; // Signal that we won't send an async response due to critical error
  }

  const { action, text, targetLanguage, customPrompt } = request;
  let context; // PromptExecutionContext instance

  // Log received action for easier debugging
  console.log(`background.js: Message received - Action: ${action}`);

  try {
    // Determine the type of prompt and create the execution context
    switch (action) {
      case PromptType.SUMMARIZE: // Using enum values directly for case matching
      case 'summarize': // Keep string for backward compatibility if needed, prefer enum
        context = new PromptExecutionContext(text, PromptType.SUMMARIZE);
        break;
      case PromptType.MEANING:
      case 'meaning':
        context = new PromptExecutionContext(text, PromptType.MEANING);
        break;
      case PromptType.REPHRASE:
      case 'rephrase':
        context = new PromptExecutionContext(text, PromptType.REPHRASE);
        break;
      case PromptType.TRANSLATE:
      case 'translate':
        if (typeof targetLanguage !== 'string' || targetLanguage.trim() === '') {
          console.error("background.js: 'translate' action missing or invalid targetLanguage.");
          sendResponse({ error: "targetLanguage (string) is required for translation.", modelUsed: "N/A" });
          return false; // No async response needed, error sent.
        }
        context = new PromptExecutionContext(text, PromptType.TRANSLATE, { targetLanguage });
        break;
      case 'executeCustomPrompt': // For generic prompts
        if (typeof customPrompt !== 'string' || customPrompt.trim() === '') {
          console.error("background.js: 'executeCustomPrompt' action missing or empty customPrompt string.");
          sendResponse({ error: "Custom prompt text (string) is required.", modelUsed: "N/A" });
          return false;
        }
        context = new PromptExecutionContext(customPrompt, PromptType.CUSTOM);
        break;
      default:
        // This listener is primarily for prompt execution.
        // If the action isn't recognized here, it might be for another manager.
        // console.log(`background.js: Action "${action}" not handled by PromptExecutor listener.`);
        return false; // Let other listeners (if any) handle this message.
    }
  } catch (error) {
    // Catch errors during PromptExecutionContext creation
    console.error(`background.js: Error creating PromptExecutionContext for action "${action}":`, error);
    sendResponse({ error: `Error processing request: ${error.message}`, modelUsed: "N/A" });
    return false; // No async response needed, error sent.
  }

  // If a context was successfully created, proceed to execute the prompt
  if (context) {
    (async () => {
      try {
        console.log(`background.js: Executing prompt for action "${context.promptType}"...`);
        const result = await promptExecutorInstance.executePrompt(context);
        console.log(`background.js: Prompt execution result for "${context.promptType}":`, result);
        sendResponse(result);
      } catch (error) {
        // Fallback catch for unexpected errors from executePrompt, though it should return {error}
        console.error(`background.js: Unhandled error during promptExecutor.executePrompt for "${context.promptType}":`, error);
        sendResponse({ error: `Internal server error during prompt execution: ${error.message}`, modelUsed: "N/A" });
      }
    })();
    return true; // Crucial: Indicates that sendResponse will be called asynchronously.
  }

  // If action was not recognized and no context created, let other listeners try.
  return false;
});

console.log('background.js: Background script fully started and core listeners configured.');

// Optional: Set a default model on first install or if none is set.
// This could also be part of an onInstalled listener.
// (async () => {
//   if (modelStorage) {
//     const currentModel = await modelStorage.getChosenModelName();
//     // If currentModel is the default (meaning nothing specific was stored or storage was empty)
//     // and you want to ensure a specific model from your supportedModels is set:
//     if (currentModel === modelStorage.defaultModelName && supportedModels[modelStorage.defaultModelName]) {
//        console.log(`background.js: Default model "${currentModel}" is active.`);
//     } else if (!supportedModels[currentModel] && Object.keys(supportedModels).length > 0) {
//        // If stored model is not supported, set to the first available one
//        const firstSupportedModel = Object.keys(supportedModels)[0];
//        await modelStorage.setChosenModelName(firstSupportedModel);
//        console.log(`background.js: Stored model "${currentModel}" not supported. Set to "${firstSupportedModel}".`);
//     }
//   }
// })();