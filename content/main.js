// content/content.js

// This script is the main entry point for the content script bundle.
// It initializes the ButtonManager, which handles everything else.

import { ApplicationManager } from './applicationManager.js';

// Initialize the Button Manager when the script loads
const manager = new ApplicationManager();

// No further logic needed here, ButtonManager handles events.