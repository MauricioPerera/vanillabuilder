/**
 * EditorModel - Central state hub and module orchestrator
 *
 * This is the heart of VanillaBuilder. It:
 * - Initializes all modules in dependency order
 * - Serves as the central event bus
 * - Manages project data serialization
 * - Handles component selection
 */

import { ReactiveModel, ReactiveCollection, deepMerge, isString, isFunction, debounce } from '../core/index.js';
import getDefaultConfig from './config.js';

// Module imports
import I18nModule from '../i18n/index.js';
import KeymapsModule from '../keymaps/index.js';
import UndoManagerModule from '../undo_manager/index.js';
import StorageManager from '../storage_manager/index.js';
import DeviceManager from '../device_manager/index.js';
import ParserModule from '../parser/index.js';
import SelectorManager from '../selector_manager/index.js';
import ModalModule from '../modal/index.js';
import CodeManager from '../code_manager/index.js';
import PanelManager from '../panels/index.js';
import RichTextEditorModule from '../rich_text_editor/index.js';
import TraitManager from '../trait_manager/index.js';
import LayerManager from '../navigator/index.js';
import CanvasModule from '../canvas/index.js';
import CommandsModule from '../commands/index.js';
import BlockManager from '../block_manager/index.js';
import DataSourceManager from '../data_sources/index.js';
import AssetManager from '../asset_manager/index.js';
import CssComposer from '../css_composer/index.js';
import PageManager from '../pages/index.js';
import ComponentManager from '../dom_components/index.js';
import StyleManager from '../style_manager/index.js';

/** @type {string[]} Events emitted by EditorModel */
export const EditorEvents = {
  update: 'update',
  undo: 'undo',
  redo: 'redo',
  load: 'load',
  destroy: 'destroy',
  destroyed: 'destroyed',
  projectLoad: 'project:load',
  projectLoaded: 'project:loaded',
  projectGet: 'project:get',
  log: 'log',
};

export default class EditorModel extends ReactiveModel {
  defaults() {
    return {
      ready: false,
      changesCount: 0,
      selectedAll: [],
      hovered: null,
      dragMode: undefined,
    };
  }

  /**
   * @param {Object} config - Editor configuration
   */
  initialize(config) {
    /** @type {Object} Full merged configuration */
    this._config = deepMerge(getDefaultConfig(), config || {});

    /** @type {import('./Editor.js').default|null} Public Editor API */
    this.Editor = null;

    /** @type {Map<string, import('../core/Module.js').default>} All loaded modules */
    this._modules = new Map();

    /** @type {Array} Modules with storage support */
    this._storables = [];

    /** @type {Array} Modules that need onLoad */
    this._toLoad = [];

    /** @type {HTMLElement|null} Editor root view element */
    this._viewEl = null;
  }

  /**
   * Get editor configuration
   * @param {string} [key] - Specific config key
   * @returns {any}
   */
  getConfig(key) {
    if (key) return this._config[key];
    return this._config;
  }

  /**
   * Set config value
   * @param {string} key
   * @param {any} value
   */
  setConfig(key, value) {
    this._config[key] = value;
  }

  /**
   * Initialize all modules in dependency order
   * This implements the two-phase loading from GrapesJS
   */
  initModules() {
    const cfg = this._config;
    const initMod = (name, ModClass, modConfig = {}) => {
      try {
        const mod = new ModClass(this, modConfig);
        this.registerModule(name, mod);
      } catch (e) {
        this.log(`Error initializing module ${name}: ${e.message}`, { level: 'error' });
      }
    };

    // Phase 1: Standard modules (non-storable, in dependency order)
    initMod('I18n', I18nModule, cfg.i18n);
    initMod('Keymaps', KeymapsModule, cfg.keymaps);
    initMod('UndoManager', UndoManagerModule, cfg.undoManager);
    initMod('Storage', StorageManager, cfg.storageManager);
    initMod('Devices', DeviceManager, cfg.deviceManager);
    initMod('Parser', ParserModule, cfg.parser);
    initMod('Styles', StyleManager, cfg.styleManager);
    initMod('Selectors', SelectorManager, cfg.selectorManager);
    initMod('Modal', ModalModule, cfg.modal);
    initMod('CodeManager', CodeManager, cfg.codeManager);
    initMod('Panels', PanelManager, cfg.panels);
    initMod('RichTextEditor', RichTextEditorModule, cfg.richTextEditor);
    initMod('Traits', TraitManager, cfg.traitManager);
    initMod('Layers', LayerManager, cfg.layerManager);
    initMod('Canvas', CanvasModule, cfg.canvas);
    initMod('Commands', CommandsModule, cfg.commands);
    initMod('Blocks', BlockManager, cfg.blockManager);
    initMod('DataSources', DataSourceManager, cfg.dataSources);

    // Phase 2: Storable modules
    initMod('Assets', AssetManager, cfg.assetManager);
    initMod('Css', CssComposer, cfg.cssComposer);
    initMod('Pages', PageManager, cfg.pageManager);
    initMod('Components', ComponentManager, cfg.domComponents);

    // Call onInit on all modules
    for (const [, mod] of this._modules) {
      if (isFunction(mod.onInit)) mod.onInit();
    }
  }

  /**
   * Register a module
   * @param {string} name
   * @param {import('../core/Module.js').default} module
   */
  registerModule(name, module) {
    this._modules.set(name, module);

    if (module.isStorable) {
      this._storables.push(module);
    }

    if (isFunction(module.onLoad)) {
      this._toLoad.push(module);
    }
  }

