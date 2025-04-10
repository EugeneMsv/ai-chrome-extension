# Gemini Chrome Extension

## Overview

The Gemini Chrome Extension is a browser extension that enhances text interaction on web pages using the Google Gemini API. It allows users to summarize, find the meaning of, rephrase, and translate selected text. The extension provides a user-friendly interface with an AI button that appears upon text selection, offering quick access to these functionalities.

## Features

-   **Text Summarization:** Summarizes selected text using the Gemini API.
-   **Meaning Lookup:** Provides the meaning of selected text.
-   **Rephrasing:** Rephrases selected text.
-   **Translation:** Translates selected text to a specified target language (default: Russian).
-   **AI-Powered:** Leverages the Google Gemini API for text processing.
-   **User-Friendly Interface:** Features an intuitive AI button and popup interface.
-   **Domain Blocking:** Allows users to disable the extension on specific websites via the options page.
-   **Customizable:** Allows for future expansion and customization of features.
-   **Consistent Styling:** The popup has a consistent dark background and light text.
-   **Robust Styling:** The popup's styling, encapsulated in a Shadow DOM, is resistant to overrides from webpage CSS.

## Project Structure

The project is organized into the following directories and files:
*(The structure description can remain largely the same, ensure it accurately reflects your current project layout)*

## Key Components

-   **`manifest.json`:** Defines the extension's metadata, permissions, and entry points.
-   **`content/main.js`:** The entry point for the content script bundle. Initializes the `ApplicationManager`.
-   **`content/applicationManager.js`:** Manages the core logic within the content script, including detecting text selection, displaying the AI button, handling domain blocking, managing the popup, and communicating with the background script.
-   **`content/aiButton.js`, `content/bubbleButton.js`, `content/popupHandler.js`:** UI components and handlers for the content script.
-   **`background/service-worker.js` (Bundled as `dist/background.bundle.js`):** The service worker handling background tasks.
    -   **`promptExecutor.js`:** Handles communication with the Gemini API and executes prompts.
    -   **`apiKeyManager.js`:** Manages the storage and retrieval of the Gemini API key.
    -   **`promptTemplateManager.js`:** Manages the prompt templates for different actions.
    -   **`domainBlocker.js`:** Manages the list of blocked domains.
    -   **`config/builder/gemini/generationConfigBuilder.js`:** Builds the generation configuration for the Gemini API.
-   **`webpack.config.js`:** Configures Webpack for bundling the project's JavaScript files.
-   **`package.json`:** Manages the project's dependencies and build scripts.
-   **`scripts/zip.js`:** A Node.js script for zipping the extension's files into a `.zip` archive.
-   **`dist/content.bundle.js`:** The bundled version of the content script, ready for injection into web pages.
-   **`dist/background.bundle.js`:** The bundled version of the background script, ready for use as a service worker.
-   **`node_modules`:** Contains all the npm dependencies.
-   **`options/options.html`:** The options page for the extension (e.g., API key input, domain blocking).
-   **`popup/popup.html`:** The browser action popup page for the extension.
-   **`images/extension_icon.png`:** The extension icon.
-   **`.gitignore`:** Specifies intentionally untracked files that Git should ignore.

## How It Works

1.  **Initialization:** When a web page loads, the `content/main.js` script runs, creating an instance of `ApplicationManager`.
2.  **Startup & Domain Check:** The `ApplicationManager`'s `start()` method is called. It asynchronously checks if the current domain is blocked by communicating with the background script (`domainBlocker.js`).
3.  **Event Listener Setup:** If the domain is *not* blocked, the `ApplicationManager` sets up event listeners, primarily listening for `mouseup` events to detect text selections. If the domain *is* blocked, listeners related to text selection are skipped.
4.  **Text Selection:** When a user selects text on a non-blocked page, the `mouseup` listener triggers the `ApplicationManager`.
5.  **AI Button Display:** The `ApplicationManager` calculates the position and displays the AI button (`AiButton`) near the selected text.
6.  **AI Button Interaction:** Clicking the AI button reveals bubble buttons (`BubbleButton`) for different actions (Summarize, Meaning, Rephrase, Translate).
7.  **Action Trigger:** Clicking a bubble button triggers the corresponding handler in `ApplicationManager`. This handler uses the `PopupHandler` to show a loading state in the popup and sends a message to the background service worker (`promptExecutor.js`) with the selected text and the requested action.
8.  **Gemini API Interaction:** The background script receives the message, retrieves the API key (`apiKeyManager.js`), constructs the appropriate prompt (`promptTemplateManager.js`), configures the request (`generationConfigBuilder.js`), and sends it to the Gemini API.
9.  **Response Handling:** The background script receives the response from the Gemini API, processes it, and sends it back to the `ApplicationManager` in the content script.
10. **Popup Display:** The `ApplicationManager`, via the `PopupHandler`, receives the response and displays the formatted result in the popup. The popup uses a Shadow DOM to isolate its styles.
11. **Domain Block Updates:** The `ApplicationManager` also listens for messages from the background script indicating changes in the domain block list. If the current domain becomes blocked, the AI button is removed if present.

## Installation and Usage

1.  **Clone the Repository:**
2.  **Install Dependencies:**
3.  **Build the Extension:**
4.  **Load the Extension in Chrome:**
    -   Open Chrome and go to `chrome://extensions/`.
    -   Enable "Developer mode" in the top right corner.
    -   Click "Load unpacked."
    -   Select the `gemini-chrome-extension` directory (the one containing `manifest.json`).
5.  **Set API Key (if needed):** Navigate to the extension's options page (usually by clicking 
    the extension icon then an options link, or via the `chrome://extensions/` details page) and enter your Gemini API key if it's not configured via the `.env` method.
6.  **Use the Extension:**
    -   Select text on any web page (that isn't blocked in the options).
    -   The AI button will appear near your selection.
    -   Click the AI button to show the action bubbles.
    -   Click an action bubble (Summarize, Meaning, etc.).
    -   The result will appear in a popup.

## Disclaimer

**This project, including its codebase and this documentation, was significantly developed with the assistance of AI (specifically, Google Gemini). While reviewed and guided by a human developer, users should be aware that AI-generated code may contain unforeseen errors or inefficiencies.**

## Contributing

Contributions are welcome! Please feel free to open issues or submit pull requests.

## License

MIT