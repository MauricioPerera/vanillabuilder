/**
 * RichTextEditorModule - Module managing the inline rich text editor
 *
 * Handles RTE lifecycle, toolbar visibility, and action registration.
 */

import { Module } from '../core/index.js';
import RichTextEditor from './RichTextEditor.js';

export default class RichTextEditorModule extends Module {
  /**
   * @param {import('../editor/EditorModel.js').default} editor
   * @param {Object} [config={}]
   */
  constructor(editor, config = {}) {
    super(editor, config, {
      stylePrefix: 'rte-',
      /** @type {Object[]} Custom actions to add */
      actions: [],
    });

    /** @type {RichTextEditor|null} */
    this._rte = null;

    /** @type {HTMLElement|null} Currently active element */
    this._activeEl = null;

    this.onInit();
  }

  /**
   * Initialize the RTE instance (lazy)
   * @private
   * @returns {RichTextEditor}
   */
  _getRte() {
    if (!this._rte) {
      this._rte = new RichTextEditor({
        stylePrefix: this.pfx,
      });

      // Add custom actions from config
      const actions = this.getConfig('actions') || [];
      for (const action of actions) {
        this._rte.addAction(action);
      }
    }
    return this._rte;
  }

  /**
   * Enable the RTE on an element
   * @param {HTMLElement} el - The element to make editable
   * @param {Object} [opts={}]
   * @returns {RichTextEditor}
   */
  enable(el, opts = {}) {
    const rte = this._getRte();

    if (this._activeEl && this._activeEl !== el) {
      this.disable();
    }

    this._activeEl = el;
    rte.enable(el);

    this._em?.trigger('rte:enable', el, rte);
    return rte;
  }

  /**
   * Disable the RTE
   * @returns {this}
   */
  disable() {
    const rte = this._rte;
    if (rte) {
      const content = rte.getContent();
      const el = this._activeEl;

      rte.disable();

      if (el) {
        this._em?.trigger('rte:disable', el, content);
      }
    }
    this._activeEl = null;
    return this;
  }

  /**
   * Get the toolbar element
   * @returns {HTMLElement|null}
   */
  getToolbar() {
    return this._getRte().getToolbar();
  }

  /**
   * Add a custom action to the RTE toolbar
   * @param {Object} action
   * @param {string} action.id
   * @param {string} action.label
   * @param {string} [action.title]
   * @param {string} [action.command]
   * @param {Function} [action.handler]
   * @returns {this}
   */
  addAction(action) {
    this._getRte().addAction(action);
    return this;
  }

  /**
   * Execute an action by ID
   * @param {string} actionId
   * @param {string} [value]
   * @returns {this}
   */
  run(actionId, value) {
    if (this._rte && this._rte.isEnabled()) {
      this._rte.exec(actionId, value);
    }
    return this;
  }

  /**
   * Check if the RTE is currently active
   * @returns {boolean}
   */
  isActive() {
    return this._rte ? this._rte.isEnabled() : false;
  }

  /**
   * Get the RTE instance
   * @returns {RichTextEditor|null}
   */
  getRte() {
    return this._rte;
  }

  destroy() {
    this.disable();
    if (this._rte) {
      this._rte.destroy();
      this._rte = null;
    }
    this._activeEl = null;
    super.destroy();
  }
}
