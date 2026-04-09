import { describe, it, expect, vi, beforeEach } from 'vitest';
import Block from '../../src/block_manager/model/Block.js';
import BlockManager from '../../src/block_manager/index.js';

/**
 * Helper to create a minimal mock editor (EditorModel) that BlockManager needs.
 * Module base class expects an EventEmitter-like object with trigger/on.
 */
function createEditor(config = {}) {
  const listeners = new Map();
  return {
    trigger: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    getConfig: vi.fn((key) => config[key] || ''),
    t: vi.fn((key) => key),
    Editor: {},
  };
}

// ---------------------------------------------------------------------------
// Block Model
// ---------------------------------------------------------------------------
describe('Block model', () => {
  it('should have correct default values', () => {
    const block = new Block();
    expect(block.get('id')).toBe('');
    expect(block.get('label')).toBe('');
    expect(block.get('content')).toBe('');
    expect(block.get('category')).toBe('');
    expect(block.get('attributes')).toEqual({});
    expect(block.get('media')).toBe('');
    expect(block.get('activate')).toBe(false);
    expect(block.get('select')).toBe(false);
    expect(block.get('resetId')).toBe(false);
    expect(block.get('disable')).toBe(false);
    expect(block.get('render')).toBe(null);
  });

  it('should accept initial attributes', () => {
    const block = new Block({
      id: 'heading',
      label: 'Heading',
      content: '<h1>Title</h1>',
      category: 'Basic',
      media: '<svg></svg>',
    });
    expect(block.get('id')).toBe('heading');
    expect(block.get('label')).toBe('Heading');
    expect(block.get('content')).toBe('<h1>Title</h1>');
    expect(block.get('category')).toBe('Basic');
    expect(block.get('media')).toBe('<svg></svg>');
  });

  it('should set this.id from the id attribute on initialize', () => {
    const block = new Block({ id: 'my-block' });
    expect(block.id).toBe('my-block');
  });

  it('getLabel returns label or falls back to id', () => {
    const block = new Block({ id: 'fallback-id', label: '' });
    expect(block.getLabel()).toBe('fallback-id');

    const block2 = new Block({ id: 'x', label: 'My Label' });
    expect(block2.getLabel()).toBe('My Label');
  });

  it('getLabel returns empty string when no label or id', () => {
    const block = new Block();
    expect(block.getLabel()).toBe('');
  });

  it('getContent returns content string', () => {
    const block = new Block({ content: '<div>hello</div>' });
    expect(block.getContent()).toBe('<div>hello</div>');
  });

  it('getContent returns content object', () => {
    const obj = { type: 'text', content: 'Hi' };
    const block = new Block({ content: obj });
    expect(block.getContent()).toEqual(obj);
  });

  it('getCategory returns category or empty string', () => {
    const block = new Block({ category: 'Layout' });
    expect(block.getCategory()).toBe('Layout');

    const block2 = new Block();
    expect(block2.getCategory()).toBe('');
  });

  it('isDisabled returns false by default', () => {
    const block = new Block();
    expect(block.isDisabled()).toBe(false);
  });

  it('isDisabled returns true when disable is set', () => {
    const block = new Block({ disable: true });
    expect(block.isDisabled()).toBe(true);
  });

  it('should support custom attributes', () => {
    const block = new Block({ attributes: { title: 'Drag me', 'data-type': 'section' } });
    expect(block.get('attributes')).toEqual({ title: 'Drag me', 'data-type': 'section' });
  });
});

