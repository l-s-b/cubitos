import { onLanguageChange, translate } from './language';
import './startMenu.css';

const MENU_TITLE_ID = 'start-menu-title';

export default function createStartMenu(onStartGame) {
  const overlay = document.createElement('div');
  overlay.className = 'start-menu';
  overlay.setAttribute('role', 'presentation');

  const dialog = document.createElement('section');
  dialog.className = 'start-menu__dialog';
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-labelledby', MENU_TITLE_ID);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  let currentScreen = 'welcome';
  let isStarting = false;

  const startGame = mode => {
    if (isStarting) return;
    isStarting = true;
    overlay.classList.add('start-menu--closing');
    overlay.addEventListener('animationend', event => {
      if (event.target !== overlay) return;
      overlay.remove();
      unsubscribeFromLanguageChanges();
      onStartGame(mode);
    });
  };

  const createButton = (label, onClick, isSecondary = false, descriptionKey = null) => {
    const button = document.createElement('button');
    button.className = isSecondary
      ? 'start-menu__button start-menu__button--secondary'
      : 'start-menu__button';
    button.type = 'button';
    const buttonLabel = document.createElement('span');
    buttonLabel.textContent = translate(label);
    button.appendChild(buttonLabel);
    if (descriptionKey) {
      const description = document.createElement('small');
      description.className = 'start-menu__description';
      description.textContent = translate(descriptionKey);
      button.appendChild(description);
    }
    button.addEventListener('click', onClick);
    return button;
  };

  const renderScreen = () => {
    dialog.replaceChildren();

    const brand = document.createElement('h1');
    brand.className = 'start-menu__brand';
    brand.id = MENU_TITLE_ID;
    brand.textContent = 'Ta3Ti';

    const heading = document.createElement('h2');
    heading.className = 'start-menu__title';
    const buttons = document.createElement('div');
    buttons.className = 'start-menu__options';

    if (currentScreen === 'welcome') {
      heading.hidden = true;
      buttons.appendChild(createButton('menuPlay', () => {
        currentScreen = 'mode';
        renderScreen();
      }));
    } else {
      heading.textContent = translate('menuChooseMode');
      buttons.append(
        createButton('modeTwoPlayer', () => startGame('two-player'), false, 'modeTwoPlayerDescription'),
        createButton('modeThreePlayer', () => startGame('three-player'), false, 'modeThreePlayerDescription'),
        createButton('menuBack', () => {
          currentScreen = 'welcome';
          renderScreen();
        }, true),
      );
    }

    dialog.append(brand, heading, buttons);
    buttons.querySelector('button')?.focus();
  };

  const unsubscribeFromLanguageChanges = onLanguageChange(renderScreen);
  renderScreen();
}
