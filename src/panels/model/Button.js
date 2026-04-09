/**
 * Button - Model representing a panel button/action
 *
 * Buttons can trigger commands, toggle states, and carry
 * custom attributes for rendering.
 */

import { ReactiveModel } from '../../core/index.js';

export default class Button extends ReactiveModel {
  /**
   * @returns {Object} Default attributes
   */
  defaults() {
    return {
      /** @type {string} Unique button identifier */
      id: '',
      /** @type {string} Display label */
      label: '',
      /** @type {string} CSS class name(s) */
      className: '',
      /** @type {string} Command ID to execute on click */
      command: '',
      /** @type {boolean} Whether button is currently active/pressed */
      active: false,
      /** @type {boolean} Whether button can be toggled on/off */
      togglable: true,
      /** @type {boolean} Whether button is disabled */
      disabled: false,
      /** @type {boolean} Whether button is visible */
      visible: true,
      /** @type {Object} Additional HTML attributes */
      attributes: {},
      /** @type {Object} Additional context passed to the command */
      context: '',
      /** @type {boolean} Drag mode - if true, acts as a drag handle */
      dragDrop: false,
    };
  }

  /**
   * @param {Object} attributes
   * @param {Object} options
   */
  initialize(attributes, options) {
    if (this.get('id') && !this.id) {
      this.id = this.get('id');
    }
  }

  /**
   * Check if the button is active
   * @returns {boolean}
   */
  isActive() {
    return !!this.get('active');
  }

  /**
   * Get the associated command ID
   * @returns {string}
   */
  getCommand() {
    return this.get('command');
  }

  /**
   * Render button to a DOM element
   * @param {string} [pfx='vb-'] - Style prefix
   * @returns {HTMLElement}
   */
  renderElement(pfx = 'vb-') {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = `${pfx}btn ${this.get('className') || ''}`.trim();
    el.setAttribute('data-btn-id', this.get('id') || '');

    if (this.get('active')) el.classList.add(`${pfx}active`);
    if (this.get('disabled')) el.disabled = true;
    if (!this.get('visible')) el.style.display = 'none';

    // Apply custom attributes
    const attrs = this.get('attributes') || {};
    for (const [key, val] of Object.entries(attrs)) {
      el.setAttribute(key, val);
    }

    el.innerHTML = this.get('label') || '';

    return el;
  }
}
