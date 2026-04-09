/**
 * SectorView - Renders a collapsible sector of CSS properties
 */

import PropertyView from './PropertyView.js';

const PFX = 'vb-sm';

export default class SectorView {
  /**
   * @param {Object} opts
   * @param {import('../model/Sector.js').default} opts.sector
   * @param {import('../../editor/EditorModel.js').default} [opts.em]
   * @param {Function} [opts.onChange] - Called when any property changes
   */
  constructor(opts = {}) {
    this.sector = opts.sector;
    this.em = opts.em || null;
    this.onChange = opts.onChange || (() => {});
    this.el = null;
    this._propertyViews = [];
    this._cleanups = [];
  }

  /**
   * Render the sector
   * @returns {HTMLElement}
   */
  render() {
    const sector = this.sector;
    const el = document.createElement('div');
    el.className = `${PFX}-sector`;
    el.setAttribute('data-sector', sector.getId());

    if (!sector.get('visible')) {
      el.style.display = 'none';
    }

    // Title bar (collapsible)
    const titleEl = document.createElement('div');
    titleEl.className = `${PFX}-sector__title`;

    const arrow = document.createElement('span');
    arrow.className = `${PFX}-sector__arrow`;
    arrow.textContent = sector.isOpen() ? '\u25BC' : '\u25B6';

    const nameEl = document.createElement('span');
    nameEl.className = `${PFX}-sector__name`;
    nameEl.textContent = sector.getName();

    titleEl.appendChild(arrow);
    titleEl.appendChild(nameEl);

    titleEl.addEventListener('click', () => {
      sector.toggle();
      this._updateOpenState();
    });

    el.appendChild(titleEl);

    // Properties container
    const propsEl = document.createElement('div');
    propsEl.className = `${PFX}-sector__properties`;
    propsEl.style.display = sector.isOpen() ? '' : 'none';

    // Render each property
    for (const property of sector.getProperties()) {
      const propView = new PropertyView({
        property,
        em: this.em,
        onChange: (prop, value) => {
          this.onChange(prop, value);
        },
      });
      const propEl = propView.render();
      propsEl.appendChild(propEl);
      this._propertyViews.push(propView);
    }

    el.appendChild(propsEl);

    // Store references
    this.el = el;
    this._titleEl = titleEl;
    this._arrowEl = arrow;
    this._propsEl = propsEl;

    // Listen for sector changes
    const handler = () => this._updateOpenState();
    sector.on('change:open', handler);
    this._cleanups.push(() => sector.off('change:open', handler));

    return el;
  }

  /**
   * Update open/close visual state
   * @private
   */
  _updateOpenState() {
    const isOpen = this.sector.isOpen();
    if (this._propsEl) {
      this._propsEl.style.display = isOpen ? '' : 'none';
    }
    if (this._arrowEl) {
      this._arrowEl.textContent = isOpen ? '\u25BC' : '\u25B6';
    }
  }

  /**
   * Update all properties from component styles
   * @param {Object} styles - Current component styles
   */
  updateFromStyles(styles) {
    for (const propView of this._propertyViews) {
      propView.property.fromStyle(styles);
    }
  }

  /**
   * Destroy the view
   */
  destroy() {
    for (const fn of this._cleanups) fn();
    this._cleanups = [];
    for (const pv of this._propertyViews) {
      pv.destroy();
    }
    this._propertyViews = [];
    if (this.el && this.el.parentNode) {
      this.el.parentNode.removeChild(this.el);
    }
    this.el = null;
  }
}
