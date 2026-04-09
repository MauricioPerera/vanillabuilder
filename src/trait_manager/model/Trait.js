/**
 * Trait - Model representing a component trait (editable property)
 *
 * Traits define the editable properties of a component that appear
 * in the traits panel. They support various input types (text, number,
 * select, checkbox, color, etc.).
 */

import { ReactiveModel } from '../../core/index.js';

export default class Trait extends ReactiveModel {
  /**
   * @returns {Object} Default attributes
   */
  defaults() {
    return {
      /** @type {string} Trait input type: 'text','number','select','checkbox','color','button' */
      type: 'text',
      /** @type {string} Attribute/property name on the component */
      name: '',
      /** @type {string} Display label */
      label: '',
      /** @type {any} Current value */
      value: '',
      /** @type {any} Default value */
      default: '',
      /** @type {string} Placeholder text for inputs */
      placeholder: '',
      /** @type {Array<{id:string, name:string}>} Options for select type */
      options: [],
      /** @type {number} Minimum value (for number type) */
      min: 0,
      /** @type {number} Maximum value (for number type) */
      max: 100,
      /** @type {number} Step increment (for number type) */
      step: 1,
      /** @type {boolean} Whether the trait is changeable */
      changeProp: false,
      /** @type {string} Category for grouping traits */
      category: '',
    };
  }

  /**
   * @param {Object} attributes
   * @param {Object} options
   */
  initialize(attributes, options) {
    /** @type {import('../../dom_components/model/Component.js').default|null} */
    this._component = options.component || null;

    // Generate label from name if not provided
    if (!this.get('label') && this.get('name')) {
      const name = this.get('name');
      // Convert camelCase/kebab-case to Title Case
      const label = name
        .replace(/[-_]/g, ' ')
        .replace(/([A-Z])/g, ' $1')
        .replace(/^\s+/, '')
        .replace(/\b\w/g, c => c.toUpperCase());
      this.set('label', label, { silent: true });
    }
  }

  /**
   * Get the trait value
   * If changeProp is true, reads from the component's property directly.
   * Otherwise, reads from the trait's own value attribute.
   * @returns {any}
   */
  getValue() {
    const changeProp = this.get('changeProp');

    if (changeProp && this._component) {
      return this._component.get(this.get('name'));
    }

    const val = this.get('value');
    return val !== undefined && val !== '' ? val : this.get('default');
  }

  /**
   * Set the trait value
   * If changeProp is true, sets the component's property directly.
   * Otherwise, sets the trait's own value attribute.
   * @param {any} value
   * @param {Object} [opts={}]
   * @returns {this}
   */
  setValue(value, opts = {}) {
    const changeProp = this.get('changeProp');

    if (changeProp && this._component) {
      this._component.set(this.get('name'), value, opts);
    }

    this.set('value', value, opts);
    return this;
  }

  /**
   * Get the display label
   * @returns {string}
   */
  getLabel() {
    return this.get('label') || this.get('name');
  }

  /**
   * Get the trait name
   * @returns {string}
   */
  getName() {
    return this.get('name');
  }

  /**
   * Get the trait type
   * @returns {string}
   */
  getType() {
    return this.get('type');
  }

  /**
   * Get options (for select type)
   * @returns {Array}
   */
  getOptions() {
    return this.get('options') || [];
  }

  /**
   * Get the associated component
   * @returns {Object|null}
   */
  getComponent() {
    return this._component;
  }

  /**
   * Set the associated component
   * @param {Object} component
   */
  setComponent(component) {
    this._component = component;
  }

  /**
   * Get the initial/default value
   * @returns {any}
   */
  getDefault() {
    return this.get('default');
  }

  /**
   * Check if the value has been changed from default
   * @returns {boolean}
   */
  isValueChanged() {
    const val = this.getValue();
    const def = this.getDefault();
    return val !== def;
  }
}
