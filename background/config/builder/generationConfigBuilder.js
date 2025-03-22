// background/generationConfigBuilder.js

/**
 * Abstract class for building generation configurations.
 */
export class GenerationConfigBuilder {
  constructor() {
    if (this.constructor === GenerationConfigBuilder) {
      throw new Error("Cannot instantiate abstract class GenerationConfigBuilder");
    }
  }

  /**
   * Abstract method to build the generation configuration.
   * @returns {Promise<object>} The generation configuration object.
   */
  async build() {
    throw new Error("Method 'build()' must be implemented.");
  }
}