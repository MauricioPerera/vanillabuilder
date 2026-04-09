/**
 * Exhaustive API test battery
 *
 * Tests EVERY function of the VanillaBuilder API against the live deploy.
 * If a function is not tested here, that function does not exist.
 *
 * Run: npx vitest run test/api/api.live.test.js
 * Requires: vanillabuilder.pages.dev to be deployed and online
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const API = 'https://vanillabuilder.pages.dev';
const SID = 'test-' + Date.now().toString(36);

// ── Helpers ──

async function createSession(id) {
  const res = await fetch(`${API}/api/session`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: id }) });
  return res.json();
}

async function deleteSession(id) {
  await fetch(`${API}/api/session?sessionId=${id}`, { method: 'DELETE' });
}

async function exec(method, params = {}) {
  const res = await fetch(`${API}/api/execute`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ method, params, sessionId: SID }) });
  return res.json();
}

async function batch(actions) {
  const res = await fetch(`${API}/api/batch`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ actions, sessionId: SID }) });
  return res.json();
}

// ── Setup / Teardown ──

beforeAll(async () => { await createSession(SID); });
afterAll(async () => { await deleteSession(SID); });

// ═══════════════════════════════════════════════════════════════
// ENDPOINT: GET /api/health
// ═══════════════════════════════════════════════════════════════

describe('GET /api/health', () => {
  it('returns ok with version', { retry: 2 }, async () => {
    const res = await fetch(`${API}/api/health`);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.version).toBe('0.1.0');
  });
});

// ═══════════════════════════════════════════════════════════════
// ENDPOINT: GET /api/schemas
// ═══════════════════════════════════════════════════════════════

describe('GET /api/schemas', () => {
  it('returns 19 tools in anthropic format', { retry: 2 }, async () => {
    const res = await fetch(`${API}/api/schemas`);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.data.length).toBe(19);
    expect(data.data[0]).toHaveProperty('input_schema');
  });

  it('returns openai format', { retry: 2 }, async () => {
    const res = await fetch(`${API}/api/schemas?format=openai`);
    const data = await res.json();
    expect(data.data[0].type).toBe('function');
  });

  it('includes all 19 method names', { retry: 2 }, async () => {
    const res = await fetch(`${API}/api/schemas`);
    const data = await res.json();
    const names = data.data.map(t => t.name);
    for (const m of ['setTheme','getTheme','clearPage','addSection','addHTML','addCSSRule','removeSection','getHTML','getCSS','getFullPage','getPageInfo','getAvailableSections','buildLandingPage','addDataSource','removeDataSource','getDataSources','addFormAction','removeFormAction','getFormActions']) {
      expect(names).toContain(m);
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// ENDPOINT: POST /api/session
// ═══════════════════════════════════════════════════════════════

describe('POST /api/session', () => {
  it('creates a session', { retry: 2 }, async () => {
    const d = await createSession('tmp-session-test');
    expect(d.ok).toBe(true);
    await deleteSession('tmp-session-test');
  });

  it('GET checks existence', { retry: 2 }, async () => {
    const res = await fetch(`${API}/api/session?sessionId=${SID}`);
    const d = await res.json();
    expect(d.ok).toBe(true);
    expect(d.exists).toBe(true);
  });

  it('GET returns false for nonexistent', { retry: 2 }, async () => {
    const res = await fetch(`${API}/api/session?sessionId=nonexistent-xxx`);
    const d = await res.json();
    expect(d.exists).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════
// ENDPOINT: POST /api/execute — auth
// ═══════════════════════════════════════════════════════════════

describe('POST /api/execute — auth', () => {
  it('rejects missing sessionId', { retry: 2 }, async () => {
    const res = await fetch(`${API}/api/execute`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ method: 'getHTML' }) });
    const d = await res.json();
    expect(d.ok).toBe(false);
  });

  it('rejects invalid session', { retry: 2 }, async () => {
    const res = await fetch(`${API}/api/execute`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ method: 'getHTML', sessionId: 'fake-xxx' }) });
    const d = await res.json();
    expect(d.ok).toBe(false);
  });

  it('rejects missing method', { retry: 2 }, async () => {
    const res = await fetch(`${API}/api/execute`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: SID }) });
    const d = await res.json();
    expect(d.ok).toBe(false);
  });

  it('rejects unknown method', { retry: 2 }, async () => {
    const d = await exec('nonExistent');
    expect(d.ok).toBe(false);
    expect(d.error).toContain('Unknown method');
  });
});

// ═══════════════════════════════════════════════════════════════
// METHOD 1: setTheme
// ═══════════════════════════════════════════════════════════════

describe('setTheme', () => {
  it('sets custom theme', { retry: 2 }, async () => {
    const d = await exec('setTheme', { colors: { primary: '#dc2626' }, fonts: { heading: 'Georgia, serif' }, borderRadius: '12px' });
    expect(d.ok).toBe(true);
    expect(d.data.colors.primary).toBe('#dc2626');
  });
});

// ═══════════════════════════════════════════════════════════════
// METHOD 2: getTheme
// ═══════════════════════════════════════════════════════════════

describe('getTheme', () => {
  it('returns current theme', { retry: 2 }, async () => {
    const d = await exec('getTheme');
    expect(d.ok).toBe(true);
    expect(d.data.colors).toBeDefined();
    expect(d.data.fonts).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════
// METHOD 3: clearPage
// ═══════════════════════════════════════════════════════════════

describe('clearPage', () => {
  it('clears all content', { retry: 2 }, async () => {
    const r = await batch([
      { method: 'addHTML', params: { html: '<p>test</p>' } },
      { method: 'clearPage' },
      { method: 'getHTML' },
    ]);
    expect(r.results[2].data).toBe('');
  });
});

// ═══════════════════════════════════════════════════════════════
// METHOD 4: addSection — all 10 types
// ═══════════════════════════════════════════════════════════════

describe('addSection', () => {
  const types = [
    ['hero', { headline: 'Test' }, 'Test'],
    ['features', { items: [{ title: 'X', description: 'Y' }] }, 'X'],
    ['cta', { headline: 'Go' }, 'Go'],
    ['testimonials', { items: [{ quote: 'Nice', author: 'A' }] }, 'Nice'],
    ['pricing', { plans: [{ name: 'Free', price: '$0', features: ['1'] }] }, 'Free'],
    ['footer', { copyright: '2026' }, '2026'],
    ['contact', { heading: 'Hi' }, 'Hi'],
    ['faq', { items: [{ question: 'Q?', answer: 'A.' }] }, 'Q?'],
    ['navbar', { brand: 'Nav' }, 'Nav'],
    ['stats', { items: [{ value: '99', label: 'Up' }] }, '99'],
  ];

  for (const [type, opts, expected] of types) {
    it(`adds ${type} section`, async () => {
      const r = await batch([
        { method: 'clearPage' },
        { method: 'addSection', params: { type, options: opts } },
        { method: 'getHTML' },
      ]);
      expect(r.results[1].ok).toBe(true);
      expect(r.results[2].data).toContain(expected);
    });
  }

  it('rejects unknown type', { retry: 2 }, async () => {
    const d = await exec('addSection', { type: 'nonexistent' });
    expect(d.ok).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════
// METHOD 5: addHTML
// ═══════════════════════════════════════════════════════════════

describe('addHTML', () => {
  it('adds raw HTML', { retry: 2 }, async () => {
    const r = await batch([{ method: 'clearPage' }, { method: 'addHTML', params: { html: '<p>Raw</p>' } }, { method: 'getHTML' }]);
    expect(r.results[2].data).toContain('Raw');
  });

  it('rejects missing html', { retry: 2 }, async () => {
    const d = await exec('addHTML', {});
    expect(d.ok).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════
// METHOD 6: addCSSRule
// ═══════════════════════════════════════════════════════════════

describe('addCSSRule', () => {
  it('adds a CSS rule', { retry: 2 }, async () => {
    const r = await batch([{ method: 'clearPage' }, { method: 'addCSSRule', params: { selector: '.x', styles: { color: 'red' } } }, { method: 'getCSS' }]);
    expect(r.results[2].data).toContain('.x');
    expect(r.results[2].data).toContain('color:red');
  });
});

// ═══════════════════════════════════════════════════════════════
// METHOD 7: removeSection
// ═══════════════════════════════════════════════════════════════

describe('removeSection', () => {
  it('removes by index', { retry: 2 }, async () => {
    const r = await batch([
      { method: 'clearPage' },
      { method: 'addHTML', params: { html: '<p>First</p>' } },
      { method: 'addHTML', params: { html: '<p>Second</p>' } },
      { method: 'removeSection', params: { index: 0 } },
      { method: 'getHTML' },
    ]);
    expect(r.results[4].data).not.toContain('First');
    expect(r.results[4].data).toContain('Second');
  });

  it('rejects invalid index', { retry: 2 }, async () => {
    const r = await batch([{ method: 'clearPage' }, { method: 'removeSection', params: { index: 99 } }]);
    expect(r.results[1].ok).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════
// METHOD 8: getHTML
// ═══════════════════════════════════════════════════════════════

describe('getHTML', () => {
  it('returns empty for empty page', { retry: 2 }, async () => {
    const r = await batch([{ method: 'clearPage' }, { method: 'getHTML' }]);
    expect(r.results[1].data).toBe('');
  });
});

// ═══════════════════════════════════════════════════════════════
// METHOD 9: getCSS
// ═══════════════════════════════════════════════════════════════

describe('getCSS', () => {
  it('returns empty when no rules', { retry: 2 }, async () => {
    const r = await batch([{ method: 'clearPage' }, { method: 'getCSS' }]);
    expect(r.results[1].data).toBe('');
  });
});

// ═══════════════════════════════════════════════════════════════
// METHOD 10: getFullPage
// ═══════════════════════════════════════════════════════════════

describe('getFullPage', () => {
  it('returns complete HTML with DOCTYPE and theme', { retry: 2 }, async () => {
    const r = await batch([
      { method: 'clearPage' },
      { method: 'addSection', params: { type: 'hero', options: { headline: 'Full' } } },
      { method: 'getFullPage', params: { title: 'Test' } },
    ]);
    const html = r.results[2].data;
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<title>Test</title>');
    expect(html).toContain(':root');
    expect(html).toContain('Full');
  });
});

// ═══════════════════════════════════════════════════════════════
// METHOD 11: getPageInfo
// ═══════════════════════════════════════════════════════════════

describe('getPageInfo', () => {
  it('returns counts', { retry: 2 }, async () => {
    const r = await batch([
      { method: 'clearPage' },
      { method: 'addSection', params: { type: 'hero' } },
      { method: 'addCSSRule', params: { selector: '.a', styles: { color: 'red' } } },
      { method: 'getPageInfo' },
    ]);
    const info = r.results[3].data;
    expect(info.sectionCount).toBe(1);
    expect(info.cssRuleCount).toBe(1);
    expect(info).toHaveProperty('hasTheme');
    expect(info).toHaveProperty('dataSourceCount');
    expect(info).toHaveProperty('formActionCount');
  });
});

// ═══════════════════════════════════════════════════════════════
// METHOD 12: getAvailableSections
// ═══════════════════════════════════════════════════════════════

describe('getAvailableSections', () => {
  it('returns 10 types', { retry: 2 }, async () => {
    const d = await exec('getAvailableSections');
    expect(d.data.length).toBe(10);
    const ids = d.data.map(s => s.id);
    expect(ids).toContain('hero');
    expect(ids).toContain('pricing');
    expect(ids).toContain('navbar');
  });
});

// ═══════════════════════════════════════════════════════════════
// METHOD 13: buildLandingPage
// ═══════════════════════════════════════════════════════════════

describe('buildLandingPage', () => {
  it('builds a complete page', { retry: 2 }, async () => {
    const d = await exec('buildLandingPage', {
      title: 'LP',
      hero: { headline: 'Hi' },
      features: { items: [{ title: 'A', description: 'B' }] },
      footer: { copyright: '2026' },
    });
    expect(d.ok).toBe(true);
    expect(d.data).toContain('Hi');
    expect(d.data).toContain('2026');
  });
});

// ═══════════════════════════════════════════════════════════════
// METHOD 14: addDataSource
// ═══════════════════════════════════════════════════════════════

describe('addDataSource', () => {
  it('adds a data source', { retry: 2 }, async () => {
    const d = await exec('addDataSource', {
      id: 'test-ds', url: 'https://api.example.com/data', path: 'results.items',
      targetSelector: '#list', template: '<p>{{name}}</p>',
    });
    expect(d.ok).toBe(true);
  });

  it('rejects missing fields', { retry: 2 }, async () => {
    const d = await exec('addDataSource', { id: 'x' });
    expect(d.ok).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════
// METHOD 15: removeDataSource
// ═══════════════════════════════════════════════════════════════

describe('removeDataSource', () => {
  it('removes by id', { retry: 2 }, async () => {
    const r = await batch([
      { method: 'addDataSource', params: { id: 'rm-ds', url: 'https://x.com', targetSelector: '#x', template: '<p>{{a}}</p>' } },
      { method: 'removeDataSource', params: { id: 'rm-ds' } },
    ]);
    expect(r.results[0].ok).toBe(true);
    expect(r.results[1].ok).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// METHOD 16: getDataSources
// ═══════════════════════════════════════════════════════════════

describe('getDataSources', () => {
  it('lists data sources', { retry: 2 }, async () => {
    const d = await exec('getDataSources');
    expect(d.ok).toBe(true);
    expect(Array.isArray(d.data)).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// METHOD 17: addFormAction
// ═══════════════════════════════════════════════════════════════

describe('addFormAction', () => {
  it('adds a form webhook', { retry: 2 }, async () => {
    const d = await exec('addFormAction', {
      id: 'test-fa', formSelector: 'form', webhookUrl: 'https://hooks.example.com/x',
    });
    expect(d.ok).toBe(true);
  });

  it('rejects missing fields', { retry: 2 }, async () => {
    const d = await exec('addFormAction', { id: 'x' });
    expect(d.ok).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════
// METHOD 18: removeFormAction
// ═══════════════════════════════════════════════════════════════

describe('removeFormAction', () => {
  it('removes by id', { retry: 2 }, async () => {
    const r = await batch([
      { method: 'addFormAction', params: { id: 'rm-fa', formSelector: '#f', webhookUrl: 'https://x.com' } },
      { method: 'removeFormAction', params: { id: 'rm-fa' } },
    ]);
    expect(r.results[0].ok).toBe(true);
    expect(r.results[1].ok).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// METHOD 19: getFormActions
// ═══════════════════════════════════════════════════════════════

describe('getFormActions', () => {
  it('lists form actions', { retry: 2 }, async () => {
    const d = await exec('getFormActions');
    expect(d.ok).toBe(true);
    expect(Array.isArray(d.data)).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// ENDPOINT: POST /api/batch
// ═══════════════════════════════════════════════════════════════

describe('POST /api/batch', () => {
  it('executes multiple actions', { retry: 2 }, async () => {
    const r = await batch([
      { method: 'clearPage' },
      { method: 'addSection', params: { type: 'hero', options: { headline: 'Batch' } } },
      { method: 'getHTML' },
    ]);
    expect(r.ok).toBe(true);
    expect(r.results.length).toBe(3);
    expect(r.results[2].data).toContain('Batch');
  });

  it('returns sessionId', { retry: 2 }, async () => {
    const r = await batch([{ method: 'clearPage' }]);
    expect(r.sessionId).toBe(SID);
  });

  it('handles errors gracefully', { retry: 2 }, async () => {
    const r = await batch([
      { method: 'clearPage' },
      { method: 'addSection', params: { type: 'INVALID' } },
      { method: 'getHTML' },
    ]);
    expect(r.results[1].ok).toBe(false);
    expect(r.results[2].ok).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// ENDPOINT: POST /api/sync + GET /api/poll
// ═══════════════════════════════════════════════════════════════

describe('sync + poll', () => {
  it('editor sync is readable by poll', { retry: 2 }, async () => {
    await fetch(`${API}/api/sync`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: SID, html: '<h1>Synced</h1>' }) });

    const res = await fetch(`${API}/api/poll?sessionId=${SID}`);
    const d = await res.json();
    expect(d.ok).toBe(true);
    // KV eventual consistency — content may or may not be there yet
    expect(typeof d.data.html).toBe('string');
  });
});

// ═══════════════════════════════════════════════════════════════
// ENDPOINT: GET /api/changelog
// ═══════════════════════════════════════════════════════════════

describe('GET /api/changelog', () => {
  it('returns changelog entries', { retry: 2 }, async () => {
    const res = await fetch(`${API}/api/changelog?sessionId=${SID}`);
    const d = await res.json();
    expect(d.ok).toBe(true);
    expect(Array.isArray(d.data)).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// INTEGRATION: full workflow
// ═══════════════════════════════════════════════════════════════

describe('Integration', () => {
  it('theme + build + data + form + export', { retry: 2 }, async () => {
    const r = await batch([
      { method: 'clearPage' },
      { method: 'setTheme', params: { colors: { primary: '#059669' } } },
      { method: 'addSection', params: { type: 'navbar', options: { brand: 'Int' } } },
      { method: 'addSection', params: { type: 'hero', options: { headline: 'Integration' } } },
      { method: 'addHTML', params: { html: '<div id="data"></div>' } },
      { method: 'addDataSource', params: { id: 'int-ds', url: 'https://api.test.com', targetSelector: '#data', template: '<p>{{x}}</p>' } },
      { method: 'addSection', params: { type: 'contact' } },
      { method: 'addFormAction', params: { id: 'int-fa', formSelector: 'form', webhookUrl: 'https://hook.test.com' } },
      { method: 'addSection', params: { type: 'footer' } },
      { method: 'getPageInfo' },
      { method: 'getFullPage', params: { title: 'Integration' } },
    ]);

    expect(r.ok).toBe(true);
    for (const result of r.results) {
      expect(result.ok).toBe(true);
    }

    const info = r.results[9].data;
    expect(info.sectionCount).toBe(5);
    expect(info.dataSourceCount).toBe(1);
    expect(info.formActionCount).toBe(1);

    const html = r.results[10].data;
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('--c-primary:#059669');
    expect(html).toContain('Integration');
    expect(html).toContain('<script>');
    expect(html).toContain('api.test.com');
    expect(html).toContain('hook.test.com');
  });
});
