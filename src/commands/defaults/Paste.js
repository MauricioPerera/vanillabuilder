/**
 * Paste Command - Pastes the component from clipboard
 */

import CommandAbstract from '../CommandAbstract.js';

export default class Paste extends CommandAbstract {
  /**
   * @param {import('../../editor/Editor.js').default} editor
   * @param {Object} sender
   * @param {Object} [opts={}]
   */
  run(editor, sender, opts = {}) {
    const em = editor.getModel?.() || editor;
    const clipboard = em._clipboard;

    if (!clipboard) return;

    const selected = em.getSelected?.();
    const parent = selected?.parent?.() || selected?.get?.('parent');
    const components = em.Components || em.get?.('DomComponents');

    if (components && parent) {
      // Add the copied component as a sibling after the selected one
      const added = parent.append ? parent.append(clipboard) : null;
      em.trigger?.('component:paste', added || clipboard);
      return added;
    }

    em.trigger?.('component:paste', clipboard);
    return clipboard;
  }
}
