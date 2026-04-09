/**
 * TraitManager - Module for managing component traits
 *
 * Traits are editable properties of components that appear in
 * the traits panel (e.g., href for links, src for images).
 * The TraitManager maintains a registry of trait types and
 * creates trait instances for selected components.
 */

import { Module } from '../core/index.js';
import Trait from './model/Trait.js';

export default class TraitManager extends Module {
  /**
   * @param {import('../editor/EditorModel.js').default} editor
   * @param {Object} [config={}]
   */
  constructor(editor, config = {}) {
    super(editor, config, {
      stylePrefix: 'trt-',
    });

    /**
     * Registry of custom trait type definitions
     * Each type can define: createInput(), onEvent(), onUpdate(), getInputEl()
     * @type {Map<string, Object>}
     */
    this._types = new Map();

    // Register built-in types
    this._registerBuiltinTypes();

    this.onInit();
  }

  /**
   * Register built-in trait types
   * @private
   */
  _registerBuiltinTypes() {
    // Text input
    this.addType('text', {
      createInput({ trait }) {
        const el = document.createElement('input');
        el.type = 'text';
        el.placeholder = trait.get('placeholder') || '';
        el.value = trait.getValue() || '';
        return el;
      },
    });

    // Number input
    this.addType('number', {
      createInput({ trait }) {
        const el = document.createElement('input');
        el.type = 'number';
        el.min = String(trait.get('min'));
        el.max = String(trait.get('max'));
        el.step = String(trait.get('step'));
        el.value = trait.getValue() || '';
        return el;
      },
    });

    // Checkbox
    this.addType('checkbox', {
      createInput({ trait }) {
        const el = document.createElement('input');
        el.type = 'checkbox';
        el.checked = !!trait.getValue();
        return el;
      },
    });

    // Select dropdown
    this.addType('select', {
      createInput({ trait }) {
        const el = document.createElement('select');
        const options = trait.getOptions();
        const currentVal = trait.getValue();

        for (const opt of options) {
          const optEl = document.createElement('option');
          if (typeof opt === 'string') {
            optEl.value = opt;
            optEl.textContent = opt;
          } else {
            optEl.value = opt.id || opt.value || '';
            optEl.textContent = opt.name || opt.label || opt.id || opt.value || '';
          }
          if (optEl.value === currentVal) {
            optEl.selected = true;
          }
          el.appendChild(optEl);
        }

        return el;
      },
    });

    // Color picker
    this.addType('color', {
      createInput({ trait }) {
        const el = document.createElement('input');
        el.type = 'color';
        el.value = trait.getValue() || '#000000';
        return el;
      },
    });

    // Button (action trigger)
    this.addType('button', {
      createInput({ trait }) {
        const el = document.createElement('button');
        el.type = 'button';
        el.textContent = trait.getLabel();
        return el;
      },
    });
  }

  /**
   * Add a custom trait type
   * @param {string} id - Type identifier
   * @param {Object} definition - Type definition object
   * @param {Function} definition.createInput - Function returning an input element
   * @param {Function} [definition.onEvent] - Event handler for input changes
   * @param {Function} [definition.onUpdate] - Called when trait value updates
   * @param {Function} [definition.getInputEl] - Custom input element getter
   * @returns {this}
   */
  addType(id, definition) {
    this._types.set(id, { ...definition });
    return this;
  }

  /**
   * Get a trait type definition
   * @param {string} id - Type identifier
   * @returns {Object|undefined}
   */
  getType(id) {
    return this._types.get(id);
  }

  /**
   * Get all registered type IDs
   * @returns {string[]}
   */
  getTypes() {
    return [...this._types.keys()];
  }

  /**
   * Check if a type exists
   * @param {string} id
   * @returns {boolean}
   */
  hasType(id) {
    return this._types.has(id);
  }

  /**
   * Create Trait model instances for a component
   * @param {Object} component - Component model
   * @returns {Trait[]}
   */
  getTraits(component) {
    if (!component) return [];

    const traitDefs = component.get('traits') || [];
    return traitDefs.map(def => {
      if (def instanceof Trait) {
        def.setComponent(component);
        return def;
      }

      // If trait is a string, treat as attribute name with text type
      const config = typeof def === 'string'
        ? { name: def, type: 'text' }
        : { ...def };

      return new Trait(config, { component });
    });
  }

  /**
   * Create an input element for a trait using the type registry
   * @param {Trait} trait
   * @returns {HTMLElement|null}
   */
  createInput(trait) {
    const type = trait.getType();
    const typeDef = this.getType(type) || this.getType('text');
    if (!typeDef || typeof typeDef.createInput !== 'function') return null;
    return typeDef.createInput({ trait });
  }

  /**
   * Destroy the module
   */
  destroy() {
    this._types.clear();
    super.destroy();
  }
}
