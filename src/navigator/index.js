/**
 * LayerManager (Navigator) - Module for the component tree / layers panel
 *
 * Renders a hierarchical tree view of the component structure,
 * allowing users to select, reorder, and toggle visibility of layers.
 */

import { Module } from '../core/index.js';

export default class LayerManager extends Module {
  /**
   * @param {import('../editor/EditorModel.js').default} editor
   * @param {Object} [config={}]
   */
  constructor(editor, config = {}) {
    super(editor, config, {
      stylePrefix: 'lm-',
      /** @type {boolean} Show the root wrapper in the tree */
      showWrapper: false,
      /** @type {boolean} Sortable layers (drag to reorder) */
      sortable: true,
      /** @type {boolean} Show visibility toggle */
      showVisibility: true,
    });

    /** @type {Object|null} Root component model */
    this._root = null;

    this.onInit();
  }

  /**
   * Set the root component for the layer tree
   * @param {Object} component - Root component model
   * @returns {this}
   */
  setRoot(component) {
    this._root = component;
    this.trigger('root:change', component);
    return this;
  }

  /**
   * Get the root component
   * @returns {Object|null}
   */
  getRoot() {
    return this._root || this._em?.DomComponents?.getWrapper?.() || null;
  }

  /**
   * Get all layers as a flat array
   * @returns {Object[]}
   */
  getAll() {
    const root = this.getRoot();
    if (!root) return [];

    const layers = [];
    this._collectLayers(root, layers, 0);
    return layers;
  }

  /**
   * Recursively collect layers from the component tree
   * @private
   * @param {Object} component
   * @param {Object[]} layers
   * @param {number} depth
   */
  _collectLayers(component, layers, depth) {
    layers.push({ component, depth });

    const components = component.get?.('components') ?? component.components;
    const children = components?.models ?? components ?? [];

    for (const child of children) {
      this._collectLayers(child, layers, depth + 1);
    }
  }

  /**
   * Render the layer tree view
   * @returns {HTMLElement}
   */
  render() {
    const pfx = this.pfx;
    const el = document.createElement('div');
    el.className = `${pfx}layers`;

    const title = document.createElement('div');
    title.className = `${pfx}layers-title`;
    title.textContent = this.t('navigator.title') || 'Layers';
    title.style.cssText = 'padding: 8px 10px; font-weight: bold; font-size: 13px; border-bottom: 1px solid rgba(255,255,255,0.1);';
    el.appendChild(title);

    const container = document.createElement('div');
    container.className = `${pfx}layers-container`;
    el.appendChild(container);

    const root = this.getRoot();
    if (root) {
      const showWrapper = this.getConfig('showWrapper');
      if (showWrapper) {
        container.appendChild(this._renderLayer(root, 0));
      } else {
        const components = root.get?.('components') ?? root.components;
        const children = components?.models ?? components ?? [];
        for (const child of children) {
          container.appendChild(this._renderLayer(child, 0));
        }
      }
    } else {
      const empty = document.createElement('div');
      empty.className = `${pfx}layers-empty`;
      empty.textContent = this.t('navigator.empty') || 'No layers';
      empty.style.cssText = 'padding: 20px; text-align: center; color: #888; font-size: 12px;';
      container.appendChild(empty);
    }

    this._view = el;
    return el;
  }

