import { describe, it, expect, vi, beforeEach } from 'vitest';
import Trait from '../../src/trait_manager/model/Trait.js';
import TraitManager from '../../src/trait_manager/index.js';

function createEditor(config = {}) {
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
// Trait Model
// ---------------------------------------------------------------------------
describe('Trait model', () => {
  it('should have correct defaults', () => {
    const trait = new Trait();
    expect(trait.get('type')).toBe('text');
    expect(trait.get('name')).toBe('');
    expect(trait.get('label')).toBe('');
    expect(trait.get('value')).toBe('');
    expect(trait.get('default')).toBe('');
    expect(trait.get('placeholder')).toBe('');
    expect(trait.get('options')).toEqual([]);
    expect(trait.get('min')).toBe(0);
    expect(trait.get('max')).toBe(100);
    expect(trait.get('step')).toBe(1);
    expect(trait.get('changeProp')).toBe(false);
    expect(trait.get('category')).toBe('');
  });

  it('should accept initial attributes', () => {
    const trait = new Trait({
      type: 'number',
      name: 'width',
      label: 'Width',
      value: 100,
      min: 0,
      max: 500,
      step: 10,
    });
    expect(trait.get('type')).toBe('number');
    expect(trait.get('name')).toBe('width');
    expect(trait.get('value')).toBe(100);
  });

  it('getValue returns the current value', () => {
    const trait = new Trait({ value: 'hello' });
    expect(trait.getValue()).toBe('hello');
  });

  it('getValue falls back to default when value is empty', () => {
    const trait = new Trait({ value: '', default: 'fallback' });
    expect(trait.getValue()).toBe('fallback');
  });

  it('setValue sets the value', () => {
    const trait = new Trait({ value: 'old' });
    trait.setValue('new');
    expect(trait.getValue()).toBe('new');
  });

  it('setValue returns this for chaining', () => {
    const trait = new Trait();
    const result = trait.setValue('test');
    expect(result).toBe(trait);
  });

  it('getType returns the trait type', () => {
    const trait = new Trait({ type: 'select' });
    expect(trait.getType()).toBe('select');
  });

  it('getName returns the trait name', () => {
    const trait = new Trait({ name: 'href' });
    expect(trait.getName()).toBe('href');
  });

  it('getLabel returns the label', () => {
    const trait = new Trait({ label: 'Custom Label' });
    expect(trait.getLabel()).toBe('Custom Label');
  });

  it('getLabel falls back to name when no label', () => {
    const trait = new Trait({ name: 'myAttr' });
    // Note: initialize auto-generates label from name, so getLabel returns generated label
    expect(trait.getLabel()).toBeTruthy();
  });

  it('auto-generates label from name (camelCase)', () => {
    const trait = new Trait({ name: 'fontSize' });
    const label = trait.get('label');
    // "fontSize" -> "Font Size" (roughly)
    expect(label).toContain('Font');
    expect(label).toContain('Size');
  });

  it('auto-generates label from name (kebab-case)', () => {
    const trait = new Trait({ name: 'background-color' });
    const label = trait.get('label');
    expect(label).toContain('Background');
    expect(label).toContain('Color');
  });

  it('does not overwrite explicitly provided label', () => {
    const trait = new Trait({ name: 'myProp', label: 'Explicit' });
    expect(trait.get('label')).toBe('Explicit');
  });

  it('getOptions returns options array', () => {
    const opts = [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }];
    const trait = new Trait({ type: 'select', options: opts });
    expect(trait.getOptions()).toEqual(opts);
  });

  it('getOptions returns empty array by default', () => {
    const trait = new Trait();
    expect(trait.getOptions()).toEqual([]);
  });

  it('getDefault returns the default value', () => {
    const trait = new Trait({ default: 'def-val' });
    expect(trait.getDefault()).toBe('def-val');
  });

  it('isValueChanged detects changed value', () => {
    const trait = new Trait({ value: 'changed', default: 'original' });
    expect(trait.isValueChanged()).toBe(true);
  });

  it('isValueChanged returns false when value equals default', () => {
    const trait = new Trait({ value: 'same', default: 'same' });
    expect(trait.isValueChanged()).toBe(false);
  });

  it('getValue reads from component when changeProp is true', () => {
    const component = { get: vi.fn(() => 'comp-value') };
    const trait = new Trait({ name: 'href', changeProp: true }, { component });
    expect(trait.getValue()).toBe('comp-value');
    expect(component.get).toHaveBeenCalledWith('href');
  });

  it('setValue writes to component when changeProp is true', () => {
    const component = { get: vi.fn(), set: vi.fn() };
    const trait = new Trait({ name: 'href', changeProp: true }, { component });
    trait.setValue('new-href');
    expect(component.set).toHaveBeenCalledWith('href', 'new-href', {});
  });

  it('getComponent and setComponent work', () => {
    const trait = new Trait();
    expect(trait.getComponent()).toBeNull();
    const comp = { id: 'comp1' };
    trait.setComponent(comp);
    expect(trait.getComponent()).toBe(comp);
  });
});

