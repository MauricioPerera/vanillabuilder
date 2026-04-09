import { describe, it, expect, vi, beforeEach } from 'vitest';
import CssRule from '../../src/css_composer/model/CssRule.js';
import CssComposer from '../../src/css_composer/index.js';
import EditorModel from '../../src/editor/EditorModel.js';

// ── CssRule ──

describe('CssRule', () => {
  let rule;

  beforeEach(() => {
    rule = new CssRule();
  });

  describe('defaults', () => {
    it('has empty selectors array', () => {
      expect(rule.getSelectors()).toEqual([]);
    });

    it('has empty style object', () => {
      expect(rule.getStyle()).toEqual({});
    });

    it('has empty state', () => {
      expect(rule.get('state')).toBe('');
    });

    it('has empty mediaText', () => {
      expect(rule.getMediaText()).toBe('');
    });

    it('has empty atRuleType', () => {
      expect(rule.get('atRuleType')).toBe('');
    });

    it('is not singleAtRule', () => {
      expect(rule.get('singleAtRule')).toBe(false);
    });

    it('is not important', () => {
      expect(rule.get('important')).toBe(false);
    });
  });

  describe('get/set style', () => {
    it('getStyle returns a copy of the style', () => {
      rule.set('style', { color: 'red' });
      const style = rule.getStyle();
      style.color = 'blue';
      expect(rule.getStyle().color).toBe('red');
    });

    it('setStyle merges by default', () => {
      rule.setStyle({ color: 'red' });
      rule.setStyle({ fontSize: '14px' });
      expect(rule.getStyle()).toEqual({ color: 'red', fontSize: '14px' });
    });

    it('setStyle with replace:true replaces entirely', () => {
      rule.setStyle({ color: 'red', fontSize: '14px' });
      rule.setStyle({ background: 'blue' }, { replace: true });
      expect(rule.getStyle()).toEqual({ background: 'blue' });
    });
  });

  describe('selectorsToString', () => {
    it('joins string selectors', () => {
      const r = new CssRule({ selectors: ['.my-class'] });
      expect(r.selectorsToString()).toBe('.my-class');
    });

    it('appends state to selector string', () => {
      const r = new CssRule({ selectors: ['.btn'], state: ':hover' });
      expect(r.selectorsToString()).toBe('.btn:hover');
    });

    it('handles selector objects with name and type', () => {
      const r = new CssRule({
        selectors: [{ name: 'container', type: 1 }],
      });
      expect(r.selectorsToString()).toBe('.container');
    });

    it('handles id type selectors', () => {
      const r = new CssRule({
        selectors: [{ name: 'main', type: 2 }],
      });
      expect(r.selectorsToString()).toBe('#main');
    });

    it('handles tag type selectors', () => {
      const r = new CssRule({
        selectors: [{ name: 'div', type: 3 }],
      });
      expect(r.selectorsToString()).toBe('div');
    });

    it('handles selector objects with getFullName method', () => {
      const r = new CssRule({
        selectors: [{ getFullName: () => '.custom' }],
      });
      expect(r.selectorsToString()).toBe('.custom');
    });
  });

  describe('styleToString', () => {
    it('returns empty string for empty style', () => {
      expect(rule.styleToString()).toBe('');
    });

    it('converts style object to CSS declaration string', () => {
      rule.setStyle({ color: 'red', fontSize: '14px' });
      const str = rule.styleToString();
      expect(str).toContain('color: red;');
      expect(str).toContain('font-size: 14px;');
    });

    it('adds !important when rule is important', () => {
      const r = new CssRule({ style: { color: 'red' }, important: true });
      expect(r.styleToString()).toContain('!important');
    });

    it('does not double !important', () => {
      const r = new CssRule({
        style: { color: 'red !important' },
        important: true,
      });
      const str = r.styleToString();
      // Should only have one !important
      expect(str.match(/!important/g).length).toBe(1);
    });
  });

  describe('toCSS', () => {
    it('returns empty string when no style', () => {
      const r = new CssRule({ selectors: ['.a'] });
      expect(r.toCSS()).toBe('');
    });

    it('generates basic rule', () => {
      const r = new CssRule({ selectors: ['.box'], style: { color: 'red' } });
      expect(r.toCSS()).toBe('.box { color: red; }');
    });

    it('wraps in @media when mediaText is set', () => {
      const r = new CssRule({
        selectors: ['.box'],
        style: { color: 'red' },
        mediaText: '(max-width: 768px)',
      });
      expect(r.toCSS()).toBe('@media (max-width: 768px) { .box { color: red; } }');
    });

    it('generates singleAtRule like @font-face', () => {
      const r = new CssRule({
        style: { 'font-family': 'MyFont', src: 'url(font.woff2)' },
        atRuleType: 'font-face',
        singleAtRule: true,
      });
      const css = r.toCSS();
      expect(css).toContain('@font-face');
      expect(css).toContain('font-family: MyFont;');
    });

    it('returns empty string when no selectors and not singleAtRule', () => {
      const r = new CssRule({ style: { color: 'red' } });
      expect(r.toCSS()).toBe('');
    });

    it('includes state in output', () => {
      const r = new CssRule({
        selectors: ['.btn'],
        style: { color: 'blue' },
        state: ':hover',
      });
      expect(r.toCSS()).toBe('.btn:hover { color: blue; }');
    });
  });

  describe('matches', () => {
    it('matches same selectors', () => {
      const r = new CssRule({ selectors: ['.box'] });
      expect(r.matches(['.box'])).toBe(true);
    });

    it('does not match different selectors', () => {
      const r = new CssRule({ selectors: ['.box'] });
      expect(r.matches(['.container'])).toBe(false);
    });

    it('matches with state', () => {
      const r = new CssRule({ selectors: ['.btn'], state: ':hover' });
      expect(r.matches(['.btn'], { state: ':hover' })).toBe(true);
      expect(r.matches(['.btn'], { state: ':active' })).toBe(false);
    });

    it('matches with mediaText', () => {
      const r = new CssRule({
        selectors: ['.box'],
        mediaText: '(max-width: 768px)',
      });
      expect(r.matches(['.box'], { mediaText: '(max-width: 768px)' })).toBe(true);
      expect(r.matches(['.box'], { mediaText: '(max-width: 480px)' })).toBe(false);
    });

    it('matches with atRuleType', () => {
      const r = new CssRule({
        selectors: ['.box'],
        atRuleType: 'supports',
      });
      expect(r.matches(['.box'], { atRuleType: 'supports' })).toBe(true);
      expect(r.matches(['.box'], {})).toBe(false);
    });

    it('matches selectors regardless of order', () => {
      const r = new CssRule({ selectors: ['.b', '.a'] });
      expect(r.matches(['.a', '.b'])).toBe(true);
    });
  });
});

