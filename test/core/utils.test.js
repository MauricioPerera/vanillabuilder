import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createId,
  deepMerge,
  shallowDiff,
  isEmptyObj,
  isString,
  isFunction,
  isObject,
  isArray,
  isUndefined,
  isBoolean,
  isNumber,
  result,
  debounce,
  throttle,
  bindAll,
  defaults,
  clone,
  escapeHTML,
  camelCase,
  kebabCase,
  each,
  stylesToString,
  parseStyles,
  removeFromArray,
} from '../../src/core/utils.js';

// ── createId ──

describe('createId', () => {
  it('returns a string', () => {
    expect(typeof createId()).toBe('string');
  });

  it('returns unique values on successive calls', () => {
    const a = createId();
    const b = createId();
    expect(a).not.toBe(b);
  });

  it('uses default prefix "c"', () => {
    expect(createId()).toMatch(/^c\d+$/);
  });

  it('accepts a custom prefix', () => {
    const id = createId('comp');
    expect(id).toMatch(/^comp\d+$/);
  });
});

// ── deepMerge ──

describe('deepMerge', () => {
  it('merges flat objects', () => {
    expect(deepMerge({ a: 1 }, { b: 2 })).toEqual({ a: 1, b: 2 });
  });

  it('overwrites same keys', () => {
    expect(deepMerge({ a: 1 }, { a: 2 })).toEqual({ a: 2 });
  });

  it('merges nested objects recursively', () => {
    const target = { a: { x: 1, y: 2 } };
    const source = { a: { y: 3, z: 4 } };
    expect(deepMerge(target, source)).toEqual({ a: { x: 1, y: 3, z: 4 } });
  });

  it('does not mutate the original target', () => {
    const target = { a: 1, nested: { x: 1 } };
    const copy = { ...target };
    deepMerge(target, { b: 2, nested: { y: 2 } });
    expect(target).toEqual(copy);
  });

  it('handles multiple sources', () => {
    expect(deepMerge({ a: 1 }, { b: 2 }, { c: 3 })).toEqual({ a: 1, b: 2, c: 3 });
  });

  it('skips null/undefined sources', () => {
    expect(deepMerge({ a: 1 }, null, undefined, { b: 2 })).toEqual({ a: 1, b: 2 });
  });

  it('replaces arrays instead of merging them', () => {
    expect(deepMerge({ a: [1, 2] }, { a: [3] })).toEqual({ a: [3] });
  });
});

// ── shallowDiff ──

describe('shallowDiff', () => {
  it('returns changed keys with new values', () => {
    expect(shallowDiff({ a: 1, b: 2 }, { a: 1, b: 3 })).toEqual({ b: 3 });
  });

  it('returns empty object when objects are identical', () => {
    expect(shallowDiff({ a: 1 }, { a: 1 })).toEqual({});
  });

  it('detects added keys', () => {
    expect(shallowDiff({ a: 1 }, { a: 1, b: 2 })).toEqual({ b: 2 });
  });

  it('detects removed keys (value becomes undefined)', () => {
    const diff = shallowDiff({ a: 1, b: 2 }, { a: 1 });
    expect(diff).toEqual({ b: undefined });
  });

  it('handles empty objects', () => {
    expect(shallowDiff({}, { a: 1 })).toEqual({ a: 1 });
    expect(shallowDiff({ a: 1 }, {})).toEqual({ a: undefined });
  });
});

// ── isEmptyObj ──

describe('isEmptyObj', () => {
  it('returns true for empty object', () => {
    expect(isEmptyObj({})).toBe(true);
  });

  it('returns true for null', () => {
    expect(isEmptyObj(null)).toBe(true);
  });

  it('returns true for undefined', () => {
    expect(isEmptyObj(undefined)).toBe(true);
  });

  it('returns false for non-empty object', () => {
    expect(isEmptyObj({ a: 1 })).toBe(false);
  });

  it('returns true for zero (falsy)', () => {
    expect(isEmptyObj(0)).toBe(true);
  });

  it('returns true for empty string (falsy)', () => {
    expect(isEmptyObj('')).toBe(true);
  });
});

