/**
 * ComponentText - Text component with inline editing support
 */
import Component from './Component.js';

export default class ComponentText extends Component {
  defaults() {
    return {
      ...super.defaults(),
      type: 'text',
      tagName: 'div',
      editable: true,
      droppable: false,
      traits: ['id', 'title'],
    };
  }

  static isComponent(el) {
    // Any element with only text content could be a text component
    return false; // Must be explicitly set
  }
}
