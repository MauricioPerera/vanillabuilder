/**
 * Panel - Model representing a UI panel region
 *
 * Panels are top-level UI containers that can hold buttons,
 * views, or arbitrary content. They are rendered into the
 * editor chrome (toolbar, sidebar, etc.).
 */

import { ReactiveModel, ReactiveCollection } from '../../core/index.js';
import Button from './Button.js';

export default class Panel extends ReactiveModel {
  /**
   * @returns {Object} Default attributes
   */
  defaults() {
    return {
      /** @type {string} Unique panel identifier */
      id: '',
      /** @type {string|HTMLElement} Panel content (HTML string or DOM element) */
      content: '',
      /** @type {boolean} Whether the panel is visible */
      visible: true,
      /** @type {boolean} Whether the panel is resizable */
      resizable: false,
      /** @type {Array} Button configurations */
      buttons: [],
      /** @type {HTMLElement|null} External element to use as container */
      el: null,
      /** @type {string} Where to append panel ('', or a CSS selector) */
      appendTo: '',
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

    // Initialize buttons collection
    const buttonData = this.get('buttons') || [];
    /** @type {ReactiveCollection} */
    this._buttons = new ReactiveCollection(
      buttonData.map(b => (b instanceof Button ? b : b)),
      { model: Button }
    );
  }

  /**
   * Get the buttons collection
   * @returns {ReactiveCollection}
   */
  getButtons() {
    return this._buttons;
  }

  /**
   * Add a button to this panel
   * @param {Object|Button} button - Button config or model
   * @returns {Button}
   */
  addButton(button) {
    return this._buttons.add(button);
  }

  /**
   * Get a button by ID
   * @param {string} id
   * @returns {Button|undefined}
   */
  getButton(id) {
    return this._buttons.find(btn => btn.get('id') === id);
  }

  /**
   * Remove a button by ID
   * @param {string} id
   * @returns {Button|undefined}
   */
  removeButton(id) {
    const btn = this.getButton(id);
    if (btn) {
      this._buttons.remove(btn);
    }
    return btn;
  }

  /**
   * Check if the panel is visible
   * @returns {boolean}
   */
  isVisible() {
    return !!this.get('visible');
  }

  /**
   * Destroy panel and its buttons
   */
  destroy() {
    this._buttons.destroy();
    super.destroy();
  }
}
