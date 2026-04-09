/**
 * ComponentWrapper - Root wrapper component (body equivalent)
 */
import Component from './Component.js';

export default class ComponentWrapper extends Component {
  defaults() {
    return {
      ...super.defaults(),
      type: 'wrapper',
      tagName: 'body',
      _isWrapper: true,
      draggable: false,
      copyable: false,
      removable: false,
      selectable: false,
      hoverable: false,
      badgable: false,
      droppable: true,
    };
  }
}