// ── Type checks ──

describe('type check functions', () => {
  describe('isString', () => {
    it('returns true for strings', () => {
      expect(isString('hello')).toBe(true);
      expect(isString('')).toBe(true);
    });
    it('returns false for non-strings', () => {
      expect(isString(123)).toBe(false);
      expect(isString(null)).toBe(false);
      expect(isString(undefined)).toBe(false);
    });
  });

  describe('isFunction', () => {
    it('returns true for functions', () => {
      expect(isFunction(() => {})).toBe(true);
      expect(isFunction(function() {})).toBe(true);
    });
    it('returns false for non-functions', () => {
      expect(isFunction('string')).toBe(false);
      expect(isFunction(null)).toBe(false);
    });
  });

  describe('isObject', () => {
    it('returns true for plain objects', () => {
      expect(isObject({})).toBe(true);
      expect(isObject({ a: 1 })).toBe(true);
    });
    it('returns false for arrays', () => {
      expect(isObject([])).toBe(false);
    });
    it('returns false for null', () => {
      expect(isObject(null)).toBe(false);
    });
    it('returns false for primitives', () => {
      expect(isObject(42)).toBe(false);
      expect(isObject('str')).toBe(false);
    });
  });

  describe('isArray', () => {
    it('returns true for arrays', () => {
      expect(isArray([])).toBe(true);
      expect(isArray([1, 2])).toBe(true);
    });
    it('returns false for non-arrays', () => {
      expect(isArray({})).toBe(false);
      expect(isArray('str')).toBe(false);
      expect(isArray(null)).toBe(false);
    });
  });

  describe('isUndefined', () => {
    it('returns true for undefined', () => {
      expect(isUndefined(undefined)).toBe(true);
    });
    it('returns false for null and other values', () => {
      expect(isUndefined(null)).toBe(false);
      expect(isUndefined(0)).toBe(false);
      expect(isUndefined('')).toBe(false);
    });
  });

  describe('isBoolean', () => {
    it('returns true for booleans', () => {
      expect(isBoolean(true)).toBe(true);
      expect(isBoolean(false)).toBe(true);
    });
    it('returns false for non-booleans', () => {
      expect(isBoolean(0)).toBe(false);
      expect(isBoolean('true')).toBe(false);
      expect(isBoolean(null)).toBe(false);
    });
  });

  describe('isNumber', () => {
    it('returns true for numbers', () => {
      expect(isNumber(42)).toBe(true);
      expect(isNumber(0)).toBe(true);
      expect(isNumber(-3.14)).toBe(true);
    });
    it('returns false for NaN', () => {
      expect(isNumber(NaN)).toBe(false);
    });
    it('returns false for non-numbers', () => {
      expect(isNumber('42')).toBe(false);
      expect(isNumber(null)).toBe(false);
    });
  });
});

// ── result ──

describe('result', () => {
  it('returns a plain value', () => {
    expect(result({ name: 'test' }, 'name')).toBe('test');
  });

  it('calls a function and returns its result', () => {
    const obj = { name() { return 'called'; } };
    expect(result(obj, 'name')).toBe('called');
  });

  it('returns undefined for missing key', () => {
    expect(result({ a: 1 }, 'b')).toBeUndefined();
  });

  it('returns undefined for null/undefined object', () => {
    expect(result(null, 'a')).toBeUndefined();
    expect(result(undefined, 'a')).toBeUndefined();
  });

  it('binds the function to the object as context', () => {
    const obj = {
      val: 42,
      getVal() { return this.val; },
    };
    expect(result(obj, 'getVal')).toBe(42);
  });
});

