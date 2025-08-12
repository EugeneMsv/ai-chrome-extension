// SmartButton Base Component - UI Layer
// Base class for all buttons with common functionality

export abstract class SmartButton {
  protected button: HTMLButtonElement | null;
  private _mouseoverListener: (() => void) | null = null;
  private _mouseoutListener: (() => void) | null = null;
  private _clickListener: ((event: Event) => void) | null = null;

  constructor(buttonName: string) {
    if (this.constructor === SmartButton) {
      throw new Error("Abstract classes can't be instantiated.");
    }

    this.button = document.createElement('button');
    this.button.textContent = buttonName;
    this.setStyle(this._getDefaultStyle());

    // Default hover/out behavior (can be overridden by subclasses)
    this._mouseoverListener = () => this._onMouseOverDefault();
    this._mouseoutListener = () => this._onMouseOutDefault();
    this._setupDefaultEventListeners();
  }

  private _getDefaultStyle(): Record<string, string> {
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
  protected getDefaultColor(): string {
    return '#4CAF50';
  }

  // Default hover effect
  protected _onMouseOverDefault(): void {
    if (!this.button) return;
    this.button.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.8)';
    this.button.style.backgroundColor = '#2dfa35'; // Lighter green
  }

  // Default mouse out effect
  protected _onMouseOutDefault(): void {
    if (!this.button) return;
    this.button.style.boxShadow = 'none';
    this.button.style.backgroundColor = this.getDefaultColor();
  }

  public setStyle(style: Record<string, string>): void {
    if (!this.button) return;
    for (const [key, value] of Object.entries(style)) {
      (this.button.style as any)[key] = value;
    }
  }

  private _setupDefaultEventListeners(): void {
    if (!this.button) return;
    this.button.addEventListener('mouseover', this._mouseoverListener!);
    this.button.addEventListener('mouseout', this._mouseoutListener!);
  }

  // Use setters to manage event listeners, allowing overrides
  public set onClick(handler: ((event: Event) => void) | null) {
    if (!this.button) return;
    // Remove previous listener if exists to avoid duplicates
    if (this._clickListener) {
      this.button.removeEventListener('click', this._clickListener);
    }
    this._clickListener = handler;
    if (handler) {
      this.button.addEventListener('click', handler);
    }
  }

  public set onMouseOver(handler: (() => void) | null) {
    if (!this.button) return;
    if (this._mouseoverListener) {
      this.button.removeEventListener('mouseover', this._mouseoverListener);
    }
    this._mouseoverListener = handler;
    if (handler) {
      this.button.addEventListener('mouseover', handler);
    }
  }

  public set onMouseOut(handler: (() => void) | null) {
    if (!this.button) return;
    if (this._mouseoutListener) {
      this.button.removeEventListener('mouseout', this._mouseoutListener);
    }
    this._mouseoutListener = handler;
    if (handler) {
      this.button.addEventListener('mouseout', handler);
    }
  }

  // Method to get the underlying DOM element
  public getElement(): HTMLButtonElement | null {
    return this.button;
  }

  // Cleanup method
  public remove(): void {
    if (this.button) {
      // Remove all listeners to prevent memory leaks
      if (this._mouseoverListener) {
        this.button.removeEventListener('mouseover', this._mouseoverListener);
      }
      if (this._mouseoutListener) {
        this.button.removeEventListener('mouseout', this._mouseoutListener);
      }
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
