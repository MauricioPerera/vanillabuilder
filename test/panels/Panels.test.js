import { describe, it, expect, vi, beforeEach } from 'vitest';
import Button from '../../src/panels/model/Button.js';
import Panel from '../../src/panels/model/Panel.js';
import PanelManager from '../../src/panels/index.js';

function createEditor(config = {}) {
  return {
    trigger: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    getConfig: vi.fn((key) => config[key] || ''),
    t: vi.fn((key) => key),
    Editor: {},
  };
}

// ---------------------------------------------------------------------------
// Button Model
// ---------------------------------------------------------------------------
describe('Button model', () => {
  it('should have correct defaults', () => {
    const btn = new Button();
    expect(btn.get('id')).toBe('');
    expect(btn.get('label')).toBe('');
    expect(btn.get('className')).toBe('');
    expect(btn.get('command')).toBe('');
    expect(btn.get('active')).toBe(false);
    expect(btn.get('togglable')).toBe(true);
    expect(btn.get('disabled')).toBe(false);
    expect(btn.get('visible')).toBe(true);
    expect(btn.get('attributes')).toEqual({});
    expect(btn.get('dragDrop')).toBe(false);
  });

  it('should accept initial attributes', () => {
    const btn = new Button({
      id: 'bold-btn',
      label: '<b>B</b>',
      className: 'toolbar-btn',
      command: 'core:bold',
      togglable: true,
    });
    expect(btn.get('id')).toBe('bold-btn');
    expect(btn.get('label')).toBe('<b>B</b>');
    expect(btn.get('command')).toBe('core:bold');
  });

  it('should set this.id from the id attribute', () => {
    const btn = new Button({ id: 'my-btn' });
    expect(btn.id).toBe('my-btn');
  });

  it('isActive returns false by default', () => {
    const btn = new Button();
    expect(btn.isActive()).toBe(false);
  });

  it('toggle active state via set', () => {
    const btn = new Button({ active: false });
    expect(btn.isActive()).toBe(false);
    btn.set('active', true);
    expect(btn.isActive()).toBe(true);
    btn.set('active', false);
    expect(btn.isActive()).toBe(false);
  });

  it('getCommand returns the command string', () => {
    const btn = new Button({ command: 'core:preview' });
    expect(btn.getCommand()).toBe('core:preview');
  });

  it('renderElement returns an HTMLButtonElement', () => {
    const btn = new Button({ id: 'render-btn', label: 'Click', className: 'my-class' });
    const el = btn.renderElement('vb-');
    expect(el).toBeInstanceOf(HTMLButtonElement);
    expect(el.type).toBe('button');
    expect(el.getAttribute('data-btn-id')).toBe('render-btn');
    expect(el.innerHTML).toBe('Click');
    expect(el.classList.contains('my-class')).toBe(true);
  });

  it('renderElement applies active class', () => {
    const btn = new Button({ id: 'active-btn', active: true });
    const el = btn.renderElement('vb-');
    expect(el.classList.contains('vb-active')).toBe(true);
  });

  it('renderElement disables the button when disabled', () => {
    const btn = new Button({ id: 'dis-btn', disabled: true });
    const el = btn.renderElement('vb-');
    expect(el.disabled).toBe(true);
  });

  it('renderElement hides button when not visible', () => {
    const btn = new Button({ id: 'hid-btn', visible: false });
    const el = btn.renderElement('vb-');
    expect(el.style.display).toBe('none');
  });

  it('renderElement applies custom attributes', () => {
    const btn = new Button({ id: 'attr-btn', attributes: { title: 'Bold', 'data-action': 'bold' } });
    const el = btn.renderElement();
    expect(el.getAttribute('title')).toBe('Bold');
    expect(el.getAttribute('data-action')).toBe('bold');
  });
});

