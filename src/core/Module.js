/**
 * Module - Base class for all VanillaBuilder modules
 *
 * Provides lifecycle hooks, configuration management, and editor access.
 * Every module (Canvas, Components, Blocks, etc.) extends this class.
 *
 * Lifecycle:
 *   constructor → onInit() → onLoad() → render() → postRender()
 */

import EventEmitter from './EventEmitter.js';
import { deepMerge, isFunction } from './utils.js';

export default class Module extends EventEmitter {
  /**
   * @param {import('../editor/EditorModel.js').default} editor - EditorModel instance
   * @param {Object} [config={}] - User configuration
   * @param {Object} [defaults={}] - Default configuration
   */
  constructor(editor, config = {}, defaults = {}) {
    super();

    /** @type {import('../editor/EditorModel.js').default} */
    this._em = editor;

    /** @type {string} Module name */
    this._name = this.constructor.name || 'Module';

    /** @type {Object} Merged configuration */
    this._config = deepMerge(defaults, config);

    /** @type {HTMLElement|null} Module's rendered view element */
    this._view = null;

    /** @type {boolean} Whether module has been initialized */
    this._initialized = false;

    /** @type {Array<Function>} Debounced functions to cancel on destroy */
    this._debounced = [];
  }

  /**
   * Get the EditorModel instance
   * @returns {import('../editor/EditorModel.js').default}
   */
  get em() {
    return this._em;
  }

  /**
   * Get the Editor (public API) instance
   * @returns {import('../editor/Editor.js').default}
   */
  get editor() {
    return this._em?.Editor;
  }

  /**
   * Get module config
   * @returns {Object}
   */
  get config() {
    return this._config;
  }

  /**
   * Get module name
   * @returns {string}
   */
  get name() {
    return this._name;
  }

  /**
   * Get the module's view element
   * @returns {HTMLElement|null}
   */
  get view() {
    return this._view;
  }

  /**
   * Set the module's view element
   * @param {HTMLElement|null} el
   */
  set view(el) {
    this._view = el;
  }

  /**
   * Called after module construction
   * Override in subclasses for setup logic
   */
  onInit() {}

  /**
   * Called after all modules and plugins are loaded
   * Override in subclasses for post-load setup
   */
  onLoad() {}

  /**
   * Called after the editor view has rendered
   * @param {HTMLElement} view - The editor's root view element
   */
  postRender(view) {}

  /**
   * Render the module's UI and return its DOM element
   * @returns {HTMLElement|null}
   */
  render() {
    return this._view;
  }

  /**
   * Get config value by key, with optional fallback
   * @param {string} key
   * @param {any} [fallback]
   * @returns {any}
   */
  getConfig(key, fallback) {
    const val = this._config[key];
    return val !== undefined ? val : fallback;
  }

  /**
   * Get the style prefix for CSS classes
   * @returns {string}
   */
  get pfx() {
    return this._config.stylePrefix || this._em?.getConfig('stylePrefix') || 'vb-';
  }

  /**
   * Translate a key using the I18n module
   * @param {string} key
   * @param {Object} [opts]
   * @returns {string}
   */
  t(key, opts) {
    return this._em?.t(key, opts) || key;
  }

  /**
   * Register a debounced function for cleanup on destroy
   * @param {Function} fn
   * @returns {Function} The debounced function
   */
  _registerDebounced(fn) {
    this._debounced.push(fn);
    return fn;
  }

  /**
   * Clean up resources
   */
  destroy() {
    // Cancel all debounced functions
    for (const fn of this._debounced) {
      if (fn.cancel) fn.cancel();
    }
    this._debounced = [];

    // Remove view
    if (this._view && this._view.parentNode) {
      this._view.parentNode.removeChild(this._view);
    }
    this._view = null;

    // Cleanup events
    super.destroy();
  }
}
