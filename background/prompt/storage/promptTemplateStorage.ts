// background/prompt/storage/promptTemplateStorage.ts

/**
 * Defines the structure for prompt templates.
 * It's a record where keys are template names (e.g., "summarize")
 * and values are the template strings (e.g., "Summarize this: {{text}}").
 */
export type PromptTemplates = Record<string, string>;

/**
 * Service for managing prompt templates in chrome.storage.sync.
 */
export class PromptTemplateStorage {
  /**
   * The key used to store prompt templates in chrome.storage.sync.
   */
  static PROMPT_TEMPLATES_STORAGE_KEY = 'promptTemplates';

  /**
   * Default prompt templates to be used if none are found in storage or on reset.
   */
  static DEFAULT_PROMPT_TEMPLATES: PromptTemplates = {
    summarize: `Summarize the following text concisely: "{{text}}"`,
    meaning: `Explain the meaning of the following text concisely: "{{text}}"`,
    rephrase: `Rephrase the following text concisely: "{{text}}"`,
    translate: `Translate the following text to Russian concisely: "{{text}}"`
  };

  constructor() {
    // Constructor can be kept empty if no specific instance initialization is needed.
  }

  /**
   * Retrieves the prompt templates from storage.
   * @returns {Promise<PromptTemplates>} The stored prompt templates, or default templates if none are found or an error occurs.
   */
  async getPromptTemplates(): Promise<PromptTemplates> {
  try {
    const result = await chrome.storage.sync.get([PromptTemplateStorage.PROMPT_TEMPLATES_STORAGE_KEY]);
    const storedTemplates = result[PromptTemplateStorage.PROMPT_TEMPLATES_STORAGE_KEY];

    // Check if templates exist and are not an empty object
    if (storedTemplates && Object.keys(storedTemplates).length > 0) {
      console.log(`PromptTemplateStorage: Retrieved templates from storage.`);
      return storedTemplates;
    }
    console.log(`PromptTemplateStorage: No templates found in storage or templates are empty, returning default.`);
    return PromptTemplateStorage.DEFAULT_PROMPT_TEMPLATES;
  } catch (error) {
    console.error('PromptTemplateStorage: Error retrieving prompt templates:', error);
    // Fallback to default if storage access fails
    return PromptTemplateStorage.DEFAULT_PROMPT_TEMPLATES;
  }
}

/**
 * Stores the given prompt templates in chrome.storage.sync.
 * @param {PromptTemplates} promptTemplates - The prompt templates to store.
 * @returns {Promise<void>} A promise that resolves when the templates are saved.
 * @throws Will rethrow any error encountered during storage.
 */
async savePromptTemplates(promptTemplates: PromptTemplates): Promise<void> {
    try {
        await chrome.storage.sync.set({ [PromptTemplateStorage.PROMPT_TEMPLATES_STORAGE_KEY]: promptTemplates });
        console.log(`PromptTemplateStorage: Saved prompt templates.`);
    } catch (error) {
        console.error('PromptTemplateStorage: Error saving prompt templates:', error);
  throw error; // Rethrow to allow the caller to handle it
}
}

/**
 * Resets the prompt templates in storage to the default templates.
 * @returns {Promise<void>} A promise that resolves when the templates are reset.
 * @throws Will rethrow any error encountered during storage.
 */
async resetPromptTemplates(): Promise<void> {
    try {
        await this.savePromptTemplates(PromptTemplateStorage.DEFAULT_PROMPT_TEMPLATES);
        console.log(`PromptTemplateStorage: Reset prompt templates to default.`);
    } catch (error) {
        console.error('PromptTemplateStorage: Error resetting prompt templates:', error);
throw error; // Rethrow to allow the caller to handle it
}
}

/**
 * Gets the default prompt templates.
 * @returns {PromptTemplates} The default prompt templates.
 */
getDefaultTemplates(): PromptTemplates {
return PromptTemplateStorage.DEFAULT_PROMPT_TEMPLATES;
}
}