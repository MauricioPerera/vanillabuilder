/**
 * EditorView - Root UI renderer for the editor
 *
 * Creates and manages the main DOM structure:
 * - Container wrapper
 * - Canvas area
 * - Panel areas (left, right, top, bottom)
 */

export default class EditorView {
  /**
   * @param {import('./EditorModel.js').default} model
   */
  constructor(model) {
    /** @type {import('./EditorModel.js').default} */
    this.model = model;

    /** @type {HTMLElement|null} */
    this.el = null;

    /** @type {string} */
    this.pfx = model.getConfig('stylePrefix') || 'vb-';
  }

  /**
   * Render the editor's root structure
   * @returns {HTMLElement}
   */
  render() {
    const pfx = this.pfx;
    const el = document.createElement('div');
    el.className = `${pfx}editor ${pfx}one-bg ${pfx}two-color`;

    const config = this.model.getConfig();
    if (config.width) el.style.width = config.width;
    if (config.height) el.style.height = config.height;

    // Create main layout
    el.innerHTML = `
      <div class="${pfx}editor-row">
        <div class="${pfx}editor-col">
          <div class="${pfx}canvas-container" data-canvas></div>
        </div>
      </div>
    `;

    this.el = el;
    this.model._viewEl = el;

    // Render all module views
    this._renderModules();

    // Call postRender on modules
    for (const [, mod] of this.model._modules) {
      if (mod.postRender) mod.postRender(el);
    }

    return el;
  }

  /**
   * Render module views and mount to appropriate containers
   * @private
   */
  _renderModules() {
    const el = this.el;
    if (!el) return;

    // Canvas module
    const canvasContainer = el.querySelector('[data-canvas]');
    const canvasModule = this.model.getModule('Canvas');
    if (canvasModule && canvasContainer) {
      const canvasEl = canvasModule.render();
      if (canvasEl) canvasContainer.appendChild(canvasEl);
    }

    // Panels module
    const panelsModule = this.model.getModule('Panels');
    if (panelsModule) {
      const panelsEl = panelsModule.render();
      if (panelsEl) el.appendChild(panelsEl);
    }
  }

  /**
   * Mount editor into container
   * @param {string|HTMLElement} container
   */
  mount(container) {
    const containerEl = typeof container === 'string'
      ? document.querySelector(container)
      : container;

    if (!containerEl) {
      console.error(`VanillaBuilder: Container "${container}" not found`);
      return;
    }

    if (!this.el) this.render();
    containerEl.appendChild(this.el);
  }

  /**
   * Destroy the view
   */
  destroy() {
    if (this.el && this.el.parentNode) {
      this.el.parentNode.removeChild(this.el);
    }
    this.el = null;
  }
}
