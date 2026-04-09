import { describe, it, expect, vi, beforeEach } from 'vitest';
import PropertyView from '../../src/style_manager/view/PropertyView.js';
import SectorView from '../../src/style_manager/view/SectorView.js';
import SectorsView from '../../src/style_manager/view/SectorsView.js';
import Property, { PROPERTY_TYPES } from '../../src/style_manager/model/Property.js';
import Sector from '../../src/style_manager/model/Sector.js';

/**
 * Helper: create a Property model
 */
function createProp(attrs = {}) {
  return new Property({
    property: 'test-prop',
    label: 'Test',
    ...attrs,
  });
}

/**
 * Helper: render a PropertyView and return { view, el, property }
 */
function renderPropView(propAttrs = {}, viewOpts = {}) {
  const property = createProp(propAttrs);
  const onChange = viewOpts.onChange || vi.fn();
  const view = new PropertyView({ property, onChange, ...viewOpts });
  const el = view.render();
  return { view, el, property, onChange };
}

/**
 * Helper: create a Sector with properties already instantiated
 */
function createSector(attrs = {}, propDefs = []) {
  const properties = propDefs.map(p => new Property(p));
  return new Sector({ id: 'test-sector', name: 'Test Sector', properties, ...attrs });
}

describe('PropertyView', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  // ── Text input ──

  it('renders text input for text type', () => {
    const { el } = renderPropView({ type: PROPERTY_TYPES.TEXT, value: 'hello' });
    const input = el.querySelector('input[type="text"]');
    expect(input).toBeTruthy();
    expect(input.value).toBe('hello');
  });

  it('text input has correct CSS class', () => {
    const { el } = renderPropView({ type: PROPERTY_TYPES.TEXT });
    const input = el.querySelector('input.vb-sm-input');
    expect(input).toBeTruthy();
  });

  // ── Number input ──

  it('renders number input with unit selector for number type', () => {
    const { el } = renderPropView({
      type: PROPERTY_TYPES.NUMBER,
      value: '16',
      units: ['px', 'em', '%'],
      unit: 'px',
    });
    const numberInput = el.querySelector('input[type="number"]');
    expect(numberInput).toBeTruthy();
    expect(numberInput.value).toBe('16');

    const unitSelect = el.querySelector('select.vb-sm-input-unit');
    expect(unitSelect).toBeTruthy();
    expect(unitSelect.value).toBe('px');

    const options = unitSelect.querySelectorAll('option');
    expect(options.length).toBe(3);
  });

  it('number input omits unit selector when units array is empty', () => {
    const { el } = renderPropView({
      type: PROPERTY_TYPES.NUMBER,
      value: '10',
      units: [],
    });
    const unitSelect = el.querySelector('select');
    expect(unitSelect).toBeNull();
  });

  // ── Select dropdown ──

  it('renders select dropdown for select type', () => {
    const { el } = renderPropView({
      type: PROPERTY_TYPES.SELECT,
      options: [
        { value: 'block', label: 'Block' },
        { value: 'flex', label: 'Flex' },
        { value: 'none', label: 'None' },
      ],
      value: 'flex',
    });
    const select = el.querySelector('select.vb-sm-input--select');
    expect(select).toBeTruthy();
    expect(select.value).toBe('flex');

    // +1 for the "- Select -" empty option
    const opts = select.querySelectorAll('option');
    expect(opts.length).toBe(4);
  });

  // ── Color input ──

  it('renders color input (color + text) for color type', () => {
    const { el } = renderPropView({
      type: PROPERTY_TYPES.COLOR,
      value: '#ff0000',
    });
    const colorInput = el.querySelector('input[type="color"]');
    const textInput = el.querySelector('input[type="text"]');
    expect(colorInput).toBeTruthy();
    expect(textInput).toBeTruthy();
    expect(textInput.value).toBe('#ff0000');
  });

  // ── Slider input ──

  it('renders range slider for slider type', () => {
    const { el } = renderPropView({
      type: PROPERTY_TYPES.SLIDER,
      min: 0,
      max: 100,
      step: 1,
      value: '50',
    });
    const slider = el.querySelector('input[type="range"]');
    expect(slider).toBeTruthy();
    expect(slider.value).toBe('50');
    expect(slider.min).toBe('0');
    expect(slider.max).toBe('100');

    const valueLabel = el.querySelector('.vb-sm-slider-value');
    expect(valueLabel).toBeTruthy();
    expect(valueLabel.textContent).toBe('50');
  });

  // ── Radio input ──

  it('renders radio buttons for radio type', () => {
    const { el } = renderPropView({
      type: PROPERTY_TYPES.RADIO,
      options: [
        { value: 'left', label: 'Left' },
        { value: 'center', label: 'Center' },
        { value: 'right', label: 'Right' },
      ],
      value: 'center',
    });
    const radios = el.querySelectorAll('input[type="radio"]');
    expect(radios.length).toBe(3);

    // The one with value="center" should be checked
    const checked = el.querySelector('input[type="radio"]:checked');
    expect(checked).toBeTruthy();
    expect(checked.value).toBe('center');
  });

  // ── Composite input ──

  it('renders composite sub-properties', () => {
    const { el } = renderPropView({
      type: PROPERTY_TYPES.COMPOSITE,
      property: 'margin',
      properties: [
        { property: 'margin-top', type: 'number', units: ['px'], value: '10' },
        { property: 'margin-right', type: 'number', units: ['px'], value: '20' },
        { property: 'margin-bottom', type: 'number', units: ['px'], value: '10' },
        { property: 'margin-left', type: 'number', units: ['px'], value: '20' },
      ],
    });
    const compositeWrapper = el.querySelector('.vb-sm-composite');
    expect(compositeWrapper).toBeTruthy();

    // Each sub-property gets its own PropertyView
    const subProps = compositeWrapper.querySelectorAll('.vb-sm-property');
    expect(subProps.length).toBe(4);
  });

  // ── onChange callback ──

  it('onChange callback fires when text input changes', () => {
    const { el, onChange } = renderPropView({ type: PROPERTY_TYPES.TEXT, value: '' });
    const input = el.querySelector('input[type="text"]');
    input.value = 'new-val';
    input.dispatchEvent(new Event('change'));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('onChange callback fires when select changes', () => {
    const { el, onChange } = renderPropView({
      type: PROPERTY_TYPES.SELECT,
      options: [{ value: 'a' }, { value: 'b' }],
      value: 'a',
    });
    const select = el.querySelector('select');
    select.value = 'b';
    select.dispatchEvent(new Event('change'));
    expect(onChange).toHaveBeenCalled();
  });

  // ── Input reflects model value ──

  it('input reflects model value after model change', () => {
    const { el, property } = renderPropView({ type: PROPERTY_TYPES.TEXT, value: 'initial' });
    const input = el.querySelector('input[type="text"]');
    expect(input.value).toBe('initial');

    property.setValue('updated');
    // The change:value listener calls _updateInput
    expect(input.value).toBe('updated');
  });

  // ── Label rendering ──

  it('renders label from property label', () => {
    const { el } = renderPropView({ label: 'Font Size', type: PROPERTY_TYPES.TEXT });
    const label = el.querySelector('.vb-sm-property__label');
    expect(label).toBeTruthy();
    expect(label.textContent).toContain('Font Size');
  });

  // ── Destroy ──

  it('destroy cleans up element and listeners', () => {
    const { view, el, property } = renderPropView({ type: PROPERTY_TYPES.TEXT, value: 'x' });
    document.body.appendChild(el);
    expect(document.body.contains(el)).toBe(true);

    view.destroy();
    expect(view.el).toBeNull();
    expect(view._inputEl).toBeNull();
    expect(document.body.contains(el)).toBe(false);
  });
});

describe('SectorView', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renders sector with title and properties', () => {
    const sector = createSector({ name: 'Typography' }, [
      { property: 'font-size', type: 'number', units: ['px'], value: '16' },
      { property: 'color', type: 'color', value: '#000000' },
    ]);
    const sectorView = new SectorView({ sector, onChange: vi.fn() });
    const el = sectorView.render();

    expect(el.classList.contains('vb-sm-sector')).toBe(true);
    expect(el.getAttribute('data-sector')).toBe('test-sector');

    const name = el.querySelector('.vb-sm-sector__name');
    expect(name.textContent).toBe('Typography');

    const props = el.querySelectorAll('.vb-sm-property');
    expect(props.length).toBe(2);
  });

  it('renders arrow indicator reflecting open state', () => {
    const sector = createSector({ open: true });
    const sectorView = new SectorView({ sector, onChange: vi.fn() });
    const el = sectorView.render();
    const arrow = el.querySelector('.vb-sm-sector__arrow');
    // Open: down arrow
    expect(arrow.textContent).toBe('\u25BC');
  });

  it('sector toggle collapses properties', () => {
    const sector = createSector({ open: true }, [
      { property: 'color', type: 'text', value: 'red' },
    ]);
    const sectorView = new SectorView({ sector, onChange: vi.fn() });
    const el = sectorView.render();

    const propsContainer = el.querySelector('.vb-sm-sector__properties');
    expect(propsContainer.style.display).toBe('');

    // Simulate clicking title to toggle
    const title = el.querySelector('.vb-sm-sector__title');
    title.click();

    expect(sector.isOpen()).toBe(false);
    expect(propsContainer.style.display).toBe('none');
  });

  it('sector toggle expands properties when collapsed', () => {
    const sector = createSector({ open: false }, [
      { property: 'color', type: 'text', value: 'red' },
    ]);
    const sectorView = new SectorView({ sector, onChange: vi.fn() });
    const el = sectorView.render();

    const propsContainer = el.querySelector('.vb-sm-sector__properties');
    expect(propsContainer.style.display).toBe('none');

    const title = el.querySelector('.vb-sm-sector__title');
    title.click();

    expect(sector.isOpen()).toBe(true);
    expect(propsContainer.style.display).toBe('');
  });

  it('arrow updates after toggle', () => {
    const sector = createSector({ open: true });
    const sectorView = new SectorView({ sector, onChange: vi.fn() });
    const el = sectorView.render();
    const arrow = el.querySelector('.vb-sm-sector__arrow');

    expect(arrow.textContent).toBe('\u25BC');
    el.querySelector('.vb-sm-sector__title').click();
    expect(arrow.textContent).toBe('\u25B6');
  });

  it('updateFromStyles updates all property values', () => {
    const sector = createSector({}, [
      { property: 'color', type: 'text', value: '' },
      { property: 'font-size', type: 'number', units: ['px'], value: '' },
    ]);
    const sectorView = new SectorView({ sector, onChange: vi.fn() });
    sectorView.render();

    sectorView.updateFromStyles({ color: 'blue', 'font-size': '20px' });

    const colorProp = sector.getProperty('color');
    expect(colorProp.getValue()).toBe('blue');
  });

  it('hidden sector has display:none', () => {
    const sector = createSector({ visible: false });
    const sectorView = new SectorView({ sector, onChange: vi.fn() });
    const el = sectorView.render();
    expect(el.style.display).toBe('none');
  });

  it('destroy cleans up child property views', () => {
    const sector = createSector({}, [
      { property: 'color', type: 'text', value: 'red' },
    ]);
    const sectorView = new SectorView({ sector, onChange: vi.fn() });
    const el = sectorView.render();
    document.body.appendChild(el);

    sectorView.destroy();
    expect(sectorView.el).toBeNull();
    expect(sectorView._propertyViews.length).toBe(0);
  });
});

