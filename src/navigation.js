import { languages, onLanguageChange, setLanguage, translate } from './language';
import './navigation.css';

const ICONS = {
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-6v-6h-4v6H4a1 1 0 0 1-1-1z"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  tutorial: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9a2.5 2.5 0 1 1 4.2 1.8c-1.2 1-1.8 1.4-1.8 3.2M12 17.5h.01"/>',
  hintOn: '<path d="M9 18h6M10 22h4M8.5 14.5a7 7 0 1 1 7 0c-.8.6-1.2 1.4-1.3 2.5h-4.4c-.1-1.1-.5-1.9-1.3-2.5z"/>',
  hintOff: '<path d="M9 18h6M10 22h4M8.5 14.5a7 7 0 1 1 7 0c-.8.6-1.2 1.4-1.3 2.5h-4.4c-.1-1.1-.5-1.9-1.3-2.5zM3 3l18 18"/>',
  soundOn: '<path d="M11 5 6 9H3v6h3l5 4zM15.5 8.5a5 5 0 0 1 0 7M18 5a9 9 0 0 1 0 14"/>',
  soundOff: '<path d="M11 5 6 9H3v6h3l5 4zM16 9l5 6M21 9l-5 6"/>',
  about: '<circle cx="12" cy="8" r="3.5"/><path d="M5 21v-2a7 7 0 0 1 14 0v2z"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
};

function createIcon(name) {
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.setAttribute('viewBox', '0 0 24 24');
  icon.setAttribute('aria-hidden', 'true');
  icon.setAttribute('focusable', 'false');
  icon.innerHTML = ICONS[name];
  return icon;
}

function createMenuItem(iconName, label, className = '') {
  const button = document.createElement('button');
  button.className = `site-nav__item ${className}`.trim();
  button.type = 'button';
  button.append(createIcon(iconName));
  const text = document.createElement('span');
  text.textContent = label;
  button.appendChild(text);
  return button;
}

