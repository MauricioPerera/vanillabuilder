import { describe, it, expect, vi } from 'vitest';
import ReactiveCollection from '../../src/core/ReactiveCollection.js';
import ReactiveModel from '../../src/core/ReactiveModel.js';

describe('ReactiveCollection', () => {
  it('should initialize with models', () => {
    const col = new ReactiveCollection([{ id: 1, name: 'A' }, { id: 2, name: 'B' }]);
    expect(col.length).toBe(2);
    expect(col.at(0).get('name')).toBe('A');
  });

  it('should add models and fire add event', () => {
    const col = new ReactiveCollection();
    const fn = vi.fn();
    col.on('add', fn);
    col.add({ id: 1, name: 'test' });
    expect(col.length).toBe(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should remove models and fire remove event', () => {
    const col = new ReactiveCollection([{ id: 1, name: 'A' }]);
    const fn = vi.fn();
    col.on('remove', fn);
    const model = col.at(0);
    col.remove(model);
    expect(col.length).toBe(0);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should get model by id', () => {
    const col = new ReactiveCollection([{ id: 'a' }, { id: 'b' }]);
    const m = col.get('b');
    expect(m).toBeDefined();
    expect(m.id).toBe('b');
  });

  it('should get model by cid', () => {
    const col = new ReactiveCollection([{ name: 'test' }]);
    const model = col.at(0);
    expect(col.get(model.cid)).toBe(model);
  });

  it('should reset collection', () => {
    const col = new ReactiveCollection([{ id: 1 }, { id: 2 }]);
    const fn = vi.fn();
    col.on('reset', fn);
    col.reset([{ id: 3 }]);
    expect(col.length).toBe(1);
    expect(col.at(0).id).toBe(3);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should support find()', () => {
    const col = new ReactiveCollection([{ id: 1, type: 'a' }, { id: 2, type: 'b' }]);
    const m = col.find(m => m.get('type') === 'b');
    expect(m.id).toBe(2);
  });

  it('should support filter()', () => {
    const col = new ReactiveCollection([
      { id: 1, active: true },
      { id: 2, active: false },
      { id: 3, active: true },
    ]);
    const result = col.filter(m => m.get('active'));
    expect(result.length).toBe(2);
  });

  it('should support map()', () => {
    const col = new ReactiveCollection([{ id: 1 }, { id: 2 }]);
    const ids = col.map(m => m.id);
    expect(ids).toEqual([1, 2]);
  });

  it('should support where()', () => {
    const col = new ReactiveCollection([
      { id: 1, color: 'red' },
      { id: 2, color: 'blue' },
      { id: 3, color: 'red' },
    ]);
    const result = col.where({ color: 'red' });
    expect(result.length).toBe(2);
  });

  it('should propagate model change events', () => {
    const col = new ReactiveCollection([{ id: 1, name: 'A' }]);
    const fn = vi.fn();
    col.on('change:name', fn);
    col.at(0).set('name', 'B');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should support pluck()', () => {
    const col = new ReactiveCollection([{ id: 1, name: 'A' }, { id: 2, name: 'B' }]);
    expect(col.pluck('name')).toEqual(['A', 'B']);
  });

  it('should be iterable', () => {
    const col = new ReactiveCollection([{ id: 1 }, { id: 2 }]);
    const items = [...col];
    expect(items.length).toBe(2);
  });

  it('should support sort()', () => {
    const col = new ReactiveCollection([{ id: 3 }, { id: 1 }, { id: 2 }]);
    col.comparator = (a, b) => a.id - b.id;
    col.sort();
    expect(col.at(0).id).toBe(1);
    expect(col.at(2).id).toBe(3);
  });

  it('should serialize to JSON', () => {
    const col = new ReactiveCollection([{ id: 1, name: 'A' }]);
    const json = col.toJSON();
    expect(json).toEqual([{ id: 1, name: 'A' }]);
  });

  it('should add at specific index', () => {
    const col = new ReactiveCollection([{ id: 1 }, { id: 3 }]);
    col.add({ id: 2 }, { at: 1 });
    expect(col.at(1).id).toBe(2);
  });

  it('should prevent duplicates by id', () => {
    const col = new ReactiveCollection([{ id: 1 }]);
    col.add({ id: 1 });
    expect(col.length).toBe(1);
  });

  it('should support includes()', () => {
    const col = new ReactiveCollection([{ id: 'x' }]);
    expect(col.includes('x')).toBe(true);
    expect(col.includes('y')).toBe(false);
  });

  it('first() and last()', () => {
    const col = new ReactiveCollection([{ id: 1 }, { id: 2 }, { id: 3 }]);
    expect(col.first().id).toBe(1);
    expect(col.last().id).toBe(3);
  });

  it('should cleanup on destroy', () => {
    const col = new ReactiveCollection([{ id: 1 }]);
    col.destroy();
    expect(col.length).toBe(0);
  });
});
