// content/main.js

// This script is the main entry point for the content script bundle.
// It initializes the ApplicationManager and starts its operation.

import { ApplicationManager } from './applicationManager.js';

// --- Initialization ---
console.log("Content script main.js executing.");

// Create the manager instance
// The constructor now does less work, mainly setting up internal state.
const manager = new ApplicationManager();

// --- Start the Application ---
// The start method handles async setup like checking domain status
// and attaching event listeners.
manager.start()
  .then(() => {
  // Optional: Log success or perform actions after successful start
  console.log("ApplicationManager successfully initialized and started.");
})
  .catch(error => {
  // Handle potential errors during the async start process
  console.error("Failed to start ApplicationManager:", error);
  // Depending on the error, you might want to disable functionality
});

// The ApplicationManager instance will now handle events internally.
console.log("main.js execution finished, ApplicationManager is running.");