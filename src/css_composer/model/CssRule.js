/**
 * CssRule - Model representing a single CSS rule
 *
 * A CSS rule consists of selectors, a style object, and optional
 * media query / at-rule context. Can serialize itself to valid CSS.
 *
 * @example
 * const rule = new CssRule({
 *   selectors: ['.my-class'],
 *   style: { color: 'red', 'font-size': '16px' },
 *   mediaText: '(max-width: 768px)',
 * });
 * rule.toCSS(); // "@media (max-width: 768px) { .my-class { color: red; font-size: 16px; } }"
 */

import { ReactiveModel } from '../../core/index.js';

export default class CssRule extends ReactiveModel {
  /**
   * @returns {Object} Default attributes
   */
  defaults() {
    return {
      /** @type {Array<string|Object>} Selector strings or Selector models */
      selectors: [],
      /** @type {Object} CSS property-value pairs */
      style: {},
      /** @type {string} Pseudo-state (e.g. ':hover', ':active') */
      state: '',
      /** @type {string} Media query text (e.g. '(max-width: 768px)') */
      mediaText: '',
      /** @type {string} At-rule type (e.g. 'media', 'supports', 'font-face') */
      atRuleType: '',
      /** @type {boolean} Whether this is a single (selectorless) at-rule like @font-face */
      singleAtRule: false,
      /** @type {boolean} Whether the rule is important */
      important: false,
    };
  }

  /**
   * Get the selectors array
   * @returns {Array<string|Object>}
   */
  getSelectors() {
    return this.get('selectors') || [];
  }

  /**
   * Get the style object
   * @returns {Object}
   */
  getStyle() {
    return { ...(this.get('style') || {}) };
  }

  /**
   * Set the style object (merges by default)
   * @param {Object} style - CSS property-value pairs
   * @param {Object} [opts={}]
   * @param {boolean} [opts.replace=false] - Replace instead of merge
   * @returns {this}
   */
  setStyle(style, opts = {}) {
    const current = opts.replace ? {} : this.getStyle();
    return this.set('style', { ...current, ...style });
  }

  /**
   * Get the media query text
   * @returns {string}
   */
  getMediaText() {
    return this.get('mediaText') || '';
  }

  /**
   * Build the selector string from selectors array + state
   * @returns {string}
   */
  selectorsToString() {
    const selectors = this.getSelectors();
    const state = this.get('state') || '';

    const selectorStr = selectors
      .map(sel => {
        if (typeof sel === 'string') return sel;
        if (sel && typeof sel.getFullName === 'function') return sel.getFullName();
        if (sel && sel.name) {
          const type = sel.type || 1;
          if (type === 2) return `#${sel.name}`;
          if (type === 3) return sel.name;
          return `.${sel.name}`;
        }
        return String(sel);
      })
      .join('');

    return selectorStr + state;
  }

  /**
   * Convert the style object to a CSS declaration string
   * @returns {string}
   */
  styleToString() {
    const style = this.getStyle();
    const important = this.get('important');
    const entries = Object.entries(style);
    if (entries.length === 0) return '';

    return entries
      .map(([prop, val]) => {
        const kebabProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
        const suffix = important && !String(val).includes('!important') ? ' !important' : '';
        return `${kebabProp}: ${val}${suffix};`;
      })
      .join(' ');
  }

  /**
   * Serialize this rule to a valid CSS string
   * @returns {string}
   */
  toCSS() {
    const styleStr = this.styleToString();
    if (!styleStr) return '';

    const singleAtRule = this.get('singleAtRule');
    const atRuleType = this.get('atRuleType');
    const mediaText = this.getMediaText();

    // Single at-rules like @font-face
    if (singleAtRule && atRuleType) {
      return `@${atRuleType} { ${styleStr} }`;
    }

    const selectorStr = this.selectorsToString();
    if (!selectorStr && !singleAtRule) return '';

    const ruleBlock = `${selectorStr} { ${styleStr} }`;

    // Wrap in media query if present
    if (mediaText) {
      return `@media ${mediaText} { ${ruleBlock} }`;
    }

    // Wrap in other at-rule if present
    if (atRuleType) {
      return `@${atRuleType} { ${ruleBlock} }`;
    }

    return ruleBlock;
  }

  /**
   * Check if this rule matches the given selectors and options
   * @param {Array<string>} selectors
   * @param {Object} [opts={}]
   * @param {string} [opts.state]
   * @param {string} [opts.mediaText]
   * @param {string} [opts.atRuleType]
   * @returns {boolean}
   */
  matches(selectors, opts = {}) {
    const mySelectors = this.getSelectors().map(s =>
      typeof s === 'string' ? s : (s.getFullName ? s.getFullName() : s.name || String(s))
    ).sort().join(',');

    const targetSelectors = selectors.map(s =>
      typeof s === 'string' ? s : String(s)
    ).sort().join(',');

    if (mySelectors !== targetSelectors) return false;
    if ((opts.state || '') !== (this.get('state') || '')) return false;
    if ((opts.mediaText || '') !== (this.getMediaText())) return false;
    if ((opts.atRuleType || '') !== (this.get('atRuleType') || '')) return false;

    return true;
  }
}
