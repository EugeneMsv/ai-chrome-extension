import { setupPromptTemplates } from './promptTemplates.js';
import { setupApiKey } from './apiKey.js';
import { setupMaxOutputTokens } from './maxOutputTokens.js';
import { setupBlockedDomains } from './blockedDomains.js';

document.addEventListener('DOMContentLoaded', () => {

  const { loadApiKey, saveApiKey } = setupApiKey();
  const { loadMaxOutputTokens, saveMaxOutputTokens } = setupMaxOutputTokens();
  const { loadPromptTemplates, savePromptTemplates } = setupPromptTemplates();
  const { renderBlockedDomains } = setupBlockedDomains();

  const applyChangesButton = document.getElementById('applyChanges');

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