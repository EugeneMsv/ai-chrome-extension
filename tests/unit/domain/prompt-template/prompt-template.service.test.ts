// Prompt Template Service Tests
// Following TDD approach: Write tests FIRST, then implement

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PromptTemplateService } from '@domain/prompt-template/prompt-template.service';
import { StorageService } from '@infrastructure/chrome-apis/storage.service';
import type { Domain } from '@types';
import { ValidationError } from '@types';

// Mock the storage service
vi.mock('@infrastructure/chrome-apis/storage.service');

describe('PromptTemplateService', () => {
  let promptTemplateService: PromptTemplateService;
  let mockStorageService: StorageService;

  // Test data
  const mockTemplate: Domain.PromptTemplate = {
    id: 'test-template-1',
    name: 'Test Summary Template',
    prompt: 'Please summarize the following text: {{selectedText}}',
    category: 'summarization',
    variables: ['selectedText'],
    metadata: {
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      version: 1,
      author: 'system',
      tags: ['summary', 'text'],
    },
  };

  beforeEach(() => {
    mockStorageService = new StorageService() as any;
    promptTemplateService = new PromptTemplateService(mockStorageService);
    vi.clearAllMocks();
  });

  describe('getTemplates', () => {
    it('should return all stored templates', async () => {
      // Arrange
      const storedTemplates = [mockTemplate];
      vi.mocked(mockStorageService.get).mockResolvedValue(storedTemplates);

      // Act
      const result = await promptTemplateService.getTemplates();

      // Assert
      expect(result).toEqual(storedTemplates);
      expect(mockStorageService.get).toHaveBeenCalledWith('promptTemplates');
    });

    it('should return default templates when no templates are stored', async () => {
      // Arrange
      vi.mocked(mockStorageService.get).mockResolvedValue(null);

      // Act
      const result = await promptTemplateService.getTemplates();

      // Assert
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('prompt');
    });

    it('should handle storage errors gracefully', async () => {
      // Arrange
      vi.mocked(mockStorageService.get).mockRejectedValue(new Error('Storage error'));

      // Act & Assert
      await expect(promptTemplateService.getTemplates()).rejects.toThrow(
        'Failed to retrieve prompt templates'
      );
    });
  });

  describe('getTemplate', () => {
    it('should return a specific template by id', async () => {
      // Arrange
      const storedTemplates = [mockTemplate];
      vi.mocked(mockStorageService.get).mockResolvedValue(storedTemplates);

      // Act
      const result = await promptTemplateService.getTemplate('test-template-1');

      // Assert
      expect(result).toEqual(mockTemplate);
    });

    it('should return null when template id is not found', async () => {
      // Arrange
      const storedTemplates = [mockTemplate];
      vi.mocked(mockStorageService.get).mockResolvedValue(storedTemplates);

      // Act
      const result = await promptTemplateService.getTemplate('non-existent-id');

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when no templates exist', async () => {
      // Arrange
      vi.mocked(mockStorageService.get).mockResolvedValue(null);

      // Act
      const result = await promptTemplateService.getTemplate('test-template-1');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('saveTemplate', () => {
    it('should save a new template', async () => {
      // Arrange
      const existingTemplates: Domain.PromptTemplate[] = [];
      vi.mocked(mockStorageService.get).mockResolvedValue(existingTemplates);
      vi.mocked(mockStorageService.set).mockResolvedValue(void 0);

      // Act
      await promptTemplateService.saveTemplate(mockTemplate);

      // Assert
      const savedTemplates = vi.mocked(mockStorageService.set).mock
        .calls[0][1] as Domain.PromptTemplate[];
      expect(mockStorageService.set).toHaveBeenCalledWith('promptTemplates', expect.any(Array));
      expect(savedTemplates).toHaveLength(1);
      expect(savedTemplates[0].id).toBe(mockTemplate.id);
      expect(savedTemplates[0].name).toBe(mockTemplate.name);
      expect(savedTemplates[0].metadata.updatedAt).toBeInstanceOf(Date);
    });

    it('should update an existing template', async () => {
      // Arrange
      const existingTemplates = [mockTemplate];
      const updatedTemplate = {
        ...mockTemplate,
        name: 'Updated Template',
        metadata: { ...mockTemplate.metadata, updatedAt: new Date() },
      };
      vi.mocked(mockStorageService.get).mockResolvedValue(existingTemplates);
      vi.mocked(mockStorageService.set).mockResolvedValue(void 0);

      // Act
      await promptTemplateService.saveTemplate(updatedTemplate);

      // Assert
      const setCall = vi.mocked(mockStorageService.set).mock.calls[0];
      const savedTemplate = setCall[1][0];

      expect(mockStorageService.set).toHaveBeenCalledTimes(1);
      expect(setCall[0]).toBe('promptTemplates');
      expect(savedTemplate.name).toBe('Updated Template');
      expect(savedTemplate.metadata.version).toBe(2); // Version should increment
      expect(savedTemplate.metadata.createdAt).toEqual(mockTemplate.metadata.createdAt); // Should preserve creation date
      expect(savedTemplate.metadata.updatedAt).toBeInstanceOf(Date); // Should update timestamp
    });

    it('should validate template before saving', async () => {
      // Arrange
      const invalidTemplate = { ...mockTemplate, name: '' }; // Invalid: empty name

      // Act & Assert
      await expect(promptTemplateService.saveTemplate(invalidTemplate)).rejects.toThrow(
        ValidationError
      );
      expect(mockStorageService.set).not.toHaveBeenCalled();
    });

    it('should generate timestamps for new templates', async () => {
      // Arrange
      const templateWithoutTimestamps = { ...mockTemplate };
      delete templateWithoutTimestamps.metadata.createdAt;
      delete templateWithoutTimestamps.metadata.updatedAt;

      vi.mocked(mockStorageService.get).mockResolvedValue([]);
      vi.mocked(mockStorageService.set).mockResolvedValue(void 0);

      // Act
      await promptTemplateService.saveTemplate(templateWithoutTimestamps);

      // Assert
      const savedTemplate = vi.mocked(mockStorageService.set).mock
        .calls[0][1] as Domain.PromptTemplate[];
      expect(savedTemplate[0].metadata.createdAt).toBeInstanceOf(Date);
      expect(savedTemplate[0].metadata.updatedAt).toBeInstanceOf(Date);
    });

    it('should handle storage errors during save', async () => {
      // Arrange
      vi.mocked(mockStorageService.get).mockResolvedValue([]);
      vi.mocked(mockStorageService.set).mockRejectedValue(new Error('Storage quota exceeded'));

      // Act & Assert
      await expect(promptTemplateService.saveTemplate(mockTemplate)).rejects.toThrow(
        'Failed to save template'
      );
    });
  });

  describe('deleteTemplate', () => {
    it('should delete an existing template', async () => {
      // Arrange
      const existingTemplates = [mockTemplate];
      vi.mocked(mockStorageService.get).mockResolvedValue(existingTemplates);
      vi.mocked(mockStorageService.set).mockResolvedValue(void 0);

      // Act
      await promptTemplateService.deleteTemplate('test-template-1');

      // Assert
      expect(mockStorageService.set).toHaveBeenCalledWith('promptTemplates', []);
    });

    it('should handle deletion of non-existent template', async () => {
      // Arrange
      const existingTemplates = [mockTemplate];
      vi.mocked(mockStorageService.get).mockResolvedValue(existingTemplates);
      vi.mocked(mockStorageService.set).mockResolvedValue(void 0);

      // Act
      await promptTemplateService.deleteTemplate('non-existent-id');

      // Assert
      expect(mockStorageService.set).toHaveBeenCalledWith('promptTemplates', existingTemplates);
    });

    it('should handle storage errors during delete', async () => {
      // Arrange
      vi.mocked(mockStorageService.get).mockRejectedValue(new Error('Storage error'));

      // Act & Assert
      await expect(promptTemplateService.deleteTemplate('test-template-1')).rejects.toThrow(
        'Failed to delete template'
      );
    });
  });

  describe('getDefaultTemplates', () => {
    it('should return an array of default templates', () => {
      // Act
      const defaultTemplates = promptTemplateService.getDefaultTemplates();

      // Assert
      expect(defaultTemplates).toBeInstanceOf(Array);
      expect(defaultTemplates.length).toBeGreaterThan(0);

      // Validate first template structure
      const firstTemplate = defaultTemplates[0];
      expect(firstTemplate).toHaveProperty('id');
      expect(firstTemplate).toHaveProperty('name');
      expect(firstTemplate).toHaveProperty('prompt');
      expect(firstTemplate).toHaveProperty('category');
      expect(firstTemplate).toHaveProperty('variables');
      expect(firstTemplate).toHaveProperty('metadata');
    });

    it('should return templates with valid structure', () => {
      // Act
      const defaultTemplates = promptTemplateService.getDefaultTemplates();

      // Assert
      defaultTemplates.forEach(template => {
        expect(typeof template.id).toBe('string');
        expect(typeof template.name).toBe('string');
        expect(typeof template.prompt).toBe('string');
        expect(typeof template.category).toBe('string');
        expect(Array.isArray(template.variables)).toBe(true);
        expect(typeof template.metadata).toBe('object');
        expect(template.metadata.createdAt).toBeInstanceOf(Date);
        expect(template.metadata.updatedAt).toBeInstanceOf(Date);
        expect(typeof template.metadata.version).toBe('number');
        expect(typeof template.metadata.author).toBe('string');
        expect(Array.isArray(template.metadata.tags)).toBe(true);
      });
    });
  });

  describe('template validation', () => {
    it('should validate required fields', async () => {
      // Arrange
      const invalidTemplate = { ...mockTemplate, id: '' };

      // Act & Assert
      await expect(promptTemplateService.saveTemplate(invalidTemplate)).rejects.toThrow(
        ValidationError
      );
    });

    it('should validate prompt variables are valid', async () => {
      // Arrange
      const invalidTemplate = {
        ...mockTemplate,
        prompt: 'Test {{invalidVar}}',
        variables: ['validVar'], // Mismatch with prompt
      };

      // Act & Assert
      await expect(promptTemplateService.saveTemplate(invalidTemplate)).rejects.toThrow(
        ValidationError
      );
    });
  });
});
