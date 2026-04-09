import { describe, it, expect, vi, beforeEach } from 'vitest';
import ComponentView from '../../src/dom_components/view/ComponentView.js';
import Component from '../../src/dom_components/model/Component.js';

/**
 * Helper: create a Component model with optional EditorModel-like emitter
 */
function createComponent(attrs = {}, opts = {}) {
  return new Component(attrs, opts);
}

/**
 * Helper: create a ComponentView, render it, and return { view, el }
 */
function renderView(attrs = {}, viewOpts = {}) {
  const model = createComponent(attrs);
  const view = new ComponentView({ model, ...viewOpts });
  view.render();
  return { view, el: view.el, model };
}

describe('ComponentView', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  // ── render() basics ──

  it('render() creates DOM element with correct tagName (default div)', () => {
    const { el } = renderView();
    expect(el).toBeInstanceOf(HTMLElement);
    expect(el.tagName).toBe('DIV');
  });

  it('render() creates element with custom tagName', () => {
    const { el } = renderView({ tagName: 'section' });
    expect(el.tagName).toBe('SECTION');
  });

  it('render() applies HTML attributes to element', () => {
    const { el } = renderView({
      attributes: { id: 'my-comp', title: 'A component', 'data-custom': 'value' },
    });
    expect(el.getAttribute('id')).toBe('my-comp');
    expect(el.getAttribute('title')).toBe('A component');
    expect(el.getAttribute('data-custom')).toBe('value');
  });

  it('render() applies CSS classes to element', () => {
    const { el } = renderView({ classes: ['alpha', 'beta'] });
    expect(el.classList.contains('alpha')).toBe(true);
    expect(el.classList.contains('beta')).toBe(true);
  });

  it('render() applies inline styles to element', () => {
    const { el } = renderView({ style: { color: 'red', 'font-size': '14px' } });
    expect(el.style.color).toBe('red');
    expect(el.style.fontSize).toBe('14px');
  });

  it('render() sets data-vb-type attribute', () => {
    const { el } = renderView({ type: 'text' });
    expect(el.getAttribute('data-vb-type')).toBe('text');
  });

  it('render() sets data-vb-type to "default" when type is empty', () => {
    const { el } = renderView({ type: '' });
    expect(el.getAttribute('data-vb-type')).toBe('default');
  });

  it('render() renders children recursively', () => {
    const { el } = renderView({
      tagName: 'ul',
      components: [
        { tagName: 'li', content: 'Item 1' },
        { tagName: 'li', content: 'Item 2' },
      ],
    });
    const items = el.querySelectorAll('li');
    expect(items.length).toBe(2);
    expect(items[0].innerHTML).toBe('Item 1');
    expect(items[1].innerHTML).toBe('Item 2');
  });

  it('render() stores __vbView reference on element', () => {
    const { view, el } = renderView();
    expect(el.__vbView).toBe(view);
  });

  it('render() stores __vbComponent reference on element', () => {
    const { el, model } = renderView();
    expect(el.__vbComponent).toBe(model);
  });

  it('render() sets rendered flag to true', () => {
    const { view } = renderView();
    expect(view.rendered).toBe(true);
  });

  // ── updateAttributes() ──

  it('updateAttributes() syncs model attributes to DOM', () => {
    const { view, el, model } = renderView({ attributes: { title: 'old' } });
    model.set('attributes', { title: 'new', 'aria-label': 'hello' });
    view.updateAttributes();
    expect(el.getAttribute('title')).toBe('new');
    expect(el.getAttribute('aria-label')).toBe('hello');
  });

  it('updateAttributes() removes attributes no longer in model', () => {
    const { view, el, model } = renderView({ attributes: { title: 'keep', role: 'button' } });
    expect(el.getAttribute('role')).toBe('button');
    model.set('attributes', { title: 'keep' }, { silent: true });
    view.updateAttributes();
    expect(el.getAttribute('role')).toBeNull();
  });

  it('updateAttributes() handles boolean true attribute (empty string)', () => {
    const { el } = renderView({ attributes: { disabled: true } });
    expect(el.hasAttribute('disabled')).toBe(true);
    expect(el.getAttribute('disabled')).toBe('');
  });

  // ── updateClasses() ──

  it('updateClasses() adds CSS classes from model', () => {
    const { view, el, model } = renderView();
    model.addClass('new-class');
    view.updateClasses();
    expect(el.classList.contains('new-class')).toBe(true);
  });

  it('updateClasses() removes classes no longer in model', () => {
    const { view, el, model } = renderView({ classes: ['keep', 'remove-me'] });
    expect(el.classList.contains('remove-me')).toBe(true);
    model.removeClass('remove-me');
    view.updateClasses();
    expect(el.classList.contains('remove-me')).toBe(false);
    expect(el.classList.contains('keep')).toBe(true);
  });

  // ── updateStyle() ──

  it('updateStyle() applies style changes from model', () => {
    const { view, el, model } = renderView();
    model.set('style', { 'background-color': 'blue', padding: '10px' });
    view.updateStyle();
    expect(el.style.backgroundColor).toBe('blue');
    expect(el.style.padding).toBe('10px');
  });

  it('updateStyle() clears previous styles before applying new', () => {
    const { view, el, model } = renderView({ style: { color: 'red' } });
    expect(el.style.color).toBe('red');
    model.set('style', { margin: '5px' }, { silent: true });
    view.updateStyle();
    expect(el.style.color).toBe('');
    expect(el.style.margin).toBe('5px');
  });

  // ── updateStatus() ──

  it('updateStatus() adds vb-selected class when status is selected', () => {
    const { view, el, model } = renderView();
    model.set('status', 'selected', { silent: true });
    view.updateStatus();
    expect(el.classList.contains('vb-selected')).toBe(true);
    expect(el.classList.contains('vb-hovered')).toBe(false);
  });

  it('updateStatus() adds vb-hovered class when status is hovered', () => {
    const { view, el, model } = renderView();
    model.set('status', 'hovered', { silent: true });
    view.updateStatus();
    expect(el.classList.contains('vb-hovered')).toBe(true);
    expect(el.classList.contains('vb-selected')).toBe(false);
  });

  it('updateStatus() removes all status classes when status is empty', () => {
    const { view, el, model } = renderView();
    model.set('status', 'selected', { silent: true });
    view.updateStatus();
    expect(el.classList.contains('vb-selected')).toBe(true);

    model.set('status', '', { silent: true });
    view.updateStatus();
    expect(el.classList.contains('vb-selected')).toBe(false);
    expect(el.classList.contains('vb-hovered')).toBe(false);
  });

  it('updateStatus() adds vb-no-pointer when locked', () => {
    const { view, el, model } = renderView();
    model.set('locked', true, { silent: true });
    view.updateStatus();
    expect(el.classList.contains('vb-no-pointer')).toBe(true);
  });

  // ── updateContent() ──

  it('updateContent() sets innerHTML from model content', () => {
    const { view, el, model } = renderView({ content: '<b>Bold</b>' });
    expect(el.innerHTML).toBe('<b>Bold</b>');
    model.set('content', '<i>Italic</i>', { silent: true });
    view.updateContent();
    expect(el.innerHTML).toBe('<i>Italic</i>');
  });

  // ── Model change listeners auto-trigger DOM updates ──

  it('model change:style triggers DOM style update', () => {
    const { el, model } = renderView();
    model.set('style', { color: 'green' });
    expect(el.style.color).toBe('green');
  });

  it('model change:classes triggers DOM class update', () => {
    const { el, model } = renderView();
    model.addClass('dynamic-class');
    // change:classes is triggered by addClass -> set('classes', ...)
    expect(el.classList.contains('dynamic-class')).toBe(true);
  });

  it('model change:status triggers DOM status update', () => {
    const { el, model } = renderView();
    model.set('status', 'selected');
    expect(el.classList.contains('vb-selected')).toBe(true);
  });

  it('model change:content triggers DOM content update', () => {
    const { el, model } = renderView();
    model.set('content', 'New content');
    expect(el.innerHTML).toBe('New content');
  });

  // ── remove() ──

  it('remove() cleans up DOM element and listeners', () => {
    const { view, model } = renderView();
    document.body.appendChild(view.el);
    expect(document.body.contains(view.el)).toBe(true);

    view.remove();
    expect(view.el).toBeNull();
    expect(view.rendered).toBe(false);
    expect(document.body.querySelector('[data-vb-type]')).toBeNull();
  });

  it('remove() clears __vbView and __vbComponent from element', () => {
    const { view } = renderView();
    const el = view.el;
    expect(el.__vbView).toBe(view);

    view.remove();
    expect(el.__vbView).toBeUndefined();
    expect(el.__vbComponent).toBeUndefined();
  });

  it('remove() unregisters view from model.views', () => {
    const { view, model } = renderView();
    expect(model.views).toContain(view);
    view.remove();
    expect(model.views).not.toContain(view);
  });

  it('remove() stops listening to model events (no DOM updates after removal)', () => {
    const { view, model } = renderView();
    const el = view.el;
    view.remove();
    // Changing the model after removal should not throw
    model.set('style', { color: 'red' });
    // el is detached and view.el is null, so the style won't change on the old el
    expect(view.el).toBeNull();
  });
});
