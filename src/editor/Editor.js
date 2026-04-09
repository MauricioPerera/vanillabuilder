/**
 * Editor - Public API for VanillaBuilder
 *
 * This is the main class users interact with. It wraps EditorModel
 * and exposes a clean, stable public API.
 *
 * @example
 * const editor = vanillabuilder.init({
 *   container: '#editor',
 *   components: '<div>Hello World</div>',
 * });
 *
 * editor.on('component:selected', (comp) => {
 *   console.log('Selected:', comp.get('tagName'));
 * });
 */

import EditorModel from './EditorModel.js';
import EditorView from './EditorView.js';

export default class Editor {
  /**
   * @param {Object} config
   * @param {Object} [opts={}]
   */
  constructor(config = {}, opts = {}) {
    /** @type {EditorModel} */
    this._model = new EditorModel(config);
    this._model.Editor = this;

    /** @type {EditorView|null} */
    this._view = null;

    /** @type {boolean} */
    this._rendered = false;
  }

  // ── Module Access (Lazy Getters) ──

  /** @returns {import('../dom_components/index.js').default} */
  get Components() { return this._model.getModule('Components'); }

  /** @returns {import('../canvas/index.js').default} */
  get Canvas() { return this._model.getModule('Canvas'); }

  /** @returns {import('../css_composer/index.js').default} */
  get Css() { return this._model.getModule('Css'); }

  /** @returns {import('../block_manager/index.js').default} */
  get Blocks() { return this._model.getModule('Blocks'); }

  /** @returns {import('../asset_manager/index.js').default} */
  get Assets() { return this._model.getModule('Assets'); }

  /** @returns {import('../style_manager/index.js').default} */
  get Styles() { return this._model.getModule('Styles'); }

  /** @returns {import('../panels/index.js').default} */
  get Panels() { return this._model.getModule('Panels'); }

  /** @returns {import('../commands/index.js').default} */
  get Commands() { return this._model.getModule('Commands'); }

  /** @returns {import('../selector_manager/index.js').default} */
  get Selectors() { return this._model.getModule('Selectors'); }

  /** @returns {import('../trait_manager/index.js').default} */
  get Traits() { return this._model.getModule('Traits'); }

  /** @returns {import('../device_manager/index.js').default} */
  get Devices() { return this._model.getModule('Devices'); }

  /** @returns {import('../pages/index.js').default} */
  get Pages() { return this._model.getModule('Pages'); }

  /** @returns {import('../storage_manager/index.js').default} */
  get Storage() { return this._model.getModule('Storage'); }

  /** @returns {import('../modal/index.js').default} */
  get Modal() { return this._model.getModule('Modal'); }

  /** @returns {import('../keymaps/index.js').default} */
  get Keymaps() { return this._model.getModule('Keymaps'); }

  /** @returns {import('../undo_manager/index.js').default} */
  get UndoManager() { return this._model.getModule('UndoManager'); }

  /** @returns {import('../rich_text_editor/index.js').default} */
  get RichTextEditor() { return this._model.getModule('RichTextEditor'); }

  /** @returns {import('../i18n/index.js').default} */
  get I18n() { return this._model.getModule('I18n'); }

  /** @returns {import('../data_sources/index.js').default} */
  get DataSources() { return this._model.getModule('DataSources'); }

  /** @returns {import('../navigator/index.js').default} */
  get Layers() { return this._model.getModule('Layers'); }

  // ── Content APIs ──

  /**
   * Get HTML output of the editor content
   * @param {Object} [opts={}]
   * @returns {string}
   */
  getHtml(opts = {}) {
    const codeManager = this._model.getModule('CodeManager');
    if (!codeManager) return '';
    return codeManager.getHtml(opts);
  }

  /**
   * Get CSS output of the editor content
   * @param {Object} [opts={}]
   * @returns {string}
   */
  getCss(opts = {}) {
    const codeManager = this._model.getModule('CodeManager');
    if (!codeManager) return '';
    return codeManager.getCss(opts);
  }

  /**
   * Get JS output of the editor content
   * @param {Object} [opts={}]
   * @returns {string}
   */
  getJs(opts = {}) {
    const codeManager = this._model.getModule('CodeManager');
    if (!codeManager) return '';
    return codeManager.getJs(opts);
  }

  /**
   * Get the component tree
   * @returns {import('../core/ReactiveCollection.js').default}
   */
  getComponents() {
    const comp = this.Components;
    return comp ? comp.getAll() : [];
  }

  /**
   * Set components (replaces current)
   * @param {string|Object|Array} components
   * @param {Object} [opts={}]
   * @returns {this}
   */
  setComponents(components, opts = {}) {
    const comp = this.Components;
    if (comp) comp.clear().add(components, opts);
    return this;
  }

  /**
   * Add components
   * @param {string|Object|Array} components
   * @param {Object} [opts={}]
   * @returns {import('../core/ReactiveModel.js').default[]}
   */
  addComponents(components, opts = {}) {
    const comp = this.Components;
    return comp ? comp.add(components, opts) : [];
  }

  /**
   * Get project style rules
   * @returns {Array}
   */
  getStyle() {
    const css = this.Css;
    return css ? css.getAll() : [];
  }

  /**
   * Set project styles
   * @param {string|Object|Array} styles
   * @param {Object} [opts={}]
   * @returns {this}
   */
  setStyle(styles, opts = {}) {
    const css = this.Css;
    if (css) css.clear().addRules(styles, opts);
    return this;
  }

