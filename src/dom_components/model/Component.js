/**
 * Component - Base component model for the visual editor
 *
 * This is the core building block of VanillaBuilder. Every element in the
 * canvas is a Component with its own attributes, styles, traits, and children.
 *
 * Mirrors GrapesJS Component model with 40+ properties.
 */

import { ReactiveModel, ReactiveCollection, createId, isString, isFunction, isObject, isArray, stylesToString, parseStyles } from '../../core/index.js';

/** @type {Object} Default component properties */
const componentDefaults = {
  /** @type {string} HTML tag name */
  tagName: 'div',

  /** @type {string} Component type identifier */
  type: '',

  /** @type {string} Display name in layers/badges */
  name: '',

  /** @type {string} Inner HTML content (not escaped) */
  content: '',

  /** @type {Object} HTML attributes */
  attributes: {},

  /** @type {Array<string|Object>} CSS classes */
  classes: [],

  /** @type {Object} Inline styles */
  style: {},

  /** @type {string} Associated JavaScript */
  script: '',

  /** @type {string} Export-only script */
  'script-export': '',

  /** @type {Array<string>} Props passed to script */
  'script-props': [],

  /** @type {Array<Object>} Editable traits (attributes) */
  traits: ['id', 'title'],

  /** @type {boolean|string|Function} Can be dragged */
  draggable: true,

  /** @type {boolean|string|Function} Can receive drops */
  droppable: true,

  /** @type {boolean} Can be removed */
  removable: true,

  /** @type {boolean|Object} Can be resized */
  resizable: false,

  /** @type {boolean} Text can be edited inline */
  editable: false,

  /** @type {boolean} Can be selected */
  selectable: true,

  /** @type {boolean} Shows in layers panel */
  layerable: true,

  /** @type {boolean} Shows hover outline */
  hoverable: true,

  /** @type {boolean} Can be cloned */
  copyable: true,

  /** @type {boolean|string[]} CSS properties editable (true = all) */
  stylable: true,

  /** @type {string[]} CSS properties to hide */
  unstylable: [],

  /** @type {boolean} Shows badge */
  badgable: true,

  /** @type {boolean} Can be highlighted */
  highlightable: true,

  /** @type {boolean} Self-closing tag (br, hr, img) */
  void: false,

  /** @type {boolean} Locked (cannot select/modify) */
  locked: false,

  /** @type {string} Badge icon (HTML) */
  icon: '',

  /** @type {Array<Object>|null} Custom toolbar buttons */
  toolbar: null,

  /** @type {Array<string>} Properties inherited by children */
  propagate: [],

  /** @type {string} Internal state ('', 'selected', 'hovered', etc.) */
  status: '',

  /** @type {Object} Delegate commands */
  delegate: {},

  /** @type {string} CSS state (:hover, :focus, etc.) */
  state: '',

  /** @type {boolean} Whether this is the root wrapper */
  _isWrapper: false,
};

export default class Component extends ReactiveModel {
  defaults() {
    return { ...componentDefaults };
  }

  /**
   * @param {Object} attrs
   * @param {Object} opts
   */
  initialize(attrs, opts = {}) {
    const em = opts.em || (opts.collection?.em);

    /** @type {import('../../editor/EditorModel.js').default|null} */
    this._em = em || null;

    /** @type {Components|null} Children collection */
    this._components = null;

    /** @type {ComponentView[]} Attached views */
    this.views = [];

    /** @type {Component|null} Parent component */
    this._parent = null;

    // Initialize children
    const children = this.get('components') || [];
    this._initComponents(children, opts);

    // Remove 'components' from attributes (managed separately)
    delete this._attributes.components;

    // Process classes
    this._initClasses();

    // Process traits
    this._initTraits();

    // Process style
    if (isString(this.get('style'))) {
      this.set('style', parseStyles(this.get('style')), { silent: true });
    }

    // Fire creation event
    if (em) {
      em.trigger('component:create', this);
    }
  }

