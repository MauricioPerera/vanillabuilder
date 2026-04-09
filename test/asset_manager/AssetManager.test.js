import { describe, it, expect, vi, beforeEach } from 'vitest';
import Asset from '../../src/asset_manager/model/Asset.js';
import AssetManager from '../../src/asset_manager/index.js';

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
// Asset Model
// ---------------------------------------------------------------------------
describe('Asset model', () => {
  it('should have correct defaults', () => {
    const asset = new Asset();
    expect(asset.get('type')).toBe('image');
    expect(asset.get('src')).toBe('');
    expect(asset.get('name')).toBe('');
    expect(asset.get('width')).toBe(0);
    expect(asset.get('height')).toBe(0);
    expect(asset.get('unitDim')).toBe('px');
    expect(asset.get('category')).toBe('');
  });

  it('should accept initial attributes', () => {
    const asset = new Asset({
      type: 'video',
      src: 'https://example.com/video.mp4',
      name: 'My Video',
      width: 1920,
      height: 1080,
    });
    expect(asset.get('type')).toBe('video');
    expect(asset.get('src')).toBe('https://example.com/video.mp4');
    expect(asset.get('width')).toBe(1920);
  });

  it('should use src as id when no explicit id is set', () => {
    const asset = new Asset({ src: 'https://example.com/image.png' });
    expect(asset.id).toBe('https://example.com/image.png');
  });

  it('getSrc returns the source URL', () => {
    const asset = new Asset({ src: 'https://example.com/photo.jpg' });
    expect(asset.getSrc()).toBe('https://example.com/photo.jpg');
  });

  it('getFilename returns name if set', () => {
    const asset = new Asset({ name: 'custom-name.png', src: 'https://example.com/abc.png' });
    expect(asset.getFilename()).toBe('custom-name.png');
  });

  it('getFilename extracts filename from src when no name', () => {
    const asset = new Asset({ src: 'https://cdn.example.com/images/photo.jpg?v=2' });
    expect(asset.getFilename()).toBe('photo.jpg');
  });

  it('getFilename returns empty string when no src or name', () => {
    const asset = new Asset();
    expect(asset.getFilename()).toBe('');
  });

  it('getExtension extracts file extension', () => {
    const asset = new Asset({ src: 'https://example.com/file.png' });
    expect(asset.getExtension()).toBe('png');
  });

  it('getExtension returns empty string when no extension', () => {
    const asset = new Asset({ name: 'noext' });
    expect(asset.getExtension()).toBe('');
  });

  it('isImage returns true for image type', () => {
    const asset = new Asset({ type: 'image' });
    expect(asset.isImage()).toBe(true);
  });

  it('isImage returns false for non-image type', () => {
    const asset = new Asset({ type: 'video' });
    expect(asset.isImage()).toBe(false);
  });

  it('getType returns the asset type via get()', () => {
    const asset = new Asset({ type: 'file' });
    expect(asset.get('type')).toBe('file');
  });
});

// ---------------------------------------------------------------------------
// AssetManager
// ---------------------------------------------------------------------------
describe('AssetManager', () => {
  let am;
  let editor;

  beforeEach(() => {
    editor = createEditor();
    am = new AssetManager(editor);
  });

  it('should add an asset from object', () => {
    const asset = am.add({ type: 'image', src: 'https://example.com/img.png' });
    expect(asset).toBeDefined();
    expect(asset.get('src')).toBe('https://example.com/img.png');
  });

  it('should add an asset from a URL string shorthand', () => {
    const asset = am.add('https://example.com/photo.jpg');
    expect(asset).toBeDefined();
    expect(asset.get('type')).toBe('image');
    expect(asset.get('src')).toBe('https://example.com/photo.jpg');
  });

  it('should get an asset by src (used as id)', () => {
    am.add({ src: 'https://example.com/a.png' });
    const found = am.get('https://example.com/a.png');
    expect(found).toBeDefined();
    expect(found.getSrc()).toBe('https://example.com/a.png');
  });

  it('should return undefined for unknown asset', () => {
    expect(am.get('https://nope.com/x.png')).toBeUndefined();
  });

  it('getAll returns all assets', () => {
    am.add('https://example.com/1.png');
    am.add('https://example.com/2.png');
    am.add('https://example.com/3.png');
    expect(am.getAll()).toHaveLength(3);
  });

  it('should remove an asset by src string', () => {
    am.add('https://example.com/remove-me.png');
    const removed = am.remove('https://example.com/remove-me.png');
    expect(removed).toBeDefined();
    expect(am.get('https://example.com/remove-me.png')).toBeUndefined();
  });

  it('should remove an asset by model reference', () => {
    const asset = am.add({ src: 'https://example.com/rm.png' });
    am.remove(asset);
    expect(am.get('https://example.com/rm.png')).toBeUndefined();
  });

  it('remove returns undefined for non-existent asset', () => {
    expect(am.remove('https://nope.com/x.png')).toBeUndefined();
  });

  it('storageKey is assets', () => {
    expect(am.storageKey).toBe('assets');
  });

  it('getProjectData includes assets under the storage key', () => {
    am.add({ src: 'https://example.com/proj.png', name: 'proj' });
    const data = am.getProjectData();
    expect(data).toHaveProperty('assets');
    expect(Array.isArray(data.assets)).toBe(true);
    expect(data.assets.length).toBe(1);
    expect(data.assets[0].src).toBe('https://example.com/proj.png');
  });

  it('loadProjectData restores assets from data', () => {
    const savedData = {
      assets: [
        { type: 'image', src: 'https://example.com/restored.png', name: 'Restored' },
        { type: 'image', src: 'https://example.com/second.png' },
      ],
    };
    am.loadProjectData(savedData);
    const all = am.getAll();
    expect(all.length).toBe(2);
    expect(am.get('https://example.com/restored.png')).toBeDefined();
  });

  it('getImages returns only image assets', () => {
    am.add({ type: 'image', src: 'https://example.com/img.png' });
    am.add({ type: 'video', src: 'https://example.com/vid.mp4' });
    am.add({ type: 'image', src: 'https://example.com/img2.png' });
    const images = am.getImages();
    expect(images).toHaveLength(2);
    expect(images.every(a => a.isImage())).toBe(true);
  });

  it('getByType filters by type', () => {
    am.add({ type: 'image', src: 'https://example.com/a.png' });
    am.add({ type: 'file', src: 'https://example.com/doc.pdf' });
    const files = am.getByType('file');
    expect(files).toHaveLength(1);
    expect(files[0].get('type')).toBe('file');
  });

  it('add array of assets', () => {
    const assets = am.add([
      { src: 'https://example.com/arr1.png' },
      { src: 'https://example.com/arr2.png' },
    ]);
    expect(Array.isArray(assets)).toBe(true);
    expect(assets).toHaveLength(2);
    expect(am.getAll()).toHaveLength(2);
  });

  it('collection fires add event when asset is added', () => {
    const handler = vi.fn();
    am.all.on('add', handler);
    am.add({ src: 'https://example.com/evt.png' });
    expect(handler).toHaveBeenCalled();
    const addedModel = handler.mock.calls[0][0];
    expect(addedModel.get('src')).toBe('https://example.com/evt.png');
  });

  it('collection fires remove event when asset is removed', () => {
    const handler = vi.fn();
    am.all.on('remove', handler);
    const asset = am.add({ src: 'https://example.com/evt-rm.png' });
    am.remove(asset);
    expect(handler).toHaveBeenCalled();
  });
});
