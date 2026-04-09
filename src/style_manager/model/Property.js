/**
 * Property - Base CSS property model for the Style Manager
 *
 * Represents a single CSS property (e.g., 'color', 'font-size', 'margin').
 * Each property knows its type, possible values, and how to render its input.
 */

import { ReactiveModel, isString, isObject, isArray, isFunction } from '../../core/index.js';

/** @enum {string} Property types */
export const PROPERTY_TYPES = {
  TEXT: 'text',
  NUMBER: 'number',
  SELECT: 'select',
  RADIO: 'radio',
  COLOR: 'color',
  SLIDER: 'slider',
  COMPOSITE: 'composite',
  STACK: 'stack',
  FILE: 'file',
};

export default class Property extends ReactiveModel {
  defaults() {
    return {
      /** @type {string} CSS property name (e.g., 'color', 'font-size') */
      property: '',

      /** @type {string} Input type */
      type: PROPERTY_TYPES.TEXT,

      /** @type {string} Display label */
      label: '',

      /** @type {string} Default value */
      default: '',

      /** @type {any} Current value */
      value: '',

      /** @type {string} Unit for numeric values (px, em, %, etc.) */
      unit: '',

      /** @type {string[]} Available units */
      units: [],

      /** @type {number} Min value (for number/slider) */
      min: 0,

      /** @type {number} Max value (for number/slider) */
      max: 100,

      /** @type {number} Step increment */
      step: 1,

      /** @type {Array<{value: string, label?: string, title?: string}>} Options for select/radio */
      options: [],

      /** @type {string} Placeholder text */
      placeholder: '',

      /** @type {boolean} Whether the property can be inherited */
      canClear: true,

      /** @type {boolean} Whether property is visible */
      visible: true,

      /** @type {boolean} Full width (no label beside) */
      full: false,

      /** @type {string} Icon class */
      icon: '',

      /** @type {string} Tooltip/info text */
      info: '',

      /** @type {Function|null} Custom toStyle converter */
      toStyle: null,

      /** @type {Function|null} Custom fromStyle converter */
      fromStyle: null,

      /** @type {Array<Property>} Sub-properties for composite type */
      properties: [],

      /** @type {boolean} Whether property requires a value */
      requires: false,

      /** @type {string} Property group/sector ID */
      sector: '',

      /** @type {string} Separator for composite values */
      separator: ' ',

      /** @type {boolean} Whether value has been changed */
      _changed: false,
    };
  }

  initialize(attrs, opts = {}) {
    /** @type {import('../../editor/EditorModel.js').default|null} */
    this._em = opts.em || null;

    // Auto-generate label from property name
    if (!this.get('label') && this.get('property')) {
      const prop = this.get('property');
      const label = prop
        .replace(/-/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
      this.set('label', label, { silent: true });
    }

    // Initialize sub-properties for composite
    if (this.get('type') === PROPERTY_TYPES.COMPOSITE) {
      this._initSubProperties(opts);
    }
  }

  /**
   * Initialize sub-properties for composite type
   * @private
   */
  _initSubProperties(opts) {
    const props = this.get('properties') || [];
    const subProps = props.map(p => {
      if (p instanceof Property) return p;
      return new Property(p, { em: this._em });
    });
    this.set('properties', subProps, { silent: true });
  }

  /**
   * Get the CSS property name
   * @returns {string}
   */
  getProperty() {
    return this.get('property');
  }

  /**
   * Get the display label
   * @returns {string}
   */
  getLabel() {
    return this.get('label') || this.getProperty();
  }

  /**
   * Get the property type
   * @returns {string}
   */
  getType() {
    return this.get('type');
  }

  /**
   * Get the current value
   * @returns {string}
   */
  getValue() {
    return this.get('value') || this.get('default') || '';
  }

  /**
   * Get the full value with unit
   * @returns {string}
   */
  getFullValue() {
    const val = this.getValue();
    const unit = this.get('unit');
    if (!val && val !== 0) return '';
    if (unit && val !== 'auto' && val !== 'inherit' && val !== 'initial' && val !== 'none') {
      return `${val}${unit}`;
    }
    return String(val);
  }

  /**
   * Set the value
   * @param {string|number} value
   * @param {Object} [opts={}]
   * @returns {this}
   */
  setValue(value, opts = {}) {
    // Parse value and unit for number types
    if (this.get('type') === PROPERTY_TYPES.NUMBER || this.get('type') === PROPERTY_TYPES.SLIDER) {
      const parsed = this._parseValueUnit(String(value));
      if (parsed.unit) {
        this.set('unit', parsed.unit, { silent: true });
      }
      value = parsed.value;
    }

    this.set('value', value, opts);
    this.set('_changed', true, { silent: true });
    return this;
  }

  /**
   * Clear the value (revert to default)
   * @returns {this}
   */
  clear() {
    this.set('value', '', { silent: false });
    this.set('_changed', false, { silent: true });
    return this;
  }

  /**
   * Check if value has been changed from default
   * @returns {boolean}
   */
  hasValue() {
    const val = this.get('value');
    return val !== '' && val !== undefined && val !== null;
  }

  /**
   * Get available options (for select/radio)
   * @returns {Array}
   */
  getOptions() {
    return this.get('options') || [];
  }

  /**
   * Get available units
   * @returns {string[]}
   */
  getUnits() {
    return this.get('units') || [];
  }

  /**
   * Get sub-properties (for composite)
   * @returns {Property[]}
   */
  getProperties() {
    return this.get('properties') || [];
  }

  /**
   * Convert the property to a CSS style entry
   * @returns {Object} e.g., { 'font-size': '14px' }
   */
  toStyle() {
    const customToStyle = this.get('toStyle');
    if (isFunction(customToStyle)) {
      return customToStyle(this);
    }

    const prop = this.getProperty();
    const val = this.getFullValue();
    if (!prop || !val) return {};
    return { [prop]: val };
  }

  /**
   * Read value from a CSS style object
   * @param {Object} styles - CSS styles object
   * @returns {this}
   */
  fromStyle(styles) {
    const customFromStyle = this.get('fromStyle');
    if (isFunction(customFromStyle)) {
      customFromStyle(this, styles);
      return this;
    }

    const prop = this.getProperty();
    const val = styles[prop];
    if (val !== undefined) {
      this.setValue(val, { silent: true });
    } else {
      this.set('value', '', { silent: true });
      this.set('_changed', false, { silent: true });
    }
    return this;
  }

  /**
   * Parse a value string into value and unit parts
   * @private
   * @param {string} str
   * @returns {{ value: string, unit: string }}
   */
  _parseValueUnit(str) {
    if (!str) return { value: '', unit: '' };
    const match = String(str).match(/^(-?\d*\.?\d+)\s*(px|em|rem|%|vh|vw|vmin|vmax|ch|ex|cm|mm|in|pt|pc|deg|rad|s|ms)?$/i);
    if (match) {
      return { value: match[1], unit: match[2] || this.get('unit') || '' };
    }
    return { value: str, unit: '' };
  }
}
