/**
 * AssetManager - Module for managing media assets
 *
 * Provides CRUD operations for media resources (images, videos, etc.)
 * that can be used within editor components.
 */

import { ItemManagerModule, isString } from '../core/index.js';
import Asset from './model/Asset.js';

export default class AssetManager extends ItemManagerModule {
  /**
   * @param {import('../editor/EditorModel.js').default} editor
   * @param {Object} [config={}]
   */
  constructor(editor, config = {}) {
    super(editor, config, {
      stylePrefix: 'am-',
      upload: '',
      uploadName: 'files',
      headers: {},
      params: {},
      credentials: 'include',
      multiUpload: true,
      autoAdd: true,
      accept: 'image/*',
    });

    this.storageKey = 'assets';

    this.events = {
      add: 'asset:add',
      remove: 'asset:remove',
      update: 'asset:update',
      reset: 'asset:reset',
    };

    // Add default assets from config
    const defaults = this.getConfig('assets') || [];
    if (defaults.length) {
      this.add(defaults);
    }

    this.onInit();
  }

  /** @type {typeof Asset} */
  get Model() {
    return Asset;
  }

  /**
   * Add asset(s)
   * @param {string|Object|Array} asset - URL string, asset config, or array
   * @param {Object} [opts={}]
   * @returns {Asset|Asset[]}
   */
  add(asset, opts = {}) {
    if (isString(asset)) {
      // String = image URL shorthand
      return super.add({ type: 'image', src: asset }, opts);
    }

    if (Array.isArray(asset)) {
      return asset.map(a => this.add(a, opts));
    }

    return super.add(asset, opts);
  }

  /**
   * Get asset by src URL or ID
   * @param {string} src
   * @returns {Asset|undefined}
   */
  get(src) {
    // Try by id first (which defaults to src)
    const byId = super.get(src);
    if (byId) return byId;

    // Try by src attribute
    return this.getAll().find(a => a.get('src') === src);
  }

  /**
   * Get all image assets
   * @returns {Asset[]}
   */
  getImages() {
    return this.getAll().filter(a => a.isImage());
  }

  /**
   * Get assets by type
   * @param {string} type
   * @returns {Asset[]}
   */
  getByType(type) {
    return this.getAll().filter(a => a.get('type') === type);
  }

  /**
   * Remove asset by src or model
   * @param {string|Asset} asset
   * @returns {Asset|undefined}
   */
  remove(asset) {
    if (isString(asset)) {
      const model = this.get(asset);
      if (model) return super.remove(model);
      return undefined;
    }
    return super.remove(asset);
  }
}
