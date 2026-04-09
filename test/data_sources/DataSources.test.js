import { describe, it, expect, vi, beforeEach } from 'vitest';
import DataSource from '../../src/data_sources/model/DataSource.js';
import DataVariable from '../../src/data_sources/model/DataVariable.js';
import DataSourceManager from '../../src/data_sources/index.js';

describe('DataSource model', () => {
  it('should create with id, name, and records', () => {
    const ds = new DataSource({
      id: 'users',
      name: 'Users',
      records: [{ id: '1', name: 'Alice' }],
    });
    expect(ds.get('id')).toBe('users');
    expect(ds.get('name')).toBe('Users');
    expect(ds.get('records')).toHaveLength(1);
  });

  it('should have correct defaults', () => {
    const ds = new DataSource();
    expect(ds.get('id')).toBe('');
    expect(ds.get('name')).toBe('');
    expect(ds.get('records')).toEqual([]);
    expect(ds.get('type')).toBe('static');
  });

  it('should return records array via getRecords', () => {
    const records = [{ id: '1', name: 'Alice' }, { id: '2', name: 'Bob' }];
    const ds = new DataSource({ records });
    const result = ds.getRecords();
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Alice');
  });

  it('should return a copy of records (not a reference)', () => {
    const ds = new DataSource({ records: [{ id: '1', name: 'A' }] });
    const r1 = ds.getRecords();
    r1.push({ id: '2', name: 'B' });
    expect(ds.getRecords()).toHaveLength(1);
  });

  it('should add a record via addRecord', () => {
    const ds = new DataSource({ id: 'ds1', records: [] });
    const record = ds.addRecord({ id: 'r1', value: 'hello' });
    expect(record.id).toBe('r1');
    expect(ds.getRecords()).toHaveLength(1);
  });

  it('should auto-generate id when adding record without one', () => {
    const ds = new DataSource({ records: [] });
    const record = ds.addRecord({ value: 'test' });
    expect(record.id).toBeDefined();
    expect(typeof record.id).toBe('string');
  });

  it('should get a record by id', () => {
    const ds = new DataSource({ records: [{ id: 'r1', name: 'A' }, { id: 'r2', name: 'B' }] });
    const record = ds.getRecord('r2');
    expect(record).toBeDefined();
    expect(record.name).toBe('B');
  });

  it('should return undefined for unknown record id', () => {
    const ds = new DataSource({ records: [] });
    expect(ds.getRecord('nope')).toBeUndefined();
  });

  it('should remove a record by id', () => {
    const ds = new DataSource({ records: [{ id: 'r1', name: 'A' }, { id: 'r2', name: 'B' }] });
    const removed = ds.removeRecord('r1');
    expect(removed).toBeDefined();
    expect(removed.name).toBe('A');
    expect(ds.getRecords()).toHaveLength(1);
  });

  it('should return undefined when removing nonexistent record', () => {
    const ds = new DataSource({ records: [] });
    expect(ds.removeRecord('nope')).toBeUndefined();
  });

  it('should return record count via getRecordCount', () => {
    const ds = new DataSource({ records: [{ id: '1' }, { id: '2' }, { id: '3' }] });
    expect(ds.getRecordCount()).toBe(3);
  });

  it('should update a record', () => {
    const ds = new DataSource({ records: [{ id: 'r1', name: 'Old' }] });
    const updated = ds.updateRecord('r1', { name: 'New' });
    expect(updated.name).toBe('New');
  });
});

describe('DataVariable', () => {
  it('should have correct defaults', () => {
    const dv = new DataVariable();
    expect(dv.get('type')).toBe('data-variable');
    expect(dv.get('path')).toBe('');
    expect(dv.get('dataSourceId')).toBe('');
    expect(dv.get('defaultValue')).toBe('');
  });

  it('should resolve a path from a data source', () => {
    const dv = new DataVariable({
      dataSourceId: 'users',
      path: '0.name',
      defaultValue: 'N/A',
    });
    const mockDs = {
      getRecords: () => [{ id: '1', name: 'Alice' }, { id: '2', name: 'Bob' }],
    };
    const dataSources = new Map([['users', mockDs]]);
    expect(dv.resolve(dataSources)).toBe('Alice');
  });

  it('should return defaultValue when path cannot be resolved', () => {
    const dv = new DataVariable({
      dataSourceId: 'users',
      path: '99.name',
      defaultValue: 'N/A',
    });
    const mockDs = {
      getRecords: () => [{ id: '1', name: 'Alice' }],
    };
    const dataSources = new Map([['users', mockDs]]);
    expect(dv.resolve(dataSources)).toBe('N/A');
  });

  it('should return defaultValue when data source not found', () => {
    const dv = new DataVariable({
      dataSourceId: 'missing',
      path: '0.name',
      defaultValue: 'fallback',
    });
    const dataSources = new Map();
    expect(dv.resolve(dataSources)).toBe('fallback');
  });

  it('should return defaultValue when path or dataSourceId is empty', () => {
    const dv = new DataVariable({ defaultValue: 'empty' });
    expect(dv.resolve(new Map())).toBe('empty');
  });

  it('should resolve nested path', () => {
    const dv = new DataVariable({
      dataSourceId: 'ds',
      path: '0.address.city',
    });
    const mockDs = {
      getRecords: () => [{ id: '1', address: { city: 'NYC' } }],
    };
    expect(dv.resolve(new Map([['ds', mockDs]]))).toBe('NYC');
  });
});

describe('DataSourceManager', () => {
  let mockEditor;
  let dsm;

  beforeEach(() => {
    mockEditor = {
      getConfig: (k) => k ? undefined : {},
      getModule: () => null,
      on: () => {},
      trigger: () => {},
      t: (k) => k,
    };
    dsm = new DataSourceManager(mockEditor);
  });

  it('should have storageKey set to dataSources', () => {
    expect(dsm.storageKey).toBe('dataSources');
  });

  it('should add a data source', () => {
    dsm.add({ id: 'products', name: 'Products', records: [] });
    const ds = dsm.get('products');
    expect(ds).toBeDefined();
    expect(ds.get('name')).toBe('Products');
  });

  it('should get a data source by id', () => {
    dsm.add({ id: 'ds1', name: 'DS 1' });
    expect(dsm.get('ds1')).toBeDefined();
  });

  it('should return undefined for unknown data source id', () => {
    expect(dsm.get('nonexistent')).toBeUndefined();
  });

  it('should remove a data source', () => {
    dsm.add({ id: 'temp', name: 'Temp' });
    const removed = dsm.remove('temp');
    expect(removed).toBeDefined();
    expect(dsm.get('temp')).toBeUndefined();
  });

  it('should getAll returning all data sources', () => {
    dsm.add({ id: 'a', name: 'A' });
    dsm.add({ id: 'b', name: 'B' });
    expect(dsm.getAll()).toHaveLength(2);
  });

  it('should getRecords from a specific data source', () => {
    dsm.add({ id: 'ds', records: [{ id: '1', val: 'x' }] });
    const records = dsm.getRecords('ds');
    expect(records).toHaveLength(1);
    expect(records[0].val).toBe('x');
  });

  it('should addRecord to a specific data source', () => {
    dsm.add({ id: 'ds', records: [] });
    dsm.addRecord('ds', { id: 'r1', val: 'y' });
    expect(dsm.getRecords('ds')).toHaveLength(1);
  });

  it('should removeRecord from a specific data source', () => {
    dsm.add({ id: 'ds', records: [{ id: 'r1' }, { id: 'r2' }] });
    dsm.removeRecord('ds', 'r1');
    expect(dsm.getRecords('ds')).toHaveLength(1);
  });
});
