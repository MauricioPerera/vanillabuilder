/**
 * ReactiveModel - Proxy-based reactive model replacing Backbone.Model
 *
 * Uses ES6 Proxy for automatic change detection and EventEmitter for events.
 * Fires 'change' and 'change:key' events when attributes are modified.
 *
 * @example
 * const model = new ReactiveModel({ name: 'Box', width: 100 });
 * model.on('change:width', (model, value) => console.log('Width:', value));
 * model.set('width', 200); // logs "Width: 200"
 */

import EventEmitter from './EventEmitter.js';
import { createId, isObject, isUndefined, isFunction, clone, deepMerge } from './utils.js';

export default class ReactiveModel extends EventEmitter {
  /**
   * @param {Object} [attributes={}] - Initial attributes
   * @param {Object} [options={}]
   * @param {ReactiveCollection} [options.collection] - Parent collection
   */
  constructor(attributes = {}, options = {}) {
    super();

    /** @type {string} Unique client ID */
    this.cid = createId('c');

    /** @type {Object} */
    this._options = options;

    /** @type {Object} Internal attributes store */
    this._attributes = {};

    /** @type {Object} Previous attributes before last change */
    this._previousAttributes = {};

    /** @type {Object|null} Changed attributes during current change cycle */
    this._changed = null;

    /** @type {boolean} Whether we're inside a change cycle */
    this._changing = false;

    /** @type {number} Pending change counter */
    this._pending = 0;

    /** @type {ReactiveCollection|null} Parent collection */
    this.collection = options.collection || null;

    // Apply defaults
    const defs = this.defaults();
    const merged = deepMerge(defs, attributes);

    // Set initial attributes silently
    this._attributes = { ...merged };
    this._previousAttributes = { ...merged };

    // Apply an id if present in attributes
    if (this._attributes.id !== undefined) {
      this.id = this._attributes.id;
    }

    this.initialize(attributes, options);
  }

  /**
   * Override in subclasses to provide default attribute values
   * @returns {Object}
   */
  defaults() {
    return {};
  }

  /**
   * Override in subclasses for custom initialization
   * @param {Object} attributes
   * @param {Object} options
   */
  initialize(attributes, options) {}

  /**
   * Get an attribute value
   * @param {string} key
   * @returns {any}
   */
  get(key) {
    return this._attributes[key];
  }

  /**
   * Set attribute(s) and fire change events
   * @param {string|Object} key - Attribute name or object of key/value pairs
   * @param {any} [value] - Value if key is string
   * @param {Object} [options={}]
   * @param {boolean} [options.silent=false] - Suppress events
   * @param {boolean} [options.avoidStore=false] - Skip storage flagging
   * @param {boolean} [options.unset=false] - Remove the attribute
   * @returns {this}
   */
  set(key, value, options = {}) {
    if (key == null) return this;

    // Handle set({ key: value }, options) form
    let attrs;
    if (isObject(key)) {
      attrs = key;
      options = value || {};
    } else {
      attrs = { [key]: value };
    }

    const { silent = false, unset = false } = options;
    const changing = this._changing;
    this._changing = true;

    if (!changing) {
      this._previousAttributes = { ...this._attributes };
      this._changed = {};
    }

    const prev = this._previousAttributes;
    const changed = this._changed;

    for (const [attr, val] of Object.entries(attrs)) {
      const current = this._attributes[attr];

      if (unset) {
        delete this._attributes[attr];
      } else {
        this._attributes[attr] = val;
      }

      // Track what changed
      if (!this._isEqual(current, val)) {
        changed[attr] = val;
        if (!silent) {
          this._pending++;
        }
      } else {
        delete changed[attr];
      }

      // Update id
      if (attr === 'id') {
        this.id = unset ? undefined : val;
      }
    }

    // Fire change:key events
    if (!silent) {
      while (this._pending) {
        this._pending = 0;
        for (const [attr, val] of Object.entries(changed)) {
          this.trigger(`change:${attr}`, this, val, options);
        }
      }
    }

    if (!changing) {
      if (!silent && Object.keys(changed).length > 0) {
        this.trigger('change', this, options);
      }
      this._changing = false;
      this._changed = null;
    }

    return this;
  }

