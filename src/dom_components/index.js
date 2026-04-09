/**
 * ComponentManager - Manages component types, registry, and the component tree
 *
 * Central module for creating, registering, and querying components.
 */

import { ItemManagerModule } from '../core/index.js';
import Component, { Components } from './model/Component.js';
import ComponentText from './model/ComponentText.js';
import ComponentTextNode from './model/ComponentTextNode.js';
import ComponentImage from './model/ComponentImage.js';
import ComponentLink from './model/ComponentLink.js';
import ComponentVideo from './model/ComponentVideo.js';
import ComponentMap from './model/ComponentMap.js';
import {
  ComponentTable, ComponentTableHead, ComponentTableBody,
  ComponentTableFoot, ComponentRow, ComponentCell
} from './model/ComponentTable.js';
import ComponentSvg from './model/ComponentSvg.js';
import ComponentScript from './model/ComponentScript.js';
import ComponentWrapper from './model/ComponentWrapper.js';
import ComponentComment from './model/ComponentComment.js';
import ComponentLabel from './model/ComponentLabel.js';
import ComponentHead from './model/ComponentHead.js';
import ComponentFrame from './model/ComponentFrame.js';

/** @type {string} Events */
export const ComponentsEvents = {
  add: 'component:add',
  remove: 'component:remove',
  removeBefore: 'component:remove:before',
  create: 'component:create',
  update: 'component:update',
  select: 'component:select',
  selected: 'component:selected',
  deselected: 'component:deselected',
  toggled: 'component:toggled',
  hover: 'component:hover',
  hovered: 'component:hovered',
  unhovered: 'component:unhovered',
  dragStart: 'component:drag:start',
  drag: 'component:drag',
  dragEnd: 'component:drag:end',
  mount: 'component:mount',
  typeAdd: 'component:type:add',
};

export default class ComponentManager extends ItemManagerModule {
  constructor(editor, config = {}) {
    super(editor, config, {});

    /** @type {string} Storage key */
    this.storageKey = 'components';

    /** @type {Map<string, Object>} Type registry */
    this._types = new Map();

    /** @type {ComponentWrapper|null} Root wrapper component */
    this._wrapper = null;

    this.events = {
      add: ComponentsEvents.add,
      remove: ComponentsEvents.remove,
      update: ComponentsEvents.update,
    };

    // Register built-in types
    this._registerBuiltInTypes();
  }

  /**
   * Register built-in component types
   * @private
   */
  _registerBuiltInTypes() {
    const types = [
      ['default', Component],
      ['text', ComponentText],
      ['textnode', ComponentTextNode],
      ['image', ComponentImage],
      ['link', ComponentLink],
      ['video', ComponentVideo],
      ['map', ComponentMap],
      ['table', ComponentTable],
      ['thead', ComponentTableHead],
      ['tbody', ComponentTableBody],
      ['tfoot', ComponentTableFoot],
      ['row', ComponentRow],
      ['cell', ComponentCell],
      ['svg', ComponentSvg],
      ['script', ComponentScript],
      ['wrapper', ComponentWrapper],
      ['comment', ComponentComment],
      ['label', ComponentLabel],
      ['head', ComponentHead],
      ['frame', ComponentFrame],
    ];

    for (const [id, ModelClass] of types) {
      this._types.set(id, {
        id,
        model: ModelClass,
        view: null, // Views added in Phase 4
        isComponent: ModelClass.isComponent,
      });
    }
  }

  /**
   * Register a custom component type
   * @param {string} id - Type identifier
   * @param {Object} definition
   * @param {typeof Component} [definition.model] - Model class
   * @param {Object} [definition.view] - View class
   * @param {Function} [definition.isComponent] - Auto-detection function
   * @param {string} [definition.extend] - Type to extend
   * @returns {this}
   */
  addType(id, definition = {}) {
    const { model, view, isComponent, extend } = definition;

    // Get base type
    const baseType = extend ? this._types.get(extend) : this._types.get('default');
    const BaseModel = model || baseType?.model || Component;

    this._types.set(id, {
      id,
      model: BaseModel,
      view: view || baseType?.view || null,
      isComponent: isComponent || BaseModel.isComponent,
    });

    this.em?.trigger(ComponentsEvents.typeAdd, { id, ...definition });
    return this;
  }

  /**
   * Get a component type definition
   * @param {string} id
   * @returns {Object|undefined}
   */
  getType(id) {
    return this._types.get(id);
  }

  /**
   * Get all component types
   * @returns {Object[]}
   */
  getTypes() {
    return [...this._types.values()];
  }

  /**
   * Create a component instance from definition
   * @param {Object|string} definition
   * @param {Object} [opts={}]
   * @returns {Component}
   */
  createComponent(definition, opts = {}) {
    if (typeof definition === 'string') {
      // Parse HTML string
      definition = { content: definition };
    }

    const type = definition.type || 'default';
    const typeDef = this._types.get(type) || this._types.get('default');
    const ModelClass = typeDef.model;

    return new ModelClass(definition, { ...opts, em: this.em });
  }

  /**
   * Detect component type from HTML element
   * @param {HTMLElement} el
   * @returns {Object|null}
   */
  detectType(el) {
    // Check types in reverse order (most specific first)
    const types = [...this._types.values()].reverse();

    for (const type of types) {
      if (type.isComponent) {
        const result = type.isComponent(el);
        if (result) {
          return { ...result, type: type.id };
        }
      }
    }

    return { tagName: el.tagName?.toLowerCase() };
  }

  /**
   * Get or create the root wrapper component
   * @returns {ComponentWrapper}
   */
  getWrapper() {
    if (!this._wrapper) {
      this._wrapper = new ComponentWrapper({}, { em: this.em });
    }
    return this._wrapper;
  }

  /**
   * Get all root components (children of wrapper)
   * @returns {Components}
   */
  getAll() {
    return this.getWrapper().components();
  }

  /**
   * Add component(s) to the root
   * @param {Object|Object[]|string} components
   * @param {Object} [opts={}]
   * @returns {Component|Component[]}
   */
  add(components, opts = {}) {
    return this.getWrapper().append(components, opts);
  }

  /**
   * Clear all components
   * @returns {this}
   */
  clear() {
    const wrapper = this.getWrapper();
    wrapper.components().reset([]);
    return this;
  }

  /**
   * Get project data for storage
   * @param {Object} data
   * @returns {Object}
   */
  getProjectData(data = {}) {
    data[this.storageKey] = this.getWrapper().components().toJSON();
    return data;
  }

  /**
   * Load project data from storage
   * @param {Object} data
   */
  loadProjectData(data = {}) {
    const components = data[this.storageKey];
    if (components && Array.isArray(components)) {
      this.getWrapper().components().reset(components);
    }
  }

  /**
   * Destroy
   */
  destroy() {
    if (this._wrapper) {
      this._wrapper.destroy();
      this._wrapper = null;
    }
    this._types.clear();
    super.destroy();
  }
}
