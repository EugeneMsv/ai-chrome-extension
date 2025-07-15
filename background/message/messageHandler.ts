/**
 * Represents the structure of a message request.
 * All requests must have an 'action' property.
 */
export interface MessageRequest {
  action: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any; // Optional data payload, can be any type
}

/**
 * Abstract base class for message handlers.
 * Subclasses must implement `supportedActions` getter and `handleMessage` method.
 */
export abstract class MessageHandler {
  /**
   * @returns {string[]} An array of action strings this handler supports.
   * @abstract
   */
  public abstract get supportedActions(): string[];

  /**
   * Handles an incoming message.
   * @param {MessageRequest} request The message request object.
   * @param {chrome.runtime.MessageSender} sender The sender of the message.
   * @param {(response?: any) => void} sendResponse Function to send a response.
   * @returns {boolean | undefined | Promise<any>} Return `true` if `sendResponse` will be called asynchronously.
   *                                             The promise's resolved value is not directly used by the router
   *                                             if `true` was returned, but the pattern can be useful.
   * @abstract
   */
  public abstract handleMessage(
    request: MessageRequest,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void
  ): boolean | undefined | Promise<unknown>;

  /**
   * Checks if this handler supports the given action.
   * @param {string} action The action string from the request.
   * @returns {boolean} True if the action is supported, false otherwise.
   */
  public canHandleAction(action: string): boolean {
    return this.supportedActions.includes(action);
  }
}