// background/promptTemplateManager.js


// Add a listener for prompt template related messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log(`promptTemplateManager: Received action=${request.action}`);
    if (request.action === 'getPromptTemplates') {
      (async () => {
        sendResponse(await getPromptTemplates());
      })();
      return true;
    }
    if (request.action === 'getDefaultPromptTemplates') {
      (async () => {
        sendResponse(defaultPromptTemplates);
      })();
      return true;
    }
    if (request.action === 'savePromptTemplates') {
      (async () => {
        await savePromptTemplates(request.promptTemplates);
        sendResponse();
      })();
      return true;
    }
    if (request.action === 'resetPromptTemplates') {
      (async () => {
        await resetPromptTemplates();
        sendResponse();
      })();
      return true;
    }

});