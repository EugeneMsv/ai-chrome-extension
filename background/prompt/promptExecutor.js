// background/promptExecutor.js

import { getPromptTemplates } from './promptTemplateManager.js';
import { PromptExecutionContext, PromptType } from './promptExecutionContext.js';
// AIModel and ModelStorage types are used for JSDoc, actual instances are injected.

export class PromptExecutor {
  /** @type {Map<string, {responseText?: string, error?: string}>} */
  #responseCache;
  #cacheSizeLimit;

  /**
   * @param {Object.<string, import('./models/aiModel.js').AIModel>} supportedModels - A dictionary of AIModel instances, keyed by model name.
   * @param {import('./storage/modelStorage.js').ModelStorage} modelStorage - Service for model preference.
   */
  constructor(supportedModels, modelStorage) {
    if (!supportedModels || Object.keys(supportedModels).length === 0) {
      throw new Error("PromptExecutor requires a non-empty dictionary of supportedModels.");
    }
    if (!modelStorage || typeof modelStorage.getChosenModelName !== 'function') {
      throw new Error("PromptExecutor requires a modelStorage instance with a getChosenModelName method.");
    }

    this.supportedModels = supportedModels;
    this.modelStorage = modelStorage;
    this.#responseCache = new Map();
    this.#cacheSizeLimit = 100; // Max number of items in cache
  }

  #getCacheKey(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i); /* hash * 33 + c */
    }
    hash = hash >>> 0;
    return hash.toString(16);
  }

  #addToCache(key, response) {
    if (this.#responseCache.size >= this.#cacheSizeLimit) {
      const oldestKey = this.#responseCache.keys().next().value;
      this.#responseCache.delete(oldestKey);
      console.log(`PromptExecutor Cache: Evicted oldest entry for key ${oldestKey}`);
    }
    this.#responseCache.set(key, response);
    console.log(`PromptExecutor Cache: Added entry for key ${key}`);
  }

  async #buildPromptString(context) {
    const promptTemplates = await getPromptTemplates();
    let finalPrompt = "";

    switch (context.promptType) {
      case PromptType.SUMMARIZE:
        if (!promptTemplates.summarize) throw new Error("Summarize prompt template is missing.");
        finalPrompt = promptTemplates.summarize.replace('{{text}}', context.text);
        break;
      case PromptType.MEANING:
        if (!promptTemplates.meaning) throw new Error("Meaning prompt template is missing.");
        finalPrompt = promptTemplates.meaning.replace('{{text}}', context.text);
        break;
      case PromptType.REPHRASE:
        if (!promptTemplates.rephrase) throw new Error("Rephrase prompt template is missing.");
        finalPrompt = promptTemplates.rephrase.replace('{{text}}', context.text);
        break;
      case PromptType.TRANSLATE:
        if (!promptTemplates.translate) throw new Error("Translate prompt template is missing.");
        if (!context.additionalArgs || !context.additionalArgs.targetLanguage) {
          throw new Error("targetLanguage is required for translation prompt type.");
        }
        finalPrompt = promptTemplates.translate
          .replace('{{text}}', context.text)
          .replace('{{targetLanguage}}', context.additionalArgs.targetLanguage);
        break;
      case PromptType.CUSTOM:
        finalPrompt = context.text; // For custom prompts, text is the full prompt
        break;
      default:
        throw new Error(`Unsupported prompt type: ${context.promptType}`);
    }
    return finalPrompt;
  }

  /**
   * Executes a prompt based on the provided context using the user's chosen AI model.
   * @param {PromptExecutionContext} context - The context for the prompt execution.
   * @returns {Promise<{responseText?: string, error?: string, modelUsed?: string, warning?: string}>}
   *          The result of the prompt execution, including the model name used and any warnings.
   */
  async executePrompt(context) {
    if (!(context instanceof PromptExecutionContext)) {
      console.error("PromptExecutor: executePrompt called with invalid context.", context);
      return { error: "Invalid prompt execution context.", modelUsed: "N/A" };
    }

    let finalPrompt;
    try {
      finalPrompt = await this.#buildPromptString(context);
    } catch (error) {
      console.error("PromptExecutor: Error building prompt string:", error);
      return { error: `Failed to build prompt: ${error.message}`, modelUsed: "N/A" };
    }

    const cacheKey = this.#getCacheKey(finalPrompt);
    if (this.#responseCache.has(cacheKey)) {
      console.log(`PromptExecutor: Cache hit for prompt (key: ${cacheKey}).`);
      const cachedResult = this.#responseCache.get(cacheKey);
      const currentModelName = await this.modelStorage.getChosenModelName(); // For consistent return structure
      return { ...cachedResult, modelUsed: currentModelName }; // Assuming cache stores {responseText, error}
    }

    console.log(`PromptExecutor: Cache miss for prompt (key: ${cacheKey}).`);

    let chosenModelName;
    try {
      chosenModelName = await this.modelStorage.getChosenModelName();
    } catch (storageError) {
      console.error("PromptExecutor: Failed to get chosen model name from storage:", storageError);
      return { error: "Could not retrieve chosen model configuration.", modelUsed: "N/A" };
    }

    let model = this.supportedModels[chosenModelName];
    let result;
    let warning;

    if (!model) {
      warning = `Model "${chosenModelName}" not found.`;
      console.warn(`PromptExecutor: ${warning}`);
      const availableModels = Object.keys(this.supportedModels);
      if (availableModels.length > 0) {
        const fallbackModelName = availableModels[0]; // Simple fallback to the first available
        model = this.supportedModels[fallbackModelName];
        chosenModelName = fallbackModelName; // Update to the model actually being used
        warning += ` Falling back to "${fallbackModelName}".`;
        console.warn(`PromptExecutor: Falling back to model "${fallbackModelName}".`);
      } else {
        console.error("PromptExecutor: No fallback models available.");
        return { error: `${warning} No fallback models available.`, modelUsed: chosenModelName };
      }
    }

    console.log(`PromptExecutor: Using model "${chosenModelName}" for prompt.`);
    try {
      result = await model.generate(finalPrompt);
    } catch (executionError) {
      // This is a safeguard; model.generate() should return { error: ... }
      console.error(`PromptExecutor: Unexpected error during model.generate() for ${chosenModelName}:`, executionError);
      return { error: `Execution error with model ${chosenModelName}: ${executionError.message}`, modelUsed: chosenModelName };
    }

    // Add to cache if successful
    if (result && !result.error && result.responseText) {
      this.#addToCache(cacheKey, { responseText: result.responseText });
    }

    const finalResult = { ...result, modelUsed: chosenModelName };
    if (warning) {
      finalResult.warning = warning;
    }
    return finalResult;
  }
}