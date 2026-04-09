/**
 * ComponentLink - Anchor/link component
 */
import ComponentText from './ComponentText.js';

export default class ComponentLink extends ComponentText {
  defaults() {
    return {
      ...super.defaults(),
      type: 'link',
      tagName: 'a',
      editable: true,
      droppable: true,
      traits: [
        'id', 'title',
        { type: 'text', name: 'href', label: 'Href' },
        {
          type: 'select', name: 'target', label: 'Target',
          options: [
            { value: '', label: 'This window' },
            { value: '_blank', label: 'New window' },
          ],
        },
      ],
    };
  }

  static isComponent(el) {
    if (el.tagName === 'A') {
      return { type: 'link' };
    }
    return false;
  }
}
