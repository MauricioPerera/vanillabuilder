/**
 * Standalone page builder for Cloudflare Pages Functions
 * No DOM dependency — pure string generation
 */

const TEMPLATES = {
  hero: (o = {}) => `<section style="padding:${o.padding||'80px 20px'};text-align:center;background:${o.background||'linear-gradient(135deg,#667eea 0%,#764ba2 100%)'};color:${o.color||'white'};">
    <h1 style="font-size:${o.headingSize||'48px'};font-weight:800;margin-bottom:16px;">${o.headline||'Your Headline Here'}</h1>
    <p style="font-size:${o.subSize||'20px'};opacity:0.9;max-width:600px;margin:0 auto ${o.buttonText?'32px':'0'};">${o.subheadline||'A brief description of your product or service.'}</p>
    ${o.buttonText?`<a href="${o.buttonUrl||'#'}" style="display:inline-block;padding:14px 36px;background:${o.buttonBg||'white'};color:${o.buttonColor||'#764ba2'};border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;">${o.buttonText}</a>`:''}</section>`,

  features: (o = {}) => {
    const items = o.items || [
      { icon: '&#9889;', title: 'Feature One', description: 'Description goes here.' },
      { icon: '&#128640;', title: 'Feature Two', description: 'Description goes here.' },
      { icon: '&#128161;', title: 'Feature Three', description: 'Description goes here.' },
    ];
    return `<section style="padding:${o.padding||'60px 20px'};max-width:${o.maxWidth||'960px'};margin:0 auto;">
      ${o.heading?`<h2 style="text-align:center;font-size:32px;margin-bottom:40px;color:#333;">${o.heading}</h2>`:''}
      <div style="display:flex;gap:24px;flex-wrap:wrap;">${items.map(i => `<div style="flex:1;min-width:250px;padding:24px;background:${o.cardBg||'#f8f9fa'};border-radius:8px;text-align:center;">
      <div style="font-size:36px;margin-bottom:12px;">${i.icon||'&#10024;'}</div>
      <h3 style="margin-bottom:8px;color:${o.titleColor||'#333'};">${i.title}</h3>
      <p style="color:${o.textColor||'#666'};font-size:14px;line-height:1.6;">${i.description}</p></div>`).join('')}</div></section>`;
  },

  cta: (o = {}) => `<section style="padding:${o.padding||'60px 20px'};background:${o.background||'#7c3aed'};text-align:center;color:white;">
    <h2 style="font-size:36px;font-weight:700;margin-bottom:16px;">${o.headline||'Ready to get started?'}</h2>
    <p style="font-size:18px;opacity:0.9;margin-bottom:28px;">${o.subheadline||'Join thousands of happy customers today.'}</p>
    <a href="${o.buttonUrl||'#'}" style="display:inline-block;padding:14px 36px;background:white;color:${o.buttonColor||'#7c3aed'};border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;">${o.buttonText||'Sign Up Free'}</a></section>`,

  testimonials: (o = {}) => {
    const items = o.items || [{ quote: 'Amazing product.', author: 'Jane Doe', role: 'CEO' }];
    return `<section style="padding:${o.padding||'60px 20px'};max-width:960px;margin:0 auto;">
      ${o.heading?`<h2 style="text-align:center;font-size:32px;margin-bottom:40px;color:#333;">${o.heading}</h2>`:''}
      <div style="display:flex;gap:24px;flex-wrap:wrap;">${items.map(i => `<div style="flex:1;min-width:300px;padding:32px;background:#f8f9fa;border-radius:12px;">
      <p style="font-size:16px;font-style:italic;color:#444;line-height:1.6;margin-bottom:16px;">"${i.quote}"</p>
      <div><strong style="color:#333;">${i.author}</strong><br/><span style="font-size:13px;color:#888;">${i.role||''}</span></div></div>`).join('')}</div></section>`;
  },

  pricing: (o = {}) => {
    const plans = o.plans || [
      { name: 'Starter', price: '$9', period: '/mo', features: ['5 Projects', 'Basic Support'] },
      { name: 'Pro', price: '$29', period: '/mo', features: ['Unlimited', 'Priority Support'], popular: true },
    ];
    return `<section style="padding:${o.padding||'60px 20px'};background:${o.background||'#f8f9fa'};">
      ${o.heading?`<h2 style="text-align:center;font-size:32px;margin-bottom:40px;color:#333;">${o.heading}</h2>`:''}
      <div style="display:flex;gap:24px;justify-content:center;flex-wrap:wrap;max-width:960px;margin:0 auto;">${plans.map(p => `<div style="flex:1;min-width:260px;max-width:300px;padding:32px;background:white;border-radius:12px;text-align:center;border:${p.popular?'2px solid #7c3aed':'1px solid #e2e8f0'};position:relative;">
      ${p.popular?'<div style="position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:#7c3aed;color:white;padding:4px 16px;border-radius:12px;font-size:12px;font-weight:600;">Popular</div>':''}
      <h3 style="font-size:20px;color:#333;margin-bottom:8px;">${p.name}</h3>
      <div style="font-size:42px;font-weight:800;color:#333;margin:16px 0;">${p.price}<span style="font-size:16px;color:#888;font-weight:400;">${p.period||'/mo'}</span></div>
      <ul style="list-style:none;padding:0;margin:0 0 24px;text-align:left;">${p.features.map(f=>`<li style="padding:8px 0;border-bottom:1px solid #f1f3f5;color:#555;">&#10003; ${f}</li>`).join('')}</ul>
      <a href="${p.buttonUrl||'#'}" style="display:block;padding:12px;background:#7c3aed;color:white;border-radius:6px;text-decoration:none;font-weight:600;">${p.buttonText||'Choose Plan'}</a></div>`).join('')}</div></section>`;
  },

  footer: (o = {}) => {
    const cols = o.columns || [
      { title: 'Company', text: o.companyText || 'Building the future.' },
      { title: 'Links', links: o.links || [{ text: 'Home', url: '#' }, { text: 'About', url: '#' }, { text: 'Contact', url: '#' }] },
      { title: 'Legal', links: [{ text: 'Privacy', url: '#' }, { text: 'Terms', url: '#' }] },
    ];
    return `<footer style="padding:40px 20px;background:${o.background||'#1a1a2e'};color:#cdd6f4;">
      <div style="display:flex;gap:40px;flex-wrap:wrap;max-width:960px;margin:0 auto 32px;">${cols.map(c => `<div style="flex:1;min-width:150px;">
      <h4 style="font-size:16px;margin-bottom:12px;color:white;">${c.title}</h4>
      ${c.text?`<p style="font-size:14px;color:#9ca3af;line-height:1.8;">${c.text}</p>`:''}
      ${c.links?`<div style="display:flex;flex-direction:column;gap:8px;">${c.links.map(l=>`<a href="${l.url||'#'}" style="color:#9ca3af;text-decoration:none;font-size:14px;">${l.text}</a>`).join('')}</div>`:''}</div>`).join('')}</div>
      <div style="border-top:1px solid #2a2a4a;padding-top:20px;text-align:center;font-size:13px;color:#6c7086;">${o.copyright||'&copy; 2026 Company. All rights reserved.'}</div></footer>`;
  },

  contact: (o = {}) => `<section style="padding:${o.padding||'60px 20px'};max-width:${o.maxWidth||'500px'};margin:0 auto;">
    ${o.heading?`<h2 style="text-align:center;font-size:32px;margin-bottom:32px;color:#333;">${o.heading}</h2>`:''}
    <form style="display:flex;flex-direction:column;gap:16px;">
      <input type="text" placeholder="${o.namePlaceholder||'Your name'}" style="padding:12px;border:1px solid #dee2e6;border-radius:6px;font-size:14px;"/>
      <input type="email" placeholder="${o.emailPlaceholder||'you@example.com'}" style="padding:12px;border:1px solid #dee2e6;border-radius:6px;font-size:14px;"/>
      <textarea rows="${o.rows||4}" placeholder="${o.messagePlaceholder||'Your message'}" style="padding:12px;border:1px solid #dee2e6;border-radius:6px;font-size:14px;resize:vertical;"></textarea>
      <button type="submit" style="padding:12px 24px;background:${o.buttonBg||'#7c3aed'};color:white;border:none;border-radius:6px;font-size:15px;font-weight:600;cursor:pointer;">${o.buttonText||'Send Message'}</button></form></section>`,

  faq: (o = {}) => {
    const items = o.items || [{ question: 'Question?', answer: 'Answer.' }];
    return `<section style="padding:${o.padding||'60px 20px'};max-width:700px;margin:0 auto;">
      ${o.heading?`<h2 style="text-align:center;font-size:32px;margin-bottom:40px;color:#333;">${o.heading}</h2>`:''}${items.map(i => `<div style="border-bottom:1px solid #e2e8f0;padding:16px 0;">
      <h4 style="font-size:16px;color:#333;margin-bottom:8px;">${i.question}</h4>
      <p style="font-size:14px;color:#666;line-height:1.6;">${i.answer}</p></div>`).join('')}</section>`;
  },

  navbar: (o = {}) => {
    const links = o.links || [{ text: 'Home', url: '#' }, { text: 'About', url: '#' }, { text: 'Contact', url: '#' }];
    return `<nav style="display:flex;align-items:center;justify-content:space-between;padding:16px 24px;background:${o.background||'white'};border-bottom:1px solid #e2e8f0;">
      <div style="font-size:20px;font-weight:700;color:${o.brandColor||'#7c3aed'};">${o.brand||'Brand'}</div>
      <div style="display:flex;gap:24px;">${links.map(l => `<a href="${l.url||'#'}" style="color:${o.linkColor||'#333'};text-decoration:none;font-size:14px;font-weight:500;">${l.text}</a>`).join('')}</div>
      ${o.ctaText?`<a href="${o.ctaUrl||'#'}" style="padding:8px 20px;background:#7c3aed;color:white;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600;">${o.ctaText}</a>`:''}</nav>`;
  },

  stats: (o = {}) => {
    const items = o.items || [{ value: '10K+', label: 'Users' }, { value: '99.9%', label: 'Uptime' }, { value: '24/7', label: 'Support' }];
    return `<section style="padding:${o.padding||'60px 20px'};background:${o.background||'#f8f9fa'};">
      <div style="display:flex;gap:32px;flex-wrap:wrap;justify-content:center;max-width:800px;margin:0 auto;">${items.map(i => `<div style="flex:1;min-width:120px;text-align:center;">
      <div style="font-size:36px;font-weight:800;color:${o.valueColor||'#7c3aed'};margin-bottom:4px;">${i.value}</div>
      <div style="font-size:14px;color:${o.labelColor||'#666'};">${i.label}</div></div>`).join('')}</div></section>`;
  },
};

