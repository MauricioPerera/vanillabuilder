import { describe, it, expect, vi, beforeEach } from 'vitest';
import Device from '../../src/device_manager/model/Device.js';
import DeviceManager from '../../src/device_manager/index.js';

describe('Device model', () => {
  it('should have correct defaults', () => {
    const d = new Device();
    expect(d.get('id')).toBe('');
    expect(d.get('name')).toBe('');
    expect(d.get('width')).toBe('');
    expect(d.get('height')).toBe('');
    expect(d.get('widthMedia')).toBe('');
    expect(d.get('priority')).toBe(0);
  });

  it('should accept attributes at construction', () => {
    const d = new Device({ id: 'tablet', name: 'Tablet', width: '768px', height: '1024px' });
    expect(d.get('id')).toBe('tablet');
    expect(d.get('name')).toBe('Tablet');
  });

  it('should return name via getName', () => {
    const d = new Device({ id: 'test', name: 'Test Device' });
    expect(d.getName()).toBe('Test Device');
  });

  it('should fall back to id if name is empty in getName', () => {
    const d = new Device({ id: 'fallback-id' });
    expect(d.getName()).toBe('fallback-id');
  });

  it('should return width value via getWidthValue', () => {
    const d = new Device({ width: '768px' });
    expect(d.getWidthValue()).toBe(768);
  });

  it('should return 0 for empty width in getWidthValue', () => {
    const d = new Device({ width: '' });
    expect(d.getWidthValue()).toBe(0);
  });

  it('should return media condition string', () => {
    const d = new Device({ widthMedia: '992px' });
    expect(d.getMediaCondition()).toBe('(max-width: 992px)');
  });

  it('should return empty string for empty widthMedia', () => {
    const d = new Device({ widthMedia: '' });
    expect(d.getMediaCondition()).toBe('');
  });
});

describe('DeviceManager', () => {
  let mockEditor;
  let dm;

  beforeEach(() => {
    mockEditor = {
      getConfig: (k) => k ? undefined : {},
      getModule: () => null,
      on: () => {},
      trigger: () => {},
      t: (k) => k,
    };
    dm = new DeviceManager(mockEditor);
  });

  it('should have built-in presets (Desktop, Tablet, Mobile Landscape, Mobile)', () => {
    const all = dm.getAll();
    const ids = all.map(d => d.get('id'));
    expect(ids).toContain('desktop');
    expect(ids).toContain('tablet');
    expect(ids).toContain('mobileLandscape');
    expect(ids).toContain('mobile');
  });

  it('should add a custom device', () => {
    dm.add({ id: 'custom', name: 'Custom', width: '500px' });
    const device = dm.get('custom');
    expect(device).toBeDefined();
    expect(device.get('name')).toBe('Custom');
  });

  it('should get device by id', () => {
    const tablet = dm.get('tablet');
    expect(tablet).toBeDefined();
    expect(tablet.getName()).toBe('Tablet');
  });

  it('should return undefined for unknown device id', () => {
    expect(dm.get('nonexistent')).toBeUndefined();
  });

  it('should select a device by id', () => {
    const result = dm.select('mobile');
    expect(result).toBeDefined();
    expect(result.get('id')).toBe('mobile');
  });

  it('should getSelected returning the selected device', () => {
    dm.select('tablet');
    const selected = dm.getSelected();
    expect(selected).toBeDefined();
    expect(selected.get('id')).toBe('tablet');
  });

  it('should default to desktop selected', () => {
    const selected = dm.getSelected();
    expect(selected).toBeDefined();
    expect(selected.get('id')).toBe('desktop');
  });

  it('should return all devices via getAll', () => {
    const all = dm.getAll();
    expect(all.length).toBeGreaterThanOrEqual(4);
  });

  it('should remove a device', () => {
    dm.add({ id: 'temp', name: 'Temp', width: '400px' });
    const removed = dm.remove('temp');
    expect(removed).toBeDefined();
    expect(dm.get('temp')).toBeUndefined();
  });

  it('should render a select element with options', () => {
    const el = dm.render();
    expect(el).toBeInstanceOf(HTMLElement);
    expect(el.tagName).toBe('DIV');
    const select = el.querySelector('select');
    expect(select).toBeDefined();
    expect(select.options.length).toBeGreaterThanOrEqual(4);
  });
});
