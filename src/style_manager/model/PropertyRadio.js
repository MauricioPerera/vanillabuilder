/**
 * PropertyRadio - Radio button CSS property
 */
import Property, { PROPERTY_TYPES } from './Property.js';

export default class PropertyRadio extends Property {
  defaults() {
    return {
      ...super.defaults(),
      type: PROPERTY_TYPES.RADIO,
      options: [],
    };
  }
}
