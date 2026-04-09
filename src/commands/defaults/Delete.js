/**
 * Delete Command - Removes the selected component
 */

import CommandAbstract from '../CommandAbstract.js';

export default class Delete extends CommandAbstract {
  /**
   * @param {import('../../editor/Editor.js').default} editor
   * @param {Object} sender
   * @param {Object} [opts={}]
   */
  run(editor, sender, opts = {}) {
    const em = editor.getModel?.() || editor;
    const component = opts.component || em.getSelected?.();

    if (!component) return;

    // Check if component is removable
    if (component.get?.('removable') === false) return;

    em.trigger?.('component:deselect', component);
    component.destroy?.();
    em.trigger?.('component:delete', component);
  }
}