  /**
   * Get a registered module by name
   * @param {string} name
   * @returns {import('../core/Module.js').default|undefined}
   */
  getModule(name) {
    return this._modules.get(name);
  }

  /**
   * Load initial data from storage or config
   */
  async loadOnStart() {
    const projectData = this._config.projectData;

    if (projectData) {
      this.loadProjectData(projectData);
    }

    // Call onLoad on all loadable modules
    for (const mod of this._toLoad) {
      mod.onLoad();
    }

    // Call postLoad on all modules
    for (const [, mod] of this._modules) {
      if (isFunction(mod.postLoad)) mod.postLoad();
    }

    this.set('ready', true);
    this.trigger(EditorEvents.load, this.Editor);
  }

  // ── Project Data ──

  /**
   * Serialize all storable modules into project data
   * @param {Object} [opts={}]
   * @returns {Object}
   */
  getProjectData(opts = {}) {
    let data = {};

    for (const mod of this._storables) {
      if (isFunction(mod.getProjectData)) {
        data = mod.getProjectData(data);
      }
    }

    this.trigger(EditorEvents.projectGet, data, opts);
    return data;
  }

  /**
   * Load project data into all storable modules
   * @param {Object} data
   * @param {Object} [opts={}]
   */
  loadProjectData(data = {}, opts = {}) {
    this.trigger(EditorEvents.projectLoad, data, opts);

    for (const mod of this._storables) {
      if (isFunction(mod.loadProjectData)) {
        mod.loadProjectData(data);
      }
    }

    this.trigger(EditorEvents.projectLoaded, data, opts);
  }

  // ── Selection ──

  /**
   * Set selected component(s)
   * @param {ReactiveModel|ReactiveModel[]} components
   * @param {Object} [opts={}]
   */
  setSelected(components, opts = {}) {
    const arr = Array.isArray(components) ? components : [components].filter(Boolean);
    this.set('selectedAll', arr, opts);

    if (!opts.silent) {
      const last = arr[arr.length - 1];
      this.trigger('component:toggled', last, opts);
      this.trigger('component:selected', last, opts);
    }
  }

  /**
   * Get the primary selected component
   * @returns {ReactiveModel|undefined}
   */
  getSelected() {
    const all = this.get('selectedAll') || [];
    return all[all.length - 1];
  }

  /**
   * Get all selected components
   * @returns {ReactiveModel[]}
   */
  getSelectedAll() {
    return [...(this.get('selectedAll') || [])];
  }

  /**
   * Add to selection
   * @param {ReactiveModel} component
   * @param {Object} [opts={}]
   */
  selectAdd(component, opts = {}) {
    if (!component) return;
    const all = [...(this.get('selectedAll') || [])];
    if (!all.includes(component)) {
      all.push(component);
      this.setSelected(all, opts);
    }
  }

  /**
   * Remove from selection
   * @param {ReactiveModel} component
   * @param {Object} [opts={}]
   */
  selectRemove(component, opts = {}) {
    if (!component) return;
    const all = (this.get('selectedAll') || []).filter(c => c !== component);
    this.setSelected(all, opts);

    if (!opts.silent) {
      this.trigger('component:deselected', component, opts);
    }
  }

  /**
   * Deselect all components
   * @param {Object} [opts={}]
   */
  deselectAll(opts = {}) {
    const prev = this.get('selectedAll') || [];
    this.setSelected([], opts);

    if (!opts.silent) {
      for (const comp of prev) {
        this.trigger('component:deselected', comp, opts);
      }
    }
  }

  /**
   * Set hovered component
   * @param {ReactiveModel|null} component
   * @param {Object} [opts={}]
   */
  setHovered(component, opts = {}) {
    const prev = this.get('hovered');
    if (prev === component) return;
    this.set('hovered', component, opts);

    if (!opts.silent) {
      if (prev) this.trigger('component:unhovered', prev, opts);
      if (component) this.trigger('component:hovered', component, opts);
    }
  }

  /**
   * Get hovered component
   * @returns {ReactiveModel|null}
   */
  getHovered() {
    return this.get('hovered');
  }

  // ── Logging ──

  /**
   * Log a message
   * @param {string} msg
   * @param {Object} [opts={}]
   */
  log(msg, opts = {}) {
    const { level = 'debug' } = opts;
    const logConfig = this._config.log;

    if (Array.isArray(logConfig) && !logConfig.includes(level)) return;

    this.trigger(EditorEvents.log, msg, opts);

    if (level === 'error') {
      console.error(msg);
    } else if (level === 'warning') {
      console.warn(msg);
    }
  }

  /**
   * Translate text (delegates to I18n module)
   * @param {string} key
   * @param {Object} [opts]
   * @returns {string}
   */
  t(key, opts) {
    const i18n = this.getModule('I18n');
    return i18n ? i18n.t(key, opts) : key;
  }

  // ── Rendering ──

  /**
   * Render the editor view
   * @returns {HTMLElement}
   */
  render() {
    const { EditorView } = this._viewModules || {};
    // Will be implemented when EditorView is ready
    return this._viewEl;
  }

  /**
   * Destroy the editor
   */
  destroy() {
    this.trigger(EditorEvents.destroy);

    // Destroy all modules in reverse order
    const modules = [...this._modules.values()].reverse();
    for (const mod of modules) {
      if (isFunction(mod.destroy)) mod.destroy();
    }

    this._modules.clear();
    this._storables = [];
    this._toLoad = [];

    if (this._viewEl && this._viewEl.parentNode) {
      this._viewEl.parentNode.removeChild(this._viewEl);
    }

    this.trigger(EditorEvents.destroyed);
    super.destroy();
  }
}
