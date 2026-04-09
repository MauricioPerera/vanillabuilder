import { describe, it, expect, vi, beforeEach } from 'vitest';
import UndoManager from '../../src/undo_manager/index.js';

describe('UndoManager', () => {
  let mockEditor;
  let um;

  beforeEach(() => {
    mockEditor = {
      getConfig: (k) => k ? undefined : {},
      getModule: () => null,
      on: () => {},
      trigger: () => {},
      t: (k) => k,
    };
    um = new UndoManager(mockEditor);
  });

  it('should undo the last change', () => {
    const model = { set: vi.fn() };
    um.record({ type: 'change', model, key: 'color', before: 'red', after: 'blue' });
    const entry = um.undo();
    expect(entry).toBeDefined();
    expect(model.set).toHaveBeenCalledWith('color', 'red', expect.any(Object));
  });

  it('should redo an undone change', () => {
    const model = { set: vi.fn() };
    um.record({ type: 'change', model, key: 'color', before: 'red', after: 'blue' });
    um.undo();
    model.set.mockClear();
    const entry = um.redo();
    expect(entry).toBeDefined();
    expect(model.set).toHaveBeenCalledWith('color', 'blue', expect.any(Object));
  });

  it('should clear both stacks', () => {
    const model = { set: vi.fn() };
    um.record({ type: 'change', model, key: 'x', before: 1, after: 2 });
    um.clear();
    expect(um.hasUndo()).toBe(false);
    expect(um.hasRedo()).toBe(false);
  });

  it('should report hasUndo correctly', () => {
    expect(um.hasUndo()).toBe(false);
    um.record({ type: 'change', model: {}, before: 'a', after: 'b' });
    expect(um.hasUndo()).toBe(true);
  });

  it('should report hasRedo correctly', () => {
    expect(um.hasRedo()).toBe(false);
    const model = { set: vi.fn() };
    um.record({ type: 'change', model, key: 'k', before: 'a', after: 'b' });
    um.undo();
    expect(um.hasRedo()).toBe(true);
  });

  it('should return the undo stack via getStack', () => {
    um.record({ type: 'change', model: {}, before: 'a', after: 'b' });
    um.record({ type: 'change', model: {}, before: 'c', after: 'd' });
    const stack = um.getStack();
    expect(stack).toHaveLength(2);
  });

  it('should return the redo stack via getRedoStack', () => {
    const model = { set: vi.fn() };
    um.record({ type: 'change', model, key: 'k', before: 'a', after: 'b' });
    um.undo();
    const redoStack = um.getRedoStack();
    expect(redoStack).toHaveLength(1);
  });

  it('should group changes with start/stop', () => {
    const model = { set: vi.fn() };
    um.start();
    um.record({ type: 'change', model, key: 'a', before: 1, after: 2 });
    um.record({ type: 'change', model, key: 'b', before: 3, after: 4 });
    um.stop();
    expect(um.getStack()).toHaveLength(1);
    expect(um.getStack()[0].type).toBe('group');
    expect(um.getStack()[0].entries).toHaveLength(2);
  });

  it('should undo a group in reverse order', () => {
    const model = { set: vi.fn() };
    um.start();
    um.record({ type: 'change', model, key: 'a', before: 'old_a', after: 'new_a' });
    um.record({ type: 'change', model, key: 'b', before: 'old_b', after: 'new_b' });
    um.stop();
    um.undo();
    // Should have called set for 'b' first (reverse), then 'a'
    expect(model.set).toHaveBeenCalledWith('b', 'old_b', expect.any(Object));
    expect(model.set).toHaveBeenCalledWith('a', 'old_a', expect.any(Object));
  });

  it('should return null when nothing to undo', () => {
    expect(um.undo()).toBeNull();
  });

  it('should return null when nothing to redo', () => {
    expect(um.redo()).toBeNull();
  });

  it('should clear redo stack on new record', () => {
    const model = { set: vi.fn() };
    um.record({ type: 'change', model, key: 'k', before: 'a', after: 'b' });
    um.undo();
    expect(um.hasRedo()).toBe(true);
    um.record({ type: 'change', model: {}, before: 'x', after: 'y' });
    expect(um.hasRedo()).toBe(false);
  });

  it('should not record when tracking is paused', () => {
    um.pause();
    um.record({ type: 'change', model: {}, before: 'a', after: 'b' });
    expect(um.hasUndo()).toBe(false);
    um.resume();
    um.record({ type: 'change', model: {}, before: 'a', after: 'b' });
    expect(um.hasUndo()).toBe(true);
  });

  it('should enforce max stack size', () => {
    for (let i = 0; i < 60; i++) {
      um.record({ type: 'change', model: {}, before: i, after: i + 1 });
    }
    expect(um.getStack().length).toBeLessThanOrEqual(50);
  });

  it('should report isTracking state', () => {
    expect(um.isTracking()).toBe(true);
    um.pause();
    expect(um.isTracking()).toBe(false);
    um.resume();
    expect(um.isTracking()).toBe(true);
  });

  it('should not push empty group on stop', () => {
    um.start();
    um.stop();
    expect(um.getStack()).toHaveLength(0);
  });
});
