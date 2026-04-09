/**
 * Exhaustive API test battery
 *
 * Tests EVERY function of the VanillaBuilder API against the live deploy.
 * If a function is not tested here, that function does not exist.
 *
 * Run: npx vitest run test/api/api.live.test.js
 *
 * Requires: vanillabuilder.pages.dev to be deployed and online
 */

import { describe, it, expect } from 'vitest';

const API = 'https://vanillabuilder.pages.dev';

// Helper: POST to /api/execute
async function exec(method, params = {}) {
  const res = await fetch(`${API}/api/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ method, params }),
  });
  return res.json();
}

// Helper: POST to /api/batch
async function batch(actions) {
  const res = await fetch(`${API}/api/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actions }),
  });
  return res.json();
}

// ═══════════════════════════════════════════════════════════════
// ENDPOINT: GET /api/health
// ═══════════════════════════════════════════════════════════════

describe('GET /api/health', () => {
  it('returns ok:true with version', async () => {
    const res = await fetch(`${API}/api/health`);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.version).toBe('0.1.0');
    expect(data.service).toBe('vanillabuilder');
  });
});

// ═══════════════════════════════════════════════════════════════
// ENDPOINT: GET /api/schemas
// ═══════════════════════════════════════════════════════════════

describe('GET /api/schemas', () => {
  it('returns tool definitions in anthropic format by default', async () => {
    const res = await fetch(`${API}/api/schemas`);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data.length).toBe(11);
    // Anthropic format has input_schema
    expect(data.data[0]).toHaveProperty('name');
    expect(data.data[0]).toHaveProperty('input_schema');
  });

  it('returns openai format when requested', async () => {
    const res = await fetch(`${API}/api/schemas?format=openai`);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.data[0].type).toBe('function');
    expect(data.data[0].function).toHaveProperty('name');
    expect(data.data[0].function).toHaveProperty('parameters');
  });

  it('returns generic format', async () => {
    const res = await fetch(`${API}/api/schemas?format=generic`);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.data[0]).toHaveProperty('name');
    expect(data.data[0]).toHaveProperty('parameters');
  });

  it('lists all 11 methods', async () => {
    const res = await fetch(`${API}/api/schemas`);
    const data = await res.json();
    const names = data.data.map(t => t.name);
    expect(names).toContain('clearPage');
    expect(names).toContain('addSection');
    expect(names).toContain('addHTML');
    expect(names).toContain('addCSSRule');
    expect(names).toContain('removeSection');
    expect(names).toContain('getHTML');
    expect(names).toContain('getCSS');
    expect(names).toContain('getFullPage');
    expect(names).toContain('getPageInfo');
    expect(names).toContain('getAvailableSections');
    expect(names).toContain('buildLandingPage');
  });
});

// ═══════════════════════════════════════════════════════════════
// ENDPOINT: POST /api/execute — error handling
// ═══════════════════════════════════════════════════════════════

