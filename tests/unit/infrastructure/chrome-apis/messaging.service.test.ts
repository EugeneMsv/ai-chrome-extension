// Messaging Service Tests
// Following TDD approach: Write tests FIRST, then implement

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MessagingService } from '@infrastructure/chrome-apis/messaging.service';
import { ChromeApiExtensionError } from '@types';
import type { GetApiKeyRequest, GetApiKeyResponse } from '@types';

describe('MessagingService', () => {
  let messagingService: MessagingService;

  beforeEach(() => {
    messagingService = new MessagingService();
  });

  describe('sendMessage', () => {
    it('should send a message and receive response', async () => {
      // Arrange
      const testMessage: GetApiKeyRequest = {
        action: 'GET_API_KEY',
        requestId: 'test-123',
        timestamp: Date.now(),
      };
      const expectedResponse: GetApiKeyResponse = {
        success: true,
        apiKey: 'test-api-key',
      };

      vi.mocked(chrome.runtime.sendMessage).mockImplementation((message, callback) => {
        if (callback) callback(expectedResponse);
      });

      // Act
      const response = await messagingService.sendMessage<GetApiKeyRequest, GetApiKeyResponse>(
        testMessage
      );

      // Assert
      expect(response).toEqual(expectedResponse);
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(testMessage, expect.any(Function));
    });

    it('should handle Chrome runtime errors during sendMessage', async () => {
      // Arrange
      const testMessage: GetApiKeyRequest = {
        action: 'GET_API_KEY',
        requestId: 'test-123',
        timestamp: Date.now(),
      };

      vi.mocked(chrome.runtime.sendMessage).mockImplementation((message, callback) => {
        chrome.runtime.lastError = { message: 'Extension context invalidated' };
        if (callback) callback(undefined);
      });

      // Act & Assert
      await expect(messagingService.sendMessage(testMessage)).rejects.toThrow(
        ChromeApiExtensionError
      );

      // Reset the error
      chrome.runtime.lastError = null;
    });

    it('should timeout if no response received', async () => {
      // Arrange
      const testMessage: GetApiKeyRequest = {
        action: 'GET_API_KEY',
        requestId: 'test-123',
        timestamp: Date.now(),
      };

      vi.mocked(chrome.runtime.sendMessage).mockImplementation(() => {
        // Don't call callback to simulate timeout
      });

      // Act & Assert
      await expect(messagingService.sendMessage(testMessage, { timeout: 100 })).rejects.toThrow(
        'Message timeout'
      );
    }, 1000); // Test timeout
  });

  describe('onMessage', () => {
    it('should register message listener', () => {
      // Arrange
      const handler = vi.fn();

      // Act
      messagingService.onMessage(handler);

      // Assert
      expect(chrome.runtime.onMessage.addListener).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should handle incoming messages correctly', async () => {
      // Arrange
      const testMessage: GetApiKeyRequest = {
        action: 'GET_API_KEY',
        requestId: 'test-123',
        timestamp: Date.now(),
      };
      const expectedResponse: GetApiKeyResponse = {
        success: true,
        apiKey: 'test-api-key',
      };

      const handler = vi.fn().mockResolvedValue(expectedResponse);
      let registeredListener: any;

      vi.mocked(chrome.runtime.onMessage.addListener).mockImplementation(listener => {
        registeredListener = listener;
      });

      messagingService.onMessage(handler);

      // Act - Simulate Chrome calling the listener
      const mockSendResponse = vi.fn();
      const sender = { id: 'test-extension' };
      const result = registeredListener(testMessage, sender, mockSendResponse);

      // Wait for async handler
      await new Promise(resolve => setTimeout(resolve, 10));

      // Assert
      expect(result).toBe(true); // Should return true for async handler
      expect(handler).toHaveBeenCalledWith(testMessage);
      expect(mockSendResponse).toHaveBeenCalledWith(expectedResponse);
    });
  });

  describe('removeMessageListener', () => {
    it('should remove message listener', () => {
      // Arrange
      const handler = vi.fn();
      let registeredListener: any;

      vi.mocked(chrome.runtime.onMessage.addListener).mockImplementation(listener => {
        registeredListener = listener;
      });

      messagingService.onMessage(handler);

      // Act
      messagingService.removeMessageListener();

      // Assert
      expect(chrome.runtime.onMessage.removeListener).toHaveBeenCalledWith(registeredListener);
    });

    it('should handle remove when no listener registered', () => {
      // Act
      messagingService.removeMessageListener();

      // Assert - Should not throw error
      expect(chrome.runtime.onMessage.removeListener).not.toHaveBeenCalled();
    });
  });

  describe('sendMessageToTab', () => {
    it('should send message to specific tab', async () => {
      // Arrange
      const tabId = 123;
      const testMessage = { type: 'TEST_MESSAGE', data: 'test' };
      const expectedResponse = { success: true };

      vi.mocked(chrome.tabs.sendMessage).mockImplementation((tabId, message, callback) => {
        if (callback) callback(expectedResponse);
      });

      // Act
      const response = await messagingService.sendMessageToTab(tabId, testMessage);

      // Assert
      expect(response).toEqual(expectedResponse);
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
        tabId,
        testMessage,
        expect.any(Function)
      );
    });

    it('should handle tab messaging errors', async () => {
      // Arrange
      const tabId = 123;
      const testMessage = { type: 'TEST_MESSAGE', data: 'test' };

      vi.mocked(chrome.tabs.sendMessage).mockImplementation((tabId, message, callback) => {
        chrome.runtime.lastError = { message: 'Tab not found' };
        if (callback) callback(undefined);
      });

      // Act & Assert
      await expect(messagingService.sendMessageToTab(tabId, testMessage)).rejects.toThrow(
        ChromeApiExtensionError
      );

      // Reset the error
      chrome.runtime.lastError = null;
    });
  });
});
