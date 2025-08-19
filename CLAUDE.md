# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Build and Deployment
- `npm run build` - Build the extension using Webpack (creates dist/ bundles)
- `npm run zip` - Create a ZIP file for Chrome Web Store upload
- `npm run pack` - Build and zip, then display Chrome extension loading instructions

### Development Workflow
- After code changes, run `npm run build` to rebuild the bundles
- Load the extension in Chrome via `chrome://extensions/` (Developer mode → Load unpacked)
- Use `npm run pack` when ready to create a distribution package

## Architecture Overview

This is a Chrome Extension (Manifest V3) that integrates with Google Gemini API to provide AI-powered text processing capabilities.

### Core Architecture Pattern
The extension follows a **modular service-oriented architecture** with clear separation between content scripts, background service worker, and UI components:

**Content Script Layer** (`content/`):
- `ApplicationManager` - Central coordinator that manages text selection, domain blocking, UI state
- `AiButton` & `BubbleButton` - UI components for user interaction
- `PopupHandler` - Manages result display with Shadow DOM isolation

**Background Service Worker** (`background/`):
- `promptExecutor.js` - Handles Gemini API communication and response caching
- `apiKeyManager.js` - Secure API key storage/retrieval
- `promptTemplateManager.js` - Template-based prompt generation
- `domainBlocker.js` - User-configurable domain blocking

**Configuration Layer** (`background/config/`):
- `generationConfigBuilder.js` - Gemini API configuration management
- `maxOutputTokensManager.js` - Token limit management

### Key Architectural Decisions

1. **Message-Based Communication**: Content scripts communicate with background worker via `chrome.runtime.sendMessage`
2. **Shadow DOM Isolation**: Popups use Shadow DOM to prevent CSS conflicts with host pages
3. **Debounced Selection**: Text selection events are debounced (150ms) to prevent excessive API calls
4. **Response Caching**: Background worker caches responses using djb2 hash algorithm (max 100 entries)
5. **Domain Blocking**: Asynchronous domain check on content script startup, with real-time updates

### Bundle Architecture
- Webpack bundles two entry points:
  - `dist/content.bundle.js` - Content script bundle
  - `dist/background.bundle.js` - Service worker bundle
- Source maps enabled for debugging (`cheap-module-source-map`)

## Development Patterns

### Adding New AI Actions
1. Add handler method in `ApplicationManager` (follow pattern: `handle{Action}Click`)
2. Add bubble button configuration in `createAndShowAiButton`
3. Add prompt template in `promptTemplateManager.js`
4. Add message listener case in `promptExecutor.js`

### Extension Components Communication Flow
1. Content script detects text selection → `ApplicationManager`
2. User clicks action → Message sent to background worker
3. Background worker processes via Gemini API → Returns response
4. Content script displays result in popup via `PopupHandler`

### Testing and Quality
- Test framework/scripts are not currently configured
- Manual testing via Chrome extension developer tools
- Check console logs in both content script and background worker contexts

## File Structure Context

- `manifest.json` - Chrome Extension configuration (permissions, entry points)
- `webpack.config.js` - Build configuration for content/background bundles  
- `content/main.js` - Content script entry point, initializes `ApplicationManager`
- `background/background.js` - Service worker entry point, imports all background modules
- `popup/` & `options/` - Extension UI pages (settings, popup interface)
- `dist/` - Webpack build output (gitignored, created by `npm run build`)

## API Integration

- Uses Google Gemini 2.0 Flash model via REST API
- API key stored in Chrome extension storage
- Configurable via options page or environment variables
- Built-in response caching and error handling