/**
 * ComponentMap - Map embed component (iframe-based)
 */
import Component from './Component.js';

export default class ComponentMap extends Component {
  defaults() {
    return {
      ...super.defaults(),
      type: 'map',
      tagName: 'iframe',
      void: false,
      droppable: false,
      resizable: true,
      traits: [
        'id', 'title',
        { type: 'text', name: 'src', label: 'Source' },
      ],
      style: { width: '100%', height: '250px' },
      attributes: {
        src: 'https://maps.google.com/maps?&z=1&t=q&output=embed',
        frameborder: '0',
      },
    };
  }

  static isComponent(el) {
    if (el.tagName === 'IFRAME' && /maps\.google\.com/.test(el.src)) {
      return { type: 'map' };
    }
    return false;
  }
}
