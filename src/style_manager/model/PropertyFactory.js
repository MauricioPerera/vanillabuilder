/**
 * PropertyFactory - Creates Property instances from definitions
 *
 * Provides built-in CSS property definitions organized by sector.
 * This is the equivalent of GrapesJS PropertyFactory.
 */

import Property, { PROPERTY_TYPES } from './Property.js';
import PropertyNumber from './PropertyNumber.js';
import PropertySelect from './PropertySelect.js';
import PropertyRadio from './PropertyRadio.js';
import PropertyColor from './PropertyColor.js';
import PropertySlider from './PropertySlider.js';
import PropertyComposite from './PropertyComposite.js';
import PropertyStack from './PropertyStack.js';

/** @type {Map<string, typeof Property>} Type registry */
const TYPE_MAP = new Map([
  [PROPERTY_TYPES.TEXT, Property],
  [PROPERTY_TYPES.NUMBER, PropertyNumber],
  [PROPERTY_TYPES.SELECT, PropertySelect],
  [PROPERTY_TYPES.RADIO, PropertyRadio],
  [PROPERTY_TYPES.COLOR, PropertyColor],
  [PROPERTY_TYPES.SLIDER, PropertySlider],
  [PROPERTY_TYPES.COMPOSITE, PropertyComposite],
  [PROPERTY_TYPES.STACK, PropertyStack],
]);

export default class PropertyFactory {
  /**
   * @param {import('../../../editor/EditorModel.js').default} [em]
   */
  constructor(em) {
    this._em = em;
  }

  /**
   * Create a Property instance from a definition
   * @param {Object} def - Property definition
   * @returns {Property}
   */
  create(def) {
    const type = def.type || PROPERTY_TYPES.TEXT;
    const Cls = TYPE_MAP.get(type) || Property;
    return new Cls(def, { em: this._em });
  }

  /**
   * Create multiple properties from definitions
   * @param {Object[]} defs
   * @returns {Property[]}
   */
  createAll(defs) {
    return defs.map(d => this.create(d));
  }

