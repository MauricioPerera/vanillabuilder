/**
 * CommandsModule - Module for managing editor commands
 *
 * Commands are reusable actions with run/stop lifecycle.
 * They can be triggered by buttons, keyboard shortcuts, or
 * programmatically. Supports togglable commands that maintain
 * active state.
 */

import { Module, isString, isFunction } from '../core/index.js';
import CommandAbstract from './CommandAbstract.js';
import Copy from './defaults/Copy.js';
import Paste from './defaults/Paste.js';
import Delete from './defaults/Delete.js';
import Preview from './defaults/Preview.js';
import Fullscreen from './defaults/Fullscreen.js';
import SelectComponent from './defaults/SelectComponent.js';
import ExportTemplate from './defaults/ExportTemplate.js';

export default class CommandsModule extends Module {
  /**
   * @param {import('../editor/EditorModel.js').default} editor
   * @param {Object} [config={}]
   */
  constructor(editor, config = {}) {
    super(editor, config, {
      stylePrefix: 'com-',
    });

    /** @type {Map<string, CommandAbstract|Object>} Command registry */
    this._commands = new Map();

    /** @type {Map<string, boolean>} Currently active commands */
    this._active = new Map();

    // Register default commands
    this._registerDefaults();

    this.onInit();
  }

  /**
   * Register built-in default commands
   * @private
   */
  _registerDefaults() {
    this.add('core:copy', new Copy());
    this.add('core:paste', new Paste());
    this.add('core:delete', new Delete());
    this.add('core:preview', new Preview());
    this.add('core:fullscreen', new Fullscreen());
    this.add('core:select-component', new SelectComponent());
    this.add('core:export-template', new ExportTemplate());

    // Convenience aliases
    this.add('tlb-copy', new Copy());
    this.add('tlb-paste', new Paste());
    this.add('tlb-delete', new Delete());
  }

  /**
   * Add a command to the registry
   * @param {string} id - Unique command identifier
   * @param {CommandAbstract|Object|Function} command - Command instance, config object, or run function
   * @returns {this}
   */
  add(id, command) {
    if (isFunction(command)) {
      // Wrap a plain function as a command object
      this._commands.set(id, { run: command });
    } else if (command instanceof CommandAbstract) {
      command.id = id;
      this._commands.set(id, command);
    } else if (typeof command === 'object' && command !== null) {
      this._commands.set(id, command);
    }
    return this;
  }

  /**
   * Get a command by ID
   * @param {string} id
   * @returns {CommandAbstract|Object|undefined}
   */
  get(id) {
    return this._commands.get(id);
  }

  /**
   * Get all commands
   * @returns {Object} Map of id -> command
   */
  getAll() {
    const result = {};
    for (const [id, cmd] of this._commands) {
      result[id] = cmd;
    }
    return result;
  }

  /**
   * Check if a command exists
   * @param {string} id
   * @returns {boolean}
   */
  has(id) {
    return this._commands.has(id);
  }

  /**
   * Run a command by ID
   * @param {string} id - Command ID
   * @param {Object} [opts={}] - Options passed to the command's run method
   * @returns {any} The return value of the command's run method
   */
  run(id, opts = {}) {
    const command = this.get(id);
    if (!command) {
      console.warn(`[CommandsModule] Command "${id}" not found`);
      return undefined;
    }

    // Check canRun
    const editor = this.editor || this._em;
    if (command.canRun && !command.canRun(editor)) {
      return undefined;
    }

    const sender = opts.sender || null;

    // Mark as active
    this._active.set(id, true);

    // Fire before event
    this.trigger('run:before', id, opts);
    this._em?.trigger('run:before', id, opts);
    this._em?.trigger(`run:${id}:before`, opts);

    // Execute
    let result;
    if (isFunction(command.run)) {
      result = command.run(editor, sender, opts);
    } else if (isFunction(command)) {
      result = command(editor, sender, opts);
    }

    // Fire after event
    this.trigger('run', id, result, opts);
    this._em?.trigger('run', id, result, opts);
    this._em?.trigger(`run:${id}`, result, opts);

    return result;
  }

  /**
   * Stop a running command by ID
   * @param {string} id - Command ID
   * @param {Object} [opts={}] - Options passed to the command's stop method
   * @returns {any} The return value of the command's stop method
   */
  stop(id, opts = {}) {
    const command = this.get(id);
    if (!command) {
      console.warn(`[CommandsModule] Command "${id}" not found`);
      return undefined;
    }

    const editor = this.editor || this._em;
    const sender = opts.sender || null;

    // Fire before event
    this.trigger('stop:before', id, opts);
    this._em?.trigger('stop:before', id, opts);
    this._em?.trigger(`stop:${id}:before`, opts);

    // Execute stop
    let result;
    if (isFunction(command.stop)) {
      result = command.stop(editor, sender, opts);
    }

    // Mark as inactive
    this._active.delete(id);

    // Fire after event
    this.trigger('stop', id, result, opts);
    this._em?.trigger('stop', id, result, opts);
    this._em?.trigger(`stop:${id}`, result, opts);

    return result;
  }

  /**
   * Check if a command is currently active
   * @param {string} id
   * @returns {boolean}
   */
  isActive(id) {
    return this._active.has(id);
  }

  /**
   * Get all currently active commands
   * @returns {string[]} Array of active command IDs
   */
  getActive() {
    return [...this._active.keys()];
  }

  /**
   * Destroy the module
   */
  destroy() {
    // Stop all active commands
    for (const id of this.getActive()) {
      try {
        this.stop(id);
      } catch (e) {
        // Ignore errors during cleanup
      }
    }
    this._commands.clear();
    this._active.clear();
    super.destroy();
  }
}
