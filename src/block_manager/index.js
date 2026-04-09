/**
 * BlockManager - Module for managing draggable blocks
 *
 * Blocks are pre-configured component templates that appear
 * in the blocks panel. Users drag them onto the canvas to
 * create new components.
 */

import { ItemManagerModule } from '../core/index.js';
import Block from './model/Block.js';

export default class BlockManager extends ItemManagerModule {
  /**
   * @param {import('../editor/EditorModel.js').default} editor
   * @param {Object} [config={}]
   */
  constructor(editor, config = {}) {
    super(editor, config, {
      stylePrefix: 'bm-',
    });

    this.events = {
      add: 'block:add',
      remove: 'block:remove',
      update: 'block:update',
      reset: 'block:reset',
    };

    // Add default blocks from config
    const defaults = this.getConfig('blocks') || [];
    if (defaults.length) {
      this.add(defaults);
    }

    this.onInit();
  }

  /** @type {typeof Block} */
  get Model() {
    return Block;
  }

  /**
   * Add a block
   * @param {string|Object} id - Block ID or block config object
   * @param {Object} [props={}] - Block properties (if id is string)
   * @returns {Block}
   */
  add(id, props = {}) {
    if (typeof id === 'string') {
      return super.add({ id, ...props });
    }
    return super.add(id, props);
  }

  /**
   * Get unique categories from all blocks
   * @returns {string[]}
   */
  getCategories() {
    const categories = new Set();
    for (const block of this.getAll()) {
      const cat = block.getCategory();
      if (cat) categories.add(cat);
    }
    return [...categories];
  }

  /**
   * Get blocks by category
   * @param {string} category
   * @returns {Block[]}
   */
  getBlocksByCategory(category) {
    return this.getAll().filter(b => b.getCategory() === category);
  }

  /**
   * Render the blocks grid view
   * @returns {HTMLElement}
   */
  render() {
    const pfx = this.pfx;
    const el = document.createElement('div');
    el.className = `${pfx}blocks`;
    el.style.display = 'flex';
    el.style.flexWrap = 'wrap';

    const categories = this.getCategories();
    const uncategorized = this.getAll().filter(b => !b.getCategory());

    // Render categorized blocks
    for (const category of categories) {
      const catEl = document.createElement('div');
      catEl.className = `${pfx}block-category`;
      catEl.style.width = '100%';

      const catTitle = document.createElement('div');
      catTitle.className = `${pfx}block-category-title`;
      catTitle.textContent = category;
      catTitle.style.fontWeight = 'bold';
      catTitle.style.padding = '5px';
      catEl.appendChild(catTitle);

      const blocksContainer = document.createElement('div');
      blocksContainer.className = `${pfx}block-category-blocks`;
      blocksContainer.style.display = 'flex';
      blocksContainer.style.flexWrap = 'wrap';

      for (const block of this.getBlocksByCategory(category)) {
        blocksContainer.appendChild(this._renderBlock(block, pfx));
      }

      catEl.appendChild(blocksContainer);
      el.appendChild(catEl);
    }

    // Render uncategorized blocks
    for (const block of uncategorized) {
      el.appendChild(this._renderBlock(block, pfx));
    }

    this._view = el;
    return el;
  }

  /**
   * Render a single block element
   * @private
   * @param {Block} block
   * @param {string} pfx
   * @returns {HTMLElement}
   */
  _renderBlock(block, pfx) {
    const blockEl = document.createElement('div');
    blockEl.className = `${pfx}block`;
    blockEl.setAttribute('data-block-id', block.get('id') || '');
    blockEl.setAttribute('draggable', 'true');
    blockEl.style.cursor = 'grab';

    if (block.isDisabled()) {
      blockEl.setAttribute('draggable', 'false');
      blockEl.style.opacity = '0.5';
      blockEl.style.cursor = 'default';
    }

    // Apply custom attributes
    const attrs = block.get('attributes') || {};
    for (const [key, val] of Object.entries(attrs)) {
      blockEl.setAttribute(key, val);
    }

    // Media/icon
    const media = block.get('media');
    if (media) {
      const mediaEl = document.createElement('div');
      mediaEl.className = `${pfx}block-media`;
      mediaEl.innerHTML = media;
      blockEl.appendChild(mediaEl);
    }

    // Label
    const label = block.getLabel();
    if (label) {
      const labelEl = document.createElement('div');
      labelEl.className = `${pfx}block-label`;
      labelEl.textContent = label;
      blockEl.appendChild(labelEl);
    }

    // Custom render
    const customRender = block.get('render');
    if (typeof customRender === 'function') {
      customRender({ el: blockEl, model: block });
    }

    // Drag events
    blockEl.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', JSON.stringify({
        type: 'block',
        id: block.get('id'),
        content: block.getContent(),
      }));
      this.trigger('block:drag:start', block, e);
      this._em?.trigger('block:drag:start', block, e);
    });

    blockEl.addEventListener('dragend', (e) => {
      this.trigger('block:drag:stop', block, e);
      this._em?.trigger('block:drag:stop', block, e);
    });

    return blockEl;
  }
}
