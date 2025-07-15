import { MessageHandler, MessageRequest } from './messageHandler.ts';

/**
 * Manages registration of MessageHandler instances and routes incoming
 * chrome.runtime.onMessage events to the appropriate handler.
 */
export class GlobalMessageRouter {
  private handlers: MessageHandler[] = [];
  private isListening: boolean = false;

  private readonly boundRouteMessage: (
    request: MessageRequest, // Use MessageRequest here
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void
  ) => boolean | undefined;

  constructor() {
    this.boundRouteMessage = this.routeMessage.bind(this);
  }

  /**
   * Registers a single message handler.
   * @param {MessageHandler} handler - An instance of a class extending MessageHandler.
   */
  public registerHandler(handler: MessageHandler): void {
    if (this.handlers.some(h => h === handler)) {
        console.warn("GlobalMessageRouter: Handler instance already registered.", handler.constructor.name);
        return;
    }
    this.handlers.push(handler);
    console.log(
      `GlobalMessageRouter: Registered handler '${
        handler.constructor.name
      }' for actions: [${handler.supportedActions.join(', ')}]`
    );
  }

  /**
   * Registers multiple message handlers from an array.
   * @param {MessageHandler[]} handlers - An array of MessageHandler instances.
   */
  public registerHandlers(handlers: MessageHandler[]): void {
    if (!Array.isArray(handlers)) {
        console.error("GlobalMessageRouter: Invalid input. Expected an array of handlers.");
        return;
    }
    handlers.forEach(handler => this.registerHandler(handler));
  }

  /**
   * Starts listening for messages if not already listening.
   * Sets up the chrome.runtime.onMessage listener.
   */
  public listen(): void {
    if (this.isListening) {
      console.warn("GlobalMessageRouter: Already listening for messages.");
      return;
    }

    if (
      typeof chrome === 'undefined' ||
      !chrome.runtime ||
      !chrome.runtime.onMessage
    ) {
      console.error(
        "GlobalMessageRouter: chrome.runtime.onMessage is not available. Ensure this runs in a Chrome extension context (e.g., background service worker)."
      );
      return;
    }

    chrome.runtime.onMessage.addListener(this.boundRouteMessage);
    this.isListening = true;
    console.log("GlobalMessageRouter: Now listening for runtime messages.");
  }

  /**
   * The actual listener function passed to chrome.runtime.onMessage.
   * @private
   * @param {MessageRequest} request The message request object.
   * @param {chrome.runtime.MessageSender} sender The sender of the message.
   * @param {(response?: any) => void} sendResponse Function to send a response.
   * @returns {boolean | undefined} True if a handler will respond asynchronously.
   */
  private routeMessage(
    request: MessageRequest, // Typed request
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void
  ): boolean | undefined {
    const senderOrigin = sender.tab
      ? `content script (${sender.tab.url || 'URL not available'})`
      : sender.id === chrome.runtime.id
      ? 'extension internal'
      : `external extension (${sender.id})`;

    // `request.action` is guaranteed by MessageRequest, but a runtime check is still good defense.
    if (typeof request.action !== 'string') {
      console.warn(
        `GlobalMessageRouter: Received message from ${senderOrigin} without a valid 'action' string property. Request:`,
        request
      );
      // sendResponse({ error: "Message must have an 'action' property of type string." });
      return false;
    }

    console.log(
      `GlobalMessageRouter: Received action='${request.action}' from ${senderOrigin}.`
    );

    for (const handler of this.handlers) {
      if (handler.canHandleAction(request.action)) {
        console.log(
          `GlobalMessageRouter: Dispatching action '${request.action}' to handler: ${handler.constructor.name}`
        );
        try {
          const result = handler.handleMessage(request, sender, sendResponse);

          if (result === true) {
            return true;
          }

          if (result && typeof (result as Promise<unknown>).then === 'function') {
            console.warn(
              `GlobalMessageRouter: Handler '${handler.constructor.name}' for action '${request.action}' returned a Promise but did not return 'true' synchronously. ` +
              `If sendResponse is called within this promise, the message port might close prematurely.`
            );
            (result as Promise<unknown>).catch(error => {
              console.error(
                `GlobalMessageRouter: Uncaught error in async handler '${handler.constructor.name}' for action '${request.action}' (promise returned without 'true'):`,
                error
              );
              try {
                if (typeof sendResponse === 'function') {
                  sendResponse({
                    error: `Unhandled async error in handler for ${request.action}: ${(error as Error).message}`,
                  });
                }
              } catch (e) { /* ignore if sending fails */ }
            });
            return false;
          }
          return result; // Propagate sync return
        } catch (error) {
          console.error(
            `GlobalMessageRouter: Synchronous error in handler '${handler.constructor.name}' for action '${request.action}':`,
            error
          );
          try {
            if (typeof sendResponse === 'function') {
              sendResponse({ error: `Error processing action ${request.action}: ${(error as Error).message}` });
            }
          } catch (e) {
            console.error(
              `GlobalMessageRouter: Failed to send error response for action '${request.action}':`,
              e
            );
          }
          return false;
        }
      }
    }

    console.warn(
      `GlobalMessageRouter: No handler registered for action '${request.action}'.`
    );
    // if (typeof sendResponse === 'function') {
    //   sendResponse({ error: `Unhandled action: ${request.action}` });
    // }
    return false;
  }

  /**
   * Stops listening for messages.
   */
  public stopListening(): void {
    if (!this.isListening) {
      console.warn("GlobalMessageRouter: Not currently listening, cannot stop.");
      return;
    }
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.removeListener(this.boundRouteMessage);
    }
    this.isListening = false;
    console.log("GlobalMessageRouter: Stopped listening for runtime messages.");
  }
}