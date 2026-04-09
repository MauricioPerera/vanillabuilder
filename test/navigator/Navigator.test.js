import { describe, it, expect, vi, beforeEach } from 'vitest';
import LayerManager from '../../src/navigator/index.js';

describe('LayerManager (Navigator)', () => {
  let mockEditor;
  let lm;

  beforeEach(() => {
    mockEditor = {
      getConfig: (k) => k ? undefined : {},
      getModule: () => null,
      on: () => {},
      trigger: () => {},
      t: (k) => k,
    };
    lm = new LayerManager(mockEditor);
  });

  it('should have null root by default', () => {
    expect(lm._root).toBeNull();
  });

  it('should set root component via setRoot', () => {
    const root = { tagName: 'div', type: 'wrapper' };
    lm.setRoot(root);
    expect(lm._root).toBe(root);
  });

  it('should get root component via getRoot', () => {
    const root = { tagName: 'div', type: 'wrapper' };
    lm.setRoot(root);
    expect(lm.getRoot()).toBe(root);
  });

  it('should trigger root:change event on setRoot', () => {
    const fn = vi.fn();
    lm.on('root:change', fn);
    const root = { tagName: 'div' };
    lm.setRoot(root);
    expect(fn).toHaveBeenCalledWith(root);
  });

  it('should return empty layers when no root is set', () => {
    expect(lm.getAll()).toEqual([]);
  });

  it('should collect flat layers from component tree', () => {
    const root = {
      get: (k) => {
        if (k === 'components') return {
          models: [
            { get: (k) => k === 'components' ? { models: [] } : undefined },
            { get: (k) => k === 'components' ? { models: [] } : undefined },
          ],
        };
        return undefined;
      },
    };
    lm.setRoot(root);
    const layers = lm.getAll();
    expect(layers).toHaveLength(3); // root + 2 children
    expect(layers[0].depth).toBe(0);
    expect(layers[1].depth).toBe(1);
    expect(layers[2].depth).toBe(1);
  });

  it('should render an HTMLElement', () => {
    const el = lm.render();
    expect(el).toBeInstanceOf(HTMLElement);
    expect(el.tagName).toBe('DIV');
  });

  it('should render empty state when no root', () => {
    const el = lm.render();
    const empty = el.querySelector('[class*="layers-empty"]');
    expect(empty).toBeDefined();
  });

  it('should render layers when root has children', () => {
    const root = {
      get: (k) => {
        if (k === 'components') return {
          models: [
            {
              get: (k) => {
                const data = { type: 'default', tagName: 'div', components: { models: [] } };
                return data[k];
              },
            },
          ],
        };
        if (k === 'type') return 'wrapper';
        if (k === 'tagName') return 'body';
        return undefined;
      },
    };
    lm.setRoot(root);
    const el = lm.render();
    const layerItems = el.querySelectorAll('[class*="layer"]');
    expect(layerItems.length).toBeGreaterThan(0);
  });

  it('should render title in the layers panel', () => {
    const el = lm.render();
    const title = el.querySelector('[class*="layers-title"]');
    expect(title).toBeDefined();
    expect(title.textContent).toBeTruthy();
  });

  it('should handle nested layers with depth tracking', () => {
    const grandchild = {
      get: (k) => k === 'components' ? { models: [] } : undefined,
    };
    const child = {
      get: (k) => k === 'components' ? { models: [grandchild] } : undefined,
    };
    const root = {
      get: (k) => k === 'components' ? { models: [child] } : undefined,
    };
    lm.setRoot(root);
    const layers = lm.getAll();
    expect(layers).toHaveLength(3);
    expect(layers[0].depth).toBe(0);
    expect(layers[1].depth).toBe(1);
    expect(layers[2].depth).toBe(2);
  });

  it('should return root from editor DomComponents as fallback', () => {
    const wrapper = { tagName: 'body' };
    const editorWithDom = {
      ...mockEditor,
      DomComponents: { getWrapper: () => wrapper },
    };
    const lm2 = new LayerManager(editorWithDom);
    expect(lm2.getRoot()).toBe(wrapper);
  });

  it('should clean up root on destroy', () => {
    lm.setRoot({ tagName: 'div' });
    lm.destroy();
    expect(lm._root).toBeNull();
  });
});
