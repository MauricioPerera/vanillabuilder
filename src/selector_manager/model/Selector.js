/**
 * Selector - Model representing a CSS selector
 *
 * Types:
 *   1 = class  (e.g. .my-class)
 *   2 = id     (e.g. #my-id)
 *   3 = tag    (e.g. div, span)
 */

import { ReactiveModel } from '../../core/index.js';

/** @enum {number} Selector types */
export const SELECTOR_TYPE = {
  CLASS: 1,
  ID: 2,
  TAG: 3,
};

export default class Selector extends ReactiveModel {
  /**
   * @returns {Object} Default attributes
   */
  defaults() {
    return {
      /** @type {string} Selector name (without prefix like . or #) */
      name: '',
      /** @type {string} Human-readable label */
      label: '',
      /** @type {number} Selector type: 1=class, 2=id, 3=tag */
      type: SELECTOR_TYPE.CLASS,
      /** @type {boolean} Whether this selector is active/enabled */
      active: true,
      /** @type {boolean} Whether this selector is private (not user-editable) */
      private: false,
      /** @type {boolean} Whether this selector is protected from deletion */
      protected: false,
    };
  }

  /**
   * @param {Object} attributes
   * @param {Object} options
   */
  initialize(attributes, options) {
    // Auto-generate label from name if not provided
    if (!this.get('label') && this.get('name')) {
      this.set('label', this.get('name'), { silent: true });
    }

    // Set id from name for collection lookup
    if (this.get('name') && !this.id) {
      this.id = this.get('name');
      this._attributes.id = this.get('name');
    }
  }

  /**
   * Get the full CSS selector string with prefix
   * @returns {string}
   */
  getFullName() {
    const name = this.get('name');
    if (!name) return '';

    switch (this.get('type')) {
      case SELECTOR_TYPE.ID:
        return `#${name}`;
      case SELECTOR_TYPE.TAG:
        return name;
      case SELECTOR_TYPE.CLASS:
      default:
        return `.${name}`;
    }
  }

  /**
   * Get the selector name
   * @returns {string}
   */
  getName() {
    return this.get('name');
  }

  /**
   * Get the selector label
   * @returns {string}
   */
  getLabel() {
    return this.get('label') || this.get('name');
  }

  /**
   * Set the selector label
   * @param {string} label
   * @returns {this}
   */
  setLabel(label) {
    return this.set('label', label);
  }

  /**
   * Check if the selector is active
   * @returns {boolean}
   */
  isActive() {
    return !!this.get('active');
  }

  /**
   * Check if the selector is private
   * @returns {boolean}
   */
  isPrivate() {
    return !!this.get('private');
  }

  /**
   * Convert to string (returns full selector name)
   * @returns {string}
   */
  toString() {
    return this.getFullName();
  }
}
