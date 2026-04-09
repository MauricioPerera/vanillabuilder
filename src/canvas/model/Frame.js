/**
 * Frame - Model representing an iframe in the canvas
 *
 * Each frame contains its own document context with head elements,
 * component tree, and styles. Multiple frames allow multi-page editing.
 */

import { ReactiveModel } from '../../core/index.js';

export default class Frame extends ReactiveModel {
  /**
   * @returns {Object} Default attributes
   */
  defaults() {
    return {
      /** @type {Array<Object>} Head elements (link, script, style tags) */
      head: [],
      /** @type {string} HTML string or component JSON for the body */
      components: '',
      /** @type {string} CSS styles string or rules JSON */
      styles: '',
      /** @type {string} Frame width (e.g. '100%', '1024px') */
      width: '',
      /** @type {string} Frame height (e.g. '100%', '768px') */
      height: '',
    };
  }

  /**
   * @param {Object} attributes
   * @param {Object} options
   */
  initialize(attributes, options) {
    /** @type {HTMLIFrameElement|null} The iframe DOM element */
    this._iframe = null;
  }

  /**
   * Get the head elements array
   * @returns {Array<Object>}
   */
  getHead() {
    return this.get('head') || [];
  }

  /**
   * Get the body content (components)
   * @returns {string}
   */
  getBody() {
    return this.get('components') || '';
  }

  /**
   * Set the iframe element reference
   * @param {HTMLIFrameElement} iframe
   */
  setIframe(iframe) {
    this._iframe = iframe;
  }

  /**
   * Get the iframe's document object
   * @returns {Document|null}
   */
  getDocument() {
    if (!this._iframe) return null;
    try {
      return this._iframe.contentDocument || this._iframe.contentWindow?.document || null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Get the iframe's window object
   * @returns {Window|null}
   */
  getWindow() {
    if (!this._iframe) return null;
    try {
      return this._iframe.contentWindow || null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Get the iframe DOM element
   * @returns {HTMLIFrameElement|null}
   */
  getIframe() {
    return this._iframe;
  }

  /**
   * Serialize frame data
   * @returns {Object}
   */
  toJSON() {
    const result = super.toJSON();
    // Don't serialize iframe reference
    return result;
  }
}
