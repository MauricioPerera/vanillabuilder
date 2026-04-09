/**
 * ExportTemplate Command - Exports the current project as HTML/CSS
 */

import CommandAbstract from '../CommandAbstract.js';

export default class ExportTemplate extends CommandAbstract {
  /**
   * @param {import('../../editor/Editor.js').default} editor
   * @param {Object} sender
   * @param {Object} [opts={}]
   * @returns {{ html: string, css: string }}
   */
  run(editor, sender, opts = {}) {
    const em = editor.getModel?.() || editor;

    // Get HTML from component manager
    let html = '';
    const components = em.Components || em.get?.('DomComponents');
    if (components) {
      const wrapper = components.getWrapper?.();
      if (wrapper) {
        html = wrapper.toHTML?.() || '';
      }
    }

    // Fallback: try editor method
    if (!html && editor.getHtml) {
      html = editor.getHtml();
    }

    // Get CSS from CSS composer
    let css = '';
    const cssComposer = em.CssComposer || em.get?.('CssComposer');
    if (cssComposer) {
      css = cssComposer.buildCSS?.() || '';
    }

    // Fallback: try editor method
    if (!css && editor.getCss) {
      css = editor.getCss();
    }

    const result = { html, css };

    em.trigger?.('export:template', result);

    // Open modal with exported content if requested
    if (opts.modal !== false) {
      const modal = em.Modal || em.get?.('Modal');
      if (modal) {
        const container = document.createElement('div');

        const htmlLabel = document.createElement('label');
        htmlLabel.textContent = 'HTML';
        htmlLabel.style.fontWeight = 'bold';
        htmlLabel.style.display = 'block';
        htmlLabel.style.marginBottom = '5px';

        const htmlArea = document.createElement('textarea');
        htmlArea.value = html;
        htmlArea.readOnly = true;
        htmlArea.style.width = '100%';
        htmlArea.style.height = '150px';
        htmlArea.style.marginBottom = '10px';
        htmlArea.style.fontFamily = 'monospace';
        htmlArea.style.fontSize = '12px';

        const cssLabel = document.createElement('label');
        cssLabel.textContent = 'CSS';
        cssLabel.style.fontWeight = 'bold';
        cssLabel.style.display = 'block';
        cssLabel.style.marginBottom = '5px';

        const cssArea = document.createElement('textarea');
        cssArea.value = css;
        cssArea.readOnly = true;
        cssArea.style.width = '100%';
        cssArea.style.height = '150px';
        cssArea.style.fontFamily = 'monospace';
        cssArea.style.fontSize = '12px';

        container.appendChild(htmlLabel);
        container.appendChild(htmlArea);
        container.appendChild(cssLabel);
        container.appendChild(cssArea);

        modal.open({
          title: 'Export Template',
          content: container,
        });
      }
    }

    return result;
  }
}
