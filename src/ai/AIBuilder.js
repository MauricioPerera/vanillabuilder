/**
 * AIBuilder — AI-friendly programmatic API for VanillaBuilder
 *
 * A high-level facade that allows any AI agent to build web pages
 * through simple function calls. Runs 100% in the browser, no backend.
 *
 * Every method returns { ok: boolean, data?: any, error?: string }
 *
 * @example
 * import { AIBuilder } from './ai/index.js';
 * const builder = new AIBuilder();
 * builder.init();
 * builder.addSection('hero', { headline: 'Hello World' });
 * builder.addSection('features', { items: [{ title: 'Fast', description: '...' }] });
 * const { data: html } = builder.getFullPage({ title: 'My Site' });
 */

import vanillabuilder from '../index.js';
import ParserHtml from '../parser/ParserHtml.js';

// ── Section Templates ──

const SECTION_TEMPLATES = {
  hero: (o = {}) => `<section style="padding:${o.padding||'80px 20px'};text-align:center;background:${o.background||'linear-gradient(135deg,#667eea 0%,#764ba2 100%)'};color:${o.color||'white'};">
    <h1 style="font-size:${o.headingSize||'48px'};font-weight:800;margin-bottom:16px;">${o.headline||'Your Headline Here'}</h1>
    <p style="font-size:${o.subSize||'20px'};opacity:0.9;max-width:600px;margin:0 auto ${o.buttonText?'32px':'0'};">${o.subheadline||'A brief description of your product or service.'}</p>
    ${o.buttonText?`<a href="${o.buttonUrl||'#'}" style="display:inline-block;padding:14px 36px;background:${o.buttonBg||'white'};color:${o.buttonColor||'#764ba2'};border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;">${o.buttonText}</a>`:''}
  </section>`,

  features: (o = {}) => {
    const items = o.items || [
      { icon: '&#9889;', title: 'Feature One', description: 'Description of this feature.' },
      { icon: '&#128640;', title: 'Feature Two', description: 'Description of this feature.' },
      { icon: '&#128161;', title: 'Feature Three', description: 'Description of this feature.' },
    ];
    const cols = items.map(i => `<div style="flex:1;min-width:250px;padding:24px;background:${o.cardBg||'#f8f9fa'};border-radius:8px;text-align:center;">
      <div style="font-size:36px;margin-bottom:12px;">${i.icon||'&#10024;'}</div>
      <h3 style="margin-bottom:8px;color:${o.titleColor||'#333'};">${i.title}</h3>
      <p style="color:${o.textColor||'#666'};font-size:14px;line-height:1.6;">${i.description}</p>
    </div>`).join('');
    return `<section style="padding:${o.padding||'60px 20px'};max-width:${o.maxWidth||'960px'};margin:0 auto;">
      ${o.heading?`<h2 style="text-align:center;font-size:32px;margin-bottom:40px;color:#333;">${o.heading}</h2>`:''}
      <div style="display:flex;gap:24px;flex-wrap:wrap;">${cols}</div>
    </section>`;
  },

  cta: (o = {}) => `<section style="padding:${o.padding||'60px 20px'};background:${o.background||'#7c3aed'};text-align:center;color:white;">
    <h2 style="font-size:36px;font-weight:700;margin-bottom:16px;">${o.headline||'Ready to get started?'}</h2>
    <p style="font-size:18px;opacity:0.9;margin-bottom:28px;">${o.subheadline||'Join thousands of happy customers today.'}</p>
    <a href="${o.buttonUrl||'#'}" style="display:inline-block;padding:14px 36px;background:white;color:${o.buttonColor||'#7c3aed'};border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;">${o.buttonText||'Sign Up Free'}</a>
  </section>`,

  testimonials: (o = {}) => {
    const items = o.items || [{ quote: 'This product changed how we work.', author: 'Jane Doe', role: 'CEO, Company' }];
    const cards = items.map(i => `<div style="flex:1;min-width:300px;padding:32px;background:#f8f9fa;border-radius:12px;">
      <p style="font-size:16px;font-style:italic;color:#444;line-height:1.6;margin-bottom:16px;">"${i.quote}"</p>
      <div><strong style="color:#333;">${i.author}</strong><br/><span style="font-size:13px;color:#888;">${i.role||''}</span></div>
    </div>`).join('');
    return `<section style="padding:${o.padding||'60px 20px'};max-width:960px;margin:0 auto;">
      ${o.heading?`<h2 style="text-align:center;font-size:32px;margin-bottom:40px;color:#333;">${o.heading}</h2>`:''}
      <div style="display:flex;gap:24px;flex-wrap:wrap;">${cards}</div>
    </section>`;
  },

  pricing: (o = {}) => {
    const plans = o.plans || [
      { name: 'Starter', price: '$9', period: '/mo', features: ['5 Projects', 'Basic Support', '1 GB Storage'] },
      { name: 'Pro', price: '$29', period: '/mo', features: ['Unlimited Projects', 'Priority Support', '50 GB Storage'], popular: true },
    ];
    const cards = plans.map(p => `<div style="flex:1;min-width:260px;max-width:300px;padding:32px;background:white;border-radius:12px;text-align:center;border:${p.popular?'2px solid #7c3aed':'1px solid #e2e8f0'};position:relative;">
      ${p.popular?'<div style="position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:#7c3aed;color:white;padding:4px 16px;border-radius:12px;font-size:12px;font-weight:600;">Popular</div>':''}
      <h3 style="font-size:20px;color:#333;margin-bottom:8px;">${p.name}</h3>
      <div style="font-size:42px;font-weight:800;color:#333;margin:16px 0;">${p.price}<span style="font-size:16px;color:#888;font-weight:400;">${p.period||'/mo'}</span></div>
      <ul style="list-style:none;padding:0;margin:0 0 24px;text-align:left;">${p.features.map(f=>`<li style="padding:8px 0;border-bottom:1px solid #f1f3f5;color:#555;">&#10003; ${f}</li>`).join('')}</ul>
      <a href="${p.buttonUrl||'#'}" style="display:block;padding:12px;background:#7c3aed;color:white;border-radius:6px;text-decoration:none;font-weight:600;">${p.buttonText||'Choose Plan'}</a>
    </div>`).join('');
    return `<section style="padding:${o.padding||'60px 20px'};background:${o.background||'#f8f9fa'};">
      ${o.heading?`<h2 style="text-align:center;font-size:32px;margin-bottom:40px;color:#333;">${o.heading}</h2>`:''}
      <div style="display:flex;gap:24px;justify-content:center;flex-wrap:wrap;max-width:960px;margin:0 auto;">${cards}</div>
    </section>`;
  },

  footer: (o = {}) => {
    const cols = o.columns || [
      { title: 'Company', text: o.companyText || 'Building the future.' },
      { title: 'Links', links: o.links || [{ text: 'Home', url: '#' }, { text: 'About', url: '#' }, { text: 'Contact', url: '#' }] },
      { title: 'Legal', links: [{ text: 'Privacy', url: '#' }, { text: 'Terms', url: '#' }] },
    ];
    const colsHtml = cols.map(c => `<div style="flex:1;min-width:150px;">
      <h4 style="font-size:16px;margin-bottom:12px;color:white;">${c.title}</h4>
      ${c.text?`<p style="font-size:14px;color:#9ca3af;line-height:1.8;">${c.text}</p>`:''}
      ${c.links?`<div style="display:flex;flex-direction:column;gap:8px;">${c.links.map(l=>`<a href="${l.url||'#'}" style="color:#9ca3af;text-decoration:none;font-size:14px;">${l.text}</a>`).join('')}</div>`:''}
    </div>`).join('');
    return `<footer style="padding:40px 20px;background:${o.background||'#1a1a2e'};color:#cdd6f4;">
      <div style="display:flex;gap:40px;flex-wrap:wrap;max-width:960px;margin:0 auto 32px;">${colsHtml}</div>
      <div style="border-top:1px solid #2a2a4a;padding-top:20px;text-align:center;font-size:13px;color:#6c7086;">${o.copyright||'&copy; 2026 Company. All rights reserved.'}</div>
    </footer>`;
  },

  contact: (o = {}) => `<section style="padding:${o.padding||'60px 20px'};max-width:${o.maxWidth||'500px'};margin:0 auto;">
    ${o.heading?`<h2 style="text-align:center;font-size:32px;margin-bottom:32px;color:#333;">${o.heading}</h2>`:''}
    <form style="display:flex;flex-direction:column;gap:16px;">
      <input type="text" placeholder="${o.namePlaceholder||'Your name'}" style="padding:12px;border:1px solid #dee2e6;border-radius:6px;font-size:14px;"/>
      <input type="email" placeholder="${o.emailPlaceholder||'you@example.com'}" style="padding:12px;border:1px solid #dee2e6;border-radius:6px;font-size:14px;"/>
      <textarea rows="${o.rows||4}" placeholder="${o.messagePlaceholder||'Your message'}" style="padding:12px;border:1px solid #dee2e6;border-radius:6px;font-size:14px;resize:vertical;"></textarea>
      <button type="submit" style="padding:12px 24px;background:${o.buttonBg||'#7c3aed'};color:white;border:none;border-radius:6px;font-size:15px;font-weight:600;cursor:pointer;">${o.buttonText||'Send Message'}</button>
    </form>
  </section>`,

  faq: (o = {}) => {
    const items = o.items || [
      { question: 'What is this product?', answer: 'A brief answer to the question.' },
      { question: 'How does pricing work?', answer: 'A brief answer about pricing.' },
    ];
    const faqHtml = items.map(i => `<div style="border-bottom:1px solid #e2e8f0;padding:16px 0;">
      <h4 style="font-size:16px;color:#333;margin-bottom:8px;">${i.question}</h4>
      <p style="font-size:14px;color:#666;line-height:1.6;">${i.answer}</p>
    </div>`).join('');
    return `<section style="padding:${o.padding||'60px 20px'};max-width:700px;margin:0 auto;">
      ${o.heading?`<h2 style="text-align:center;font-size:32px;margin-bottom:40px;color:#333;">${o.heading}</h2>`:''}
      ${faqHtml}
    </section>`;
  },

  navbar: (o = {}) => {
    const links = o.links || [{ text: 'Home', url: '#' }, { text: 'About', url: '#' }, { text: 'Contact', url: '#' }];
    const linksHtml = links.map(l => `<a href="${l.url||'#'}" style="color:${o.linkColor||'#333'};text-decoration:none;font-size:14px;font-weight:500;">${l.text}</a>`).join('');
    return `<nav style="display:flex;align-items:center;justify-content:space-between;padding:16px 24px;background:${o.background||'white'};border-bottom:1px solid #e2e8f0;">
      <div style="font-size:20px;font-weight:700;color:${o.brandColor||'#7c3aed'};">${o.brand||'Brand'}</div>
      <div style="display:flex;gap:24px;">${linksHtml}</div>
      ${o.ctaText?`<a href="${o.ctaUrl||'#'}" style="padding:8px 20px;background:#7c3aed;color:white;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600;">${o.ctaText}</a>`:''}
    </nav>`;
  },

  stats: (o = {}) => {
    const items = o.items || [
      { value: '10K+', label: 'Users' },
      { value: '99.9%', label: 'Uptime' },
      { value: '24/7', label: 'Support' },
      { value: '50+', label: 'Countries' },
    ];
    const statsHtml = items.map(i => `<div style="flex:1;min-width:120px;text-align:center;">
      <div style="font-size:36px;font-weight:800;color:${o.valueColor||'#7c3aed'};margin-bottom:4px;">${i.value}</div>
      <div style="font-size:14px;color:${o.labelColor||'#666'};">${i.label}</div>
    </div>`).join('');
    return `<section style="padding:${o.padding||'60px 20px'};background:${o.background||'#f8f9fa'};">
      <div style="display:flex;gap:32px;flex-wrap:wrap;justify-content:center;max-width:800px;margin:0 auto;">${statsHtml}</div>
    </section>`;
  },
};

// ── Main Class ──

export default class AIBuilder {
  constructor() {
    /** @type {import('../editor/Editor.js').default|null} */
    this._editor = null;
    this._initialized = false;
    this._parser = new ParserHtml();
  }

  // ── Internal Helpers ──

  /** @private */
  _result(ok, data, error) {
    const r = { ok };
    if (data !== undefined) r.data = data;
    if (error) r.error = error;
    return r;
  }

  /** @private */
  _ensureEditor() {
    if (!this._editor) this.init();
  }

  /** @private - Resolve CSS selector to Component array */
  _resolve(selector) {
    this._ensureEditor();
    const wrapper = this._editor.Components?.getWrapper();
    if (!wrapper) return [];
    if (!selector || selector === 'body' || selector === ':root') return [wrapper];
    return wrapper.find(selector);
  }

  /** @private - Extract plain info from Component */
  _componentInfo(comp) {
    if (!comp) return null;
    return {
      id: comp.getId() || comp.cid,
      tagName: comp.get('tagName'),
      type: comp.get('type') || 'default',
      classes: comp.getClasses(),
      content: comp.get('content') || '',
      childCount: comp.components()?.length || 0,
      name: comp.getName(),
    };
  }

  /** @private - Parse HTML string to component definitions */
  _parseHTML(html) {
    try {
      return this._parser.parse(html);
    } catch (e) {
      // Fallback: wrap in a div with content
      return [{ tagName: 'div', content: html }];
    }
  }

  /** @private - Build tree recursively */
  _buildTree(comp, depth = 0, maxDepth = 10) {
    if (depth > maxDepth) return null;
    const info = this._componentInfo(comp);
    if (!info) return null;
    const children = [];
    if (comp.components()) {
      for (const child of comp.components()) {
        const node = this._buildTree(child, depth + 1, maxDepth);
        if (node) children.push(node);
      }
    }
    info.children = children;
    return info;
  }

  // ── Initialization ──

  /**
   * Initialize the AI builder
   * @param {Object} [config={}]
   * @returns {{ ok: boolean, data: { version: string } }}
   */
  init(config = {}) {
    try {
      this._editor = vanillabuilder.init({
        headless: true,
        autorender: false,
        ...config,
      });
      this._initialized = true;
      return this._result(true, { version: vanillabuilder.version });
    } catch (e) {
      return this._result(false, undefined, e.message);
    }
  }

  // ── Page Management ──

  clearPage() {
    this._ensureEditor();
    try {
      const wrapper = this._editor.Components?.getWrapper();
      if (wrapper) wrapper.components().reset([]);
      return this._result(true);
    } catch (e) {
      return this._result(false, undefined, e.message);
    }
  }

  // ── Adding Content ──

  addBlock(blockId) {
    this._ensureEditor();
    try {
      const block = this._editor.Blocks?.get(blockId);
      if (!block) return this._result(false, undefined, `Block "${blockId}" not found`);
      const content = block.get('content') || block.getContent?.() || '';
      const wrapper = this._editor.Components.getWrapper();
      const result = wrapper.append(content);
      const comp = Array.isArray(result) ? result[0] : result;
      return this._result(true, { componentId: comp?.cid });
    } catch (e) {
      return this._result(false, undefined, e.message);
    }
  }

  addHTML(html, targetSelector) {
    this._ensureEditor();
    try {
      let parent;
      if (targetSelector) {
        const targets = this._resolve(targetSelector);
        parent = targets[0];
        if (!parent) return this._result(false, undefined, `Target "${targetSelector}" not found`);
      } else {
        parent = this._editor.Components.getWrapper();
      }
      // Parse HTML to component definitions first
      const defs = this._parseHTML(html);
      let lastComp = null;
      for (const def of defs) {
        const result = parent.append(def);
        lastComp = Array.isArray(result) ? result[0] : result;
      }
      return this._result(true, { componentId: lastComp?.cid });
    } catch (e) {
      return this._result(false, undefined, e.message);
    }
  }

  addComponent(definition) {
    this._ensureEditor();
    try {
      // Map 'children' to 'components' for convenience
      if (definition.children && !definition.components) {
        definition.components = definition.children;
        delete definition.children;
      }
      const wrapper = this._editor.Components.getWrapper();
      const result = wrapper.append(definition);
      const comp = Array.isArray(result) ? result[0] : result;
      return this._result(true, { componentId: comp?.cid });
    } catch (e) {
      return this._result(false, undefined, e.message);
    }
  }

  addSection(type, options = {}) {
    const template = SECTION_TEMPLATES[type];
    if (!template) {
      return this._result(false, undefined, `Section type "${type}" not found. Available: ${Object.keys(SECTION_TEMPLATES).join(', ')}`);
    }
    try {
      const html = template(options);
      return this.addHTML(html);
    } catch (e) {
      return this._result(false, undefined, e.message);
    }
  }

  // ── Modifying Content ──

  updateContent(selector, newContent) {
    try {
      const comps = this._resolve(selector);
      if (!comps.length) return this._result(false, undefined, `No components match "${selector}"`);
      for (const c of comps) c.set('content', newContent);
      return this._result(true, { matched: comps.length });
    } catch (e) {
      return this._result(false, undefined, e.message);
    }
  }

  updateStyle(selector, styles) {
    try {
      const comps = this._resolve(selector);
      if (!comps.length) return this._result(false, undefined, `No components match "${selector}"`);
      for (const c of comps) c.addStyle(styles);
      return this._result(true, { matched: comps.length });
    } catch (e) {
      return this._result(false, undefined, e.message);
    }
  }

  updateAttribute(selector, key, value) {
    try {
      const comps = this._resolve(selector);
      if (!comps.length) return this._result(false, undefined, `No components match "${selector}"`);
      for (const c of comps) c.addAttributes({ [key]: value });
      return this._result(true, { matched: comps.length });
    } catch (e) {
      return this._result(false, undefined, e.message);
    }
  }

  addClass(selector, className) {
    try {
      const comps = this._resolve(selector);
      if (!comps.length) return this._result(false, undefined, `No components match "${selector}"`);
      for (const c of comps) c.addClass(className);
      return this._result(true, { matched: comps.length });
    } catch (e) {
      return this._result(false, undefined, e.message);
    }
  }

  removeClass(selector, className) {
    try {
      const comps = this._resolve(selector);
      if (!comps.length) return this._result(false, undefined, `No components match "${selector}"`);
      for (const c of comps) c.removeClass(className);
      return this._result(true, { matched: comps.length });
    } catch (e) {
      return this._result(false, undefined, e.message);
    }
  }

  removeComponent(selector) {
    try {
      const comps = this._resolve(selector);
      if (!comps.length) return this._result(false, undefined, `No components match "${selector}"`);
      const count = comps.length;
      for (const c of [...comps]) c.remove();
      return this._result(true, { removed: count });
    } catch (e) {
      return this._result(false, undefined, e.message);
    }
  }

  moveComponent(selector, targetSelector, position = 'inside') {
    try {
      const sources = this._resolve(selector);
      const targets = this._resolve(targetSelector);
      if (!sources.length) return this._result(false, undefined, `Source "${selector}" not found`);
      if (!targets.length) return this._result(false, undefined, `Target "${targetSelector}" not found`);

      const source = sources[0];
      const target = targets[0];
      const json = source.toJSON();
      source.remove();

      if (position === 'inside') {
        target.append(json);
      } else if (position === 'before') {
        const parent = target.parent();
        if (parent) parent.components().add(json, { at: target.index() });
      } else if (position === 'after') {
        const parent = target.parent();
        if (parent) parent.components().add(json, { at: target.index() + 1 });
      }

      return this._result(true);
    } catch (e) {
      return this._result(false, undefined, e.message);
    }
  }

  cloneComponent(selector) {
    try {
      const comps = this._resolve(selector);
      if (!comps.length) return this._result(false, undefined, `No components match "${selector}"`);
      const original = comps[0];
      const cloned = original.clone();
      const parent = original.parent();
      if (parent) {
        parent.components().add(cloned.toJSON(), { at: original.index() + 1 });
      }
      return this._result(true, { componentId: cloned.cid });
    } catch (e) {
      return this._result(false, undefined, e.message);
    }
  }

  wrapComponent(selector, wrapperDef = {}) {
    try {
      const comps = this._resolve(selector);
      if (!comps.length) return this._result(false, undefined, `No components match "${selector}"`);
      const target = comps[0];
      const parent = target.parent();
      if (!parent) return this._result(false, undefined, 'Cannot wrap root component');

      const idx = target.index();
      const targetJson = target.toJSON();
      target.remove();

      const wrapper = { tagName: 'div', ...wrapperDef, components: [targetJson] };
      const result = parent.components().add(wrapper, { at: idx });
      const comp = Array.isArray(result) ? result[0] : result;

      return this._result(true, { wrapperId: comp?.cid });
    } catch (e) {
      return this._result(false, undefined, e.message);
    }
  }

  // ── CSS Rules ──

  addCSSRule(selector, styles, options = {}) {
    this._ensureEditor();
    try {
      const css = this._editor.Css;
      if (!css || !css.setRule) return this._result(false, undefined, 'CSS module not available');
      const selectors = Array.isArray(selector) ? selector : [selector];
      const opts = {};
      if (options.mediaQuery) opts.mediaText = options.mediaQuery;
      if (options.state) opts.state = options.state;
      css.setRule(selectors, styles, opts);
      return this._result(true);
    } catch (e) {
      return this._result(false, undefined, e.message);
    }
  }

  removeCSSRule(selector) {
    this._ensureEditor();
    try {
      const css = this._editor.Css;
      if (!css) return this._result(false, undefined, 'CSS module not available');
      const selectors = Array.isArray(selector) ? selector : [selector];
      const rule = css.getRule?.(selectors);
      if (rule) css.remove(rule);
      return this._result(true);
    } catch (e) {
      return this._result(false, undefined, e.message);
    }
  }

  // ── Export ──

  getHTML() {
    this._ensureEditor();
    try {
      const wrapper = this._editor.Components?.getWrapper();
      const html = wrapper ? wrapper.components().map(c => c.toHTML()).join('\n') : '';
      return this._result(true, html);
    } catch (e) {
      return this._result(false, undefined, e.message);
    }
  }

  getCSS() {
    this._ensureEditor();
    try {
      const css = this._editor.Css;
      const output = css?.buildCSS?.() || '';
      return this._result(true, output);
    } catch (e) {
      return this._result(false, undefined, e.message);
    }
  }

  getFullPage(options = {}) {
    this._ensureEditor();
    try {
      const { data: html } = this.getHTML();
      const { data: css } = this.getCSS();
      const title = options.title || 'Untitled Page';
      const lang = options.lang || 'en';
      const meta = options.meta || '';
      const headLinks = options.headLinks || '';
      const bodyFont = options.font || "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

      const page = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  ${meta}
  ${headLinks}
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: ${bodyFont}; }
    img { max-width: 100%; height: auto; }
    a { transition: opacity 0.2s; }
    a:hover { opacity: 0.85; }
    ${css}
  </style>
</head>
<body>
${html}
</body>
</html>`;
      return this._result(true, page);
    } catch (e) {
      return this._result(false, undefined, e.message);
    }
  }

  getProjectJSON() {
    this._ensureEditor();
    try {
      const data = this._editor.getProjectData();
      return this._result(true, data);
    } catch (e) {
      return this._result(false, undefined, e.message);
    }
  }

  loadProjectJSON(json) {
    this._ensureEditor();
    try {
      this._editor.loadProjectData(json);
      return this._result(true);
    } catch (e) {
      return this._result(false, undefined, e.message);
    }
  }

  // ── Query ──

  getComponentTree() {
    this._ensureEditor();
    try {
      const wrapper = this._editor.Components?.getWrapper();
      if (!wrapper) return this._result(true, []);
      const children = [];
      for (const child of wrapper.components()) {
        const node = this._buildTree(child);
        if (node) children.push(node);
      }
      return this._result(true, children);
    } catch (e) {
      return this._result(false, undefined, e.message);
    }
  }

  findComponents(selector) {
    try {
      const comps = this._resolve(selector);
      return this._result(true, comps.map(c => this._componentInfo(c)));
    } catch (e) {
      return this._result(false, undefined, e.message);
    }
  }

  getPageInfo() {
    this._ensureEditor();
    try {
      const wrapper = this._editor.Components?.getWrapper();
      let componentCount = 0;
      const classesUsed = new Set();
      const walk = (comp) => {
        componentCount++;
        for (const cls of (comp.getClasses?.() || [])) classesUsed.add(cls);
        if (comp.components()) {
          for (const child of comp.components()) walk(child);
        }
      };
      if (wrapper) {
        for (const child of wrapper.components()) walk(child);
      }
      return this._result(true, { componentCount, classesUsed: [...classesUsed] });
    } catch (e) {
      return this._result(false, undefined, e.message);
    }
  }

  // ── Templates & Presets ──

  getAvailableBlocks() {
    this._ensureEditor();
    try {
      const blocks = this._editor.Blocks?.getAll?.() || [];
      return this._result(true, blocks.map(b => ({
        id: b.id || b.get?.('id'),
        label: b.get?.('label') || '',
        category: b.get?.('category') || '',
      })));
    } catch (e) {
      return this._result(true, []);
    }
  }

  getAvailableSections() {
    return this._result(true, Object.keys(SECTION_TEMPLATES).map(id => ({
      id,
      description: {
        hero: 'Hero banner with headline, subheadline, and CTA button',
        features: 'Feature grid with icon, title, and description cards',
        cta: 'Call-to-action banner with headline and button',
        testimonials: 'Customer testimonial quote cards',
        pricing: 'Pricing plan comparison cards',
        footer: 'Page footer with columns and copyright',
        contact: 'Contact form with name, email, message fields',
        faq: 'FAQ section with question/answer pairs',
        navbar: 'Navigation bar with brand, links, and optional CTA',
        stats: 'Statistics counter grid',
      }[id] || '',
    })));
  }

  buildLandingPage(config = {}) {
    this._ensureEditor();
    try {
      this.clearPage();

      if (config.navbar !== false) {
        this.addSection('navbar', config.navbar || {});
      }
      if (config.hero !== false) {
        this.addSection('hero', config.hero || {});
      }
      if (config.features) {
        this.addSection('features', config.features);
      }
      if (config.stats) {
        this.addSection('stats', config.stats);
      }
      if (config.testimonials) {
        this.addSection('testimonials', config.testimonials);
      }
      if (config.pricing) {
        this.addSection('pricing', config.pricing);
      }
      if (config.cta !== false && config.cta) {
        this.addSection('cta', config.cta);
      }
      if (config.faq) {
        this.addSection('faq', config.faq);
      }
      if (config.contact) {
        this.addSection('contact', config.contact);
      }
      if (config.footer !== false) {
        this.addSection('footer', config.footer || {});
      }

      return this.getFullPage({ title: config.title || 'Landing Page' });
    } catch (e) {
      return this._result(false, undefined, e.message);
    }
  }

  // ── Execute (AI Tool Dispatch) ──

  /**
   * Execute any method by name — for AI tool_use dispatch
   * @param {string} method - Method name
   * @param {Object} params - Method parameters
   * @returns {{ ok, data?, error? }}
   */
  execute(method, params = {}) {
    if (typeof this[method] !== 'function' || method.startsWith('_')) {
      return this._result(false, undefined, `Unknown method: ${method}`);
    }

    try {
      // Map params object to method arguments
      switch (method) {
        case 'init': return this.init(params);
        case 'clearPage': return this.clearPage();
        case 'addBlock': return this.addBlock(params.blockId);
        case 'addHTML': return this.addHTML(params.html, params.targetSelector);
        case 'addComponent': return this.addComponent(params.definition || params);
        case 'addSection': return this.addSection(params.type, params.options || params);
        case 'updateContent': return this.updateContent(params.selector, params.content);
        case 'updateStyle': return this.updateStyle(params.selector, params.styles);
        case 'updateAttribute': return this.updateAttribute(params.selector, params.key, params.value);
        case 'addClass': return this.addClass(params.selector, params.className);
        case 'removeClass': return this.removeClass(params.selector, params.className);
        case 'removeComponent': return this.removeComponent(params.selector);
        case 'moveComponent': return this.moveComponent(params.selector, params.targetSelector, params.position);
        case 'cloneComponent': return this.cloneComponent(params.selector);
        case 'wrapComponent': return this.wrapComponent(params.selector, params.wrapper);
        case 'addCSSRule': return this.addCSSRule(params.selector, params.styles, params.options);
        case 'removeCSSRule': return this.removeCSSRule(params.selector);
        case 'getHTML': return this.getHTML();
        case 'getCSS': return this.getCSS();
        case 'getFullPage': return this.getFullPage(params);
        case 'getProjectJSON': return this.getProjectJSON();
        case 'loadProjectJSON': return this.loadProjectJSON(params.json || params);
        case 'getComponentTree': return this.getComponentTree();
        case 'findComponents': return this.findComponents(params.selector);
        case 'getPageInfo': return this.getPageInfo();
        case 'getAvailableBlocks': return this.getAvailableBlocks();
        case 'getAvailableSections': return this.getAvailableSections();
        case 'buildLandingPage': return this.buildLandingPage(params);
        default: return this._result(false, undefined, `Method "${method}" not mapped in execute()`);
      }
    } catch (e) {
      return this._result(false, undefined, e.message);
    }
  }
}
