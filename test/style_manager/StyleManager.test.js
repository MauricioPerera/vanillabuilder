import { describe, it, expect, vi } from 'vitest';
import Property, { PROPERTY_TYPES } from '../../src/style_manager/model/Property.js';
import PropertyNumber from '../../src/style_manager/model/PropertyNumber.js';
import PropertySelect from '../../src/style_manager/model/PropertySelect.js';
import PropertyColor from '../../src/style_manager/model/PropertyColor.js';
import PropertySlider from '../../src/style_manager/model/PropertySlider.js';
import PropertyComposite from '../../src/style_manager/model/PropertyComposite.js';
import PropertyStack from '../../src/style_manager/model/PropertyStack.js';
import Sector from '../../src/style_manager/model/Sector.js';
import PropertyFactory from '../../src/style_manager/model/PropertyFactory.js';

describe('Property', () => {
  it('should create with defaults', () => {
    const p = new Property({ property: 'color' });
    expect(p.getProperty()).toBe('color');
    expect(p.getType()).toBe('text');
    expect(p.getLabel()).toBe('Color');
  });

  it('should auto-generate label from property name', () => {
    const p = new Property({ property: 'font-size' });
    expect(p.getLabel()).toBe('Font Size');
  });

  it('should get/set value', () => {
    const p = new Property({ property: 'color', value: 'red' });
    expect(p.getValue()).toBe('red');
    p.setValue('blue');
    expect(p.getValue()).toBe('blue');
  });

  it('should return default when no value set', () => {
    const p = new Property({ property: 'opacity', default: '1' });
    expect(p.getValue()).toBe('1');
  });

  it('should convert to style object', () => {
    const p = new Property({ property: 'color', value: 'red' });
    expect(p.toStyle()).toEqual({ color: 'red' });
  });

  it('should read from style object', () => {
    const p = new Property({ property: 'color' });
    p.fromStyle({ color: 'blue', 'font-size': '14px' });
    expect(p.getValue()).toBe('blue');
  });

  it('should clear value', () => {
    const p = new Property({ property: 'color', value: 'red' });
    p.clear();
    expect(p.hasValue()).toBe(false);
  });

  it('should fire change events', () => {
    const p = new Property({ property: 'color' });
    const fn = vi.fn();
    p.on('change:value', fn);
    p.setValue('red');
    expect(fn).toHaveBeenCalled();
  });
});

describe('PropertyNumber', () => {
  it('should have number type', () => {
    const p = new PropertyNumber({ property: 'width' });
    expect(p.getType()).toBe('number');
  });

  it('should have default units', () => {
    const p = new PropertyNumber({ property: 'width' });
    expect(p.getUnits()).toContain('px');
    expect(p.getUnits()).toContain('em');
    expect(p.getUnits()).toContain('%');
  });

  it('should produce full value with unit', () => {
    const p = new PropertyNumber({ property: 'width', value: '100', unit: 'px' });
    expect(p.getFullValue()).toBe('100px');
  });

  it('should parse value with unit', () => {
    const p = new PropertyNumber({ property: 'width' });
    p.setValue('20em');
    expect(p.getValue()).toBe('20');
    expect(p.get('unit')).toBe('em');
  });
});

describe('PropertySelect', () => {
  it('should have options', () => {
    const p = new PropertySelect({
      property: 'display',
      options: [{ value: 'block' }, { value: 'flex' }],
    });
    expect(p.getOptions()).toHaveLength(2);
    expect(p.getOptions()[0].value).toBe('block');
  });
});

describe('PropertyColor', () => {
  it('should store color value', () => {
    const p = new PropertyColor({ property: 'color', value: '#ff0000' });
    expect(p.getValue()).toBe('#ff0000');
    expect(p.toStyle()).toEqual({ color: '#ff0000' });
  });
});

describe('PropertySlider', () => {
  it('should have slider defaults', () => {
    const p = new PropertySlider({ property: 'opacity', min: 0, max: 1, step: 0.01 });
    expect(p.getType()).toBe('slider');
    expect(p.get('min')).toBe(0);
    expect(p.get('max')).toBe(1);
    expect(p.get('step')).toBe(0.01);
  });
});

