/**
 * HtmlGenerator - Generate clean HTML from a component tree
 *
 * Recursively traverses the component model hierarchy and produces
 * well-formatted HTML output.
 */

export default class HtmlGenerator {
  /**
   * @param {Object} [config={}]
   */
  constructor(config = {}) {
    this.config = config;
  }

  /**
   * Build HTML string from a component model
   * @param {import('../dom_components/model/Component.js').default} component
   * @param {Object} [opts={}]
   * @param {boolean} [opts.cleanId=true] - Remove auto-generated IDs
   * @param {string} [opts.indent=''] - Current indentation level
   * @param {boolean} [opts.pretty=false] - Pretty-print with newlines and indentation
   * @param {string} [opts.indentStr='  '] - Indentation unit string
   * @returns {string}
   */
  build(component, opts = {}) {
    if (!component) return '';

    const {
      cleanId = true,
      indent = '',
      pretty = false,
      indentStr = '  ',
    } = opts;

    // Handle text nodes
    const type = component.get?.('type') || component.type;
    if (type === 'textnode') {
      const content = component.get?.('content') ?? component.content ?? '';
      return content;
    }

    const tag = component.get?.('tagName') ?? component.tagName ?? 'div';
    const attributes = this._buildAttributes(component, { cleanId });
    const content = component.get?.('content') ?? component.content ?? '';
    const components = component.get?.('components') ?? component.components;
    const childModels = components?.models ?? components ?? [];

    // Void elements (self-closing)
    const voidTags = new Set([
      'area', 'base', 'br', 'col', 'embed', 'hr', 'img',
      'input', 'link', 'meta', 'param', 'source', 'track', 'wbr',
    ]);

    if (voidTags.has(tag)) {
      return `${indent}<${tag}${attributes}>`;
    }

    // Build children HTML
    let childrenHtml = '';
    if (childModels.length > 0) {
      const childIndent = pretty ? indent + indentStr : '';
      const childOpts = { ...opts, indent: childIndent };

      const parts = childModels.map(child => this.build(child, childOpts));
      childrenHtml = pretty
        ? '\n' + parts.join('\n') + '\n' + indent
        : parts.join('');
    } else if (content) {
      childrenHtml = content;
    }

    return `${indent}<${tag}${attributes}>${childrenHtml}</${tag}>`;
  }

  /**
   * Build the attribute string for an element
   * @private
   * @param {Object} component
   * @param {Object} opts
   * @returns {string}
   */
  _buildAttributes(component, opts = {}) {
    const parts = [];

    // ID
    const id = component.get?.('attributes')?.id ?? component.attributes?.id;
    if (id && (!opts.cleanId || !id.startsWith('i'))) {
      parts.push(`id="${this._escapeAttr(id)}"`);
    }

    // Classes
    const classes = component.get?.('classes') ?? component.classes ?? [];
    const classNames = classes
      .map(c => (typeof c === 'string' ? c : (c.get?.('name') ?? c.name ?? '')))
      .filter(Boolean);

    if (classNames.length > 0) {
      parts.push(`class="${this._escapeAttr(classNames.join(' '))}"`);
    }

    // Src (for img, video, etc.)
    const src = component.get?.('src') ?? component.src;
    if (src) {
      parts.push(`src="${this._escapeAttr(src)}"`);
    }

    // Href
    const href = component.get?.('attributes')?.href ?? component.attributes?.href;
    if (href) {
      parts.push(`href="${this._escapeAttr(href)}"`);
    }

    // Generic attributes
    const attrs = component.get?.('attributes') ?? component.attributes ?? {};
    for (const [key, val] of Object.entries(attrs)) {
      if (key === 'id' || key === 'class' || key === 'href' || key === 'style') continue;
      if (val === true) {
        parts.push(key);
      } else if (val !== false && val != null && val !== '') {
        parts.push(`${key}="${this._escapeAttr(String(val))}"`);
      }
    }

    // Inline style from component style object
    const style = component.get?.('style') ?? component.style;
    if (style && typeof style === 'object' && Object.keys(style).length > 0) {
      const styleStr = Object.entries(style)
        .map(([prop, val]) => {
          const kebab = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
          return `${kebab}: ${val}`;
        })
        .join('; ');
      parts.push(`style="${this._escapeAttr(styleStr)}"`);
    }

    return parts.length > 0 ? ' ' + parts.join(' ') : '';
  }

  /**
   * Escape special characters in an attribute value
   * @private
   * @param {string} str
   * @returns {string}
   */
  _escapeAttr(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
