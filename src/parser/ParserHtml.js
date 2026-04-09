/**
 * ParserHtml - Parse HTML strings into component JSON definitions
 *
 * Uses DOMParser to create a DOM tree, then walks each node converting
 * elements to the component definition format used by DomComponents.
 */

export default class ParserHtml {
  /**
   * @param {Object} [config={}]
   */
  constructor(config = {}) {
    this.config = config;
    /** @type {Map<string, string>} Tag-to-component-type mapping */
    this.tagTypes = new Map([
      ['img', 'image'],
      ['video', 'video'],
      ['svg', 'svg'],
      ['a', 'link'],
      ['table', 'table'],
      ['thead', 'thead'],
      ['tbody', 'tbody'],
      ['tfoot', 'tfoot'],
      ['tr', 'row'],
      ['td', 'cell'],
      ['th', 'cell'],
      ['input', 'input'],
      ['textarea', 'textnode'],
      ['select', 'select'],
      ['option', 'option'],
      ['label', 'label'],
      ['button', 'button'],
      ['form', 'form'],
      ['map', 'map'],
      ['script', 'script'],
      ['iframe', 'iframe'],
    ]);
  }

  /**
   * Parse an HTML string into an array of component definitions
   * @param {string} htmlString - Raw HTML
   * @returns {Object[]} Array of component definition objects
   */
  parse(htmlString) {
    if (!htmlString || typeof htmlString !== 'string') return [];

    const str = htmlString.trim();
    if (!str) return [];

    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div id="__vb_wrapper__">${str}</div>`, 'text/html');
    const wrapper = doc.getElementById('__vb_wrapper__');
    if (!wrapper) return [];

    const result = [];
    for (const child of wrapper.childNodes) {
      const def = this._parseNode(child);
      if (def) result.push(def);
    }

    return result;
  }

  /**
   * Parse a single DOM node into a component definition
   * @private
   * @param {Node} node
   * @returns {Object|null}
   */
  _parseNode(node) {
    // Text node
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent;
      if (!text || !text.trim()) return null;
      return {
        type: 'textnode',
        content: text,
      };
    }

    // Comment node
    if (node.nodeType === Node.COMMENT_NODE) {
      return null;
    }

    // Element node
    if (node.nodeType !== Node.ELEMENT_NODE) return null;

    /** @type {HTMLElement} */
    const el = node;
    const tag = el.tagName.toLowerCase();

    const def = {
      tagName: tag,
      type: this._detectType(el, tag),
      attributes: {},
      components: [],
    };

    // Collect attributes
    for (const attr of el.attributes) {
      const name = attr.name;
      const value = attr.value;

      if (name === 'class') {
        def.classes = value.split(/\s+/).filter(Boolean);
      } else if (name === 'id') {
        def.attributes.id = value;
      } else if (name === 'style') {
        def.style = this._parseInlineStyle(value);
      } else if (name === 'src') {
        def.src = value;
      } else if (name === 'href') {
        def.attributes.href = value;
      } else if (name.startsWith('data-vb-')) {
        // Framework-specific data attributes
        const key = name.replace('data-vb-', '');
        if (key === 'type') def.type = value;
        else def[key] = value;
      } else {
        def.attributes[name] = value;
      }
    }

    // Clean up empty objects
    if (Object.keys(def.attributes).length === 0) delete def.attributes;

    // Special handling for void elements
    const voidTags = new Set([
      'area', 'base', 'br', 'col', 'embed', 'hr', 'img',
      'input', 'link', 'meta', 'param', 'source', 'track', 'wbr',
    ]);

    if (voidTags.has(tag)) {
      delete def.components;
      return def;
    }

    // Check for inline text-only content
    if (el.childNodes.length === 1 && el.childNodes[0].nodeType === Node.TEXT_NODE) {
      const text = el.childNodes[0].textContent;
      if (text && text.trim()) {
        def.content = text;
        delete def.components;
        return def;
      }
    }

    // Parse children
    const children = [];
    for (const child of el.childNodes) {
      const childDef = this._parseNode(child);
      if (childDef) children.push(childDef);
    }

    if (children.length > 0) {
      def.components = children;
    } else {
      delete def.components;
    }

    return def;
  }

  /**
   * Detect component type from element tag/attributes
   * @private
   * @param {HTMLElement} el
   * @param {string} tag
   * @returns {string}
   */
  _detectType(el, tag) {
    // Check data attribute override
    const typeAttr = el.getAttribute('data-vb-type');
    if (typeAttr) return typeAttr;

    // Check tag-based mapping
    if (this.tagTypes.has(tag)) {
      return this.tagTypes.get(tag);
    }

    // Text-level elements
    const textTags = new Set([
      'span', 'b', 'i', 'u', 'em', 'strong', 'small',
      'sub', 'sup', 'mark', 'abbr', 'code', 'kbd', 'samp',
    ]);
    if (textTags.has(tag)) return 'text';

    // Default: generic div-like element
    return 'default';
  }

  /**
   * Parse an inline style string into a style object
   * @private
   * @param {string} styleStr
   * @returns {Object}
   */
  _parseInlineStyle(styleStr) {
    const style = {};
    if (!styleStr) return style;

    styleStr.split(';').forEach(decl => {
      const colonIdx = decl.indexOf(':');
      if (colonIdx < 0) return;
      const prop = decl.slice(0, colonIdx).trim();
      const value = decl.slice(colonIdx + 1).trim();
      if (prop && value) {
        style[prop] = value;
      }
    });

    return style;
  }
}
