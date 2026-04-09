import { describe, it, expect, vi, beforeEach } from 'vitest';
import LocalStorage from '../../src/storage_manager/LocalStorage.js';
import RemoteStorage from '../../src/storage_manager/RemoteStorage.js';
import StorageManager from '../../src/storage_manager/index.js';

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
// LocalStorage
// ---------------------------------------------------------------------------
describe('LocalStorage', () => {
  let ls;

  beforeEach(() => {
    localStorage.clear();
    ls = new LocalStorage({ key: 'test-prefix-' });
  });

  it('store saves data to localStorage', () => {
    const data = { components: '<div>Hello</div>', styles: '.a { color: red; }' };
    ls.store(data);
    const raw = localStorage.getItem('test-prefix-');
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw)).toEqual(data);
  });

  it('store returns the stored data', () => {
    const data = { key: 'value' };
    const result = ls.store(data);
    expect(result).toEqual(data);
  });

  it('load reads data from localStorage', () => {
    const data = { pages: [{ id: 'p1' }] };
    localStorage.setItem('test-prefix-', JSON.stringify(data));
    const loaded = ls.load();
    expect(loaded).toEqual(data);
  });

  it('load returns empty object when no data exists', () => {
    const loaded = ls.load();
    expect(loaded).toEqual({});
  });

  it('load handles invalid JSON gracefully', () => {
    localStorage.setItem('test-prefix-', 'not-json{{{');
    const loaded = ls.load();
    expect(loaded).toEqual({});
  });

  it('uses default key prefix when none provided', () => {
    const defaultLs = new LocalStorage();
    expect(defaultLs.key).toBe('vanillabuilder-');
  });

  it('store supports custom key via opts', () => {
    ls.store({ a: 1 }, { key: 'custom-key' });
    expect(localStorage.getItem('custom-key')).toBeTruthy();
    expect(localStorage.getItem('test-prefix-')).toBeNull();
  });

  it('load supports custom key via opts', () => {
    localStorage.setItem('custom-load-key', JSON.stringify({ b: 2 }));
    const loaded = ls.load({ key: 'custom-load-key' });
    expect(loaded).toEqual({ b: 2 });
  });

  it('remove deletes stored data', () => {
    ls.store({ x: 1 });
    expect(localStorage.getItem('test-prefix-')).toBeTruthy();
    ls.remove();
    expect(localStorage.getItem('test-prefix-')).toBeNull();
  });

  it('isAvailable returns true in jsdom', () => {
    expect(LocalStorage.isAvailable()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// RemoteStorage
// ---------------------------------------------------------------------------
describe('RemoteStorage', () => {
  let rs;

  beforeEach(() => {
    rs = new RemoteStorage({
      urlStore: 'https://api.example.com/store',
      urlLoad: 'https://api.example.com/load',
      headers: { 'X-Custom': 'test' },
    });
    vi.restoreAllMocks();
  });

  it('store calls fetch with POST method', async () => {
    const mockResponse = {
      ok: true,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({ success: true }),
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse);

    await rs.store({ components: '<div/>' });

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = globalThis.fetch.mock.calls[0];
    expect(url).toBe('https://api.example.com/store');
    expect(options.method).toBe('POST');
    expect(options.headers['Content-Type']).toBe('application/json');
    expect(options.headers['X-Custom']).toBe('test');
    expect(JSON.parse(options.body)).toEqual({ components: '<div/>' });
  });

  it('store throws on non-ok response', async () => {
    const mockResponse = {
      ok: false,
      status: 500,
      text: () => Promise.resolve('Server Error'),
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse);

    await expect(rs.store({ data: 'test' })).rejects.toThrow(/Store failed.*500/);
  });

  it('store throws when no URL is configured', async () => {
    const noUrlRs = new RemoteStorage();
    await expect(noUrlRs.store({ data: 'x' })).rejects.toThrow(/No store URL/);
  });

  it('load calls fetch with GET method', async () => {
    const mockResponse = {
      ok: true,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({ components: '<p>loaded</p>' }),
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse);

    const result = await rs.load();

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = globalThis.fetch.mock.calls[0];
    expect(url).toBe('https://api.example.com/load');
    expect(options.method).toBe('GET');
    expect(result).toEqual({ components: '<p>loaded</p>' });
  });

  it('load throws on non-ok response', async () => {
    const mockResponse = {
      ok: false,
      status: 404,
      text: () => Promise.resolve('Not Found'),
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse);

    await expect(rs.load()).rejects.toThrow(/Load failed.*404/);
  });

  it('load throws when no URL is configured', async () => {
    const noUrlRs = new RemoteStorage();
    await expect(noUrlRs.load()).rejects.toThrow(/No load URL/);
  });

  it('load appends params as query string', async () => {
    const rsWithParams = new RemoteStorage({
      urlLoad: 'https://api.example.com/load',
      params: { projectId: '123' },
    });
    const mockResponse = {
      ok: true,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({}),
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse);

    await rsWithParams.load();

    const [url] = globalThis.fetch.mock.calls[0];
    expect(url).toContain('projectId=123');
  });

  it('store returns empty object for non-JSON response', async () => {
    const mockResponse = {
      ok: true,
      headers: { get: () => 'text/plain' },
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse);

    const result = await rs.store({ data: 'x' });
    expect(result).toEqual({});
  });

  it('load returns empty object for non-JSON response', async () => {
    const mockResponse = {
      ok: true,
      headers: { get: () => 'text/html' },
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse);

    const result = await rs.load();
    expect(result).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// StorageManager
// ---------------------------------------------------------------------------
describe('StorageManager', () => {
  let sm;
  let editor;

  beforeEach(() => {
    localStorage.clear();
    editor = createEditor();
    sm = new StorageManager(editor);
  });

  it('registers local and remote storage by default', () => {
    expect(sm.get('local')).toBeDefined();
    expect(sm.get('remote')).toBeDefined();
  });

  it('default current type is local', () => {
    expect(sm.getCurrent()).toBe('local');
  });

  it('add registers a custom storage backend', () => {
    const custom = {
      store: vi.fn(),
      load: vi.fn(),
    };
    sm.add('custom', custom);
    expect(sm.get('custom')).toBe(custom);
  });

  it('add ignores invalid storage (no store/load)', () => {
    sm.add('bad', {});
    expect(sm.get('bad')).toBeUndefined();
  });

  it('get returns storage by type', () => {
    const local = sm.get('local');
    expect(local).toBeDefined();
    expect(typeof local.store).toBe('function');
    expect(typeof local.load).toBe('function');
  });

  it('get with no argument returns current storage', () => {
    const storage = sm.get();
    expect(storage).toBeDefined();
    expect(storage).toBe(sm.get('local'));
  });

  it('setCurrent switches active storage', () => {
    sm.setCurrent('remote');
    expect(sm.getCurrent()).toBe('remote');
    expect(sm.get()).toBe(sm.get('remote'));
  });

  it('setCurrent warns and does not switch for unknown type', () => {
    sm.setCurrent('nonexistent');
    expect(sm.getCurrent()).toBe('local'); // unchanged
  });

  it('store delegates to current storage (local)', async () => {
    const data = { components: '<div>test</div>' };
    await sm.store(data);
    const loaded = await sm.load();
    expect(loaded).toEqual(data);
  });

  it('load delegates to current storage (local)', async () => {
    localStorage.setItem('vanillabuilder-', JSON.stringify({ stored: true }));
    const result = await sm.load();
    expect(result).toEqual({ stored: true });
  });

  it('store fires storage events', async () => {
    const startHandler = vi.fn();
    const endHandler = vi.fn();
    sm.on('storage:start:store', startHandler);
    sm.on('storage:end:store', endHandler);

    await sm.store({ test: true });

    expect(startHandler).toHaveBeenCalled();
    expect(endHandler).toHaveBeenCalled();
  });

  it('load fires storage events', async () => {
    const startHandler = vi.fn();
    const endHandler = vi.fn();
    sm.on('storage:start:load', startHandler);
    sm.on('storage:end:load', endHandler);

    await sm.load();

    expect(startHandler).toHaveBeenCalled();
    expect(endHandler).toHaveBeenCalled();
  });

  it('getStorageTypes returns all registered type names', () => {
    const types = sm.getStorageTypes();
    expect(types).toContain('local');
    expect(types).toContain('remote');
  });

  it('isBusy returns false when idle', () => {
    expect(sm.isBusy()).toBe(false);
  });

  it('isAutosave returns true by default', () => {
    expect(sm.isAutosave()).toBe(true);
  });

  it('canAutoload returns true when autoload enabled and storage exists', () => {
    expect(sm.canAutoload()).toBe(true);
  });

  it('store with custom storage type via opts', async () => {
    const custom = {
      store: vi.fn(() => ({ saved: true })),
      load: vi.fn(),
    };
    sm.add('custom', custom);
    await sm.store({ data: 'x' }, { type: 'custom' });
    expect(custom.store).toHaveBeenCalled();
  });

  it('destroy clears storages and state', () => {
    sm.destroy();
    expect(sm.getStorageTypes()).toHaveLength(0);
    expect(sm.isBusy()).toBe(false);
  });
});
