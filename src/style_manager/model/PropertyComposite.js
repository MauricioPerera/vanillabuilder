/**
 * PropertyComposite - Multi-value CSS property (e.g., margin, padding, border)
 *
 * Contains sub-properties that combine into a single CSS value.
 */
import Property, { PROPERTY_TYPES } from './Property.js';

export default class PropertyComposite extends Property {
  defaults() {
    return {
      ...super.defaults(),
      type: PROPERTY_TYPES.COMPOSITE,
      separator: ' ',
      detached: false,  // If true, sub-properties write separately
      properties: [],
    };
  }

  /**
   * Get the combined value from all sub-properties
   * @returns {string}
   */
  getFullValue() {
    if (this.get('detached')) return '';

    const subProps = this.getProperties();
    if (!subProps.length) return super.getFullValue();

    const values = subProps.map(p => p.getFullValue()).filter(Boolean);
    return values.join(this.get('separator'));
  }

  /**
   * Convert to style - either combined or detached
   * @returns {Object}
   */
  toStyle() {
    if (this.get('detached')) {
      const result = {};
      for (const prop of this.getProperties()) {
        Object.assign(result, prop.toStyle());
      }
      return result;
    }

    const val = this.getFullValue();
    if (!val) return {};
    return { [this.getProperty()]: val };
  }

  /**
   * Read from styles - distribute to sub-properties
   * @param {Object} styles
   * @returns {this}
   */
  fromStyle(styles) {
    const subProps = this.getProperties();

    if (this.get('detached')) {
      for (const prop of subProps) {
        prop.fromStyle(styles);
      }
      return this;
    }

    const val = styles[this.getProperty()];
    if (val) {
      const parts = String(val).split(/\s+/);
      subProps.forEach((prop, i) => {
        // For shorthand: 1 val → all, 2 vals → vert/horiz, 4 vals → top/right/bottom/left
        let partVal;
        if (parts.length === 1) {
          partVal = parts[0];
        } else if (parts.length === 2) {
          partVal = i < 2 ? parts[i % 2] : parts[(i + 1) % 2];
        } else {
          partVal = parts[i] || parts[parts.length - 1];
        }
        if (partVal) prop.setValue(partVal, { silent: true });
      });
    }
    return this;
  }
}
