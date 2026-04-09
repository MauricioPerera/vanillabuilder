/**
 * ParserModule - Module for parsing HTML and CSS strings
 *
 * Converts raw HTML/CSS text into component definitions and
 * CssRule definitions that can be loaded into the editor.
 */

import { Module } from '../core/index.js';
import ParserHtml from './ParserHtml.js';
import ParserCss from './ParserCss.js';

export default class ParserModule extends Module {
  /**
   * @param {import('../editor/EditorModel.js').default} editor
   * @param {Object} [config={}]
   */
  constructor(editor, config = {}) {
    super(editor, config, {
      stylePrefix: 'parser-',
    });

    this._parserHtml = new ParserHtml(this.config);
    this._parserCss = new ParserCss(this.config);

    this.onInit();
  }

  /**
   * Parse an HTML string into component definitions
   * @param {string} html
   * @returns {Object[]}
   */
  parseHtml(html) {
    return this._parserHtml.parse(html);
  }

  /**
   * Parse a CSS string into CssRule definitions
   * @param {string} css
   * @returns {Object[]}
   */
  parseCss(css) {
    return this._parserCss.parse(css);
  }

  /**
   * Get the HTML parser instance
   * @returns {ParserHtml}
   */
  getHtmlParser() {
    return this._parserHtml;
  }

  /**
   * Get the CSS parser instance
   * @returns {ParserCss}
   */
  getCssParser() {
    return this._parserCss;
  }

  destroy() {
    this._parserHtml = null;
    this._parserCss = null;
    super.destroy();
  }
}