  /**
   * Initialize children components collection
   * @private
   */
  _initComponents(children, opts) {
    const ComponentsClass = Components; // Use the local Components class
    this._components = new ComponentsClass([], {
      model: this.constructor,
      em: this._em,
      parent: this,
    });

    // Setup event listeners BEFORE adding children
    this.listenTo(this._components, 'add', (model, col, o) => {
      model._parent = this;
      if (this._em) this._em.trigger('component:add', model, o);
    });
    this.listenTo(this._components, 'remove', (model, col, o) => {
      model._parent = null;
      if (this._em) this._em.trigger('component:remove', model, o);
    });

    if (children && children.length) {
      this._components.add(children, { silent: false });
    }
  }

  /**
   * Initialize CSS classes
   * @private
   */
  _initClasses() {
    let classes = this.get('classes') || [];
    if (isString(classes)) {
      classes = classes.split(' ').filter(Boolean);
    }
    this.set('classes', classes, { silent: true });
  }

  /**
   * Initialize traits
   * @private
   */
  _initTraits() {
    let traits = this.get('traits') || [];
    if (!isArray(traits)) traits = [traits];

    // Normalize string traits to objects
    traits = traits.map(t => {
      if (isString(t)) {
        return { type: 'text', name: t, label: t };
      }
      return t;
    });

    this.set('traits', traits, { silent: true });
  }

  // ── Children ──

  /**
   * Get children components
   * @returns {Components}
   */
  components(components) {
    if (components !== undefined) {
      // Set children
      this._components.reset([]);
      this._components.add(components);
      return this;
    }
    return this._components;
  }

  /**
   * Append child component(s)
   * @param {Object|Object[]|string} components
   * @param {Object} [opts={}]
   * @returns {Component|Component[]}
   */
  append(components, opts = {}) {
    return this._components.add(components, opts);
  }

  /**
   * Prepend child component(s)
   * @param {Object|Object[]|string} components
   * @param {Object} [opts={}]
   * @returns {Component|Component[]}
   */
  prepend(components, opts = {}) {
    return this._components.add(components, { ...opts, at: 0 });
  }

  /**
   * Get the parent component
   * @returns {Component|null}
   */
  parent() {
    return this._parent;
  }

  /**
   * Get the index within parent
   * @returns {number}
   */
  index() {
    const parent = this.parent();
    return parent ? parent.components().indexOf(this) : 0;
  }

  /**
   * Check if this is a child of another component
   * @param {Component} component
   * @returns {boolean}
   */
  isChildOf(component) {
    let parent = this.parent();
    while (parent) {
      if (parent === component) return true;
      parent = parent.parent();
    }
    return false;
  }

  /**
   * Check if this is the root wrapper
   * @returns {boolean}
   */
  isWrapper() {
    return !!this.get('_isWrapper');
  }

  // ── CSS Classes ──

  /**
   * Get CSS classes
   * @returns {string[]}
   */
  getClasses() {
    return [...(this.get('classes') || [])];
  }

  /**
   * Add CSS class
   * @param {string|string[]} classes
   * @returns {this}
   */
  addClass(classes) {
    const cls = isString(classes) ? classes.split(' ') : classes;
    const current = this.getClasses();
    let changed = false;
    for (const c of cls) {
      if (c && !current.includes(c)) {
        current.push(c);
        changed = true;
      }
    }
    if (changed) {
      this.set('classes', current);
    }
    return this;
  }

  /**
   * Remove CSS class
   * @param {string|string[]} classes
   * @returns {this}
   */
  removeClass(classes) {
    const cls = isString(classes) ? classes.split(' ') : classes;
    const current = this.getClasses().filter(c => !cls.includes(c));
    this.set('classes', current);
    return this;
  }

  /**
   * Check if has CSS class
   * @param {string} className
   * @returns {boolean}
   */
  hasClass(className) {
    return (this.get('classes') || []).includes(className);
  }

