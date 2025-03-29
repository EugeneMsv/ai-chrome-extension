// popup/maxOutputTokens.js

export function setupMaxOutputTokens(confirmation) {
  const maxOutputTokensInput = document.getElementById('maxOutputTokens');
  const applyChangesButton = document.getElementById('aiSettings-apply');
  if (!maxOutputTokensInput || !applyChangesButton) {
    console.error("Max Output Tokens elements not found.");
    return;
  }

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
    confirmation.showConfirmation();
  }

  // Load maxOutputTokens on popup open
  loadMaxOutputTokens();

  // Apply changes button
  applyChangesButton.addEventListener('click', async () => {
    await saveMaxOutputTokens();
  });

  return ;
}