// ---------------------------------------------------------------------------
// Panel Model
// ---------------------------------------------------------------------------
describe('Panel model', () => {
  it('should have correct defaults', () => {
    const panel = new Panel();
    expect(panel.get('id')).toBe('');
    expect(panel.get('content')).toBe('');
    expect(panel.get('visible')).toBe(true);
    expect(panel.get('resizable')).toBe(false);
    expect(panel.get('buttons')).toEqual([]);
    expect(panel.get('el')).toBe(null);
    expect(panel.get('appendTo')).toBe('');
  });

  it('should set this.id from the id attribute', () => {
    const panel = new Panel({ id: 'toolbar' });
    expect(panel.id).toBe('toolbar');
  });

  it('getButtons returns a collection', () => {
    const panel = new Panel({ id: 'p1' });
    const buttons = panel.getButtons();
    expect(buttons).toBeDefined();
    expect(typeof buttons.add).toBe('function');
  });

  it('addButton adds a button to the panel', () => {
    const panel = new Panel({ id: 'p2' });
    const btn = panel.addButton({ id: 'btn1', label: 'B1', command: 'cmd1' });
    expect(btn).toBeDefined();
    expect(panel.getButtons().length).toBe(1);
  });

  it('getButton retrieves a button by id', () => {
    const panel = new Panel({ id: 'p3' });
    panel.addButton({ id: 'find-me', label: 'Found' });
    const found = panel.getButton('find-me');
    expect(found).toBeDefined();
    expect(found.get('label')).toBe('Found');
  });

  it('getButton returns undefined for unknown id', () => {
    const panel = new Panel({ id: 'p4' });
    expect(panel.getButton('nope')).toBeUndefined();
  });

  it('removeButton removes a button by id', () => {
    const panel = new Panel({ id: 'p5' });
    panel.addButton({ id: 'rm-btn', label: 'Remove' });
    const removed = panel.removeButton('rm-btn');
    expect(removed).toBeDefined();
    expect(panel.getButton('rm-btn')).toBeUndefined();
  });

  it('isVisible returns visibility state', () => {
    const visible = new Panel({ visible: true });
    expect(visible.isVisible()).toBe(true);
    const hidden = new Panel({ visible: false });
    expect(hidden.isVisible()).toBe(false);
  });

  it('initializes buttons from config array', () => {
    const panel = new Panel({
      id: 'init-btns',
      buttons: [
        { id: 'b1', label: 'One' },
        { id: 'b2', label: 'Two' },
      ],
    });
    expect(panel.getButtons().length).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// PanelManager
// ---------------------------------------------------------------------------
describe('PanelManager', () => {
  let pm;
  let editor;

  beforeEach(() => {
    editor = createEditor();
    pm = new PanelManager(editor);
  });

  it('addPanel creates and returns a panel', () => {
    const panel = pm.addPanel({ id: 'toolbar', content: 'Tools' });
    expect(panel).toBeDefined();
    expect(panel.get('id')).toBe('toolbar');
  });

  it('addPanel does not duplicate existing panel with same id', () => {
    pm.addPanel({ id: 'dup' });
    pm.addPanel({ id: 'dup' });
    expect(pm.getPanels()).toHaveLength(1);
  });

  it('getPanel retrieves panel by id', () => {
    pm.addPanel({ id: 'find-panel' });
    const found = pm.getPanel('find-panel');
    expect(found).toBeDefined();
    expect(found.get('id')).toBe('find-panel');
  });

  it('getPanel returns undefined for unknown id', () => {
    expect(pm.getPanel('nope')).toBeUndefined();
  });

  it('getPanels returns all panels', () => {
    pm.addPanel({ id: 'p1' });
    pm.addPanel({ id: 'p2' });
    expect(pm.getPanels()).toHaveLength(2);
  });

  it('removePanel removes panel by id', () => {
    pm.addPanel({ id: 'rm-panel' });
    const removed = pm.removePanel('rm-panel');
    expect(removed).toBeDefined();
    expect(pm.getPanel('rm-panel')).toBeUndefined();
  });

  it('addButton adds a button to a specific panel', () => {
    pm.addPanel({ id: 'btn-panel' });
    const btn = pm.addButton('btn-panel', { id: 'new-btn', label: 'New' });
    expect(btn).toBeDefined();
    expect(btn.get('label')).toBe('New');
  });

  it('addButton returns undefined for non-existent panel', () => {
    expect(pm.addButton('ghost-panel', { id: 'x' })).toBeUndefined();
  });

  it('getButton retrieves button from panel', () => {
    pm.addPanel({ id: 'gb-panel' });
    pm.addButton('gb-panel', { id: 'gb-btn', label: 'Get' });
    const btn = pm.getButton('gb-panel', 'gb-btn');
    expect(btn).toBeDefined();
    expect(btn.get('label')).toBe('Get');
  });

  it('getButton returns undefined for non-existent panel or button', () => {
    expect(pm.getButton('no-panel', 'no-btn')).toBeUndefined();
    pm.addPanel({ id: 'has-panel' });
    expect(pm.getButton('has-panel', 'no-btn')).toBeUndefined();
  });

  it('removeButton removes a button from a panel', () => {
    pm.addPanel({ id: 'rb-panel' });
    pm.addButton('rb-panel', { id: 'rb-btn', label: 'RM' });
    const removed = pm.removeButton('rb-panel', 'rb-btn');
    expect(removed).toBeDefined();
    expect(pm.getButton('rb-panel', 'rb-btn')).toBeUndefined();
  });

  it('render returns an HTMLElement', () => {
    pm.addPanel({ id: 'render-panel', content: 'Hello' });
    const el = pm.render();
    expect(el).toBeInstanceOf(HTMLElement);
    expect(el.classList.contains('pn-panels')).toBe(true);
  });

  it('render includes panel content', () => {
    pm.addPanel({ id: 'content-panel', content: '<span>Hi</span>' });
    const el = pm.render();
    const panelEl = el.querySelector('[data-panel-id="content-panel"]');
    expect(panelEl).not.toBeNull();
    expect(panelEl.innerHTML).toContain('Hi');
  });

  it('render skips invisible panels', () => {
    pm.addPanel({ id: 'visible-panel', visible: true });
    pm.addPanel({ id: 'hidden-panel', visible: false });
    const el = pm.render();
    expect(el.querySelector('[data-panel-id="visible-panel"]')).not.toBeNull();
    expect(el.querySelector('[data-panel-id="hidden-panel"]')).toBeNull();
  });

  it('render includes button elements in panels', () => {
    pm.addPanel({ id: 'btn-render-panel' });
    pm.addButton('btn-render-panel', { id: 'r-btn', label: 'Click' });
    const el = pm.render();
    const btnContainer = el.querySelector('.pn-buttons');
    expect(btnContainer).not.toBeNull();
    const btnEl = btnContainer.querySelector('[data-btn-id="r-btn"]');
    expect(btnEl).not.toBeNull();
  });
});