  /**
   * Check if an attribute exists
   * @param {string} key
   * @returns {boolean}
   */
  has(key) {
    return this._attributes[key] != null;
  }

  /**
   * Remove an attribute
   * @param {string} key
   * @param {Object} [options]
   * @returns {this}
   */
  unset(key, options = {}) {
    return this.set(key, undefined, { ...options, unset: true });
  }

  /**
   * Remove all attributes
   * @param {Object} [options]
   * @returns {this}
   */
  clear(options = {}) {
    const attrs = {};
    for (const key of Object.keys(this._attributes)) {
      attrs[key] = undefined;
    }
    return this.set(attrs, { ...options, unset: true });
  }

  /**
   * Check if model has changed (specific attribute or any)
   * @param {string} [attr]
   * @returns {boolean}
   */
  hasChanged(attr) {
    if (!this._changed) return false;
    if (attr) return attr in this._changed;
    return Object.keys(this._changed).length > 0;
  }

  /**
   * Get the changed attributes
   * @returns {Object|null}
   */
  changedAttributes() {
    return this._changed ? { ...this._changed } : null;
  }

  /**
   * Get previous value of an attribute
   * @param {string} key
   * @returns {any}
   */
  previous(key) {
    if (!key || !this._previousAttributes) return undefined;
    return this._previousAttributes[key];
  }

  /**
   * Get all previous attributes
   * @returns {Object}
   */
  previousAttributes() {
    return { ...this._previousAttributes };
  }

  /**
   * Get all attributes as a plain object
   * @returns {Object}
   */
  attributes() {
    return { ...this._attributes };
  }

  /**
   * Serialize model to JSON
   * @returns {Object}
   */
  toJSON() {
    const result = {};
    for (const [key, value] of Object.entries(this._attributes)) {
      if (value && isFunction(value.toJSON)) {
        result[key] = value.toJSON();
      } else if (isObject(value)) {
        result[key] = clone(value);
      } else if (Array.isArray(value)) {
        result[key] = value.map(v => (v && isFunction(v.toJSON)) ? v.toJSON() : v);
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  /**
   * Clone the model
   * @returns {ReactiveModel}
   */
  clone() {
    return new this.constructor(this.toJSON());
  }

  /**
   * Pick specific attributes
   * @param {...string} keys
   * @returns {Object}
   */
  pick(...keys) {
    const result = {};
    for (const key of keys) {
      if (key in this._attributes) {
        result[key] = this._attributes[key];
      }
    }
    return result;
  }

  /**
   * Omit specific attributes
   * @param {...string} keys
   * @returns {Object}
   */
  omit(...keys) {
    const result = { ...this._attributes };
    for (const key of keys) {
      delete result[key];
    }
    return result;
  }

  /**
   * Check if the model is valid (override in subclasses)
   * @returns {boolean}
   */
  isValid() {
    return true;
  }

  /**
   * Compare two values for equality
   * @private
   * @param {any} a
   * @param {any} b
   * @returns {boolean}
   */
  _isEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (isObject(a) && isObject(b)) {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      if (keysA.length !== keysB.length) return false;
      return keysA.every(k => this._isEqual(a[k], b[k]));
    }
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((v, i) => this._isEqual(v, b[i]));
    }
    return false;
  }

  /**
   * Destroy the model: trigger 'destroy', remove from collection, cleanup events
   * @param {Object} [options]
   */
  destroy(options = {}) {
    this.trigger('destroy', this, this.collection, options);
    if (this.collection) {
      this.collection.remove(this, options);
    }
    this.stopListening();
    this._events.clear();
  }
}
