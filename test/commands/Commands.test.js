import { describe, it, expect, vi, beforeEach } from 'vitest';
import CommandAbstract from '../../src/commands/CommandAbstract.js';
import CommandsModule from '../../src/commands/index.js';

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
// CommandAbstract
// ---------------------------------------------------------------------------
describe('CommandAbstract', () => {
  it('should have a run method', () => {
    const cmd = new CommandAbstract();
    expect(typeof cmd.run).toBe('function');
  });

  it('should have a stop method', () => {
    const cmd = new CommandAbstract();
    expect(typeof cmd.stop).toBe('function');
  });

  it('should have a canRun method that returns true by default', () => {
    const cmd = new CommandAbstract();
    expect(cmd.canRun({})).toBe(true);
  });

  it('should accept config with id', () => {
    const cmd = new CommandAbstract({ id: 'my-cmd' });
    expect(cmd.id).toBe('my-cmd');
  });

  it('run returns undefined by default', () => {
    const cmd = new CommandAbstract();
    expect(cmd.run({}, {})).toBeUndefined();
  });

  it('stop returns undefined by default', () => {
    const cmd = new CommandAbstract();
    expect(cmd.stop({}, {})).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// CommandsModule
// ---------------------------------------------------------------------------
describe('CommandsModule', () => {
  let cm;
  let editor;

  beforeEach(() => {
    editor = createEditor();
    cm = new CommandsModule(editor);
  });

  it('should register default commands on construction', () => {
    expect(cm.has('core:copy')).toBe(true);
    expect(cm.has('core:paste')).toBe(true);
    expect(cm.has('core:delete')).toBe(true);
    expect(cm.has('core:preview')).toBe(true);
    expect(cm.has('core:fullscreen')).toBe(true);
    expect(cm.has('core:select-component')).toBe(true);
    expect(cm.has('core:export-template')).toBe(true);
  });

  it('should add a command with an id and CommandAbstract instance', () => {
    class MyCmd extends CommandAbstract {
      run() { return 'ran'; }
    }
    cm.add('my-cmd', new MyCmd());
    expect(cm.has('my-cmd')).toBe(true);
    expect(cm.get('my-cmd')).toBeDefined();
  });

  it('should get a command by id', () => {
    const cmd = { run: vi.fn() };
    cm.add('get-me', cmd);
    expect(cm.get('get-me')).toBe(cmd);
  });

  it('should return undefined for unknown command', () => {
    expect(cm.get('nonexistent')).toBeUndefined();
  });

  it('has returns true for existing command', () => {
    cm.add('exists', { run: vi.fn() });
    expect(cm.has('exists')).toBe(true);
  });

  it('has returns false for non-existing command', () => {
    expect(cm.has('nope')).toBe(false);
  });

  it('run executes the command run method', () => {
    const runFn = vi.fn(() => 42);
    cm.add('run-test', { run: runFn });
    const result = cm.run('run-test');
    expect(runFn).toHaveBeenCalled();
    expect(result).toBe(42);
  });

  it('stop executes the command stop method', () => {
    const stopFn = vi.fn(() => 'stopped');
    cm.add('stop-test', { run: vi.fn(), stop: stopFn });
    cm.run('stop-test');
    const result = cm.stop('stop-test');
    expect(stopFn).toHaveBeenCalled();
    expect(result).toBe('stopped');
  });

  it('isActive tracks running commands', () => {
    cm.add('active-test', { run: vi.fn(), stop: vi.fn() });
    expect(cm.isActive('active-test')).toBe(false);
    cm.run('active-test');
    expect(cm.isActive('active-test')).toBe(true);
    cm.stop('active-test');
    expect(cm.isActive('active-test')).toBe(false);
  });

  it('getActive returns active command IDs', () => {
    cm.add('ac1', { run: vi.fn(), stop: vi.fn() });
    cm.add('ac2', { run: vi.fn(), stop: vi.fn() });
    cm.run('ac1');
    cm.run('ac2');
    const active = cm.getActive();
    expect(active).toContain('ac1');
    expect(active).toContain('ac2');
  });

  it('should add a function shorthand as a command', () => {
    const fn = vi.fn(() => 'result');
    cm.add('fn-cmd', fn);
    expect(cm.has('fn-cmd')).toBe(true);
    // The function is wrapped as { run: fn }
    const result = cm.run('fn-cmd');
    expect(fn).toHaveBeenCalled();
    expect(result).toBe('result');
  });

  it('run passes options through to the command', () => {
    const runFn = vi.fn();
    cm.add('opts-test', { run: runFn });
    cm.run('opts-test', { myOption: 'hello' });
    expect(runFn).toHaveBeenCalledWith(
      expect.anything(), // editor
      null, // sender (default)
      expect.objectContaining({ myOption: 'hello' }),
    );
  });

  it('run returns undefined for non-existent command', () => {
    expect(cm.run('ghost')).toBeUndefined();
  });

  it('stop returns undefined for non-existent command', () => {
    expect(cm.stop('ghost')).toBeUndefined();
  });

  it('events fire on run', () => {
    const handler = vi.fn();
    cm.on('run', handler);
    cm.add('evt-run', { run: vi.fn() });
    cm.run('evt-run');
    expect(handler).toHaveBeenCalled();
    // First argument to 'run' event is the command id
    expect(handler.mock.calls[0][0]).toBe('evt-run');
  });

  it('events fire on stop', () => {
    const handler = vi.fn();
    cm.on('stop', handler);
    cm.add('evt-stop', { run: vi.fn(), stop: vi.fn() });
    cm.run('evt-stop');
    cm.stop('evt-stop');
    expect(handler).toHaveBeenCalled();
    expect(handler.mock.calls[0][0]).toBe('evt-stop');
  });

  it('getAll returns all registered commands as object', () => {
    const all = cm.getAll();
    expect(typeof all).toBe('object');
    // Should at least have the default commands
    expect(all['core:copy']).toBeDefined();
    expect(all['core:paste']).toBeDefined();
  });

  it('run respects canRun returning false', () => {
    const runFn = vi.fn();
    cm.add('no-run', { run: runFn, canRun: () => false });
    const result = cm.run('no-run');
    expect(runFn).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
  });

  it('run fires before events', () => {
    const beforeHandler = vi.fn();
    cm.on('run:before', beforeHandler);
    cm.add('before-test', { run: vi.fn() });
    cm.run('before-test');
    expect(beforeHandler).toHaveBeenCalled();
  });

  it('stop fires before events', () => {
    const beforeHandler = vi.fn();
    cm.on('stop:before', beforeHandler);
    cm.add('stop-before', { run: vi.fn(), stop: vi.fn() });
    cm.run('stop-before');
    cm.stop('stop-before');
    expect(beforeHandler).toHaveBeenCalled();
  });

  it('destroy clears all commands and active state', () => {
    cm.add('destroy-test', { run: vi.fn(), stop: vi.fn() });
    cm.run('destroy-test');
    cm.destroy();
    expect(cm.has('destroy-test')).toBe(false);
    expect(cm.getActive()).toHaveLength(0);
  });
});