export default function createNavigation(languageToggle) {
  const nav = document.createElement('nav');
  nav.className = 'site-nav';
  nav.setAttribute('aria-label', 'Main navigation');

  const home = document.createElement('a');
  home.className = 'site-nav__home';
  home.href = './';
  home.addEventListener('click', event => {
    event.preventDefault();
    window.dispatchEvent(new Event('cube-home'));
  });
  home.append(createIcon('home'));
  const homeLabel = document.createElement('span');
  homeLabel.textContent = translate('home');
  home.appendChild(homeLabel);

  const menuToggle = document.createElement('button');
  menuToggle.className = 'site-nav__toggle';
  menuToggle.type = 'button';
  menuToggle.appendChild(createIcon('menu'));

  const menu = document.createElement('div');
  menu.className = 'site-nav__menu';
  menu.hidden = true;

  const menuHome = document.createElement('a');
  menuHome.className = 'site-nav__item';
  menuHome.href = './';
  menuHome.addEventListener('click', event => {
    event.preventDefault();
    closeMenu();
    window.dispatchEvent(new Event('cube-home'));
  });
  menuHome.append(createIcon('home'));
  const menuHomeLabel = document.createElement('span');
  menuHome.appendChild(menuHomeLabel);

  const tutorial = createMenuItem('tutorial', '');
  tutorial.classList.add('site-nav__tutorial');
  const tutorialLabel = tutorial.querySelector('span');
  tutorial.addEventListener('click', () => {
    closeMenu();
    window.dispatchEvent(new Event('cube-tutorial-open'));
  });

  const moveSuggestion = createMenuItem('hintOn', '');
  let moveSuggestionEnabled = true;
  const updateMoveSuggestion = () => {
    const label = translate(
      moveSuggestionEnabled ? 'moveSuggestionOn' : 'moveSuggestionOff',
    );
    moveSuggestion.querySelector('svg').innerHTML = ICONS[
      moveSuggestionEnabled ? 'hintOn' : 'hintOff'
    ];
    moveSuggestion.querySelector('span').textContent = label;
    moveSuggestion.setAttribute('aria-label', label);
    moveSuggestion.setAttribute('aria-pressed', String(moveSuggestionEnabled));
    moveSuggestion.title = label;
    moveSuggestion.dataset.tooltip = label;
  };
  moveSuggestion.hidden = true;
  moveSuggestion.addEventListener('click', () => {
    window.dispatchEvent(new Event('cube-hint-toggle'));
  });
  window.addEventListener('cube-hint-availability', event => {
    moveSuggestion.hidden = !event.detail.available;
    moveSuggestionEnabled = event.detail.enabled;
    updateMoveSuggestion();
  });
  window.addEventListener('cube-hint-state', event => {
    moveSuggestionEnabled = event.detail.enabled;
    updateMoveSuggestion();
  });
  window.addEventListener('cube-home', () => {
    moveSuggestion.hidden = true;
    moveSuggestionEnabled = true;
    updateMoveSuggestion();
  });
  onLanguageChange(updateMoveSuggestion);
  updateMoveSuggestion();

  const music = new Audio(new URL('../music/arp3ggio.mp3', import.meta.url));
  music.loop = true;
  music.autoplay = true;
  music.volume = 0.35;
  const musicButton = document.createElement('button');
  musicButton.className = 'site-nav__item site-nav__music';
  musicButton.type = 'button';
  const musicIcon = createIcon('soundOff');
  const musicLabel = document.createElement('span');
  musicButton.append(musicIcon, musicLabel);

  function updateMusicButton() {
    const isMuted = music.muted || music.paused;
    musicIcon.innerHTML = ICONS[isMuted ? 'soundOff' : 'soundOn'];
    const label = translate(isMuted ? 'musicUnmute' : 'musicMute');
    musicLabel.textContent = label;
    musicButton.setAttribute('aria-label', label);
    musicButton.title = label;
    musicButton.dataset.tooltip = label;
  }

  function playMusic() {
    music.play().catch(error => {
      if (error.name !== 'NotAllowedError') {
        console.error('Could not play background music.', error);
      }
    });
  }

  const retryAutoplay = () => {
    if (!music.paused) {
      document.removeEventListener('pointerdown', retryAutoplay);
      document.removeEventListener('keydown', retryAutoplay);
      return;
    }
    playMusic();
  };
  document.addEventListener('pointerdown', retryAutoplay);
  document.addEventListener('keydown', retryAutoplay);
  music.addEventListener('play', updateMusicButton);
  music.addEventListener('pause', updateMusicButton);
  music.addEventListener('volumechange', updateMusicButton);
  musicButton.addEventListener('click', () => {
    if (music.paused) {
      music.muted = false;
      playMusic();
    } else {
      music.muted = !music.muted;
    }
  });
  updateMusicButton();
  playMusic();

  languageToggle.classList.add('site-nav__item', 'site-nav__language');
  languageToggle.removeAttribute('hidden');

  const aboutButton = createMenuItem('about', '');
  const aboutLabel = aboutButton.querySelector('span');
  const about = document.createElement('section');
  about.className = 'site-nav__about';
  about.hidden = true;
  about.setAttribute('role', 'dialog');
  about.setAttribute('aria-modal', 'true');
  about.setAttribute('aria-labelledby', 'site-nav-about-title');

  const aboutDialog = document.createElement('div');
  aboutDialog.className = 'site-nav__about-dialog';
  const aboutLogo = document.createElement('img');
  aboutLogo.className = 'site-nav__about-logo';
  aboutLogo.src = '/android-chrome-192x192.png';
  aboutLogo.alt = '';
  const aboutHeading = document.createElement('h1');
  aboutHeading.className = 'start-menu__brand';
  aboutHeading.id = 'site-nav-about-title';
  aboutHeading.textContent = 'Ta3Ti';
  const closeAbout = document.createElement('button');
  closeAbout.className = 'site-nav__about-close';
  closeAbout.type = 'button';
  closeAbout.setAttribute('aria-label', translate('close'));
  closeAbout.appendChild(createIcon('close'));
  closeAbout.addEventListener('click', () => {
    about.hidden = true;
    aboutButton.focus();
  });
  const name = document.createElement('p');
  name.className = 'site-nav__contact-name';
  name.textContent = `${translate('by')} ${translate('contactName')}`;
  const phone = document.createElement('p');
  const whatsapp = document.createElement('a');
  whatsapp.href = 'https://wa.me/5493425595020';
  whatsapp.target = '_blank';
  whatsapp.rel = 'noreferrer';
  const email = document.createElement('p');
  const mailto = document.createElement('a');
  mailto.href = 'mailto:luciosb100@gmail.com';

  const languageDialog = document.createElement('section');
  languageDialog.className = 'site-nav__language-dialog';
  languageDialog.hidden = true;
  languageDialog.setAttribute('role', 'dialog');
  languageDialog.setAttribute('aria-modal', 'true');
  languageDialog.setAttribute('aria-labelledby', 'site-nav-language-title');
  const languagePanel = document.createElement('div');
  languagePanel.className = 'site-nav__language-panel';
  const languageHeader = document.createElement('div');
  languageHeader.className = 'site-nav__language-header';
  const languageHeading = document.createElement('h2');
  languageHeading.className = 'site-nav__language-title';
  languageHeading.id = 'site-nav-language-title';
  const closeLanguages = document.createElement('button');
  closeLanguages.className = 'site-nav__language-close';
  closeLanguages.type = 'button';
  closeLanguages.appendChild(createIcon('close'));
  const languageList = document.createElement('div');
  languageList.className = 'site-nav__language-list';
  languageList.setAttribute('role', 'group');
  languageList.setAttribute('aria-labelledby', languageHeading.id);
  const languageButtons = languages.map(({ code, name, locale }) => {
    const option = document.createElement('button');
    option.className = 'site-nav__language-option';
    option.type = 'button';
    option.textContent = name;
    option.lang = locale;
    option.addEventListener('click', () => {
      setLanguage(code);
      closeLanguageDialog();
    });
    languageList.appendChild(option);
    return { code, locale, option };
  });
  languageHeader.append(languageHeading, closeLanguages);
  languagePanel.append(languageHeader, languageList);
  languageDialog.appendChild(languagePanel);

  let previousBodyOverflow = '';

  function closeLanguageDialog() {
    languageDialog.hidden = true;
    document.body.style.overflow = previousBodyOverflow;
    languageToggle.focus();
  }

  function updateLanguageDialog() {
    languageHeading.textContent = translate('chooseLanguage');
    closeLanguages.setAttribute('aria-label', translate('close'));
    closeLanguages.title = translate('close');
    const selectedLocale = document.documentElement.lang;
    languageButtons.forEach(({ locale, option }) => {
      option.setAttribute('aria-pressed', String(locale === selectedLocale));
    });
  }

  closeLanguages.addEventListener('click', closeLanguageDialog);
  languageDialog.addEventListener('click', event => {
    if (event.target === languageDialog) closeLanguageDialog();
  });
  window.addEventListener('cube-language-open', () => {
    closeMenu();
    updateLanguageDialog();
    previousBodyOverflow = document.body.style.overflow;
    languageDialog.hidden = false;
    document.body.style.overflow = 'hidden';
    closeLanguages.focus();
  });

  aboutDialog.append(aboutLogo, aboutHeading, closeAbout, name, phone, email);
  phone.append(document.createTextNode(`${translate('contactWhatsApp')}: `), whatsapp);
  email.append(document.createTextNode(`${translate('contactEmail')}: `), mailto);
  about.appendChild(aboutDialog);

  aboutButton.addEventListener('click', () => {
    closeMenu();
    about.hidden = false;
    closeAbout.focus();
  });
  about.addEventListener('click', event => {
    if (event.target === about) {
      about.hidden = true;
      aboutButton.focus();
    }
  });
  about.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      about.hidden = true;
      aboutButton.focus();
    }
  });

  menu.append(menuHome, musicButton, tutorial, moveSuggestion, languageToggle, aboutButton);
  nav.append(home, menuToggle, menu, about, languageDialog);
  document.body.appendChild(nav);

  function updateLabels() {
    homeLabel.textContent = translate('home');
    menuHomeLabel.textContent = translate('home');
    tutorialLabel.textContent = translate('tutorialMenu');
    updateMusicButton();
    aboutLabel.textContent = translate('about');
    name.textContent = `${translate('by')} ${translate('contactName')}`;
    whatsapp.textContent = '+5493425595020';
    mailto.textContent = 'luciosb100@gmail.com';
    updateLanguageDialog();
    home.setAttribute('aria-label', translate('home'));
    home.title = translate('home');
    home.dataset.tooltip = translate('home');
    menuHome.setAttribute('aria-label', translate('home'));
    menuHome.title = translate('home');
    tutorial.setAttribute('aria-label', translate('tutorialMenu'));
    tutorial.title = translate('tutorialMenu');
    tutorial.dataset.tooltip = translate('tutorialMenu');
    aboutButton.setAttribute('aria-label', translate('about'));
    aboutButton.title = translate('about');
    aboutButton.dataset.tooltip = translate('about');
    languageToggle.dataset.tooltip = languageToggle.getAttribute('aria-label');
    closeAbout.setAttribute('aria-label', translate('close'));
    menuToggle.setAttribute(
      'aria-label',
      translate(menu.hidden ? 'openMenu' : 'closeMenu'),
    );
    menuToggle.setAttribute('aria-expanded', String(!menu.hidden));
  }

  function closeMenu() {
    menu.hidden = true;
    updateLabels();
    menuToggle.focus();
  }

  menuToggle.addEventListener('click', () => {
    menu.hidden = !menu.hidden;
    updateLabels();
    if (!menu.hidden) menu.querySelector('a, button').focus();
  });
  document.addEventListener('click', event => {
    if (!menu.hidden && !nav.contains(event.target)) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      if (!languageDialog.hidden) {
        closeLanguageDialog();
      } else if (!about.hidden) {
        about.hidden = true;
        aboutButton.focus();
      } else if (!menu.hidden) {
        closeMenu();
      }
    }
  });
  onLanguageChange(updateLabels);
  updateLabels();
}
