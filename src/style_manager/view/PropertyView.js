/**
 * PropertyView - Renders a single CSS property input
 *
 * Creates the appropriate input element based on property type.
 * Binds model changes to DOM and DOM changes to model.
 */

import { PROPERTY_TYPES } from '../model/Property.js';
import { kebabCase, debounce } from '../../core/utils.js';

const PFX = 'vb-sm';

export default class PropertyView {
  /**
   * @param {Object} opts
   * @param {import('../model/Property.js').default} opts.property
   * @param {import('../../editor/EditorModel.js').default} [opts.em]
   * @param {Function} [opts.onChange] - Called when property value changes
   */
  constructor(opts = {}) {
    this.property = opts.property;
    this.em = opts.em || null;
    this.onChange = opts.onChange || (() => {});
    this.el = null;
    this._inputEl = null;
    this._cleanups = [];
  }

  /**
   * Render the property view
   * @returns {HTMLElement}
   */
  render() {
    const prop = this.property;
    const el = document.createElement('div');
    el.className = `${PFX}-property`;

    if (prop.get('full')) {
      el.classList.add(`${PFX}-property--full`);
    }

    // Label
    if (prop.getType() !== PROPERTY_TYPES.COMPOSITE || !prop.get('detached')) {
      const labelEl = document.createElement('div');
      labelEl.className = `${PFX}-property__label`;
      labelEl.textContent = prop.getLabel();
      if (prop.get('info')) {
        labelEl.title = prop.get('info');
      }

      // Clear button
      if (prop.get('canClear') && prop.hasValue()) {
        const clearBtn = document.createElement('span');
        clearBtn.className = `${PFX}-property__clear`;
        clearBtn.innerHTML = '&times;';
        clearBtn.title = 'Clear';
        clearBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          prop.clear();
          this.onChange(prop, '');
          this._updateInput();
        });
        labelEl.appendChild(clearBtn);
      }

