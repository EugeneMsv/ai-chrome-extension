import { setupPromptTemplates } from './promptTemplates.js';
import { setupApiKey } from './apiKey.js';
import { setupMaxOutputTokens } from './maxOutputTokens.js';
import { setupBlockedDomains } from './blockedDomains.js';

document.addEventListener('DOMContentLoaded', () => {

  setupApiKey();
  setupMaxOutputTokens();
  setupPromptTemplates();
  setupBlockedDomains();

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