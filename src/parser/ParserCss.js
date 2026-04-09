/**
 * ParserCss - Parse CSS strings into CssRule definition objects
 *
 * Uses regex/string-based parsing for broad compatibility.
 * Handles selectors, properties, media queries, and nested at-rules.
 */

export default class ParserCss {
  /**
   * @param {Object} [config={}]
   */
  constructor(config = {}) {
    this.config = config;
  }

  /**
   * Parse a CSS string into an array of rule definition objects
   * @param {string} cssString
   * @returns {Object[]} Array of CssRule-compatible definitions
   */
  parse(cssString) {
    if (!cssString || typeof cssString !== 'string') return [];

    // Strip comments
    const cleaned = cssString.replace(/\/\*[\s\S]*?\*\//g, '');
    return this._parseBlock(cleaned);
  }

  /**
   * Parse a block of CSS (possibly containing at-rules)
   * @private
   * @param {string} css
   * @param {string} [mediaText='']
   * @param {string} [atRuleType='']
   * @returns {Object[]}
   */
  _parseBlock(css, mediaText = '', atRuleType = '') {
    const rules = [];
    let i = 0;
    const len = css.length;

    while (i < len) {
      // Skip whitespace
      while (i < len && /\s/.test(css[i])) i++;
      if (i >= len) break;

      // Check for at-rule
      if (css[i] === '@') {
        const atResult = this._parseAtRule(css, i);
        if (atResult) {
          rules.push(...atResult.rules);
          i = atResult.end;
          continue;
        }
      }

      // Parse regular rule: selector { declarations }
      const selectorStart = i;
      const braceIdx = css.indexOf('{', i);
      if (braceIdx < 0) break;

      const selectorStr = css.slice(selectorStart, braceIdx).trim();
      if (!selectorStr) {
        i = braceIdx + 1;
        continue;
      }

      // Find matching closing brace
      const closeIdx = this._findClosingBrace(css, braceIdx);
      if (closeIdx < 0) break;

      const bodyStr = css.slice(braceIdx + 1, closeIdx).trim();
      const style = this._parseDeclarations(bodyStr);

      // Split compound selectors
      const selectors = selectorStr.split(',').map(s => s.trim()).filter(Boolean);

      // Extract pseudo-state from each selector
      for (const sel of selectors) {
        const { selector, state } = this._extractState(sel);

        const ruleDef = {
          selectors: [selector],
          style,
          state: state || '',
          mediaText: mediaText || '',
          atRuleType: atRuleType || '',
        };

        if (Object.keys(style).length > 0) {
          rules.push(ruleDef);
        }
      }

      i = closeIdx + 1;
    }

    return rules;
  }

  /**
   * Parse an at-rule starting at position i
   * @private
   * @param {string} css
   * @param {number} i
   * @returns {{rules: Object[], end: number}|null}
   */
  _parseAtRule(css, i) {
    // Match @media, @supports, @font-face, @keyframes, etc.
    const remaining = css.slice(i);

    // @media queries
    const mediaMatch = remaining.match(/^@media\s+([^{]+)\{/);
    if (mediaMatch) {
      const mediaText = mediaMatch[1].trim();
      const braceStart = i + mediaMatch[0].length - 1;
      const braceEnd = this._findClosingBrace(css, braceStart);
      if (braceEnd < 0) return null;

      const innerCss = css.slice(braceStart + 1, braceEnd);
      const innerRules = this._parseBlock(innerCss, mediaText, '');

      return { rules: innerRules, end: braceEnd + 1 };
    }

    // @font-face
    const fontFaceMatch = remaining.match(/^@font-face\s*\{/);
    if (fontFaceMatch) {
      const braceStart = i + fontFaceMatch[0].length - 1;
      const braceEnd = this._findClosingBrace(css, braceStart);
      if (braceEnd < 0) return null;

      const bodyStr = css.slice(braceStart + 1, braceEnd).trim();
      const style = this._parseDeclarations(bodyStr);

      return {
        rules: [{
          selectors: [],
          style,
          state: '',
          mediaText: '',
          atRuleType: 'font-face',
          singleAtRule: true,
        }],
        end: braceEnd + 1,
      };
    }

    // @keyframes (skip, not converted to rules)
    const keyframesMatch = remaining.match(/^@keyframes\s+[^{]+\{/);
    if (keyframesMatch) {
      const braceStart = i + keyframesMatch[0].length - 1;
      const braceEnd = this._findClosingBrace(css, braceStart);
      if (braceEnd < 0) return null;
      return { rules: [], end: braceEnd + 1 };
    }

    // Generic at-rule with block
    const genericMatch = remaining.match(/^@(\w[\w-]*)\s+([^{]*)\{/);
    if (genericMatch) {
      const braceStart = i + genericMatch[0].length - 1;
      const braceEnd = this._findClosingBrace(css, braceStart);
      if (braceEnd < 0) return null;

      const innerCss = css.slice(braceStart + 1, braceEnd);
      const innerRules = this._parseBlock(innerCss, '', genericMatch[1]);

      return { rules: innerRules, end: braceEnd + 1 };
    }

    // Generic at-rule without block (e.g., @import, @charset)
    const stmtMatch = remaining.match(/^@[\w-]+[^;]*;/);
    if (stmtMatch) {
      return { rules: [], end: i + stmtMatch[0].length };
    }

    return null;
  }

  /**
   * Parse CSS declaration block into a style object
   * @private
   * @param {string} body
   * @returns {Object}
   */
  _parseDeclarations(body) {
    const style = {};
    if (!body) return style;

    // Split on semicolons, handling values with semicolons inside url() or quotes
    const declarations = [];
    let current = '';
    let parenDepth = 0;
    let inString = false;
    let stringChar = '';

    for (let i = 0; i < body.length; i++) {
      const ch = body[i];

      if (inString) {
        current += ch;
        if (ch === stringChar) inString = false;
        continue;
      }

      if (ch === '"' || ch === "'") {
        inString = true;
        stringChar = ch;
        current += ch;
        continue;
      }

      if (ch === '(') { parenDepth++; current += ch; continue; }
      if (ch === ')') { parenDepth--; current += ch; continue; }

      if (ch === ';' && parenDepth === 0) {
        declarations.push(current.trim());
        current = '';
        continue;
      }

      current += ch;
    }
    if (current.trim()) declarations.push(current.trim());

    for (const decl of declarations) {
      const colonIdx = decl.indexOf(':');
      if (colonIdx < 0) continue;

      const prop = decl.slice(0, colonIdx).trim();
      const value = decl.slice(colonIdx + 1).trim();
      if (prop && value) {
        style[prop] = value;
      }
    }

    return style;
  }

  /**
   * Extract pseudo-state from a selector (e.g., '.btn:hover' -> { selector: '.btn', state: ':hover' })
   * @private
   * @param {string} sel
   * @returns {{selector: string, state: string}}
   */
  _extractState(sel) {
    const pseudoMatch = sel.match(/(:{1,2}(?:hover|active|focus|visited|focus-within|focus-visible|first-child|last-child|nth-child\([^)]+\)|before|after|placeholder|selection))$/);
    if (pseudoMatch) {
      return {
        selector: sel.slice(0, -pseudoMatch[1].length),
        state: pseudoMatch[1],
      };
    }
    return { selector: sel, state: '' };
  }

  /**
   * Find the index of the closing brace matching the one at braceStart
   * @private
   * @param {string} css
   * @param {number} braceStart - Index of '{'
   * @returns {number} Index of matching '}', or -1
   */
  _findClosingBrace(css, braceStart) {
    let depth = 1;
    for (let i = braceStart + 1; i < css.length; i++) {
      if (css[i] === '{') depth++;
      else if (css[i] === '}') {
        depth--;
        if (depth === 0) return i;
      }
    }
    return -1;
  }
}
