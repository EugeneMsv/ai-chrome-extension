// popup/promptTemplates.js

export function setupPromptTemplates(confirmation) {
  const promptTemplatesContainer = document.getElementById('promptTemplatesContainer');
  const resetPromptsButton = document.getElementById('resetPrompts');
  const applyChangesButton = document.getElementById('promptTemplates-apply');

  if (!promptTemplatesContainer
  || !resetPromptsButton
  || !applyChangesButton) {
    console.error("Prompt Templates elements not found.");
    return;
  }

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
        confirmation.showConfirmation();
      });

      container.appendChild(header);

      const textarea = document.createElement('textarea');
      textarea.id = key;
      textarea.value = promptTemplates[key];
      container.appendChild(textarea);
      container.appendChild(resetButton);

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
    confirmation.showConfirmation();
  }

  // Load prompt templates on popup open
  loadPromptTemplates();

  // Reset prompts button
  resetPromptsButton.addEventListener('click', async () => {
    await chrome.runtime.sendMessage({ action: 'resetPromptTemplates' });
    loadPromptTemplates(); // Reload templates after reset
    confirmation.showConfirmation();
  });



  // Apply changes button
  applyChangesButton.addEventListener('click', async () => {
    await savePromptTemplates();
  });

  return;
}