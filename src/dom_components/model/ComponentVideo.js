/**
 * ComponentVideo - Video component (video, youtube, vimeo)
 */
import Component from './Component.js';

export default class ComponentVideo extends Component {
  defaults() {
    return {
      ...super.defaults(),
      type: 'video',
      tagName: 'video',
      void: false,
      droppable: false,
      resizable: true,
      traits: [
        'id', 'title',
        { type: 'text', name: 'src', label: 'Source' },
        { type: 'checkbox', name: 'autoplay', label: 'Autoplay' },
        { type: 'checkbox', name: 'loop', label: 'Loop' },
        { type: 'checkbox', name: 'controls', label: 'Controls' },
      ],
      attributes: { controls: true },
    };
  }

  static isComponent(el) {
    if (el.tagName === 'VIDEO') return { type: 'video' };
    return false;
  }
}