export class PageBuilder {
  constructor(data = null) {
    this.sections = data?.sections || [];
    this.cssRules = data?.cssRules || [];
  }

  toJSON() { return { sections: this.sections, cssRules: this.cssRules }; }

  clearPage() { this.sections = []; this.cssRules = []; return { ok: true }; }

  addSection(type, options = {}) {
    const fn = TEMPLATES[type];
    if (!fn) return { ok: false, error: `Unknown section: "${type}". Available: ${Object.keys(TEMPLATES).join(', ')}` };
    this.sections.push(fn(options));
    return { ok: true, data: { index: this.sections.length - 1 } };
  }

  addHTML(html) {
    if (!html) return { ok: false, error: 'Missing html' };
    this.sections.push(html);
    return { ok: true, data: { index: this.sections.length - 1 } };
  }

  addCSSRule(selector, styles) {
    if (!selector || !styles) return { ok: false, error: 'Missing selector or styles' };
    const decls = Object.entries(styles).map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}:${v}`).join(';');
    this.cssRules.push(`${selector}{${decls}}`);
    return { ok: true };
  }

  removeSection(index) {
    if (index < 0 || index >= this.sections.length) return { ok: false, error: 'Invalid index' };
    this.sections.splice(index, 1);
    return { ok: true };
  }

  getHTML() { return { ok: true, data: this.sections.join('\n') }; }
  getCSS() { return { ok: true, data: this.cssRules.join('\n') }; }

  getFullPage(options = {}) {
    const title = options.title || 'Untitled Page';
    const lang = options.lang || 'en';
    const font = options.font || "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif";
    return { ok: true, data: `<!DOCTYPE html>\n<html lang="${lang}">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width,initial-scale=1.0">\n<title>${title}</title>\n<style>\n*{margin:0;padding:0;box-sizing:border-box}\nbody{font-family:${font}}\nimg{max-width:100%;height:auto}\na{transition:opacity .2s}\na:hover{opacity:.85}\n${this.cssRules.join('\n')}\n</style>\n</head>\n<body>\n${this.sections.join('\n')}\n</body>\n</html>` };
  }

  getPageInfo() { return { ok: true, data: { sectionCount: this.sections.length, cssRuleCount: this.cssRules.length } }; }

  getAvailableSections() {
    return { ok: true, data: Object.keys(TEMPLATES).map(id => ({ id, description: { hero:'Hero banner', features:'Feature cards grid', cta:'Call to action', testimonials:'Quote cards', pricing:'Pricing plans', footer:'Page footer', contact:'Contact form', faq:'FAQ list', navbar:'Navigation bar', stats:'Stats counters' }[id] })) };
  }

  buildLandingPage(config = {}) {
    this.clearPage();
    if (config.navbar !== false) this.addSection('navbar', config.navbar || {});
    if (config.hero !== false) this.addSection('hero', config.hero || {});
    if (config.features) this.addSection('features', config.features);
    if (config.stats) this.addSection('stats', config.stats);
    if (config.testimonials) this.addSection('testimonials', config.testimonials);
    if (config.pricing) this.addSection('pricing', config.pricing);
    if (config.cta) this.addSection('cta', config.cta);
    if (config.faq) this.addSection('faq', config.faq);
    if (config.contact) this.addSection('contact', config.contact);
    if (config.footer !== false) this.addSection('footer', config.footer || {});
    return this.getFullPage({ title: config.title || 'Landing Page' });
  }

  execute(method, params = {}) {
    const methods = {
      clearPage: () => this.clearPage(),
      addSection: () => this.addSection(params.type, params.options || params),
      addHTML: () => this.addHTML(params.html),
      addCSSRule: () => this.addCSSRule(params.selector, params.styles),
      removeSection: () => this.removeSection(params.index),
      getHTML: () => this.getHTML(),
      getCSS: () => this.getCSS(),
      getFullPage: () => this.getFullPage(params),
      getPageInfo: () => this.getPageInfo(),
      getAvailableSections: () => this.getAvailableSections(),
      buildLandingPage: () => this.buildLandingPage(params),
    };
    const fn = methods[method];
    if (!fn) return { ok: false, error: `Unknown method: "${method}". Available: ${Object.keys(methods).join(', ')}` };
    try { return fn(); } catch (e) { return { ok: false, error: e.message }; }
  }
}
