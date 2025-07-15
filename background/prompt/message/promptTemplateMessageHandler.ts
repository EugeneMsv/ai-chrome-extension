import { MessageHandler, MessageRequest } from '../../message/messageHandler';
import { ActionHandler } from '../../message/actionHandler';
import { PromptTemplateStorage, PromptTemplates } from '..//storage/promptTemplateStorage';

export class PromptTemplateMessageHandler extends MessageHandler {
  private promptStorage: PromptTemplateStorage;

  constructor() {
    super();
    this.promptStorage = new PromptTemplateStorage();
  }

  private actionHandlers: { [key: string]: ActionHandler } = {
    getPromptTemplates: this.handleGetPromptTemplates,
    getDefaultPromptTemplates: this.handleGetDefaultPromptTemplates,
    savePromptTemplates: this.handleSavePromptTemplates,
    resetPromptTemplates: this.handleResetPromptTemplates,
  };

  public get supportedActions(): string[] {
    return [
      'getPromptTemplates',
      'getDefaultPromptTemplates',
      'savePromptTemplates',
      'resetPromptTemplates',
    ];
  }

  public handleMessage(
    request: MessageRequest,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void
  ): boolean | undefined {
    const handler = this.actionHandlers[request.action];

    if (handler) {
      handler.call(this, request, sender, sendResponse);
      return true; // Indicate that the response will be sent asynchronously
    }

    // This case should ideally not be reached if `canHandleAction` is working correctly
    // and the router only calls `handleMessage` for supported actions.
    console.warn(`PromptTemplateMessageHandler: Received unhandled action '${request.action}' internally.`);
    sendResponse({ error: `Internal error: PromptTemplateMessageHandler was incorrectly asked to handle '${request.action}'.` });
    return false;
  }

  private async handleGetPromptTemplates(
    request: MessageRequest,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void
  ): Promise<void> {
    try {
      const templates = await this.promptStorage.getPromptTemplates();
      sendResponse(templates);
    } catch (error) {
      this.handleError(request.action, error, sendResponse);
    }
  }

  private async handleGetDefaultPromptTemplates(
    request: MessageRequest,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void
  ): Promise<void> {
    try {
      // Kept async for consistency with original manager, though storage method is sync
      const defaultTemplates = this.promptStorage.getDefaultTemplates();
      sendResponse(defaultTemplates);
    } catch (error) {
      this.handleError(request.action, error, sendResponse);
    }
  }

  private async handleSavePromptTemplates(
    request: MessageRequest,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void
  ): Promise<void> {
    try {
      // The MessageRequest interface has `data?: any;`
      // We expect `request.data` to be the PromptTemplates object.
      const templatesToSave = request.data as PromptTemplates | undefined;
      if (!templatesToSave || typeof templatesToSave !== 'object' || Object.keys(templatesToSave).length === 0) {
        throw new Error("Prompt templates data is missing or invalid in the request data.");
      }
      await this.promptStorage.savePromptTemplates(templatesToSave);
      sendResponse({ success: true, message: "Prompt templates saved successfully." });
    } catch (error) {
      this.handleError(request.action, error, sendResponse);
    }
  }


  private async handleResetPromptTemplates(
    request: MessageRequest,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void
  ): Promise<void> {
    try {
      await this.promptStorage.resetPromptTemplates();
      sendResponse({ success: true, message: "Prompt templates reset successfully." });
    } catch (error) {
      this.handleError(request.action, error, sendResponse);
    }
  }

  // Common error handler for async operations
  private handleError(action: string, error: unknown, sendResponse: (response?: unknown) => void) {
    console.error(`PromptTemplateMessageHandler: Error handling action '${action}':`, error);
    sendResponse({ error: (error instanceof Error) ? error.message : 'An unknown error occurred.' });
  }
}