  /**
   * Render a single layer item and its children
   * @private
   * @param {Object} component
   * @param {number} depth
   * @returns {HTMLElement}
   */
  _renderLayer(component, depth) {
    const pfx = this.pfx;
    const item = document.createElement('div');
    item.className = `${pfx}layer`;
    item.setAttribute('data-depth', String(depth));

    // Header row
    const header = document.createElement('div');
    header.className = `${pfx}layer-header`;
    header.style.cssText = `
      display: flex;
      align-items: center;
      padding: 5px 8px;
      padding-left: ${10 + depth * 16}px;
      cursor: pointer;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      user-select: none;
      font-size: 12px;
    `;

    // Expand/collapse toggle
    const components = component.get?.('components') ?? component.components;
    const children = components?.models ?? components ?? [];
    const hasChildren = children.length > 0;

    const toggle = document.createElement('span');
    toggle.className = `${pfx}layer-toggle`;
    toggle.textContent = hasChildren ? '\u25B6' : '\u00A0\u00A0';
    toggle.style.cssText = 'margin-right: 6px; font-size: 8px; transition: transform 0.15s; display: inline-block; width: 12px;';
    header.appendChild(toggle);

    // Component type icon
    const type = component.get?.('type') ?? component.type ?? 'default';
    const icon = document.createElement('span');
    icon.className = `${pfx}layer-icon`;
    icon.textContent = this._getTypeIcon(type);
    icon.style.cssText = 'margin-right: 6px; font-size: 11px; opacity: 0.7;';
    header.appendChild(icon);

    // Name
    const name = document.createElement('span');
    name.className = `${pfx}layer-name`;
    const tagName = component.get?.('tagName') ?? component.tagName ?? 'div';
    const customName = component.get?.('custom-name') ?? component.get?.('name') ?? '';
    name.textContent = customName || this._getTypeName(type) || tagName;
    name.style.cssText = 'flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;';
    header.appendChild(name);

    // Visibility toggle
    if (this.getConfig('showVisibility')) {
      const vis = document.createElement('span');
      vis.className = `${pfx}layer-vis`;
      vis.innerHTML = '&#128065;';
      vis.title = 'Toggle visibility';
      vis.style.cssText = 'cursor: pointer; opacity: 0.5; font-size: 11px; padding: 0 4px;';

      vis.addEventListener('click', (e) => {
        e.stopPropagation();
        const style = component.get?.('style') ?? {};
        const hidden = style.display === 'none';
        if (component.set) {
          component.set('style', {
            ...style,
            display: hidden ? '' : 'none',
          });
        }
        vis.style.opacity = hidden ? '0.5' : '0.2';
      });

      header.appendChild(vis);
    }

    item.appendChild(header);

    // Selection handler
    header.addEventListener('click', () => {
      this._em?.trigger('component:select', component);
      this.trigger('layer:select', component);
    });

    // Highlight on hover
    header.addEventListener('mouseenter', () => {
      header.style.background = 'rgba(255,255,255,0.05)';
    });
    header.addEventListener('mouseleave', () => {
      header.style.background = '';
    });

    // Children container
    if (hasChildren) {
      const childContainer = document.createElement('div');
      childContainer.className = `${pfx}layer-children`;
      let expanded = true;

      for (const child of children) {
        childContainer.appendChild(this._renderLayer(child, depth + 1));
      }

      item.appendChild(childContainer);

      // Toggle expand/collapse
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        expanded = !expanded;
        childContainer.style.display = expanded ? '' : 'none';
        toggle.style.transform = expanded ? 'rotate(90deg)' : 'rotate(0deg)';
      });

      // Start expanded
      toggle.style.transform = 'rotate(90deg)';
    }

    return item;
  }

  /**
   * Get a display icon for a component type
   * @private
   * @param {string} type
   * @returns {string}
   */
  _getTypeIcon(type) {
    const icons = {
      default: '[ ]',
      wrapper: '[W]',
      text: 'T',
      textnode: 'T',
      image: '[I]',
      video: '[V]',
      link: '[A]',
      map: '[M]',
      table: '[T]',
      row: '[-]',
      cell: '[.]',
      input: '[_]',
      button: '[B]',
      form: '[F]',
      svg: '</>',
      script: '{;}',
    };
    return icons[type] || '[ ]';
  }

  /**
   * Get a display name for a component type
   * @private
   * @param {string} type
   * @returns {string}
   */
  _getTypeName(type) {
    const names = {
      default: 'Box',
      wrapper: 'Body',
      text: 'Text',
      textnode: 'Text',
      image: 'Image',
      video: 'Video',
      link: 'Link',
      map: 'Map',
      table: 'Table',
      row: 'Row',
      cell: 'Cell',
      input: 'Input',
      button: 'Button',
      form: 'Form',
      svg: 'SVG',
      section: 'Section',
      column: 'Column',
    };
    return names[type] || '';
  }

  destroy() {
    this._root = null;
    super.destroy();
  }
}