  /**
   * Get built-in sector definitions with their properties
   * @returns {Array<{id: string, name: string, open: boolean, properties: Object[]}>}
   */
  getBuiltInSectors() {
    return [
      {
        id: 'general',
        name: 'General',
        open: true,
        order: 1,
        properties: [
          { property: 'float', type: 'radio', options: [
            { value: 'none', label: 'None' },
            { value: 'left', label: 'Left' },
            { value: 'right', label: 'Right' },
          ]},
          { property: 'display', type: 'select', options: [
            { value: 'block' }, { value: 'inline' }, { value: 'inline-block' },
            { value: 'flex' }, { value: 'grid' }, { value: 'none' },
            { value: 'contents' },
          ]},
          { property: 'position', type: 'select', options: [
            { value: 'static' }, { value: 'relative' }, { value: 'absolute' },
            { value: 'fixed' }, { value: 'sticky' },
          ]},
          { property: 'top', type: 'number', units: ['px', 'em', 'rem', '%', 'vh', 'auto'] },
          { property: 'right', type: 'number', units: ['px', 'em', 'rem', '%', 'vw', 'auto'] },
          { property: 'bottom', type: 'number', units: ['px', 'em', 'rem', '%', 'vh', 'auto'] },
          { property: 'left', type: 'number', units: ['px', 'em', 'rem', '%', 'vw', 'auto'] },
        ],
      },
      {
        id: 'dimension',
        name: 'Dimension',
        open: true,
        order: 2,
        properties: [
          { property: 'width', type: 'number', units: ['px', 'em', 'rem', '%', 'vw', 'auto'] },
          { property: 'min-width', type: 'number', units: ['px', 'em', 'rem', '%', 'vw'] },
          { property: 'max-width', type: 'number', units: ['px', 'em', 'rem', '%', 'vw', 'none'] },
          { property: 'height', type: 'number', units: ['px', 'em', 'rem', '%', 'vh', 'auto'] },
          { property: 'min-height', type: 'number', units: ['px', 'em', 'rem', '%', 'vh'] },
          { property: 'max-height', type: 'number', units: ['px', 'em', 'rem', '%', 'vh', 'none'] },
          { property: 'margin', type: 'composite', detached: true, properties: [
            { property: 'margin-top', type: 'number', units: ['px', 'em', 'rem', '%', 'auto'] },
            { property: 'margin-right', type: 'number', units: ['px', 'em', 'rem', '%', 'auto'] },
            { property: 'margin-bottom', type: 'number', units: ['px', 'em', 'rem', '%', 'auto'] },
            { property: 'margin-left', type: 'number', units: ['px', 'em', 'rem', '%', 'auto'] },
          ]},
          { property: 'padding', type: 'composite', detached: true, properties: [
            { property: 'padding-top', type: 'number', units: ['px', 'em', 'rem', '%'] },
            { property: 'padding-right', type: 'number', units: ['px', 'em', 'rem', '%'] },
            { property: 'padding-bottom', type: 'number', units: ['px', 'em', 'rem', '%'] },
            { property: 'padding-left', type: 'number', units: ['px', 'em', 'rem', '%'] },
          ]},
        ],
      },
      {
        id: 'typography',
        name: 'Typography',
        open: true,
        order: 3,
        properties: [
          { property: 'font-family', type: 'select', options: [
            { value: 'Arial, Helvetica, sans-serif', label: 'Arial' },
            { value: '"Courier New", Courier, monospace', label: 'Courier New' },
            { value: 'Georgia, serif', label: 'Georgia' },
            { value: '"Times New Roman", Times, serif', label: 'Times New Roman' },
            { value: '"Trebuchet MS", Helvetica, sans-serif', label: 'Trebuchet MS' },
            { value: 'Verdana, Geneva, sans-serif', label: 'Verdana' },
          ]},
          { property: 'font-size', type: 'number', units: ['px', 'em', 'rem', 'pt', '%', 'vw'], default: '16', min: 0 },
          { property: 'font-weight', type: 'select', options: [
            { value: '100', label: 'Thin' }, { value: '200', label: 'Extra Light' },
            { value: '300', label: 'Light' }, { value: '400', label: 'Normal' },
            { value: '500', label: 'Medium' }, { value: '600', label: 'Semi Bold' },
            { value: '700', label: 'Bold' }, { value: '800', label: 'Extra Bold' },
            { value: '900', label: 'Black' },
          ]},
          { property: 'letter-spacing', type: 'number', units: ['px', 'em', 'rem'] },
          { property: 'color', type: 'color' },
          { property: 'line-height', type: 'number', units: ['px', 'em', 'rem', ''] },
          { property: 'text-align', type: 'radio', options: [
            { value: 'left', label: 'L', title: 'Left' },
            { value: 'center', label: 'C', title: 'Center' },
            { value: 'right', label: 'R', title: 'Right' },
            { value: 'justify', label: 'J', title: 'Justify' },
          ]},
          { property: 'text-decoration', type: 'select', options: [
            { value: 'none' }, { value: 'underline' }, { value: 'overline' },
            { value: 'line-through' },
          ]},
          { property: 'text-transform', type: 'select', options: [
            { value: 'none' }, { value: 'capitalize' }, { value: 'uppercase' },
            { value: 'lowercase' },
          ]},
          { property: 'text-shadow', type: 'stack', layerSeparator: ', ', properties: [
            { property: 'text-shadow-h', type: 'number', units: ['px'], default: '0' },
            { property: 'text-shadow-v', type: 'number', units: ['px'], default: '0' },
            { property: 'text-shadow-blur', type: 'number', units: ['px'], default: '0', min: 0 },
            { property: 'text-shadow-color', type: 'color', default: 'black' },
          ]},
        ],
      },
      {
        id: 'decorations',
        name: 'Decorations',
        open: false,
        order: 4,
        properties: [
          { property: 'opacity', type: 'slider', min: 0, max: 1, step: 0.01, default: '1' },
          { property: 'background-color', type: 'color' },
          { property: 'border-radius', type: 'composite', detached: true, properties: [
            { property: 'border-top-left-radius', type: 'number', units: ['px', 'em', '%'], min: 0 },
            { property: 'border-top-right-radius', type: 'number', units: ['px', 'em', '%'], min: 0 },
            { property: 'border-bottom-right-radius', type: 'number', units: ['px', 'em', '%'], min: 0 },
            { property: 'border-bottom-left-radius', type: 'number', units: ['px', 'em', '%'], min: 0 },
          ]},
          { property: 'border', type: 'composite', properties: [
            { property: 'border-width', type: 'number', units: ['px', 'em'], default: '1', min: 0 },
            { property: 'border-style', type: 'select', options: [
              { value: 'none' }, { value: 'solid' }, { value: 'dashed' },
              { value: 'dotted' }, { value: 'double' }, { value: 'groove' },
              { value: 'ridge' }, { value: 'inset' }, { value: 'outset' },
            ]},
            { property: 'border-color', type: 'color' },
          ]},
          { property: 'box-shadow', type: 'stack', layerSeparator: ', ', properties: [
            { property: 'box-shadow-h', type: 'number', units: ['px'], default: '0' },
            { property: 'box-shadow-v', type: 'number', units: ['px'], default: '0' },
            { property: 'box-shadow-blur', type: 'number', units: ['px'], default: '5', min: 0 },
            { property: 'box-shadow-spread', type: 'number', units: ['px'], default: '0' },
            { property: 'box-shadow-color', type: 'color', default: 'rgba(0,0,0,0.3)' },
          ]},
          { property: 'background', type: 'stack', layerSeparator: ', ', properties: [
            { property: 'background-image', type: 'text', default: 'none' },
            { property: 'background-repeat', type: 'select', options: [
              { value: 'repeat' }, { value: 'repeat-x' }, { value: 'repeat-y' },
              { value: 'no-repeat' },
            ]},
            { property: 'background-position', type: 'select', options: [
              { value: 'left top' }, { value: 'center top' }, { value: 'right top' },
              { value: 'left center' }, { value: 'center center' }, { value: 'right center' },
              { value: 'left bottom' }, { value: 'center bottom' }, { value: 'right bottom' },
            ]},
            { property: 'background-size', type: 'select', options: [
              { value: 'auto' }, { value: 'cover' }, { value: 'contain' },
            ]},
          ]},
        ],
      },
      {
        id: 'flex',
        name: 'Flex',
        open: false,
        order: 5,
        properties: [
          { property: 'flex-direction', type: 'select', options: [
            { value: 'row' }, { value: 'row-reverse' }, { value: 'column' }, { value: 'column-reverse' },
          ]},
          { property: 'flex-wrap', type: 'select', options: [
            { value: 'nowrap' }, { value: 'wrap' }, { value: 'wrap-reverse' },
          ]},
          { property: 'justify-content', type: 'select', options: [
            { value: 'flex-start' }, { value: 'flex-end' }, { value: 'center' },
            { value: 'space-between' }, { value: 'space-around' }, { value: 'space-evenly' },
          ]},
          { property: 'align-items', type: 'select', options: [
            { value: 'flex-start' }, { value: 'flex-end' }, { value: 'center' },
            { value: 'stretch' }, { value: 'baseline' },
          ]},
          { property: 'align-content', type: 'select', options: [
            { value: 'flex-start' }, { value: 'flex-end' }, { value: 'center' },
            { value: 'stretch' }, { value: 'space-between' }, { value: 'space-around' },
          ]},
          { property: 'gap', type: 'number', units: ['px', 'em', 'rem', '%'], min: 0 },
          { property: 'order', type: 'number', min: -999, max: 999, step: 1, units: [] },
          { property: 'flex-basis', type: 'number', units: ['px', 'em', 'rem', '%', 'auto'] },
          { property: 'flex-grow', type: 'number', min: 0, max: 99, step: 1, units: [] },
          { property: 'flex-shrink', type: 'number', min: 0, max: 99, step: 1, units: [] },
          { property: 'align-self', type: 'select', options: [
            { value: 'auto' }, { value: 'flex-start' }, { value: 'flex-end' },
            { value: 'center' }, { value: 'stretch' }, { value: 'baseline' },
          ]},
        ],
      },
      {
        id: 'extra',
        name: 'Extra',
        open: false,
        order: 6,
        properties: [
          { property: 'overflow', type: 'select', options: [
            { value: 'visible' }, { value: 'hidden' }, { value: 'scroll' }, { value: 'auto' },
          ]},
          { property: 'overflow-x', type: 'select', options: [
            { value: 'visible' }, { value: 'hidden' }, { value: 'scroll' }, { value: 'auto' },
          ]},
          { property: 'overflow-y', type: 'select', options: [
            { value: 'visible' }, { value: 'hidden' }, { value: 'scroll' }, { value: 'auto' },
          ]},
          { property: 'cursor', type: 'select', options: [
            { value: 'auto' }, { value: 'pointer' }, { value: 'move' }, { value: 'text' },
            { value: 'wait' }, { value: 'help' }, { value: 'not-allowed' }, { value: 'crosshair' },
            { value: 'grab' }, { value: 'grabbing' },
          ]},
          { property: 'transition', type: 'text', placeholder: 'all 0.3s ease' },
          { property: 'transform', type: 'text', placeholder: 'rotate(0deg) scale(1)' },
          { property: 'z-index', type: 'number', min: -999, max: 9999, step: 1, units: [] },
        ],
      },
    ];
  }
}
