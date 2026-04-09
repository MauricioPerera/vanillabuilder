/**
 * ReactiveCollection - Reactive array replacing Backbone.Collection
 *
 * Manages an ordered set of ReactiveModel instances with events.
 * Fires 'add', 'remove', 'reset', 'sort', 'update' events.
 * Propagates child model 'change' events.
 *
 * @example
 * const col = new ReactiveCollection([{ id: 1, name: 'A' }]);
 * col.on('add', (model) => console.log('Added:', model.get('name')));
 * col.add({ id: 2, name: 'B' }); // logs "Added: B"
 */

import EventEmitter from './EventEmitter.js';
import ReactiveModel from './ReactiveModel.js';
import { isFunction, isString, createId, removeFromArray } from './utils.js';

export default class ReactiveCollection extends EventEmitter {
  /**
   * @param {Array<Object|ReactiveModel>} [models=[]]
   * @param {Object} [options={}]
   * @param {typeof ReactiveModel} [options.model] - Model class to use
   * @param {Function} [options.comparator] - Sort comparator
   */
  constructor(models = [], options = {}) {
    super();

    /** @type {string} Unique client ID */
    this.cid = createId('col');

    /** @type {typeof ReactiveModel} Model class for this collection */
    this.model = options.model || this.constructor.model || ReactiveModel;

    /** @type {Function|null} Comparator for sorting */
    this.comparator = options.comparator || this.constructor.comparator || null;

    /** @type {ReactiveModel[]} Internal array of models */
    this._models = [];

    /** @type {Map<string, ReactiveModel>} Index by id */
    this._byId = new Map();

    /** @type {Map<string, ReactiveModel>} Index by cid */
    this._byCid = new Map();

    this.initialize(models, options);

    // Add initial models silently
    if (models && models.length) {
      this.reset(models, { silent: true });
    }
  }

  /**
   * Override in subclasses
   * @param {Array} models
   * @param {Object} options
   */
  initialize(models, options) {}

  /**
   * Number of models
   * @returns {number}
   */
  get length() {
    return this._models.length;
  }

  /**
   * Array of models (read-only copy)
   * @returns {ReactiveModel[]}
   */
  get models() {
    return this._models;
  }

  /**
   * Add model(s) to the collection
   * @param {Object|ReactiveModel|Array} models
   * @param {Object} [options={}]
   * @param {number} [options.at] - Index to insert at
   * @param {boolean} [options.silent=false]
   * @param {boolean} [options.merge=false] - Merge if exists
   * @returns {ReactiveModel|ReactiveModel[]}
   */
  add(models, options = {}) {
    const singular = !Array.isArray(models);
    const modelsArray = singular ? [models] : [...models];
    const { at, silent = false, merge = false } = options;
    const added = [];

    for (let i = 0; i < modelsArray.length; i++) {
      let model = modelsArray[i];

      // Convert plain object to model instance
      if (!(model instanceof ReactiveModel)) {
        model = this._prepareModel(model, options);
      }

      if (!model) continue;

      // Check for duplicates
      const existing = this.get(model.id) || this._byCid.get(model.cid);
      if (existing) {
        if (merge) {
          existing.set(model.toJSON(), options);
        }
        continue;
      }

      // Set collection reference
      model.collection = this;

      // Index
      this._indexModel(model);

      // Insert at position
      const insertAt = at != null ? at + i : this._models.length;
      this._models.splice(insertAt, 0, model);

      // Listen to model events
      this._addModelListeners(model);

      added.push(model);
    }

    // Sort if needed
    if (this.comparator && added.length) {
      this.sort({ silent: true });
    }

    // Fire events
    if (!silent) {
      for (const model of added) {
        this.trigger('add', model, this, options);
      }
      if (added.length) {
        this.trigger('update', this, options);
      }
    }

    return singular ? added[0] : added;
  }

