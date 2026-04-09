/**
 * ComponentLabel - Label element component
 */
import ComponentText from './ComponentText.js';

export default class ComponentLabel extends ComponentText {
  defaults() {
    return {
      ...super.defaults(),
      type: 'label',
      tagName: 'label',
      traits: ['id', 'title', { type: 'text', name: 'for', label: 'For' }],
    };
  }

  static isComponent(el) {
    if (el.tagName === 'LABEL') return { type: 'label' };
    return false;
  }
}
