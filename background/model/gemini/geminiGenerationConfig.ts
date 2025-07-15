// background/model/gemini/geminiGenerationConfigBuilder.js

// Import the base class
import { GenerationConfigBuilder } from '../generationConfig.ts';

// TODO: Import getMaxOutputTokens from its actual location
// For example: import { getMaxOutputTokens } from './utils/configUtils.js';
// Or, if it's a global or needs to be defined in this file, ensure it's accessible.

export class GeminiGenerationConfig {
  constructor(maxOutputTokens, temperature, topP, topK) {
    this.maxOutputTokens = maxOutputTokens;
    this.temperature = temperature;
    this.topP = topP;
    this.topK = topK;
  }

  /**
   * Converts the configuration to a JSON object.
   * @returns {object} The JSON representation of the configuration.
   */
  toJSON() {
    return { maxOutputTokens: this.maxOutputTokens, temperature: this.temperature, topP: this.topP, topK: this.topK };
  }
}

export class GeminiGenerationConfigBuilder extends GenerationConfigBuilder {
  constructor() {
    super();
    // Default Gemini-specific values
    this.temperature = 0.9; // Example default
    this.topP = 1.0;        // Example default
    this.topK = 1;          // Example default
    // maxOutputTokens will be fetched dynamically
  }

  /**
   * Builds the Gemini generation configuration.
   * @returns {Promise<GeminiGenerationConfig>} The Gemini generation configuration object.
   */
  async build() {
    // Assuming getMaxOutputTokens is an async function that retrieves this value,
    // e.g., from storage or a settings module.
    // Ensure getMaxOutputTokens is defined or imported.
    if (typeof getMaxOutputTokens !== 'function') {
      console.error("getMaxOutputTokens function is not defined. Please ensure it's imported or defined.");
      // Fallback or throw error, depending on desired behavior
      throw new Error("Configuration for getMaxOutputTokens is missing.");
    }
    const maxOutputTokens = await getMaxOutputTokens();
    return new GeminiGenerationConfig(maxOutputTokens, this.temperature, this.topP, this.topK);
  }
}