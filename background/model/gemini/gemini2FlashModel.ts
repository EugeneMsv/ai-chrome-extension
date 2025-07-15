// background/model/gemini/gemini2FlashModel.ts

import { AIModel } from '../aiModel.ts';
import { GeminiApiKeyManager } from '../auth/geminiApiKeyManager.ts';
import { GeminiGenerationConfigBuilder } from './geminiGenerationConfig.ts';

// Gemini-specific constants
const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=';
const MODEL_NAME = 'gemini-2.0-flash';

export class Gemini2FlashModel extends AIModel {
  apiKey: GeminiApiKeyManager;
  generationConfigBuilder: GeminiGenerationConfigBuilder;

  constructor(geminiApiKeyManager: GeminiApiKeyManager, geminiGenerationConfigBuilder: GeminiGenerationConfigBuilder) {
    super();
    this.apiKey = geminiApiKeyManager;
    this.generationConfigBuilder = geminiGenerationConfigBuilder;
  }

  getModelName() {
    return MODEL_NAME;
  }

  private async _ensureApiKey(): Promise<string> {
    const apiKey = await this.apiKey.getApiKey();
    if (!apiKey) {
      throw new Error(`Gemini API key is not configured for ${MODEL_NAME}.`);
    }

    // Assuming the API key is a string. Adjust if it's a different type.
    return apiKey;
  }

  private async _sendRequest(apiKey: string, prompt: string, generationConfig: any): Promise<any> {
    const fullUrl = `${GEMINI_API_BASE_URL}${apiKey}`;
    const payload = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: generationConfig
    };

    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();
    if (!response.ok) {
      console.error(`Gemini API request failed for ${MODEL_NAME}:`, response.status, responseData);
      const errorMessage = responseData.error?.message || `Gemini API Error (${MODEL_NAME}): ${response.status}`;
      throw new Error(errorMessage);
    }
    return responseData;
  }

  private _parseResponse(data: any): { responseText?: string; error?: string } {
    const candidate = data?.candidates?.[0];

    if (candidate?.content?.parts?.[0]?.text) {
      return { responseText: candidate.content.parts[0].text };
    }

    if (candidate?.finishReason) {
      let errorMessage = `Content generation issue for ${MODEL_NAME}: ${candidate.finishReason}.`;
      const blockedCategories = candidate.safetyRatings?.filter(r => r.blocked).map(r => r.category).join(', ');
      if (blockedCategories) {
        errorMessage += ` Blocked categories: ${blockedCategories}.`;
      }
      console.warn(`Gemini API response indicates content issue for ${MODEL_NAME}:`, errorMessage, candidate);
      return { error: errorMessage };
    }

    console.error(`Unexpected response structure from Gemini API for ${MODEL_NAME}`, data);
    return { error: `Unexpected response structure from Gemini API for ${MODEL_NAME}` };
  }

  async generate(prompt: string): Promise<{ responseText?: string; error?: string }> {
    try {
      const apiKey = await this._ensureApiKey();
      const generationConfig = await this.generationConfigBuilder.build(); // Assuming build() can be async or sync
      const responseData = await this._sendRequest(apiKey, prompt, generationConfig);
      return this._parseResponse(responseData);
    } catch (error) {
      console.error(`Error in ${this.constructor.name} (model: ${MODEL_NAME}).generate:`, error);
      return { error: error.message || `An unknown error occurred in the ${MODEL_NAME} model.` };
    }
  }
}