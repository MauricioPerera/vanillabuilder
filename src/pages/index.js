/**
 * PageManager - Module for managing multiple pages
 *
 * Supports creating, selecting, and switching between pages.
 * Each page holds its own component tree and styles.
 */

import { ItemManagerModule } from '../core/index.js';
import Page from './model/Page.js';

export default class PageManager extends ItemManagerModule {
  /**
   * @param {import('../editor/EditorModel.js').default} editor
   * @param {Object} [config={}]
   */
  constructor(editor, config = {}) {
    super(editor, config, {
      stylePrefix: 'pages-',
    });

    this.storageKey = 'pages';

    this.events = {
      add: 'page:add',
      remove: 'page:remove',
      update: 'page:update',
      reset: 'page:reset',
    };

    /** @type {Page|null} Currently selected page */
    this._selected = null;

    // Add default pages from config
    const pages = this.getConfig('pages') || [];
    if (pages.length) {
      this.add(pages);
    }

    // Ensure at least one page exists
    if (this.getAll().length === 0) {
      this.add({ id: 'main', name: 'Main' });
    }

    // Select the first page
    const all = this.getAll();
    if (all.length > 0) {
      this._selected = all[0];
    }

    this.onInit();
  }

  /** @type {typeof Page} */
  get Model() {
    return Page;
  }

  /**
   * Add a page
   * @param {Object|Object[]} page
   * @param {Object} [opts={}]
   * @returns {Page|Page[]}
   */
  add(page, opts = {}) {
    return super.add(page, opts);
  }

  /**
   * Get a page by ID
   * @param {string} id
   * @returns {Page|undefined}
   */
  get(id) {
    return super.get(id);
  }

  /**
   * Get the main (first) page
   * @returns {Page|undefined}
   */
  getMain() {
    const all = this.getAll();
    return all.find(p => p.get('id') === 'main') || all[0];
  }

  /**
   * Select a page for editing
   * @param {string|Page} page - Page ID or Page model
   * @returns {Page|undefined}
   */
  select(page) {
    const model = typeof page === 'string' ? this.get(page) : page;
    if (!model) return undefined;

    const prev = this._selected;
    this._selected = model;

    this.trigger('page:select', model, prev);
    this._em?.trigger('page:select', model, prev);

    return model;
  }

  /**
   * Get the currently selected page
   * @returns {Page|null}
   */
  getSelected() {
    return this._selected;
  }

  /**
   * Remove a page
   * @param {string|Page} page
   * @param {Object} [opts={}]
   * @returns {Page|undefined}
   */
  remove(page, opts = {}) {
    // Prevent removing the last page
    if (this.getAll().length <= 1) {
      console.warn('PageManager: Cannot remove the last page');
      return undefined;
    }

    const model = typeof page === 'string' ? this.get(page) : page;
    if (!model) return undefined;

    // If removing the selected page, select another
    if (this._selected === model) {
      const all = this.getAll();
      const other = all.find(p => p !== model);
      if (other) this.select(other);
    }

    return super.remove(model, opts);
  }

  /**
   * Get all pages
   * @returns {Page[]}
   */
  getAll() {
    return super.getAll();
  }
}
