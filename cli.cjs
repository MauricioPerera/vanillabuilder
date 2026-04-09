#!/usr/bin/env node

/**
 * VanillaBuilder CLI
 * Zero dependencies — uses only Node.js built-ins (http/https, readline)
 *
 * Usage:
 *   node cli.js                          → interactive mode
 *   node cli.js new                      → create new session
 *   node cli.js use <sessionId>          → set active session
 *   node cli.js info                     → show current session and page info
 *   node cli.js sections                 → list available section types
 *   node cli.js add <type> [options]     → add a section (hero, features, etc.)
 *   node cli.js html "<html>"            → add raw HTML
 *   node cli.js css "<selector>" <json>  → add CSS rule
 *   node cli.js remove <index>           → remove section by index
 *   node cli.js clear                    → clear page
 *   node cli.js preview                  → get full page HTML
 *   node cli.js export [file]            → save page to file
 *   node cli.js open                     → open editor in browser
 *   node cli.js landing [configFile]     → build landing page from JSON config
 *   node cli.js reset                    → delete session and create new one
 */

const https = require('https');
const fs = require('fs');
const { execSync } = require('child_process');
const readline = require('readline');
const path = require('path');

const API = process.env.VB_API || 'https://vanillabuilder.pages.dev';
const CONFIG_FILE = path.join(process.env.HOME || process.env.USERPROFILE || '.', '.vanillabuilder');

// ── HTTP helper (zero deps) ──

function request(method, urlPath, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, API);
    const opts = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json' },
    };

    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve({ ok: false, error: 'Invalid response: ' + data.slice(0, 100) }); }
      });
    });

    req.on('error', (e) => resolve({ ok: false, error: e.message }));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function apiExecute(method, params = {}) {
  const sid = getSessionId();
  if (!sid) { err('No session. Run: vb new'); return { ok: false }; }
  return request('POST', '/api/execute', { method, params, sessionId: sid });
}

async function apiBatch(actions) {
  const sid = getSessionId();
  if (!sid) { err('No session. Run: vb new'); return { ok: false }; }
  return request('POST', '/api/batch', { actions, sessionId: sid });
}

// ── Config (session persistence) ──

