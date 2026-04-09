import { describe, it, expect, vi, beforeEach } from 'vitest';
import Editor from '../../src/editor/Editor.js';
import EditorModel from '../../src/editor/EditorModel.js';

describe('Editor', () => {
  let editor;

  beforeEach(() => {
    editor = new Editor({ headless: true });
  });

  // ── Constructor ──

  describe('constructor', () => {
    it('creates an Editor instance', () => {
      expect(editor).toBeInstanceOf(Editor);
    });

    it('creates an internal EditorModel', () => {
      expect(editor.getModel()).toBeInstanceOf(EditorModel);
    });

    it('sets Editor reference on the model', () => {
      expect(editor.getModel().Editor).toBe(editor);
    });

    it('starts as not rendered', () => {
      expect(editor._rendered).toBe(false);
    });
  });

  // ── Module Getters ──

  describe('module getters', () => {
    beforeEach(() => {
      editor.getModel().initModules();
    });

    // Devices and Pages modules require specific config to initialize;
    // they are tested separately via their own module tests.
    const moduleNames = [
      'Components', 'Canvas', 'Css', 'Blocks', 'Assets',
      'Styles', 'Panels', 'Commands', 'Selectors', 'Traits',
      'Storage', 'Modal', 'Keymaps',
      'UndoManager', 'RichTextEditor', 'I18n', 'DataSources', 'Layers',
    ];

    for (const name of moduleNames) {
      it(`has a "${name}" getter that returns a module`, () => {
        const mod = editor[name];
        expect(mod).toBeDefined();
      });
    }
  });

  // ── Event Delegation ──

  describe('event delegation', () => {
    it('on() delegates to model and returns editor', () => {
      const cb = vi.fn();
      const result = editor.on('test:event', cb);
      expect(result).toBe(editor);
      editor.getModel().trigger('test:event', 'data');
      expect(cb).toHaveBeenCalledWith('data');
    });

    it('off() removes handler via model', () => {
      const cb = vi.fn();
      editor.on('test:event', cb);
      editor.off('test:event', cb);
      editor.getModel().trigger('test:event');
      expect(cb).not.toHaveBeenCalled();
    });

    it('once() fires handler only once', () => {
      const cb = vi.fn();
      editor.once('test:event', cb);
      editor.trigger('test:event');
      editor.trigger('test:event');
      expect(cb).toHaveBeenCalledTimes(1);
    });

    it('trigger() delegates to model and returns editor', () => {
      const cb = vi.fn();
      editor.on('custom:event', cb);
      const result = editor.trigger('custom:event', 'arg1', 'arg2');
      expect(result).toBe(editor);
      expect(cb).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });

  // ── Selection API ──

  describe('selection API', () => {
    const mockComp1 = { id: 'c1', type: 'div' };
    const mockComp2 = { id: 'c2', type: 'span' };

    it('select() sets the selected component', () => {
      editor.select(mockComp1);
      expect(editor.getSelected()).toBe(mockComp1);
    });

    it('select() returns the editor for chaining', () => {
      expect(editor.select(mockComp1)).toBe(editor);
    });

    it('getSelected() returns undefined when nothing selected', () => {
      expect(editor.getSelected()).toBeUndefined();
    });

    it('getSelectedAll() returns an array', () => {
      expect(editor.getSelectedAll()).toEqual([]);
    });

    it('selectAdd() adds a component to selection', () => {
      editor.select(mockComp1);
      editor.selectAdd(mockComp2);
      expect(editor.getSelectedAll()).toEqual([mockComp1, mockComp2]);
    });

    it('selectRemove() removes a component from selection', () => {
      editor.select(mockComp1);
      editor.selectAdd(mockComp2);
      editor.selectRemove(mockComp1);
      expect(editor.getSelectedAll()).toEqual([mockComp2]);
    });

    it('selectToggle() adds if not selected', () => {
      editor.selectToggle(mockComp1);
      expect(editor.getSelectedAll()).toContain(mockComp1);
    });

    it('selectToggle() removes if already selected', () => {
      editor.select(mockComp1);
      editor.selectToggle(mockComp1);
      expect(editor.getSelectedAll()).not.toContain(mockComp1);
    });
  });

  // ── onReady ──

  describe('onReady', () => {
    it('fires callback immediately if model is already ready', () => {
      editor.getModel().set('ready', true);
      const cb = vi.fn();
      editor.onReady(cb);
      expect(cb).toHaveBeenCalledWith(editor);
    });

    it('fires callback when model becomes ready', () => {
      const cb = vi.fn();
      editor.onReady(cb);
      expect(cb).not.toHaveBeenCalled();
      editor.getModel().set('ready', true);
      expect(cb).toHaveBeenCalledWith(editor);
    });

    it('returns the editor for chaining', () => {
      expect(editor.onReady(() => {})).toBe(editor);
    });
  });

  // ── getConfig ──

  describe('getConfig', () => {
    it('returns full config when called without key', () => {
      const cfg = editor.getConfig();
      expect(cfg).toBeDefined();
      expect(cfg.headless).toBe(true);
    });

    it('returns specific config key', () => {
      expect(editor.getConfig('headless')).toBe(true);
    });

    it('returns undefined for non-existent key', () => {
      expect(editor.getConfig('nonExistentKey')).toBeUndefined();
    });
  });

  // ── destroy ──

  describe('destroy', () => {
    it('calls model.destroy()', () => {
      const spy = vi.spyOn(editor.getModel(), 'destroy');
      editor.destroy();
      expect(spy).toHaveBeenCalled();
    });

    it('resets rendered state', () => {
      editor.destroy();
      expect(editor._rendered).toBe(false);
    });
  });
});

// ── EditorModel ──

describe('EditorModel', () => {
  let em;

  beforeEach(() => {
    em = new EditorModel({ headless: true });
  });

  describe('initialization', () => {
    it('creates an EditorModel instance', () => {
      expect(em).toBeInstanceOf(EditorModel);
    });

    it('sets default values', () => {
      expect(em.get('ready')).toBe(false);
      expect(em.get('changesCount')).toBe(0);
      expect(em.get('selectedAll')).toEqual([]);
      expect(em.get('hovered')).toBeNull();
    });

    it('merges user config with defaults', () => {
      const custom = new EditorModel({ stylePrefix: 'custom-' });
      expect(custom.getConfig('stylePrefix')).toBe('custom-');
    });
  });

  describe('initModules', () => {
    it('registers all modules', () => {
      em.initModules();
      expect(em.getModule('I18n')).toBeDefined();
      expect(em.getModule('Components')).toBeDefined();
      expect(em.getModule('Css')).toBeDefined();
      expect(em.getModule('Selectors')).toBeDefined();
      expect(em.getModule('Storage')).toBeDefined();
    });

    it('getModule returns undefined for unregistered module', () => {
      expect(em.getModule('NonExistent')).toBeUndefined();
    });
  });

  describe('getProjectData / loadProjectData', () => {
    beforeEach(() => {
      em.initModules();
    });

    it('getProjectData returns an object', () => {
      const data = em.getProjectData();
      expect(typeof data).toBe('object');
      expect(data).not.toBeNull();
    });

    it('loadProjectData fires project:load and project:loaded events', () => {
      const loadCb = vi.fn();
      const loadedCb = vi.fn();
      em.on('project:load', loadCb);
      em.on('project:loaded', loadedCb);
      em.loadProjectData({});
      expect(loadCb).toHaveBeenCalled();
      expect(loadedCb).toHaveBeenCalled();
    });

    it('loadProjectData accepts empty data without error', () => {
      expect(() => em.loadProjectData({})).not.toThrow();
    });
  });

  describe('selection', () => {
    const comp1 = { id: 's1' };
    const comp2 = { id: 's2' };
    const comp3 = { id: 's3' };

    it('setSelected sets the selected components', () => {
      em.setSelected(comp1);
      expect(em.getSelected()).toBe(comp1);
    });

    it('getSelected returns the last selected component', () => {
      em.setSelected([comp1, comp2]);
      expect(em.getSelected()).toBe(comp2);
    });

    it('getSelectedAll returns a copy of the array', () => {
      em.setSelected([comp1, comp2]);
      const all = em.getSelectedAll();
      expect(all).toEqual([comp1, comp2]);
      all.push(comp3);
      expect(em.getSelectedAll()).toEqual([comp1, comp2]);
    });

    it('selectAdd adds a component to the selection', () => {
      em.setSelected(comp1);
      em.selectAdd(comp2);
      expect(em.getSelectedAll()).toEqual([comp1, comp2]);
    });

    it('selectAdd does not add duplicates', () => {
      em.setSelected(comp1);
      em.selectAdd(comp1);
      expect(em.getSelectedAll()).toEqual([comp1]);
    });

    it('selectRemove removes a component from the selection', () => {
      em.setSelected([comp1, comp2]);
      em.selectRemove(comp1);
      expect(em.getSelectedAll()).toEqual([comp2]);
    });

    it('deselectAll clears the selection', () => {
      em.setSelected([comp1, comp2]);
      em.deselectAll();
      expect(em.getSelectedAll()).toEqual([]);
    });

    it('deselectAll fires component:deselected for each', () => {
      const cb = vi.fn();
      em.on('component:deselected', cb);
      em.setSelected([comp1, comp2]);
      em.deselectAll();
      expect(cb).toHaveBeenCalledTimes(2);
    });

    it('setSelected fires component:selected event', () => {
      const cb = vi.fn();
      em.on('component:selected', cb);
      em.setSelected(comp1);
      expect(cb).toHaveBeenCalledWith(comp1, expect.anything());
    });

    it('selectRemove does nothing with null', () => {
      em.setSelected(comp1);
      em.selectRemove(null);
      expect(em.getSelectedAll()).toEqual([comp1]);
    });
  });

  describe('hovered', () => {
    const comp = { id: 'h1' };

    it('setHovered / getHovered track hovered component', () => {
      em.setHovered(comp);
      expect(em.getHovered()).toBe(comp);
    });

    it('setHovered(null) clears hovered', () => {
      em.setHovered(comp);
      em.setHovered(null);
      expect(em.getHovered()).toBeNull();
    });

    it('fires component:hovered event', () => {
      const cb = vi.fn();
      em.on('component:hovered', cb);
      em.setHovered(comp);
      expect(cb).toHaveBeenCalledWith(comp, expect.anything());
    });

    it('fires component:unhovered when clearing', () => {
      em.setHovered(comp);
      const cb = vi.fn();
      em.on('component:unhovered', cb);
      em.setHovered(null);
      expect(cb).toHaveBeenCalledWith(comp, expect.anything());
    });

    it('does not fire events when setting same component', () => {
      em.setHovered(comp);
      const cb = vi.fn();
      em.on('component:hovered', cb);
      em.setHovered(comp);
      expect(cb).not.toHaveBeenCalled();
    });
  });

  describe('destroy', () => {
    it('fires destroy event', () => {
      const cb = vi.fn();
      em.on('destroy', cb);
      em.destroy();
      expect(cb).toHaveBeenCalled();
    });

    it('clears modules map', () => {
      em.initModules();
      em.destroy();
      expect(em.getModule('I18n')).toBeUndefined();
    });

    it('clears storables and toLoad arrays', () => {
      em.initModules();
      em.destroy();
      expect(em._storables).toEqual([]);
      expect(em._toLoad).toEqual([]);
    });
  });
});
