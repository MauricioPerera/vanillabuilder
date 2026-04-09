/**
 * Standalone page builder for Cloudflare Pages Functions
 * No DOM dependency — pure string generation
 * Supports Design System / Theme for consistent styling
 */

// ── Default Theme ──

const DEFAULT_THEME = {
  colors: {
    primary: '#7c3aed',
    primaryLight: '#a78bfa',
    primaryDark: '#6d28d9',
    secondary: '#059669',
    accent: '#f59e0b',
    background: '#ffffff',
    surface: '#f8f9fa',
    surfaceDark: '#1a1a2e',
    text: '#333333',
    textMuted: '#666666',
    textLight: '#ffffff',
    border: '#e2e8f0',
  },
  fonts: {
    heading: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
    body: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
  },
  sizes: {
    headingLg: '48px',
    headingMd: '32px',
    headingSm: '20px',
    body: '16px',
    small: '14px',
    tiny: '12px',
  },
  spacing: {
    sectionY: '60px',
    sectionX: '20px',
    cardPadding: '24px',
    gap: '24px',
  },
  borderRadius: '8px',
  maxWidth: '960px',
};

function mergeTheme(custom = {}) {
  const t = JSON.parse(JSON.stringify(DEFAULT_THEME));
  for (const key of Object.keys(custom)) {
    if (typeof custom[key] === 'object' && typeof t[key] === 'object') {
      Object.assign(t[key], custom[key]);
    } else {
      t[key] = custom[key];
    }
  }
  return t;
}

function themeToCSS(t) {
  return `:root{
--c-primary:${t.colors.primary};--c-primary-light:${t.colors.primaryLight};--c-primary-dark:${t.colors.primaryDark};
--c-secondary:${t.colors.secondary};--c-accent:${t.colors.accent};
--c-bg:${t.colors.background};--c-surface:${t.colors.surface};--c-surface-dark:${t.colors.surfaceDark};
--c-text:${t.colors.text};--c-text-muted:${t.colors.textMuted};--c-text-light:${t.colors.textLight};--c-border:${t.colors.border};
--f-heading:${t.fonts.heading};--f-body:${t.fonts.body};
--fs-h1:${t.sizes.headingLg};--fs-h2:${t.sizes.headingMd};--fs-h3:${t.sizes.headingSm};--fs-body:${t.sizes.body};--fs-sm:${t.sizes.small};--fs-xs:${t.sizes.tiny};
--sp-section-y:${t.spacing.sectionY};--sp-section-x:${t.spacing.sectionX};--sp-card:${t.spacing.cardPadding};--sp-gap:${t.spacing.gap};
--radius:${t.borderRadius};--max-w:${t.maxWidth};
}`;
}

// ── Section Templates (use CSS variables) ──

