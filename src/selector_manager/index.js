/**
 * SelectorManager - Module for managing CSS selectors
 *
 * Maintains a registry of all selectors used in the project.
 * Handles selector creation, lookup, and state management.
 */

import { ItemManagerModule, isString } from '../core/index.js';
import Selector, { SELECTOR_TYPE } from './model/Selector.js';

export default class SelectorManager extends ItemManagerModule {
  /**
   * @param {import('../editor/EditorModel.js').default} editor
   * @param {Object} [config={}]
   */
  constructor(editor, config = {}) {
    super(editor, config, {
      stylePrefix: 'clm-',
      // Escape regex for selector name sanitization
      escapeName: '',
    });

    this.storageKey = 'selectors';

    /** @type {string} Current component state (e.g. ':hover', ':active') */
    this._state = '';

    this.events = {
      add: 'selector:add',
      remove: 'selector:remove',
      update: 'selector:update',
      reset: 'selector:reset',
    };

    this.onInit();
  }

  /** @type {typeof Selector} */
  get Model() {
    return Selector;
  }

  /**
   * Add a new selector or retrieve an existing one
   * @param {string|Object} selector - Selector name or config object
   * @param {Object} [opts={}]
   * @param {number} [opts.type] - Selector type (1=class, 2=id, 3=tag)
   * @param {string} [opts.label] - Human-readable label
   * @returns {Selector}
   */
  add(selector, opts = {}) {
    if (isString(selector)) {
      // Check if selector already exists
      const existing = this.get(selector);
      if (existing) return existing;

      // Determine type from prefix
      let name = selector;
      let type = opts.type || SELECTOR_TYPE.CLASS;

      if (selector.startsWith('#')) {
        name = selector.slice(1);
        type = SELECTOR_TYPE.ID;
      } else if (selector.startsWith('.')) {
        name = selector.slice(1);
        type = SELECTOR_TYPE.CLASS;
      } else if (!selector.startsWith('.') && !selector.startsWith('#') && opts.type === undefined) {
        // Could be a tag name if it looks like one
        if (/^[a-z][a-z0-9]*$/i.test(selector) && !selector.includes('-')) {
          // Heuristic: simple single-word selectors without hyphens might be tags
          // but by default treat as class
          type = SELECTOR_TYPE.CLASS;
        }
      }

      return super.add({
        name: this._sanitizeName(name),
        type,
        label: opts.label || name,
        ...opts,
      });
    }

    // Object form
    if (selector && selector.name) {
      const existing = this.get(selector.name);
      if (existing) return existing;
      selector.name = this._sanitizeName(selector.name);
    }

    return super.add(selector, opts);
  }

  /**
   * Get a selector by name
   * @param {string} name - Selector name (with or without prefix)
   * @returns {Selector|undefined}
   */
  get(name) {
    if (!name) return undefined;

    // Strip prefix for lookup
    let cleanName = name;
    if (name.startsWith('.') || name.startsWith('#')) {
      cleanName = name.slice(1);
    }

    return super.get(cleanName);
  }

  /**
   * Set the current editing state
   * @param {string} state - State string (e.g. ':hover', ':active', '')
   * @returns {this}
   */
  setState(state) {
    this._state = state || '';
    this.trigger('selector:state', this._state);
    this._em?.trigger('selector:state', this._state);
    return this;
  }

  /**
   * Get the current editing state
   * @returns {string}
   */
  getState() {
    return this._state;
  }

  /**
   * Sanitize a selector name (remove invalid characters)
   * @private
   * @param {string} name
   * @returns {string}
   */
  _sanitizeName(name) {
    if (!name) return name;
    // Remove leading/trailing whitespace, replace spaces with hyphens
    return name.trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9\-_]/g, '');
  }

  /**
   * Get selectors by type
   * @param {number} type - SELECTOR_TYPE value
   * @returns {Selector[]}
   */
  getByType(type) {
    return this.getAll().filter(sel => sel.get('type') === type);
  }

  /**
   * Get all class selectors
   * @returns {Selector[]}
   */
  getClasses() {
    return this.getByType(SELECTOR_TYPE.CLASS);
  }

  /**
   * Destroy the module
   */
  destroy() {
    this._state = '';
    super.destroy();
  }
}
