/**
 * Device - Model representing a device preset for responsive preview
 *
 * Each device defines viewport dimensions and an optional media query
 * width for CSS generation.
 */

import { ReactiveModel } from '../../core/index.js';

export default class Device extends ReactiveModel {
  defaults() {
    return {
      /** @type {string} Unique identifier */
      id: '',
      /** @type {string} Display name */
      name: '',
      /** @type {string} Viewport width (e.g., '768px', '100%') */
      width: '',
      /** @type {string} Viewport height (e.g., '1024px', '') */
      height: '',
      /** @type {string} Width for CSS media query (e.g., '768px') */
      widthMedia: '',
      /** @type {number} Priority for ordering (lower = higher priority) */
      priority: 0,
    };
  }

  /**
   * Get the name for display
   * @returns {string}
   */
  getName() {
    return this.get('name') || this.get('id') || '';
  }

  /**
   * Get the viewport width as a number (pixels)
   * @returns {number}
   */
  getWidthValue() {
    return parseInt(this.get('width'), 10) || 0;
  }

  /**
   * Get the media query condition string
   * @returns {string} e.g., '(max-width: 768px)'
   */
  getMediaCondition() {
    const wm = this.get('widthMedia');
    if (!wm) return '';
    return `(max-width: ${wm})`;
  }
}