// ---------------------------------------------------------------------------
// BlockManager
// ---------------------------------------------------------------------------
describe('BlockManager', () => {
  let bm;
  let editor;

  beforeEach(() => {
    editor = createEditor();
    bm = new BlockManager(editor);
  });

  it('should add a block with id and props', () => {
    const block = bm.add('text-block', { label: 'Text', content: '<p>text</p>' });
    expect(block).toBeDefined();
    expect(block.get('id')).toBe('text-block');
    expect(block.get('label')).toBe('Text');
    expect(block.get('content')).toBe('<p>text</p>');
  });

  it('should add a block with config object', () => {
    const block = bm.add({ id: 'img-block', label: 'Image', content: '<img/>' });
    expect(block.get('id')).toBe('img-block');
  });

  it('should get block by id', () => {
    bm.add('blk-1', { label: 'One' });
    const found = bm.get('blk-1');
    expect(found).toBeDefined();
    expect(found.get('label')).toBe('One');
  });

  it('should return undefined for unknown id', () => {
    expect(bm.get('nope')).toBeUndefined();
  });

  it('getAll returns all added blocks', () => {
    bm.add('a', { label: 'A' });
    bm.add('b', { label: 'B' });
    bm.add('c', { label: 'C' });
    const all = bm.getAll();
    expect(all).toHaveLength(3);
  });

  it('should remove a block by model reference', () => {
    const block = bm.add('rm-me', { label: 'Remove' });
    const removed = bm.remove(block);
    expect(removed).toBeDefined();
    expect(bm.get('rm-me')).toBeUndefined();
  });

  it('should remove a block by id string', () => {
    bm.add('rm-id', { label: 'Remove by ID' });
    bm.remove('rm-id');
    expect(bm.get('rm-id')).toBeUndefined();
  });

  it('should add multiple blocks via array (using add with object array)', () => {
    const blocks = [
      { id: 'm1', label: 'M1' },
      { id: 'm2', label: 'M2' },
    ];
    // ItemManagerModule.add supports arrays via ReactiveCollection
    bm.add(blocks);
    expect(bm.getAll().length).toBeGreaterThanOrEqual(2);
    expect(bm.get('m1')).toBeDefined();
    expect(bm.get('m2')).toBeDefined();
  });

  it('getCategories returns unique category names', () => {
    bm.add('b1', { label: 'B1', category: 'Basic' });
    bm.add('b2', { label: 'B2', category: 'Layout' });
    bm.add('b3', { label: 'B3', category: 'Basic' });
    bm.add('b4', { label: 'B4' }); // no category
    const cats = bm.getCategories();
    expect(cats).toContain('Basic');
    expect(cats).toContain('Layout');
    expect(cats).toHaveLength(2);
  });

  it('getBlocksByCategory filters correctly', () => {
    bm.add('c1', { label: 'C1', category: 'Forms' });
    bm.add('c2', { label: 'C2', category: 'Forms' });
    bm.add('c3', { label: 'C3', category: 'Other' });
    const forms = bm.getBlocksByCategory('Forms');
    expect(forms).toHaveLength(2);
  });

  it('clear removes all blocks', () => {
    bm.add('x1', { label: 'X1' });
    bm.add('x2', { label: 'X2' });
    expect(bm.getAll().length).toBe(2);
    bm.clear();
    expect(bm.getAll()).toHaveLength(0);
  });

  it('collection fires add event when block is added', () => {
    const handler = vi.fn();
    bm.all.on('add', handler);
    bm.add('evt-blk', { label: 'Evt' });
    expect(handler).toHaveBeenCalled();
    const addedModel = handler.mock.calls[0][0];
    expect(addedModel.get('id')).toBe('evt-blk');
  });

  it('collection fires remove event when block is removed', () => {
    const handler = vi.fn();
    bm.all.on('remove', handler);
    const block = bm.add('evt-rm', { label: 'EvtRm' });
    bm.remove(block);
    expect(handler).toHaveBeenCalled();
  });

  it('render returns an HTMLElement', () => {
    bm.add('r1', { label: 'Render1', category: 'Cat' });
    bm.add('r2', { label: 'Render2' });
    const el = bm.render();
    expect(el).toBeInstanceOf(HTMLElement);
    expect(el.classList.contains('bm-blocks')).toBe(true);
  });

  it('render creates draggable block elements', () => {
    bm.add('d1', { label: 'Drag' });
    const el = bm.render();
    const blockEl = el.querySelector('[data-block-id="d1"]');
    expect(blockEl).not.toBeNull();
    expect(blockEl.getAttribute('draggable')).toBe('true');
  });

  it('render disables dragging for disabled blocks', () => {
    bm.add('dis1', { label: 'Disabled', disable: true });
    const el = bm.render();
    const blockEl = el.querySelector('[data-block-id="dis1"]');
    expect(blockEl.getAttribute('draggable')).toBe('false');
    expect(blockEl.style.opacity).toBe('0.5');
  });
});