const T = {
  hero: (o = {}) => `<section style="padding:var(--sp-section-y) var(--sp-section-x);text-align:center;background:${o.background||'linear-gradient(135deg,var(--c-primary) 0%,var(--c-primary-light) 100%)'};color:var(--c-text-light);">
  <h1 style="font-family:var(--f-heading);font-size:var(--fs-h1);font-weight:800;margin-bottom:16px;">${o.headline||'Your Headline Here'}</h1>
  <p style="font-size:${o.subSize||'20px'};opacity:0.9;max-width:600px;margin:0 auto ${o.buttonText?'32px':'0'};font-family:var(--f-body);">${o.subheadline||'A brief description of your product or service.'}</p>
  ${o.buttonText?`<a href="${o.buttonUrl||'#'}" style="display:inline-block;padding:14px 36px;background:var(--c-bg);color:var(--c-primary);border-radius:var(--radius);text-decoration:none;font-weight:700;font-size:var(--fs-body);">${o.buttonText}</a>`:''}</section>`,

  features: (o = {}) => {
    const items = o.items || [
      { icon: '&#9889;', title: 'Feature One', description: 'Description goes here.' },
      { icon: '&#128640;', title: 'Feature Two', description: 'Description goes here.' },
      { icon: '&#128161;', title: 'Feature Three', description: 'Description goes here.' },
    ];
    return `<section style="padding:var(--sp-section-y) var(--sp-section-x);max-width:var(--max-w);margin:0 auto;">
    ${o.heading?`<h2 style="text-align:center;font-family:var(--f-heading);font-size:var(--fs-h2);margin-bottom:40px;color:var(--c-text);">${o.heading}</h2>`:''}
    <div style="display:flex;gap:var(--sp-gap);flex-wrap:wrap;">${items.map(i => `<div style="flex:1;min-width:250px;padding:var(--sp-card);background:var(--c-surface);border-radius:var(--radius);text-align:center;">
    <div style="font-size:36px;margin-bottom:12px;">${i.icon||'&#10024;'}</div>
    <h3 style="margin-bottom:8px;color:var(--c-text);font-family:var(--f-heading);font-size:var(--fs-h3);">${i.title}</h3>
    <p style="color:var(--c-text-muted);font-size:var(--fs-sm);line-height:1.6;font-family:var(--f-body);">${i.description}</p></div>`).join('')}</div></section>`;
  },

  cta: (o = {}) => `<section style="padding:var(--sp-section-y) var(--sp-section-x);background:${o.background||'var(--c-primary)'};text-align:center;color:var(--c-text-light);">
  <h2 style="font-family:var(--f-heading);font-size:var(--fs-h2);font-weight:700;margin-bottom:16px;">${o.headline||'Ready to get started?'}</h2>
  <p style="font-size:18px;opacity:0.9;margin-bottom:28px;font-family:var(--f-body);">${o.subheadline||'Join thousands of happy customers today.'}</p>
  <a href="${o.buttonUrl||'#'}" style="display:inline-block;padding:14px 36px;background:var(--c-bg);color:var(--c-primary);border-radius:var(--radius);text-decoration:none;font-weight:700;font-size:var(--fs-body);">${o.buttonText||'Sign Up Free'}</a></section>`,

  testimonials: (o = {}) => {
    const items = o.items || [{ quote: 'Amazing product.', author: 'Jane Doe', role: 'CEO' }];
    return `<section style="padding:var(--sp-section-y) var(--sp-section-x);max-width:var(--max-w);margin:0 auto;">
    ${o.heading?`<h2 style="text-align:center;font-family:var(--f-heading);font-size:var(--fs-h2);margin-bottom:40px;color:var(--c-text);">${o.heading}</h2>`:''}
    <div style="display:flex;gap:var(--sp-gap);flex-wrap:wrap;">${items.map(i => `<div style="flex:1;min-width:300px;padding:32px;background:var(--c-surface);border-radius:calc(var(--radius) * 1.5);">
    <p style="font-size:var(--fs-body);font-style:italic;color:var(--c-text);line-height:1.6;margin-bottom:16px;font-family:var(--f-body);">"${i.quote}"</p>
    <div><strong style="color:var(--c-text);">${i.author}</strong><br/><span style="font-size:var(--fs-xs);color:var(--c-text-muted);">${i.role||''}</span></div></div>`).join('')}</div></section>`;
  },

  pricing: (o = {}) => {
    const plans = o.plans || [
      { name: 'Starter', price: '$9', period: '/mo', features: ['5 Projects', 'Basic Support'] },
      { name: 'Pro', price: '$29', period: '/mo', features: ['Unlimited', 'Priority Support'], popular: true },
    ];
    return `<section style="padding:var(--sp-section-y) var(--sp-section-x);background:var(--c-surface);">
    ${o.heading?`<h2 style="text-align:center;font-family:var(--f-heading);font-size:var(--fs-h2);margin-bottom:40px;color:var(--c-text);">${o.heading}</h2>`:''}
    <div style="display:flex;gap:var(--sp-gap);justify-content:center;flex-wrap:wrap;max-width:var(--max-w);margin:0 auto;">${plans.map(p => `<div style="flex:1;min-width:260px;max-width:300px;padding:32px;background:var(--c-bg);border-radius:calc(var(--radius) * 1.5);text-align:center;border:${p.popular?'2px solid var(--c-primary)':'1px solid var(--c-border)'};position:relative;">
    ${p.popular?'<div style="position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:var(--c-primary);color:var(--c-text-light);padding:4px 16px;border-radius:12px;font-size:var(--fs-xs);font-weight:600;">Popular</div>':''}
    <h3 style="font-size:var(--fs-h3);color:var(--c-text);margin-bottom:8px;font-family:var(--f-heading);">${p.name}</h3>
    <div style="font-size:42px;font-weight:800;color:var(--c-text);margin:16px 0;">${p.price}<span style="font-size:var(--fs-body);color:var(--c-text-muted);font-weight:400;">${p.period||'/mo'}</span></div>
    <ul style="list-style:none;padding:0;margin:0 0 24px;text-align:left;">${p.features.map(f=>`<li style="padding:8px 0;border-bottom:1px solid var(--c-surface);color:var(--c-text);font-size:var(--fs-sm);">&#10003; ${f}</li>`).join('')}</ul>
    <a href="${p.buttonUrl||'#'}" style="display:block;padding:12px;background:var(--c-primary);color:var(--c-text-light);border-radius:var(--radius);text-decoration:none;font-weight:600;font-size:var(--fs-sm);">${p.buttonText||'Choose Plan'}</a></div>`).join('')}</div></section>`;
  },

  footer: (o = {}) => {
    const cols = o.columns || [
      { title: 'Company', text: o.companyText || 'Building the future.' },
      { title: 'Links', links: o.links || [{ text: 'Home', url: '#' }, { text: 'About', url: '#' }, { text: 'Contact', url: '#' }] },
      { title: 'Legal', links: [{ text: 'Privacy', url: '#' }, { text: 'Terms', url: '#' }] },
    ];
    return `<footer style="padding:40px var(--sp-section-x);background:var(--c-surface-dark);color:var(--c-text-muted);font-family:var(--f-body);">
    <div style="display:flex;gap:40px;flex-wrap:wrap;max-width:var(--max-w);margin:0 auto 32px;">${cols.map(c => `<div style="flex:1;min-width:150px;">
    <h4 style="font-size:var(--fs-body);margin-bottom:12px;color:var(--c-text-light);font-family:var(--f-heading);">${c.title}</h4>
    ${c.text?`<p style="font-size:var(--fs-sm);color:var(--c-text-muted);line-height:1.8;">${c.text}</p>`:''}
    ${c.links?`<div style="display:flex;flex-direction:column;gap:8px;">${c.links.map(l=>`<a href="${l.url||'#'}" style="color:var(--c-text-muted);text-decoration:none;font-size:var(--fs-sm);">${l.text}</a>`).join('')}</div>`:''}</div>`).join('')}</div>
    <div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:20px;text-align:center;font-size:var(--fs-xs);color:var(--c-text-muted);">${o.copyright||'&copy; 2026 Company. All rights reserved.'}</div></footer>`;
  },

  contact: (o = {}) => `<section style="padding:var(--sp-section-y) var(--sp-section-x);max-width:${o.maxWidth||'500px'};margin:0 auto;">
  ${o.heading?`<h2 style="text-align:center;font-family:var(--f-heading);font-size:var(--fs-h2);margin-bottom:32px;color:var(--c-text);">${o.heading}</h2>`:''}
  <form style="display:flex;flex-direction:column;gap:16px;font-family:var(--f-body);">
    <input type="text" placeholder="${o.namePlaceholder||'Your name'}" style="padding:12px;border:1px solid var(--c-border);border-radius:var(--radius);font-size:var(--fs-sm);"/>
    <input type="email" placeholder="${o.emailPlaceholder||'you@example.com'}" style="padding:12px;border:1px solid var(--c-border);border-radius:var(--radius);font-size:var(--fs-sm);"/>
    <textarea rows="${o.rows||4}" placeholder="${o.messagePlaceholder||'Your message'}" style="padding:12px;border:1px solid var(--c-border);border-radius:var(--radius);font-size:var(--fs-sm);resize:vertical;"></textarea>
    <button type="submit" style="padding:12px 24px;background:var(--c-primary);color:var(--c-text-light);border:none;border-radius:var(--radius);font-size:var(--fs-body);font-weight:600;cursor:pointer;">${o.buttonText||'Send Message'}</button></form></section>`,

  faq: (o = {}) => {
    const items = o.items || [{ question: 'Question?', answer: 'Answer.' }];
    return `<section style="padding:var(--sp-section-y) var(--sp-section-x);max-width:700px;margin:0 auto;font-family:var(--f-body);">
    ${o.heading?`<h2 style="text-align:center;font-family:var(--f-heading);font-size:var(--fs-h2);margin-bottom:40px;color:var(--c-text);">${o.heading}</h2>`:''}${items.map(i => `<div style="border-bottom:1px solid var(--c-border);padding:16px 0;">
    <h4 style="font-size:var(--fs-body);color:var(--c-text);margin-bottom:8px;font-family:var(--f-heading);">${i.question}</h4>
    <p style="font-size:var(--fs-sm);color:var(--c-text-muted);line-height:1.6;">${i.answer}</p></div>`).join('')}</section>`;
  },

  navbar: (o = {}) => {
    const links = o.links || [{ text: 'Home', url: '#' }, { text: 'About', url: '#' }, { text: 'Contact', url: '#' }];
    return `<nav style="display:flex;align-items:center;justify-content:space-between;padding:16px 24px;background:var(--c-bg);border-bottom:1px solid var(--c-border);font-family:var(--f-body);">
    <div style="font-size:var(--fs-h3);font-weight:700;color:var(--c-primary);font-family:var(--f-heading);">${o.brand||'Brand'}</div>
    <div style="display:flex;gap:24px;">${links.map(l => `<a href="${l.url||'#'}" style="color:var(--c-text);text-decoration:none;font-size:var(--fs-sm);font-weight:500;">${l.text}</a>`).join('')}</div>
    ${o.ctaText?`<a href="${o.ctaUrl||'#'}" style="padding:8px 20px;background:var(--c-primary);color:var(--c-text-light);border-radius:var(--radius);text-decoration:none;font-size:var(--fs-sm);font-weight:600;">${o.ctaText}</a>`:''}</nav>`;
  },

  stats: (o = {}) => {
    const items = o.items || [{ value: '10K+', label: 'Users' }, { value: '99.9%', label: 'Uptime' }, { value: '24/7', label: 'Support' }];
    return `<section style="padding:var(--sp-section-y) var(--sp-section-x);background:var(--c-surface);font-family:var(--f-body);">
    <div style="display:flex;gap:32px;flex-wrap:wrap;justify-content:center;max-width:800px;margin:0 auto;">${items.map(i => `<div style="flex:1;min-width:120px;text-align:center;">
    <div style="font-size:36px;font-weight:800;color:var(--c-primary);margin-bottom:4px;font-family:var(--f-heading);">${i.value}</div>
    <div style="font-size:var(--fs-sm);color:var(--c-text-muted);">${i.label}</div></div>`).join('')}</div></section>`;
  },
};

