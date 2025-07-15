// background/promptExecutionContext.js

/**
 * Enum for different types of prompts.
 * @readonly
 * @enum {string}
 */
export const PromptType = Object.freeze({
  SUMMARIZE: 'summarize',
  MEANING: 'meaning',
  REPHRASE: 'rephrase',
  TRANSLATE: 'translate'
});

/**
 * Represents the context for a prompt execution.
 */
export class PromptExecutionContext {
  /**
   * @param {string} text - The primary text input for the prompt, or the full prompt for CUSTOM type.
   * @param {PromptType} promptType - The type of prompt to execute.
   * @param {Object} [additionalArgs={}] - Additional arguments, e.g., { targetLanguage: 'es' }.
   */
  constructor(text, promptType, additionalArgs = {}) {
    if (typeof text !== 'string') {
      throw new Error('PromptExecutionContext: text must be a string.');
    }
    if (!Object.values(PromptType).includes(promptType)) {
      throw new Error(`PromptExecutionContext: Invalid promptType "${promptType}".`);
    }

    this.text = text;
    this.promptType = promptType;
    this.additionalArgs = additionalArgs;
  }
}