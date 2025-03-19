document.addEventListener('DOMContentLoaded', () => {
  const apiKeyInput = document.getElementById('geminiApiKey');
  const maxOutputTokensInput = document.getElementById('maxOutputTokens');
  const promptTemplatesContainer = document.getElementById('promptTemplatesContainer');
  const resetPromptsButton = document.getElementById('resetPrompts');
  const applyChangesButton = document.getElementById('applyChanges');

  // Function to load and display prompt templates
  async function loadPromptTemplates() {
    const promptTemplates = await chrome.runtime.sendMessage({ action: 'getPromptTemplates' });
    promptTemplatesContainer.innerHTML = ''; // Clear existing inputs

    for (const key in promptTemplates) {
      const container = document.createElement('div');
      container.classList.add('prompt-container');

      const header = document.createElement('div');
      header.classList.add('prompt-header');

      const label = document.createElement('label');
      label.textContent = key.charAt(0).toUpperCase() + key.slice(1); // Capitalize first letter
      header.appendChild(label);

      const resetButton = document.createElement('button');
      resetButton.textContent = 'Reset';
      resetButton.classList.add('reset-button');
      resetButton.addEventListener('click', async () => {
        const defaultTemplates = await chrome.runtime.sendMessage({ action: 'getDefaultPromptTemplates' });
        textarea.value = defaultTemplates[key];
      });
      header.appendChild(resetButton);
      container.appendChild(header);

      const textarea = document.createElement('textarea');
      textarea.id = key;
      textarea.value = promptTemplates[key];
      container.appendChild(textarea);

      promptTemplatesContainer.appendChild(container);
    }
  }

  // Function to save prompt templates
  async function savePromptTemplates() {
    const newPromptTemplates = {};
    const textareas = promptTemplatesContainer.querySelectorAll('textarea');
    textareas.forEach(textarea => {
      newPromptTemplates[textarea.id] = textarea.value;
    });
    await chrome.runtime.sendMessage({ action: 'savePromptTemplates', promptTemplates: newPromptTemplates });
  }

  // Function to load API key
  async function loadApiKey() {
    const apiKey = await chrome.runtime.sendMessage({ action: 'getApiKey' });
    if (apiKey) {
      apiKeyInput.dataset.fullApiKey = apiKey;
      maskApiKey();
    } else {
      apiKeyInput.value = '';
      apiKeyInput.dataset.fullApiKey = '';
    }
  }

  // Function to mask the API key
  function maskApiKey() {
    const apiKey = apiKeyInput.dataset.fullApiKey;
    if (apiKey) {
      apiKeyInput.value = '*'.repeat(Math.max(0, apiKey.length - 4)) + apiKey.slice(-4);
    } else {
      apiKeyInput.value = '';
    }
  }

  // Function to save API key
  async function saveApiKey() {
    const apiKey = apiKeyInput.dataset.fullApiKey;
    if (apiKey) {
      await chrome.runtime.sendMessage({ action: 'saveApiKey', apiKey: apiKey });
    }
  }


  apiKeyInput.addEventListener('focus', () => {
    if (apiKeyInput.dataset.fullApiKey)
    apiKeyInput.value = apiKeyInput.dataset.fullApiKey;
  });

  apiKeyInput.addEventListener('blur', () => {
    maskApiKey();
  });

  apiKeyInput.addEventListener('input', () => {
    apiKeyInput.dataset.fullApiKey = apiKeyInput.value;
  });

  // Function to load maxOutputTokens
  async function loadMaxOutputTokens() {
    const maxOutputTokens = await chrome.runtime.sendMessage({ action: 'getMaxOutputTokens' });
    maxOutputTokensInput.value = maxOutputTokens;
  }

  // Function to save maxOutputTokens
  async function saveMaxOutputTokens() {
    let maxOutputTokens = parseInt(maxOutputTokensInput.value, 10);
    if (isNaN(maxOutputTokens) || maxOutputTokens < 1 || maxOutputTokens > 3000) {
      maxOutputTokens = 1000; // Default value
      maxOutputTokensInput.value = maxOutputTokens;
      alert('Max Output Tokens must be a number between 1 and 3000. Setting to default 1000.');
    }
    await chrome.runtime.sendMessage({ action: 'saveMaxOutputTokens', maxOutputTokens: maxOutputTokens });
  }

  // Load prompt templates and API key on popup open
  loadApiKey();
  loadPromptTemplates();
  loadMaxOutputTokens();


  // Reset prompts button
  resetPromptsButton.addEventListener('click', async () => {
    await chrome.runtime.sendMessage({ action: 'resetPromptTemplates' });
    loadPromptTemplates(); // Reload templates after reset
  });

  // Apply changes button
  applyChangesButton.addEventListener('click', async () => {
    await saveApiKey();
    await saveMaxOutputTokens();
    await savePromptTemplates();
    alert('Settings saved!');
  });
});
