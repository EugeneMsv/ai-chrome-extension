// Chrome Messaging Service Implementation
// Following Clean Architecture patterns and TDD approach

import type { IMessagingService } from '@/types/services';
import type { ChromeMessage, ChromeMessageResponse } from '@/types/chrome-messages';
import { ChromeApiExtensionError } from '@/types';

/**
 * Chrome Messaging Service - Provides type-safe message passing between extension components
 *
 * This service abstracts Chrome's messaging APIs with:
 * - Promise-based interface instead of callbacks
 * - Type-safe message handling
 * - Comprehensive error handling and timeouts
 * - Support for both runtime and tab messaging
 */
export class MessagingService implements IMessagingService {
  private currentListener:
    | ((
        message: any,
        sender: chrome.runtime.MessageSender,
        sendResponse: (response: any) => void
      ) => boolean | void)
    | null = null;

  /**
   * Sends a message using Chrome runtime messaging
   *
   * @param message - The message to send
   * @param options - Optional configuration for timeout
   * @returns Promise resolving to the response
   * @throws ChromeApiExtensionError if the operation fails
   */
  public async sendMessage<TRequest = ChromeMessage, TResponse = ChromeMessageResponse>(
    message: TRequest,
    options: MessageOptions = {}
  ): Promise<TResponse> {
    const timeout = options.timeout ?? 5000;

    return new Promise<TResponse>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(
          new ChromeApiExtensionError(
            'Message timeout - no response received within timeout period',
            'MESSAGING_SERVICE',
            { code: 'MESSAGE_TIMEOUT', message, timeout }
          )
        );
      }, timeout);

      try {
        chrome.runtime.sendMessage(message, (response: TResponse) => {
          clearTimeout(timeoutId);

          if (chrome.runtime.lastError) {
            reject(
              new ChromeApiExtensionError(
                `Failed to send message: ${chrome.runtime.lastError.message}`,
                'MESSAGING_SERVICE',
                { code: 'MESSAGE_SEND_FAILED', message, error: chrome.runtime.lastError }
              )
            );
            return;
          }

          if (response === undefined) {
            reject(
              new ChromeApiExtensionError(
                'No response received from message handler',
                'MESSAGING_SERVICE',
                { code: 'NO_RESPONSE', message }
              )
            );
            return;
          }

          resolve(response);
        });
      } catch (error) {
        clearTimeout(timeoutId);
        reject(
          new ChromeApiExtensionError('Failed to send runtime message', 'MESSAGING_SERVICE', {
            code: 'MESSAGE_SEND_ERROR',
            message,
            error,
          })
        );
      }
    });
  }

  /**
   * Registers a message listener for incoming messages
   *
   * @param handler - Async handler function for processing messages
   */
  public onMessage<TRequest = ChromeMessage, TResponse = ChromeMessageResponse>(
    handler: (message: TRequest) => Promise<TResponse>
  ): void {
    // Remove existing listener if present
    if (this.currentListener) {
      chrome.runtime.onMessage.removeListener(this.currentListener);
    }

    // Create new listener that wraps the async handler
    this.currentListener = (
      message: any,
      _sender: chrome.runtime.MessageSender,
      sendResponse: (response: any) => void
    ): boolean => {
      // Handle async message processing
      handler(message)
        .then(response => {
          sendResponse(response);
        })
        .catch(error => {
          // Send error response
          const errorResponse = {
            success: false,
            error: error.message || 'Message handler error',
          } as TResponse;
          sendResponse(errorResponse);
        });

      // Return true to indicate we will call sendResponse asynchronously
      return true;
    };

    chrome.runtime.onMessage.addListener(this.currentListener);
  }

  /**
   * Removes the current message listener
   */
  public removeMessageListener(): void {
    if (this.currentListener) {
      chrome.runtime.onMessage.removeListener(this.currentListener);
      this.currentListener = null;
    }
  }

  /**
   * Sends a message to a specific tab
   *
   * @param tabId - The tab ID to send the message to
   * @param message - The message to send
   * @param options - Optional configuration
   * @returns Promise resolving to the response
   * @throws ChromeApiExtensionError if the operation fails
   */
  public async sendMessageToTab<TResponse = any>(
    tabId: number,
    message: any,
    options: MessageOptions = {}
  ): Promise<TResponse> {
    const timeout = options.timeout ?? 5000;

    return new Promise<TResponse>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(
          new ChromeApiExtensionError(
            'Tab message timeout - no response received within timeout period',
            'MESSAGING_SERVICE',
            { code: 'TAB_MESSAGE_TIMEOUT', tabId, message, timeout }
          )
        );
      }, timeout);

      try {
        chrome.tabs.sendMessage(tabId, message, (response: TResponse) => {
          clearTimeout(timeoutId);

          if (chrome.runtime.lastError) {
            reject(
              new ChromeApiExtensionError(
                `Failed to send message to tab ${tabId}: ${chrome.runtime.lastError.message}`,
                'MESSAGING_SERVICE',
                { code: 'TAB_MESSAGE_FAILED', tabId, message, error: chrome.runtime.lastError }
              )
            );
            return;
          }

          resolve(response);
        });
      } catch (error) {
        clearTimeout(timeoutId);
        reject(
          new ChromeApiExtensionError(
            `Failed to send message to tab ${tabId}`,
            'MESSAGING_SERVICE',
            { code: 'TAB_MESSAGE_ERROR', tabId, message, error }
          )
        );
      }
    });
  }

  /**
   * Broadcasts a message to all tabs matching the query
   *
   * @param message - The message to broadcast
   * @param queryInfo - Tab query information
   * @returns Promise resolving to array of responses
   */
  public async broadcastToTabs<TResponse = any>(
    message: any,
    queryInfo: chrome.tabs.QueryInfo = {}
  ): Promise<TResponse[]> {
    try {
      const tabs = await this.queryTabs(queryInfo);
      const promises = tabs
        .filter(tab => tab.id !== undefined)
        .map(tab =>
          this.sendMessageToTab<TResponse>(tab.id!, message).catch(error => {
            // Log error but don't fail entire broadcast
            console.warn(`Failed to send message to tab ${tab.id}:`, error);
            return null;
          })
        );

      const responses = await Promise.all(promises);
      return responses.filter(response => response !== null) as TResponse[];
    } catch (error) {
      throw new ChromeApiExtensionError(
        'Failed to broadcast message to tabs',
        'MESSAGING_SERVICE',
        { code: 'BROADCAST_FAILED', message, queryInfo, error }
      );
    }
  }

  /**
   * Helper method to query tabs
   *
   * @param queryInfo - Tab query information
   * @returns Promise resolving to array of tabs
   */
  private async queryTabs(queryInfo: chrome.tabs.QueryInfo): Promise<chrome.tabs.Tab[]> {
    return new Promise<chrome.tabs.Tab[]>((resolve, reject) => {
      chrome.tabs.query(queryInfo, (tabs: chrome.tabs.Tab[]) => {
        if (chrome.runtime.lastError) {
          reject(
            new ChromeApiExtensionError(
              `Failed to query tabs: ${chrome.runtime.lastError.message}`,
              'MESSAGING_SERVICE',
              { code: 'TAB_QUERY_FAILED', queryInfo, error: chrome.runtime.lastError }
            )
          );
          return;
        }

        resolve(tabs);
      });
    });
  }

  /**
   * Checks if the extension context is still valid
   *
   * @returns boolean indicating if context is valid
   */
  public isContextValid(): boolean {
    try {
      return !!(chrome.runtime && chrome.runtime.id);
    } catch {
      return false;
    }
  }

  /**
   * Gets the extension ID
   *
   * @returns string extension ID or null if not available
   */
  public getExtensionId(): string | null {
    try {
      return chrome.runtime.id || null;
    } catch {
      return null;
    }
  }
}

/**
 * Message options interface
 */
export interface MessageOptions {
  readonly timeout?: number; // Timeout in milliseconds
}

/**
 * Default messaging service instance
 */
export const messagingService = new MessagingService();
