import { AI_DIFFICULTIES, GAME_MODES } from './gameMode';
import { onLanguageChange, translate } from './language';
import {
  beginTutorial,
  endTutorial,
  showTutorialStep,
  straightenTutorialV,
} from './three/helpers/tutorial';
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
  let selectedMode;
  let isStarting = false;
  let tutorialStep = 0;
  let tutorialStarted = false;
  let isTutorialVShown = false;
  let tutorialAnimationActive = false;

  const animateTutorial = (animation, stepIndex = null) => {
    if (stepIndex !== null) {
      overlay.style.setProperty('--tutorial-step-color', [
        '#ef5350',
        '#66bb6a',
        '#42a5f5',
        '#ef5350',
      ][stepIndex]);
    }
    tutorialAnimationActive = true;
    renderScreen();
    animation().then(() => {
      tutorialAnimationActive = false;
      renderScreen();
    }).catch(error => {
      tutorialAnimationActive = false;
      console.error(error);
      renderScreen();
    });
  };

  const startGame = difficulty => {
    if (isStarting) return;
    isStarting = true;
    overlay.classList.add('start-menu--closing');
    overlay.addEventListener('animationend', event => {
      if (event.target !== overlay) return;
      overlay.remove();
      unsubscribeFromLanguageChanges();
      if (currentScreen === 'tutorial') endTutorial();
      onStartGame({ mode: selectedMode, difficulty });
    });
  };

  const createButton = (
    label,
    onClick,
    isSecondary = false,
    descriptionKey = null,
    isCompact = false,
  ) => {
    const button = document.createElement('button');
    button.className = isSecondary
      ? 'start-menu__button start-menu__button--secondary'
      : 'start-menu__button';
    if (isCompact) button.classList.add('start-menu__button--compact');
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

  const fadeOutTutorialActions = () => new Promise(resolve => {
    const actions = dialog.querySelector('.start-menu__tutorial-actions');
    if (!actions) {
      resolve();
      return;
    }

    actions.classList.remove('start-menu__tutorial-actions--ready');
    actions.classList.add('start-menu__tutorial-actions--fading-out');
    window.setTimeout(resolve, 240);
  });

  const renderTutorialScreen = () => {
    dialog.replaceChildren();
    const heading = document.createElement('h2');
    heading.className = 'start-menu__title';
    heading.id = MENU_TITLE_ID;
    heading.textContent = translate(
      tutorialStarted ? `tutorialStep${tutorialStep + 1}Title` : 'tutorialIntroTitle',
    );

    let description = null;
    if (!tutorialStarted) {
      description = document.createElement('p');
      description.className = 'start-menu__tutorial-copy';
      description.textContent = translate('tutorialIntroCopy');
    } else if (
      tutorialStep === 3
      && (!isTutorialVShown || !tutorialAnimationActive)
    ) {
      description = document.createElement('p');
      description.className = 'start-menu__tutorial-copy';
      description.textContent = translate(
        isTutorialVShown ? 'tutorialStep4Copy' : 'tutorialStep3Copy',
      );
    }

    const buttons = document.createElement('div');
    buttons.className = 'start-menu__options start-menu__tutorial-actions';
    buttons.classList.add(
      tutorialAnimationActive
        ? 'start-menu__tutorial-actions--pending'
        : 'start-menu__tutorial-actions--ready',
    );
    if (!tutorialStarted) {
      const button = createButton('tutorialShowHow', () => {
        button.disabled = true;
        fadeOutTutorialActions().then(() => {
          tutorialStarted = true;
          animateTutorial(() => showTutorialStep(0), 0);
        });
      });
      buttons.appendChild(button);
    } else if (tutorialStep === 3 && !isTutorialVShown) {
      const button = createButton('tutorialStraighten', () => {
        button.disabled = true;
        fadeOutTutorialActions().then(() => {
          isTutorialVShown = true;
          animateTutorial(straightenTutorialV, 3);
        });
      });
      button.disabled = tutorialAnimationActive;
      buttons.appendChild(button);
    } else if (tutorialStep === 3) {
      buttons.appendChild(createButton('tutorialLetsPlay', () => {
        const button = buttons.querySelector('button');
        button.disabled = true;
        fadeOutTutorialActions().then(() => {
          endTutorial();
          overlay.classList.remove('start-menu--tutorial');
          overlay.style.removeProperty('--tutorial-step-color');
          const languageToggle = document.getElementById('language-toggle');
          if (languageToggle) languageToggle.hidden = false;
          currentScreen = 'welcome';
          renderScreen();
        });
      }));
    } else {
      const nextButtonLabel = [
        'tutorialNext',
        'tutorialISee',
        'tutorialGotIt',
      ][tutorialStep];
      const button = createButton(nextButtonLabel, () => {
        button.disabled = true;
        fadeOutTutorialActions().then(() => {
          tutorialStep += 1;
          isTutorialVShown = false;
          animateTutorial(() => showTutorialStep(tutorialStep), tutorialStep);
        });
      });
      button.disabled = tutorialAnimationActive;
      buttons.appendChild(button);
    }
    if (tutorialStep === 3 && isTutorialVShown) {
      buttons.querySelector('button').disabled = tutorialAnimationActive;
    }

    dialog.appendChild(heading);
    if (description) dialog.appendChild(description);
    dialog.appendChild(buttons);
    buttons.querySelector('button')?.focus();
  };

  const renderScreen = () => {
    dialog.replaceChildren();

    if (currentScreen === 'tutorial') {
      renderTutorialScreen();
      return;
    }

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
      buttons.appendChild(createButton('tutorialHowToPlay', () => {
        currentScreen = 'tutorial';
        tutorialStep = 0;
        tutorialStarted = false;
        isTutorialVShown = false;
        overlay.classList.add('start-menu--tutorial');
        const languageToggle = document.getElementById('language-toggle');
        if (languageToggle) languageToggle.hidden = true;
        beginTutorial();
        renderScreen();
      }, true, null, true));
    } else if (currentScreen === 'mode') {
      heading.textContent = translate('menuChooseMode');
      buttons.append(
        createButton('modeOnePlayer', () => {
          selectedMode = GAME_MODES.ONE_PLAYER;
          currentScreen = 'difficulty';
          renderScreen();
        }, false, 'modeOnePlayerDescription'),
        createButton('modeTwoPlayer', () => {
          selectedMode = GAME_MODES.TWO_PLAYER;
          startGame(AI_DIFFICULTIES.EASY);
        }, false, 'modeTwoPlayerDescription'),
        createButton('modeThreePlayer', () => {
          selectedMode = GAME_MODES.THREE_PLAYER;
          startGame(AI_DIFFICULTIES.EASY);
        }, false, 'modeThreePlayerDescription'),
        createButton('menuBack', () => {
          currentScreen = 'welcome';
          renderScreen();
        }, true),
      );
    } else {
      heading.textContent = translate('menuChooseDifficulty');
      buttons.append(
        createButton('difficultyEasy', () => startGame(AI_DIFFICULTIES.EASY)),
        createButton('difficultyMedium', () => startGame(AI_DIFFICULTIES.MEDIUM)),
        createButton('difficultyHard', () => startGame(AI_DIFFICULTIES.HARD)),
        createButton('menuBack', () => {
          currentScreen = 'mode';
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
