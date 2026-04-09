/**
 * ComponentHead - Head section component
 */
import Component from './Component.js';

export default class ComponentHead extends Component {
  defaults() {
    return {
      ...super.defaults(),
      type: 'head',
      tagName: 'head',
      draggable: false,
      selectable: false,
      hoverable: false,
      layerable: false,
      removable: false,
    };
  }

  static isComponent(el) {
    if (el.tagName === 'HEAD') return { type: 'head' };
    return false;
  }
}
