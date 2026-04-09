/**
 * UndoManager - Module for undo/redo functionality
 *
 * Maintains a stack of undoable operations recorded from model changes.
 * Supports grouping multiple changes into single undo operations
 * via start()/stop().
 */

import { Module } from '../core/index.js';

export default class UndoManager extends Module {
  /**
   * @param {import('../editor/EditorModel.js').default} editor
   * @param {Object} [config={}]
   */
  constructor(editor, config = {}) {
    super(editor, config, {
      stylePrefix: 'um-',
      /** @type {number} Maximum number of undo steps */
      maximumStackLength: 50,
    });

    /** @type {Array<Object>} Stack of undoable operations */
    this._undoStack = [];

    /** @type {Array<Object>} Stack of redoable operations */
    this._redoStack = [];

    /** @type {boolean} Whether recording is active */
    this._tracking = true;

    /** @type {boolean} Whether we are currently applying an undo/redo */
    this._applying = false;

    /** @type {Object|null} Active group for batching changes */
    this._group = null;

    /** @type {number} Max stack size */
    this._maxStack = this.getConfig('maximumStackLength') || 50;

    this.onInit();
  }

  /**
   * Record a change as an undoable operation
   * @param {Object} operation
   * @param {string} operation.type - 'change' | 'add' | 'remove'
   * @param {Object} operation.model - The model that changed
   * @param {Object} [operation.before] - State before the change
   * @param {Object} [operation.after] - State after the change
   * @param {string} [operation.key] - Changed attribute key (for 'change' type)
   */
  record(operation) {
    if (!this._tracking || this._applying) return;

    const entry = {
      type: operation.type || 'change',
      model: operation.model,
      before: operation.before,
      after: operation.after,
      key: operation.key,
      timestamp: Date.now(),
    };

    if (this._group) {
      this._group.entries.push(entry);
    } else {
      this._push(entry);
    }
  }

  /**
   * Push an entry onto the undo stack
   * @private
   * @param {Object} entry
   */
  _push(entry) {
    this._undoStack.push(entry);

    // Enforce max stack size
    while (this._undoStack.length > this._maxStack) {
      this._undoStack.shift();
    }

    // Clear redo stack on new action
    this._redoStack = [];

    this._em?.trigger('undo:record', entry);
  }

  /**
   * Undo the last operation
   * @returns {Object|null} The undone operation
   */
  undo() {
    if (this._undoStack.length === 0) return null;

    const entry = this._undoStack.pop();
    this._applying = true;

    try {
      this._applyUndo(entry);
      this._redoStack.push(entry);
    } finally {
      this._applying = false;
    }

    this._em?.trigger('undo:undo', entry);
    this.trigger('undo', entry);
    return entry;
  }

  /**
   * Redo the last undone operation
   * @returns {Object|null} The redone operation
   */
  redo() {
    if (this._redoStack.length === 0) return null;

    const entry = this._redoStack.pop();
    this._applying = true;

    try {
      this._applyRedo(entry);
      this._undoStack.push(entry);
    } finally {
      this._applying = false;
    }

    this._em?.trigger('undo:redo', entry);
    this.trigger('redo', entry);
    return entry;
  }

  /**
   * Apply an undo operation (restore previous state)
   * @private
   * @param {Object} entry
   */
  _applyUndo(entry) {
    // Handle grouped operations
    if (entry.type === 'group') {
      // Undo in reverse order
      for (let i = entry.entries.length - 1; i >= 0; i--) {
        this._applyUndo(entry.entries[i]);
      }
      return;
    }

    const model = entry.model;
    if (!model) return;

    switch (entry.type) {
      case 'change':
        if (entry.key && model.set) {
          model.set(entry.key, entry.before, { silent: false, avoidStore: true });
        } else if (entry.before && model.set) {
          model.set(entry.before, { silent: false, avoidStore: true });
        }
        break;

      case 'add':
        // Undo an add = remove
        if (model.collection) {
          model.collection.remove(model, { silent: false });
        }
        break;

      case 'remove':
        // Undo a remove = add back
        if (entry.collection && entry.collection.add) {
          entry.collection.add(model, { silent: false, at: entry.index });
        }
        break;
    }
  }

  /**
   * Apply a redo operation (restore next state)
   * @private
   * @param {Object} entry
   */
  _applyRedo(entry) {
    if (entry.type === 'group') {
      for (const sub of entry.entries) {
        this._applyRedo(sub);
      }
      return;
    }

    const model = entry.model;
    if (!model) return;

    switch (entry.type) {
      case 'change':
        if (entry.key && model.set) {
          model.set(entry.key, entry.after, { silent: false, avoidStore: true });
        } else if (entry.after && model.set) {
          model.set(entry.after, { silent: false, avoidStore: true });
        }
        break;

      case 'add':
        // Redo an add = add again
        if (entry.collection && entry.collection.add) {
          entry.collection.add(model, { silent: false });
        }
        break;

      case 'remove':
        // Redo a remove = remove again
        if (model.collection) {
          model.collection.remove(model, { silent: false });
        }
        break;
    }
  }

  /**
   * Clear both undo and redo stacks
   * @returns {this}
   */
  clear() {
    this._undoStack = [];
    this._redoStack = [];
    this._group = null;
    this.trigger('clear');
    return this;
  }

  /**
   * Get the full undo stack
   * @returns {Object[]}
   */
  getStack() {
    return [...this._undoStack];
  }

  /**
   * Get the redo stack
   * @returns {Object[]}
   */
  getRedoStack() {
    return [...this._redoStack];
  }

  /**
   * Check if there are operations to undo
   * @returns {boolean}
   */
  hasUndo() {
    return this._undoStack.length > 0;
  }

  /**
   * Check if there are operations to redo
   * @returns {boolean}
   */
  hasRedo() {
    return this._redoStack.length > 0;
  }

  /**
   * Start grouping changes into a single undoable operation
   * All changes recorded between start() and stop() become one undo step
   * @returns {this}
   */
  start() {
    this._group = {
      type: 'group',
      entries: [],
      timestamp: Date.now(),
    };
    return this;
  }

  /**
   * Stop grouping and push the group as a single undo step
   * @returns {this}
   */
  stop() {
    if (this._group && this._group.entries.length > 0) {
      this._push(this._group);
    }
    this._group = null;
    return this;
  }

  /**
   * Pause undo tracking (changes won't be recorded)
   * @returns {this}
   */
  pause() {
    this._tracking = false;
    return this;
  }

  /**
   * Resume undo tracking
   * @returns {this}
   */
  resume() {
    this._tracking = true;
    return this;
  }

  /**
   * Check if tracking is active
   * @returns {boolean}
   */
  isTracking() {
    return this._tracking;
  }

  destroy() {
    this.clear();
    super.destroy();
  }
}
