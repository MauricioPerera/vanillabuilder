/**
 * Default editor configuration
 * Mirrors GrapesJS EditorConfig with all module sub-configs
 */

export default function getDefaultConfig() {
  return {
    // ── Core ──
    /** @type {string|HTMLElement} Container element or selector */
    container: '',

    /** @type {boolean} Auto-render on init */
    autorender: true,

    /** @type {boolean} Headless mode (no UI) */
    headless: false,

    /** @type {string} CSS prefix for all classes */
    stylePrefix: 'vb-',

    /** @type {string} Editor height */
    height: '900px',

    /** @type {string} Editor width */
    width: '100%',

    /** @type {string[]|string} Log levels to show: 'debug', 'info', 'warning', 'error' */
    log: ['warning', 'error'],

    // ── Project Data ──
    /** @type {Object|null} Initial project data */
    projectData: null,

    /** @type {string|Object} Initial HTML components (alternative to projectData) */
    components: '',

    /** @type {string|Object} Initial CSS styles (alternative to projectData) */
    style: '',

    // ── Plugins ──
    /** @type {Array<Function|string>} Plugins to load */
    plugins: [],

    /** @type {Object} Plugin-specific options */
    pluginsOpts: {},

    // ── Behavior ──
    /** @type {boolean} Show unsaved changes notice on unload */
    noticeOnUnload: true,

    /** @type {boolean} Allow multiple component selection */
    multipleSelection: true,

    /** @type {boolean} Enable native drag-and-drop */
    nativeDnD: true,

    /** @type {boolean} Force CSS classes instead of inline styles */
    forceClass: false,

    /** @type {boolean} Avoid inline styles (use CSS rules) */
    avoidInlineStyle: false,

    /** @type {boolean} Device preview mode */
    devicePreviewMode: false,

    /** @type {boolean} Auto-remove unused CSS rules */
    clearStyles: false,

    /** @type {string|undefined} Drag mode: 'translate', 'absolute', undefined */
    dragMode: undefined,

    /** @type {boolean} Show padding/margin offsets */
    showOffsets: false,

    /** @type {boolean} Show component toolbar */
    showToolbar: true,

    /** @type {boolean} Show device buttons */
    showDevices: true,

    // ── Protected CSS (injected into canvas) ──
    /** @type {string} Base CSS for canvas */
    protectedCss: `
      * { box-sizing: border-box; }
      html, body, [data-vb-type=wrapper] {
        min-height: 100%;
      }
      body {
        margin: 0;
        height: 100%;
        background-color: #fff;
      }
      [data-highlightable] { outline: 1px dashed rgba(170,170,170,0.7); }
    `,

    /** @type {string} Additional canvas CSS */
    canvasCss: '',

    // ── Export Options ──
    /** @type {Object} HTML export options */
    optsHtml: {},

    /** @type {Object} CSS export options */
    optsCss: {},

    // ── Module Configs (all optional, merged with module defaults) ──
    /** @type {Object} I18n config */
    i18n: {},

    /** @type {Object} Undo manager config */
    undoManager: {},

    /** @type {Object} Asset manager config */
    assetManager: {},

    /** @type {Object} Canvas config */
    canvas: {},

    /** @type {Object} Storage manager config */
    storageManager: { type: 'local' },

    /** @type {Object} Rich text editor config */
    richTextEditor: {},

    /** @type {Object} DOM components config */
    domComponents: {},

    /** @type {Object} Modal config */
    modal: {},

    /** @type {Object} Code manager config */
    codeManager: {},

    /** @type {Object} Panels config */
    panels: {},

    /** @type {Object} Commands config */
    commands: {},

    /** @type {Object} Keymaps config */
    keymaps: {},

    /** @type {Object} CSS composer config */
    cssComposer: {},

    /** @type {Object} Selector manager config */
    selectorManager: {},

    /** @type {Object} Device manager config */
    deviceManager: {},

    /** @type {Object} Style manager config */
    styleManager: {},

    /** @type {Object} Block manager config */
    blockManager: {},

    /** @type {Object} Trait manager config */
    traitManager: {},

    /** @type {Object} Page manager config */
    pageManager: {},

    /** @type {Object} Layer manager config */
    layerManager: {},

    /** @type {Object} Parser config */
    parser: {},

    /** @type {Object} Data sources config */
    dataSources: {},
  };
}
