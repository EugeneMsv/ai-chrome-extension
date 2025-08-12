// Prompt Template Service - Domain Layer Implementation
// Following Clean Architecture patterns and TDD approach

import type { IPromptTemplateService, IStorageService } from '@/types/services';
import type { Domain } from '@/types/domain';
import { ValidationError } from '@/types/validation';

/**
 * Prompt Template Service - Manages prompt templates storage and lifecycle
 *
 * This service handles:
 * - CRUD operations for prompt templates
 * - Default template management
 * - Template validation and variable extraction
 * - Category-based organization
 */
export class PromptTemplateService implements IPromptTemplateService {
  private static readonly TEMPLATES_STORAGE_KEY = 'promptTemplates';

  constructor(private readonly storageService: IStorageService) {}

  /**
   * Retrieves all stored prompt templates
   *
   * @returns Promise resolving to array of prompt templates
   */
  public async getTemplates(): Promise<Domain.PromptTemplate[]> {
    try {
      const storedTemplates = await this.storageService.get<Domain.PromptTemplate[]>(
        PromptTemplateService.TEMPLATES_STORAGE_KEY
      );

      // Return stored templates or default templates if none exist
      return storedTemplates || this.getDefaultTemplates();
    } catch (error) {
      throw new Error(
        `Failed to retrieve prompt templates: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Retrieves a specific template by ID
   *
   * @param id - Template ID to retrieve
   * @returns Promise resolving to template or null if not found
   */
  public async getTemplate(id: string): Promise<Domain.PromptTemplate | null> {
    try {
      const templates = await this.getTemplates();
      return templates.find(template => template.id === id) || null;
    } catch (error) {
      throw new Error(
        `Failed to retrieve template: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Saves a prompt template (create or update)
   *
   * @param template - Template to save
   * @throws ValidationError if template is invalid
   */
  public async saveTemplate(template: Domain.PromptTemplate): Promise<void> {
    // Validate template before saving
    this.validateTemplate(template);

    try {
      const existingTemplates =
        (await this.storageService.get<Domain.PromptTemplate[]>(
          PromptTemplateService.TEMPLATES_STORAGE_KEY
        )) || [];

      // Prepare template with timestamps
      const templateToSave = this.prepareTemplateForSaving(template, existingTemplates);

      // Update or add template
      const existingIndex = existingTemplates.findIndex(t => t.id === template.id);

      if (existingIndex >= 0) {
        // Update existing template
        existingTemplates[existingIndex] = templateToSave;
      } else {
        // Add new template
        existingTemplates.push(templateToSave);
      }

      await this.storageService.set(PromptTemplateService.TEMPLATES_STORAGE_KEY, existingTemplates);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new Error(
        `Failed to save template: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Deletes a prompt template by ID
   *
   * @param id - Template ID to delete
   */
  public async deleteTemplate(id: string): Promise<void> {
    try {
      const existingTemplates =
        (await this.storageService.get<Domain.PromptTemplate[]>(
          PromptTemplateService.TEMPLATES_STORAGE_KEY
        )) || [];

      const filteredTemplates = existingTemplates.filter(template => template.id !== id);

      await this.storageService.set(PromptTemplateService.TEMPLATES_STORAGE_KEY, filteredTemplates);
    } catch (error) {
      throw new Error(
        `Failed to delete template: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Gets default prompt templates
   *
   * @returns Array of default templates
   */
  public getDefaultTemplates(): Domain.PromptTemplate[] {
    const now = new Date();

    return [
      {
        id: 'summarize-text',
        name: 'Summarize Text',
        prompt:
          'Please provide a concise summary of the following text:\n\n{{selectedText}}\n\nSummary:',
        category: 'summarization',
        variables: ['selectedText'],
        metadata: {
          createdAt: now,
          updatedAt: now,
          version: 1,
          author: 'system',
          tags: ['summary', 'text', 'content'],
        },
      },
      {
        id: 'explain-concept',
        name: 'Explain Concept',
        prompt:
          'Please explain the following concept in simple terms:\n\n{{selectedText}}\n\nExplanation:',
        category: 'explanation',
        variables: ['selectedText'],
        metadata: {
          createdAt: now,
          updatedAt: now,
          version: 1,
          author: 'system',
          tags: ['explain', 'concept', 'education'],
        },
      },
      {
        id: 'translate-text',
        name: 'Translate Text',
        prompt:
          'Please translate the following text to {{targetLanguage}}:\n\n{{selectedText}}\n\nTranslation:',
        category: 'translation',
        variables: ['selectedText', 'targetLanguage'],
        metadata: {
          createdAt: now,
          updatedAt: now,
          version: 1,
          author: 'system',
          tags: ['translate', 'language', 'text'],
        },
      },
      {
        id: 'improve-writing',
        name: 'Improve Writing',
        prompt:
          'Please improve the grammar and style of the following text while maintaining its original meaning:\n\n{{selectedText}}\n\nImproved version:',
        category: 'writing',
        variables: ['selectedText'],
        metadata: {
          createdAt: now,
          updatedAt: now,
          version: 1,
          author: 'system',
          tags: ['writing', 'grammar', 'style'],
        },
      },
      {
        id: 'extract-key-points',
        name: 'Extract Key Points',
        prompt:
          'Please extract the key points from the following text in bullet format:\n\n{{selectedText}}\n\nKey Points:',
        category: 'analysis',
        variables: ['selectedText'],
        metadata: {
          createdAt: now,
          updatedAt: now,
          version: 1,
          author: 'system',
          tags: ['analysis', 'key-points', 'structure'],
        },
      },
      {
        id: 'answer-question',
        name: 'Answer Question',
        prompt:
          'Based on the following context, please answer the question:\n\nContext: {{context}}\n\nQuestion: {{question}}\n\nAnswer:',
        category: 'qa',
        variables: ['context', 'question'],
        metadata: {
          createdAt: now,
          updatedAt: now,
          version: 1,
          author: 'system',
          tags: ['qa', 'question', 'answer'],
        },
      },
    ];
  }

  /**
   * Validates a prompt template
   *
   * @param template - Template to validate
   * @throws ValidationError if template is invalid
   */
  private validateTemplate(template: Domain.PromptTemplate): void {
    // Validate required fields
    if (!template.id || typeof template.id !== 'string' || template.id.trim().length === 0) {
      throw new ValidationError(
        'id',
        'Template ID is required and must be a non-empty string',
        'INVALID_ID'
      );
    }

    if (!template.name || typeof template.name !== 'string' || template.name.trim().length === 0) {
      throw new ValidationError(
        'name',
        'Template name is required and must be a non-empty string',
        'INVALID_NAME'
      );
    }

    if (
      !template.prompt ||
      typeof template.prompt !== 'string' ||
      template.prompt.trim().length === 0
    ) {
      throw new ValidationError(
        'prompt',
        'Template prompt is required and must be a non-empty string',
        'INVALID_PROMPT'
      );
    }

    if (
      !template.category ||
      typeof template.category !== 'string' ||
      template.category.trim().length === 0
    ) {
      throw new ValidationError(
        'category',
        'Template category is required and must be a non-empty string',
        'INVALID_CATEGORY'
      );
    }

    if (!Array.isArray(template.variables)) {
      throw new ValidationError(
        'variables',
        'Template variables must be an array',
        'INVALID_VARIABLES'
      );
    }

    // Validate prompt variables match declared variables
    const promptVariables = this.extractVariablesFromPrompt(template.prompt);
    const declaredVariables = new Set(template.variables);

    for (const variable of promptVariables) {
      if (!declaredVariables.has(variable)) {
        throw new ValidationError(
          'variables',
          `Prompt contains undeclared variable: ${variable}`,
          'UNDECLARED_VARIABLE'
        );
      }
    }
  }

  /**
   * Prepares template for saving with proper timestamps
   *
   * @param template - Template to prepare
   * @param existingTemplates - Existing templates for update detection
   * @returns Prepared template with timestamps
   */
  private prepareTemplateForSaving(
    template: Domain.PromptTemplate,
    existingTemplates: Domain.PromptTemplate[]
  ): Domain.PromptTemplate {
    const existingTemplate = existingTemplates.find(t => t.id === template.id);
    const now = new Date();

    return {
      ...template,
      metadata: {
        ...template.metadata,
        createdAt: existingTemplate?.metadata.createdAt || template.metadata.createdAt || now,
        updatedAt: now,
        version: existingTemplate
          ? existingTemplate.metadata.version + 1
          : template.metadata.version || 1,
      },
    };
  }

  /**
   * Extracts variable names from prompt template
   *
   * @param prompt - Prompt template string
   * @returns Array of variable names
   */
  private extractVariablesFromPrompt(prompt: string): string[] {
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const variables: string[] = [];
    let match;

    while ((match = variableRegex.exec(prompt)) !== null) {
      const variableName = match[1]?.trim();
      if (variableName && !variables.includes(variableName)) {
        variables.push(variableName);
      }
    }

    return variables;
  }
}

/**
 * Factory function to create Prompt Template Service with default storage
 */
export const createPromptTemplateService = (
  storageService: IStorageService
): PromptTemplateService => {
  return new PromptTemplateService(storageService);
};
