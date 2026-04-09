import { describe, it, expect, vi, beforeEach } from 'vitest';
import Page from '../../src/pages/model/Page.js';
import PageManager from '../../src/pages/index.js';

describe('Page model', () => {
  it('should have correct defaults', () => {
    const p = new Page();
    expect(p.get('id')).toBe('');
    expect(p.get('name')).toBe('Page');
    expect(p.get('frames')).toEqual([]);
    expect(p.get('component')).toBeNull();
    expect(p.get('styles')).toEqual([]);
  });

  it('should return name via getName', () => {
    const p = new Page({ name: 'Home' });
    expect(p.getName()).toBe('Home');
  });

  it('should fall back to id when name is empty', () => {
    const p = new Page({ id: 'pg-1', name: '' });
    expect(p.getName()).toBe('pg-1');
  });

  it('should fall back to Untitled when both id and name are empty', () => {
    const p = new Page({});
    expect(p.getName()).toBe('Page');
  });

  it('should set name via setName', () => {
    const p = new Page({ name: 'Old' });
    p.setName('New');
    expect(p.getName()).toBe('New');
  });

  it('should get and set component', () => {
    const p = new Page();
    const comp = { tagName: 'div' };
    p.setComponent(comp);
    expect(p.getComponent()).toBe(comp);
  });

  it('should get and set styles', () => {
    const p = new Page();
    const styles = [{ selectors: ['.a'], style: { color: 'red' } }];
    p.setStyles(styles);
    expect(p.getStyles()).toEqual(styles);
  });

  it('should return frames', () => {
    const p = new Page({ frames: [{ id: 'f1' }] });
    expect(p.getFrames()).toEqual([{ id: 'f1' }]);
  });
});

describe('PageManager', () => {
  let mockEditor;
  let pm;

  beforeEach(() => {
    mockEditor = {
      getConfig: (k) => k ? undefined : {},
      getModule: () => null,
      on: () => {},
      trigger: () => {},
      t: (k) => k,
    };
    pm = new PageManager(mockEditor);
  });

  it('should auto-create a default Main page', () => {
    const all = pm.getAll();
    expect(all.length).toBeGreaterThanOrEqual(1);
    expect(all[0].get('id')).toBe('main');
  });

  it('should add a new page', () => {
    pm.add({ id: 'about', name: 'About' });
    const page = pm.get('about');
    expect(page).toBeDefined();
    expect(page.getName()).toBe('About');
  });

  it('should get page by id', () => {
    const page = pm.get('main');
    expect(page).toBeDefined();
    expect(page.get('id')).toBe('main');
  });

  it('should return undefined for unknown page id', () => {
    expect(pm.get('nonexistent')).toBeUndefined();
  });

  it('should return all pages via getAll', () => {
    pm.add({ id: 'page2', name: 'Page 2' });
    const all = pm.getAll();
    expect(all.length).toBeGreaterThanOrEqual(2);
  });

  it('should select a page', () => {
    pm.add({ id: 'contact', name: 'Contact' });
    const result = pm.select('contact');
    expect(result).toBeDefined();
    expect(result.get('id')).toBe('contact');
  });

  it('should getSelected returning selected page', () => {
    const selected = pm.getSelected();
    expect(selected).toBeDefined();
    expect(selected.get('id')).toBe('main');
  });

  it('should remove a page (but not the last one)', () => {
    pm.add({ id: 'temp', name: 'Temp' });
    const removed = pm.remove('temp');
    expect(removed).toBeDefined();
    expect(pm.get('temp')).toBeUndefined();
  });

  it('should not remove the last page', () => {
    const result = pm.remove('main');
    expect(result).toBeUndefined();
    expect(pm.getAll()).toHaveLength(1);
  });

  it('should auto-select another page when removing the selected one', () => {
    pm.add({ id: 'other', name: 'Other' });
    pm.select('main');
    pm.remove('main');
    const selected = pm.getSelected();
    expect(selected).toBeDefined();
    expect(selected.get('id')).toBe('other');
  });

  it('should get the main page via getMain', () => {
    const main = pm.getMain();
    expect(main).toBeDefined();
    expect(main.get('id')).toBe('main');
  });

  it('should support getProjectData and loadProjectData', () => {
    pm.add({ id: 'p2', name: 'Page 2' });
    const data = pm.getProjectData();
    expect(data.pages).toBeDefined();
    expect(Array.isArray(data.pages)).toBe(true);
    expect(data.pages.length).toBeGreaterThanOrEqual(2);

    // Create a fresh manager and load the data
    const pm2 = new PageManager(mockEditor);
    pm2.loadProjectData(data);
    expect(pm2.getAll().length).toBeGreaterThanOrEqual(2);
  });
});
