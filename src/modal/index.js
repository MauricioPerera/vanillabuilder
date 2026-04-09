/**
 * ModalModule - Module for managing modal dialogs
 *
 * Provides a single modal overlay with configurable title
 * and content. Supports open/close lifecycle with events.
 */

import { Module } from '../core/index.js';

export default class ModalModule extends Module {
  /**
   * @param {import('../editor/EditorModel.js').default} editor
   * @param {Object} [config={}]
   */
  constructor(editor, config = {}) {
    super(editor, config, {
      stylePrefix: 'mdl-',
      backdrop: true,
      title: '',
      content: '',
    });

    /** @type {boolean} Whether the modal is currently open */
    this._isOpen = false;

    /** @type {string} Modal title */
    this._title = '';

    /** @type {string|HTMLElement} Modal content */
    this._content = '';

    /** @type {HTMLElement|null} Modal overlay element */
    this._overlayEl = null;

    /** @type {HTMLElement|null} Modal dialog element */
    this._dialogEl = null;

    /** @type {HTMLElement|null} Modal content container */
    this._contentEl = null;

    /** @type {HTMLElement|null} Modal title element */
    this._titleEl = null;

    this.onInit();
  }

  /**
   * Open the modal
   * @param {Object} [opts={}]
   * @param {string} [opts.title] - Modal title
   * @param {string|HTMLElement} [opts.content] - Modal content
   * @param {Object} [opts.attributes] - Additional HTML attributes for the dialog
   * @returns {this}
   */
  open(opts = {}) {
    if (opts.title !== undefined) this.setTitle(opts.title);
    if (opts.content !== undefined) this.setContent(opts.content);

    // Apply custom attributes
    if (opts.attributes && this._dialogEl) {
      for (const [key, val] of Object.entries(opts.attributes)) {
        this._dialogEl.setAttribute(key, val);
      }
    }

    this._isOpen = true;
    this._updateVisibility();
    this.trigger('modal:open');
    this._em?.trigger('modal:open');
    return this;
  }

  /**
   * Close the modal
   * @returns {this}
   */
  close() {
    this._isOpen = false;
    this._updateVisibility();
    this.trigger('modal:close');
    this._em?.trigger('modal:close');
    return this;
  }

  /**
   * Check if the modal is open
   * @returns {boolean}
   */
  isOpen() {
    return this._isOpen;
  }

  /**
   * Set the modal title
   * @param {string} title
   * @returns {this}
   */
  setTitle(title) {
    this._title = title || '';
    if (this._titleEl) {
      this._titleEl.textContent = this._title;
    }
    return this;
  }

  /**
   * Set the modal content
   * @param {string|HTMLElement} content
   * @returns {this}
   */
  setContent(content) {
    this._content = content || '';
    if (this._contentEl) {
      if (typeof this._content === 'string') {
        this._contentEl.innerHTML = this._content;
      } else if (this._content instanceof HTMLElement) {
        this._contentEl.innerHTML = '';
        this._contentEl.appendChild(this._content);
      }
    }
    return this;
  }

  /**
   * Get the modal title
   * @returns {string}
   */
  getTitle() {
    return this._title;
  }

  /**
   * Get the modal content
   * @returns {string|HTMLElement}
   */
  getContent() {
    return this._content;
  }

  /**
   * Update the visibility of the modal elements
   * @private
   */
  _updateVisibility() {
    if (this._overlayEl) {
      this._overlayEl.style.display = this._isOpen ? '' : 'none';
    }
  }

  /**
   * Render the modal overlay and dialog
   * @returns {HTMLElement}
   */
  render() {
    const pfx = this.pfx;

    // Overlay
    const overlay = document.createElement('div');
    overlay.className = `${pfx}modal-overlay`;
    overlay.style.display = 'none';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.zIndex = '1000';

    // Backdrop
    if (this.getConfig('backdrop')) {
      const backdrop = document.createElement('div');
      backdrop.className = `${pfx}modal-backdrop`;
      backdrop.style.position = 'absolute';
      backdrop.style.top = '0';
      backdrop.style.left = '0';
      backdrop.style.width = '100%';
      backdrop.style.height = '100%';
      backdrop.style.background = 'rgba(0,0,0,0.5)';
      backdrop.addEventListener('click', () => this.close());
      overlay.appendChild(backdrop);
    }

    // Dialog
    const dialog = document.createElement('div');
    dialog.className = `${pfx}modal-dialog`;
    dialog.style.position = 'relative';
    dialog.style.margin = '50px auto';
    dialog.style.maxWidth = '850px';
    dialog.style.background = '#fff';
    dialog.style.borderRadius = '4px';
    dialog.style.zIndex = '1';

    // Header
    const header = document.createElement('div');
    header.className = `${pfx}modal-header`;
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.padding = '10px 15px';
    header.style.borderBottom = '1px solid #ddd';

    const titleEl = document.createElement('div');
    titleEl.className = `${pfx}modal-title`;
    titleEl.style.fontWeight = 'bold';
    titleEl.style.fontSize = '1.1em';
    titleEl.textContent = this._title;

    const closeBtn = document.createElement('button');
    closeBtn.className = `${pfx}modal-close`;
    closeBtn.type = 'button';
    closeBtn.innerHTML = '&times;';
    closeBtn.style.border = 'none';
    closeBtn.style.background = 'none';
    closeBtn.style.fontSize = '1.5em';
    closeBtn.style.cursor = 'pointer';
    closeBtn.addEventListener('click', () => this.close());

    header.appendChild(titleEl);
    header.appendChild(closeBtn);

    // Content
    const contentEl = document.createElement('div');
    contentEl.className = `${pfx}modal-content`;
    contentEl.style.padding = '15px';

    if (typeof this._content === 'string') {
      contentEl.innerHTML = this._content;
    } else if (this._content instanceof HTMLElement) {
      contentEl.appendChild(this._content);
    }

    dialog.appendChild(header);
    dialog.appendChild(contentEl);
    overlay.appendChild(dialog);

    this._overlayEl = overlay;
    this._dialogEl = dialog;
    this._titleEl = titleEl;
    this._contentEl = contentEl;
    this._view = overlay;

    return overlay;
  }

  /**
   * Destroy the module
   */
  destroy() {
    this._isOpen = false;
    this._overlayEl = null;
    this._dialogEl = null;
    this._contentEl = null;
    this._titleEl = null;
    super.destroy();
  }
}
