import { describe, it, expect, vi } from 'vitest';
import ReactiveModel from '../../src/core/ReactiveModel.js';

describe('ReactiveModel', () => {
  it('should initialize with attributes', () => {
    const m = new ReactiveModel({ name: 'test', value: 42 });
    expect(m.get('name')).toBe('test');
    expect(m.get('value')).toBe(42);
  });

  it('should have unique cid', () => {
    const a = new ReactiveModel();
    const b = new ReactiveModel();
    expect(a.cid).not.toBe(b.cid);
  });

  it('should apply defaults', () => {
    class MyModel extends ReactiveModel {
      defaults() { return { color: 'red', size: 10 }; }
    }
    const m = new MyModel({ color: 'blue' });
    expect(m.get('color')).toBe('blue');
    expect(m.get('size')).toBe(10);
  });

  it('should fire change events on set', () => {
    const m = new ReactiveModel({ x: 1 });
    const changeFn = vi.fn();
    const changeXFn = vi.fn();
    m.on('change', changeFn);
    m.on('change:x', changeXFn);
    m.set('x', 2);
    expect(changeFn).toHaveBeenCalledTimes(1);
    expect(changeXFn).toHaveBeenCalledWith(m, 2, {});
  });

  it('should not fire if value unchanged', () => {
    const m = new ReactiveModel({ x: 1 });
    const fn = vi.fn();
    m.on('change', fn);
    m.set('x', 1);
    expect(fn).not.toHaveBeenCalled();
  });

  it('should support silent option', () => {
    const m = new ReactiveModel({ x: 1 });
    const fn = vi.fn();
    m.on('change', fn);
    m.set('x', 2, { silent: true });
    expect(fn).not.toHaveBeenCalled();
    expect(m.get('x')).toBe(2);
  });

  it('should set multiple attributes at once', () => {
    const m = new ReactiveModel();
    const fn = vi.fn();
    m.on('change', fn);
    m.set({ a: 1, b: 2, c: 3 });
    expect(m.get('a')).toBe(1);
    expect(m.get('b')).toBe(2);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should track previous attributes', () => {
    const m = new ReactiveModel({ x: 1 });
    m.set('x', 2);
    expect(m.previous('x')).toBe(1);
  });

  it('should support has()', () => {
    const m = new ReactiveModel({ a: 1 });
    expect(m.has('a')).toBe(true);
    expect(m.has('b')).toBe(false);
  });

  it('should support unset()', () => {
    const m = new ReactiveModel({ a: 1 });
    m.unset('a');
    expect(m.has('a')).toBe(false);
  });

  it('should support clear()', () => {
    const m = new ReactiveModel({ a: 1, b: 2 });
    m.clear();
    expect(m.has('a')).toBe(false);
    expect(m.has('b')).toBe(false);
  });

  it('should serialize to JSON', () => {
    const m = new ReactiveModel({ name: 'test', val: 42 });
    const json = m.toJSON();
    expect(json).toEqual({ name: 'test', val: 42 });
  });

  it('should clone', () => {
    const m = new ReactiveModel({ x: 1 });
    const c = m.clone();
    expect(c.get('x')).toBe(1);
    expect(c.cid).not.toBe(m.cid);
    c.set('x', 2);
    expect(m.get('x')).toBe(1);
  });

  it('should support pick and omit', () => {
    const m = new ReactiveModel({ a: 1, b: 2, c: 3 });
    expect(m.pick('a', 'c')).toEqual({ a: 1, c: 3 });
    expect(m.omit('b')).toEqual({ a: 1, c: 3 });
  });

  it('should set id from attributes', () => {
    const m = new ReactiveModel({ id: 'myid' });
    expect(m.id).toBe('myid');
  });

  it('should fire destroy event', () => {
    const m = new ReactiveModel();
    const fn = vi.fn();
    m.on('destroy', fn);
    m.destroy();
    expect(fn).toHaveBeenCalled();
  });
});
