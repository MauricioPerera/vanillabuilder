/**
 * EventEmitter - Custom event system replacing Backbone.Events
 *
 * Features:
 * - Namespaced events ('component:update:style')
 * - Catch-all 'all' event
 * - Context binding
 * - listenTo/stopListening for automatic cleanup
 * - once() for one-time handlers
 *
 * @example
 * const emitter = new EventEmitter();
 * emitter.on('change', (val) => console.log(val));
 * emitter.trigger('change', 42);
 */

let _listenerId = 0;

export default class EventEmitter {
  constructor() {
    /** @type {Map<string, Array<{callback: Function, context: any, once: boolean, listenerId?: number}>>} */
    this._events = new Map();

    /** @type {Map<number, {obj: EventEmitter, event: string, callback: Function}>} */
    this._listeningTo = new Map();

    /** @type {number} */
    this._listenerId = ++_listenerId;
  }

  /**
   * Register an event handler
   * @param {string} event - Event name(s), space-separated for multiple
   * @param {Function} callback
   * @param {any} [context] - Context for callback
   * @returns {this}
   */
  on(event, callback, context) {
    if (!callback) return this;
    const events = event.split(/\s+/);
    for (const evt of events) {
      if (!evt) continue;
      let handlers = this._events.get(evt);
      if (!handlers) {
        handlers = [];
        this._events.set(evt, handlers);
      }
      handlers.push({ callback, context: context || this, once: false });
    }
    return this;
  }

  /**
   * Register a one-time event handler
   * @param {string} event
   * @param {Function} callback
   * @param {any} [context]
   * @returns {this}
   */
  once(event, callback, context) {
    if (!callback) return this;
    const events = event.split(/\s+/);
    for (const evt of events) {
      if (!evt) continue;
      let handlers = this._events.get(evt);
      if (!handlers) {
        handlers = [];
        this._events.set(evt, handlers);
      }
      handlers.push({ callback, context: context || this, once: true });
    }
    return this;
  }

  /**
   * Remove event handler(s)
   * @param {string} [event] - Event name. If omitted, removes all handlers
   * @param {Function} [callback] - Specific callback. If omitted, removes all for event
   * @param {any} [context] - Specific context
   * @returns {this}
   */
  off(event, callback, context) {
    if (!event) {
      this._events.clear();
      return this;
    }

    const events = event.split(/\s+/);
    for (const evt of events) {
      if (!evt) continue;
      if (!callback && !context) {
        this._events.delete(evt);
        continue;
      }
      const handlers = this._events.get(evt);
      if (!handlers) continue;

      const remaining = handlers.filter(h => {
        if (callback && context) return h.callback !== callback || h.context !== context;
        if (callback) return h.callback !== callback;
        return h.context !== context;
      });

      if (remaining.length) {
        this._events.set(evt, remaining);
      } else {
        this._events.delete(evt);
      }
    }
    return this;
  }

  /**
   * Trigger event(s)
   * @param {string} event - Event name(s), space-separated
   * @param {...any} args - Arguments to pass to handlers
   * @returns {this}
   */
  trigger(event, ...args) {
    const events = event.split(/\s+/);
    for (const evt of events) {
      if (!evt) continue;
      this._triggerSingle(evt, args);

      // Trigger 'all' catch-all handlers
      if (evt !== 'all') {
        this._triggerSingle('all', [evt, ...args]);
      }
    }
    return this;
  }

  /**
   * @private
   * @param {string} event
   * @param {any[]} args
   */
  _triggerSingle(event, args) {
    const handlers = this._events.get(event);
    if (!handlers || handlers.length === 0) return;

    // Copy array to handle modifications during iteration
    const snapshot = [...handlers];
    const toRemove = [];

    for (let i = 0; i < snapshot.length; i++) {
      const handler = snapshot[i];
      handler.callback.apply(handler.context, args);
      if (handler.once) {
        toRemove.push(handler);
      }
    }

    // Remove once handlers
    if (toRemove.length) {
      const current = this._events.get(event);
      if (current) {
        const filtered = current.filter(h => !toRemove.includes(h));
        if (filtered.length) {
          this._events.set(event, filtered);
        } else {
          this._events.delete(event);
        }
      }
    }
  }

  /**
   * Listen to events on another EventEmitter
   * Automatically tracks the listener for cleanup via stopListening
   * @param {EventEmitter} other
   * @param {string} event
   * @param {Function} callback
   * @returns {this}
   */
  listenTo(other, event, callback) {
    if (!other || !event || !callback) return this;
    const id = ++_listenerId;
    const bound = callback.bind(this);
    bound._originalCallback = callback;
    bound._listenerId = id;

    this._listeningTo.set(id, { obj: other, event, callback: bound });
    other.on(event, bound, this);
    return this;
  }

  /**
   * Listen once to events on another EventEmitter
   * @param {EventEmitter} other
   * @param {string} event
   * @param {Function} callback
   * @returns {this}
   */
  listenToOnce(other, event, callback) {
    if (!other || !event || !callback) return this;
    const id = ++_listenerId;
    const bound = callback.bind(this);
    bound._originalCallback = callback;
    bound._listenerId = id;

    this._listeningTo.set(id, { obj: other, event, callback: bound });
    other.once(event, bound, this);
    return this;
  }

  /**
   * Stop listening to events on other emitters
   * @param {EventEmitter} [other] - Specific emitter. If omitted, stop all
   * @param {string} [event] - Specific event
   * @param {Function} [callback] - Specific callback
   * @returns {this}
   */
  stopListening(other, event, callback) {
    const toRemove = [];

    for (const [id, entry] of this._listeningTo) {
      const matchObj = !other || entry.obj === other;
      const matchEvt = !event || entry.event === event;
      const matchCb = !callback || entry.callback._originalCallback === callback;

      if (matchObj && matchEvt && matchCb) {
        entry.obj.off(entry.event, entry.callback, this);
        toRemove.push(id);
      }
    }

    for (const id of toRemove) {
      this._listeningTo.delete(id);
    }

    return this;
  }

  /**
   * Check if the emitter has handlers for a given event
   * @param {string} event
   * @returns {boolean}
   */
  hasListeners(event) {
    const handlers = this._events.get(event);
    return !!(handlers && handlers.length);
  }

  /**
   * Remove all event handlers and listening references
   */
  destroy() {
    this.stopListening();
    this._events.clear();
    this._listeningTo.clear();
  }
}
