// content/smartButton.js

export class SmartButton {
  constructor(buttonName) {
    if (this.constructor === SmartButton) {
      throw new Error("Abstract classes can't be instantiated.");
    }
    this.button = document.createElement("button");
    this.button.textContent = buttonName;
    this.setStyle(this._getDefaultStyle());

    // Default hover/out behavior (can be overridden by subclasses)
    this._mouseoverListener = () => this._onMouseOverDefault();
    this._mouseoutListener = () => this._onMouseOutDefault();
    this._setupDefaultEventListeners();
  }

  _getDefaultStyle() {
    return {
      backgroundColor: this.getDefaultColor(),
      border: 'none',
      color: 'white',
      padding: '5px 10px',
      textAlign: 'center',
      textDecoration: 'none',
      display: 'inline-block',
      fontSize: '12px',
      cursor: 'pointer',
      position: 'absolute', // Necessary for positioning
      transition: 'box-shadow 0.3s ease, background-color 0.3s ease', // Added transition for color
      boxSizing: 'border-box', // Include padding and border in element's total width and height
    };
  }

  // Default color, can be overridden
  getDefaultColor() {
    return '#007BFF';
  }


  // Default hover effect
  _onMouseOverDefault() {
    if (!this.button) return;
    this.button.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.8)';
    this.button.style.backgroundColor = '#58A6FF'; // Lighter green
  }

  // Default mouse out effect
  _onMouseOutDefault() {
    if (!this.button) return;
    this.button.style.boxShadow = 'none';
    this.button.style.backgroundColor = this.getDefaultColor();
  }

  setStyle(style) {
    if (!this.button) return;
    for (const [key, value] of Object.entries(style)) {
      this.button.style[key] = value;
    }
  }

  _setupDefaultEventListeners() {
    if (!this.button) return;
    this.button.addEventListener('mouseover', this._mouseoverListener);
    this.button.addEventListener('mouseout', this._mouseoutListener);
  }

  // Use setters to manage event listeners, allowing overrides
  set onClick(handler) {
    if (!this.button) return;
    // Remove previous listener if exists to avoid duplicates
    if (this._clickListener) {
      this.button.removeEventListener('click', this._clickListener);
    }
    this._clickListener = handler;
    if (handler) {
      this.button.addEventListener('click', this._clickListener);
    }
  }

  set onMouseOver(handler) {
    if (!this.button) return;
    if (this._mouseoverListener) {
      this.button.removeEventListener('mouseover', this._mouseoverListener);
    }
    this._mouseoverListener = handler;
    if (handler) {
      this.button.addEventListener('mouseover', this._mouseoverListener);
    }
  }

  set onMouseOut(handler) {
    if (!this.button) return;
    if (this._mouseoutListener) {
      this.button.removeEventListener('mouseout', this._mouseoutListener);
    }
    this._mouseoutListener = handler;
    if (handler) {
      this.button.addEventListener('mouseout', this._mouseoutListener);
    }
  }

  // Method to get the underlying DOM element
  getElement() {
    return this.button;
  }

  // Cleanup method
  remove() {
    if (this.button) {
      // Remove all listeners to prevent memory leaks
      this.button.removeEventListener('mouseover', this._mouseoverListener);
      this.button.removeEventListener('mouseout', this._mouseoutListener);
      if (this._clickListener) {
        this.button.removeEventListener('click', this._clickListener);
      }
      this.button.remove();
      this.button = null; // Help garbage collection
    }
    // Nullify listeners
    this._mouseoverListener = null;
    this._mouseoutListener = null;
    this._clickListener = null;
  }
}