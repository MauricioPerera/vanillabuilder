/**
 * ComponentView - Vanilla DOM view for rendering components
 *
 * Replaces Backbone.View with pure DOM manipulation.
 * Each component model has one or more views (one per canvas frame).
 */

import { isString, isObject, stylesToString, kebabCase } from '../../core/utils.js';

/** @type {string} */
const PPX = 'vb-';

export default class ComponentView {
  /**
   * @param {Object} opts
   * @param {import('../model/Component.js').default} opts.model
   * @param {import('../../editor/EditorModel.js').default} [opts.em]
   * @param {Object} [opts.config]
   */
  constructor(opts = {}) {
    /** @type {import('../model/Component.js').default} */
    this.model = opts.model;

    /** @type {import('../../editor/EditorModel.js').default|null} */
    this.em = opts.em || null;

    /** @type {Object} */
    this.config = opts.config || {};

    /** @type {HTMLElement|null} */
    this.el = null;

    /** @type {ComponentsView|null} */
    this.childrenView = null;

    /** @type {boolean} */
    this.rendered = false;

    /** @type {Function[]} Event cleanup handlers */
    this._cleanups = [];

    // Register view on model
    if (this.model) {
      this.model.views = this.model.views || [];
      this.model.views.push(this);
    }

    this._setupListeners();
  }

  /**
   * Setup model change listeners
   * @private
   */
  _setupListeners() {
    const model = this.model;
    if (!model) return;

    const listen = (event, handler) => {
      model.on(event, handler, this);
      this._cleanups.push(() => model.off(event, handler, this));
    };

    listen('change:style', () => this.updateStyle());
    listen('change:attributes', () => this.updateAttributes());
    listen('change:classes', () => this.updateClasses());
    listen('change:status', () => this.updateStatus());
    listen('change:locked', () => this.updateStatus());
    listen('change:content', () => this.updateContent());
    listen('change:tagName', () => this.resetEl());
  }

  /**
   * Create the DOM element
   * @returns {HTMLElement}
   */
  createElement() {
    const tag = this.model.get('tagName') || 'div';
    return document.createElement(tag);
  }

  /**
   * Render the component
   * @returns {this}
   */
  render() {
    this.el = this.createElement();

    // Set data attributes for editor
    this.el.setAttribute('data-vb-type', this.model.get('type') || 'default');

    // Apply model state to DOM
    this.updateAttributes();
    this.updateClasses();
    this.updateStyle();
    this.updateContent();
    this.renderChildren();

    // Store view reference on element
    this.el.__vbView = this;
    this.el.__vbComponent = this.model;

    this.rendered = true;
    this.onRender();

    // Trigger mount event
    if (this.em) {
      this.em.trigger('component:mount', this.model);
    }

    return this;
  }

  /**
   * Render children components
   */
  renderChildren() {
    const model = this.model;
    const components = model.components();

    if (!components || !components.length) return;

    // Clear existing children
    while (this.el.firstChild) {
      this.el.removeChild(this.el.firstChild);
    }

    // Render each child
    for (const child of components) {
      const childView = new ComponentView({
        model: child,
        em: this.em,
        config: this.config,
      });
      childView.render();
      this.el.appendChild(childView.el);
    }
  }

  /**
   * Sync model attributes to DOM
   */
  updateAttributes() {
    const el = this.el;
    if (!el) return;

    const attrs = this.model.get('attributes') || {};

    // Remove old attributes (except data-vb-* and class/style)
    const toRemove = [];
    for (const attr of el.attributes) {
      if (!attr.name.startsWith('data-vb-') && attr.name !== 'class' && attr.name !== 'style') {
        toRemove.push(attr.name);
      }
    }
    for (const name of toRemove) {
      el.removeAttribute(name);
    }

    // Set new attributes
    for (const [key, val] of Object.entries(attrs)) {
      if (val === true) {
        el.setAttribute(key, '');
      } else if (val === false || val == null) {
        el.removeAttribute(key);
      } else {
        el.setAttribute(key, val);
      }
    }
  }

  /**
   * Sync model classes to DOM
   */
  updateClasses() {
    const el = this.el;
    if (!el) return;

    const classes = this.model.getClasses();
    const currentClasses = [...el.classList].filter(c => !c.startsWith(PPX));

    // Remove non-editor classes
    for (const c of currentClasses) {
      el.classList.remove(c);
    }

    // Add model classes
    for (const c of classes) {
      if (c) el.classList.add(c);
    }
  }

  /**
   * Sync model styles to DOM
   */
  updateStyle() {
    const el = this.el;
    if (!el) return;

    const styles = this.model.get('style') || {};
    el.style.cssText = '';

    for (const [prop, val] of Object.entries(styles)) {
      try {
        el.style.setProperty(kebabCase(prop), val);
      } catch (e) {
        // Ignore invalid CSS
      }
    }
  }

  /**
   * Sync model content to DOM
   */
  updateContent() {
    const el = this.el;
    if (!el) return;

    const content = this.model.get('content');
    const hasChildren = this.model.components()?.length > 0;

    if (content && !hasChildren) {
      el.innerHTML = content;
    }
  }

  /**
   * Update visual status (selected, hovered, locked)
   */
  updateStatus() {
    const el = this.el;
    if (!el) return;

    const status = this.model.get('status');
    const locked = this.model.get('locked');

    // Remove all status classes
    el.classList.remove(`${PPX}selected`, `${PPX}hovered`, `${PPX}selected-parent`, `${PPX}freezed`);
    el.classList.remove(`${PPX}no-pointer`, `${PPX}pointer-init`);

    // Apply status
    if (status === 'selected') {
      el.classList.add(`${PPX}selected`);
    } else if (status === 'hovered') {
      el.classList.add(`${PPX}hovered`);
    } else if (status === 'selected-parent') {
      el.classList.add(`${PPX}selected-parent`);
    }

    // Apply locked
    if (locked) {
      el.classList.add(`${PPX}no-pointer`);
    }
  }

  /**
   * Recreate the element (when tagName changes)
   */
  resetEl() {
    const parent = this.el?.parentNode;
    const next = this.el?.nextSibling;
    this.remove();
    this.render();
    if (parent) {
      parent.insertBefore(this.el, next);
    }
  }

  /**
   * Hook for subclasses after render
   */
  onRender() {}

  /**
   * Get the DOM element
   * @returns {HTMLElement|null}
   */
  getEl() {
    return this.el;
  }

  /**
   * Remove the view and cleanup
   */
  remove() {
    // Cleanup listeners
    for (const cleanup of this._cleanups) {
      cleanup();
    }
    this._cleanups = [];

    // Remove from model's view list
    if (this.model && this.model.views) {
      const idx = this.model.views.indexOf(this);
      if (idx !== -1) this.model.views.splice(idx, 1);
    }

    // Remove DOM element
    if (this.el) {
      delete this.el.__vbView;
      delete this.el.__vbComponent;
      if (this.el.parentNode) {
        this.el.parentNode.removeChild(this.el);
      }
      this.el = null;
    }

    this.rendered = false;
  }
}
