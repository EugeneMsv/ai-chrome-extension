// background/geminiGenerationConfigBuilder.js

import { GenerationConfigBuilder } from '../generationConfigBuilder.js';
import { getMaxOutputTokens } from './maxOutputTokensManager.js';

/**
 * Concrete builder for Gemini API generation configurations.
 */
export class GeminiGenerationConfigBuilder extends GenerationConfigBuilder {
  constructor() {
    super();
    this.temperature = 0.9;
    this.topP = 1;
    this.topK = 1;
  }

  /**
   * Builds the Gemini generation configuration.
   * @returns {Promise<object>} The Gemini generation configuration object.
   */
  async build() {
    const maxOutputTokens = await getMaxOutputTokens();
    return {
      maxOutputTokens: maxOutputTokens,
      temperature: this.temperature,
      topP: this.topP,
      topK: this.topK,
    };
  }
}