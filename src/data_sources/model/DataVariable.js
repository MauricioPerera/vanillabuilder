/**
 * DataVariable - Model for binding component properties to data sources
 *
 * A DataVariable references a path within a DataSource and resolves
 * to the corresponding value at runtime.
 */

import { ReactiveModel } from '../../core/index.js';

export default class DataVariable extends ReactiveModel {
  defaults() {
    return {
      /** @type {string} Component type identifier */
      type: 'data-variable',
      /** @type {string} Dot-notation path to data (e.g., 'users.0.name') */
      path: '',
      /** @type {string} Data source ID to read from */
      dataSourceId: '',
      /** @type {any} Fallback value when path cannot be resolved */
      defaultValue: '',
    };
  }

  /**
   * Get the resolved data value from the given data sources
   * @param {Map<string, import('./DataSource.js').default>|Object} dataSources - Map or keyed object of DataSource models
   * @returns {any} The resolved value or defaultValue
   */
  resolve(dataSources) {
    const dsId = this.get('dataSourceId');
    const path = this.get('path');
    const defaultValue = this.get('defaultValue');

    if (!dsId || !path) return defaultValue;

    // Get the data source
    let ds;
    if (dataSources instanceof Map) {
      ds = dataSources.get(dsId);
    } else if (dataSources && typeof dataSources.get === 'function') {
      ds = dataSources.get(dsId);
    } else if (dataSources) {
      ds = dataSources[dsId];
    }

    if (!ds) return defaultValue;

    // Get the records array as the data root
    const records = ds.getRecords ? ds.getRecords() : (ds.get?.('records') ?? ds.records ?? []);

    // Walk the path
    const value = this._resolvePath(records, path);
    return value !== undefined ? value : defaultValue;
  }

  /**
   * Get the data value (shortcut that needs dataSources passed in)
   * @param {Object} dataSources
   * @returns {any}
   */
  getDataValue(dataSources) {
    return this.resolve(dataSources);
  }

  /**
   * Resolve a dot-notation path against a data object
   * @private
   * @param {any} data
   * @param {string} path
   * @returns {any}
   */
  _resolvePath(data, path) {
    if (data == null || !path) return undefined;

    const parts = path.split('.');
    let current = data;

    for (const part of parts) {
      if (current == null) return undefined;

      if (Array.isArray(current)) {
        const idx = parseInt(part, 10);
        if (!isNaN(idx)) {
          current = current[idx];
        } else {
          // Try to find by 'id' field
          current = current.find(r => r.id === part);
        }
      } else if (typeof current === 'object') {
        current = current[part];
      } else {
        return undefined;
      }
    }

    return current;
  }
}
