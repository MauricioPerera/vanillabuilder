/**
 * ItemManagerModule - Base for modules that manage a collection of items
 *
 * Extends Module with CRUD operations, storage integration, and event management.
 * Used by: BlockManager, AssetManager, CssComposer, SelectorManager,
 *          PageManager, StyleManager, etc.
 */

import Module from './Module.js';
import ReactiveCollection from './ReactiveCollection.js';
import ReactiveModel from './ReactiveModel.js';
import { isString, isFunction } from './utils.js';

export default class ItemManagerModule extends Module {
  /**
   * @param {import('../editor/EditorModel.js').default} editor
   * @param {Object} [config={}]
   * @param {Object} [defaults={}]
   * @param {ReactiveCollection} [collection] - Optional pre-created collection
   */
  constructor(editor, config = {}, defaults = {}, collection) {
    super(editor, config, defaults);

    /** @type {string|string[]} Storage key(s) for persistence */
    this.storageKey = '';

    /** @type {ReactiveCollection} The managed collection */
    this._collection = collection || new ReactiveCollection([], {
      model: this.Model || ReactiveModel,
    });

    /** @type {Map<string, ReactiveModel>} Cache for fast lookups */
    this._itemCache = new Map();

    /** @type {Object} Event name mapping */
    this.events = {};

    // Propagate collection events
    this._setupEventPropagation();
  }

  /**
   * The model class for items in this module
   * Override in subclasses
   * @type {typeof ReactiveModel}
   */
  get Model() {
    return ReactiveModel;
  }

  /**
   * Get the entire collection
   * @returns {ReactiveCollection}
   */
  get all() {
    return this._collection;
  }

  /**
   * Add item(s) to the collection
   * @param {Object|Object[]} item
   * @param {Object} [opts={}]
   * @returns {ReactiveModel|ReactiveModel[]}
   */
  add(item, opts = {}) {
    const result = this._collection.add(item, opts);
    this._updateCache();
    return result;
  }

  /**
   * Get item by id
   * @param {string} id
   * @returns {ReactiveModel|undefined}
   */
  get(id) {
    return this._collection.get(id) || this._itemCache.get(id);
  }

  /**
   * Get all items
   * @returns {ReactiveModel[]}
   */
  getAll() {
    return [...this._collection];
  }

  /**
   * Remove item(s)
   * @param {string|ReactiveModel|Array} id
   * @param {Object} [opts={}]
   * @returns {ReactiveModel|ReactiveModel[]}
   */
  remove(id, opts = {}) {
    const model = isString(id) ? this.get(id) : id;
    if (!model) return undefined;
    const result = this._collection.remove(model, opts);
    this._updateCache();
    return result;
  }

  /**
   * Clear all items
   * @param {Object} [opts={}]
   * @returns {this}
   */
  clear(opts = {}) {
    this._collection.reset([], opts);
    this._itemCache.clear();
    return this;
  }

  /**
   * Get project data for storage
   * @param {Object} [data={}]
   * @returns {Object}
   */
  getProjectData(data = {}) {
    const key = this._getStorageKey();
    if (!key) return data;

    if (Array.isArray(key)) {
      for (const k of key) {
        data[k] = this._collection.toJSON();
      }
    } else {
      data[key] = this._collection.toJSON();
    }

    return data;
  }

  /**
   * Load project data from storage
   * @param {Object} data
   * @returns {this}
   */
  loadProjectData(data = {}) {
    const key = this._getStorageKey();
    if (!key) return this;

    const stored = Array.isArray(key) ? data[key[0]] : data[key];
    if (stored && Array.isArray(stored)) {
      this._collection.reset(stored, { silent: false });
      this._updateCache();
    }

    return this;
  }

  /**
   * Check if module is storable
   * @returns {boolean}
   */
  get isStorable() {
    return !!this.storageKey;
  }

  /**
   * Get storage key
   * @private
   * @returns {string|string[]|null}
   */
  _getStorageKey() {
    return this.storageKey || null;
  }

  /**
   * Update the lookup cache
   * @private
   */
  _updateCache() {
    this._itemCache.clear();
    for (const model of this._collection) {
      if (model.id != null) {
        this._itemCache.set(String(model.id), model);
      }
      if (model.get('name')) {
        this._itemCache.set(model.get('name'), model);
      }
    }
  }

  /**
   * Setup event propagation from collection to module
   * @private
   */
  _setupEventPropagation() {
    const events = this.events || {};

    this.listenTo(this._collection, 'add', (model, collection, opts) => {
      if (events.add) this.trigger(events.add, model, opts);
      this._em?.trigger(events.add, model, opts);
    });

    this.listenTo(this._collection, 'remove', (model, collection, opts) => {
      if (events.remove) this.trigger(events.remove, model, opts);
      this._em?.trigger(events.remove, model, opts);
    });

    this.listenTo(this._collection, 'change', (model, opts) => {
      if (events.update) this.trigger(events.update, model, opts);
      this._em?.trigger(events.update, model, opts);
    });

    this.listenTo(this._collection, 'reset', (collection, opts) => {
      if (events.reset) this.trigger(events.reset, collection, opts);
      this._em?.trigger(events.reset, collection, opts);
    });
  }

  /**
   * Destroy module and collection
   */
  destroy() {
    this._collection.destroy();
    this._itemCache.clear();
    super.destroy();
  }
}
