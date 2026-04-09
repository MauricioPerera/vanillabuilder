/**
 * ComponentImage - Image component
 */
import Component from './Component.js';

export default class ComponentImage extends Component {
  defaults() {
    return {
      ...super.defaults(),
      type: 'image',
      tagName: 'img',
      void: true,
      droppable: false,
      editable: false,
      resizable: { ratioDefault: true },
      traits: ['id', 'title', 'alt'],
      attributes: {
        src: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2NjYyIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1zaXplPSIxNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk5OSI+SW1hZ2U8L3RleHQ+PC9zdmc+',
      },
    };
  }

  /**
   * Get image source
   * @returns {string}
   */
  getSrc() {
    return (this.get('attributes') || {}).src || '';
  }

  /**
   * Set image source
   * @param {string} src
   */
  setSrc(src) {
    this.addAttributes({ src });
  }

  static isComponent(el) {
    if (el.tagName === 'IMG') {
      return { type: 'image' };
    }
    return false;
  }
}
