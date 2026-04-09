import { describe, it, expect, vi, beforeEach } from 'vitest';
import HtmlGenerator from '../../src/code_manager/HtmlGenerator.js';
import CssGenerator from '../../src/code_manager/CssGenerator.js';
import CodeManager from '../../src/code_manager/index.js';

describe('HtmlGenerator', () => {
  let gen;

  beforeEach(() => {
    gen = new HtmlGenerator();
  });

  it('should build a simple component to HTML', () => {
    const component = { tagName: 'div', type: 'default' };
    const html = gen.build(component);
    expect(html).toBe('<div></div>');
  });

  it('should build nested components', () => {
    const component = {
      tagName: 'div',
      components: [
        { tagName: 'p', content: 'Hello' },
      ],
    };
    const html = gen.build(component);
    expect(html).toBe('<div><p>Hello</p></div>');
  });

  it('should build void elements (img, hr, br)', () => {
    expect(gen.build({ tagName: 'img', src: 'pic.jpg' })).toBe('<img src="pic.jpg">');
    expect(gen.build({ tagName: 'hr' })).toBe('<hr>');
    expect(gen.build({ tagName: 'br' })).toBe('<br>');
  });

  it('should build with attributes', () => {
    const component = {
      tagName: 'a',
      attributes: { href: 'https://example.com', target: '_blank' },
    };
    const html = gen.build(component);
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('target="_blank"');
  });

  it('should build with classes', () => {
    const component = {
      tagName: 'div',
      classes: ['container', 'main'],
    };
    const html = gen.build(component);
    expect(html).toContain('class="container main"');
  });

  it('should build with inline styles', () => {
    const component = {
      tagName: 'div',
      style: { color: 'red', fontSize: '14px' },
    };
    const html = gen.build(component);
    expect(html).toContain('style="color: red; font-size: 14px"');
  });

  it('should build textnode type as plain content', () => {
    const component = { type: 'textnode', content: 'Hello world' };
    const html = gen.build(component);
    expect(html).toBe('Hello world');
  });

  it('should return empty string for null component', () => {
    expect(gen.build(null)).toBe('');
    expect(gen.build(undefined)).toBe('');
  });

  it('should build with id attribute', () => {
    const component = {
      tagName: 'div',
      attributes: { id: 'my-id' },
    };
    const html = gen.build(component, { cleanId: false });
    expect(html).toContain('id="my-id"');
  });

  it('should escape special characters in attributes', () => {
    const component = {
      tagName: 'div',
      attributes: { 'data-val': 'a<b&c"d' },
    };
    const html = gen.build(component);
    expect(html).toContain('data-val="a&lt;b&amp;c&quot;d"');
  });

  it('should build with content when no children exist', () => {
    const component = { tagName: 'p', content: 'Some text' };
    const html = gen.build(component);
    expect(html).toBe('<p>Some text</p>');
  });
});

describe('CssGenerator', () => {
  let gen;

  beforeEach(() => {
    gen = new CssGenerator();
  });

  it('should build a single rule', () => {
    const rules = [{ selectors: ['.box'], style: { color: 'red' }, state: '', mediaText: '' }];
    const css = gen.build(rules, { pretty: false });
    expect(css).toContain('.box');
    expect(css).toContain('color: red;');
  });

  it('should build multiple rules', () => {
    const rules = [
      { selectors: ['.a'], style: { color: 'red' }, state: '', mediaText: '' },
      { selectors: ['.b'], style: { margin: '0' }, state: '', mediaText: '' },
    ];
    const css = gen.build(rules, { pretty: false });
    expect(css).toContain('.a');
    expect(css).toContain('.b');
    expect(css).toContain('color: red;');
    expect(css).toContain('margin: 0;');
  });

  it('should build with media queries', () => {
    const rules = [
      { selectors: ['.box'], style: { width: '100%' }, state: '', mediaText: '(max-width: 768px)' },
    ];
    const css = gen.build(rules, { pretty: false });
    expect(css).toContain('@media (max-width: 768px)');
    expect(css).toContain('.box');
    expect(css).toContain('width: 100%;');
  });

  it('should return empty string for empty rules', () => {
    expect(gen.build([])).toBe('');
    expect(gen.build(null)).toBe('');
    expect(gen.build(undefined)).toBe('');
  });

  it('should build with pseudo-state', () => {
    const rules = [
      { selectors: ['.btn'], style: { color: 'blue' }, state: ':hover', mediaText: '' },
    ];
    const css = gen.build(rules, { pretty: false });
    expect(css).toContain('.btn:hover');
  });

  it('should skip rules with no style', () => {
    const rules = [
      { selectors: ['.empty'], style: {}, state: '', mediaText: '' },
    ];
    const css = gen.build(rules);
    expect(css).toBe('');
  });

  it('should group rules by media query', () => {
    const rules = [
      { selectors: ['.a'], style: { color: 'red' }, state: '', mediaText: '(max-width: 768px)' },
      { selectors: ['.b'], style: { color: 'blue' }, state: '', mediaText: '(max-width: 768px)' },
    ];
    const css = gen.build(rules, { pretty: false });
    const mediaCount = (css.match(/@media/g) || []).length;
    expect(mediaCount).toBe(1);
  });

  it('should handle singleAtRule like font-face', () => {
    const rules = [
      { selectors: [], style: { 'font-family': '"MyFont"' }, atRuleType: 'font-face', singleAtRule: true, state: '', mediaText: '' },
    ];
    const css = gen.build(rules, { pretty: false });
    expect(css).toContain('@font-face');
    expect(css).toContain('font-family: "MyFont";');
  });
});

describe('CodeManager', () => {
  let mockEditor;
  let cm;

  beforeEach(() => {
    mockEditor = {
      getConfig: (k) => k ? undefined : {},
      getModule: () => null,
      on: () => {},
      trigger: () => {},
      t: (k) => k,
      DomComponents: {
        getWrapper: () => ({
          get: (key) => {
            if (key === 'components') {
              return {
                models: [
                  { tagName: 'div', type: 'default', content: 'Hello', get: (k) => {
                    const data = { tagName: 'div', type: 'default', content: 'Hello', components: { models: [] } };
                    return data[k];
                  }},
                ],
              };
            }
            return undefined;
          },
        }),
      },
      CssComposer: {
        getAll: () => [
          { selectors: ['.test'], style: { color: 'red' }, state: '', mediaText: '' },
        ],
      },
    };
    cm = new CodeManager(mockEditor);
  });

  it('should return HTML string via getHtml', () => {
    const html = cm.getHtml();
    expect(html).toContain('<div>');
    expect(html).toContain('Hello');
  });

  it('should return CSS string via getCss', () => {
    const css = cm.getCss({ pretty: false });
    expect(css).toContain('.test');
    expect(css).toContain('color: red;');
  });

  it('should return empty string when no wrapper exists', () => {
    const emptyEditor = {
      getConfig: (k) => k ? undefined : {},
      getModule: () => null,
      on: () => {},
      trigger: () => {},
      t: (k) => k,
      DomComponents: { getWrapper: () => null },
      CssComposer: null,
    };
    const emptyCm = new CodeManager(emptyEditor);
    expect(emptyCm.getHtml()).toBe('');
    expect(emptyCm.getCss()).toBe('');
  });

  it('should expose getHtmlGenerator and getCssGenerator', () => {
    expect(cm.getHtmlGenerator()).toBeInstanceOf(HtmlGenerator);
    expect(cm.getCssGenerator()).toBeInstanceOf(CssGenerator);
  });
});
