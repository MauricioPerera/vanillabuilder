/**
 * PropertySlider - Range slider CSS property
 */
import Property, { PROPERTY_TYPES } from './Property.js';

export default class PropertySlider extends Property {
  defaults() {
    return {
      ...super.defaults(),
      type: PROPERTY_TYPES.SLIDER,
      units: ['px', 'em', 'rem', '%'],
      min: 0,
      max: 100,
      step: 1,
    };
  }
}
