import { marked } from 'marked';

let debounceTimeout = null;
let hideTimeout = null;

class SmartButton {
  constructor(buttonName, selectedText) {
    this.button = document.createElement("button");
    this.button.textContent = buttonName;
    this.selectedText = selectedText;
    this.setStyle(this.#getDefaultStyle());
    this.children = []; // Initialize children array
    this.onMouseOver = () => {
      this.button.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.8)';
      this.button.style.backgroundColor = '#2dfa35'; // Lighter green on hover
    };

    this.onMouseOut = () => {
      this.button.style.boxShadow = 'none';
      this.button.style.backgroundColor = this.getDefaultColor(); // Lighter green on hover
    };

  }

  #getDefaultStyle() {
    return {
      backgroundColor: this.getDefaultColor(), // Default color
      border: 'none',
      color: 'white',
      padding: '5px 10px',
      textAlign: 'center',
      textDecoration: 'none',
      display: 'inline-block',
      fontSize: '12px',
      cursor: 'pointer',
      zIndex: '1002',
      position: 'absolute',
      transition: 'box-shadow 0.3s ease'
    };
  }

  getDefaultColor(){
    return '#4CAF50'; // Default color
  }

  setStyle(style) {
    for (const [key, value] of Object.entries(style)) {
      this.button.style[key] = value;
    }
  }

  set onMouseOver(handler) {
    this.button.addEventListener('mouseover', handler);
  }

  set onMouseOut(handler) {
    this.button.addEventListener('mouseout', handler);
  }

  set onClick(handler) {
    this.button.addEventListener('click', handler);
  }


}

class BubbleButton extends SmartButton {
  constructor(buttonName, selectedText, clickHandler) {
    super(buttonName, selectedText);
    this.setStyle( {
      borderRadius: '5px',
      zIndex: '1004'
    });
    this.#setupEventListeners(clickHandler)
  }

  #setupEventListeners(clickHandler) {
    this.onClick = () => {
      event.stopPropagation(); // Prevent mouseup from bubbling up to the document
      this.button.style.backgroundColor = '#6a66bb';
      clickHandler(this.selectedText)
    }
  }
}


class AiButton extends SmartButton {
  static readonly
  constructor(positionX, positionY, selectedText) {
    super('AI');
    this.setStyle({
      width: '40px',
      height: '40px',
      fontSize: '14px',
      borderRadius: '50%',
      zIndex: '1003',
    });

    this.button.id = "ai-button";
    this.isShown = false;
    this.selectedText = selectedText;
    this.buttonContainer = this.#buildButtonContainer(positionX, positionY)
    this.buttonContainer.appendChild(this.button);
    this.#setupEventListeners();

  }

  #buildButtonContainer(positionX, positionY){
    var buttonContainer = document.createElement('div');
    buttonContainer.id = "ai-button-container";
    buttonContainer.style.position = 'absolute';
    buttonContainer.style.zIndex = '1002';
    buttonContainer.style.width = '200px';
    buttonContainer.style.height = '200px';
    buttonContainer.style.left = `${positionX - 100}px`;
    buttonContainer.style.top = `${positionY - 100}px`;
    buttonContainer.style.borderRadius = '50%'; // Make it circular
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'center';
    buttonContainer.style.alignItems = 'center';
    buttonContainer.style.backgroundColor = 'transparent';
    return buttonContainer;
  }

  #setupEventListeners() {
    this.onMouseOver = () => {
      if(!this.isShown) {
        this.show();
      }
    };

    this.onMouseOut = () => {
      this.hideWithTimeout();
    };


    this.buttonContainer.addEventListener('mouseover', () => {
      clearTimeout(hideTimeout);
    });
    this.buttonContainer.addEventListener('mouseout', () => {
      this.hideWithTimeout();
    });
    // Prevent mouseup event from triggering on the container
    this.buttonContainer.addEventListener('mouseup', (event) => {
      event.stopPropagation();
    });
  }

  createBubbleButtons() {
    const buttons = ['Summarize', 'Rephrase', 'Translate', 'Meaning'];
    const containerWidth = parseInt(this.buttonContainer.style.width, 10);
    const containerHeight = parseInt(this.buttonContainer.style.height, 10);
    const radius = Math.min(containerWidth, containerHeight) / 2;
    const angleIncrement = (2 * Math.PI) / buttons.length;
    const bubbleRadius = radius * 0.7;
    buttons.forEach((buttonName, index) => {
      const angle = index * angleIncrement;
      const bubbleX = bubbleRadius * Math.cos(angle);
      const bubbleY = bubbleRadius * Math.sin(angle); // Dynamically adjust based on text length

      let clickHandler;
      switch (buttonName) {
        case 'Summarize':
          clickHandler = handleSummarizeClick;
          break;
        case 'Meaning':
          clickHandler = handleMeaningClick;
          break;
        case 'Rephrase':
          clickHandler = handleRephraseClick;
          break;
        case 'Translate':
          clickHandler = handleTranslateClick;
          break;
      }
      const bubbleButton = new BubbleButton(buttonName, this.selectedText, clickHandler);
      bubbleButton.setStyle({
        zIndex: '1004',
        left: `${radius + bubbleX - (buttonName.length * 4)}px`,
        top: `${radius + bubbleY - 10}px`,
      });
      this.children.push(bubbleButton);
      this.buttonContainer.appendChild(bubbleButton.button);

    });
  }

  show() {
    if(this.children.length == 0) {
      this.createBubbleButtons();
    }
    document.body.appendChild(this.buttonContainer);
    this.isShown = true;
  }

  hideContainer() {
    if (this.buttonContainer) {
      this.buttonContainer.remove();
    }
  }

  hideWithTimeout() {
    clearTimeout(hideTimeout);
    hideTimeout = setTimeout(() => {
      this.hideContainer();
      this.isShown = false;
    }, 1500);
  }

  remove() {
    this.hideContainer();
    if (this.button) {
      this.button.remove();
    }
  }
}

