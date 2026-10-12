import { onLanguageChange, translate } from './language';
import './navigation.css';

const ICONS = {
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-6v-6h-4v6H4a1 1 0 0 1-1-1z"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  tutorial: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9a2.5 2.5 0 1 1 4.2 1.8c-1.2 1-1.8 1.4-1.8 3.2M12 17.5h.01"/>',
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
  const aboutHeading = document.createElement('h2');
  aboutHeading.id = 'site-nav-about-title';
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
  name.textContent = translate('contactName');
  const phone = document.createElement('p');
  const whatsapp = document.createElement('a');
  whatsapp.href = 'https://wa.me/5493425595020';
  whatsapp.target = '_blank';
  whatsapp.rel = 'noreferrer';
  const email = document.createElement('p');
  const mailto = document.createElement('a');
  mailto.href = 'mailto:luciosb100@gmail.com';
  aboutDialog.append(aboutHeading, closeAbout, name, phone, email);
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

  menu.append(menuHome, tutorial, languageToggle, aboutButton);
  nav.append(home, menuToggle, menu, about);
  document.body.appendChild(nav);

  function updateLabels() {
    homeLabel.textContent = translate('home');
    menuHomeLabel.textContent = translate('home');
    tutorialLabel.textContent = translate('tutorialMenu');
    aboutLabel.textContent = translate('about');
    aboutHeading.textContent = translate('about');
    whatsapp.textContent = '+5493425595020';
    mailto.textContent = 'luciosb100@gmail.com';
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
      if (!about.hidden) {
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