describe('PropertyComposite', () => {
  it('should manage sub-properties', () => {
    const p = new PropertyComposite({
      property: 'margin',
      detached: true,
      properties: [
        { property: 'margin-top', type: 'number', value: '10', unit: 'px' },
        { property: 'margin-right', type: 'number', value: '20', unit: 'px' },
      ],
    });
    expect(p.getProperties()).toHaveLength(2);
  });

  it('should produce detached styles', () => {
    const p = new PropertyComposite({
      property: 'margin',
      detached: true,
      properties: [
        { property: 'margin-top', type: 'number', value: '10', unit: 'px' },
        { property: 'margin-right', type: 'number', value: '20', unit: 'px' },
      ],
    });
    const style = p.toStyle();
    expect(style['margin-top']).toBe('10px');
    expect(style['margin-right']).toBe('20px');
  });

  it('should produce combined value when not detached', () => {
    const p = new PropertyComposite({
      property: 'border',
      properties: [
        { property: 'border-width', type: 'number', value: '1', unit: 'px' },
        { property: 'border-style', type: 'select', value: 'solid' },
        { property: 'border-color', type: 'color', value: '#000' },
      ],
    });
    expect(p.getFullValue()).toBe('1px solid #000');
    expect(p.toStyle()).toEqual({ border: '1px solid #000' });
  });
});

describe('PropertyStack', () => {
  it('should manage layers', () => {
    const p = new PropertyStack({
      property: 'box-shadow',
      properties: [
        { property: 'box-shadow-h', type: 'number', unit: 'px' },
        { property: 'box-shadow-v', type: 'number', unit: 'px' },
      ],
    });

    p.addLayer({ 'box-shadow-h': '0', 'box-shadow-v': '5px' });
    expect(p.getLayers().length).toBe(1);

    p.removeLayer(0);
    expect(p.getLayers().length).toBe(0);
  });
});

describe('Sector', () => {
  it('should create with properties', () => {
    const s = new Sector({
      id: 'typography',
      name: 'Typography',
      properties: [
        new Property({ property: 'color' }),
        new Property({ property: 'font-size' }),
      ],
    });
    expect(s.getId()).toBe('typography');
    expect(s.getName()).toBe('Typography');
    expect(s.getProperties()).toHaveLength(2);
  });

  it('should toggle open/close', () => {
    const s = new Sector({ id: 'test', open: true });
    expect(s.isOpen()).toBe(true);
    s.toggle();
    expect(s.isOpen()).toBe(false);
    s.toggle();
    expect(s.isOpen()).toBe(true);
  });

  it('should find property by name', () => {
    const s = new Sector({
      id: 'test',
      properties: [
        new Property({ property: 'color' }),
        new Property({ property: 'font-size' }),
      ],
    });
    const found = s.getProperty('font-size');
    expect(found).toBeDefined();
    expect(found.getProperty()).toBe('font-size');
  });
});

describe('PropertyFactory', () => {
  it('should create properties of correct types', () => {
    const factory = new PropertyFactory();
    const p1 = factory.create({ property: 'color', type: 'color' });
    const p2 = factory.create({ property: 'width', type: 'number' });
    const p3 = factory.create({ property: 'display', type: 'select', options: [] });

    expect(p1.getType()).toBe('color');
    expect(p2.getType()).toBe('number');
    expect(p3.getType()).toBe('select');
  });

  it('should provide built-in sectors', () => {
    const factory = new PropertyFactory();
    const sectors = factory.getBuiltInSectors();
    expect(sectors.length).toBeGreaterThan(4);

    const names = sectors.map(s => s.id);
    expect(names).toContain('general');
    expect(names).toContain('typography');
    expect(names).toContain('decorations');
    expect(names).toContain('flex');
  });

  it('should create all properties from definitions', () => {
    const factory = new PropertyFactory();
    const props = factory.createAll([
      { property: 'color', type: 'color' },
      { property: 'font-size', type: 'number' },
    ]);
    expect(props).toHaveLength(2);
    expect(props[0].getType()).toBe('color');
    expect(props[1].getType()).toBe('number');
  });
});
