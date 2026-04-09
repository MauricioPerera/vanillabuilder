/**
 * StyleManager - CSS property editing panel module
 *
 * Manages the Style Manager panel where users edit CSS properties
 * of selected components. Organizes properties into sectors
 * (General, Typography, Decorations, Flex, etc.).
 *
 * Integrates with:
 * - Component model (inline styles)
 * - CssComposer (CSS rules)
 * - SelectorManager (class-based styles)
 */

import { Module, debounce, isObject, isString, isArray } from '../core/index.js';
import Property from './model/Property.js';
import Sector from './model/Sector.js';
import PropertyFactory from './model/PropertyFactory.js';
import SectorsView from './view/SectorsView.js';

/** @type {Object} StyleManager events */
export const StyleManagerEvents = {
  update: 'style:update',
  sectorAdd: 'style:sector:add',
  sectorRemove: 'style:sector:remove',
  propertyChange: 'style:property:change',
  targetUpdate: 'style:target:update',
};

export default class StyleManager extends Module {
  /**
   * @param {import('../editor/EditorModel.js').default} editor
   * @param {Object} [config={}]
   */
  constructor(editor, config = {}) {
    super(editor, config, {
      /** @type {Array<Object>} Custom sectors to add/override */
      sectors: [],
      /** @type {boolean} Whether to append default sectors */
      appendDefaultSectors: true,
      /** @type {string} Style prefix */
      stylePrefix: 'vb-sm-',
    });

    /** @type {PropertyFactory} */
    this._factory = new PropertyFactory(editor);

    /** @type {Sector[]} All sectors */
    this._sectors = [];

    /** @type {SectorsView|null} */
    this._sectorsView = null;

    /** @type {import('../dom_components/model/Component.js').default|null} Current target */
    this._target = null;

    /** @type {Function} Debounced update */
    this._debouncedUpdate = debounce(() => this._updateFromTarget(), 50);
  }

  /**
   * Called after all modules initialized
   */
  onInit() {
    this._initSectors();
    this._setupListeners();
  }

  /**
   * Initialize sectors with built-in and custom definitions
   * @private
   */
  _initSectors() {
    const builtIn = this._factory.getBuiltInSectors();
    const custom = this.config.sectors || [];

    let sectorDefs = [];

    if (this.config.appendDefaultSectors !== false) {
      sectorDefs = [...builtIn];
    }

    // Merge custom sectors
    for (const customSec of custom) {
      const existing = sectorDefs.find(s => s.id === customSec.id);
      if (existing) {
        // Merge properties
        Object.assign(existing, customSec);
      } else {
        sectorDefs.push(customSec);
      }
    }

    // Sort by order
    sectorDefs.sort((a, b) => (a.order || 0) - (b.order || 0));

    // Create Sector models with Property models
    this._sectors = sectorDefs.map(def => {
      const properties = this._factory.createAll(def.properties || []);
      return new Sector({
        ...def,
        properties,
      });
    });
  }

  /**
   * Setup editor event listeners
   * @private
   */
  _setupListeners() {
    const em = this.em;
    if (!em) return;

    // Listen for component selection changes
    this.listenTo(em, 'component:toggled', () => this._debouncedUpdate());
    this.listenTo(em, 'component:update:style', () => this._debouncedUpdate());
    this.listenTo(em, 'component:update:classes', () => this._debouncedUpdate());
  }

  /**
   * Update properties from the currently selected component
   * @private
   */
  _updateFromTarget() {
    const em = this.em;
    if (!em) return;

    const selected = em.getSelected();

    if (!selected) {
      this._target = null;
      if (this._sectorsView) {
        this._sectorsView.setEmpty(true);
      }
      return;
    }

    this._target = selected;

    // Get combined styles (inline + CSS rules)
    const styles = this._getTargetStyles(selected);

    // Update all sectors/properties
    if (this._sectorsView) {
      this._sectorsView.setEmpty(false);
      this._sectorsView.updateFromStyles(styles);
    }

    this.trigger(StyleManagerEvents.targetUpdate, selected, styles);
  }

  /**
   * Get combined styles for a component
   * @private
   * @param {import('../dom_components/model/Component.js').default} component
   * @returns {Object}
   */
  _getTargetStyles(component) {
    // Start with inline styles
    const styles = { ...component.getStyle() };

    // TODO: Also get styles from CSS rules via CssComposer
    // const cssComposer = this.em.getModule('Css');
    // const classes = component.getClasses();
    // ... merge CSS rule styles

    return styles;
  }

