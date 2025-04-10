// content/aiButton.js

import { SmartButton } from './smartButton.js';

let hideTimeout = null; // Module-level timeout for hiding

export class AiButton extends SmartButton {
  constructor(positionX, positionY) {
    // Use a distinct default color for the AI button
    super('AI'); // Call SmartButton constructor
    this.setStyle({
      width: '40px',
      height: '40px',
      fontSize: '14px',
      borderRadius: '50%',
      zIndex: '1003',
      position: 'relative',
      left: 'auto',
      top: 'auto',
      // Ensure transition includes background-color
      transition: 'box-shadow 0.3s ease, background-color 0.3s ease',
    });

    this.button.id = "ai-button";
    this.isShown = false;
    this.bubblesPositioned = false; // Track if bubbles have been positioned
    this.bubbleButtons = [];
    this.buttonContainer = this._buildButtonContainer(positionX, positionY);
    this.buttonContainer.appendChild(this.button);
    this._setupEventListeners();
  }

  _buildButtonContainer(positionX, positionY) {
    const container = document.createElement('div');
    container.id = "ai-button-container";
    const containerSize = 200;

    Object.assign(container.style, {
      position: 'absolute',
      zIndex: '1002',
      width: `${containerSize}px`,
      height: `${containerSize}px`,
      left: `${positionX - containerSize / 2}px`,
      top: `${positionY - containerSize / 2}px`,
      borderRadius: '50%',
      display: 'none', // Start hidden
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'transparent',
      // border: '1px dashed lime', // --- DEBUG ---
    });
    return container;
  }

  _setupEventListeners() {
    // --- AI Button Specific Hover/Out ---
    this.onMouseOver = () => {
      if (!this.button) return;
      clearTimeout(hideTimeout); // Stop hiding

      // Apply hover style using the default method from SmartButton
      super._onMouseOverDefault(); // This will change color and add shadow

      // Position and show bubbles ONLY on hover if not already done
      if (!this.bubblesPositioned) {
        this._positionBubbleButtons();
        this.bubblesPositioned = true; // Mark as positioned
      }
      // Ensure container is visible (it might already be if mouse moved quickly)
      if (!this.isShown) {
        this.show(); // Make sure container is displayed
      }
    };

    this.onMouseOut = () => {
      if (!this.button) return;
      // Revert to default style using the method from SmartButton
      super._onMouseOutDefault(); // This will reset color and shadow

      // Start the hide timer when moving off the AI button
      this.hideWithTimeout();
    };

    // --- Container Listeners (Keep Bubbles Visible) ---
    this.buttonContainer.addEventListener('mouseover', () => {
      clearTimeout(hideTimeout); // Don't hide if mouse enters the container area (over bubbles)
    });

    this.buttonContainer.addEventListener('mouseout', (event) => {
      // Start hide timer only if the mouse truly left the container and its children
      if (!this.buttonContainer || !this.buttonContainer.contains(event.relatedTarget)) {
        this.hideWithTimeout();
      }
    });

    // Prevent mouseup on the container from triggering document listener
    this.buttonContainer.addEventListener('mouseup', (event) => {
      event.stopPropagation();
    });
  }

  addBubbleButtons(buttons) {
    this.bubbleButtons = buttons;
    // Don't position them immediately, wait for hover
    this.bubblesPositioned = false;
  }

  _positionBubbleButtons() {
    if (!this.buttonContainer || this.bubbleButtons.length === 0) return;

    const containerSize = parseInt(this.buttonContainer.style.width, 10);
    const center = containerSize / 2;
    const orbitRadius = center * 0.7;
    const angleIncrement = (2 * Math.PI) / this.bubbleButtons.length;

    this.bubbleButtons.forEach((bubbleButton, index) => {
      const angle = index * angleIncrement - (Math.PI / 2);
      const buttonElement = bubbleButton.getElement();
      if (!buttonElement) return;

      // Add the bubble button's element to the container if not already there
      // This ensures they are added only when positioning is triggered (on hover)
      if (!this.buttonContainer.contains(buttonElement)) {
        this.buttonContainer.appendChild(buttonElement);
      }

      // Estimate size (important to do *after* adding to DOM if possible, but might need fallback)
      const buttonWidth = buttonElement.offsetWidth || (buttonElement.textContent.length * 7 + 10);
      const buttonHeight = buttonElement.offsetHeight || 22;

      const bubbleCenterX = center + orbitRadius * Math.cos(angle);
      const bubbleCenterY = center + orbitRadius * Math.sin(angle);
      const bubbleLeft = bubbleCenterX - buttonWidth / 2;
      const bubbleTop = bubbleCenterY - buttonHeight / 2;

      bubbleButton.setStyle({
        left: `${bubbleLeft}px`,
        top: `${bubbleTop}px`,
        // Ensure bubbles are initially visible when added (they are inside the container)
        // display: 'inline-block' // Already default from SmartButton
      });
    });
  }

  show() {
    // This method now primarily shows the container and the central AI button.
    // Bubbles are added/positioned later on hover via _positionBubbleButtons.
    if (!this.isShown && this.buttonContainer) {
      // Add container to body if it's not already there
      if (!this.buttonContainer.parentNode) {
        document.body.appendChild(this.buttonContainer);
      }
      this.buttonContainer.style.display = 'flex'; // Show container
      this.isShown = true;
      clearTimeout(hideTimeout); // Cancel any pending hide action
    }
  }

  hide() {
    if (this.isShown && this.buttonContainer) {
      this.buttonContainer.style.display = 'none'; // Hide the container (hides bubbles too)
      this.isShown = false;
      // Reset bubble positioned state so they reposition on next hover
      this.bubblesPositioned = false;
      // Optional: Could remove bubble elements here, but hiding container is usually enough
      // this.bubbleButtons.forEach(b => b.getElement()?.remove());
    }
  }

  hideWithTimeout() {
    clearTimeout(hideTimeout);
    hideTimeout = setTimeout(() => {
      this.hide();
    }, 1500); // Adjust timeout as needed
  }

  remove() {
    clearTimeout(hideTimeout);
    if (this.buttonContainer) {
      // Ensure bubbles are removed properly
      this.bubbleButtons.forEach(bubble => bubble.remove());
      this.bubbleButtons = [];

      if (this.buttonContainer.parentNode) {
        this.buttonContainer.remove();
      }
      this.buttonContainer = null;
    }
    super.remove(); // Clean up AI button itself
    this.isShown = false;
    this.bubblesPositioned = false;
  }
}