let aiButtonComposite = null;

function sendRequestToBackground(action, text, callback, additionalParams = {}) {
  try {
    chrome.runtime.sendMessage(
      {   action: action, text: text, ...additionalParams },
      (response) => {
        if (response) {
          callback(response);
        } else {
          showPopup("No response received");
        }
        if(aiButtonComposite)
        aiButtonComposite.hideContainer();
      }
    );
  } catch (e) {
    aiButtonComposite.hideContainer();
  }
}

function handleSummarizeClick(selectedText) {
  sendRequestToBackground('summarize', selectedText, (response) =>  showPopup(response.responseText));
}

function handleMeaningClick(selectedText) {
  sendRequestToBackground('meaning', selectedText, (response) => showPopup(response.responseText));
}

function handleRephraseClick(selectedText) {
  sendRequestToBackground('rephrase', selectedText, (response) => showPopup(response.responseText));
}

function handleTranslateClick(selectedText) {
  sendRequestToBackground('translate', selectedText, (response) => showPopup(response.responseText), { targetLanguage: 'Russian' });
}


function showPopup(content) {
  const popup = document.createElement('div');
  popup.style.position = 'fixed';
  popup.style.left = '50%';
  popup.style.top = '50%';
  popup.style.transform = 'translate(-50%, -50%)';
  popup.style.background = '#222';
  popup.style.border = '1px solid black';
  popup.style.padding = '20px';
  popup.style.zIndex = '9999';
  popup.style.width = '300px';

  popup.style.color = 'white'; // Light gray text
  popup.style.fontFamily = 'Arial, sans-serif'; // Add font family
  popup.style.borderRadius = '5px'; // Add border

  const closeButton = document.createElement('button');
  closeButton.textContent = 'Close';
  closeButton.style.marginTop = '10px';
  // Style the close button
  closeButton.style.display = 'block';
  closeButton.style.float = 'right';
  closeButton.style.background = '#444'; // Darker gray
  closeButton.style.color = '#ddd'; // Light gray text
  closeButton.style.border = 'none';
  closeButton.style.fontSize = '16px';
  closeButton.style.borderRadius = '3px';
  closeButton.style.cursor = 'pointer';
  closeButton.style.textAlign = 'center';
  closeButton.style.width = '100%';
  closeButton.addEventListener('mouseover', () => {
    closeButton.style.backgroundColor = '#666';
  });

  closeButton.addEventListener('mouseout', () => {
    closeButton.style.backgroundColor = '#444';
  });
  closeButton.addEventListener('click', () => {
    closeButton.style.backgroundColor = 'red';
    if(aiButtonComposite) {
      aiButtonComposite.remove();
    }
    document.body.removeChild(popup);
  });

  const contentArea = document.createElement('div');
  contentArea.style.background = '#222'; // Dark gray

  contentArea.innerHTML = marked.parse(content);

  popup.appendChild(contentArea);
  popup.appendChild(document.createElement('br'));
  popup.appendChild(closeButton);

  document.body.appendChild(popup);
}
async function isCurrentDomainBlocked() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: 'isDomainBlocked' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error in isCurrentDomainBlocked:', chrome.runtime.lastError);
        resolve(false); // Resolve with false in case of error
      } else {
        resolve(response && response.isBlocked); // Resolve with true or false
      }
    });
  });
}

async function handleSelectionAndShowAiButton(event) {
  const isBlocked = await isCurrentDomainBlocked()
  if (isBlocked || typeof isBlocked == 'undefined') {
    return;
  }
  const selectedText = window.getSelection().toString().trim();
  const selection = window.getSelection();
  if (selection.rangeCount <= 0 || typeof event == 'undefined' || !selectedText) {
    return;
  }
  let x = event.clientX;
  let y = event.clientY;
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  const offset = 50;

  const xOffset = Math.max(0.1 * windowWidth, offset);
  const yOffset = Math.max(0.1 * windowHeight, offset);
  x = (x + xOffset >= windowWidth) ? x - offset : x + offset;
  y = (y + yOffset >= windowHeight) ? y - offset : y + offset;

  showAiButton(selectedText, x + window.pageXOffset, y + window.pageYOffset);

}
function showAiButton(selectedText, x, y) {
  if (selectedText) {
    aiButtonComposite = new AiButton(x, y, selectedText);
    document.body.appendChild(aiButtonComposite.buttonContainer);
  } else {
    if (aiButtonComposite) aiButtonComposite.remove();
  }
}

document.addEventListener('keyup', () => {
  if (debounceTimeout) {
    if(aiButtonComposite) {
      aiButtonComposite.remove();
    }
    clearTimeout(debounceTimeout);
  }
  debounceTimeout = setTimeout(() => {
    handleSelectionAndShowAiButton(event);
  }, 100);
});

document.addEventListener('mouseup', (event) => {
  // Clear any existing timeout
  if (debounceTimeout) {
    if(aiButtonComposite) {
      aiButtonComposite.remove();
    }
    clearTimeout(debounceTimeout);
  }

  // Set a new timeout to run showSummarizeButton after a delay
  debounceTimeout = setTimeout(() => {
    handleSelectionAndShowAiButton(event);
  }, 100); // Adjust the delay as needed (100ms in this case)
});
