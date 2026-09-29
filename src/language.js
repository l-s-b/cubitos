const TRANSLATIONS = {
  es: {
    switchLanguage: 'Cambiar idioma a inglés',
    menuPlay: 'Jugar',
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
    difficultySuperHard: 'Súper difícil',
    difficultySuperHardDescription: 'Rojo, Verde y Azul juegan por su cuenta y bloquean a sus rivales',
    aiError: 'No se pudo calcular el turno de la IA. Reiniciá la partida.',
    menuBack: 'Volver',
    turnThreePlayer: 'Turno de {color}',
    turnTwoPlayer: 'Jugador {player} · {color}',
    turnHuman: 'Tu turno · {color}',
    turnAI: 'Turno de la IA · {color}',
    playerOne: 'Jugador 1',
    playerTwo: 'Jugador 2',
    playerWins: '¡Ganó {player}!',
    drawTitle: '¡Empate!',
    drawMessage: 'Nadie formó una línea. ¿Otra partida?',
    drawReset: 'Reiniciar partida',
    reset: 'REINICIAR',
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
  },
  en: {
    switchLanguage: 'Switch language to Spanish',
    menuPlay: 'Play',
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
    difficultySuperHard: 'Super-hard',
    difficultySuperHardDescription: 'Red, Green, and Blue play independently and block their rivals',
    aiError: 'The AI could not calculate its move. Reset the game to try again.',
    menuBack: 'Back',
    turnThreePlayer: "{color}'s turn",
    turnTwoPlayer: 'Player {player} · {color}',
    turnHuman: 'Your turn · {color}',
    turnAI: 'AI turn · {color}',
    playerOne: 'Player 1',
    playerTwo: 'Player 2',
    playerWins: '{player} wins!',
    drawTitle: "It's a draw!",
    drawMessage: 'No one made a line. Play another round?',
    drawReset: 'Reset game',
    reset: 'RESET',
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
  },
};

let currentLanguage = 'es';
const languageChangeListeners = new Set();

document.documentElement.lang = 'es-AR';

export function translate(key, values = {}) {
  return TRANSLATIONS[currentLanguage][key].replace(
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

  const updateButton = () => {
    button.textContent = currentLanguage === 'es' ? '🇦🇷' : '🇺🇸';
    button.setAttribute('aria-label', translate('switchLanguage'));
    button.title = translate('switchLanguage');
  };

  button.addEventListener('click', () => {
    setLanguage(currentLanguage === 'es' ? 'en' : 'es');
  });
  onLanguageChange(updateButton);
  updateButton();
  document.body.appendChild(button);
}
