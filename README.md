# VanillaBuilder

A **zero-dependency** web builder framework built entirely with **vanilla ES6+ JavaScript**. Cleanroom reimplementation of GrapesJS architecture without Backbone.js, jQuery, Underscore, or any runtime dependency.

![Tests](https://img.shields.io/badge/tests-822%20passing-brightgreen)
![Dependencies](https://img.shields.io/badge/dependencies-0-blue)
![Size](https://img.shields.io/badge/source-~13K%20lines-orange)
![License](https://img.shields.io/badge/license-MIT-green)

## Why VanillaBuilder?

| Legacy Stack (GrapesJS) | Modern Stack (VanillaBuilder) |
|---|---|
| Backbone.js Models | `ReactiveModel` (Proxy + EventEmitter) |
| Backbone.js Collections | `ReactiveCollection` (reactive arrays) |
| Backbone.js Views | `ComponentView` (native DOM API) |
| Backbone.js Events | Custom `EventEmitter` |
| Underscore.js | Native ES6+ methods |
| jQuery / cash-dom | `querySelector`, `classList`, etc. |
| backbone-undo | Custom `UndoManager` |
| SCSS + Webpack | Pure CSS + Rollup |

**Result**: Zero dependencies, smaller bundle, modern JavaScript, same powerful architecture.

## Quick Start

### Browser (ESM)

```html
<script type="module">
  import vanillabuilder from './src/index.js';

  const editor = vanillabuilder.init({
    container: '#editor',
    components: '<div>Hello World</div>',
  });
</script>
```

### npm

```bash
npm install vanillabuilder
```

```js
import vanillabuilder from 'vanillabuilder';

const editor = vanillabuilder.init({
  container: '#editor',
  components: '<h1>Hello World</h1>',
  style: '.my-class { color: red; }',
});
```

## Features

- **Drag & Drop Editor** - Visual page builder with block palette
- **21 Modules** - Full-featured modular architecture
- **20+ Component Types** - Text, Image, Video, Link, Table, SVG, Form elements, and more
- **Style Manager** - Visual CSS property editor with 6 sectors and 50+ properties
- **Plugin System** - Extensible with custom plugins
- **Multi-page Support** - Multiple pages per project
- **Responsive Design** - Device presets (Desktop, Tablet, Mobile)
- **Undo/Redo** - Full history management
- **Storage** - LocalStorage and Remote HTTP backends
- **Code Export** - Generate clean HTML, CSS, and JavaScript
- **i18n** - Internationalization support
- **Keyboard Shortcuts** - Configurable keymaps
- **Data Sources** - Dynamic data binding

## Architecture

```
src/
  core/               # Reactive foundation (EventEmitter, ReactiveModel, ReactiveCollection)
  editor/             # Editor API, EditorModel, EditorView, config
  dom_components/     # Component system (20+ types, views, manager)
  canvas/             # iframe-based canvas with zoom/pan
  css_composer/       # CSS rule management
  selector_manager/   # CSS selector/class management
  style_manager/      # Visual CSS property editor (7 property types, 6 sectors)
  block_manager/      # Draggable block palette
  asset_manager/      # Media/image management
  trait_manager/      # Component attribute editor
  commands/           # Command pattern with 7+ built-in commands
  panels/             # UI panel layout system
  storage_manager/    # Pluggable persistence (LocalStorage, Remote)
  parser/             # HTML/CSS string parser
  code_manager/       # HTML/CSS/JS code generator
  rich_text_editor/   # Inline text editing (contentEditable)
  pages/              # Multi-page support
  device_manager/     # Responsive device presets
  data_sources/       # Dynamic data binding
  i18n/               # Internationalization
  keymaps/            # Keyboard shortcuts
  undo_manager/       # Undo/redo history
  navigator/          # Layer tree panel
  modal/              # Modal dialog system
  styles/             # Editor CSS (pure CSS custom properties)
```

## API

### Editor

```js
const editor = vanillabuilder.init({
  container: '#editor',
  autorender: true,
  components: '<div>Hello</div>',
  style: 'div { color: red; }',
  plugins: [myPlugin],
  pluginsOpts: { myPlugin: { option: true } },
});

// Content
editor.getHtml();
editor.getCss();
editor.getJs();
editor.getProjectData();
editor.loadProjectData(data);

// Selection
editor.select(component);
editor.getSelected();
editor.getSelectedAll();

// Commands
editor.runCommand('preview');
editor.stopCommand('preview');

// Storage
await editor.store();
await editor.load();

// Events
editor.on('component:selected', (component) => { ... });
editor.on('component:update:style', (component) => { ... });

// Lifecycle
editor.onReady(() => console.log('Ready!'));
editor.destroy();
```

### Module Access

```js
editor.Components   // Component manager
editor.Canvas       // Canvas module
editor.Css          // CSS composer
editor.Blocks       // Block manager
editor.Assets       // Asset manager
editor.Styles       // Style manager
editor.Panels       // Panel manager
editor.Commands     // Command system
editor.Selectors    // Selector manager
editor.Traits       // Trait manager
editor.Devices      // Device manager
editor.Pages        // Page manager
editor.Storage      // Storage manager
editor.Modal        // Modal dialogs
editor.Keymaps      // Keyboard shortcuts
editor.UndoManager  // Undo/redo
editor.I18n         // Internationalization
editor.Layers       // Layer tree
editor.DataSources  // Data binding
editor.RichTextEditor // Inline text editor
```

### Plugins

```js
// Define a plugin
function myPlugin(editor, options) {
  editor.Blocks.add({ id: 'my-block', label: 'My Block', content: '<div>Custom</div>' });
  editor.Commands.add('my-command', { run: (editor) => { ... } });
  editor.Components.addType('my-type', { model: MyModel, view: MyView });
}

// Use it
vanillabuilder.init({
  plugins: [myPlugin],
  pluginsOpts: { myPlugin: { color: 'red' } },
});

// Or with usePlugin helper
const configured = vanillabuilder.usePlugin(myPlugin, { color: 'blue' });
vanillabuilder.init({ plugins: [configured] });
```

### Custom Component Types

```js
editor.Components.addType('my-component', {
  isComponent: (el) => el.tagName === 'MY-TAG',
  model: {
    defaults: { tagName: 'div', type: 'my-component', traits: ['id', 'title'] }
  },
});
```

## Configuration

```js
vanillabuilder.init({
  // Core
  container: '#editor',           // Mount point
  autorender: true,               // Auto-render on init
  headless: false,                // No UI mode
  stylePrefix: 'vb-',            // CSS class prefix
  height: '900px',
  width: '100%',

  // Content
  projectData: null,              // Full project JSON
  components: '',                 // Initial HTML
  style: '',                      // Initial CSS

  // Plugins
  plugins: [],
  pluginsOpts: {},

  // Behavior
  multipleSelection: true,
  nativeDnD: true,
  avoidInlineStyle: false,
  showToolbar: true,

  // Module configs
  storageManager: { type: 'local' },
  deviceManager: {},
  blockManager: {},
  styleManager: {},
  // ... all 21 modules configurable
});
```

## Development

```bash
# Install dev dependencies
npm install

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Build distribution
npm run build

# Start dev server
npx http-server . -p 8080 --cors -c-1
# Then open http://localhost:8080/examples/basic.html
```

## Testing

822 tests across 28 test files covering all modules:

```
npm test

 Test Files  28 passed (28)
      Tests  822 passed (822)
```

Test coverage includes:
- **Core**: EventEmitter, ReactiveModel, ReactiveCollection, utilities
- **Editor**: Constructor, module initialization, config, lifecycle, events
- **Components**: 20+ types, component tree, styles, classes, traits, HTML generation
- **Views**: DOM rendering, attribute sync, status updates, cleanup
- **CSS**: Rules, selectors, media queries, persistence
- **Style Manager**: 7 property types, sectors, PropertyFactory, view rendering
- **All Modules**: Blocks, Assets, Traits, Commands, Storage, Parser, CodeManager, I18n, Keymaps, UndoManager, Devices, Pages, DataSources, Modal, Navigator
- **Integration**: Full editor init, plugins, selection flow

## Project Stats

| Metric | Value |
|--------|-------|
| Source files | 80+ JS, 2 CSS |
| Lines of code | ~13,000 |
| Test files | 28 |
| Test cases | 822 |
| Runtime dependencies | **0** |
| Modules | 21 |
| Component types | 20+ |
| Built-in commands | 7+ |
| CSS property sectors | 6 |
| CSS properties | 50+ |

## License

MIT
