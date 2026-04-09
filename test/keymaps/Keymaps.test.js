import { describe, it, expect, vi, beforeEach } from 'vitest';
import KeymapModule from '../../src/keymaps/index.js';

describe('KeymapModule', () => {
  let mockEditor;
  let km;

  beforeEach(() => {
    mockEditor = {
      getConfig: (k) => k ? undefined : {},
      getModule: () => null,
      on: () => {},
      trigger: () => {},
      t: (k) => k,
    };
    km = new KeymapModule(mockEditor);
  });

  it('should add a keymap with id, keys, and handler', () => {
    const handler = vi.fn();
    const result = km.add('test:action', 'ctrl+s', handler);
    expect(result.id).toBe('test:action');
    expect(result.keys).toBe('ctrl+s');
    expect(result.handler).toBe(handler);
  });

  it('should get a keymap by id', () => {
    km.add('my:keymap', 'ctrl+a', vi.fn());
    const keymap = km.get('my:keymap');
    expect(keymap).toBeDefined();
    expect(keymap.id).toBe('my:keymap');
  });

  it('should return undefined for unknown keymap id', () => {
    expect(km.get('nonexistent')).toBeUndefined();
  });

  it('should getAll returning all keymaps', () => {
    const all = km.getAll();
    expect(Array.isArray(all)).toBe(true);
    expect(all.length).toBeGreaterThan(0);
  });

  it('should remove a keymap by id', () => {
    km.add('removable', 'ctrl+r', vi.fn());
    const removed = km.remove('removable');
    expect(removed).toBeDefined();
    expect(removed.id).toBe('removable');
    expect(km.get('removable')).toBeUndefined();
  });

  it('should removeAll clearing everything', () => {
    km.removeAll();
    expect(km.getAll()).toHaveLength(0);
  });

  it('should have default keymaps registered for undo', () => {
    const undo = km.get('core:undo');
    expect(undo).toBeDefined();
    expect(undo.keys).toContain('z');
  });

  it('should have default keymaps registered for redo', () => {
    const redo = km.get('core:redo');
    expect(redo).toBeDefined();
    expect(redo.keys).toContain('shift');
    expect(redo.keys).toContain('z');
  });

  it('should have default keymap for copy', () => {
    const copy = km.get('core:copy');
    expect(copy).toBeDefined();
    expect(copy.keys).toContain('c');
  });

  it('should have default keymap for paste', () => {
    const paste = km.get('core:paste');
    expect(paste).toBeDefined();
    expect(paste.keys).toContain('v');
  });

  it('should have default keymap for delete', () => {
    const del = km.get('core:delete');
    expect(del).toBeDefined();
    expect(del.keys).toBe('backspace');
  });

  it('should parse key combinations correctly', () => {
    const handler = vi.fn();
    const keymap = km.add('test:combo', 'ctrl+shift+a', handler);
    expect(keymap.parsed.ctrl).toBe(true);
    expect(keymap.parsed.shift).toBe(true);
    expect(keymap.parsed.key).toBe('a');
  });

  it('should enable and disable keymap processing', () => {
    km.disable();
    expect(km._active).toBe(false);
    km.enable();
    expect(km._active).toBe(true);
  });

  it('should override an existing keymap when re-added with same id', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    km.add('test:override', 'ctrl+x', handler1);
    km.add('test:override', 'ctrl+y', handler2);
    const keymap = km.get('test:override');
    expect(keymap.keys).toBe('ctrl+y');
    expect(keymap.handler).toBe(handler2);
  });

  it('should trigger keymap:add event when adding', () => {
    const fn = vi.fn();
    km.on('keymap:add', fn);
    km.add('evt:test', 'ctrl+t', vi.fn());
    expect(fn).toHaveBeenCalled();
  });

  it('should trigger keymap:remove event when removing', () => {
    km.add('evt:rem', 'ctrl+r', vi.fn());
    const fn = vi.fn();
    km.on('keymap:remove', fn);
    km.remove('evt:rem');
    expect(fn).toHaveBeenCalled();
  });
});
