/**
 * Asset - Model representing a media asset (image, video, etc.)
 *
 * Assets are media resources that can be used within components
 * (e.g., image sources, video URLs, etc.).
 */

import { ReactiveModel } from '../../core/index.js';

export default class Asset extends ReactiveModel {
  /**
   * @returns {Object} Default attributes
   */
  defaults() {
    return {
      /** @type {string} Asset type: 'image', 'video', 'file' */
      type: 'image',
      /** @type {string} Source URL of the asset */
      src: '',
      /** @type {string} Asset display name */
      name: '',
      /** @type {number} Asset width in pixels (for images) */
      width: 0,
      /** @type {number} Asset height in pixels (for images) */
      height: 0,
      /** @type {string} Unit for dimensions (e.g. 'px', '%') */
      unitDim: 'px',
      /** @type {string} Category for grouping */
      category: '',
    };
  }

  /**
   * @param {Object} attributes
   * @param {Object} options
   */
  initialize(attributes, options) {
    // Use src as ID if no explicit id is set
    if (!this.id && this.get('src')) {
      this.id = this.get('src');
      this._attributes.id = this.get('src');
    }
  }

  /**
   * Get the source URL
   * @returns {string}
   */
  getSrc() {
    return this.get('src');
  }

  /**
   * Get the asset filename
   * @returns {string}
   */
  getFilename() {
    const name = this.get('name');
    if (name) return name;

    const src = this.get('src') || '';
    return src.split('/').pop().split('?')[0] || '';
  }

  /**
   * Get the asset extension
   * @returns {string}
   */
  getExtension() {
    const filename = this.getFilename();
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop().toLowerCase() : '';
  }

  /**
   * Check if this is an image asset
   * @returns {boolean}
   */
  isImage() {
    return this.get('type') === 'image';
  }
}
