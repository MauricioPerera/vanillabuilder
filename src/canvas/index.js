/**
 * CanvasModule - Manages the editor canvas and its frames
 *
 * The canvas is the main editing area where components are rendered
 * inside iframe(s). Supports zoom, pan, and multiple frames.
 */

import { Module, ReactiveCollection } from '../core/index.js';
import Canvas from './model/Canvas.js';
import Frame from './model/Frame.js';

export default class CanvasModule extends Module {
  /**
   * @param {import('../editor/EditorModel.js').default} editor
   * @param {Object} [config={}]
   */
  constructor(editor, config = {}) {
    super(editor, config, {
      stylePrefix: 'cv-',
      scripts: [],
      styles: [],
      customBadgeLabel: '',
      autoscrollLimit: 50,
      notTextable: ['button', 'a', 'input[type=checkbox]', 'input[type=radio]'],
    });

    /** @type {Canvas} The canvas model */
    this._model = new Canvas();

    /** @type {ReactiveCollection} Collection of Frame models */
    this._frames = new ReactiveCollection([], { model: Frame });

    /** @type {HTMLElement|null} Canvas container element */
    this._canvasEl = null;

    this.onInit();
  }

  /**
   * Initialize the module
   */
  onInit() {
    // Add a default frame if none exist
    if (this._frames.isEmpty()) {
      this._frames.add({});
    }
  }

  /**
   * Get all frames
   * @returns {Frame[]}
   */
  getFrames() {
    return [...this._frames];
  }

  /**
   * Get a frame by index
   * @param {number} [index=0]
   * @returns {Frame|undefined}
   */
  getFrame(index = 0) {
    return this._frames.at(index);
  }

  /**
   * Add a new frame
   * @param {Object} [frameData={}] - Frame attributes
   * @returns {Frame}
   */
  addFrame(frameData = {}) {
    return this._frames.add(frameData);
  }

  /**
   * Set the canvas zoom level
   * @param {number} zoom - Zoom percentage
   * @returns {this}
   */
  setZoom(zoom) {
    this._model.setZoom(zoom);
    this.trigger('canvas:zoom', zoom);
    this._em?.trigger('canvas:zoom', zoom);
    return this;
  }

  /**
   * Get the current zoom level
   * @returns {number}
   */
  getZoom() {
    return this._model.getZoom();
  }

  /**
   * Get the current pan coordinates
   * @returns {{ x: number, y: number }}
   */
  getCoords() {
    return this._model.getCoords();
  }

  /**
   * Set the pan coordinates
   * @param {number} x
   * @param {number} y
   * @returns {this}
   */
  setCoords(x, y) {
    this._model.setCoords(x, y);
    this.trigger('canvas:coords', { x, y });
    this._em?.trigger('canvas:coords', { x, y });
    return this;
  }

  /**
   * Get the canvas model
   * @returns {Canvas}
   */
  getModel() {
    return this._model;
  }

  /**
   * Get the canvas container element
   * @returns {HTMLElement|null}
   */
  getElement() {
    return this._canvasEl;
  }

  /**
   * Render the canvas container
   * @returns {HTMLElement}
   */
  render() {
    const pfx = this.pfx;
    const el = document.createElement('div');
    el.className = `${pfx}canvas`;
    el.style.position = 'relative';
    el.style.overflow = 'hidden';
    el.style.flex = '1';

    // Create frames container
    const framesEl = document.createElement('div');
    framesEl.className = `${pfx}frames`;
    framesEl.style.position = 'absolute';
    framesEl.style.top = '0';
    framesEl.style.left = '0';
    framesEl.style.width = '100%';
    framesEl.style.height = '100%';

    // Render each frame as an iframe
    for (const frame of this._frames) {
      const iframe = document.createElement('iframe');
      iframe.className = `${pfx}frame`;
      iframe.style.width = frame.get('width') || '100%';
      iframe.style.height = frame.get('height') || '100%';
      iframe.style.border = 'none';
      iframe.setAttribute('frameborder', '0');
      frame.setIframe(iframe);
      framesEl.appendChild(iframe);
    }

    el.appendChild(framesEl);

    this._canvasEl = el;
    this._view = el;
    return el;
  }

  /**
   * Destroy the module
   */
  destroy() {
    this._frames.destroy();
    this._model.destroy();
    this._canvasEl = null;
    super.destroy();
  }
}