      el.appendChild(labelEl);
    }

    // Field
    const fieldEl = document.createElement('div');
    fieldEl.className = `${PFX}-property__field`;

    const inputEl = this._createInput();
    if (inputEl) {
      fieldEl.appendChild(inputEl);
      this._inputEl = inputEl;
    }

    el.appendChild(fieldEl);
    this.el = el;

    // Listen for property changes
    const handler = () => this._updateInput();
    this.property.on('change:value', handler);
    this._cleanups.push(() => this.property.off('change:value', handler));

    return el;
  }

  /**
   * Create the input element based on property type
   * @private
   * @returns {HTMLElement}
   */
  _createInput() {
    const type = this.property.getType();

    switch (type) {
      case PROPERTY_TYPES.NUMBER: return this._createNumberInput();
      case PROPERTY_TYPES.SELECT: return this._createSelectInput();
      case PROPERTY_TYPES.RADIO: return this._createRadioInput();
      case PROPERTY_TYPES.COLOR: return this._createColorInput();
      case PROPERTY_TYPES.SLIDER: return this._createSliderInput();
      case PROPERTY_TYPES.COMPOSITE: return this._createCompositeInput();
      case PROPERTY_TYPES.STACK: return this._createStackInput();
      default: return this._createTextInput();
    }
  }

  /**
   * Text input
   * @private
   */
  _createTextInput() {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = `${PFX}-input`;
    input.value = this.property.getValue();
    input.placeholder = this.property.get('placeholder') || '';

    input.addEventListener('change', () => {
      this.property.setValue(input.value);
      this.onChange(this.property, input.value);
    });

    return input;
  }

  /**
   * Number input with unit selector
   * @private
   */
  _createNumberInput() {
    const wrapper = document.createElement('div');
    wrapper.className = `${PFX}-input-number`;

    const input = document.createElement('input');
    input.type = 'number';
    input.className = `${PFX}-input`;
    input.value = this.property.getValue();
    input.min = this.property.get('min');
    input.max = this.property.get('max');
    input.step = this.property.get('step');

    const units = this.property.getUnits();
    let unitEl = null;

    if (units.length > 0) {
      unitEl = document.createElement('select');
      unitEl.className = `${PFX}-input-unit`;
      for (const u of units) {
        const opt = document.createElement('option');
        opt.value = u;
        opt.textContent = u || '-';
        if (u === this.property.get('unit')) opt.selected = true;
        unitEl.appendChild(opt);
      }

      unitEl.addEventListener('change', () => {
        this.property.set('unit', unitEl.value, { silent: true });
        this._emitChange();
      });
    }

    const emitChange = () => {
      this.property.setValue(input.value);
      this.onChange(this.property, this.property.getFullValue());
    };

    input.addEventListener('change', emitChange);
    input.addEventListener('input', debounce(emitChange, 150));

    wrapper.appendChild(input);
    if (unitEl) wrapper.appendChild(unitEl);

    // Store refs for updates
    wrapper._input = input;
    wrapper._unit = unitEl;

    return wrapper;
  }

  /**
   * Select dropdown
   * @private
   */
  _createSelectInput() {
    const select = document.createElement('select');
    select.className = `${PFX}-input ${PFX}-input--select`;

    // Empty option
    const emptyOpt = document.createElement('option');
    emptyOpt.value = '';
    emptyOpt.textContent = '- Select -';
    select.appendChild(emptyOpt);

    for (const opt of this.property.getOptions()) {
      const option = document.createElement('option');
      option.value = opt.value || opt;
      option.textContent = opt.label || opt.value || opt;
      if ((opt.value || opt) === this.property.getValue()) option.selected = true;
      select.appendChild(option);
    }

    select.addEventListener('change', () => {
      this.property.setValue(select.value);
      this.onChange(this.property, select.value);
    });

    return select;
  }

  /**
   * Radio buttons
   * @private
   */
  _createRadioInput() {
    const wrapper = document.createElement('div');
    wrapper.className = `${PFX}-input-radio`;

    const name = `${PFX}-radio-${this.property.getProperty()}-${Date.now()}`;

    for (const opt of this.property.getOptions()) {
      const label = document.createElement('label');
      label.className = `${PFX}-radio-item`;
      label.title = opt.title || opt.label || opt.value;

      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = name;
      radio.value = opt.value;
      if (opt.value === this.property.getValue()) radio.checked = true;

      radio.addEventListener('change', () => {
        this.property.setValue(opt.value);
        this.onChange(this.property, opt.value);
      });

      const span = document.createElement('span');
      span.textContent = opt.label || opt.value;

      label.appendChild(radio);
      label.appendChild(span);
      wrapper.appendChild(label);
    }

    return wrapper;
  }

  /**
   * Color picker
   * @private
   */
  _createColorInput() {
    const wrapper = document.createElement('div');
    wrapper.className = `${PFX}-input-color`;

    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.className = `${PFX}-color-preview`;
    colorInput.value = this._normalizeColor(this.property.getValue()) || '#000000';

    const textInput = document.createElement('input');
    textInput.type = 'text';
    textInput.className = `${PFX}-input`;
    textInput.value = this.property.getValue();
    textInput.placeholder = '#000000';

    colorInput.addEventListener('input', () => {
      textInput.value = colorInput.value;
      this.property.setValue(colorInput.value);
      this.onChange(this.property, colorInput.value);
    });

    textInput.addEventListener('change', () => {
      colorInput.value = this._normalizeColor(textInput.value) || '#000000';
      this.property.setValue(textInput.value);
      this.onChange(this.property, textInput.value);
    });

    wrapper.appendChild(colorInput);
    wrapper.appendChild(textInput);
    wrapper._color = colorInput;
    wrapper._text = textInput;

    return wrapper;
  }

  /**
   * Range slider
   * @private
   */
  _createSliderInput() {
    const wrapper = document.createElement('div');
    wrapper.className = `${PFX}-input-slider`;

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.className = `${PFX}-slider`;
    slider.min = this.property.get('min');
    slider.max = this.property.get('max');
    slider.step = this.property.get('step');
    slider.value = this.property.getValue() || this.property.get('default') || 0;

    const valueLabel = document.createElement('span');
    valueLabel.className = `${PFX}-slider-value`;
    valueLabel.textContent = slider.value;

    slider.addEventListener('input', () => {
      valueLabel.textContent = slider.value;
      this.property.setValue(slider.value);
      this.onChange(this.property, this.property.getFullValue());
    });

    wrapper.appendChild(slider);
    wrapper.appendChild(valueLabel);
    wrapper._slider = slider;
    wrapper._label = valueLabel;

    return wrapper;
  }

  /**
   * Composite input (sub-properties)
   * @private
   */
  _createCompositeInput() {
    const subProps = this.property.getProperties();
    const wrapper = document.createElement('div');
    const count = subProps.length;
    wrapper.className = `${PFX}-composite${count === 4 ? ` ${PFX}-composite--four` : ''}`;

    for (const subProp of subProps) {
      const subView = new PropertyView({
        property: subProp,
        em: this.em,
        onChange: (prop, val) => {
          // Propagate change up through composite
          this.onChange(this.property, this.property.getFullValue());
        },
      });
      wrapper.appendChild(subView.render());
      this._cleanups.push(() => subView.destroy());
    }

    return wrapper;
  }

  /**
   * Stack input (layers)
   * @private
   */
  _createStackInput() {
    const wrapper = document.createElement('div');
    wrapper.className = `${PFX}-stack`;

    // Add layer button
    const addBtn = document.createElement('button');
    addBtn.className = `${PFX}-stack__add`;
    addBtn.textContent = '+ Add layer';
    addBtn.addEventListener('click', () => {
      this.property.addLayer({});
      this._renderStackLayers(wrapper);
      this.onChange(this.property, this.property.getFullValue());
    });

    wrapper.appendChild(addBtn);

    // Layers container
    const layersEl = document.createElement('div');
    layersEl.className = `${PFX}-stack__layers`;
    wrapper.appendChild(layersEl);
    wrapper._layers = layersEl;

    this._renderStackLayers(wrapper);

    return wrapper;
  }

  /**
   * Render stack layers
   * @private
   */
  _renderStackLayers(wrapper) {
    const layersEl = wrapper._layers;
    if (!layersEl) return;
    layersEl.innerHTML = '';

    const layers = this.property.getLayers();
    const subPropDefs = this.property.getProperties();

    layers.forEach((layer, idx) => {
      const layerEl = document.createElement('div');
      layerEl.className = `${PFX}-stack__layer`;

      // Layer header
      const header = document.createElement('div');
      header.className = `${PFX}-stack__layer-header`;
      header.textContent = `Layer ${idx + 1}`;

      const removeBtn = document.createElement('span');
      removeBtn.className = `${PFX}-stack__layer-remove`;
      removeBtn.innerHTML = '&times;';
      removeBtn.addEventListener('click', () => {
        this.property.removeLayer(idx);
        this._renderStackLayers(wrapper);
        this.onChange(this.property, this.property.getFullValue());
      });
      header.appendChild(removeBtn);
      layerEl.appendChild(header);

      // Layer properties
      const propsEl = document.createElement('div');
      propsEl.className = `${PFX}-composite`;

      const layerValues = layer.get('values') || {};

      for (const subPropDef of subPropDefs) {
        const subProp = this.property.constructor === Object
          ? subPropDef
          : new subPropDef.constructor({ ...subPropDef.toJSON(), value: layerValues[subPropDef.getProperty()] || '' });

        // Simple fallback: create inline property for layer
        const tmpProp = Object.create(subPropDef);
        tmpProp._attributes = { ...subPropDef._attributes, value: layerValues[subPropDef.getProperty()] || '' };

        const subView = new PropertyView({
          property: subPropDef,
          em: this.em,
          onChange: (prop, val) => {
            const vals = { ...(layer.get('values') || {}) };
            vals[prop.getProperty()] = val;
            layer.set('values', vals);
            this.onChange(this.property, this.property.getFullValue());
          },
        });
        propsEl.appendChild(subView.render());
      }

      layerEl.appendChild(propsEl);
      layersEl.appendChild(layerEl);
    });
  }

  /**
   * Update the input to reflect model value
   * @private
   */
  _updateInput() {
    if (!this._inputEl) return;
    const type = this.property.getType();
    const val = this.property.getValue();

    switch (type) {
      case PROPERTY_TYPES.NUMBER:
        if (this._inputEl._input) this._inputEl._input.value = val;
        if (this._inputEl._unit) this._inputEl._unit.value = this.property.get('unit');
        break;
      case PROPERTY_TYPES.COLOR:
        if (this._inputEl._color) this._inputEl._color.value = this._normalizeColor(val) || '#000000';
        if (this._inputEl._text) this._inputEl._text.value = val;
        break;
      case PROPERTY_TYPES.SLIDER:
        if (this._inputEl._slider) {
          this._inputEl._slider.value = val;
          this._inputEl._label.textContent = val;
        }
        break;
      default:
        if (this._inputEl.value !== undefined) {
          this._inputEl.value = val;
        }
    }
  }

  /**
   * Emit change event
   * @private
   */
  _emitChange() {
    this.onChange(this.property, this.property.getFullValue());
  }

  /**
   * Try to normalize color to hex
   * @private
   */
  _normalizeColor(val) {
    if (!val) return '';
    if (/^#[0-9a-f]{3,8}$/i.test(val)) return val;
    // For named colors or rgb, return as-is (color input needs hex)
    return val;
  }

  /**
   * Destroy the view
   */
  destroy() {
    for (const fn of this._cleanups) fn();
    this._cleanups = [];
    if (this.el && this.el.parentNode) {
      this.el.parentNode.removeChild(this.el);
    }
    this.el = null;
    this._inputEl = null;
  }
}
