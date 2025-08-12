// BubbleButton Component - UI Layer
// Button that appears in bubble around AI button

import { SmartButton } from './smart-button.component';

export class BubbleButton extends SmartButton {
  private selectedText: string;
  private clickHandler: ((text: string) => void) | null;

  constructor(buttonName: string, selectedText: string, clickHandler: (text: string) => void) {
    super(buttonName);
    this.selectedText = selectedText;
    this.clickHandler = clickHandler; // Store the handler

    this.setStyle({
      borderRadius: '5px',
      zIndex: '1004', // Ensure bubbles are visually above the AI button container bg
    });
    this._setupEventListeners(); // Set up specific listeners for BubbleButton
  }

  private _setupEventListeners(): void {
    // Override default click behavior from SmartButton
    this.onClick = (event: Event) => {
      if (!this.button) return;
      event.stopPropagation(); // Prevent triggering document's mouseup listener
      this.button.style.backgroundColor = '#6a66bb'; // Visual feedback for click
      if (this.clickHandler) {
        // The clickHandler (provided by ButtonManager) now expects the AI button instance
        // But BubbleButton doesn't know about it. The manager binds it.
        this.clickHandler(this.selectedText);
      }
      // Optional: Reset color after a delay? Or let the manager handle hiding.
    };

    // Keep default hover/out from SmartButton unless specific behavior is needed
    // this.onMouseOver = () => { ... };
    // this.onMouseOut = () => { ... };
  }

  // Override default color if needed
  // getDefaultColor() { return '#someOtherColor'; }
}
