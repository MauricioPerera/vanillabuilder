/**
 * DataSourceManager - Module for managing data sources
 *
 * Provides CRUD operations for DataSource models and enables
 * data binding between components and external data.
 */

import { ItemManagerModule } from '../core/index.js';
import DataSource from './model/DataSource.js';

export default class DataSourceManager extends ItemManagerModule {
  /**
   * @param {import('../editor/EditorModel.js').default} editor
   * @param {Object} [config={}]
   */
  constructor(editor, config = {}) {
    super(editor, config, {
      stylePrefix: 'ds-',
    });

    this.storageKey = 'dataSources';

    this.events = {
      add: 'data:add',
      remove: 'data:remove',
      update: 'data:update',
      reset: 'data:reset',
    };

    // Add default data sources from config
    const defaults = this.getConfig('dataSources') || [];
    if (defaults.length) {
      this.add(defaults);
    }

    this.onInit();
  }

  /** @type {typeof DataSource} */
  get Model() {
    return DataSource;
  }

  /**
   * Add a data source
   * @param {Object|Object[]} source - Data source config or array
   * @param {Object} [opts={}]
   * @returns {DataSource|DataSource[]}
   */
  add(source, opts = {}) {
    return super.add(source, opts);
  }

  /**
   * Get a data source by ID
   * @param {string} id
   * @returns {DataSource|undefined}
   */
  get(id) {
    return super.get(id);
  }

  /**
   * Get all data sources
   * @returns {DataSource[]}
   */
  getAll() {
    return super.getAll();
  }

  /**
   * Remove a data source by ID
   * @param {string} id
   * @param {Object} [opts={}]
   * @returns {DataSource|undefined}
   */
  remove(id, opts = {}) {
    return super.remove(id, opts);
  }

  /**
   * Get all records from a specific data source
   * @param {string} dataSourceId
   * @returns {Object[]}
   */
  getRecords(dataSourceId) {
    const ds = this.get(dataSourceId);
    return ds ? ds.getRecords() : [];
  }

  /**
   * Add a record to a data source
   * @param {string} dataSourceId
   * @param {Object} record
   * @returns {Object|undefined}
   */
  addRecord(dataSourceId, record) {
    const ds = this.get(dataSourceId);
    return ds ? ds.addRecord(record) : undefined;
  }

  /**
   * Remove a record from a data source
   * @param {string} dataSourceId
   * @param {string|number} recordId
   * @returns {Object|undefined}
   */
  removeRecord(dataSourceId, recordId) {
    const ds = this.get(dataSourceId);
    return ds ? ds.removeRecord(recordId) : undefined;
  }
}
