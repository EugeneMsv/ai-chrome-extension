// PromptExecutor Service - Application Layer
// Handles AI prompt execution using Gemini API

import { ApiKeyService } from '@domain/api-key/api-key.service';
import { PromptTemplateService } from '@domain/prompt-template/prompt-template.service';
import { StorageService } from '@infrastructure/chrome-apis/storage.service';

export const API_BASE_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=';

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message: string;
  };
}

interface PromptExecutorResponse {
  responseText?: string;
  error?: string;
}

/**
 * Abstract class for building generation configurations.
 */
abstract class GenerationConfigBuilder {
  constructor() {
    if (this.constructor === GenerationConfigBuilder) {
      throw new Error('Cannot instantiate abstract class GenerationConfigBuilder');
    }
  }

  /**
   * Abstract method to build the generation configuration.
   * @returns {Promise<object>} The generation configuration object.
   */
  abstract build(): Promise<Record<string, unknown>>;
}

/**
 * Concrete builder for Gemini API generation configurations.
 */
class GeminiGenerationConfigBuilder extends GenerationConfigBuilder {
  private temperature: number = 0.9;
  private topP: number = 1;
  private topK: number = 1;

  constructor(private storageService: StorageService) {
    super();
  }

  /**
   * Gets max output tokens from storage
   */
  private async getMaxOutputTokens(): Promise<number> {
    try {
      const maxTokens = await this.storageService.get<number>('maxOutputTokens');
      return maxTokens || 1000;
    } catch (error) {
      console.error('PromptExecutor: Error getting max output tokens:', error);
      return 1000;
    }
  }

  /**
   * Builds the Gemini generation configuration.
   * @returns {Promise<object>} The Gemini generation configuration object.
   */
  async build(): Promise<Record<string, unknown>> {
    const maxOutputTokens = await this.getMaxOutputTokens();
    return {
      maxOutputTokens,
      temperature: this.temperature,
      topP: this.topP,
      topK: this.topK,
    };
  }
}

/**
 * PromptExecutor Service - Handles AI prompt execution
 */
export class PromptExecutorService {
  private readonly apiKeyService: ApiKeyService;
  private readonly promptTemplateService: PromptTemplateService;
  private readonly geminiConfigBuilder: GeminiGenerationConfigBuilder;

  // Cache for storing responses
  private readonly responseCache = new Map<string, PromptExecutorResponse>();

  constructor(
    storageService: StorageService,
    apiKeyService: ApiKeyService,
    promptTemplateService: PromptTemplateService
  ) {
    this.apiKeyService = apiKeyService;
    this.promptTemplateService = promptTemplateService;
    this.geminiConfigBuilder = new GeminiGenerationConfigBuilder(storageService);
  }

