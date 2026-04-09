/**
 * KeymapModule - Module for managing keyboard shortcuts
 *
 * Parses key combinations like 'ctrl+z', 'cmd+shift+s' and binds
 * them to handler functions. Provides default keymaps for common
 * editor operations.
 */

import { Module } from '../core/index.js';

export default class KeymapModule extends Module {
  /**
   * @param {import('../editor/EditorModel.js').default} editor
   * @param {Object} [config={}]
   */
  constructor(editor, config = {}) {
    super(editor, config, {
      stylePrefix: 'km-',
    });

    /** @type {Map<string, Object>} Registered keymaps */
    this._keymaps = new Map();

    /** @type {boolean} Whether keymap listening is active */
    this._active = true;

    // Bind the global keydown handler
    this._onKeyDown = this._handleKeyDown.bind(this);
    document.addEventListener('keydown', this._onKeyDown);

    // Register default keymaps
    this._registerDefaults();

    this.onInit();
  }

  /**
   * Register default keymaps
   * @private
   */
  _registerDefaults() {
    const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);
    const mod = isMac ? 'cmd' : 'ctrl';

    this.add('core:undo', `${mod}+z`, () => {
      this._em?.UndoManager?.undo?.();
    });

    this.add('core:redo', `${mod}+shift+z`, () => {
      this._em?.UndoManager?.redo?.();
    });

    this.add('core:copy', `${mod}+c`, () => {
      this._em?.trigger('run:core:copy');
    });

    this.add('core:paste', `${mod}+v`, () => {
      this._em?.trigger('run:core:paste');
    });

    this.add('core:delete', 'backspace', () => {
      this._em?.trigger('run:core:component-delete');
    });

    this.add('core:delete-alt', 'delete', () => {
      this._em?.trigger('run:core:component-delete');
    });

    this.add('core:escape', 'escape', () => {
      this._em?.trigger('run:core:component-deselect');
    });
  }

  /**
   * Add a keymap
   * @param {string} id - Unique keymap identifier
   * @param {string} keys - Key combination string (e.g., 'ctrl+z', 'cmd+shift+s')
   * @param {Function} handler - Handler function
   * @param {Object} [opts={}]
   * @param {boolean} [opts.prevent=true] - Prevent default browser behavior
   * @returns {Object} The created keymap entry
   */
  add(id, keys, handler, opts = {}) {
    const parsed = this._parseKeys(keys);

    const keymap = {
      id,
      keys,
      parsed,
      handler,
      prevent: opts.prevent !== false,
    };

    this._keymaps.set(id, keymap);
    this.trigger('keymap:add', keymap);
    return keymap;
  }

  /**
   * Get a keymap by ID
   * @param {string} id
   * @returns {Object|undefined}
   */
  get(id) {
    return this._keymaps.get(id);
  }

  /**
   * Get all keymaps
   * @returns {Object[]}
   */
  getAll() {
    return [...this._keymaps.values()];
  }

  /**
   * Remove a keymap by ID
   * @param {string} id
   * @returns {Object|undefined}
   */
  remove(id) {
    const keymap = this._keymaps.get(id);
    if (keymap) {
      this._keymaps.delete(id);
      this.trigger('keymap:remove', keymap);
    }
    return keymap;
  }

  /**
   * Remove all keymaps
   * @returns {this}
   */
  removeAll() {
    this._keymaps.clear();
    this.trigger('keymap:removeAll');
    return this;
  }

  /**
   * Enable keymap processing
   * @returns {this}
   */
  enable() {
    this._active = true;
    return this;
  }

  /**
   * Disable keymap processing
   * @returns {this}
   */
  disable() {
    this._active = false;
    return this;
  }

  /**
   * Handle keydown events
   * @private
   * @param {KeyboardEvent} e
   */
  _handleKeyDown(e) {
    if (!this._active) return;

    // Skip when typing in an input/textarea/contentEditable
    const tag = e.target?.tagName;
    const isEditable = e.target?.contentEditable === 'true';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || isEditable) {
      // Allow certain keymaps like escape even in editable contexts
      const key = e.key?.toLowerCase();
      if (key !== 'escape') return;
    }

    for (const [, keymap] of this._keymaps) {
      if (this._matchEvent(e, keymap.parsed)) {
        if (keymap.prevent) {
          e.preventDefault();
          e.stopPropagation();
        }
        keymap.handler(e);
        this.trigger('keymap:emit', keymap, e);
        return;
      }
    }
  }

  /**
   * Parse a key combination string into a structured descriptor
   * @private
   * @param {string} keys - e.g., 'ctrl+shift+z'
   * @returns {Object}
   */
  _parseKeys(keys) {
    const parts = keys.toLowerCase().split('+').map(k => k.trim());

    const result = {
      ctrl: false,
      shift: false,
      alt: false,
      meta: false,
      key: '',
    };

    for (const part of parts) {
      switch (part) {
        case 'ctrl':
        case 'control':
          result.ctrl = true;
          break;
        case 'cmd':
        case 'meta':
        case 'command':
          result.meta = true;
          break;
        case 'shift':
          result.shift = true;
          break;
        case 'alt':
        case 'option':
          result.alt = true;
          break;
        default:
          result.key = part;
      }
    }

    return result;
  }

  /**
   * Check if a keyboard event matches a parsed key descriptor
   * @private
   * @param {KeyboardEvent} e
   * @param {Object} parsed
   * @returns {boolean}
   */
  _matchEvent(e, parsed) {
    const key = e.key?.toLowerCase();
    const code = e.code?.toLowerCase();

    // Normalize key names
    let eventKey = key;
    if (key === ' ') eventKey = 'space';
    if (key === 'meta') return false; // Modifier alone
    if (key === 'control') return false;
    if (key === 'shift') return false;
    if (key === 'alt') return false;

    // Match modifiers
    if (parsed.ctrl !== (e.ctrlKey || false)) return false;
    if (parsed.shift !== (e.shiftKey || false)) return false;
    if (parsed.alt !== (e.altKey || false)) return false;
    if (parsed.meta !== (e.metaKey || false)) return false;

    // Match the main key
    if (!parsed.key) return false;
    if (eventKey === parsed.key) return true;
    if (code === parsed.key || code === `key${parsed.key}`) return true;

    return false;
  }

  destroy() {
    document.removeEventListener('keydown', this._onKeyDown);
    this._keymaps.clear();
    super.destroy();
  }
}
