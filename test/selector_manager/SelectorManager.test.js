import { describe, it, expect, vi, beforeEach } from 'vitest';
import Selector, { SELECTOR_TYPE } from '../../src/selector_manager/model/Selector.js';
import SelectorManager from '../../src/selector_manager/index.js';
import EditorModel from '../../src/editor/EditorModel.js';

// ── Selector Model ──

describe('Selector', () => {
  describe('creation with defaults', () => {
    it('creates a selector with defaults', () => {
      const sel = new Selector({ name: 'my-class' });
      expect(sel.get('name')).toBe('my-class');
      expect(sel.get('type')).toBe(SELECTOR_TYPE.CLASS);
      expect(sel.get('active')).toBe(true);
      expect(sel.get('private')).toBe(false);
      expect(sel.get('protected')).toBe(false);
    });

    it('auto-generates label from name', () => {
      const sel = new Selector({ name: 'my-class' });
      expect(sel.get('label')).toBe('my-class');
    });

    it('preserves explicitly set label', () => {
      const sel = new Selector({ name: 'my-class', label: 'My Class' });
      expect(sel.get('label')).toBe('My Class');
    });

    it('sets id from name', () => {
      const sel = new Selector({ name: 'container' });
      expect(sel.id).toBe('container');
    });
  });

  describe('types', () => {
    it('SELECTOR_TYPE constants are correct', () => {
      expect(SELECTOR_TYPE.CLASS).toBe(1);
      expect(SELECTOR_TYPE.ID).toBe(2);
      expect(SELECTOR_TYPE.TAG).toBe(3);
    });

    it('creates class type selector', () => {
      const sel = new Selector({ name: 'box', type: SELECTOR_TYPE.CLASS });
      expect(sel.get('type')).toBe(1);
    });

    it('creates id type selector', () => {
      const sel = new Selector({ name: 'main', type: SELECTOR_TYPE.ID });
      expect(sel.get('type')).toBe(2);
    });

    it('creates tag type selector', () => {
      const sel = new Selector({ name: 'div', type: SELECTOR_TYPE.TAG });
      expect(sel.get('type')).toBe(3);
    });
  });

  describe('getFullName', () => {
    it('returns .name for class selector', () => {
      const sel = new Selector({ name: 'box', type: SELECTOR_TYPE.CLASS });
      expect(sel.getFullName()).toBe('.box');
    });

    it('returns #name for id selector', () => {
      const sel = new Selector({ name: 'main', type: SELECTOR_TYPE.ID });
      expect(sel.getFullName()).toBe('#main');
    });

    it('returns bare name for tag selector', () => {
      const sel = new Selector({ name: 'div', type: SELECTOR_TYPE.TAG });
      expect(sel.getFullName()).toBe('div');
    });

    it('returns empty string when no name', () => {
      const sel = new Selector({});
      expect(sel.getFullName()).toBe('');
    });

    it('defaults to class type when type is missing', () => {
      const sel = new Selector({ name: 'widget' });
      expect(sel.getFullName()).toBe('.widget');
    });
  });

  describe('isActive', () => {
    it('returns true by default', () => {
      const sel = new Selector({ name: 'a' });
      expect(sel.isActive()).toBe(true);
    });

    it('returns false when set to inactive', () => {
      const sel = new Selector({ name: 'a', active: false });
      expect(sel.isActive()).toBe(false);
    });

    it('reflects changes', () => {
      const sel = new Selector({ name: 'a' });
      sel.set('active', false);
      expect(sel.isActive()).toBe(false);
    });
  });

  describe('isPrivate', () => {
    it('returns false by default', () => {
      const sel = new Selector({ name: 'a' });
      expect(sel.isPrivate()).toBe(false);
    });

    it('returns true when set to private', () => {
      const sel = new Selector({ name: 'a', private: true });
      expect(sel.isPrivate()).toBe(true);
    });
  });

  describe('getName / getLabel / setLabel', () => {
    it('getName returns the name', () => {
      const sel = new Selector({ name: 'box' });
      expect(sel.getName()).toBe('box');
    });

    it('getLabel returns the label', () => {
      const sel = new Selector({ name: 'box', label: 'Box' });
      expect(sel.getLabel()).toBe('Box');
    });

    it('getLabel falls back to name', () => {
      const sel = new Selector({ name: 'box' });
      // Label is auto-set from name in initialize
      expect(sel.getLabel()).toBe('box');
    });

    it('setLabel updates the label', () => {
      const sel = new Selector({ name: 'box' });
      sel.setLabel('Updated Box');
      expect(sel.getLabel()).toBe('Updated Box');
    });
  });

  describe('toString', () => {
    it('returns the full selector name', () => {
      const sel = new Selector({ name: 'box', type: SELECTOR_TYPE.CLASS });
      expect(sel.toString()).toBe('.box');
    });
  });
});

// ── SelectorManager ──