  /**
   * Generate cache key using djb2 hash algorithm
   */
  private getCacheKey(str: string): string {
    // djb2 hash algorithm
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) + hash + str.charCodeAt(i); /* hash * 33 + c */
    }
    // Convert to a positive 32-bit integer
    hash = hash >>> 0;
    return hash.toString(16); // Convert to hexadecimal string
  }

  /**
   * Add response to cache
   */
  private addToCache(key: string, response: PromptExecutorResponse): void {
    this.responseCache.set(key, response);
  }

  /**
   * Send request to Gemini API
   */
  private async sendToGeminiApi(
    apiKey: string,
    prompt: string,
    generationConfig: Record<string, unknown>
  ): Promise<GeminiResponse> {
    const response = await fetch(API_BASE_URL + apiKey, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig,
      }),
    });
    return await response.json();
  }

  /**
   * Extract summary from Gemini response
   */
  private extractSummaryFromResponse(data: GeminiResponse): PromptExecutorResponse {
    if (data.error) {
      console.error('Error with Gemini API', data.error);
      return { error: data.error.message };
    }
    // Check if the structure is correct and extract the text
    if (
      data.candidates &&
      data.candidates[0] &&
      data.candidates[0].content &&
      data.candidates[0].content.parts &&
      data.candidates[0].content.parts[0] &&
      data.candidates[0].content.parts[0].text
    ) {
      return { responseText: data.candidates[0].content.parts[0].text };
    } else {
      console.error('Unexpected response structure from Gemini API', data);
      return { error: 'Unexpected response structure from Gemini API' };
    }
  }

  /**
   * Execute a prompt
   */
  private async executePrompt(prompt: string): Promise<PromptExecutorResponse> {
    const cacheKey = this.getCacheKey(prompt);
    if (this.responseCache.has(cacheKey)) {
      // Cache hit for prompt
      const cachedResult = this.responseCache.get(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }
    }

    try {
      const apiKeyObj = await this.apiKeyService.getApiKey();
      if (!apiKeyObj?.value) {
        throw new Error('API key not found');
      }

      const generationConfig = await this.geminiConfigBuilder.build();
      const response = await this.sendToGeminiApi(apiKeyObj.value, prompt, generationConfig);
      const result = this.extractSummaryFromResponse(response);

      if (this.responseCache.size >= 100) {
        const firstKey = this.responseCache.keys().next().value;
        if (firstKey) {
          this.responseCache.delete(firstKey);
        }
      }
      this.addToCache(cacheKey, result);
      return result;
    } catch (error: unknown) {
      console.error('Error in executePrompt:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

  /**
   * Execute summarize prompt
   */
  public async executeSummaryPrompt(text: string): Promise<PromptExecutorResponse> {
    try {
      const templates = await this.promptTemplateService.getTemplates();
      const summarizeTemplate = templates.find(t => t.id === 'summarize');
      if (!summarizeTemplate) {
        throw new Error('Summarize template not found');
      }
      const prompt = summarizeTemplate.prompt.replace('{{text}}', text);
      return await this.executePrompt(prompt);
    } catch (error: unknown) {
      return { error: error instanceof Error ? error.message : 'Failed to execute summary prompt' };
    }
  }

  /**
   * Execute meaning prompt
   */
  public async executeMeaningPrompt(text: string): Promise<PromptExecutorResponse> {
    try {
      const templates = await this.promptTemplateService.getTemplates();
      const meaningTemplate = templates.find(t => t.id === 'meaning');
      if (!meaningTemplate) {
        throw new Error('Meaning template not found');
      }
      const prompt = meaningTemplate.prompt.replace('{{text}}', text);
      return await this.executePrompt(prompt);
    } catch (error: unknown) {
      return { error: error instanceof Error ? error.message : 'Failed to execute meaning prompt' };
    }
  }

  /**
   * Execute rephrase prompt
   */
  public async executeRephrasePrompt(text: string): Promise<PromptExecutorResponse> {
    try {
      const templates = await this.promptTemplateService.getTemplates();
      const rephraseTemplate = templates.find(t => t.id === 'rephrase');
      if (!rephraseTemplate) {
        throw new Error('Rephrase template not found');
      }
      const prompt = rephraseTemplate.prompt.replace('{{text}}', text);
      return await this.executePrompt(prompt);
    } catch (error: unknown) {
      return {
        error: error instanceof Error ? error.message : 'Failed to execute rephrase prompt',
      };
    }
  }

  /**
   * Execute translate prompt
   */
  public async executeTranslatePrompt(
    text: string,
    targetLanguage: string
  ): Promise<PromptExecutorResponse> {
    try {
      const templates = await this.promptTemplateService.getTemplates();
      const translateTemplate = templates.find(t => t.id === 'translate');
      if (!translateTemplate) {
        throw new Error('Translate template not found');
      }
      const prompt = translateTemplate.prompt
        .replace('{{text}}', text)
        .replace('{{targetLanguage}}', targetLanguage);
      return await this.executePrompt(prompt);
    } catch (error: unknown) {
      return {
        error: error instanceof Error ? error.message : 'Failed to execute translate prompt',
      };
    }
  }
}