describe('POST /api/execute — error handling', () => {
  it('returns error when method is missing', async () => {
    const res = await fetch(`${API}/api/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.ok).toBe(false);
    expect(data.error).toContain('Missing');
  });

  it('returns error for unknown method', async () => {
    const d = await exec('nonExistentMethod');
    expect(d.ok).toBe(false);
    expect(d.error).toContain('Unknown method');
  });
});

// ═══════════════════════════════════════════════════════════════
// FUNCTION 1: clearPage
// ═══════════════════════════════════════════════════════════════

describe('clearPage', () => {
  it('returns ok:true', async () => {
    const d = await exec('clearPage');
    expect(d.ok).toBe(true);
  });

  it('results in empty HTML after clear', async () => {
    const r = await batch([
      { method: 'addHTML', params: { html: '<p>test</p>' } },
      { method: 'clearPage' },
      { method: 'getHTML' },
    ]);
    expect(r.ok).toBe(true);
    const html = r.results[2].data;
    expect(html).toBe('');
  });
});

// ═══════════════════════════════════════════════════════════════
// FUNCTION 2: addSection — all 10 types
// ═══════════════════════════════════════════════════════════════

describe('addSection', () => {
  it('adds hero section', async () => {
    const r = await batch([
      { method: 'clearPage' },
      { method: 'addSection', params: { type: 'hero', options: { headline: 'Test Hero' } } },
      { method: 'getHTML' },
    ]);
    expect(r.results[1].ok).toBe(true);
    expect(r.results[2].data).toContain('Test Hero');
  });

  it('adds features section with custom items', async () => {
    const r = await batch([
      { method: 'clearPage' },
      { method: 'addSection', params: { type: 'features', options: { heading: 'Features', items: [{ icon: 'X', title: 'Speed', description: 'Very fast' }] } } },
      { method: 'getHTML' },
    ]);
    expect(r.results[1].ok).toBe(true);
    expect(r.results[2].data).toContain('Speed');
    expect(r.results[2].data).toContain('Very fast');
  });

  it('adds cta section', async () => {
    const r = await batch([
      { method: 'clearPage' },
      { method: 'addSection', params: { type: 'cta', options: { headline: 'Join Now', buttonText: 'Go' } } },
      { method: 'getHTML' },
    ]);
    expect(r.results[1].ok).toBe(true);
    expect(r.results[2].data).toContain('Join Now');
    expect(r.results[2].data).toContain('Go');
  });

  it('adds testimonials section', async () => {
    const r = await batch([
      { method: 'clearPage' },
      { method: 'addSection', params: { type: 'testimonials', options: { items: [{ quote: 'Great product', author: 'Alice', role: 'Dev' }] } } },
      { method: 'getHTML' },
    ]);
    expect(r.results[1].ok).toBe(true);
    expect(r.results[2].data).toContain('Great product');
    expect(r.results[2].data).toContain('Alice');
  });

  it('adds pricing section with plans', async () => {
    const r = await batch([
      { method: 'clearPage' },
      { method: 'addSection', params: { type: 'pricing', options: { plans: [{ name: 'Basic', price: '$5', features: ['1 user'] }] } } },
      { method: 'getHTML' },
    ]);
    expect(r.results[1].ok).toBe(true);
    expect(r.results[2].data).toContain('Basic');
    expect(r.results[2].data).toContain('$5');
  });

  it('adds footer section', async () => {
    const r = await batch([
      { method: 'clearPage' },
      { method: 'addSection', params: { type: 'footer', options: { copyright: '2026 Test' } } },
      { method: 'getHTML' },
    ]);
    expect(r.results[1].ok).toBe(true);
    expect(r.results[2].data).toContain('2026 Test');
  });

  it('adds contact section', async () => {
    const r = await batch([
      { method: 'clearPage' },
      { method: 'addSection', params: { type: 'contact', options: { heading: 'Contact Us', buttonText: 'Send' } } },
      { method: 'getHTML' },
    ]);
    expect(r.results[1].ok).toBe(true);
    expect(r.results[2].data).toContain('Contact Us');
    expect(r.results[2].data).toContain('Send');
  });

  it('adds faq section', async () => {
    const r = await batch([
      { method: 'clearPage' },
      { method: 'addSection', params: { type: 'faq', options: { heading: 'FAQ', items: [{ question: 'Why?', answer: 'Because.' }] } } },
      { method: 'getHTML' },
    ]);
    expect(r.results[1].ok).toBe(true);
    expect(r.results[2].data).toContain('Why?');
    expect(r.results[2].data).toContain('Because.');
  });

  it('adds navbar section', async () => {
    const r = await batch([
      { method: 'clearPage' },
      { method: 'addSection', params: { type: 'navbar', options: { brand: 'MyApp', ctaText: 'Login' } } },
      { method: 'getHTML' },
    ]);
    expect(r.results[1].ok).toBe(true);
    expect(r.results[2].data).toContain('MyApp');
    expect(r.results[2].data).toContain('Login');
  });

  it('adds stats section', async () => {
    const r = await batch([
      { method: 'clearPage' },
      { method: 'addSection', params: { type: 'stats', options: { items: [{ value: '99%', label: 'Uptime' }] } } },
      { method: 'getHTML' },
    ]);
    expect(r.results[1].ok).toBe(true);
    expect(r.results[2].data).toContain('99%');
    expect(r.results[2].data).toContain('Uptime');
  });

  it('returns error for unknown section type', async () => {
    const d = await exec('addSection', { type: 'nonexistent' });
    expect(d.ok).toBe(false);
    expect(d.error).toContain('Unknown section');
  });
});

// ═══════════════════════════════════════════════════════════════
// FUNCTION 3: addHTML
// ═══════════════════════════════════════════════════════════════

describe('addHTML', () => {
  it('adds raw HTML to the page', async () => {
    const r = await batch([
      { method: 'clearPage' },
      { method: 'addHTML', params: { html: '<div class="custom">Hello</div>' } },
      { method: 'getHTML' },
    ]);
    expect(r.results[1].ok).toBe(true);
    expect(r.results[2].data).toContain('Hello');
  });

  it('returns error when html is missing', async () => {
    const d = await exec('addHTML', {});
    expect(d.ok).toBe(false);
    expect(d.error).toContain('Missing');
  });
});

// ═══════════════════════════════════════════════════════════════
// FUNCTION 4: addCSSRule
// ═══════════════════════════════════════════════════════════════

describe('addCSSRule', () => {
  it('adds a CSS rule', async () => {
    const r = await batch([
      { method: 'clearPage' },
      { method: 'addCSSRule', params: { selector: '.hero', styles: { color: 'red', padding: '20px' } } },
      { method: 'getCSS' },
    ]);
    expect(r.results[1].ok).toBe(true);
    expect(r.results[2].data).toContain('.hero');
    expect(r.results[2].data).toContain('color:red');
  });

  it('returns error when selector is missing', async () => {
    const d = await exec('addCSSRule', { styles: { color: 'red' } });
    expect(d.ok).toBe(false);
  });

  it('returns error when styles is missing', async () => {
    const d = await exec('addCSSRule', { selector: '.test' });
    expect(d.ok).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════
// FUNCTION 5: removeSection
// ═══════════════════════════════════════════════════════════════

describe('removeSection', () => {
  it('removes a section by index', async () => {
    const r = await batch([
      { method: 'clearPage' },
      { method: 'addHTML', params: { html: '<p>First</p>' } },
      { method: 'addHTML', params: { html: '<p>Second</p>' } },
      { method: 'removeSection', params: { index: 0 } },
      { method: 'getHTML' },
    ]);
    expect(r.results[3].ok).toBe(true);
    expect(r.results[4].data).not.toContain('First');
    expect(r.results[4].data).toContain('Second');
  });

  it('returns error for invalid index', async () => {
    const r = await batch([
      { method: 'clearPage' },
      { method: 'removeSection', params: { index: 99 } },
    ]);
    expect(r.results[1].ok).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════
// FUNCTION 6: getHTML
// ═══════════════════════════════════════════════════════════════

describe('getHTML', () => {
  it('returns empty string for empty page', async () => {
    const r = await batch([
      { method: 'clearPage' },
      { method: 'getHTML' },
    ]);
    expect(r.results[1].ok).toBe(true);
    expect(r.results[1].data).toBe('');
  });

  it('returns HTML body content after adding sections', async () => {
    const r = await batch([
      { method: 'clearPage' },
      { method: 'addSection', params: { type: 'hero', options: { headline: 'Check' } } },
      { method: 'getHTML' },
    ]);
    expect(r.results[2].ok).toBe(true);
    expect(r.results[2].data).toContain('Check');
    expect(typeof r.results[2].data).toBe('string');
  });
});

// ═══════════════════════════════════════════════════════════════
// FUNCTION 7: getCSS
// ═══════════════════════════════════════════════════════════════

describe('getCSS', () => {
  it('returns empty string when no rules', async () => {
    const r = await batch([
      { method: 'clearPage' },
      { method: 'getCSS' },
    ]);
    expect(r.results[1].ok).toBe(true);
    expect(r.results[1].data).toBe('');
  });

  it('returns CSS rules after adding them', async () => {
    const r = await batch([
      { method: 'clearPage' },
      { method: 'addCSSRule', params: { selector: 'body', styles: { margin: '0' } } },
      { method: 'getCSS' },
    ]);
    expect(r.results[2].ok).toBe(true);
    expect(r.results[2].data).toContain('body');
    expect(r.results[2].data).toContain('margin:0');
  });
});

// ═══════════════════════════════════════════════════════════════
// FUNCTION 8: getFullPage
// ═══════════════════════════════════════════════════════════════

describe('getFullPage', () => {
  it('returns complete HTML document with DOCTYPE', async () => {
    const r = await batch([
      { method: 'clearPage' },
      { method: 'addSection', params: { type: 'hero', options: { headline: 'Full' } } },
      { method: 'getFullPage', params: { title: 'My Page' } },
    ]);
    const html = r.results[2].data;
    expect(r.results[2].ok).toBe(true);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<title>My Page</title>');
    expect(html).toContain('<body>');
    expect(html).toContain('Full');
    expect(html).toContain('</html>');
  });

  it('includes CSS rules in the page', async () => {
    const r = await batch([
      { method: 'clearPage' },
      { method: 'addCSSRule', params: { selector: '.test', styles: { color: 'blue' } } },
      { method: 'addSection', params: { type: 'hero' } },
      { method: 'getFullPage' },
    ]);
    expect(r.results[3].data).toContain('.test{color:blue}');
  });

  it('uses default title when not specified', async () => {
    const r = await batch([
      { method: 'clearPage' },
      { method: 'getFullPage' },
    ]);
    expect(r.results[1].data).toContain('<title>Untitled Page</title>');
  });
});

// ═══════════════════════════════════════════════════════════════
// FUNCTION 9: getPageInfo
// ═══════════════════════════════════════════════════════════════

describe('getPageInfo', () => {
  it('returns section and rule counts', async () => {
    const r = await batch([
      { method: 'clearPage' },
      { method: 'addSection', params: { type: 'hero' } },
      { method: 'addSection', params: { type: 'footer' } },
      { method: 'addCSSRule', params: { selector: '.x', styles: { color: 'red' } } },
      { method: 'getPageInfo' },
    ]);
    expect(r.results[4].ok).toBe(true);
    expect(r.results[4].data.sectionCount).toBe(2);
    expect(r.results[4].data.cssRuleCount).toBe(1);
  });

  it('returns zero counts for empty page', async () => {
    const r = await batch([
      { method: 'clearPage' },
      { method: 'getPageInfo' },
    ]);
    expect(r.results[1].data.sectionCount).toBe(0);
    expect(r.results[1].data.cssRuleCount).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════
// FUNCTION 10: getAvailableSections
// ═══════════════════════════════════════════════════════════════

describe('getAvailableSections', () => {
  it('returns all 10 section types', async () => {
    const d = await exec('getAvailableSections');
    expect(d.ok).toBe(true);
    expect(d.data.length).toBe(10);
    const ids = d.data.map(s => s.id);
    expect(ids).toContain('hero');
    expect(ids).toContain('features');
    expect(ids).toContain('cta');
    expect(ids).toContain('testimonials');
    expect(ids).toContain('pricing');
    expect(ids).toContain('footer');
    expect(ids).toContain('contact');
    expect(ids).toContain('faq');
    expect(ids).toContain('navbar');
    expect(ids).toContain('stats');
  });

  it('each section has id and description', async () => {
    const d = await exec('getAvailableSections');
    for (const section of d.data) {
      expect(section).toHaveProperty('id');
      expect(section).toHaveProperty('description');
      expect(typeof section.description).toBe('string');
      expect(section.description.length).toBeGreaterThan(0);
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// FUNCTION 11: buildLandingPage
// ═══════════════════════════════════════════════════════════════

describe('buildLandingPage', () => {
  it('builds a complete landing page with all sections', async () => {
    const d = await exec('buildLandingPage', {
      title: 'TestLanding',
      navbar: { brand: 'Brand', ctaText: 'CTA' },
      hero: { headline: 'Hero Title', buttonText: 'Click' },
      features: { heading: 'Feats', items: [{ title: 'F1', description: 'D1' }] },
      stats: { items: [{ value: '100', label: 'Users' }] },
      testimonials: { items: [{ quote: 'Nice', author: 'Bob' }] },
      pricing: { plans: [{ name: 'Plan1', price: '$1', features: ['x'] }] },
      cta: { headline: 'Act Now' },
      faq: { items: [{ question: 'Q?', answer: 'A.' }] },
      contact: { heading: 'Reach Us' },
      footer: { copyright: '2026' },
    });
    expect(d.ok).toBe(true);
    const html = d.data;
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<title>TestLanding</title>');
    expect(html).toContain('Brand');
    expect(html).toContain('Hero Title');
    expect(html).toContain('F1');
    expect(html).toContain('100');
    expect(html).toContain('Nice');
    expect(html).toContain('Plan1');
    expect(html).toContain('Act Now');
    expect(html).toContain('Q?');
    expect(html).toContain('Reach Us');
    expect(html).toContain('2026');
  });

  it('works with minimal config', async () => {
    const d = await exec('buildLandingPage', { title: 'Minimal' });
    expect(d.ok).toBe(true);
    expect(d.data).toContain('<!DOCTYPE html>');
    expect(d.data).toContain('Minimal');
  });

  it('skips sections set to false', async () => {
    const d = await exec('buildLandingPage', {
      navbar: false,
      hero: false,
      footer: false,
    });
    expect(d.ok).toBe(true);
    // Should have no content since all default sections disabled and no extras provided
    expect(d.data).toContain('<body>');
  });
});

// ═══════════════════════════════════════════════════════════════
// ENDPOINT: POST /api/batch
// ═══════════════════════════════════════════════════════════════

describe('POST /api/batch', () => {
  it('executes multiple actions in sequence', async () => {
    const r = await batch([
      { method: 'clearPage' },
      { method: 'addSection', params: { type: 'hero', options: { headline: 'A' } } },
      { method: 'addSection', params: { type: 'footer', options: { copyright: 'B' } } },
      { method: 'getHTML' },
    ]);
    expect(r.ok).toBe(true);
    expect(r.results.length).toBe(4);
    expect(r.results[0].ok).toBe(true);
    expect(r.results[1].ok).toBe(true);
    expect(r.results[2].ok).toBe(true);
    expect(r.results[3].data).toContain('A');
    expect(r.results[3].data).toContain('B');
  });

  it('returns sessionId', async () => {
    const r = await batch([{ method: 'clearPage' }]);
    expect(r.sessionId).toBeDefined();
  });

  it('returns error when actions is missing', async () => {
    const res = await fetch(`${API}/api/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const d = await res.json();
    expect(d.ok).toBe(false);
    expect(d.error).toContain('actions');
  });

  it('handles errors in individual actions gracefully', async () => {
    const r = await batch([
      { method: 'clearPage' },
      { method: 'addSection', params: { type: 'INVALID' } },
      { method: 'getHTML' },
    ]);
    expect(r.ok).toBe(true);
    expect(r.results[1].ok).toBe(false);
    expect(r.results[2].ok).toBe(true); // continues after error
  });
});

// ═══════════════════════════════════════════════════════════════
// INTEGRATION: Full workflow
// ═══════════════════════════════════════════════════════════════

describe('Integration: full page build workflow', () => {
  it('clears, builds, queries, exports', async () => {
    const r = await batch([
      { method: 'clearPage' },
      { method: 'addSection', params: { type: 'navbar', options: { brand: 'IntTest' } } },
      { method: 'addSection', params: { type: 'hero', options: { headline: 'Integration' } } },
      { method: 'addHTML', params: { html: '<p>Custom</p>' } },
      { method: 'addCSSRule', params: { selector: 'p', styles: { color: 'green' } } },
      { method: 'getPageInfo' },
      { method: 'getHTML' },
      { method: 'getCSS' },
      { method: 'getFullPage', params: { title: 'IntTest' } },
    ]);

    expect(r.ok).toBe(true);

    // All actions succeeded
    for (let i = 0; i < r.results.length; i++) {
      expect(r.results[i].ok).toBe(true);
    }

    // Page info
    expect(r.results[5].data.sectionCount).toBe(3);
    expect(r.results[5].data.cssRuleCount).toBe(1);

    // HTML has all content
    const html = r.results[6].data;
    expect(html).toContain('IntTest');
    expect(html).toContain('Integration');
    expect(html).toContain('Custom');

    // CSS has the rule
    expect(r.results[7].data).toContain('p{color:green}');

    // Full page has everything
    const page = r.results[8].data;
    expect(page).toContain('<!DOCTYPE html>');
    expect(page).toContain('<title>IntTest</title>');
    expect(page).toContain('Integration');
    expect(page).toContain('Custom');
    expect(page).toContain('p{color:green}');
  });
});
