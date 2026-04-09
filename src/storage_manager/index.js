/**
 * StorageManager - Module for managing project persistence
 *
 * Provides a pluggable storage backend system. Ships with
 * LocalStorage and RemoteStorage adapters. Supports autosave
 * with configurable intervals.
 */

import { Module, debounce, isFunction } from '../core/index.js';
import LocalStorage from './LocalStorage.js';
import RemoteStorage from './RemoteStorage.js';

export default class StorageManager extends Module {
  /**
   * @param {import('../editor/EditorModel.js').default} editor
   * @param {Object} [config={}]
   */
  constructor(editor, config = {}) {
    super(editor, config, {
      stylePrefix: 'sm-',
      /** @type {string} Default storage type: 'local', 'remote', or custom type */
      type: 'local',
      /** @type {boolean} Whether autosave is enabled */
      autosave: true,
      /** @type {number} Autosave interval in milliseconds */
      autoload: true,
      /** @type {number} Autosave debounce interval in ms */
      stepsBeforeSave: 1,
      /** @type {Object} Options for the storage adapters */
      options: {
        local: {
          key: 'vanillabuilder-',
        },
        remote: {
          urlStore: '',
          urlLoad: '',
          headers: {},
          params: {},
          contentTypeJson: 'application/json',
          credentials: 'include',
          fetchOptions: {},
        },
      },
    });

    /** @type {Map<string, Object>} Registry of storage backends */
    this._storages = new Map();

    /** @type {string} Currently active storage type */
    this._currentType = this.getConfig('type') || 'local';

    /** @type {boolean} Whether a store/load operation is in progress */
    this._busy = false;

    /** @type {Function|null} Debounced autosave function */
    this._autosaveFn = null;

    // Register built-in storage adapters
    this._registerDefaults();

    this.onInit();
  }

  /**
   * Register built-in storage adapters
   * @private
   */
  _registerDefaults() {
    const opts = this.getConfig('options') || {};

    this.add('local', new LocalStorage(opts.local || {}));
    this.add('remote', new RemoteStorage(opts.remote || {}));
  }

  /**
   * Register a storage adapter
   * @param {string} type - Storage type identifier
   * @param {Object} storage - Storage adapter (must have store/load methods)
   * @returns {this}
   */
  add(type, storage) {
    if (!storage || (!isFunction(storage.store) && !isFunction(storage.load))) {
      console.warn(`[StorageManager] Invalid storage adapter for type "${type}"`);
      return this;
    }
    this._storages.set(type, storage);
    return this;
  }

  /**
   * Get a storage adapter by type
   * @param {string} [type] - Storage type (defaults to current)
   * @returns {Object|undefined}
   */
  get(type) {
    return this._storages.get(type || this._currentType);
  }

  /**
   * Set the current storage type
   * @param {string} type
   * @returns {this}
   */
  setCurrent(type) {
    if (!this._storages.has(type)) {
      console.warn(`[StorageManager] Storage type "${type}" not found`);
      return this;
    }
    this._currentType = type;
    return this;
  }

  /**
   * Get the current storage type
   * @returns {string}
   */
  getCurrent() {
    return this._currentType;
  }

  /**
   * Store project data using the current storage adapter
   * @param {Object} data - Project data to store
   * @param {Object} [opts={}]
   * @returns {Promise<Object>|Object}
   */
  async store(data, opts = {}) {
    const storage = this.get(opts.type);
    if (!storage) {
      console.warn('[StorageManager] No storage adapter configured');
      return data;
    }

    this._busy = true;
    this.trigger('storage:start:store', data);
    this._em?.trigger('storage:start:store', data);

    try {
      const result = await storage.store(data, opts);

      this.trigger('storage:store', result);
      this._em?.trigger('storage:store', result);
      this.trigger('storage:end:store', result);
      this._em?.trigger('storage:end:store', result);

      return result;
    } catch (error) {
      this.trigger('storage:error:store', error);
      this._em?.trigger('storage:error:store', error);
      throw error;
    } finally {
      this._busy = false;
    }
  }

  /**
   * Load project data using the current storage adapter
   * @param {Object} [opts={}]
   * @returns {Promise<Object>|Object}
   */
  async load(opts = {}) {
    const storage = this.get(opts.type);
    if (!storage) {
      console.warn('[StorageManager] No storage adapter configured');
      return {};
    }

    this._busy = true;
    this.trigger('storage:start:load');
    this._em?.trigger('storage:start:load');

    try {
      const result = await storage.load(opts);

      this.trigger('storage:load', result);
      this._em?.trigger('storage:load', result);
      this.trigger('storage:end:load', result);
      this._em?.trigger('storage:end:load', result);

      return result;
    } catch (error) {
      this.trigger('storage:error:load', error);
      this._em?.trigger('storage:error:load', error);
      throw error;
    } finally {
      this._busy = false;
    }
  }

  /**
   * Check if autoload is enabled and a storage adapter is available
   * @returns {boolean}
   */
  canAutoload() {
    return !!(this.getConfig('autoload') && this.get());
  }

  /**
   * Check if autosave is enabled
   * @returns {boolean}
   */
  isAutosave() {
    return !!this.getConfig('autosave');
  }

  /**
   * Enable autosave: listens for changes and stores automatically
   * @param {Function} getDataFn - Function that returns the current project data
   * @param {number} [interval=1000] - Debounce interval in ms
   * @returns {this}
   */
  enableAutosave(getDataFn, interval = 1000) {
    if (!isFunction(getDataFn)) return this;

    this.disableAutosave();

    this._autosaveFn = debounce(async () => {
      if (this._busy) return;
      try {
        const data = getDataFn();
        if (data && Object.keys(data).length > 0) {
          await this.store(data);
        }
      } catch (e) {
        console.error('[StorageManager] Autosave failed:', e.message);
      }
    }, interval);

    this._registerDebounced(this._autosaveFn);

    // Listen for changes from the editor
    if (this._em) {
      this.listenTo(this._em, 'change:changesCount', this._autosaveFn);
    }

    return this;
  }

  /**
   * Disable autosave
   * @returns {this}
   */
  disableAutosave() {
    if (this._autosaveFn) {
      this._autosaveFn.cancel?.();
      if (this._em) {
        this.stopListening(this._em, 'change:changesCount');
      }
      this._autosaveFn = null;
    }
    return this;
  }

  /**
   * Check if a store/load operation is in progress
   * @returns {boolean}
   */
  isBusy() {
    return this._busy;
  }

  /**
   * Get all registered storage types
   * @returns {string[]}
   */
  getStorageTypes() {
    return [...this._storages.keys()];
  }

  /**
   * Destroy the module
   */
  destroy() {
    this.disableAutosave();
    this._storages.clear();
    this._busy = false;
    super.destroy();
  }
}
