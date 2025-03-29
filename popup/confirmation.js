// popup/confirmation.js

export class Confirmation {
  constructor() {
    this.confirmationElement = document.getElementById('globalConfirmation');

    if (!this.confirmationElement) {
      console.error("Confirmation element not found.");
      return;
    }
    this.confirmationElement.style.position = 'fixed';
    this.confirmationElement.style.top = '10px';
    this.confirmationElement.style.left = '50%';
    this.confirmationElement.style.transform = 'translateX(-50%)';
    this.confirmationElement.style.zIndex = '1000';
  }

  showConfirmation(message = "Changes saved!") {
    if (!this.confirmationElement) {
      console.error("Confirmation element not found.");
      return;
    }
    this.confirmationElement.textContent = message;
    this.confirmationElement.style.display = 'block';
    setTimeout(() => {
      this.confirmationElement.style.display = 'none';
    }, 3000); // Hide after 3 seconds
  }
}

export function setupConfirmation(){
  return new Confirmation();
}