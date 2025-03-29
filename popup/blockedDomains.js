// popup/blockedDomains.js

export function setupBlockedDomains(confirmation) {

  const blockedDomainsListColumn1 = document.getElementById('blockedDomainsListColumn1');
  const blockedDomainsListColumn2 = document.getElementById('blockedDomainsListColumn2');
  const addDomainInput = document.getElementById('addDomainInput');
  const addDomainButton = document.getElementById('addDomainButton');

  if (!blockedDomainsListColumn1 || !blockedDomainsListColumn2 || !addDomainInput || !addDomainButton) {
    console.error("Blocked Domains elements not found.");
    return;
  }

  async function renderBlockedDomains() {
    blockedDomainsListColumn1.innerHTML = '';
    blockedDomainsListColumn2.innerHTML = '';
    const blockedDomains = await chrome.runtime.sendMessage({ action: 'getBlockedDomains' });
    const column1 = [];
    const column2 = [];
    blockedDomains.forEach((domain, index) => {
      if (index % 2 === 0) {
        column1.push(domain);
      } else {
        column2.push(domain);
      }
    });

    column1.forEach((domain) => {
      const listItem = document.createElement('li');
      listItem.textContent = domain;

      const removeButton = document.createElement('button');
      removeButton.textContent = '-';
      removeButton.classList.add('remove-domain-button');
      removeButton.addEventListener('click', async () => {
        await chrome.runtime.sendMessage({ action: 'removeBlockedDomain', domain: domain });
        renderBlockedDomains();
      });
      const buttonsContainer = document.createElement('div');
      buttonsContainer.classList.add('domain-list-buttons');
      buttonsContainer.appendChild(removeButton);
      listItem.appendChild(buttonsContainer);
      blockedDomainsListColumn1.appendChild(listItem);
    });
    column2.forEach((domain) => {
      const listItem = document.createElement('li');
      listItem.textContent = domain;

      const removeButton = document.createElement('button');
      removeButton.textContent = '-';
      removeButton.classList.add('remove-domain-button');
      removeButton.addEventListener('click', async () => {
        await chrome.runtime.sendMessage({ action: 'removeBlockedDomain', domain: domain });
        await renderBlockedDomains();
        confirmation.showConfirmation();
      });
      const buttonsContainer = document.createElement('div');
      buttonsContainer.classList.add('domain-list-buttons');
      buttonsContainer.appendChild(removeButton);
      listItem.appendChild(buttonsContainer);
      blockedDomainsListColumn2.appendChild(listItem);
    });
  }

  renderBlockedDomains();

  addDomainButton.addEventListener('click', async () => {
    const domain = addDomainInput.value.trim();
    if (domain) {
      await chrome.runtime.sendMessage({ action: 'addBlockedDomain', domain: domain });
      addDomainInput.value = '';
      await renderBlockedDomains();
      confirmation.showConfirmation();
    }
  });

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0];
    const currentUrl = new URL(currentTab.url);
    const currentDomain = currentUrl.hostname;
    addDomainInput.value = currentDomain;
  });

  return;
}