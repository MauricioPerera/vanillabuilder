/**
 * LocalStorage - Storage adapter using browser localStorage
 *
 * Persists editor project data to the browser's localStorage.
 * Data is serialized as JSON under a configurable key prefix.
 */

export default class LocalStorage {
  /**
   * @param {Object} [config={}]
   * @param {string} [config.key='vanillabuilder-'] - localStorage key prefix
   */
  constructor(config = {}) {
    /** @type {string} Key prefix for localStorage entries */
    this.key = config.key || 'vanillabuilder-';
  }

  /**
   * Store data to localStorage
   * @param {Object} data - Data object to persist
   * @param {Object} [opts={}]
   * @returns {Object} The stored data
   */
  store(data, opts = {}) {
    const key = opts.key || this.key;

    try {
      const serialized = JSON.stringify(data);
      localStorage.setItem(key, serialized);
    } catch (e) {
      console.error('[LocalStorage] Failed to store data:', e.message);
      throw e;
    }

    return data;
  }

  /**
   * Load data from localStorage
   * @param {Object} [opts={}]
   * @returns {Object} The loaded data or empty object
   */
  load(opts = {}) {
    const key = opts.key || this.key;

    try {
      const raw = localStorage.getItem(key);
      if (!raw) return {};
      return JSON.parse(raw);
    } catch (e) {
      console.error('[LocalStorage] Failed to load data:', e.message);
      return {};
    }
  }

  /**
   * Remove stored data
   * @param {Object} [opts={}]
   */
  remove(opts = {}) {
    const key = opts.key || this.key;
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error('[LocalStorage] Failed to remove data:', e.message);
    }
  }

  /**
   * Check if localStorage is available
   * @returns {boolean}
   */
  static isAvailable() {
    try {
      const test = '__vb_test__';
      localStorage.setItem(test, '1');
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }
}
