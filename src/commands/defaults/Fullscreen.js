/**
 * Fullscreen Command - Toggles fullscreen mode for the editor
 */

import CommandAbstract from '../CommandAbstract.js';

export default class Fullscreen extends CommandAbstract {
  /**
   * @param {import('../../editor/Editor.js').default} editor
   * @param {Object} sender
   * @param {Object} [opts={}]
   */
  run(editor, sender, opts = {}) {
    const em = editor.getModel?.() || editor;
    const container = opts.target || em.getContainer?.() || document.documentElement;

    if (container.requestFullscreen) {
      container.requestFullscreen();
    } else if (container.webkitRequestFullscreen) {
      container.webkitRequestFullscreen();
    } else if (container.mozRequestFullScreen) {
      container.mozRequestFullScreen();
    } else if (container.msRequestFullscreen) {
      container.msRequestFullscreen();
    }

    em.trigger?.('fullscreen:on');
    this._active = true;
  }

  /**
   * @param {import('../../editor/Editor.js').default} editor
   * @param {Object} sender
   * @param {Object} [opts={}]
   */
  stop(editor, sender, opts = {}) {
    const em = editor.getModel?.() || editor;

    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }

    em.trigger?.('fullscreen:off');
    this._active = false;
  }
}
