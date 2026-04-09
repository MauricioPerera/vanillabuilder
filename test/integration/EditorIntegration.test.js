import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import vanillabuilder from '../../src/index.js';
import Component from '../../src/dom_components/model/Component.js';

describe('EditorIntegration', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="editor"></div>';
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  // ── vanillabuilder namespace ──

  it('vanillabuilder.version exists and is a string', () => {
    expect(vanillabuilder.version).toBeDefined();
    expect(typeof vanillabuilder.version).toBe('string');
  });

  it('vanillabuilder.init is a function', () => {
    expect(typeof vanillabuilder.init).toBe('function');
  });

  it('vanillabuilder.editors is an array', () => {
    expect(Array.isArray(vanillabuilder.editors)).toBe(true);
  });

  // ── Plugin registration ──

  it('vanillabuilder.plugins.add/get registers and retrieves plugins', () => {
    const myPlugin = vi.fn();
    vanillabuilder.plugins.add('my-plugin', myPlugin);
    expect(vanillabuilder.plugins.get('my-plugin')).toBe(myPlugin);
  });

  it('vanillabuilder.plugins.get returns undefined for unregistered plugin', () => {
    expect(vanillabuilder.plugins.get('non-existent')).toBeUndefined();
  });

  // ── Editor creation ──

  it('vanillabuilder.init() creates editor instance', () => {
    const editor = vanillabuilder.init({
      container: '#editor',
      autorender: false,
    });
    expect(editor).toBeDefined();
    expect(typeof editor.getModel).toBe('function');
    expect(typeof editor.on).toBe('function');
  });

  it('vanillabuilder.init() with autorender:false does not render', () => {
    const editor = vanillabuilder.init({
      container: '#editor',
      autorender: false,
    });
    // _rendered should be false since we skipped rendering
    expect(editor._rendered).toBe(false);
  });

  it('vanillabuilder.init() adds editor to editors array', () => {
    const startCount = vanillabuilder.editors.length;
    vanillabuilder.init({
      container: '#editor',
      autorender: false,
    });
    expect(vanillabuilder.editors.length).toBe(startCount + 1);
  });

  // ── Plugin function receives editor and options ──

  it('Plugin function receives editor and options on init', () => {
    const pluginFn = vi.fn();
    vanillabuilder.plugins.add('test-plugin-fn', pluginFn);

    vanillabuilder.init({
      container: '#editor',
      autorender: false,
      plugins: ['test-plugin-fn'],
      pluginsOpts: { 'test-plugin-fn': { foo: 'bar' } },
    });

    expect(pluginFn).toHaveBeenCalledTimes(1);
    // First arg is the editor instance
    const [editorArg, optsArg] = pluginFn.mock.calls[0];
    expect(typeof editorArg.getModel).toBe('function');
    expect(optsArg).toEqual({ foo: 'bar' });
  });

  it('inline plugin function (not registered) receives editor', () => {
    const inlineFn = vi.fn();
    vanillabuilder.init({
      container: '#editor',
      autorender: false,
      plugins: [inlineFn],
    });
    expect(inlineFn).toHaveBeenCalledTimes(1);
    const [editorArg] = inlineFn.mock.calls[0];
    expect(typeof editorArg.on).toBe('function');
  });

  // ── editor.getModel() ──

  it('editor.getModel() returns EditorModel', () => {
    const editor = vanillabuilder.init({
      container: '#editor',
      autorender: false,
    });
    const model = editor.getModel();
    expect(model).toBeDefined();
    expect(typeof model.getConfig).toBe('function');
    expect(typeof model.trigger).toBe('function');
  });

  // ── editor event system ──

  it('editor.on/off/trigger work for events', () => {
    const editor = vanillabuilder.init({
      container: '#editor',
      autorender: false,
    });
    const handler = vi.fn();

    editor.on('test:event', handler);
    editor.trigger('test:event', 42);
    expect(handler).toHaveBeenCalledWith(42);

    editor.off('test:event', handler);
    editor.trigger('test:event', 99);
    // Handler should not be called again after off()
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('editor.once fires handler only once', () => {
    const editor = vanillabuilder.init({
      container: '#editor',
      autorender: false,
    });
    const handler = vi.fn();

    editor.once('one-time', handler);
    editor.trigger('one-time');
    editor.trigger('one-time');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  // ── editor.getConfig() ──

  it('editor.getConfig() returns full configuration object', () => {
    const editor = vanillabuilder.init({
      container: '#editor',
      autorender: false,
    });
    const config = editor.getConfig();
    expect(typeof config).toBe('object');
    expect(config.container).toBe('#editor');
    expect(config.autorender).toBe(false);
  });

  it('editor.getConfig("stylePrefix") returns "vb-"', () => {
    const editor = vanillabuilder.init({
      container: '#editor',
      autorender: false,
    });
    expect(editor.getConfig('stylePrefix')).toBe('vb-');
  });

  it('editor.getConfig("height") returns default 900px', () => {
    const editor = vanillabuilder.init({
      container: '#editor',
      autorender: false,
    });
    expect(editor.getConfig('height')).toBe('900px');
  });

  // ── Selection flow ──

  it('editor.select()/getSelected() work for selection flow', () => {
    const editor = vanillabuilder.init({
      container: '#editor',
      autorender: false,
    });

    const comp = new Component({ tagName: 'div' });
    editor.select(comp);
    vi.runAllTimers();
    expect(editor.getSelected()).toBe(comp);
  });

  it('editor.getSelectedAll() returns array of all selected', () => {
    const editor = vanillabuilder.init({
      container: '#editor',
      autorender: false,
    });

    const comp1 = new Component({ tagName: 'div' });
    const comp2 = new Component({ tagName: 'span' });

    editor.select(comp1);
    editor.selectAdd(comp2);
    vi.runAllTimers();
    const all = editor.getSelectedAll();
    expect(all).toContain(comp1);
    expect(all).toContain(comp2);
    expect(all.length).toBe(2);
  });

  it('editor.selectRemove() removes component from selection', () => {
    const editor = vanillabuilder.init({
      container: '#editor',
      autorender: false,
    });

    const comp1 = new Component({ tagName: 'div' });
    const comp2 = new Component({ tagName: 'span' });

    editor.select([comp1, comp2]);
    editor.selectRemove(comp1);
    vi.runAllTimers();
    const all = editor.getSelectedAll();
    expect(all).not.toContain(comp1);
    expect(all).toContain(comp2);
  });

  it('editor.select() triggers component:selected event', () => {
    const editor = vanillabuilder.init({
      container: '#editor',
      autorender: false,
    });
    const handler = vi.fn();
    editor.on('component:selected', handler);

    const comp = new Component({ tagName: 'div' });
    editor.select(comp);
    vi.runAllTimers();
    expect(handler).toHaveBeenCalledWith(comp, expect.anything());
  });

  // ── usePlugin wrapper ──

  it('vanillabuilder.usePlugin wraps plugin with default options', () => {
    const pluginFn = vi.fn();
    const wrapped = vanillabuilder.usePlugin(pluginFn, { theme: 'dark', lang: 'en' });

    const editor = vanillabuilder.init({
      container: '#editor',
      autorender: false,
      plugins: [wrapped],
      pluginsOpts: {},
    });

    expect(pluginFn).toHaveBeenCalledTimes(1);
    const [, opts] = pluginFn.mock.calls[0];
    expect(opts.theme).toBe('dark');
    expect(opts.lang).toBe('en');
  });

  it('vanillabuilder.usePlugin allows overriding defaults', () => {
    const pluginFn = vi.fn();
    const wrapped = vanillabuilder.usePlugin(pluginFn, { theme: 'dark' });

    // When used as inline plugin, usePlugin merges caller opts over defaults
    wrapped({}, { theme: 'light' });
    const [, opts] = pluginFn.mock.calls[0];
    expect(opts.theme).toBe('light');
  });
});
