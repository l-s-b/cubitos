const translations = {
  es: {
    switchLanguage: 'Cambiar idioma a inglés',
    home: 'Inicio',
    openMenu: 'Abrir menú',
    closeMenu: 'Cerrar menú',
    close: 'Cerrar',
    about: 'Acerca de',
    contactName: 'Lucio SB',
    contactWhatsApp: 'WhatsApp',
    contactEmail: 'Correo electrónico',
    tutorialMenu: 'Cómo jugar',
    musicMute: 'Silenciar música',
    musicUnmute: 'Activar música',
    menuPlay: 'Jugar',
    tutorialHowToPlay: 'Cómo jugar',
    tutorialIntroTitle: 'Cómo ganar',
    tutorialIntroCopy: 'Tomá un cubo por turno y formá una línea de tres.',
    tutorialShowHow: 'Mostrame cómo',
    tutorialStep1Title: 'Línea horizontal',
    tutorialStep2Title: 'Línea vertical',
    tutorialStep3Title: 'Línea diagonal',
    tutorialStep4Title: 'Línea transversal',
    tutorialStep3Copy: '? ? ?',
    tutorialStep4Copy: 'Aahhhh.',
    tutorialNext: 'Siguiente',
    tutorialISee: 'Ya veo',
    tutorialGotIt: 'Entendido',
    tutorialStraighten: 'Enderezar',
    tutorialLetsPlay: '¡A jugar!',
    menuChooseMode: 'Elegí un modo de juego',
    modeOnePlayer: '1 jugador',
    modeOnePlayerDescription: 'Vos contra dos rivales controlados por la IA',
    modeTwoPlayer: '2 jugadores',
    modeTwoPlayerDescription: 'Se alternan; gana quien completa una línea de un color',
    modeThreePlayer: '3 jugadores',
    modeThreePlayerDescription: 'Cada color es un jugador o equipo',
    menuChooseDifficulty: 'Elegí la dificultad',
    difficultyEasy: 'Fácil',
    difficultyMedium: 'Media',
    difficultyHard: 'Difícil',
    aiError: 'No se pudo calcular el turno de la IA. Reiniciá la partida.',
    menuBack: 'Volver',
    turnHuman: 'Tu turno · {color}',
    turnAI: 'Turno de la IA · {color}',
    turnThreePlayer: 'Turno de {color}',
    turnTwoPlayer: 'Jugador {player} · {color}',
    playerOne: 'Jugador 1',
    playerTwo: 'Jugador 2',
    playerWins: '¡Ganó {player}!',
    rotateUp: 'Rotar hacia arriba',
    rotateDown: 'Rotar hacia abajo',
    rotateLeft: 'Rotar hacia la izquierda',
    rotateRight: 'Rotar hacia la derecha',
    rotateClockwise: 'Girar en sentido horario',
    rotateCounterClockwise: 'Girar en sentido antihorario',
    colorRed: 'rojo',
    colorGreen: 'verde',
    colorBlue: 'azul',
    winnerTitle: '¡Ganó el {color}!',
    winnerMessage: '¡Partidazo! ¿Listos para otra ronda?',
    playAgain: 'Jugar de nuevo',
    drawTitle: '¡Empate!',
    drawMessage: 'Nadie formó una línea. ¿Otra partida?',
    drawReset: 'Reiniciar partida',
  },
  en: {
    switchLanguage: 'Switch language to Spanish',
    home: 'Home',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    close: 'Close',
    about: 'About',
    contactName: 'Lucio SB',
    contactWhatsApp: 'WhatsApp',
    contactEmail: 'Email',
    tutorialMenu: 'How to play',
    musicMute: 'Mute music',
    musicUnmute: 'Unmute music',
    menuPlay: 'Play',
    tutorialHowToPlay: 'How to play',
    tutorialIntroTitle: 'How to win',
    tutorialIntroCopy: 'Take a cube per turn and form a line of three.',
    tutorialShowHow: 'Show me how',
    tutorialStep1Title: 'Horizontal line',
    tutorialStep2Title: 'Vertical line',
    tutorialStep3Title: 'Diagonal line',
    tutorialStep4Title: 'Cross line',
    tutorialStep3Copy: '? ? ?',
    tutorialStep4Copy: 'Aahhhh.',
    tutorialNext: 'Next',
    tutorialISee: 'I see',
    tutorialGotIt: 'Got it',
    tutorialStraighten: 'Straighten',
    tutorialLetsPlay: 'Now let’s play!',
    menuChooseMode: 'Choose a game mode',
    modeOnePlayer: '1 player',
    modeOnePlayerDescription: 'You against two AI-controlled opponents',
    modeTwoPlayer: '2 players',
    modeTwoPlayerDescription: 'Take turns; complete any color line to win',
    modeThreePlayer: '3 players',
    modeThreePlayerDescription: 'Each color is a player or team',
    menuChooseDifficulty: 'Choose a difficulty',
    difficultyEasy: 'Easy',
    difficultyMedium: 'Medium',
    difficultyHard: 'Hard',
    aiError: 'The AI could not calculate its move. Reset the game to try again.',
    menuBack: 'Back',
    turnHuman: 'Your turn · {color}',
    turnAI: 'AI turn · {color}',
    turnThreePlayer: "{color}'s turn",
    turnTwoPlayer: 'Player {player} · {color}',
    playerOne: 'Player 1',
    playerTwo: 'Player 2',
    playerWins: '{player} wins!',
    rotateUp: 'Rotate up',
    rotateDown: 'Rotate down',
    rotateLeft: 'Rotate left',
    rotateRight: 'Rotate right',
    rotateClockwise: 'Rotate clockwise',
    rotateCounterClockwise: 'Rotate counterclockwise',
    colorRed: 'Red',
    colorGreen: 'Green',
    colorBlue: 'Blue',
    winnerTitle: '{color} wins!',
    winnerMessage: 'A brilliant match. Ready for another round?',
    playAgain: 'Play again',
    drawTitle: "It's a draw!",
    drawMessage: 'No one made a line. Play another round?',
    drawReset: 'Reset game',
  },
};