function loadConfig() {
  try { return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')); }
  catch { return {}; }
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

function getSessionId() {
  return loadConfig().sessionId || null;
}

function setSessionId(sid) {
  const config = loadConfig();
  config.sessionId = sid;
  saveConfig(config);
}

// ── Output helpers ──

function log(msg) { console.log(msg); }
function ok(msg) { console.log('\x1b[32m✓\x1b[0m ' + msg); }
function err(msg) { console.log('\x1b[31m✗\x1b[0m ' + msg); }
function dim(msg) { console.log('\x1b[90m' + msg + '\x1b[0m'); }
function bold(msg) { return '\x1b[1m' + msg + '\x1b[0m'; }

// ── Commands ──

const commands = {
  async login() {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const ask = (q) => new Promise(r => rl.question(q, r));
    const email = await ask('Email: ');
    const password = await ask('Password: ');
    rl.close();

    const res = await request('POST', '/api/auth/login', { email, password });
    if (res.ok) {
      // Extract token from response headers (we use it for CLI auth)
      const config = loadConfig();
      // For CLI, do a second request to get a long-lived token
      // For now store the JWT from login response
      const loginRes = await request('POST', '/api/auth/login', { email, password });
      // Store email for display
      config.email = email;
      saveConfig(config);
      ok('Logged in as ' + bold(email) + ' (plan: ' + (res.data?.plan || 'free') + ')');
    } else {
      err(res.error || 'Login failed');
    }
  },

  async register() {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const ask = (q) => new Promise(r => rl.question(q, r));
    const email = await ask('Email: ');
    const password = await ask('Password (min 6 chars): ');
    rl.close();

    const res = await request('POST', '/api/auth/register', { email, password });
    if (res.ok) {
      const config = loadConfig();
      config.email = email;
      saveConfig(config);
      ok('Account created: ' + bold(email));
    } else {
      err(res.error || 'Registration failed');
    }
  },

  async whoami() {
    const config = loadConfig();
    if (config.email) {
      log(bold('Email: ') + config.email);
    } else {
      dim('Not logged in. Run: vb login');
    }
    if (config.sessionId) {
      log(bold('Session: ') + config.sessionId);
    }
  },

  async new() {
    const sid = 'cli_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
    const res = await request('POST', '/api/session', { sessionId: sid });
    if (res.ok) {
      setSessionId(sid);
      ok('Session created: ' + bold(sid));
      dim('Editor URL: ' + API + '/?sessionId=' + sid);
    } else {
      err('Failed: ' + res.error);
    }
  },

  async use(sid) {
    if (!sid) { err('Usage: vb use <sessionId>'); return; }
    const res = await request('GET', '/api/session?sessionId=' + sid);
    if (res.ok && res.exists) {
      setSessionId(sid);
      ok('Using session: ' + bold(sid));
    } else {
      err('Session not found: ' + sid);
    }
  },

  async info() {
    const sid = getSessionId();
    if (!sid) { err('No session. Run: vb new'); return; }
    const res = await apiExecute('getPageInfo');
    log('');
    log(bold('Session: ') + sid);
    log(bold('Editor:  ') + API + '/?sessionId=' + sid);
    if (res.ok) {
      log(bold('Sections: ') + res.data.sectionCount);
      log(bold('CSS Rules: ') + res.data.cssRuleCount);
    }
    log('');
  },

  async sections() {
    const res = await apiExecute('getAvailableSections');
    if (!res.ok) { err(res.error); return; }
    log('');
    log(bold('Available sections:'));
    for (const s of res.data) {
      log('  ' + bold(s.id.padEnd(15)) + (s.description || ''));
    }
    log('');
  },

  async add(type, ...rest) {
    if (!type) { err('Usage: vb add <type> [json options]'); return; }
    let options = {};
    const optStr = rest.join(' ');
    if (optStr) {
      try { options = JSON.parse(optStr); }
      catch { err('Invalid JSON options: ' + optStr); return; }
    }
    const res = await apiExecute('addSection', { type, options });
    if (res.ok) ok('Added ' + type + ' section');
    else err(res.error);
  },

  async html(html) {
    if (!html) { err('Usage: vb html "<html>"'); return; }
    const res = await apiExecute('addHTML', { html });
    if (res.ok) ok('HTML added');
    else err(res.error);
  },

  async css(selector, stylesJson) {
    if (!selector || !stylesJson) { err('Usage: vb css ".selector" \'{"color":"red"}\''); return; }
    let styles;
    try { styles = JSON.parse(stylesJson); }
    catch { err('Invalid JSON styles'); return; }
    const res = await apiExecute('addCSSRule', { selector, styles });
    if (res.ok) ok('CSS rule added: ' + selector);
    else err(res.error);
  },

  async remove(index) {
    if (index === undefined) { err('Usage: vb remove <index>'); return; }
    const res = await apiExecute('removeSection', { index: parseInt(index) });
    if (res.ok) ok('Section ' + index + ' removed');
    else err(res.error);
  },

  async clear() {
    const res = await apiExecute('clearPage');
    if (res.ok) ok('Page cleared');
    else err(res.error);
  },

  async preview() {
    const res = await apiExecute('getFullPage', { title: 'VanillaBuilder Page' });
    if (res.ok) log(res.data);
    else err(res.error);
  },

  async export(dir) {
    const outDir = dir || 'dist';
    const res = await apiExecute('exportProject', { title: 'VanillaBuilder Page' });
    if (!res.ok) { err(res.error); return; }

    // Create output directory
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    // Write each file
    for (const [name, content] of Object.entries(res.data.files)) {
      const filepath = path.join(outDir, name);
      fs.writeFileSync(filepath, content);
      dim('  ' + filepath + ' (' + content.length + ' bytes)');
    }

    ok('Exported ' + res.data.fileCount + ' files to ' + bold(outDir + '/'));
    dim('Deploy to any static host: Vercel, GitHub Pages, Cloudflare Pages, Netlify');
  },

  async open() {
    const sid = getSessionId();
    if (!sid) { err('No session. Run: vb new'); return; }
    const url = API + '/?sessionId=' + sid;
    try {
      if (process.platform === 'win32') execSync('start ' + url);
      else if (process.platform === 'darwin') execSync('open ' + url);
      else execSync('xdg-open ' + url);
      ok('Opened editor in browser');
    } catch {
      log('Open manually: ' + url);
    }
  },

  async theme(configFileOrJson) {
    if (!configFileOrJson) {
      // Show current theme
      const res = await apiExecute('getTheme');
      if (res.ok) { log(JSON.stringify(res.data, null, 2)); }
      else err(res.error);
      return;
    }
    let config;
    try {
      // Try as file first, then as inline JSON
      if (configFileOrJson.startsWith('{')) {
        config = JSON.parse(configFileOrJson);
      } else {
        config = JSON.parse(fs.readFileSync(configFileOrJson, 'utf8'));
      }
    } catch { err('Invalid JSON or file: ' + configFileOrJson); return; }
    const res = await apiExecute('setTheme', config);
    if (res.ok) ok('Theme applied');
    else err(res.error);
  },

  async datasource(action, jsonOrId) {
    if (!action || action === 'list') {
      const res = await apiExecute('getDataSources');
      if (res.ok) {
        if (res.data.length === 0) { dim('No data sources'); return; }
        for (const ds of res.data) log('  ' + bold(ds.id.padEnd(15)) + ds.url);
      } else err(res.error);
      return;
    }
    if (action === 'add') {
      if (!jsonOrId) { err('Usage: vb datasource add \'{"id":"x","url":"...","targetSelector":"#x","template":"<p>{{field}}</p>"}\''); return; }
      let config;
      try { config = jsonOrId.startsWith('{') ? JSON.parse(jsonOrId) : JSON.parse(fs.readFileSync(jsonOrId, 'utf8')); }
      catch { err('Invalid JSON'); return; }
      const res = await apiExecute('addDataSource', config);
      if (res.ok) ok('Data source added: ' + (config.id || ''));
      else err(res.error);
      return;
    }
    if (action === 'remove') {
      if (!jsonOrId) { err('Usage: vb datasource remove <id>'); return; }
      const res = await apiExecute('removeDataSource', { id: jsonOrId });
      if (res.ok) ok('Removed: ' + jsonOrId);
      else err(res.error);
      return;
    }
    err('Usage: vb datasource [list|add|remove]');
  },

  async formaction(action, jsonOrId) {
    if (!action || action === 'list') {
      const res = await apiExecute('getFormActions');
      if (res.ok) {
        if (res.data.length === 0) { dim('No form actions'); return; }
        for (const fa of res.data) log('  ' + bold(fa.id.padEnd(15)) + fa.formSelector + ' -> ' + fa.webhookUrl);
      } else err(res.error);
      return;
    }
    if (action === 'add') {
      if (!jsonOrId) { err('Usage: vb formaction add \'{"id":"x","formSelector":"form","webhookUrl":"https://..."}\''); return; }
      let config;
      try { config = jsonOrId.startsWith('{') ? JSON.parse(jsonOrId) : JSON.parse(fs.readFileSync(jsonOrId, 'utf8')); }
      catch { err('Invalid JSON'); return; }
      const res = await apiExecute('addFormAction', config);
      if (res.ok) ok('Form action added: ' + (config.id || ''));
      else err(res.error);
      return;
    }
    if (action === 'remove') {
      if (!jsonOrId) { err('Usage: vb formaction remove <id>'); return; }
      const res = await apiExecute('removeFormAction', { id: jsonOrId });
      if (res.ok) ok('Removed: ' + jsonOrId);
      else err(res.error);
      return;
    }
    err('Usage: vb formaction [list|add|remove]');
  },

  async landing(configFile) {
    let config = {};
    if (configFile) {
      try { config = JSON.parse(fs.readFileSync(configFile, 'utf8')); }
      catch { err('Cannot read config file: ' + configFile); return; }
    }
    const res = await apiExecute('buildLandingPage', config);
    if (res.ok) {
      ok('Landing page built (' + res.data.length + ' chars)');
      const infoRes = await apiExecute('getPageInfo');
      if (infoRes.ok) dim('Sections: ' + infoRes.data.sectionCount);
    } else {
      err(res.error);
    }
  },

  async reset() {
    const sid = getSessionId();
    if (sid) {
      await request('DELETE', '/api/session?sessionId=' + sid);
      dim('Deleted session: ' + sid);
    }
    await commands.new();
  },

  async help() {
    log('');
    log(bold('VanillaBuilder CLI'));
    log('');
    log('  vb login                        Login to your account');
    log('  vb register                     Create a new account');
    log('  vb whoami                       Show current user');
    log('  vb new                         Create new session');
    log('  vb use <sessionId>             Use existing session');
    log('  vb info                        Show session & page info');
    log('  vb open                        Open editor in browser');
    log('  vb sections                    List available section types');
    log('  vb add <type> [json]           Add section (hero, features, pricing...)');
    log('  vb html "<html>"               Add raw HTML');
    log('  vb css ".sel" \'{"k":"v"}\'      Add CSS rule');
    log('  vb remove <index>              Remove section by index');
    log('  vb clear                       Clear all content');
    log('  vb preview                     Print full page HTML');
    log('  vb export [dir]                 Export project files (html+css+js) to dir');
    log('  vb theme [config.json|json]     Set or view design theme');
    log('  vb datasource [list|add|remove] Manage API data sources');
    log('  vb formaction [list|add|remove] Manage form webhooks');
    log('  vb landing [config.json]       Build landing page from config');
    log('  vb reset                       Delete session & create new one');
    log('  vb help                        Show this help');
    log('');
    log(bold('Interactive mode:') + ' run without arguments');
    log(bold('API:') + ' ' + API);
    log('');
  },
};

// ── Interactive mode ──

async function interactive() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const prompt = () => rl.question('\x1b[35mvb>\x1b[0m ', async (line) => {
    const parts = line.trim().split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);

    if (!cmd) { prompt(); return; }
    if (cmd === 'exit' || cmd === 'quit') { rl.close(); return; }

    const fn = commands[cmd];
    if (fn) {
      await fn(...args);
    } else {
      err('Unknown command: ' + cmd + '. Type "help" for list.');
    }
    prompt();
  });

  log('');
  log(bold('VanillaBuilder CLI') + ' — type "help" for commands, "exit" to quit');
  const sid = getSessionId();
  if (sid) dim('Active session: ' + sid);
  else dim('No session. Type "new" to create one.');
  log('');
  prompt();
}

// ── Main ──

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    await interactive();
    return;
  }

  const cmd = args[0];
  const fn = commands[cmd];
  if (fn) {
    await fn(...args.slice(1));
  } else {
    err('Unknown command: ' + cmd);
    await commands.help();
  }
}

main().catch(e => err(e.message));
