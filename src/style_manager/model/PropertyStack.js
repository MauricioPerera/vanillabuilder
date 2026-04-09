/**
 * PropertyStack - Stacked/layered CSS property (e.g., background, box-shadow)
 *
 * Contains multiple layers, each with its own set of sub-properties.
 */
import Property, { PROPERTY_TYPES } from './Property.js';
import { ReactiveCollection, ReactiveModel } from '../../core/index.js';

/**
 * Layer - A single layer in the stack
 */
export class Layer extends ReactiveModel {
  defaults() {
    return {
      /** @type {Object} Style values for this layer */
      values: {},
      /** @type {boolean} Whether layer is active */
      active: true,
    };
  }

  /**
   * Get the combined value string for this layer
   * @param {Property[]} properties - Sub-property definitions
   * @param {string} separator
   * @returns {string}
   */
  getValueString(properties, separator = ' ') {
    const vals = this.get('values') || {};
    return properties
      .map(p => vals[p.getProperty()] || p.get('default') || '')
      .filter(Boolean)
      .join(separator);
  }
}

export default class PropertyStack extends Property {
  defaults() {
    return {
      ...super.defaults(),
      type: PROPERTY_TYPES.STACK,
      properties: [],
      layers: [],
      layerSeparator: ', ',
      preview: false,
    };
  }

  initialize(attrs, opts) {
    super.initialize(attrs, opts);

    /** @type {ReactiveCollection} */
    this._layers = new ReactiveCollection([], { model: Layer });

    // Initialize layers from attrs
    const layers = this.get('layers') || [];
    if (layers.length) {
      this._layers.reset(layers.map(l => l instanceof Layer ? l : new Layer(l)), { silent: true });
    }
  }

  /**
   * Get all layers
   * @returns {ReactiveCollection}
   */
  getLayers() {
    return this._layers;
  }

  /**
   * Add a new layer
   * @param {Object} [values={}]
   * @returns {Layer}
   */
  addLayer(values = {}) {
    const layer = new Layer({ values });
    this._layers.add(layer);
    this.trigger('change:layers', this);
    return layer;
  }

  /**
   * Remove a layer
   * @param {Layer|number} layer - Layer model or index
   */
  removeLayer(layer) {
    if (typeof layer === 'number') {
      layer = this._layers.at(layer);
    }
    if (layer) {
      this._layers.remove(layer);
      this.trigger('change:layers', this);
    }
  }

  /**
   * Move a layer to a new position
   * @param {number} fromIdx
   * @param {number} toIdx
   */
  moveLayer(fromIdx, toIdx) {
    const models = [...this._layers.models];
    const [moved] = models.splice(fromIdx, 1);
    models.splice(toIdx, 0, moved);
    this._layers.reset(models);
    this.trigger('change:layers', this);
  }

  /**
   * Get the combined value from all layers
   * @returns {string}
   */
  getFullValue() {
    const subProps = this.getProperties();
    const sep = this.get('layerSeparator');
    return this._layers.models
      .filter(l => l.get('active'))
      .map(l => l.getValueString(subProps))
      .filter(Boolean)
      .join(sep);
  }

  /**
   * Convert to style
   * @returns {Object}
   */
  toStyle() {
    const val = this.getFullValue();
    if (!val) return {};
    return { [this.getProperty()]: val };
  }

  /**
   * Read from styles
   * @param {Object} styles
   * @returns {this}
   */
  fromStyle(styles) {
    const val = styles[this.getProperty()];
    if (!val) {
      this._layers.reset([], { silent: true });
      return this;
    }

    const sep = this.get('layerSeparator').trim();
    const layerStrings = String(val).split(sep);
    const layers = layerStrings.map(str => {
      const values = {};
      const parts = str.trim().split(/\s+/);
      const subProps = this.getProperties();
      subProps.forEach((p, i) => {
        values[p.getProperty()] = parts[i] || '';
      });
      return new Layer({ values });
    });

    this._layers.reset(layers, { silent: true });
    return this;
  }
}