// ── CssComposer ──

describe('CssComposer', () => {
  let em;
  let css;

  beforeEach(() => {
    em = new EditorModel({ headless: true });
    em.initModules();
    css = em.getModule('Css');
    // Patch em.trigger to guard against undefined event names
    // (a known issue in _setupEventPropagation closure capture)
    const origTrigger = em.trigger.bind(em);
    em.trigger = (event, ...args) => {
      if (!event) return em;
      return origTrigger(event, ...args);
    };
  });

  describe('add / getAll', () => {
    it('adds a rule and retrieves it', () => {
      css.add({ selectors: ['.test'], style: { color: 'red' } });
      const all = css.getAll();
      expect(all.length).toBe(1);
      expect(all[0].getStyle()).toEqual({ color: 'red' });
    });

    it('adds multiple rules', () => {
      css.add({ selectors: ['.a'], style: { color: 'red' } });
      css.add({ selectors: ['.b'], style: { color: 'blue' } });
      expect(css.getAll().length).toBe(2);
    });
  });

  describe('remove', () => {
    it('removes a rule', () => {
      const rule = css.add({ selectors: ['.test'], style: { color: 'red' } });
      css.remove(rule);
      expect(css.getAll().length).toBe(0);
    });
  });

  describe('setRule', () => {
    it('creates a new rule if none exists', () => {
      const rule = css.setRule(['.box'], { color: 'red' });
      expect(rule).toBeDefined();
      expect(rule.getStyle()).toEqual({ color: 'red' });
    });

    it('updates existing rule if it matches', () => {
      css.setRule(['.box'], { color: 'red' });
      css.setRule(['.box'], { fontSize: '14px' });
      expect(css.getAll().length).toBe(1);
      expect(css.getAll()[0].getStyle()).toEqual({ color: 'red', fontSize: '14px' });
    });

    it('creates separate rules for different states', () => {
      css.setRule(['.btn'], { color: 'red' });
      css.setRule(['.btn'], { color: 'blue' }, { state: ':hover' });
      expect(css.getAll().length).toBe(2);
    });

    it('creates separate rules for different media queries', () => {
      css.setRule(['.box'], { width: '100%' });
      css.setRule(['.box'], { width: '50%' }, { mediaText: '(max-width: 768px)' });
      expect(css.getAll().length).toBe(2);
    });
  });

  describe('getRule', () => {
    it('finds a matching rule', () => {
      css.setRule(['.box'], { color: 'red' });
      const found = css.getRule(['.box']);
      expect(found).toBeDefined();
      expect(found.getStyle()).toEqual({ color: 'red' });
    });

    it('returns undefined when no match', () => {
      expect(css.getRule(['.nonexistent'])).toBeUndefined();
    });

    it('matches with state option', () => {
      css.setRule(['.btn'], { color: 'blue' }, { state: ':hover' });
      expect(css.getRule(['.btn'], { state: ':hover' })).toBeDefined();
      expect(css.getRule(['.btn'])).toBeUndefined();
    });
  });

  describe('buildCSS', () => {
    it('returns empty string with no rules', () => {
      expect(css.buildCSS()).toBe('');
    });

    it('generates CSS from all rules', () => {
      css.setRule(['.box'], { color: 'red' });
      css.setRule(['.container'], { width: '100%' });
      const output = css.buildCSS();
      expect(output).toContain('.box { color: red; }');
      expect(output).toContain('.container { width: 100%; }');
    });

    it('includes media queries in output', () => {
      css.setRule(['.box'], { width: '50%' }, { mediaText: '(max-width: 768px)' });
      const output = css.buildCSS();
      expect(output).toContain('@media (max-width: 768px)');
    });

    it('skips rules with empty styles', () => {
      css.add({ selectors: ['.empty'], style: {} });
      css.setRule(['.filled'], { color: 'red' });
      const output = css.buildCSS();
      expect(output).not.toContain('.empty');
      expect(output).toContain('.filled');
    });
  });

  describe('getProjectData / loadProjectData', () => {
    it('getProjectData serializes rules under storage key', () => {
      css.setRule(['.box'], { color: 'red' });
      const data = css.getProjectData();
      expect(data.styles).toBeDefined();
      expect(Array.isArray(data.styles)).toBe(true);
      expect(data.styles.length).toBe(1);
    });

    it('loadProjectData restores rules', () => {
      css.setRule(['.box'], { color: 'red' });
      const data = css.getProjectData();
      // Clear and reload into the same module
      css.clear();
      expect(css.getAll().length).toBe(0);
      css.loadProjectData(data);
      expect(css.getAll().length).toBe(1);
    });

    it('loadProjectData with empty data does not error', () => {
      expect(() => css.loadProjectData({})).not.toThrow();
    });
  });

  describe('clear', () => {
    it('removes all rules', () => {
      css.setRule(['.a'], { color: 'red' });
      css.setRule(['.b'], { color: 'blue' });
      css.clear();
      expect(css.getAll().length).toBe(0);
    });
  });

  describe('addRules (CSS string parsing)', () => {
    it('parses a simple CSS string into rules', () => {
      const rules = css.addRules('.box { color: red; font-size: 14px; }');
      expect(rules.length).toBe(1);
    });

    it('returns empty array for empty input', () => {
      expect(css.addRules('')).toEqual([]);
      expect(css.addRules(null)).toEqual([]);
    });

    it('parses multiple rules', () => {
      const rules = css.addRules('.a { color: red; } .b { color: blue; }');
      expect(rules.length).toBe(2);
    });
  });
});