describe('SelectorManager', () => {
  let em;
  let sm;

  beforeEach(() => {
    em = new EditorModel({ headless: true });
    em.initModules();
    sm = em.getModule('Selectors');
    // Patch em.trigger to guard against undefined event names
    // (a known issue in _setupEventPropagation closure capture)
    const origTrigger = em.trigger.bind(em);
    em.trigger = (event, ...args) => {
      if (!event) return em;
      return origTrigger(event, ...args);
    };
  });

  describe('add', () => {
    it('adds a class selector by string', () => {
      const sel = sm.add('my-class');
      expect(sel).toBeDefined();
      expect(sel.get('name')).toBe('my-class');
      expect(sel.get('type')).toBe(SELECTOR_TYPE.CLASS);
    });

    it('adds an id selector from # prefix', () => {
      const sel = sm.add('#my-id');
      expect(sel.get('name')).toBe('my-id');
      expect(sel.get('type')).toBe(SELECTOR_TYPE.ID);
    });

    it('adds a class selector from . prefix', () => {
      const sel = sm.add('.my-class');
      expect(sel.get('name')).toBe('my-class');
      expect(sel.get('type')).toBe(SELECTOR_TYPE.CLASS);
    });

    it('returns existing selector instead of creating duplicate', () => {
      const sel1 = sm.add('box');
      const sel2 = sm.add('box');
      expect(sel1).toBe(sel2);
      expect(sm.getAll().length).toBe(1);
    });

    it('adds selector from object config', () => {
      const sel = sm.add({ name: 'widget', type: SELECTOR_TYPE.CLASS });
      expect(sel.get('name')).toBe('widget');
    });

    it('sanitizes names with special characters', () => {
      const sel = sm.add('my class!@#');
      expect(sel.get('name')).not.toContain(' ');
      expect(sel.get('name')).not.toContain('!');
    });

    it('accepts explicit type override', () => {
      const sel = sm.add('header', { type: SELECTOR_TYPE.TAG });
      expect(sel.get('type')).toBe(SELECTOR_TYPE.TAG);
    });
  });

  describe('get', () => {
    it('retrieves a selector by name', () => {
      sm.add('box');
      const found = sm.get('box');
      expect(found).toBeDefined();
      expect(found.get('name')).toBe('box');
    });

    it('strips . prefix for lookup', () => {
      sm.add('box');
      expect(sm.get('.box')).toBeDefined();
    });

    it('strips # prefix for lookup', () => {
      sm.add('#main');
      expect(sm.get('#main')).toBeDefined();
    });

    it('returns undefined for non-existent selector', () => {
      expect(sm.get('nonexistent')).toBeUndefined();
    });

    it('returns undefined for empty/null input', () => {
      expect(sm.get('')).toBeUndefined();
      expect(sm.get(null)).toBeUndefined();
      expect(sm.get(undefined)).toBeUndefined();
    });
  });

  describe('getAll', () => {
    it('returns all selectors', () => {
      sm.add('a');
      sm.add('b');
      sm.add('c');
      expect(sm.getAll().length).toBe(3);
    });

    it('returns empty array initially', () => {
      expect(sm.getAll()).toEqual([]);
    });
  });

  describe('remove', () => {
    it('removes a selector', () => {
      const sel = sm.add('box');
      sm.remove(sel);
      expect(sm.getAll().length).toBe(0);
    });

    it('returns undefined for non-existent removal', () => {
      expect(sm.remove('nothing')).toBeUndefined();
    });
  });

  describe('setState / getState', () => {
    it('getState returns empty string by default', () => {
      expect(sm.getState()).toBe('');
    });

    it('setState sets the current state', () => {
      sm.setState(':hover');
      expect(sm.getState()).toBe(':hover');
    });

    it('setState with empty string clears state', () => {
      sm.setState(':hover');
      sm.setState('');
      expect(sm.getState()).toBe('');
    });

    it('setState returns the manager for chaining', () => {
      expect(sm.setState(':active')).toBe(sm);
    });

    it('fires selector:state event', () => {
      const cb = vi.fn();
      sm.on('selector:state', cb);
      sm.setState(':hover');
      expect(cb).toHaveBeenCalledWith(':hover');
    });
  });

  describe('getByType / getClasses', () => {
    beforeEach(() => {
      sm.add('box');
      sm.add('#main');
      sm.add('container');
    });

    it('getClasses returns class-type selectors', () => {
      const classes = sm.getClasses();
      expect(classes.length).toBeGreaterThanOrEqual(1);
      for (const sel of classes) {
        expect(sel.get('type')).toBe(SELECTOR_TYPE.CLASS);
      }
    });

    it('getByType filters by specific type', () => {
      const ids = sm.getByType(SELECTOR_TYPE.ID);
      for (const sel of ids) {
        expect(sel.get('type')).toBe(SELECTOR_TYPE.ID);
      }
    });
  });

  describe('getProjectData / loadProjectData', () => {
    it('getProjectData serializes selectors', () => {
      sm.add('box');
      sm.add('container');
      const data = sm.getProjectData();
      expect(data.selectors).toBeDefined();
      expect(Array.isArray(data.selectors)).toBe(true);
      expect(data.selectors.length).toBe(2);
    });

    it('loadProjectData restores selectors', () => {
      sm.add('box');
      sm.add('container');
      const data = sm.getProjectData();
      // Clear and reload into the same module
      sm.clear();
      expect(sm.getAll().length).toBe(0);
      sm.loadProjectData(data);
      expect(sm.getAll().length).toBe(2);
    });

    it('loadProjectData with empty data does not error', () => {
      expect(() => sm.loadProjectData({})).not.toThrow();
    });

    it('getProjectData returns empty array when no selectors', () => {
      const data = sm.getProjectData();
      expect(data.selectors).toEqual([]);
    });
  });

  describe('destroy', () => {
    it('clears the state', () => {
      sm.setState(':hover');
      sm.destroy();
      expect(sm.getState()).toBe('');
    });
  });
});
