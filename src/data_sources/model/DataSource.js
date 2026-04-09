/**
 * DataSource - Model representing a data source with records
 *
 * A data source holds a collection of records that can be bound
 * to components via DataVariable models.
 */

import { ReactiveModel } from '../../core/index.js';

export default class DataSource extends ReactiveModel {
  defaults() {
    return {
      /** @type {string} Unique identifier */
      id: '',
      /** @type {string} Human-readable name */
      name: '',
      /** @type {Object[]} Array of record objects */
      records: [],
      /** @type {string} Optional fetch URL for remote data */
      url: '',
      /** @type {string} Type of data source: 'static' | 'remote' */
      type: 'static',
    };
  }

  /**
   * Get all records
   * @returns {Object[]}
   */
  getRecords() {
    return [...(this.get('records') || [])];
  }

  /**
   * Get a record by id
   * @param {string|number} id
   * @returns {Object|undefined}
   */
  getRecord(id) {
    const records = this.get('records') || [];
    return records.find(r => r.id === id || r.id === String(id));
  }

  /**
   * Add a record
   * @param {Object} record
   * @returns {Object} The added record
   */
  addRecord(record) {
    const records = this.getRecords();
    if (!record.id) {
      record.id = `rec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    }
    records.push(record);
    this.set('records', records);
    this.trigger('record:add', record);
    return record;
  }

  /**
   * Remove a record by id
   * @param {string|number} id
   * @returns {Object|undefined} The removed record
   */
  removeRecord(id) {
    const records = this.get('records') || [];
    const idx = records.findIndex(r => r.id === id || r.id === String(id));
    if (idx < 0) return undefined;

    const removed = records.splice(idx, 1)[0];
    this.set('records', [...records]);
    this.trigger('record:remove', removed);
    return removed;
  }

  /**
   * Update a record
   * @param {string|number} id
   * @param {Object} data - Partial record data to merge
   * @returns {Object|undefined} The updated record
   */
  updateRecord(id, data) {
    const records = this.get('records') || [];
    const record = records.find(r => r.id === id || r.id === String(id));
    if (!record) return undefined;

    Object.assign(record, data);
    this.set('records', [...records]);
    this.trigger('record:update', record);
    return record;
  }

  /**
   * Get the record count
   * @returns {number}
   */
  getRecordCount() {
    return (this.get('records') || []).length;
  }
}
