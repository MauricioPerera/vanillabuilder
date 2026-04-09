import { describe, it, expect, vi } from 'vitest';
import EventEmitter from '../../src/core/EventEmitter.js';

describe('EventEmitter', () => {
  it('should register and trigger events', () => {
    const em = new EventEmitter();
    const fn = vi.fn();
    em.on('test', fn);
    em.trigger('test', 'a', 'b');
    expect(fn).toHaveBeenCalledWith('a', 'b');
  });

  it('should support multiple events space-separated', () => {
    const em = new EventEmitter();
    const fn = vi.fn();
    em.on('a b c', fn);
    em.trigger('b');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should support once()', () => {
    const em = new EventEmitter();
    const fn = vi.fn();
    em.once('test', fn);
    em.trigger('test');
    em.trigger('test');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should support off() with specific callback', () => {
    const em = new EventEmitter();
    const fn1 = vi.fn();
    const fn2 = vi.fn();
    em.on('test', fn1);
    em.on('test', fn2);
    em.off('test', fn1);
    em.trigger('test');
    expect(fn1).not.toHaveBeenCalled();
    expect(fn2).toHaveBeenCalledTimes(1);
  });

  it('should support off() removing all handlers for event', () => {
    const em = new EventEmitter();
    const fn = vi.fn();
    em.on('test', fn);
    em.off('test');
    em.trigger('test');
    expect(fn).not.toHaveBeenCalled();
  });

  it('should support off() removing all handlers', () => {
    const em = new EventEmitter();
    const fn = vi.fn();
    em.on('a', fn);
    em.on('b', fn);
    em.off();
    em.trigger('a');
    em.trigger('b');
    expect(fn).not.toHaveBeenCalled();
  });

  it('should trigger "all" catch-all event', () => {
    const em = new EventEmitter();
    const fn = vi.fn();
    em.on('all', fn);
    em.trigger('test', 42);
    expect(fn).toHaveBeenCalledWith('test', 42);
  });

  it('should support context binding', () => {
    const em = new EventEmitter();
    const ctx = { val: 42 };
    let result;
    em.on('test', function () { result = this.val; }, ctx);
    em.trigger('test');
    expect(result).toBe(42);
  });

  it('should support listenTo()', () => {
    const em1 = new EventEmitter();
    const em2 = new EventEmitter();
    const fn = vi.fn();
    em1.listenTo(em2, 'test', fn);
    em2.trigger('test', 'data');
    expect(fn).toHaveBeenCalledWith('data');
  });

  it('should support stopListening()', () => {
    const em1 = new EventEmitter();
    const em2 = new EventEmitter();
    const fn = vi.fn();
    em1.listenTo(em2, 'test', fn);
    em1.stopListening(em2);
    em2.trigger('test');
    expect(fn).not.toHaveBeenCalled();
  });

  it('should support stopListening() all', () => {
    const em1 = new EventEmitter();
    const em2 = new EventEmitter();
    const em3 = new EventEmitter();
    const fn = vi.fn();
    em1.listenTo(em2, 'a', fn);
    em1.listenTo(em3, 'b', fn);
    em1.stopListening();
    em2.trigger('a');
    em3.trigger('b');
    expect(fn).not.toHaveBeenCalled();
  });

  it('should support listenToOnce()', () => {
    const em1 = new EventEmitter();
    const em2 = new EventEmitter();
    const fn = vi.fn();
    em1.listenToOnce(em2, 'test', fn);
    em2.trigger('test');
    em2.trigger('test');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('hasListeners should work', () => {
    const em = new EventEmitter();
    expect(em.hasListeners('test')).toBe(false);
    em.on('test', () => {});
    expect(em.hasListeners('test')).toBe(true);
  });

  it('destroy should clean up everything', () => {
    const em1 = new EventEmitter();
    const em2 = new EventEmitter();
    const fn = vi.fn();
    em1.on('test', fn);
    em1.listenTo(em2, 'other', fn);
    em1.destroy();
    em1.trigger('test');
    em2.trigger('other');
    expect(fn).not.toHaveBeenCalled();
  });
});
