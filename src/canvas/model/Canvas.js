/**
 * Canvas - Model representing the canvas viewport state
 *
 * Tracks zoom level, pan coordinates, and the collection of frames.
 */

import { ReactiveModel } from '../../core/index.js';

export default class Canvas extends ReactiveModel {
  /**
   * @returns {Object} Default attributes
   */
  defaults() {
    return {
      /** @type {number} Zoom level as a percentage (100 = 100%) */
      zoom: 100,
      /** @type {number} Horizontal pan offset in pixels */
      x: 0,
      /** @type {number} Vertical pan offset in pixels */
      y: 0,
      /** @type {Array} Frame configurations */
      frames: [],
    };
  }

  /**
   * Set the zoom level
   * @param {number} zoom - Zoom percentage (e.g. 100 for 100%)
   * @returns {this}
   */
  setZoom(zoom) {
    return this.set('zoom', parseFloat(zoom) || 100);
  }

  /**
   * Get the current zoom level
   * @returns {number}
   */
  getZoom() {
    return this.get('zoom');
  }

  /**
   * Set pan coordinates
   * @param {number} x - Horizontal offset
   * @param {number} y - Vertical offset
   * @returns {this}
   */
  setCoords(x, y) {
    return this.set({ x, y });
  }

  /**
   * Get the current pan coordinates
   * @returns {{ x: number, y: number }}
   */
  getCoords() {
    return {
      x: this.get('x'),
      y: this.get('y'),
    };
  }
}
