import { describe, it, expect, vi, beforeEach } from 'vitest';
import I18nModule from '../../src/i18n/index.js';

describe('I18nModule', () => {
  let mockEditor;
  let i18n;

  beforeEach(() => {
    mockEditor = {
      getConfig: (k) => k ? undefined : {},
      getModule: () => null,
      on: () => {},
      trigger: () => {},
      t: (k) => k,
    };
    i18n = new I18nModule(mockEditor);
  });

  it('should have default locale as en', () => {
    expect(i18n.getLocale()).toBe('en');
  });

  it('should set and get locale', () => {
    i18n.setLocale('fr');
    expect(i18n.getLocale()).toBe('fr');
  });

  it('should translate a key using t()', () => {
    const value = i18n.t('assetManager.addButton');
    expect(value).toBe('Add image');
  });

  it('should handle dot notation lookup for nested keys', () => {
    const value = i18n.t('blockManager.labels.text');
    expect(value).toBe('Text');
  });

  it('should return the key when translation is not found', () => {
    const value = i18n.t('nonexistent.key.path');
    expect(value).toBe('nonexistent.key.path');
  });

  it('should return opts.default when key is not found and default is provided', () => {
    const value = i18n.t('missing.key', { default: 'Fallback' });
    expect(value).toBe('Fallback');
  });

  it('should merge new messages via addMessages', () => {
    i18n.addMessages({
      en: { custom: { greeting: 'Hello' } },
    });
    expect(i18n.t('custom.greeting')).toBe('Hello');
  });

  it('should addMessages for a new locale', () => {
    i18n.addMessages({
      fr: { modal: { close: 'Fermer' } },
    });
    i18n.setLocale('fr');
    expect(i18n.t('modal.close')).toBe('Fermer');
  });

  it('should return messages for locale via getMessages', () => {
    const msgs = i18n.getMessages('en');
    expect(msgs).toBeDefined();
    expect(msgs.assetManager).toBeDefined();
    expect(msgs.assetManager.addButton).toBe('Add image');
  });

  it('should return empty object for unknown locale via getMessages', () => {
    const msgs = i18n.getMessages('zz');
    expect(msgs).toEqual({});
  });

  it('should support string interpolation with params', () => {
    i18n.addMessages({
      en: { greeting: 'Hello {name}, welcome to {place}!' },
    });
    const value = i18n.t('greeting', { params: { name: 'Alice', place: 'VB' } });
    expect(value).toBe('Hello Alice, welcome to VB!');
  });

  it('should use override locale in t() opts', () => {
    i18n.addMessages({
      de: { modal: { close: 'Schliessen' } },
    });
    const value = i18n.t('modal.close', { locale: 'de' });
    expect(value).toBe('Schliessen');
  });

  it('should trigger locale:change event on setLocale', () => {
    const fn = vi.fn();
    i18n.on('locale:change', fn);
    i18n.setLocale('es');
    expect(fn).toHaveBeenCalledWith('es', 'en');
  });

  it('should deeply merge messages without overwriting sibling keys', () => {
    const originalValue = i18n.t('assetManager.modalTitle');
    i18n.addMessages({
      en: { assetManager: { customKey: 'Custom' } },
    });
    expect(i18n.t('assetManager.modalTitle')).toBe(originalValue);
    expect(i18n.t('assetManager.customKey')).toBe('Custom');
  });
});
