/**
 * PropertySelect - Dropdown CSS property
 */
import Property, { PROPERTY_TYPES } from './Property.js';

export default class PropertySelect extends Property {
  defaults() {
    return {
      ...super.defaults(),
      type: PROPERTY_TYPES.SELECT,
      options: [],
    };
  }
}
