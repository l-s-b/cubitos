import assert from 'node:assert/strict';
import test from 'node:test';

globalThis.document = { documentElement: {} };
const { getLanguage, languages, setLanguage, translate } = await import('../src/language.js');

test('offers all requested languages by their native names', () => {
  assert.deepEqual(
    languages.map(({ name }) => name),
    ['Español', 'English', 'Français', 'Deutsch', 'Português', 'العربية', '简体中文', '日本語', '한국어', 'Русский'],
  );
});

test('changes the document language and direction for Arabic', () => {
  setLanguage('ar');
  assert.equal(getLanguage(), 'ar');
  assert.equal(document.documentElement.lang, 'ar');
  assert.equal(document.documentElement.dir, 'rtl');

  setLanguage('es');
  assert.equal(document.documentElement.lang, 'es-AR');
  assert.equal(document.documentElement.dir, 'ltr');
});

test('provides localized language-picker text and interpolated messages', () => {
  for (const { code } of languages) {
    setLanguage(code);
    assert.ok(translate('chooseLanguage'));
    assert.ok(translate('winnerTitle', { color: 'X' }).includes('X'));
  }
  setLanguage('es');
});
