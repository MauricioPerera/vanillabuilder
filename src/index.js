/**
 * VanillaBuilder - A zero-dependency web builder framework
 *
 * Cleanroom reimplementation of GrapesJS in vanilla ES6+ JavaScript.
 *
 * @example
 * import vanillabuilder from 'vanillabuilder';
 *
 * const editor = vanillabuilder.init({
 *   container: '#editor',
 *   components: '<div>Hello World</div>',
 *   style: '.my-class { color: red; }',
 * });
 */

import Editor from './editor/Editor.js';

/** @type {Editor[]} All active editor instances */
const editors = [];

/**
 * Plugin manager for registering named plugins
 */
const plugins = {
  /** @type {Map<string, Function>} */
  _registry: new Map(),

  /**
   * Register a named plugin
   * @param {string} id
   * @param {Function} plugin
   */
  add(id, plugin) {
    this._registry.set(id, plugin);
  },

  /**
   * Get a registered plugin
   * @param {string} id
   * @returns {Function|undefined}
   */
  get(id) {
    return this._registry.get(id);
  },

  /**
   * Get all registered plugins
   * @returns {Map<string, Function>}
   */
  getAll() {
    return new Map(this._registry);
  },
};

/**
 * Initialize a new editor instance
 * @param {Object} config - Editor configuration
 * @returns {Editor}
 */
function init(config = {}) {
  const editor = new Editor(config);

  // Initialize modules
  editor.getModel().initModules();

  // Load plugins
  const pluginList = config.plugins || [];
  const pluginOpts = config.pluginsOpts || {};

  for (const plugin of pluginList) {
    let pluginFn = plugin;
    let pluginId = '';

    if (typeof plugin === 'string') {
      pluginId = plugin;
      pluginFn = plugins.get(plugin);

      // Fallback: check global scope
      if (!pluginFn && typeof window !== 'undefined') {
        pluginFn = window[plugin];
      }

      if (!pluginFn) {
        console.warn(`VanillaBuilder: Plugin "${plugin}" not found`);
        continue;
      }
    }

    if (typeof pluginFn === 'function') {
      const opts = pluginOpts[pluginId] || pluginOpts[plugin] || {};
      try {
        pluginFn(editor, opts);
      } catch (err) {
        console.error(`VanillaBuilder: Error loading plugin "${pluginId || 'anonymous'}"`, err);
      }
    }
  }

  // Auto-render if configured
  if (config.autorender !== false && config.container) {
    editor.render();
  }

  editors.push(editor);
  return editor;
}

/**
 * Helper to wrap a plugin with default options
 * @template T
 * @param {function(Editor, T): void} plugin
 * @param {T} [defaultOpts={}]
 * @returns {function(Editor, Partial<T>): void}
 */
function usePlugin(plugin, defaultOpts = {}) {
  return (editor, opts = {}) => {
    plugin(editor, { ...defaultOpts, ...opts });
  };
}

/** @type {string} Library version */
const version = '0.1.0';

const vanillabuilder = {
  init,
  plugins,
  editors,
  usePlugin,
  version,
};

export default vanillabuilder;
export { init, plugins, editors, usePlugin, version, Editor };
