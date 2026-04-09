/**
 * ComponentFrame - Iframe component
 */
import Component from './Component.js';

export default class ComponentFrame extends Component {
  defaults() {
    return {
      ...super.defaults(),
      type: 'frame',
      tagName: 'iframe',
      droppable: false,
      resizable: true,
      traits: [
        'id', 'title',
        { type: 'text', name: 'src', label: 'Source' },
      ],
    };
  }

  static isComponent(el) {
    if (el.tagName === 'IFRAME') return { type: 'frame' };
    return false;
  }
}
