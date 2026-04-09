/**
 * PropertyColor - Color picker CSS property
 */
import Property, { PROPERTY_TYPES } from './Property.js';

export default class PropertyColor extends Property {
  defaults() {
    return {
      ...super.defaults(),
      type: PROPERTY_TYPES.COLOR,
    };
  }
}