  /**
   * Get serialized project data (for saving)
   * @param {Object} [opts={}]
   * @returns {Object}
   */
  getProjectData(opts = {}) {
    return this._model.getProjectData(opts);
  }

  /**
   * Load project data (for restoring)
   * @param {Object} data
   * @param {Object} [opts={}]
   * @returns {this}
   */
  loadProjectData(data, opts = {}) {
    this._model.loadProjectData(data, opts);
    return this;
  }

  // ── Selection APIs ──

  /**
   * Get the primary selected component
   * @returns {import('../core/ReactiveModel.js').default|undefined}
   */
  getSelected() {
    return this._model.getSelected();
  }

  /**
   * Get all selected components
   * @returns {import('../core/ReactiveModel.js').default[]}
   */
  getSelectedAll() {
    return this._model.getSelectedAll();
  }

  /**
   * Select a component
   * @param {import('../core/ReactiveModel.js').default} component
   * @param {Object} [opts={}]
   * @returns {this}
   */
  select(component, opts = {}) {
    this._model.setSelected(component, opts);
    return this;
  }

  /**
   * Add component to selection
   * @param {import('../core/ReactiveModel.js').default} component
   * @param {Object} [opts={}]
   * @returns {this}
   */
  selectAdd(component, opts = {}) {
    this._model.selectAdd(component, opts);
    return this;
  }

  /**
   * Remove component from selection
   * @param {import('../core/ReactiveModel.js').default} component
   * @param {Object} [opts={}]
   * @returns {this}
   */
  selectRemove(component, opts = {}) {
    this._model.selectRemove(component, opts);
    return this;
  }

  /**
   * Toggle component in selection
   * @param {import('../core/ReactiveModel.js').default} component
   * @param {Object} [opts={}]
   * @returns {this}
   */
  selectToggle(component, opts = {}) {
    const all = this.getSelectedAll();
    if (all.includes(component)) {
      this.selectRemove(component, opts);
    } else {
      this.selectAdd(component, opts);
    }
    return this;
  }

  // ── Command APIs ──

  /**
   * Run a command
   * @param {string} id
   * @param {Object} [opts={}]
   * @returns {any}
   */
  runCommand(id, opts = {}) {
    const cmds = this.Commands;
    return cmds ? cmds.run(id, opts) : undefined;
  }

  /**
   * Stop a command
   * @param {string} id
   * @param {Object} [opts={}]
   * @returns {any}
   */
  stopCommand(id, opts = {}) {
    const cmds = this.Commands;
    return cmds ? cmds.stop(id, opts) : undefined;
  }

  // ── Storage APIs ──

  /**
   * Save the project to storage
   * @param {Object} [opts={}]
   * @returns {Promise}
   */
  async store(opts = {}) {
    const storage = this.Storage;
    if (!storage) return {};
    const data = this.getProjectData();
    return storage.store(data, opts);
  }

  /**
   * Load the project from storage
   * @param {Object} [opts={}]
   * @returns {Promise}
   */
  async load(opts = {}) {
    const storage = this.Storage;
    if (!storage) return {};
    const data = await storage.load(opts);
    if (data) this.loadProjectData(data);
    return data;
  }

  // ── Event APIs (delegate to EditorModel) ──

  /**
   * @param {string} event
   * @param {Function} callback
   * @param {any} [context]
   * @returns {this}
   */
  on(event, callback, context) {
    this._model.on(event, callback, context);
    return this;
  }

  /**
   * @param {string} event
   * @param {Function} callback
   * @param {any} [context]
   * @returns {this}
   */
  once(event, callback, context) {
    this._model.once(event, callback, context);
    return this;
  }

  /**
   * @param {string} event
   * @param {Function} [callback]
   * @param {any} [context]
   * @returns {this}
   */
  off(event, callback, context) {
    this._model.off(event, callback, context);
    return this;
  }

  /**
   * @param {string} event
   * @param {...any} args
   * @returns {this}
   */
  trigger(event, ...args) {
    this._model.trigger(event, ...args);
    return this;
  }

  // ── Lifecycle ──

  /**
   * Register a callback for when editor is ready
   * @param {Function} callback
   * @returns {this}
   */
  onReady(callback) {
    if (this._model.get('ready')) {
      callback(this);
    } else {
      this._model.once('change:ready', () => callback(this));
    }
    return this;
  }

  /**
   * Render the editor into the configured container
   * @returns {HTMLElement}
   */
  render() {
    if (this._rendered) return this._view.el;

    this._view = new EditorView(this._model);
    const el = this._view.render();

    const container = this._model.getConfig('container');
    if (container) {
      this._view.mount(container);
    }

    this._rendered = true;

    // Load initial data after render
    this._model.loadOnStart();

    return el;
  }

  /**
   * Get the EditorModel
   * @returns {EditorModel}
   */
  getModel() {
    return this._model;
  }

  /**
   * Get editor config
   * @param {string} [key]
   * @returns {any}
   */
  getConfig(key) {
    return this._model.getConfig(key);
  }

  /**
   * Refresh the editor canvas
   */
  refresh() {
    this._model.trigger('canvas:refresh');
  }

  /**
   * Destroy the editor
   */
  destroy() {
    if (this._view) this._view.destroy();
    this._model.destroy();
    this._view = null;
    this._rendered = false;
  }
}
