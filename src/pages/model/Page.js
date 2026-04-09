/**
 * Page - Model representing a single page in a multi-page project
 *
 * Each page holds its own component tree (via a root component reference)
 * and its own set of CSS styles.
 */

import { ReactiveModel } from '../../core/index.js';

export default class Page extends ReactiveModel {
  defaults() {
    return {
      /** @type {string} Unique identifier */
      id: '',
      /** @type {string} Page name */
      name: 'Page',
      /** @type {Object[]} Frame definitions for this page */
      frames: [],
      /** @type {Object|null} Root component definition or model */
      component: null,
      /** @type {Object[]} CSS rule definitions for this page */
      styles: [],
    };
  }

  /**
   * Get the page name
   * @returns {string}
   */
  getName() {
    return this.get('name') || this.get('id') || 'Untitled';
  }

  /**
   * Set the page name
   * @param {string} name
   * @returns {this}
   */
  setName(name) {
    return this.set('name', name);
  }

  /**
   * Get the root component
   * @returns {Object|null}
   */
  getComponent() {
    return this.get('component');
  }

  /**
   * Set the root component
   * @param {Object} component
   * @returns {this}
   */
  setComponent(component) {
    return this.set('component', component);
  }

  /**
   * Get the styles for this page
   * @returns {Object[]}
   */
  getStyles() {
    return this.get('styles') || [];
  }

  /**
   * Set the styles for this page
   * @param {Object[]} styles
   * @returns {this}
   */
  setStyles(styles) {
    return this.set('styles', styles);
  }

  /**
   * Get the frames
   * @returns {Object[]}
   */
  getFrames() {
    return this.get('frames') || [];
  }
}
