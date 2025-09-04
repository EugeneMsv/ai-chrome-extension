# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Build and Development
- `npm run build` - Build the extension using webpack (creates bundled files in `dist/`)
- `npm run zip` - Create a packaged extension zip file using the zip script
- `npm run pack` - Build and zip the extension, then display installation instructions

### Chrome Extension Development
The extension must be built before loading into Chrome:
1. Run `npm run build` to create `dist/content.bundle.js` and `dist/background.bundle.js`
2. Load the extension directory (containing `manifest.json`) in Chrome via `chrome://extensions/` in developer mode

## Architecture Overview

### Core Components
This is a Chrome Extension (Manifest V3) that integrates with Google Gemini API to provide text processing capabilities on web pages.

**Content Script Architecture:**
- `content/main.js` - Entry point that initializes `ApplicationManager`
- `content/applicationManager.js` - Central coordinator that manages text selection detection, UI components, and communication with background script
- `content/aiButton.js` - AI button UI component that appears on text selection
- `content/bubbleButton.js` - Action buttons (Summarize, Meaning, Rephrase, Translate)
- `content/popupHandler.js` - Manages popup display for results

**Background Script Architecture:**
- `background/background.js` - Entry point that imports all background modules
- `background/promptExecutor.js` - Handles Gemini API communication and caching
- `background/apiKeyManager.js` - Manages API key storage/retrieval
- `background/promptTemplateManager.js` - Manages prompt templates for different actions
- `background/config/domainBlocker.js` - Handles domain blocking functionality
- `background/config/builder/gemini/generationConfigBuilder.js` - Builds Gemini API configuration

### Key Architectural Patterns

**Event-Driven Communication:**
- Content script listens for `mouseup` events to detect text selection
- Background/content communication via Chrome runtime messaging API
- Domain blocking status is checked asynchronously on startup and updated via messages

**Modular UI Components:**
- Each UI component (AiButton, BubbleButton, PopupHandler) is a separate class
- Components use Shadow DOM for style isolation
- ApplicationManager coordinates between components

**State Management:**
- ApplicationManager maintains current button state and blocking status
- Background script manages API keys, templates, and domain blocking via Chrome storage
- Response caching implemented in promptExecutor for performance

### Extension Workflow
1. Content script checks if current domain is blocked
2. If not blocked, sets up text selection listeners
3. On text selection, displays AI button near cursor
4. AI button click reveals action bubbles (Summarize/Meaning/Rephrase/Translate)
5. Action triggers background script to call Gemini API
6. Result displayed in popup with formatted response

### Build System
- Webpack bundles content and background scripts separately
- Babel transpilation for ES6+ compatibility
- Development mode with source maps enabled
- Custom zip script packages extension for distribution (excludes node_modules, scripts, .env)

### Testing
- Jest framework configured for unit and integration testing
- Chrome extension testing utilities in `tests/setup/chrome-extension-setup.js`
- Integration tests for API key management in `tests/api-key-integration.test.js`
- Run tests with standard Jest commands

### Dependencies
- `marked` - Markdown rendering for popup content
- `archiver` - ZIP file creation for extension packaging
- Webpack/Babel toolchain for build process
- Jest testing framework for unit and integration tests

### Storage and Configuration
- Chrome storage API used for API keys, domain blocking, and prompt templates
- Environment variables can be used for API configuration
- Options page provides UI for API key and domain blocking configuration

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for detailed version history and release notes.