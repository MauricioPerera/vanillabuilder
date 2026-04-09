/**
 * Block - Model representing a draggable block in the block manager
 *
 * Blocks are pre-configured component templates that users can
 * drag onto the canvas. Each block defines the component content
 * it creates, along with display metadata.
 */

import { ReactiveModel } from '../../core/index.js';

export default class Block extends ReactiveModel {
  /**
   * @returns {Object} Default attributes
   */
  defaults() {
    return {
      /** @type {string} Unique block identifier */
      id: '',
      /** @type {string} Display label */
      label: '',
      /** @type {string|Object} Component definition (HTML string or component JSON) */
      content: '',
      /** @type {string} Category name for grouping blocks */
      category: '',
      /** @type {Object} Additional HTML attributes for the block element */
      attributes: {},
      /** @type {string} Media/icon HTML for visual representation */
      media: '',
      /** @type {boolean} Whether to activate the component after drop */
      activate: false,
      /** @type {boolean} Whether to select the component after drop */
      select: false,
      /** @type {boolean} Whether to reset the block ID on drop */
      resetId: false,
      /** @type {boolean} Disable the block */
      disable: false,
      /** @type {Function|null} Custom render callback */
      render: null,
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
   * Get the block label
   * @returns {string}
   */
  getLabel() {
    return this.get('label') || this.get('id') || '';
  }

  /**
   * Get the block content
   * @returns {string|Object}
   */
  getContent() {
    return this.get('content');
  }

  /**
   * Get the block category
   * @returns {string}
   */
  getCategory() {
    return this.get('category') || '';
  }

  /**
   * Check if the block is disabled
   * @returns {boolean}
   */
  isDisabled() {
    return !!this.get('disable');
  }
}
