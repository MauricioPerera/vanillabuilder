/**
 * ComponentTextNode - Raw text node (no tag)
 */
import Component from './Component.js';

export default class ComponentTextNode extends Component {
  defaults() {
    return {
      ...super.defaults(),
      type: 'textnode',
      tagName: '',
      droppable: false,
      draggable: false,
      selectable: false,
      hoverable: false,
      layerable: false,
      editable: true,
    };
  }

  toHTML() {
    return this.get('content') || '';
  }

  static isComponent(el) {
    if (el.nodeType === 3) { // TEXT_NODE
      return { type: 'textnode', content: el.textContent };
    }
    return false;
  }
}
