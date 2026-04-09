/**
 * ComponentComment - HTML comment component
 */
import Component from './Component.js';

export default class ComponentComment extends Component {
  defaults() {
    return {
      ...super.defaults(),
      type: 'comment',
      tagName: '',
      draggable: false,
      selectable: false,
      hoverable: false,
      layerable: false,
    };
  }

  toHTML() {
    return `<!-- ${this.get('content') || ''} -->`;
  }

  static isComponent(el) {
    if (el.nodeType === 8) { // COMMENT_NODE
      return { type: 'comment', content: el.textContent };
    }
    return false;
  }
}
