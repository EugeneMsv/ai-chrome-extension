// background/domainBlocker.js

const BLOCKED_DOMAINS_KEY = 'blockedDomains';

async function getBlockedDomains() {
  return new Promise((resolve) => {
    chrome.storage.local.get([BLOCKED_DOMAINS_KEY], (result) => {
      const blockedDomains = result[BLOCKED_DOMAINS_KEY] || [];
      resolve(blockedDomains);
    });
  });
}

async function addBlockedDomain(domain) {
  const blockedDomains = await getBlockedDomains();
  if (!blockedDomains.includes(domain)) {
    blockedDomains.push(domain);
    await chrome.storage.local.set({ [BLOCKED_DOMAINS_KEY]: blockedDomains });
  }
}

async function removeBlockedDomain(domain) {
  const blockedDomains = await getBlockedDomains();
  const updatedDomains = blockedDomains.filter((d) => d !== domain);
  await chrome.storage.local.set({ [BLOCKED_DOMAINS_KEY]: updatedDomains });
}

async function isDomainBlocked(domain) {
  const blockedDomains = await getBlockedDomains();
  return blockedDomains.includes(domain);
}

async function updateBlockedDomains(domains) {
  await chrome.storage.local.set({ [BLOCKED_DOMAINS_KEY]: domains });
}


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'isDomainBlocked') { // Changed action name
    (async () => {
      const url = new URL(sender.tab.url);
      const isBlocked = await isDomainBlocked(url.hostname); // Changed function name
      sendResponse({ isBlocked });
    })();
    return true;
  }
  if (request.action === 'getBlockedDomains') {
    (async () => {
      const blockedDomains = await getBlockedDomains();
      sendResponse(blockedDomains);
    })();
    return true;
  }
  if (request.action === 'addBlockedDomain') {
    (async () => {
      await addBlockedDomain(request.domain);
      sendResponse();
    })();
    return true;
  }
  if (request.action === 'removeBlockedDomain') {
    (async () => {
      await removeBlockedDomain(request.domain);
      sendResponse();
    })();
    return true;
  }
  if (request.action === 'updateBlockedDomains') {
    (async () => {
      await updateBlockedDomains(request.domains);
      sendResponse();
    })();
    return true;
  }
});