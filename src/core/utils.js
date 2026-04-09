/**
 * Utility functions - replaces Underscore.js with native ES6+
 */

let _idCounter = 0;

/**
 * Generate a unique client-side ID
 * @param {string} [prefix='c']
 * @returns {string}
 */
export function createId(prefix = 'c') {
  return `${prefix}${++_idCounter}`;
}

/**
 * Deep merge objects (immutable)
 * @param {Object} target
 * @param {...Object} sources
 * @returns {Object}
 */
export function deepMerge(target, ...sources) {
  const result = { ...target };
  for (const source of sources) {
    if (!source) continue;
    for (const key of Object.keys(source)) {
      const val = source[key];
      if (isObject(val) && !Array.isArray(val) && isObject(result[key]) && !Array.isArray(result[key])) {
        result[key] = deepMerge(result[key], val);
      } else {
        result[key] = val;
      }
    }
  }
  return result;
}

/**
 * Shallow diff between two objects
 * @param {Object} a
 * @param {Object} b
 * @returns {Object} Changed keys with new values
 */
export function shallowDiff(a, b) {
  const result = {};
  const allKeys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
  for (const key of allKeys) {
    if (a[key] !== b[key]) {
      result[key] = b[key];
    }
  }
  return result;
}

/**
 * Check if object is empty
 * @param {any} obj
 * @returns {boolean}
 */
export function isEmptyObj(obj) {
  if (!obj) return true;
  return Object.keys(obj).length === 0;
}

/** @param {any} v @returns {v is string} */
export function isString(v) {
  return typeof v === 'string';
}

/** @param {any} v @returns {v is Function} */
export function isFunction(v) {
  return typeof v === 'function';
}

/** @param {any} v @returns {boolean} */
export function isObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

/** @param {any} v @returns {v is Array} */
export function isArray(v) {
  return Array.isArray(v);
}

/** @param {any} v @returns {boolean} */
export function isUndefined(v) {
  return typeof v === 'undefined';
}

/** @param {any} v @returns {boolean} */
export function isBoolean(v) {
  return typeof v === 'boolean';
}

/** @param {any} v @returns {boolean} */
export function isNumber(v) {
  return typeof v === 'number' && !isNaN(v);
}

/**
 * Get result of a property (call if function)
 * @param {Object} obj
 * @param {string} key
 * @returns {any}
 */
export function result(obj, key) {
  if (!obj) return undefined;
  const val = obj[key];
  return isFunction(val) ? val.call(obj) : val;
}

/**
 * Debounce a function
 * @param {Function} fn
 * @param {number} wait
 * @returns {Function}
 */
export function debounce(fn, wait = 0) {
  let timer = null;
  const debounced = function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn.apply(this, args);
    }, wait);
  };
  debounced.cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };
  return debounced;
}

/**
 * Throttle a function
 * @param {Function} fn
 * @param {number} wait
 * @returns {Function}
 */
export function throttle(fn, wait) {
  let lastTime = 0;
  let timer = null;
  return function (...args) {
    const now = Date.now();
    const remaining = wait - (now - lastTime);
    if (remaining <= 0) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      lastTime = now;
      fn.apply(this, args);
    } else if (!timer) {
      timer = setTimeout(() => {
        lastTime = Date.now();
        timer = null;
        fn.apply(this, args);
      }, remaining);
    }
  };
}

/**
 * Bind methods to object context
 * @param {Object} obj
 * @param {...string} methods
 */
export function bindAll(obj, ...methods) {
  for (const method of methods) {
    if (isFunction(obj[method])) {
      obj[method] = obj[method].bind(obj);
    }
  }
}

/**
 * Apply defaults to an object (doesn't overwrite existing values)
 * @param {Object} obj
 * @param {...Object} sources
 * @returns {Object}
 */
export function defaults(obj, ...sources) {
  for (const source of sources) {
    if (!source) continue;
    for (const key of Object.keys(source)) {
      if (obj[key] === undefined) {
        obj[key] = source[key];
      }
    }
  }
  return obj;
}

/**
 * Shallow clone an object
 * @param {Object} obj
 * @returns {Object}
 */
export function clone(obj) {
  if (isArray(obj)) return [...obj];
  if (isObject(obj)) return { ...obj };
  return obj;
}

/**
 * Escape HTML entities
 * @param {string} str
 * @returns {string}
 */
export function escapeHTML(str) {
  if (!str) return '';
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return str.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Convert string to camelCase
 * @param {string} str
 * @returns {string}
 */
export function camelCase(str) {
  return str.replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''));
}

/**
 * Convert string to kebab-case
 * @param {string} str
 * @returns {string}
 */
export function kebabCase(str) {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/**
 * Iterate over object or array
 * @param {Object|Array} obj
 * @param {Function} fn
 */
export function each(obj, fn) {
  if (isArray(obj)) {
    obj.forEach((v, i) => fn(v, i, obj));
  } else if (isObject(obj)) {
    Object.keys(obj).forEach(k => fn(obj[k], k, obj));
  }
}

/**
 * Check if element matches selector
 * @param {Element} el
 * @param {string} selector
 * @returns {boolean}
 */
export function matches(el, selector) {
  if (!el || !el.matches) return false;
  return el.matches(selector);
}

/**
 * Find closest ancestor matching selector
 * @param {Element} el
 * @param {string} selector
 * @returns {Element|null}
 */
export function closest(el, selector) {
  if (!el || !el.closest) return null;
  return el.closest(selector);
}

/**
 * Normalize styles object keys to camelCase
 * @param {Object} styles
 * @returns {Object}
 */
export function normalizeStyles(styles) {
  if (!styles) return {};
  const result = {};
  for (const [key, value] of Object.entries(styles)) {
    result[camelCase(key)] = value;
  }
  return result;
}

/**
 * Convert styles object to CSS string
 * @param {Object} styles
 * @returns {string}
 */
export function stylesToString(styles) {
  if (!styles || isEmptyObj(styles)) return '';
  return Object.entries(styles)
    .map(([k, v]) => `${kebabCase(k)}: ${v};`)
    .join(' ');
}

/**
 * Parse CSS string to styles object
 * @param {string} cssStr
 * @returns {Object}
 */
export function parseStyles(cssStr) {
  if (!cssStr) return {};
  const result = {};
  cssStr.split(';').forEach(pair => {
    const [prop, ...vals] = pair.split(':');
    const key = prop && prop.trim();
    const value = vals.join(':').trim();
    if (key && value) {
      result[key] = value;
    }
  });
  return result;
}

/**
 * Generate a short unique ID (for cid)
 * @returns {string}
 */
export function uniqueId() {
  return createId('c');
}

/**
 * No-op function
 */
export function noop() {}

/**
 * Remove element from array (mutates)
 * @template T
 * @param {T[]} arr
 * @param {T} item
 * @returns {T|undefined}
 */
export function removeFromArray(arr, item) {
  const idx = arr.indexOf(item);
  if (idx !== -1) {
    return arr.splice(idx, 1)[0];
  }
  return undefined;
}
