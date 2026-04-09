/**
 * CodeManager - Module for generating HTML, CSS, and JS output
 *
 * Provides a unified API for extracting the current editor content
 * as HTML, CSS, or JavaScript strings.
 */

import { Module } from '../core/index.js';
import HtmlGenerator from './HtmlGenerator.js';
import CssGenerator from './CssGenerator.js';

export default class CodeManager extends Module {
  /**
   * @param {import('../editor/EditorModel.js').default} editor
   * @param {Object} [config={}]
   */
  constructor(editor, config = {}) {
    super(editor, config, {
      stylePrefix: 'cm-',
    });

    this._htmlGenerator = new HtmlGenerator(this.config);
    this._cssGenerator = new CssGenerator(this.config);

    this.onInit();
  }

  /**
   * Get the HTML string for the current components
   * @param {Object} [opts={}]
   * @param {import('../dom_components/model/Component.js').default} [opts.component] - Root component (defaults to wrapper)
   * @param {boolean} [opts.cleanId=true]
   * @param {boolean} [opts.pretty=false]
   * @returns {string}
   */
  getHtml(opts = {}) {
    const em = this._em;
    const component = opts.component || em?.DomComponents?.getWrapper?.();

    if (!component) return '';

    // For the wrapper, build only the inner content
    const components = component.get?.('components') ?? component.components;
    const children = components?.models ?? components ?? [];

    if (children.length === 0) {
      return component.get?.('content') ?? '';
    }

    return children
      .map(child => this._htmlGenerator.build(child, opts))
      .join(opts.pretty ? '\n' : '');
  }

  /**
   * Get the CSS string for all current rules
   * @param {Object} [opts={}]
   * @param {boolean} [opts.pretty=true]
   * @param {boolean} [opts.avoidProtected=false] - Skip protected rules
   * @returns {string}
   */
  getCss(opts = {}) {
    const em = this._em;
    const cssComposer = em?.CssComposer;

    if (!cssComposer) return '';

    let rules = cssComposer.getAll?.() ?? cssComposer.getRules?.() ?? [];

    if (opts.avoidProtected) {
      rules = rules.filter(r => !r.get?.('protected'));
    }

    return this._cssGenerator.build(rules, opts);
  }

  /**
   * Get JavaScript from components with script traits
   * @param {Object} [opts={}]
   * @param {import('../dom_components/model/Component.js').default} [opts.component] - Root component
   * @returns {string}
   */
  getJs(opts = {}) {
    const em = this._em;
    const component = opts.component || em?.DomComponents?.getWrapper?.();
    if (!component) return '';

    const scripts = [];
    this._collectScripts(component, scripts);

    return scripts.join('\n');
  }

  /**
   * Get all code (HTML + CSS + JS) bundled
   * @param {Object} [opts={}]
   * @returns {{html: string, css: string, js: string}}
   */
  getCode(opts = {}) {
    return {
      html: this.getHtml(opts),
      css: this.getCss(opts),
      js: this.getJs(opts),
    };
  }

  /**
   * Get the HTML generator instance
   * @returns {HtmlGenerator}
   */
  getHtmlGenerator() {
    return this._htmlGenerator;
  }

  /**
   * Get the CSS generator instance
   * @returns {CssGenerator}
   */
  getCssGenerator() {
    return this._cssGenerator;
  }

  /**
   * Recursively collect scripts from the component tree
   * @private
   * @param {Object} component
   * @param {string[]} scripts
   */
  _collectScripts(component, scripts) {
    const script = component.get?.('script') ?? component.script;
    if (script) {
      const scriptStr = typeof script === 'function' ? `(${script.toString()})()` : script;
      scripts.push(scriptStr);
    }

    const components = component.get?.('components') ?? component.components;
    const children = components?.models ?? components ?? [];

    for (const child of children) {
      this._collectScripts(child, scripts);
    }
  }

  destroy() {
    this._htmlGenerator = null;
    this._cssGenerator = null;
    super.destroy();
  }
}
