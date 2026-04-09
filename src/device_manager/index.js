/**
 * DeviceManager - Module for managing responsive device presets
 *
 * Provides built-in device presets (Desktop, Tablet, Mobile) and
 * supports custom device definitions. Selecting a device resizes
 * the canvas to the specified viewport dimensions.
 */

import { ItemManagerModule } from '../core/index.js';
import Device from './model/Device.js';

export default class DeviceManager extends ItemManagerModule {
  /**
   * @param {import('../editor/EditorModel.js').default} editor
   * @param {Object} [config={}]
   */
  constructor(editor, config = {}) {
    super(editor, config, {
      stylePrefix: 'dvm-',
      /** @type {Object[]} Additional device presets */
      devices: [],
    });

    this.events = {
      add: 'device:add',
      remove: 'device:remove',
      update: 'device:update',
      reset: 'device:reset',
    };

    /** @type {Device|null} Currently selected device */
    this._selected = null;

    // Add built-in presets
    this._addDefaults();

    // Add user-configured devices
    const userDevices = this.getConfig('devices') || [];
    if (userDevices.length) {
      this.add(userDevices);
    }

    // Select desktop by default
    this.select('desktop');

    this.onInit();
  }

  /** @type {typeof Device} */
  get Model() {
    return Device;
  }

  /**
   * Add built-in device presets
   * @private
   */
  _addDefaults() {
    const defaults = [
      {
        id: 'desktop',
        name: 'Desktop',
        width: '',
        height: '',
        widthMedia: '',
        priority: 0,
      },
      {
        id: 'tablet',
        name: 'Tablet',
        width: '768px',
        height: '1024px',
        widthMedia: '992px',
        priority: 10,
      },
      {
        id: 'mobileLandscape',
        name: 'Mobile Landscape',
        width: '568px',
        height: '320px',
        widthMedia: '768px',
        priority: 20,
      },
      {
        id: 'mobile',
        name: 'Mobile',
        width: '320px',
        height: '568px',
        widthMedia: '480px',
        priority: 30,
      },
    ];

    for (const d of defaults) {
      this.add(d);
    }
  }

  /**
   * Add a device
   * @param {Object|Object[]} device
   * @param {Object} [opts={}]
   * @returns {Device|Device[]}
   */
  add(device, opts = {}) {
    return super.add(device, opts);
  }

  /**
   * Select a device by ID
   * @param {string} id
   * @returns {Device|undefined}
   */
  select(id) {
    const device = this.get(id);
    if (!device) return undefined;

    const prev = this._selected;
    this._selected = device;

    this.trigger('device:select', device, prev);
    this._em?.trigger('device:select', device, prev);

    return device;
  }

  /**
   * Get the currently selected device
   * @returns {Device|null}
   */
  getSelected() {
    return this._selected;
  }

  /**
   * Render device selector UI
   * @returns {HTMLElement}
   */
  render() {
    const pfx = this.pfx;
    const el = document.createElement('div');
    el.className = `${pfx}devices`;

    const select = document.createElement('select');
    select.className = `${pfx}device-select`;

    for (const device of this.getAll()) {
      const option = document.createElement('option');
      option.value = device.get('id');
      option.textContent = device.getName();
      if (this._selected && this._selected.get('id') === device.get('id')) {
        option.selected = true;
      }
      select.appendChild(option);
    }

    select.addEventListener('change', () => {
      this.select(select.value);
    });

    el.appendChild(select);
    this._view = el;
    return el;
  }
}
