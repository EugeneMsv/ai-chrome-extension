// background/model/storage/modelStorage.ts

/**
 * Service for managing the user's chosen AI model preference.
 * Interacts with chrome.storage.
 */
export class ModelStorage {
  static CHOSEN_MODEL_NAME_KEY = 'chosenModelName';

  constructor() {
    // Default model if nothing is set. Ensure this key exists in your supportedModels.
    this.defaultModelName = 'gemini-2.0-flash';
  }

  /**
   * Retrieves the user's chosen AI model name from storage.
   * @returns {Promise<string>} The name of the chosen AI model.
   *                            Returns a default model name if none is found or an error occurs.
   */
  async getChosenModelName(): Promise<string> {
    try {
      const data = await chrome.storage.local.get(ModelStorage.CHOSEN_MODEL_NAME_KEY);
      if (data && data[ModelStorage.CHOSEN_MODEL_NAME_KEY]) {
        console.log(`ModelStorage: Retrieved chosen model: ${data[ModelStorage.CHOSEN_MODEL_NAME_KEY]}`);
        return data[ModelStorage.CHOSEN_MODEL_NAME_KEY];
      }
      console.log(`ModelStorage: No chosen model found in storage, returning default: ${this.defaultModelName}`);
      return this.defaultModelName;
    } catch (error) {
      console.error('ModelStorage: Error retrieving chosen model name:', error);
      // Fallback to default if storage access fails
      return this.defaultModelName;
    }
  }

  /**
   * Stores the user's chosen AI model name.
   * @param {string} modelName - The name of the AI model to store.
   * @returns {Promise<void>}
   */
  async setChosenModelName(modelName: string): Promise<void> {
    try {
      await chrome.storage.local.set({ [ModelStorage.CHOSEN_MODEL_NAME_KEY]: modelName });
      console.log(`ModelStorage: Set chosen model to: ${modelName}`);
    } catch (error) {
      console.error('ModelStorage: Error setting chosen model name:', error);
      // Handle or throw the error as appropriate for your application
    }
  }
}