  /**
   * Handle property change from the UI
   * @private
   * @param {Property} property
   * @param {string} value
   */
  _onPropertyChange(property, value) {
    const target = this._target;
    if (!target) return;

    const style = property.toStyle();
    if (isObject(style) && Object.keys(style).length) {
      target.addStyle(style);
    }

    this.trigger(StyleManagerEvents.propertyChange, property, value, target);
    this.em?.trigger(StyleManagerEvents.propertyChange, property, value, target);
  }

  // ── Public API ──

  /**
   * Get all sectors
   * @returns {Sector[]}
   */
  getSectors() {
    return [...this._sectors];
  }

  /**
   * Get a sector by ID
   * @param {string} id
   * @returns {Sector|undefined}
   */
  getSector(id) {
    return this._sectors.find(s => s.getId() === id);
  }

  /**
   * Add a new sector
   * @param {string} id
   * @param {Object} sectorDef
   * @returns {Sector}
   */
  addSector(id, sectorDef = {}) {
    const properties = this._factory.createAll(sectorDef.properties || []);
    const sector = new Sector({ ...sectorDef, id, properties });
    this._sectors.push(sector);
    this.trigger(StyleManagerEvents.sectorAdd, sector);

    // Re-render if view exists
    if (this._sectorsView && this._view) {
      this._renderView();
    }

    return sector;
  }

  /**
   * Remove a sector
   * @param {string} id
   * @returns {Sector|undefined}
   */
  removeSector(id) {
    const idx = this._sectors.findIndex(s => s.getId() === id);
    if (idx !== -1) {
      const [removed] = this._sectors.splice(idx, 1);
      this.trigger(StyleManagerEvents.sectorRemove, removed);
      return removed;
    }
    return undefined;
  }

  /**
   * Add a property to a sector
   * @param {string} sectorId
   * @param {Object} propDef
   * @returns {Property|undefined}
   */
  addProperty(sectorId, propDef) {
    const sector = this.getSector(sectorId);
    if (!sector) return undefined;

    const property = this._factory.create(propDef);
    sector.addProperty(property);
    return property;
  }

  /**
   * Get a property by CSS property name (searches all sectors)
   * @param {string} propName
   * @returns {Property|undefined}
   */
  getProperty(propName) {
    for (const sector of this._sectors) {
      const prop = sector.getProperty(propName);
      if (prop) return prop;
    }
    return undefined;
  }

  /**
   * Get all properties across all sectors
   * @returns {Property[]}
   */
  getProperties() {
    return this._sectors.flatMap(s => s.getProperties());
  }

  /**
   * Select target component(s) for styling
   * @param {import('../dom_components/model/Component.js').default|Array} targets
   */
  select(targets) {
    const target = Array.isArray(targets) ? targets[0] : targets;
    this._target = target || null;
    this._updateFromTarget();
  }

  /**
   * Get current target
   * @returns {import('../dom_components/model/Component.js').default|null}
   */
  getTarget() {
    return this._target;
  }

  /**
   * Render the Style Manager panel
   * @returns {HTMLElement}
   */
  render() {
    this._renderView();
    return this._view;
  }

  /**
   * @private
   */
  _renderView() {
    // Destroy old view
    if (this._sectorsView) {
      this._sectorsView.destroy();
    }

    // Create container
    const container = document.createElement('div');
    container.className = `${this.pfx}style-manager`;

    // Create sectors view
    this._sectorsView = new SectorsView({
      sectors: this._sectors,
      em: this.em,
      onChange: (prop, value) => this._onPropertyChange(prop, value),
    });

    const sectorsEl = this._sectorsView.render();
    container.appendChild(sectorsEl);

    // Update from current selection
    if (this._target) {
      this._updateFromTarget();
    } else {
      this._sectorsView.setEmpty(true);
    }

    this._view = container;
    return container;
  }

  /**
   * Destroy the module
   */
  destroy() {
    this._debouncedUpdate.cancel?.();
    if (this._sectorsView) {
      this._sectorsView.destroy();
      this._sectorsView = null;
    }
    this._sectors = [];
    this._target = null;
    super.destroy();
  }
}
