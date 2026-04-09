/**
 * SectorsView - Renders all sectors in the Style Manager panel
 */

import SectorView from './SectorView.js';

const PFX = 'vb-sm';

export default class SectorsView {
  /**
   * @param {Object} opts
   * @param {import('../model/Sector.js').default[]} opts.sectors
   * @param {import('../../editor/EditorModel.js').default} [opts.em]
   * @param {Function} [opts.onChange]
   */
  constructor(opts = {}) {
    this.sectors = opts.sectors || [];
    this.em = opts.em || null;
    this.onChange = opts.onChange || (() => {});
    this.el = null;
    this._sectorViews = [];
  }

  /**
   * Render all sectors
   * @returns {HTMLElement}
   */
  render() {
    const el = document.createElement('div');
    el.className = `${PFX}-sectors`;

    // No selection message
    this._emptyEl = document.createElement('div');
    this._emptyEl.className = `${PFX}-empty`;
    this._emptyEl.textContent = 'Select a component to edit styles';
    this._emptyEl.style.display = 'none';
    el.appendChild(this._emptyEl);

    for (const sector of this.sectors) {
      const sectorView = new SectorView({
        sector,
        em: this.em,
        onChange: this.onChange,
      });
      el.appendChild(sectorView.render());
      this._sectorViews.push(sectorView);
    }

    this.el = el;
    return el;
  }

  /**
   * Update all sectors with component styles
   * @param {Object} styles
   */
  updateFromStyles(styles) {
    for (const sv of this._sectorViews) {
      sv.updateFromStyles(styles);
    }
  }

  /**
   * Show/hide empty state
   * @param {boolean} isEmpty
   */
  setEmpty(isEmpty) {
    if (this._emptyEl) {
      this._emptyEl.style.display = isEmpty ? '' : 'none';
    }
    for (const sv of this._sectorViews) {
      if (sv.el) sv.el.style.display = isEmpty ? 'none' : '';
    }
  }

  /**
   * Destroy all sector views
   */
  destroy() {
    for (const sv of this._sectorViews) {
      sv.destroy();
    }
    this._sectorViews = [];
    if (this.el && this.el.parentNode) {
      this.el.parentNode.removeChild(this.el);
    }
    this.el = null;
  }
}
