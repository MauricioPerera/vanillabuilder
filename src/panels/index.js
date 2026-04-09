/**
 * PanelManager - Module for managing editor panels
 *
 * Panels are UI regions (toolbar, sidebar, etc.) that contain
 * buttons and views. The PanelManager provides CRUD operations
 * for panels and their buttons, and renders the panel layout.
 */

import { Module, ReactiveCollection } from '../core/index.js';
import Panel from './model/Panel.js';
import Button from './model/Button.js';

export default class PanelManager extends Module {
  /**
   * @param {import('../editor/EditorModel.js').default} editor
   * @param {Object} [config={}]
   */
  constructor(editor, config = {}) {
    super(editor, config, {
      stylePrefix: 'pn-',
      defaults: [],
    });

    /** @type {ReactiveCollection} Collection of Panel models */
    this._panels = new ReactiveCollection([], { model: Panel });

    /** @type {HTMLElement|null} Panels container */
    this._panelsEl = null;

    // Add default panels from config
    const defaults = this.getConfig('defaults') || [];
    if (defaults.length) {
      this._panels.add(defaults, { silent: true });
    }

    this.onInit();
  }

  /**
   * Add a new panel
   * @param {Object|Panel} panel - Panel config or model
   * @returns {Panel}
   */
  addPanel(panel) {
    const existing = panel.id ? this.getPanel(panel.id) : null;
    if (existing) return existing;

    const result = this._panels.add(panel);
    this.trigger('panels:add', result);
    this._em?.trigger('panels:add', result);
    return result;
  }

  /**
   * Get a panel by ID
   * @param {string} id
   * @returns {Panel|undefined}
   */
  getPanel(id) {
    return this._panels.find(p => p.get('id') === id || p.id === id);
  }

  /**
   * Get all panels
   * @returns {Panel[]}
   */
  getPanels() {
    return [...this._panels];
  }

  /**
   * Remove a panel by ID
   * @param {string} id
   * @returns {Panel|undefined}
   */
  removePanel(id) {
    const panel = this.getPanel(id);
    if (panel) {
      this._panels.remove(panel);
      this.trigger('panels:remove', panel);
      this._em?.trigger('panels:remove', panel);
    }
    return panel;
  }

  /**
   * Add a button to a specific panel
   * @param {string} panelId - Target panel ID
   * @param {Object|Button} button - Button config or model
   * @returns {Button|undefined}
   */
  addButton(panelId, button) {
    const panel = this.getPanel(panelId);
    if (!panel) return undefined;
    return panel.addButton(button);
  }

  /**
   * Get a button by panel and button ID
   * @param {string} panelId
   * @param {string} buttonId
   * @returns {Button|undefined}
   */
  getButton(panelId, buttonId) {
    const panel = this.getPanel(panelId);
    if (!panel) return undefined;
    return panel.getButton(buttonId);
  }

  /**
   * Remove a button from a panel
   * @param {string} panelId
   * @param {string} buttonId
   * @returns {Button|undefined}
   */
  removeButton(panelId, buttonId) {
    const panel = this.getPanel(panelId);
    if (!panel) return undefined;
    return panel.removeButton(buttonId);
  }

  /**
   * Render the panels container with all panels
   * @returns {HTMLElement}
   */
  render() {
    const pfx = this.pfx;
    const el = document.createElement('div');
    el.className = `${pfx}panels`;

    for (const panel of this._panels) {
      if (!panel.isVisible()) continue;

      const panelEl = panel.get('el') || document.createElement('div');
      panelEl.className = `${pfx}panel ${panelEl.className || ''}`.trim();
      panelEl.setAttribute('data-panel-id', panel.get('id') || '');

      // Render content
      const content = panel.get('content');
      if (typeof content === 'string' && content) {
        panelEl.innerHTML = content;
      } else if (content instanceof HTMLElement) {
        panelEl.appendChild(content);
      }

      // Render buttons
      const buttons = panel.getButtons();
      if (buttons.length > 0) {
        const btnContainer = document.createElement('div');
        btnContainer.className = `${pfx}buttons`;

        for (const btn of buttons) {
          btnContainer.appendChild(btn.renderElement(pfx));
        }

        panelEl.appendChild(btnContainer);
      }

      el.appendChild(panelEl);
    }

    this._panelsEl = el;
    this._view = el;
    return el;
  }

  /**
   * Destroy the module
   */
  destroy() {
    for (const panel of this._panels) {
      panel.destroy();
    }
    this._panels.destroy();
    this._panelsEl = null;
    super.destroy();
  }
}