  // ── Styles ──

  /**
   * Get inline styles
   * @returns {Object}
   */
  getStyle() {
    return { ...(this.get('style') || {}) };
  }

  /**
   * Set inline styles (replace)
   * @param {Object|string} styles
   * @param {Object} [opts={}]
   * @returns {this}
   */
  setStyle(styles, opts = {}) {
    if (isString(styles)) {
      styles = parseStyles(styles);
    }
    this.set('style', { ...styles }, opts);
    return this;
  }

  /**
   * Add/update inline styles (merge)
   * @param {Object} styles
   * @param {Object} [opts={}]
   * @returns {this}
   */
  addStyle(styles, opts = {}) {
    const current = this.getStyle();
    this.set('style', { ...current, ...styles }, opts);
    return this;
  }

  /**
   * Remove a style property
   * @param {string} prop
   * @returns {this}
   */
  removeStyle(prop) {
    const current = this.getStyle();
    delete current[prop];
    this.set('style', current);
    return this;
  }

  /**
   * Get style as CSS string
   * @returns {string}
   */
  styleToString() {
    return stylesToString(this.get('style'));
  }

  // ── Attributes ──

  /**
   * Get HTML attributes
   * @returns {Object}
   */
  getAttributes() {
    const attrs = { ...(this.get('attributes') || {}) };
    const classes = this.getClasses();
    if (classes.length) {
      attrs.class = classes.join(' ');
    }
    const id = this.get('attributes')?.id || this.getId();
    if (id) attrs.id = id;
    return attrs;
  }

  /**
   * Set HTML attributes
   * @param {Object} attrs
   * @param {Object} [opts={}]
   * @returns {this}
   */
  setAttributes(attrs, opts = {}) {
    const { class: className, ...rest } = attrs;
    if (className !== undefined) {
      this.set('classes', className.split(' ').filter(Boolean), opts);
    }
    this.set('attributes', rest, opts);
    return this;
  }

  /**
   * Add HTML attributes (merge)
   * @param {Object} attrs
   * @param {Object} [opts={}]
   * @returns {this}
   */
  addAttributes(attrs, opts = {}) {
    const current = this.get('attributes') || {};
    return this.setAttributes({ ...current, ...attrs }, opts);
  }

  /**
   * Get component ID
   * @returns {string}
   */
  getId() {
    return (this.get('attributes') || {}).id || '';
  }

  /**
   * Set component ID
   * @param {string} id
   * @returns {this}
   */
  setId(id) {
    const attrs = { ...(this.get('attributes') || {}), id };
    this.set('attributes', attrs);
    return this;
  }

  // ── Traits ──

  /**
   * Get component traits
   * @returns {Array<Object>}
   */
  getTraits() {
    return [...(this.get('traits') || [])];
  }

  /**
   * Set component traits
   * @param {Array} traits
   * @returns {this}
   */
  setTraits(traits) {
    this.set('traits', traits);
    return this;
  }

  /**
   * Get a single trait by name
   * @param {string} name
   * @returns {Object|undefined}
   */
  getTrait(name) {
    return (this.get('traits') || []).find(t =>
      (isObject(t) ? t.name : t) === name
    );
  }

  // ── Tree Operations ──

  /**
   * Find descendant components matching a selector
   * @param {string} query - CSS-like selector (simplified)
   * @returns {Component[]}
   */
  find(query) {
    const results = [];
    this._findRecursive(query, results);
    return results;
  }

  /**
   * Find descendants by component type
   * @param {string} type
   * @returns {Component[]}
   */
  findType(type) {
    const results = [];
    const search = (comp) => {
      if (comp.get('type') === type) results.push(comp);
      comp.components().forEach(child => search(child));
    };
    this.components().forEach(child => search(child));
    return results;
  }

