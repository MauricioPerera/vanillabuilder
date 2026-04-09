/**
 * PropertyNumber - Numeric CSS property with unit support
 */
import Property, { PROPERTY_TYPES } from './Property.js';

export default class PropertyNumber extends Property {
  defaults() {
    return {
      ...super.defaults(),
      type: PROPERTY_TYPES.NUMBER,
      units: ['px', 'em', 'rem', '%', 'vh', 'vw'],
      min: 0,
      max: 9999,
      step: 1,
    };
  }
}