// ── debounce ──

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('delays function execution', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    debounced();
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('resets the timer on repeated calls', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    debounced();
    vi.advanceTimersByTime(50);
    debounced();
    vi.advanceTimersByTime(50);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('passes arguments to the debounced function', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    debounced('a', 'b');
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledWith('a', 'b');
  });

  it('supports cancel()', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    debounced();
    debounced.cancel();
    vi.advanceTimersByTime(200);
    expect(fn).not.toHaveBeenCalled();
  });
});

// ── throttle ──

describe('throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('executes immediately on first call', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);
    throttled();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('suppresses calls within the wait period', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);
    throttled();
    throttled();
    throttled();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('executes trailing call after wait period', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);
    throttled();
    throttled(); // trailing
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

// ── bindAll ──

describe('bindAll', () => {
  it('binds specified methods to the object', () => {
    const obj = {
      name: 'test',
      getName() { return this.name; },
      getUpper() { return this.name.toUpperCase(); },
    };
    bindAll(obj, 'getName', 'getUpper');
    const { getName, getUpper } = obj;
    expect(getName()).toBe('test');
    expect(getUpper()).toBe('TEST');
  });

  it('ignores non-function properties', () => {
    const obj = { a: 1 };
    expect(() => bindAll(obj, 'a')).not.toThrow();
  });
});

// ── defaults ──

describe('defaults', () => {
  it('applies defaults for missing keys', () => {
    const obj = { a: 1 };
    defaults(obj, { a: 99, b: 2 });
    expect(obj).toEqual({ a: 1, b: 2 });
  });

  it('does not overwrite existing values', () => {
    const obj = { color: 'red' };
    defaults(obj, { color: 'blue', size: 10 });
    expect(obj.color).toBe('red');
  });

  it('handles multiple source objects', () => {
    const obj = {};
    defaults(obj, { a: 1 }, { b: 2 }, { c: 3 });
    expect(obj).toEqual({ a: 1, b: 2, c: 3 });
  });

  it('skips null/undefined sources', () => {
    const obj = { a: 1 };
    expect(() => defaults(obj, null, undefined)).not.toThrow();
    expect(obj).toEqual({ a: 1 });
  });
});

// ── clone ──

describe('clone', () => {
  it('shallow clones an object', () => {
    const orig = { a: 1, b: { c: 2 } };
    const cloned = clone(orig);
    expect(cloned).toEqual(orig);
    expect(cloned).not.toBe(orig);
    // Shallow: nested ref is same
    expect(cloned.b).toBe(orig.b);
  });

  it('shallow clones an array', () => {
    const orig = [1, 2, 3];
    const cloned = clone(orig);
    expect(cloned).toEqual(orig);
    expect(cloned).not.toBe(orig);
  });

  it('returns primitives as-is', () => {
    expect(clone(42)).toBe(42);
    expect(clone('str')).toBe('str');
    expect(clone(null)).toBe(null);
  });
});

// ── escapeHTML ──

describe('escapeHTML', () => {
  it('escapes ampersands', () => {
    expect(escapeHTML('a & b')).toBe('a &amp; b');
  });

  it('escapes angle brackets', () => {
    expect(escapeHTML('<div>')).toBe('&lt;div&gt;');
  });

  it('escapes quotes', () => {
    expect(escapeHTML('"hello" \'world\'')).toBe('&quot;hello&quot; &#39;world&#39;');
  });

  it('escapes all special characters together', () => {
    expect(escapeHTML('<a href="x">&</a>')).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;');
  });

  it('returns empty string for falsy input', () => {
    expect(escapeHTML('')).toBe('');
    expect(escapeHTML(null)).toBe('');
    expect(escapeHTML(undefined)).toBe('');
  });
});

// ── camelCase ──

describe('camelCase', () => {
  it('converts kebab-case to camelCase', () => {
    expect(camelCase('font-size')).toBe('fontSize');
  });

  it('converts multi-word kebab', () => {
    expect(camelCase('background-image-url')).toBe('backgroundImageUrl');
  });

  it('handles already camelCase input', () => {
    expect(camelCase('fontSize')).toBe('fontSize');
  });

  it('handles underscores', () => {
    expect(camelCase('my_var_name')).toBe('myVarName');
  });
});

// ── kebabCase ──

describe('kebabCase', () => {
  it('converts camelCase to kebab-case', () => {
    expect(kebabCase('fontSize')).toBe('font-size');
  });

  it('converts multi-word camelCase', () => {
    expect(kebabCase('backgroundImageUrl')).toBe('background-image-url');
  });

  it('handles already kebab-case input', () => {
    expect(kebabCase('font-size')).toBe('font-size');
  });

  it('handles spaces and underscores', () => {
    expect(kebabCase('my var_name')).toBe('my-var-name');
  });
});

// ── each ──

describe('each', () => {
  it('iterates over an array', () => {
    const results = [];
    each([10, 20, 30], (v, i) => results.push([v, i]));
    expect(results).toEqual([[10, 0], [20, 1], [30, 2]]);
  });

  it('iterates over an object', () => {
    const results = [];
    each({ a: 1, b: 2 }, (v, k) => results.push([k, v]));
    expect(results).toEqual([['a', 1], ['b', 2]]);
  });

  it('does nothing for non-iterable values', () => {
    const fn = vi.fn();
    each(null, fn);
    each(undefined, fn);
    each(42, fn);
    expect(fn).not.toHaveBeenCalled();
  });
});

// ── stylesToString ──

describe('stylesToString', () => {
  it('converts style object to CSS string', () => {
    const result = stylesToString({ color: 'red' });
    expect(result).toBe('color: red;');
  });

  it('handles multiple properties', () => {
    const result = stylesToString({ color: 'red', fontSize: '14px' });
    expect(result).toContain('color: red;');
    expect(result).toContain('font-size: 14px;');
  });

  it('converts camelCase keys to kebab-case', () => {
    const result = stylesToString({ backgroundColor: 'blue' });
    expect(result).toContain('background-color: blue;');
  });

  it('returns empty string for empty/null/undefined', () => {
    expect(stylesToString({})).toBe('');
    expect(stylesToString(null)).toBe('');
    expect(stylesToString(undefined)).toBe('');
  });
});

// ── parseStyles ──

describe('parseStyles', () => {
  it('parses a CSS string into an object', () => {
    const result = parseStyles('color: red; font-size: 14px');
    expect(result).toEqual({ color: 'red', 'font-size': '14px' });
  });

  it('handles trailing semicolons', () => {
    const result = parseStyles('color: red;');
    expect(result).toEqual({ color: 'red' });
  });

  it('handles values with colons (e.g. URLs)', () => {
    const result = parseStyles('background: url(http://example.com)');
    expect(result).toEqual({ background: 'url(http://example.com)' });
  });

  it('returns empty object for falsy input', () => {
    expect(parseStyles('')).toEqual({});
    expect(parseStyles(null)).toEqual({});
    expect(parseStyles(undefined)).toEqual({});
  });
});

// ── removeFromArray ──

describe('removeFromArray', () => {
  it('removes an item from the array and returns it', () => {
    const arr = [1, 2, 3];
    const removed = removeFromArray(arr, 2);
    expect(removed).toBe(2);
    expect(arr).toEqual([1, 3]);
  });

  it('mutates the original array', () => {
    const arr = ['a', 'b', 'c'];
    removeFromArray(arr, 'b');
    expect(arr).toEqual(['a', 'c']);
  });

  it('returns undefined when item is not found', () => {
    const arr = [1, 2, 3];
    expect(removeFromArray(arr, 99)).toBeUndefined();
    expect(arr).toEqual([1, 2, 3]);
  });

  it('removes only the first occurrence', () => {
    const arr = [1, 2, 2, 3];
    removeFromArray(arr, 2);
    expect(arr).toEqual([1, 2, 3]);
  });
});
