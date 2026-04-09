/**
 * Sector - A group of CSS properties in the Style Manager
 *
 * Sectors organize properties into collapsible categories like
 * "General", "Typography", "Decorations", "Extra", etc.
 */

import { ReactiveModel } from '../../core/index.js';

export default class Sector extends ReactiveModel {
  defaults() {
    return {
      /** @type {string} Unique sector ID */
      id: '',

      /** @type {string} Display name */
      name: '',

      /** @type {boolean} Whether sector is open/expanded */
      open: true,

      /** @type {boolean} Whether sector is visible */
      visible: true,

      /** @type {import('./Property.js').default[]} Properties in this sector */
      properties: [],

      /** @type {number} Sort order */
      order: 0,
    };
  }

  /**
   * Get sector ID
   * @returns {string}
   */
  getId() {
    return this.get('id');
  }

  /**
   * Get display name
   * @returns {string}
   */
  getName() {
    return this.get('name') || this.get('id');
  }

  /**
   * Get all properties in this sector
   * @returns {import('./Property.js').default[]}
   */
  getProperties() {
    return this.get('properties') || [];
  }

  /**
   * Set the properties
   * @param {Array} properties
   * @returns {this}
   */
  setProperties(properties) {
    this.set('properties', properties);
    return this;
  }

  /**
   * Add a property to the sector
   * @param {import('./Property.js').default} property
   * @returns {this}
   */
  addProperty(property) {
    const props = [...this.getProperties(), property];
    this.set('properties', props);
    return this;
  }

  /**
   * Get a property by CSS property name
   * @param {string} propName
   * @returns {import('./Property.js').default|undefined}
   */
  getProperty(propName) {
    return this.getProperties().find(p => p.getProperty() === propName);
  }

  /**
   * Toggle open/close state
   * @returns {this}
   */
  toggle() {
    this.set('open', !this.get('open'));
    return this;
  }

  /**
   * Check if sector is open
   * @returns {boolean}
   */
  isOpen() {
    return !!this.get('open');
  }
}
