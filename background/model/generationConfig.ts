export interface GenerationConfig {
  maxOutputTokens?: number;
  temperature?: number;
}

/**
 * Abstract class for building generation configurations.
 */
export class GenerationConfigBuilder {
  constructor() {}

  /**
   * Abstract method to build the generation configuration.
   * @returns {Promise<GenerationConfig>} The generation configuration object.
   */
  async build(): Promise<GenerationConfig> {
    throw new Error("Method 'build()' must be implemented.");
  }
}