// ---------------------------------------------------------------------------
// TraitManager
// ---------------------------------------------------------------------------
describe('TraitManager', () => {
  let tm;
  let editor;

  beforeEach(() => {
    editor = createEditor();
    tm = new TraitManager(editor);
  });

  it('registers built-in types on construction', () => {
    expect(tm.hasType('text')).toBe(true);
    expect(tm.hasType('number')).toBe(true);
    expect(tm.hasType('checkbox')).toBe(true);
    expect(tm.hasType('select')).toBe(true);
    expect(tm.hasType('color')).toBe(true);
    expect(tm.hasType('button')).toBe(true);
  });

  it('getTypes returns all registered type names', () => {
    const types = tm.getTypes();
    expect(types).toContain('text');
    expect(types).toContain('number');
    expect(types).toContain('checkbox');
    expect(types).toContain('select');
    expect(types).toContain('color');
    expect(types).toContain('button');
  });

  it('addType registers a custom type', () => {
    tm.addType('custom-range', {
      createInput({ trait }) {
        const el = document.createElement('input');
        el.type = 'range';
        return el;
      },
    });
    expect(tm.hasType('custom-range')).toBe(true);
  });

  it('addType returns this for chaining', () => {
    const result = tm.addType('chain-test', { createInput: () => document.createElement('div') });
    expect(result).toBe(tm);
  });

  it('getType retrieves a type definition', () => {
    const typeDef = tm.getType('text');
    expect(typeDef).toBeDefined();
    expect(typeof typeDef.createInput).toBe('function');
  });

  it('getType returns undefined for unknown type', () => {
    expect(tm.getType('nonexistent')).toBeUndefined();
  });

  it('hasType returns false for unregistered type', () => {
    expect(tm.hasType('nope')).toBe(false);
  });

  it('createInput creates an input element for text type', () => {
    const trait = new Trait({ type: 'text', name: 'title', value: 'Hello' });
    const input = tm.createInput(trait);
    expect(input).toBeInstanceOf(HTMLInputElement);
    expect(input.type).toBe('text');
    expect(input.value).toBe('Hello');
  });

  it('createInput creates an input element for number type', () => {
    const trait = new Trait({ type: 'number', name: 'width', value: '50', min: 0, max: 200, step: 5 });
    const input = tm.createInput(trait);
    expect(input).toBeInstanceOf(HTMLInputElement);
    expect(input.type).toBe('number');
    expect(input.min).toBe('0');
    expect(input.max).toBe('200');
    expect(input.step).toBe('5');
  });

  it('createInput creates a checkbox for checkbox type', () => {
    const trait = new Trait({ type: 'checkbox', name: 'checked', value: true });
    const input = tm.createInput(trait);
    expect(input).toBeInstanceOf(HTMLInputElement);
    expect(input.type).toBe('checkbox');
    expect(input.checked).toBe(true);
  });

  it('createInput creates a select for select type', () => {
    const trait = new Trait({
      type: 'select',
      name: 'target',
      value: '_blank',
      options: [
        { id: '_self', name: 'Same window' },
        { id: '_blank', name: 'New window' },
      ],
    });
    const input = tm.createInput(trait);
    expect(input).toBeInstanceOf(HTMLSelectElement);
    expect(input.options.length).toBe(2);
  });

  it('createInput creates a color input for color type', () => {
    const trait = new Trait({ type: 'color', name: 'bg', value: '#ff0000' });
    const input = tm.createInput(trait);
    expect(input).toBeInstanceOf(HTMLInputElement);
    expect(input.type).toBe('color');
    expect(input.value).toBe('#ff0000');
  });

  it('createInput creates a button for button type', () => {
    const trait = new Trait({ type: 'button', name: 'action', label: 'Submit' });
    const input = tm.createInput(trait);
    expect(input).toBeInstanceOf(HTMLButtonElement);
    expect(input.textContent).toBe('Submit');
  });

  it('createInput falls back to text type for unknown types', () => {
    const trait = new Trait({ type: 'unknown-type', name: 'foo', value: 'bar' });
    const input = tm.createInput(trait);
    // Falls back to text
    expect(input).toBeInstanceOf(HTMLInputElement);
  });

  it('getTraits creates Trait instances from component trait definitions', () => {
    const component = {
      get: vi.fn((key) => {
        if (key === 'traits') {
          return [
            { name: 'href', type: 'text' },
            { name: 'target', type: 'select', options: ['_self', '_blank'] },
          ];
        }
        return undefined;
      }),
    };
    const traits = tm.getTraits(component);
    expect(traits).toHaveLength(2);
    expect(traits[0]).toBeInstanceOf(Trait);
    expect(traits[0].getName()).toBe('href');
    expect(traits[1].getName()).toBe('target');
  });

  it('getTraits returns empty array for null component', () => {
    expect(tm.getTraits(null)).toEqual([]);
  });

  it('getTraits handles string trait definitions', () => {
    const component = {
      get: vi.fn((key) => {
        if (key === 'traits') return ['title', 'alt'];
        return undefined;
      }),
    };
    const traits = tm.getTraits(component);
    expect(traits).toHaveLength(2);
    expect(traits[0].getName()).toBe('title');
    expect(traits[0].getType()).toBe('text');
  });
});
