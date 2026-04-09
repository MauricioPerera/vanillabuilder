/**
 * ComponentSvg - SVG container component
 */
import Component from './Component.js';

export default class ComponentSvg extends Component {
  defaults() {
    return {
      ...super.defaults(),
      type: 'svg',
      tagName: 'svg',
      highlightable: false,
      resizable: true,
    };
  }

  static isComponent(el) {
    if (el.tagName === 'svg' || el instanceof SVGElement) {
      return { type: 'svg' };
    }
    return false;
  }
}