  /**
   * @private
   */
  _findRecursive(query, results) {
    // Simple selector matching (tag, .class, #id)
    this.components().forEach(child => {
      if (this._matchesQuery(child, query)) {
        results.push(child);
      }
      child._findRecursive(query, results);
    });
  }

  /**
   * @private
   */
  _matchesQuery(component, query) {
    if (!query) return false;
    if (query.startsWith('.')) {
      return component.hasClass(query.slice(1));
    }
    if (query.startsWith('#')) {
      return component.getId() === query.slice(1);
    }
    if (query.startsWith('[data-type=')) {
      const type = query.match(/\[data-type=(.+)\]/)?.[1];
      return component.get('type') === type;
    }
    return component.get('tagName') === query;
  }

  /**
   * Get root component (wrapper)
   * @returns {Component}
   */
  getRoot() {
    let root = this;
    while (root.parent()) {
      root = root.parent();
    }
    return root;
  }

  /**
   * Clone the component (deep)
   * @returns {Component}
   */
  clone() {
    const json = this.toJSON();
    delete json.id;
    json.components = this.components().map(c => c.toJSON());
    return new this.constructor(json, { em: this._em });
  }

  /**
   * Remove the component from its parent
   * @returns {this}
   */
  remove() {
    const parent = this.parent();
    if (parent) {
      parent.components().remove(this);
    }
    return this;
  }

  /**
   * Replace this component with another
   * @param {Object|Component} component
   * @returns {Component} The new component
   */
  replaceWith(component) {
    const parent = this.parent();
    if (!parent) return this;

    const idx = this.index();
    this.remove();
    return parent.components().add(component, { at: idx });
  }

  // ── Serialization ──

  /**
   * Serialize to JSON (including children)
   * @returns {Object}
   */
  toJSON() {
    const json = super.toJSON();

    // Include children
    if (this._components && this._components.length) {
      json.components = this._components.toJSON();
    }

    // Clean up internal properties
    delete json.status;
    delete json._isWrapper;

    return json;
  }

  /**
   * Generate HTML for this component
   * @param {Object} [opts={}]
   * @returns {string}
   */
  toHTML(opts = {}) {
    const tag = this.get('tagName');
    const isVoid = this.get('void');
    const attrs = this.getAttributes();
    const style = this.styleToString();

    let attrStr = '';
    for (const [key, val] of Object.entries(attrs)) {
      if (val === true) {
        attrStr += ` ${key}`;
      } else if (val !== false && val != null && val !== '') {
        attrStr += ` ${key}="${val}"`;
      }
    }

    if (style) {
      attrStr += ` style="${style}"`;
    }

    if (isVoid) {
      return `<${tag}${attrStr}/>`;
    }

    let content = this.get('content') || '';
    if (this._components && this._components.length) {
      content = this._components.map(c => c.toHTML(opts)).join('');
    }

    return `<${tag}${attrStr}>${content}</${tag}>`;
  }

  /**
   * Get the display name for UI
   * @returns {string}
   */
  getName() {
    return this.get('name') || this.get('type') || this.get('tagName') || 'Component';
  }

  /**
   * Check if component is a specific type
   * @param {string} type
   * @returns {boolean}
   */
  is(type) {
    return this.get('type') === type;
  }

  /**
   * Static method: detect component type from a DOM element
   * Override in subclasses
   * @param {HTMLElement} el
   * @returns {Object|boolean}
   */
  static isComponent(el) {
    return { tagName: el.tagName?.toLowerCase() };
  }
}


/**
 * Components - Collection of Component models
 */
export class Components extends ReactiveCollection {
  /**
   * @param {Array} models
   * @param {Object} opts
   */
  constructor(models = [], opts = {}) {
    super(models, { ...opts, model: Component });

    /** @type {import('../../editor/EditorModel.js').default|null} */
    this.em = opts.em || null;

    /** @type {Component|null} Parent component */
    this.parent = opts.parent || null;
  }
}
