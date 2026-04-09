/**
 * RichTextEditor - Inline contentEditable text editor with toolbar
 *
 * Provides bold, italic, underline, strikethrough, link, and list
 * formatting actions via a floating toolbar attached to the active element.
 */

export default class RichTextEditor {
  /**
   * @param {Object} [config={}]
   * @param {string} [config.stylePrefix='rte-']
   */
  constructor(config = {}) {
    this.config = config;
    this.pfx = config.stylePrefix || 'rte-';

    /** @type {HTMLElement|null} Currently active editable element */
    this._el = null;

    /** @type {HTMLElement|null} Toolbar element */
    this._toolbar = null;

    /** @type {Map<string, Object>} Registered actions */
    this._actions = new Map();

    /** @type {boolean} */
    this._enabled = false;

    this._initActions();
    this._buildToolbar();
  }

  /**
   * Initialize default formatting actions
   * @private
   */
  _initActions() {
    const defaultActions = [
      {
        id: 'bold',
        label: 'B',
        title: 'Bold',
        command: 'bold',
        style: 'font-weight: bold;',
      },
      {
        id: 'italic',
        label: 'I',
        title: 'Italic',
        command: 'italic',
        style: 'font-style: italic;',
      },
      {
        id: 'underline',
        label: 'U',
        title: 'Underline',
        command: 'underline',
        style: 'text-decoration: underline;',
      },
      {
        id: 'strikethrough',
        label: 'S',
        title: 'Strikethrough',
        command: 'strikeThrough',
        style: 'text-decoration: line-through;',
      },
      {
        id: 'link',
        label: '&#128279;',
        title: 'Insert Link',
        command: 'createLink',
        requiresInput: true,
      },
      {
        id: 'insertOrderedList',
        label: 'OL',
        title: 'Ordered List',
        command: 'insertOrderedList',
      },
      {
        id: 'insertUnorderedList',
        label: 'UL',
        title: 'Unordered List',
        command: 'insertUnorderedList',
      },
    ];

    for (const action of defaultActions) {
      this._actions.set(action.id, action);
    }
  }

  /**
   * Build the toolbar DOM element
   * @private
   */
  _buildToolbar() {
    const pfx = this.pfx;
    const toolbar = document.createElement('div');
    toolbar.className = `${pfx}toolbar`;
    toolbar.style.cssText = `
      display: none;
      position: absolute;
      z-index: 100;
      background: #333;
      border-radius: 4px;
      padding: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      white-space: nowrap;
    `;

    for (const [id, action] of this._actions) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `${pfx}action ${pfx}action-${id}`;
      btn.innerHTML = action.label;
      btn.title = action.title || id;
      btn.style.cssText = `
        background: transparent;
        border: 1px solid transparent;
        color: #fff;
        cursor: pointer;
        padding: 4px 8px;
        margin: 0 1px;
        border-radius: 3px;
        font-size: 13px;
        line-height: 1;
        ${action.style || ''}
      `;

      btn.addEventListener('mouseenter', () => {
        btn.style.background = '#555';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.background = 'transparent';
      });

      btn.addEventListener('mousedown', (e) => {
        e.preventDefault(); // Prevent losing selection
        this.exec(id);
      });

      toolbar.appendChild(btn);
    }

    this._toolbar = toolbar;
    document.body.appendChild(toolbar);
  }

  /**
   * Enable editing on an element
   * @param {HTMLElement} el
   * @returns {this}
   */
  enable(el) {
    if (this._el) this.disable();

    this._el = el;
    el.contentEditable = 'true';
    el.style.outline = 'none';
    this._enabled = true;

    // Show toolbar
    this._positionToolbar();
    this._toolbar.style.display = 'block';

    // Listen for selection changes to update toolbar position
    this._onSelectionChange = () => this._positionToolbar();
    document.addEventListener('selectionchange', this._onSelectionChange);

    // Listen for input to update position
    this._onInput = () => this._positionToolbar();
    el.addEventListener('input', this._onInput);

    el.focus();
    return this;
  }

  /**
   * Disable editing and hide toolbar
   * @returns {this}
   */
  disable() {
    if (this._el) {
      this._el.contentEditable = 'false';
      document.removeEventListener('selectionchange', this._onSelectionChange);
      this._el.removeEventListener('input', this._onInput);
      this._el = null;
    }

    this._enabled = false;
    if (this._toolbar) {
      this._toolbar.style.display = 'none';
    }

    return this;
  }

  /**
   * Position the toolbar above the active element
   * @private
   */
  _positionToolbar() {
    if (!this._el || !this._toolbar) return;

    const rect = this._el.getBoundingClientRect();
    const toolbarRect = this._toolbar.getBoundingClientRect();
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    let top = rect.top + scrollY - toolbarRect.height - 8;
    let left = rect.left + scrollX + (rect.width / 2) - (toolbarRect.width / 2);

    // Keep on screen
    if (top < scrollY) top = rect.bottom + scrollY + 8;
    if (left < 0) left = 4;

    this._toolbar.style.top = `${top}px`;
    this._toolbar.style.left = `${left}px`;
  }

  /**
   * Execute a formatting command
   * @param {string} commandId - Action ID
   * @param {string} [value] - Optional value (e.g., URL for createLink)
   * @returns {this}
   */
  exec(commandId, value) {
    const action = this._actions.get(commandId);
    if (!action) return this;

    let cmd = action.command || commandId;

    // Handle custom handler
    if (typeof action.handler === 'function') {
      action.handler(this, this._el);
      return this;
    }

    // Handle link creation
    if (action.requiresInput && !value) {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const selectedText = sel.toString();
        if (selectedText) {
          value = prompt('Enter URL:', 'https://');
          if (!value) return this;
        }
      }
    }

    document.execCommand(cmd, false, value || null);
    return this;
  }

  /**
   * Get the current content of the editable element
   * @returns {string}
   */
  getContent() {
    return this._el ? this._el.innerHTML : '';
  }

  /**
   * Set the content of the editable element
   * @param {string} html
   * @returns {this}
   */
  setContent(html) {
    if (this._el) {
      this._el.innerHTML = html;
    }
    return this;
  }

  /**
   * Get the toolbar element
   * @returns {HTMLElement|null}
   */
  getToolbar() {
    return this._toolbar;
  }

  /**
   * Add a custom action to the toolbar
   * @param {Object} action
   * @param {string} action.id
   * @param {string} action.label
   * @param {string} [action.title]
   * @param {string} [action.command]
   * @param {Function} [action.handler]
   */
  addAction(action) {
    if (!action || !action.id) return;
    this._actions.set(action.id, action);

    // Add button to toolbar
    const pfx = this.pfx;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `${pfx}action ${pfx}action-${action.id}`;
    btn.innerHTML = action.label || action.id;
    btn.title = action.title || action.id;
    btn.style.cssText = `
      background: transparent;
      border: 1px solid transparent;
      color: #fff;
      cursor: pointer;
      padding: 4px 8px;
      margin: 0 1px;
      border-radius: 3px;
      font-size: 13px;
      line-height: 1;
    `;

    btn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      this.exec(action.id);
    });

    this._toolbar?.appendChild(btn);
  }

  /**
   * Check if the editor is currently active
   * @returns {boolean}
   */
  isEnabled() {
    return this._enabled;
  }

  /**
   * Destroy the editor and remove the toolbar
   */
  destroy() {
    this.disable();
    if (this._toolbar && this._toolbar.parentNode) {
      this._toolbar.parentNode.removeChild(this._toolbar);
    }
    this._toolbar = null;
    this._actions.clear();
  }
}