  /**
   * Remove model(s) from the collection
   * @param {ReactiveModel|ReactiveModel[]|string} models - Model, array, or id
   * @param {Object} [options={}]
   * @returns {ReactiveModel|ReactiveModel[]}
   */
  remove(models, options = {}) {
    const singular = !Array.isArray(models);
    const modelsArray = singular ? [models] : [...models];
    const { silent = false } = options;
    const removed = [];

    for (const item of modelsArray) {
      const model = this._resolveModel(item);
      if (!model) continue;

      const idx = this._models.indexOf(model);
      if (idx === -1) continue;

      this._models.splice(idx, 1);
      this._unindexModel(model);
      this._removeModelListeners(model);

      model.collection = null;
      removed.push(model);

      if (!silent) {
        options.index = idx;
        this.trigger('remove', model, this, options);
      }
    }

    if (!silent && removed.length) {
      this.trigger('update', this, options);
    }

    return singular ? removed[0] : removed;
  }

  /**
   * Replace all models
   * @param {Array} models
   * @param {Object} [options={}]
   * @returns {ReactiveModel[]}
   */
  reset(models = [], options = {}) {
    const { silent = false } = options;

    // Remove all current models
    for (const model of this._models) {
      this._removeModelListeners(model);
      model.collection = null;
    }

    this._models = [];
    this._byId.clear();
    this._byCid.clear();

    // Add new models
    const added = this.add(models, { silent: true });

    if (!silent) {
      this.trigger('reset', this, options);
    }

    return Array.isArray(added) ? added : [added].filter(Boolean);
  }

  /**
   * Get model by id, cid, or model instance
   * @param {string|number|ReactiveModel} id
   * @returns {ReactiveModel|undefined}
   */
  get(id) {
    if (id == null) return undefined;
    if (id instanceof ReactiveModel) return id;
    const strId = String(id);
    return this._byId.get(strId) || this._byCid.get(strId);
  }

  /**
   * Get model at index
   * @param {number} index
   * @returns {ReactiveModel|undefined}
   */
  at(index) {
    if (index < 0) index = this._models.length + index;
    return this._models[index];
  }

  /**
   * Find first model matching predicate
   * @param {Function|Object} predicate
   * @returns {ReactiveModel|undefined}
   */
  find(predicate) {
    if (isFunction(predicate)) {
      return this._models.find(predicate);
    }
    // Object match
    return this._models.find(m => {
      return Object.entries(predicate).every(([k, v]) => m.get(k) === v);
    });
  }

  /**
   * Find model by attribute match
   * @param {Object} attrs
   * @returns {ReactiveModel|undefined}
   */
  findWhere(attrs) {
    return this.find(attrs);
  }

  /**
   * Filter models
   * @param {Function|Object} predicate
   * @returns {ReactiveModel[]}
   */
  filter(predicate) {
    if (isFunction(predicate)) {
      return this._models.filter(predicate);
    }
    return this._models.filter(m => {
      return Object.entries(predicate).every(([k, v]) => m.get(k) === v);
    });
  }

  /**
   * Filter models by attribute match
   * @param {Object} attrs
   * @returns {ReactiveModel[]}
   */
  where(attrs) {
    return this.filter(attrs);
  }

  /**
   * Map over models
   * @param {Function} fn
   * @returns {Array}
   */
  map(fn) {
    return this._models.map(fn);
  }

  /**
   * Iterate over models
   * @param {Function} fn
   */
  forEach(fn) {
    this._models.forEach(fn);
  }

  /**
   * Reduce models
   * @param {Function} fn
   * @param {any} initial
   * @returns {any}
   */
  reduce(fn, initial) {
    return this._models.reduce(fn, initial);
  }

  /**
   * Check if any model matches
   * @param {Function} predicate
   * @returns {boolean}
   */
  some(predicate) {
    return this._models.some(predicate);
  }

  /**
   * Check if all models match
   * @param {Function} predicate
   * @returns {boolean}
   */
  every(predicate) {
    return this._models.every(predicate);
  }

  /**
   * Get index of model
   * @param {ReactiveModel} model
   * @returns {number}
   */
  indexOf(model) {
    return this._models.indexOf(model);
  }

  /**
   * Check if collection includes model
   * @param {ReactiveModel|string} model
   * @returns {boolean}
   */
  includes(model) {
    return !!this.get(model);
  }

