const translations = {
  es: {
    switchLanguage: 'Cambiar idioma a inglés',
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
