import { describe, it, expect, vi, beforeEach } from 'vitest';
import ParserHtml from '../../src/parser/ParserHtml.js';
import ParserCss from '../../src/parser/ParserCss.js';
import ParserModule from '../../src/parser/index.js';

describe('ParserHtml', () => {
  let parser;

  beforeEach(() => {
    parser = new ParserHtml();
  });

  it('should parse a simple div element', () => {
    const result = parser.parse('<div></div>');
    expect(result).toHaveLength(1);
    expect(result[0].tagName).toBe('div');
    expect(result[0].type).toBe('default');
  });

  it('should parse element with attributes (id, class, style)', () => {
    const result = parser.parse('<div id="main" class="container active" style="color: red; padding: 10px"></div>');
    expect(result).toHaveLength(1);
    const def = result[0];
    expect(def.attributes.id).toBe('main');
    expect(def.classes).toEqual(['container', 'active']);
    expect(def.style).toEqual({ color: 'red', padding: '10px' });
  });

  it('should parse nested elements (parent > child)', () => {
    const result = parser.parse('<div><span>hello</span></div>');
    expect(result).toHaveLength(1);
    expect(result[0].components).toHaveLength(1);
    expect(result[0].components[0].tagName).toBe('span');
    expect(result[0].components[0].content).toBe('hello');
  });

  it('should parse img as a void element without components', () => {
    const result = parser.parse('<img src="test.png" alt="test">');
    expect(result).toHaveLength(1);
    expect(result[0].tagName).toBe('img');
    expect(result[0].type).toBe('image');
    expect(result[0].src).toBe('test.png');
    expect(result[0]).not.toHaveProperty('components');
  });

  it('should parse text content inside an element', () => {
    const result = parser.parse('<p>Hello World</p>');
    expect(result).toHaveLength(1);
    expect(result[0].tagName).toBe('p');
    expect(result[0].content).toBe('Hello World');
    expect(result[0]).not.toHaveProperty('components');
  });

  it('should parse inline styles to object', () => {
    const result = parser.parse('<div style="margin: 0 auto; font-size: 14px; color: blue"></div>');
    const style = result[0].style;
    expect(style).toEqual({
      margin: '0 auto',
      'font-size': '14px',
      color: 'blue',
    });
  });

  it('should parse standalone text nodes', () => {
    const result = parser.parse('Just text');
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('textnode');
    expect(result[0].content).toBe('Just text');
  });

  it('should return empty array for empty or invalid input', () => {
    expect(parser.parse('')).toEqual([]);
    expect(parser.parse(null)).toEqual([]);
    expect(parser.parse(undefined)).toEqual([]);
    expect(parser.parse(123)).toEqual([]);
  });

  it('should detect text-level elements as type text', () => {
    const result = parser.parse('<span>hi</span>');
    expect(result[0].type).toBe('text');
  });

  it('should parse br and hr as void elements', () => {
    const result = parser.parse('<br><hr>');
    expect(result).toHaveLength(2);
    expect(result[0].tagName).toBe('br');
    expect(result[0]).not.toHaveProperty('components');
    expect(result[1].tagName).toBe('hr');
    expect(result[1]).not.toHaveProperty('components');
  });

  it('should parse href attribute on links', () => {
    const result = parser.parse('<a href="https://example.com">Link</a>');
    expect(result[0].type).toBe('link');
    expect(result[0].attributes.href).toBe('https://example.com');
  });

  it('should handle data-vb-type override', () => {
    const result = parser.parse('<div data-vb-type="custom-widget"></div>');
    expect(result[0].type).toBe('custom-widget');
  });
});

describe('ParserCss', () => {
  let parser;

  beforeEach(() => {
    parser = new ParserCss();
  });

  it('should parse a simple rule (selector + declarations)', () => {
    const result = parser.parse('body { margin: 0; padding: 0; }');
    expect(result).toHaveLength(1);
    expect(result[0].selectors).toEqual(['body']);
    expect(result[0].style).toEqual({ margin: '0', padding: '0' });
  });

  it('should parse multiple rules', () => {
    const css = 'h1 { font-size: 24px; } p { color: #333; }';
    const result = parser.parse(css);
    expect(result).toHaveLength(2);
    expect(result[0].selectors).toEqual(['h1']);
    expect(result[1].selectors).toEqual(['p']);
  });

  it('should parse a media query', () => {
    const css = '@media (max-width: 768px) { .container { width: 100%; } }';
    const result = parser.parse(css);
    expect(result).toHaveLength(1);
    expect(result[0].mediaText).toBe('(max-width: 768px)');
    expect(result[0].selectors).toEqual(['.container']);
    expect(result[0].style).toEqual({ width: '100%' });
  });

  it('should parse a class selector', () => {
    const result = parser.parse('.my-class { display: flex; }');
    expect(result).toHaveLength(1);
    expect(result[0].selectors).toEqual(['.my-class']);
    expect(result[0].style).toEqual({ display: 'flex' });
  });

  it('should parse complex selectors', () => {
    const css = '.parent > .child { color: red; } .a + .b { margin: 0; }';
    const result = parser.parse(css);
    expect(result).toHaveLength(2);
    expect(result[0].selectors).toEqual(['.parent > .child']);
    expect(result[1].selectors).toEqual(['.a + .b']);
  });

  it('should extract pseudo-state from selector', () => {
    const result = parser.parse('.btn:hover { color: blue; }');
    expect(result).toHaveLength(1);
    expect(result[0].selectors).toEqual(['.btn']);
    expect(result[0].state).toBe(':hover');
  });

  it('should handle comma-separated selectors', () => {
    const result = parser.parse('h1, h2, h3 { font-weight: bold; }');
    expect(result).toHaveLength(3);
    expect(result[0].selectors).toEqual(['h1']);
    expect(result[1].selectors).toEqual(['h2']);
    expect(result[2].selectors).toEqual(['h3']);
  });

  it('should return empty array for empty or invalid input', () => {
    expect(parser.parse('')).toEqual([]);
    expect(parser.parse(null)).toEqual([]);
    expect(parser.parse(undefined)).toEqual([]);
  });

  it('should strip CSS comments', () => {
    const css = '/* comment */ .a { color: red; } /* more */';
    const result = parser.parse(css);
    expect(result).toHaveLength(1);
    expect(result[0].selectors).toEqual(['.a']);
  });

  it('should parse @font-face as singleAtRule', () => {
    const css = '@font-face { font-family: "MyFont"; src: url("font.woff2"); }';
    const result = parser.parse(css);
    expect(result).toHaveLength(1);
    expect(result[0].singleAtRule).toBe(true);
    expect(result[0].atRuleType).toBe('font-face');
  });
});

describe('ParserModule', () => {
  let mockEditor;
  let mod;

  beforeEach(() => {
    mockEditor = {
      getConfig: (k) => k ? undefined : {},
      getModule: () => null,
      on: () => {},
      trigger: () => {},
      t: (k) => k,
    };
    mod = new ParserModule(mockEditor);
  });

  it('should delegate parseHtml to ParserHtml', () => {
    const result = mod.parseHtml('<div></div>');
    expect(result).toHaveLength(1);
    expect(result[0].tagName).toBe('div');
  });

  it('should delegate parseCss to ParserCss', () => {
    const result = mod.parseCss('.x { color: red; }');
    expect(result).toHaveLength(1);
    expect(result[0].selectors).toEqual(['.x']);
  });

  it('should expose getHtmlParser and getCssParser', () => {
    expect(mod.getHtmlParser()).toBeInstanceOf(ParserHtml);
    expect(mod.getCssParser()).toBeInstanceOf(ParserCss);
  });
});
