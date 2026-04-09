/**
 * CommandAbstract - Base class for all editor commands
 *
 * Commands encapsulate editor actions with run/stop lifecycle.
 * They receive the editor instance and can be stateful (togglable).
 *
 * @example
 * class MyCommand extends CommandAbstract {
 *   run(editor, sender, opts) {
 *     // Do something
 *   }
 *   stop(editor, sender, opts) {
 *     // Undo it
 *   }
 * }
 */

export default class CommandAbstract {
  /**
   * @param {Object} [config={}]
   */
  constructor(config = {}) {
    /** @type {Object} Command configuration */
    this.config = config;

    /** @type {string} Command ID */
    this.id = config.id || '';
  }

  /**
   * Execute the command
   * @param {import('../editor/Editor.js').default} editor - Editor public API
   * @param {Object} sender - The caller (e.g. a button model)
   * @param {Object} [opts={}] - Additional options
   * @returns {any}
   */
  run(editor, sender, opts = {}) {
    // Override in subclasses
  }

  /**
   * Stop/undo the command
   * @param {import('../editor/Editor.js').default} editor - Editor public API
   * @param {Object} sender - The caller
   * @param {Object} [opts={}] - Additional options
   * @returns {any}
   */
  stop(editor, sender, opts = {}) {
    // Override in subclasses
  }

  /**
   * Check if the command can run
   * Override in subclasses for conditional execution.
   * @param {import('../editor/Editor.js').default} editor
   * @returns {boolean}
   */
  canRun(editor) {
    return true;
  }
}
