import { setupPromptTemplates } from './promptTemplates.js';
import { setupApiKey } from './apiKey.js';
import { setupMaxOutputTokens } from './maxOutputTokens.js';
import { setupBlockedDomains } from './blockedDomains.js';

document.addEventListener('DOMContentLoaded', () => {
  const apiKeyInput = document.getElementById('geminiApiKey');
  const maxOutputTokensInput = document.getElementById('maxOutputTokens');
  const promptTemplatesContainer = document.getElementById('promptTemplatesContainer');
  const resetPromptsButton = document.getElementById('resetPrompts');
  const applyChangesButton = document.getElementById('applyChanges');
  const blockedDomainsListColumn1 = document.getElementById('blockedDomainsListColumn1');
  const blockedDomainsListColumn2 = document.getElementById('blockedDomainsListColumn2');
  const addDomainInput = document.getElementById('addDomainInput');
  const addDomainButton = document.getElementById('addDomainButton');

  const { loadApiKey, saveApiKey } = setupApiKey(apiKeyInput);
  const { loadMaxOutputTokens, saveMaxOutputTokens } = setupMaxOutputTokens(maxOutputTokensInput);
  const { loadPromptTemplates, savePromptTemplates } = setupPromptTemplates(promptTemplatesContainer);
  const { renderBlockedDomains } = setupBlockedDomains(blockedDomainsListColumn1, blockedDomainsListColumn2, addDomainInput, addDomainButton);

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

  // Tab functionality
  const tabButtons = document.querySelectorAll('.tablinks');
  const tabContents = document.querySelectorAll('.tabcontent');

  function openTab(tabName) {
    tabContents.forEach(tabContent => {
      tabContent.classList.remove('active');
    });
    tabButtons.forEach(tabButton => {
      tabButton.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
  }

  tabButtons.forEach(tabButton => {
    tabButton.addEventListener('click', (event) => {
      const tabName = event.currentTarget.dataset.tab;
      openTab(tabName);
    });
  });
});