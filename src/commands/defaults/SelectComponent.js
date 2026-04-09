/**
 * SelectComponent Command - Enables component selection mode
 *
 * When active, clicking on components in the canvas selects them.
 * This is the default interaction mode.
 */

import CommandAbstract from '../CommandAbstract.js';

export default class SelectComponent extends CommandAbstract {
  /**
   * @param {import('../../editor/Editor.js').default} editor
   * @param {Object} sender
   * @param {Object} [opts={}]
   */
  run(editor, sender, opts = {}) {
    const em = editor.getModel?.() || editor;

    // If a specific component is passed, select it
    if (opts.component) {
      em.setSelected?.(opts.component);
      em.trigger?.('component:select', opts.component);
      return;
    }

    // Enable selection mode
    this._active = true;
    em.trigger?.('select:enable');
  }

  /**
   * @param {import('../../editor/Editor.js').default} editor
   * @param {Object} sender
   * @param {Object} [opts={}]
   */
  stop(editor, sender, opts = {}) {
    const em = editor.getModel?.() || editor;
    this._active = false;
    em.trigger?.('select:disable');
  }
}
