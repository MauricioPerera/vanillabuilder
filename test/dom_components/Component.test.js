import { describe, it, expect, vi } from 'vitest';
import Component, { Components } from '../../src/dom_components/model/Component.js';
import ComponentImage from '../../src/dom_components/model/ComponentImage.js';
import ComponentText from '../../src/dom_components/model/ComponentText.js';
import ComponentLink from '../../src/dom_components/model/ComponentLink.js';
import ComponentWrapper from '../../src/dom_components/model/ComponentWrapper.js';

describe('Component', () => {
  it('should create with default values', () => {
    const c = new Component();
    expect(c.get('tagName')).toBe('div');
    expect(c.get('type')).toBe('');
    expect(c.get('draggable')).toBe(true);
    expect(c.get('droppable')).toBe(true);
  });

  it('should create with custom attributes', () => {
    const c = new Component({
      tagName: 'span',
      type: 'custom',
      content: 'Hello',
    });
    expect(c.get('tagName')).toBe('span');
    expect(c.get('type')).toBe('custom');
    expect(c.get('content')).toBe('Hello');
  });

  it('should manage children components', () => {
    const parent = new Component({
      components: [
        { tagName: 'span', content: 'child1' },
        { tagName: 'p', content: 'child2' },
      ],
    });
    expect(parent.components().length).toBe(2);
    expect(parent.components().at(0).get('tagName')).toBe('span');
  });

  it('should set parent on children', () => {
    const parent = new Component();
    parent.append({ tagName: 'span' });
    const child = parent.components().at(0);
    expect(child.parent()).toBe(parent);
  });

  it('should manage CSS classes', () => {
    const c = new Component();
    c.addClass('foo bar');
    expect(c.getClasses()).toEqual(['foo', 'bar']);
    expect(c.hasClass('foo')).toBe(true);

    c.removeClass('foo');
    expect(c.hasClass('foo')).toBe(false);
    expect(c.getClasses()).toEqual(['bar']);
  });

  it('should manage inline styles', () => {
    const c = new Component();
    c.setStyle({ color: 'red', fontSize: '14px' });
    expect(c.getStyle()).toEqual({ color: 'red', fontSize: '14px' });

    c.addStyle({ background: 'blue' });
    expect(c.getStyle().background).toBe('blue');
    expect(c.getStyle().color).toBe('red');

    c.removeStyle('color');
    expect(c.getStyle().color).toBeUndefined();
  });

  it('should parse string styles', () => {
    const c = new Component({ style: 'color: red; font-size: 14px' });
    expect(c.get('style')).toEqual({ color: 'red', 'font-size': '14px' });
  });

  it('should manage HTML attributes', () => {
    const c = new Component({ attributes: { 'data-id': '123', role: 'button' } });
    const attrs = c.getAttributes();
    expect(attrs['data-id']).toBe('123');
    expect(attrs.role).toBe('button');
  });

  it('should manage ID', () => {
    const c = new Component();
    c.setId('my-component');
    expect(c.getId()).toBe('my-component');
  });

  it('should get traits', () => {
    const c = new Component({ traits: ['id', 'title'] });
    const traits = c.getTraits();
    expect(traits.length).toBe(2);
    expect(traits[0].name).toBe('id');
  });

  it('should find descendants', () => {
    const root = new Component({
      components: [
        {
          tagName: 'div', classes: ['box'],
          components: [{ tagName: 'span', classes: ['inner'] }],
        },
        { tagName: 'p', classes: ['text'] },
      ],
    });
    expect(root.find('.box').length).toBe(1);
    expect(root.find('.inner').length).toBe(1);
    expect(root.find('p').length).toBe(1);
  });

  it('should findType', () => {
    const root = new Component({
      components: [
        { type: 'text', tagName: 'p' },
        { type: 'image', tagName: 'img' },
        { type: 'text', tagName: 'span' },
      ],
    });
    // findType searches children by type attribute
    expect(root.findType('text').length).toBe(2);
    expect(root.findType('image').length).toBe(1);
    expect(root.findType('video').length).toBe(0);
  });

  it('should generate HTML', () => {
    const c = new Component({
      tagName: 'div',
      attributes: { id: 'main' },
      classes: ['container'],
      content: 'Hello World',
    });
    const html = c.toHTML();
    expect(html).toContain('<div');
    expect(html).toContain('id="main"');
    expect(html).toContain('class="container"');
    expect(html).toContain('Hello World');
    expect(html).toContain('</div>');
  });

  it('should generate HTML for void elements', () => {
    const c = new Component({ tagName: 'img', void: true, attributes: { src: 'test.jpg' } });
    const html = c.toHTML();
    expect(html).toContain('<img');
    expect(html).toContain('src="test.jpg"');
    expect(html).toContain('/>');
    expect(html).not.toContain('</img>');
  });

  it('should clone deeply', () => {
    const original = new Component({
      tagName: 'div',
      components: [{ tagName: 'span', content: 'child' }],
    });
    const cloned = original.clone();
    expect(cloned.get('tagName')).toBe('div');
    expect(cloned.components().length).toBe(1);
    expect(cloned.cid).not.toBe(original.cid);
  });

  it('should serialize to JSON', () => {
    const c = new Component({
      tagName: 'section',
      type: 'custom',
      classes: ['main'],
      components: [{ tagName: 'p', content: 'text' }],
    });
    const json = c.toJSON();
    expect(json.tagName).toBe('section');
    expect(json.type).toBe('custom');
    expect(json.components).toHaveLength(1);
    expect(json.components[0].tagName).toBe('p');
  });

  it('should remove from parent', () => {
    const parent = new Component({
      components: [{ tagName: 'span' }, { tagName: 'p' }],
    });
    const child = parent.components().at(0);
    child.remove();
    expect(parent.components().length).toBe(1);
    expect(child.parent()).toBeNull();
  });

  it('should check isChildOf', () => {
    const root = new Component({
      components: [{
        tagName: 'div',
        components: [{ tagName: 'span' }],
      }],
    });
    const div = root.components().at(0);
    const span = div.components().at(0);
    expect(span.isChildOf(div)).toBe(true);
    expect(span.isChildOf(root)).toBe(true);
    expect(div.isChildOf(span)).toBe(false);
  });
});

describe('ComponentImage', () => {
  it('should have image defaults', () => {
    const img = new ComponentImage();
    expect(img.get('type')).toBe('image');
    expect(img.get('tagName')).toBe('img');
    expect(img.get('void')).toBe(true);
  });

  it('should detect img elements', () => {
    const result = ComponentImage.isComponent({ tagName: 'IMG' });
    expect(result).toEqual({ type: 'image' });
  });
});

describe('ComponentText', () => {
  it('should have text defaults', () => {
    const t = new ComponentText();
    expect(t.get('type')).toBe('text');
    expect(t.get('editable')).toBe(true);
  });
});

describe('ComponentLink', () => {
  it('should have link defaults', () => {
    const l = new ComponentLink();
    expect(l.get('type')).toBe('link');
    expect(l.get('tagName')).toBe('a');
  });

  it('should have href trait', () => {
    const l = new ComponentLink();
    const hrefTrait = l.getTrait('href');
    expect(hrefTrait).toBeDefined();
  });
});

describe('ComponentWrapper', () => {
  it('should be a wrapper', () => {
    const w = new ComponentWrapper();
    expect(w.isWrapper()).toBe(true);
    expect(w.get('draggable')).toBe(false);
    expect(w.get('removable')).toBe(false);
  });
});
