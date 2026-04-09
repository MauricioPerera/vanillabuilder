/**
 * CssGenerator - Generate CSS strings from CssRule models
 *
 * Takes a collection of CssRule models and formats them into a
 * properly structured CSS string, grouping rules by media query.
 */

export default class CssGenerator {
  /**
   * @param {Object} [config={}]
   */
  constructor(config = {}) {
    this.config = config;
  }

  /**
   * Build a CSS string from an array of CssRule models
   * @param {Array<import('../css_composer/model/CssRule.js').default>} rules
   * @param {Object} [opts={}]
   * @param {boolean} [opts.pretty=true] - Pretty-print with newlines
   * @param {string} [opts.indentStr='  '] - Indentation unit
   * @param {boolean} [opts.onlyMatched=false] - Only include rules with matching selectors
   * @returns {string}
   */
  build(rules, opts = {}) {
    if (!rules || !rules.length) return '';

    const { pretty = true, indentStr = '  ' } = opts;
    const nl = pretty ? '\n' : ' ';

    // Separate rules by context: no media, per-media, at-rules
    const noMedia = [];
    const mediaGroups = new Map();
    const atRules = [];

    for (const rule of rules) {
      const styleStr = this._ruleStyleStr(rule);
      if (!styleStr) continue;

      const singleAtRule = rule.get?.('singleAtRule') ?? rule.singleAtRule;
      const atRuleType = rule.get?.('atRuleType') ?? rule.atRuleType ?? '';
      const mediaText = rule.get?.('mediaText') ?? rule.getMediaText?.() ?? rule.mediaText ?? '';

      if (singleAtRule) {
        atRules.push(rule);
      } else if (mediaText) {
        if (!mediaGroups.has(mediaText)) {
          mediaGroups.set(mediaText, []);
        }
        mediaGroups.get(mediaText).push(rule);
      } else {
        noMedia.push(rule);
      }
    }

    const parts = [];

    // Single at-rules (e.g., @font-face)
    for (const rule of atRules) {
      const atRuleType = rule.get?.('atRuleType') ?? rule.atRuleType ?? '';
      const styleStr = this._ruleStyleStr(rule);
      if (pretty) {
        parts.push(`@${atRuleType} {${nl}${this._indentDeclarations(styleStr, indentStr)}${nl}}`);
      } else {
        parts.push(`@${atRuleType} { ${styleStr} }`);
      }
    }

    // Regular rules (no media query)
    for (const rule of noMedia) {
      parts.push(this._formatRule(rule, '', pretty, indentStr));
    }

    // Media query groups
    for (const [media, mediaRules] of mediaGroups) {
      const innerParts = mediaRules
        .map(r => this._formatRule(r, pretty ? indentStr : '', pretty, indentStr))
        .filter(Boolean);

      if (innerParts.length > 0) {
        if (pretty) {
          parts.push(`@media ${media} {${nl}${innerParts.join(nl)}${nl}}`);
        } else {
          parts.push(`@media ${media} { ${innerParts.join(' ')} }`);
        }
      }
    }

    return parts.join(pretty ? '\n\n' : ' ');
  }

  /**
   * Format a single rule to CSS
   * @private
   * @param {Object} rule
   * @param {string} indent
   * @param {boolean} pretty
   * @param {string} indentStr
   * @returns {string}
   */
  _formatRule(rule, indent, pretty, indentStr) {
    const selector = rule.selectorsToString?.() ?? this._buildSelector(rule);
    const styleStr = this._ruleStyleStr(rule);
    if (!selector || !styleStr) return '';

    if (pretty) {
      return `${indent}${selector} {${'\n'}${this._indentDeclarations(styleStr, indent + indentStr)}${'\n'}${indent}}`;
    }
    return `${selector} { ${styleStr} }`;
  }

  /**
   * Get the CSS declarations string for a rule
   * @private
   * @param {Object} rule
   * @returns {string}
   */
  _ruleStyleStr(rule) {
    // Use model method if available
    if (typeof rule.styleToString === 'function') {
      return rule.styleToString();
    }

    const style = rule.get?.('style') ?? rule.style ?? {};
    const entries = Object.entries(style);
    if (entries.length === 0) return '';

    return entries
      .map(([prop, val]) => {
        const kebab = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
        return `${kebab}: ${val};`;
      })
      .join(' ');
  }

  /**
   * Build a selector string from raw rule data (fallback)
   * @private
   * @param {Object} rule
   * @returns {string}
   */
  _buildSelector(rule) {
    const selectors = rule.get?.('selectors') ?? rule.selectors ?? [];
    const state = rule.get?.('state') ?? rule.state ?? '';

    const sel = selectors
      .map(s => (typeof s === 'string' ? s : (s.name || String(s))))
      .join(', ');

    return sel + state;
  }

  /**
   * Indent each declaration on its own line
   * @private
   * @param {string} styleStr
   * @param {string} indent
   * @returns {string}
   */
  _indentDeclarations(styleStr, indent) {
    return styleStr
      .split(';')
      .map(d => d.trim())
      .filter(Boolean)
      .map(d => `${indent}${d};`)
      .join('\n');
  }
}
