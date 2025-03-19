// options/options.js
document.addEventListener('DOMContentLoaded', () => {
    const saveButton = document.getElementById('saveApiKey');
    const apiKeyInput = document.getElementById('geminiApiKey');

    // Load saved API key on page load
    chrome.storage.sync.get(['geminiApiKey'], (result) => {
        if (result.geminiApiKey) {
            apiKeyInput.value = result.geminiApiKey;
        }
    });

    saveButton.addEventListener('click', () => {
        const apiKey = apiKeyInput.value;
        chrome.storage.sync.set({ geminiApiKey: apiKey }, () => {
            console.log('Gemini API key saved');
            // Provide user feedback or redirect
            alert('Gemini API key saved!');
            // you can close the tab using the next line if you want
            // window.close();
        });
    });
});