/**
 * ComponentScript - Script tag component
 */
import Component from './Component.js';

export default class ComponentScript extends Component {
  defaults() {
    return {
      ...super.defaults(),
      type: 'script',
      tagName: 'script',
      droppable: false,
      draggable: false,
      selectable: false,
      hoverable: false,
      layerable: false,
    };
  }

  static isComponent(el) {
    if (el.tagName === 'SCRIPT') {
      return { type: 'script' };
    }
    return false;
  }
}
