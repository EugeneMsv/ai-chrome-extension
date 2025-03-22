# Gemini Chrome Extension

## Overview

The Gemini Chrome Extension is a browser extension that enhances text interaction on web pages using the Google Gemini API, allowing users to summarize, find the meaning of, rephrase, and translate selected text. The extension provides a user-friendly interface with an AI button that appears upon text selection, offering quick access to these functionalities.

## Features

-   **Text Summarization:** Summarizes selected text using the Gemini API.
-   **Meaning Lookup:** Provides the meaning of selected text.
-   **Rephrasing:** Rephrases selected text.
-   **Translation:** Translates selected text to a specified target language (default: Russian).
-   **AI-Powered:** Leverages the Google Gemini API for text processing.
-   **User-Friendly Interface:** Features an intuitive AI button and popup interface.
-   **Customizable:** Allows for future expansion and customization of features.
-   **Consistent Styling:** The popup has a consistent dark background and light text.
-   **Robust Styling:** The popup's styling is resistant to overrides from webpage CSS.

## Project Structure

The project is organized into the following directories and files:


## Key Components

-   **`manifest.json`:** Defines the extension's metadata, permissions, and entry points.
-   **`content/content.js`:**  The main content script that injects the AI button and handles user interactions on web pages.
-   **`background/promptExecutor.js`:**  Handles communication with the Gemini API and executes prompts.
-   **`background/apiKeyManager.js`:** Manages the storage and retrieval of the Gemini API key.
-   **`background/promptTemplateManager.js`:** Manages the prompt templates for different actions.
-   **`background/config/builder/gemini/generationConfigBuilder.js`:** Builds the generation configuration for the Gemini API.
-   **`webpack.config.js`:** Configures Webpack for bundling the project's JavaScript files.
-   **`package.json`:** Manages the project's dependencies and build scripts.
-   **`scripts/zip.js`:** A Node.js script for zipping the extension's files into a `.zip` archive.
-   **`dist/content.bundle.js`:** The bundled version of the content script, ready for injection into web pages.
-   **`dist/background.bundle.js`:** The bundled version of the background script, ready for use as a service worker.
- **`node_modules`:** Contains all the npm dependencies.
- **`options/options.html`:** The options page for the extension.
- **`popup/popup.html`:** The popup page for the extension.
- **`images/extension_icon.png`:** The extension icon.
- **`.gitignore`:** Specifies intentionally untracked files that Git should ignore.

## How It Works

1.  **Text Selection:** When a user selects text on a web page, the `content/content.js` script detects the selection and displays the AI button near the selected text.
2.  **AI Button Interaction:** When the user interacts with the AI button, it shows a set of bubble buttons (Summarize, Meaning, Rephrase, Translate).
3.  **Bubble Button Click:** When a bubble button is clicked, `content/content.js` sends a message to the background script (`background/promptExecutor.js`) with the selected text and the requested action.
4.  **Gemini API Interaction:** The background script receives the message, retrieves the API key, constructs the appropriate prompt, and sends it to the Gemini API.
5.  **Response Handling:** The background script receives the response from the Gemini API, extracts the relevant information, and sends it back to the content script.
6.  **Popup Display:** The content script receives the response and displays it in a popup using the `showPopup` function.
7. **Popup styling:** The popup is styled with a dark background and light text.
8. **Shadow DOM:** The popup is encapsulated within a Shadow DOM.
9. **`!important`:** The `!important` flag is used to make inline styles more resistant to overrides.
10. **Unique class:** The popup has a unique class to help identify it.

## Installation and Usage

1.  **Clone the Repository:**
2.  **Install Dependencies:**
3.  **Build the Extension:**
4.  **Load the Extension in Chrome:**

    -   Open Chrome and go to `chrome://extensions/`.
    -   Enable "Developer mode" in the top right corner.
    -   Click "Load unpacked."
    -   Select the `gemini-chrome-extension` directory.

5.  **Use the Extension:**

    -   Select text on any web page.
    -   The AI button will appear.
    -   Click the AI button to show the bubble buttons.
    -   Click a bubble button to perform the corresponding action.

## Contributing

Contributions are welcome! Please feel free to open issues or submit pull requests.

## License

MIT