  /**
   * Sort the collection
   * @param {Object} [options={}]
   * @returns {this}
   */
  sort(options = {}) {
    if (!this.comparator) return this;

    const { silent = false } = options;

    if (isFunction(this.comparator)) {
      if (this.comparator.length === 1) {
        // sortBy style
        this._models.sort((a, b) => {
          const va = this.comparator(a);
          const vb = this.comparator(b);
          if (va < vb) return -1;
          if (va > vb) return 1;
          return 0;
        });
      } else {
        // Direct comparator
        this._models.sort(this.comparator);
      }
    } else if (isString(this.comparator)) {
      const key = this.comparator;
      this._models.sort((a, b) => {
        const va = a.get(key);
        const vb = b.get(key);
        if (va < vb) return -1;
        if (va > vb) return 1;
        return 0;
      });
    }

    if (!silent) {
      this.trigger('sort', this, options);
    }

    return this;
  }

  /**
   * Pluck attribute from all models
   * @param {string} key
   * @returns {Array}
   */
  pluck(key) {
    return this._models.map(m => m.get(key));
  }

  /**
   * Get first model
   * @returns {ReactiveModel|undefined}
   */
  first() {
    return this._models[0];
  }

  /**
   * Get last model
   * @returns {ReactiveModel|undefined}
   */
  last() {
    return this._models[this._models.length - 1];
  }

  /**
   * Check if collection is empty
   * @returns {boolean}
   */
  isEmpty() {
    return this._models.length === 0;
  }

  /**
   * Serialize all models to JSON
   * @returns {Object[]}
   */
  toJSON() {
    return this._models.map(m => m.toJSON());
  }

  /**
   * Make collection iterable
   * @returns {Iterator}
   */
  [Symbol.iterator]() {
    return this._models[Symbol.iterator]();
  }

  /**
   * Prepare a plain object as a model instance
   * @private
   * @param {Object} attrs
   * @param {Object} options
   * @returns {ReactiveModel}
   */
  _prepareModel(attrs, options = {}) {
    const ModelClass = this.model;
    return new ModelClass(attrs, { ...options, collection: this });
  }

  /**
   * Resolve a model from id, cid, or instance
   * @private
   * @param {any} item
   * @returns {ReactiveModel|undefined}
   */
  _resolveModel(item) {
    if (item instanceof ReactiveModel) return item;
    if (item != null) return this.get(item);
    return undefined;
  }

  /**
   * Add model to index maps
   * @private
   * @param {ReactiveModel} model
   */
  _indexModel(model) {
    if (model.id != null) {
      this._byId.set(String(model.id), model);
    }
    this._byCid.set(model.cid, model);
  }

  /**
   * Remove model from index maps
   * @private
   * @param {ReactiveModel} model
   */
  _unindexModel(model) {
    if (model.id != null) {
      this._byId.delete(String(model.id));
    }
    this._byCid.delete(model.cid);
  }

  /**
   * Listen to model events and propagate
   * @private
   * @param {ReactiveModel} model
   */
  _addModelListeners(model) {
    this.listenTo(model, 'all', (event, ...args) => {
      // Propagate model events to collection
      this.trigger(event, ...args);
    });

    // Re-index when id changes
    this.listenTo(model, 'change:id', (m, newId) => {
      const oldId = m.previous('id');
      if (oldId != null) this._byId.delete(String(oldId));
      if (newId != null) this._byId.set(String(newId), m);
    });

    // Handle model destroy
    this.listenTo(model, 'destroy', (m) => {
      this.remove(m);
    });
  }

  /**
   * Stop listening to model events
   * @private
   * @param {ReactiveModel} model
   */
  _removeModelListeners(model) {
    this.stopListening(model);
  }

  /**
   * Destroy: cleanup all models and events
   */
  destroy() {
    for (const model of [...this._models]) {
      this._removeModelListeners(model);
      model.collection = null;
    }
    this._models = [];
    this._byId.clear();
    this._byCid.clear();
    super.destroy();
  }
}
