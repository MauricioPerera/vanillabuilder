/**
 * CssComposer - Module for managing CSS rules
 *
 * Provides CRUD operations for CSS rules, with support for
 * selectors, media queries, and at-rules. Rules are stored
 * as CssRule models in a ReactiveCollection.
 */

import { ItemManagerModule } from '../core/index.js';
import CssRule from './model/CssRule.js';

export default class CssComposer extends ItemManagerModule {
  /**
   * @param {import('../editor/EditorModel.js').default} editor
   * @param {Object} [config={}]
   */
  constructor(editor, config = {}) {
    super(editor, config, {
      stylePrefix: 'css-',
    });

    this.storageKey = 'styles';

    this.events = {
      add: 'cssComposer:add',
      remove: 'cssComposer:remove',
      update: 'cssComposer:update',
      reset: 'cssComposer:reset',
    };

    this.onInit();
  }

  /** @type {typeof CssRule} */
  get Model() {
    return CssRule;
  }

  /**
   * Add rules from a CSS string (basic parser)
   * Parses simple CSS rules into CssRule models.
   * @param {string} cssString - Raw CSS text
   * @returns {CssRule[]}
   */
  addRules(cssString) {
    if (!cssString || typeof cssString !== 'string') return [];

    const rules = [];
    const cleaned = cssString.replace(/\/\*[\s\S]*?\*\//g, '').trim();

    // Simple regex-based parser for basic CSS rules
    const ruleRegex = /([^{}]+)\{([^{}]+)\}/g;
    let match;

    while ((match = ruleRegex.exec(cleaned)) !== null) {
      const selectorStr = match[1].trim();
      const styleStr = match[2].trim();

      // Parse style string into object
      const style = {};
      styleStr.split(';').forEach(decl => {
        const [prop, ...vals] = decl.split(':');
        const key = prop && prop.trim();
        const value = vals.join(':').trim();
        if (key && value) {
          style[key] = value;
        }
      });

      // Determine if this has a media query
      let mediaText = '';
      let selectors = [selectorStr];

      const mediaMatch = selectorStr.match(/^@media\s+(.+)/);
      if (mediaMatch) {
        mediaText = mediaMatch[1].trim();
        // Need to re-parse inner rules for media queries
        // For simplicity, skip nested media rules in this basic parser
        continue;
      }

      // Split compound selectors
      selectors = selectorStr.split(',').map(s => s.trim()).filter(Boolean);

      const rule = this.add({
        selectors,
        style,
        mediaText,
      });

      rules.push(rule);
    }

    return rules;
  }

  /**
   * Set or create a rule for the given selectors
   * @param {Array<string>} selectors - Array of selector strings
   * @param {Object} style - CSS property-value pairs
   * @param {Object} [opts={}]
   * @param {string} [opts.state] - Pseudo-state
   * @param {string} [opts.mediaText] - Media query
   * @param {string} [opts.atRuleType] - At-rule type
   * @returns {CssRule}
   */
  setRule(selectors, style, opts = {}) {
    let rule = this.getRule(selectors, opts);

    if (rule) {
      rule.setStyle(style);
    } else {
      rule = this.add({
        selectors,
        style,
        state: opts.state || '',
        mediaText: opts.mediaText || '',
        atRuleType: opts.atRuleType || '',
      });
    }

    return rule;
  }

  /**
   * Get a rule matching the given selectors and options
   * @param {Array<string>} selectors
   * @param {Object} [opts={}]
   * @param {string} [opts.state]
   * @param {string} [opts.mediaText]
   * @param {string} [opts.atRuleType]
   * @returns {CssRule|undefined}
   */
  getRule(selectors, opts = {}) {
    return this.getAll().find(rule => rule.matches(selectors, opts));
  }

  /**
   * Get all CSS rules
   * @returns {CssRule[]}
   */
  getRules() {
    return this.getAll();
  }

  /**
   * Generate the full CSS output from all rules
   * @returns {string}
   */
  buildCSS() {
    return this.getAll()
      .map(rule => rule.toCSS())
      .filter(Boolean)
      .join('\n');
  }
}
