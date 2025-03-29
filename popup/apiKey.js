// popup/apiKey.js

export function setupApiKey() {
  const apiKeyInput = document.getElementById('geminiApiKey');
  const applyChangesButton = document.getElementById('aiSettings-apply');
  const confirmationMessage = document.getElementById('aiSettingsConfirmation');

  if (!apiKeyInput || !applyChangesButton || !confirmationMessage) {
    console.error("API Key elements not found.");
    return;
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
      showConfirmation(confirmationMessage);
    }
  }

  // Function to show confirmation message
  function showConfirmation(messageElement) {
    messageElement.style.display = 'block';
    setTimeout(() => {
      messageElement.style.display = 'none';
    }, 3000); // Hide after 3 seconds
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

  // Load API key on popup open
  loadApiKey();


  // Apply changes button
  applyChangesButton.addEventListener('click', async () => {
    await saveApiKey();
  });

  return;
}