/**
 * Copy Command - Copies the selected component to clipboard
 */

import CommandAbstract from '../CommandAbstract.js';

export default class Copy extends CommandAbstract {
  /**
   * @param {import('../../editor/Editor.js').default} editor
   * @param {Object} sender
   * @param {Object} [opts={}]
   */
  run(editor, sender, opts = {}) {
    const em = editor.getModel?.() || editor;
    const selected = opts.component || em.getSelected?.();

    if (!selected) return;

    // Store the component JSON in the editor's clipboard
    em._clipboard = selected.toJSON ? selected.toJSON() : selected;
    em.trigger?.('component:copy', selected);
  }
}