describe('SectorsView', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renders all sectors', () => {
    const sectors = [
      createSector({ id: 'general', name: 'General' }, [
        { property: 'display', type: 'select', options: ['block', 'flex'] },
      ]),
      createSector({ id: 'typo', name: 'Typography' }, [
        { property: 'font-size', type: 'number', units: ['px'] },
      ]),
    ];
    const sectorsView = new SectorsView({ sectors, onChange: vi.fn() });
    const el = sectorsView.render();

    expect(el.classList.contains('vb-sm-sectors')).toBe(true);

    const sectorEls = el.querySelectorAll('.vb-sm-sector');
    expect(sectorEls.length).toBe(2);
  });

  it('renders empty message element (hidden by default)', () => {
    const sectorsView = new SectorsView({ sectors: [], onChange: vi.fn() });
    const el = sectorsView.render();

    const emptyEl = el.querySelector('.vb-sm-empty');
    expect(emptyEl).toBeTruthy();
    expect(emptyEl.style.display).toBe('none');
    expect(emptyEl.textContent).toContain('Select a component');
  });

  it('setEmpty(true) shows empty message and hides sectors', () => {
    const sectors = [
      createSector({ id: 's1', name: 'S1' }),
    ];
    const sectorsView = new SectorsView({ sectors, onChange: vi.fn() });
    const el = sectorsView.render();

    sectorsView.setEmpty(true);

    const emptyEl = el.querySelector('.vb-sm-empty');
    expect(emptyEl.style.display).toBe('');

    const sectorEl = el.querySelector('.vb-sm-sector');
    expect(sectorEl.style.display).toBe('none');
  });

  it('setEmpty(false) hides empty message and shows sectors', () => {
    const sectors = [
      createSector({ id: 's1', name: 'S1' }),
    ];
    const sectorsView = new SectorsView({ sectors, onChange: vi.fn() });
    const el = sectorsView.render();

    sectorsView.setEmpty(true);
    sectorsView.setEmpty(false);

    const emptyEl = el.querySelector('.vb-sm-empty');
    expect(emptyEl.style.display).toBe('none');

    const sectorEl = el.querySelector('.vb-sm-sector');
    expect(sectorEl.style.display).toBe('');
  });

  it('updateFromStyles propagates to all sector views', () => {
    const sectors = [
      createSector({ id: 'gen' }, [
        { property: 'display', type: 'text', value: '' },
      ]),
      createSector({ id: 'typo' }, [
        { property: 'color', type: 'text', value: '' },
      ]),
    ];
    const sectorsView = new SectorsView({ sectors, onChange: vi.fn() });
    sectorsView.render();

    sectorsView.updateFromStyles({ display: 'flex', color: 'blue' });

    expect(sectors[0].getProperty('display').getValue()).toBe('flex');
    expect(sectors[1].getProperty('color').getValue()).toBe('blue');
  });

  it('destroy cleans up all sector views', () => {
    const sectors = [
      createSector({ id: 's1' }, [{ property: 'color', type: 'text' }]),
      createSector({ id: 's2' }, [{ property: 'margin', type: 'number' }]),
    ];
    const sectorsView = new SectorsView({ sectors, onChange: vi.fn() });
    const el = sectorsView.render();
    document.body.appendChild(el);

    sectorsView.destroy();
    expect(sectorsView.el).toBeNull();
    expect(sectorsView._sectorViews.length).toBe(0);
    expect(document.body.contains(el)).toBe(false);
  });
});