// ── PageBuilder ──

export class PageBuilder {
  constructor(data = null) {
    this.sections = data?.sections || [];
    this.cssRules = data?.cssRules || [];
    this.theme = data?.theme || null;
  }

  toJSON() { return { sections: this.sections, cssRules: this.cssRules, theme: this.theme }; }

  _t() { return this.theme ? mergeTheme(this.theme) : DEFAULT_THEME; }

  // ── Theme ──

  setTheme(themeConfig) {
    if (!themeConfig || typeof themeConfig !== 'object') return { ok: false, error: 'Missing theme config object' };
    this.theme = themeConfig;
    return { ok: true, data: this._t() };
  }

  getTheme() {
    return { ok: true, data: this._t() };
  }

  // ── Page ──

  clearPage() { this.sections = []; this.cssRules = []; return { ok: true }; }

  addSection(type, options = {}) {
    const fn = T[type];
    if (!fn) return { ok: false, error: `Unknown section: "${type}". Available: ${Object.keys(T).join(', ')}` };
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
    const t = this._t();
    const title = options.title || 'Untitled Page';
    const lang = options.lang || 'en';
    const css = this.cssRules.join('\n');
    const body = this.sections.join('\n');
    const themeCss = themeToCSS(t);

    return { ok: true, data: `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${title}</title>
<style>
${themeCss}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:var(--f-body);color:var(--c-text)}
img{max-width:100%;height:auto}
a{transition:opacity .2s}
a:hover{opacity:.85}
${css}
</style>
</head>
<body>
${body}
</body>
</html>` };
  }

  getPageInfo() {
    return { ok: true, data: {
      sectionCount: this.sections.length,
      cssRuleCount: this.cssRules.length,
      hasTheme: !!this.theme,
    }};
  }

  getAvailableSections() {
    return { ok: true, data: Object.keys(T).map(id => ({ id, description: { hero:'Hero banner', features:'Feature cards grid', cta:'Call to action', testimonials:'Quote cards', pricing:'Pricing plans', footer:'Page footer', contact:'Contact form', faq:'FAQ list', navbar:'Navigation bar', stats:'Stats counters' }[id] })) };
  }

  buildLandingPage(config = {}) {
    this.clearPage();
    if (config.theme) this.setTheme(config.theme);
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
      setTheme: () => this.setTheme(params),
      getTheme: () => this.getTheme(),
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
