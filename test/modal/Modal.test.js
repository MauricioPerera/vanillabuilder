import { describe, it, expect, vi, beforeEach } from 'vitest';
import ModalModule from '../../src/modal/index.js';

describe('ModalModule', () => {
  let mockEditor;
  let modal;

  beforeEach(() => {
    mockEditor = {
      getConfig: (k) => k ? undefined : {},
      getModule: () => null,
      on: () => {},
      trigger: () => {},
      t: (k) => k,
    };
    modal = new ModalModule(mockEditor);
  });

  it('should start in closed state', () => {
    expect(modal.isOpen()).toBe(false);
  });

  it('should open and set state to open', () => {
    modal.open();
    expect(modal.isOpen()).toBe(true);
  });

  it('should close and set state to closed', () => {
    modal.open();
    modal.close();
    expect(modal.isOpen()).toBe(false);
  });

  it('should set and get title', () => {
    modal.setTitle('My Title');
    expect(modal.getTitle()).toBe('My Title');
  });

  it('should set and get string content', () => {
    modal.setContent('<p>Hello</p>');
    expect(modal.getContent()).toBe('<p>Hello</p>');
  });

  it('should accept title and content via open options', () => {
    modal.open({ title: 'Open Title', content: 'Open Content' });
    expect(modal.getTitle()).toBe('Open Title');
    expect(modal.getContent()).toBe('Open Content');
  });

  it('should trigger modal:open event', () => {
    const fn = vi.fn();
    modal.on('modal:open', fn);
    modal.open();
    expect(fn).toHaveBeenCalled();
  });

  it('should trigger modal:close event', () => {
    const fn = vi.fn();
    modal.on('modal:close', fn);
    modal.open();
    modal.close();
    expect(fn).toHaveBeenCalled();
  });

  it('should render and return an HTMLElement', () => {
    const el = modal.render();
    expect(el).toBeInstanceOf(HTMLElement);
    expect(el.tagName).toBe('DIV');
  });

  it('should render overlay initially hidden', () => {
    const el = modal.render();
    expect(el.style.display).toBe('none');
  });

  it('should show overlay after open when rendered', () => {
    modal.render();
    modal.open();
    expect(modal._overlayEl.style.display).toBe('');
  });

  it('should hide overlay after close when rendered', () => {
    modal.render();
    modal.open();
    modal.close();
    expect(modal._overlayEl.style.display).toBe('none');
  });

  it('should render title text in the title element', () => {
    modal.setTitle('Test Title');
    const el = modal.render();
    const titleEl = el.querySelector('[class*="modal-title"]');
    expect(titleEl.textContent).toBe('Test Title');
  });

  it('should render string content in the content element', () => {
    modal.setContent('<b>Bold</b>');
    const el = modal.render();
    const contentEl = el.querySelector('[class*="modal-content"]');
    expect(contentEl.innerHTML).toContain('<b>Bold</b>');
  });

  it('should update title element when setTitle called after render', () => {
    modal.render();
    modal.setTitle('Updated');
    expect(modal._titleEl.textContent).toBe('Updated');
  });

  it('should update content element when setContent called after render', () => {
    modal.render();
    modal.setContent('New content');
    expect(modal._contentEl.innerHTML).toBe('New content');
  });

  it('should render a close button', () => {
    const el = modal.render();
    const closeBtn = el.querySelector('button[class*="modal-close"]');
    expect(closeBtn).toBeDefined();
  });

  it('should set HTMLElement content', () => {
    const div = document.createElement('div');
    div.textContent = 'Custom element';
    modal.setContent(div);
    expect(modal.getContent()).toBe(div);
  });
});
