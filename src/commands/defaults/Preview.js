/**
 * Preview Command - Toggles preview mode (hides editor chrome)
 */

import CommandAbstract from '../CommandAbstract.js';

export default class Preview extends CommandAbstract {
  /**
   * @param {import('../../editor/Editor.js').default} editor
   * @param {Object} sender
   * @param {Object} [opts={}]
   */
  run(editor, sender, opts = {}) {
    const em = editor.getModel?.() || editor;

    // Add preview class to editor container
    const container = em.getContainer?.();
    if (container) {
      container.classList.add('preview-mode');
    }

    em.trigger?.('preview:on');
    this._active = true;
  }

  /**
   * @param {import('../../editor/Editor.js').default} editor
   * @param {Object} sender
   * @param {Object} [opts={}]
   */
  stop(editor, sender, opts = {}) {
    const em = editor.getModel?.() || editor;

    const container = em.getContainer?.();
    if (container) {
      container.classList.remove('preview-mode');
    }

    em.trigger?.('preview:off');
    this._active = false;
  }
}
