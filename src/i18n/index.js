/**
 * I18nModule - Internationalization module
 *
 * Provides translation lookup via dot-notation keys, locale switching,
 * and the ability to add/override message bundles.
 */

import { Module } from '../core/index.js';
import en from './locale/en.js';

export default class I18nModule extends Module {
  /**
   * @param {import('../editor/EditorModel.js').default} editor
   * @param {Object} [config={}]
   */
  constructor(editor, config = {}) {
    super(editor, config, {
      stylePrefix: 'i18n-',
      /** @type {string} Active locale */
      locale: 'en',
      /** @type {boolean} Warn when key is missing */
      detectLocale: false,
      /** @type {Object} Locale message bundles */
      messages: {},
      /** @type {boolean} Log missing translations */
      debug: false,
    });

    /** @type {string} */
    this._locale = this.getConfig('locale') || 'en';

    /** @type {Object} Messages keyed by locale */
    this._messages = {
      en: { ...en },
      ...this.getConfig('messages'),
    };

    this.onInit();
  }

  /**
   * Set the active locale
   * @param {string} locale - Locale code (e.g., 'en', 'fr', 'de')
   * @returns {this}
   */
  setLocale(locale) {
    const prev = this._locale;
    this._locale = locale;
    this.trigger('locale:change', locale, prev);
    this._em?.trigger('locale:change', locale, prev);
    return this;
  }

  /**
   * Get the active locale
   * @returns {string}
   */
  getLocale() {
    return this._locale;
  }

  /**
   * Translate a key with optional interpolation
   * @param {string} key - Dot-notation key (e.g., 'panels.buttons.titles.preview')
   * @param {Object} [opts={}]
   * @param {Object} [opts.params] - Interpolation parameters
   * @param {string} [opts.locale] - Override locale for this call
   * @param {string} [opts.default] - Default value if key not found
   * @returns {string}
   */
  t(key, opts = {}) {
    const locale = opts.locale || this._locale;
    const messages = this._messages[locale] || this._messages.en || {};
    const value = this._resolve(messages, key);

    if (value === undefined) {
      if (this.getConfig('debug')) {
        console.warn(`I18n: Missing key "${key}" for locale "${locale}"`);
      }
      return opts.default !== undefined ? opts.default : key;
    }

    // String interpolation
    if (typeof value === 'string' && opts.params) {
      return value.replace(/\{(\w+)\}/g, (match, param) => {
        return opts.params[param] !== undefined ? opts.params[param] : match;
      });
    }

    return value;
  }

  /**
   * Add or merge messages for a locale
   * @param {Object} msgs - Messages object, keyed by locale
   * @returns {this}
   *
   * @example
   * i18n.addMessages({
   *   en: { panels: { custom: 'My Panel' } },
   *   fr: { panels: { custom: 'Mon Panneau' } },
   * });
   */
  addMessages(msgs) {
    for (const [locale, bundle] of Object.entries(msgs)) {
      if (!this._messages[locale]) {
        this._messages[locale] = {};
      }
      this._deepMerge(this._messages[locale], bundle);
    }
    return this;
  }

  /**
   * Get all messages for the current or specified locale
   * @param {string} [locale]
   * @returns {Object}
   */
  getMessages(locale) {
    return this._messages[locale || this._locale] || {};
  }

  /**
   * Resolve a dot-notation key in an object
   * @private
   * @param {Object} obj
   * @param {string} key
   * @returns {any}
   */
  _resolve(obj, key) {
    if (!key || !obj) return undefined;

    const parts = key.split('.');
    let current = obj;

    for (const part of parts) {
      if (current == null || typeof current !== 'object') return undefined;
      current = current[part];
    }

    return current;
  }

  /**
   * Deep merge source into target (mutates target)
   * @private
   * @param {Object} target
   * @param {Object} source
   * @returns {Object}
   */
  _deepMerge(target, source) {
    for (const [key, val] of Object.entries(source)) {
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        if (!target[key] || typeof target[key] !== 'object') {
          target[key] = {};
        }
        this._deepMerge(target[key], val);
      } else {
        target[key] = val;
      }
    }
    return target;
  }

  destroy() {
    this._messages = {};
    super.destroy();
  }
}