let currentLanguage = 'es';
const languageChangeListeners = new Set();

document.documentElement.lang = 'es-AR';

export function translate(key, values = {}) {
  return translations[currentLanguage][key].replace(
    /\{(\w+)\}/g,
    (_, name) => values[name] ?? `{${name}}`,
  );
}

export function getLanguage() {
  return currentLanguage;
}

export function onLanguageChange(listener) {
  languageChangeListeners.add(listener);
  return () => languageChangeListeners.delete(listener);
}

function setLanguage(language) {
  currentLanguage = language;
  document.documentElement.lang = language === 'es' ? 'es-AR' : 'en';
  languageChangeListeners.forEach(listener => listener());
}

export function createLanguageToggle() {
  const button = document.createElement('button');
  button.id = 'language-toggle';
  button.type = 'button';

  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.setAttribute('viewBox', '0 0 24 24');
  icon.setAttribute('aria-hidden', 'true');
  icon.setAttribute('focusable', 'false');
  icon.innerHTML = '<path d="M4 5h12M10 3v2c0 6-3 10-7 12M6 10c1.5 2.5 4 4.5 7 5.5M14 20l4-10 4 10M15.5 16h5"/>';
  const languageCode = document.createElement('span');
  languageCode.className = 'site-nav__language-code';
  button.append(icon, languageCode);

  const updateButton = () => {
    languageCode.textContent = currentLanguage === 'es' ? 'AR' : 'US';
    button.setAttribute('aria-label', translate('switchLanguage'));
    button.title = translate('switchLanguage');
  };

  button.addEventListener('click', () => {
    setLanguage(currentLanguage === 'es' ? 'en' : 'es');
  });
  onLanguageChange(updateButton);
  updateButton();
  return button;
}
