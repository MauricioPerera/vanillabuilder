# VanillaBuilder

A **zero-dependency** visual web page builder with an **AI-friendly HTTP API**. Built entirely with **vanilla ES6+ JavaScript**. Deployed on Cloudflare Pages — any agent or human can build pages via HTTP requests, CLI, or the visual editor. Changes sync in real-time.

**Live**: [vanillabuilder.pages.dev](https://vanillabuilder.pages.dev)

![Tests](https://img.shields.io/badge/tests-913-brightgreen)
![Dependencies](https://img.shields.io/badge/dependencies-0-blue)
![API Methods](https://img.shields.io/badge/API_methods-20-purple)
![License](https://img.shields.io/badge/license-MIT-green)

---

## How It Works

```
┌─────────────────┐     HTTP      ┌──────────────────────────────┐
│  AI Agent / CLI  │ ──────────── │  vanillabuilder.pages.dev    │
│  (curl / vb)     │   POST/GET   │                              │
└─────────────────┘              │  ┌─────────┐  ┌───────────┐  │
                                  │  │  API     │  │  Editor   │  │
┌─────────────────┐              │  │ Functions│◄─┤  Visual   │  │
│  Human (browser) │ ◄──────────  │  │ (KV+DB) │  │  (HTML)   │  │
│  drag/drop/edit  │   polling    │  └─────────┘  └───────────┘  │
└─────────────────┘              └──────────────────────────────┘
```

1. **Agent** sends HTTP requests to the API (add sections, set theme, connect data)
2. **API** stores state in Cloudflare KV via js-doc-store
3. **Editor** polls API and renders changes in the visual canvas
4. **Human** drags blocks, edits text, picks colors — changes sync back to API
5. **Export** generates deploy-ready files (HTML + CSS + JS)

Both agent and human work on the **same page simultaneously**.

---

## Quick Start

### Option 1: CLI (zero dependencies)

```bash
# Create a session
node cli.cjs new
#  Session created: cli_abc123
#  Editor URL: https://vanillabuilder.pages.dev/?sessionId=cli_abc123

# Set a theme
node cli.cjs theme '{"colors":{"primary":"#059669"},"fonts":{"heading":"Georgia, serif"}}'

# Build the page
node cli.cjs add navbar '{"brand":"MyApp","ctaText":"Sign Up"}'
node cli.cjs add hero '{"headline":"Welcome","subheadline":"Build pages with AI","buttonText":"Start"}'
node cli.cjs add features '{"heading":"Why Us","items":[{"icon":"⚡","title":"Fast","description":"Zero deps"},{"icon":"🔒","title":"Secure","description":"E2E encrypted"}]}'
node cli.cjs add pricing '{"heading":"Plans","plans":[{"name":"Free","price":"$0","features":["1 Project"]},{"name":"Pro","price":"$29","features":["Unlimited"],"popular":true}]}'
node cli.cjs add footer '{"copyright":"2026 MyApp"}'

# Connect an external API
node cli.cjs datasource add '{"id":"posts","url":"https://api.example.com/posts","path":"data.items","targetSelector":"#posts","template":"<div><h3>{{title}}</h3><p>{{author.name}}</p></div>"}'

# Connect a form webhook
node cli.cjs formaction add '{"id":"contact","formSelector":"form","webhookUrl":"https://hooks.zapier.com/xxx"}'

# Open in browser to see it
node cli.cjs open

# Check stats
node cli.cjs info

# Export for deployment
node cli.cjs export dist/
#  dist/index.html (clean HTML)
#  dist/styles.css (theme + custom CSS)
#  dist/script.js  (data fetchers + form handlers)

# Deploy anywhere
cd dist && npx wrangler pages deploy .    # Cloudflare
cd dist && vercel                          # Vercel
cd dist && netlify deploy                  # Netlify
```

### Option 2: HTTP API (curl / fetch)

```bash
# Create session
curl -X POST https://vanillabuilder.pages.dev/api/session \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"my-page"}'

# Build page in one request
curl -X POST https://vanillabuilder.pages.dev/api/batch \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "my-page",
    "actions": [
      {"method":"setTheme","params":{"colors":{"primary":"#7c3aed"}}},
      {"method":"addSection","params":{"type":"hero","options":{"headline":"Hello World"}}},
      {"method":"addSection","params":{"type":"features","options":{"heading":"Features","items":[{"title":"A","description":"B"}]}}},
      {"method":"addSection","params":{"type":"footer"}}
    ]
  }'

# Open editor to see it
open "https://vanillabuilder.pages.dev/?sessionId=my-page"

# Export deploy-ready files
curl -X POST https://vanillabuilder.pages.dev/api/execute \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"my-page","method":"exportProject","params":{"title":"My Site"}}'
# Returns: { files: { "index.html": "...", "styles.css": "...", "script.js": "..." } }
```

### Option 3: Visual Editor

1. Open [vanillabuilder.pages.dev](https://vanillabuilder.pages.dev)
2. **Drag blocks** from the left panel to the canvas
3. **Double-click text** to edit inline
4. **Double-click icons** to pick a new one
5. **Double-click images** to change URL
6. **Click elements** to edit styles (right panel → Styles)
7. **Theme tab** → set colors, fonts, spacing globally
8. **Data tab** → connect APIs and form webhooks
9. **Session button** → get share link for collaboration
10. **Export button** → download HTML + CSS + JS files

---

## Collaborative Editing

Any number of agents and humans can edit the same page:

```
1. Human opens editor → gets sessionId (auto-generated)
2. Human clicks "Session" → copies share link
3. Human shares link with agent
4. Agent uses sessionId in API calls
5. Both see changes in real-time (editor polls every 2s)
6. Changelog tracks who changed what (source: "agent" or "editor")
7. Reset Session = new sessionId = revokes old access
```

---

## API Reference

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Service status |
| `GET` | `/api/schemas?format=anthropic\|openai\|generic` | Tool definitions for AI function calling |
| `POST` | `/api/session` | Create session `{"sessionId":"xxx"}` |
| `GET` | `/api/session?sessionId=xxx` | Check if session exists |
| `DELETE` | `/api/session?sessionId=xxx` | Delete session (revokes access) |
| `POST` | `/api/execute` | Execute one method `{"sessionId","method","params"}` |
| `POST` | `/api/batch` | Execute multiple methods `{"sessionId","actions":[...]}` |
| `GET` | `/api/poll?sessionId=xxx&v=ver` | Poll for changes (versioned, cheap) |
| `POST` | `/api/sync` | Editor pushes changes `{"sessionId","html"}` |
| `GET` | `/api/changelog?sessionId=xxx` | View change history |

### Methods (20)

#### Theme
| Method | Description |
|--------|-------------|
| `setTheme` | Set design system: colors (12 tokens), fonts, sizes, spacing, borderRadius, maxWidth |
| `getTheme` | Get current theme |

#### Content
| Method | Description |
|--------|-------------|
| `clearPage` | Remove all content, data sources, and form actions |
| `addSection` | Add pre-built section (10 types below) |
| `addHTML` | Add raw HTML string |
| `addCSSRule` | Add CSS rule with selector and styles |
| `removeSection` | Remove section by index |

#### Section Types
| Type | Description |
|------|-------------|
| `hero` | Hero banner: headline, subheadline, button, background gradient |
| `features` | Feature cards: icon, title, description per card |
| `cta` | Call to action: headline, button |
| `testimonials` | Quote cards: quote, author, role |
| `pricing` | Pricing plans: name, price, features, popular badge |
| `footer` | Footer: columns with links, copyright |
| `contact` | Contact form: name, email, message fields |
| `faq` | FAQ: question/answer pairs |
| `navbar` | Navigation: brand, links, CTA button |
| `stats` | Stats counters: value + label |

#### Data
| Method | Description |
|--------|-------------|
| `addDataSource` | Connect external API. Fetches client-side. Dot notation for nested data (`response.data.items`, `{{user.address.city}}`). Pagination support. |
| `removeDataSource` | Remove data source by ID |
| `getDataSources` | List configured data sources |
| `addFormAction` | Add webhook to form submit (Zapier, Make, n8n, any URL) |
| `removeFormAction` | Remove form action by ID |
| `getFormActions` | List configured form actions |

#### Export
| Method | Description |
|--------|-------------|
| `getHTML` | Get page body HTML |
| `getCSS` | Get CSS rules |
| `getFullPage` | Get complete HTML document (single file, inline) |
| `exportProject` | Get separate files: `index.html` + `styles.css` + `script.js` (deploy-ready) |

#### Query
| Method | Description |
|--------|-------------|
| `getPageInfo` | Counts: sections, CSS rules, data sources, form actions, hasTheme |
| `getAvailableSections` | List 10 section types with descriptions |

#### Generator
| Method | Description |
|--------|-------------|
| `buildLandingPage` | Generate complete landing page from config object (all sections at once) |

---

## CLI Reference

```
vb new                              Create new session
vb use <sessionId>                  Use existing session
vb info                             Show session stats + editor URL
vb open                             Open editor in browser
vb sections                         List available section types
vb add <type> [json]                Add section (hero, features, pricing...)
vb html "<html>"                    Add raw HTML
vb css ".selector" '{"k":"v"}'      Add CSS rule
vb remove <index>                   Remove section by index
vb clear                            Clear all content
vb theme [json|file]                Set or view design theme
vb datasource list                  List data sources
vb datasource add '{...}'           Add API data source
vb datasource remove <id>           Remove data source
vb formaction list                  List form webhooks
vb formaction add '{...}'           Add form webhook
vb formaction remove <id>           Remove form webhook
vb export [dir]                     Export project files (html+css+js)
vb landing [config.json]            Build landing page from config
vb preview                          Print full page HTML
vb reset                            Delete session + create new one
vb help                             Show help
```

Interactive mode: `node cli.cjs` → `vb>` prompt.

---

## Design Theme System

Define once, apply everywhere. All sections use CSS custom properties.

```bash
vb theme '{
  "colors": {
    "primary": "#7c3aed",
    "primaryLight": "#a78bfa",
    "secondary": "#059669",
    "background": "#ffffff",
    "surface": "#f8f9fa",
    "text": "#333333",
    "textMuted": "#666666"
  },
  "fonts": {
    "heading": "Georgia, serif",
    "body": "Inter, sans-serif"
  },
  "sizes": {
    "headingLg": "48px",
    "body": "16px"
  },
  "spacing": {
    "sectionY": "60px",
    "gap": "24px"
  },
  "borderRadius": "12px",
  "maxWidth": "1100px"
}'
```

Change the theme → every section updates instantly (CSS variables).

---

## Data Sources

Connect any REST API. Data is fetched client-side in the exported page (no backend needed).

```bash
vb datasource add '{
  "id": "blog-posts",
  "url": "https://my-cms.com/api/posts",
  "path": "data.posts",
  "targetSelector": "#blog-list",
  "template": "<article><h3>{{title}}</h3><p>{{excerpt}}</p><small>by {{author.name}} in {{category.label}}</small></article>",
  "pagination": {"perPage": 10},
  "headers": {"Authorization": "Bearer xxx"}
}'
```

- **Dot notation** for nested data: `data.results.items`, `records[0].name`
- **Templates**: `{{field}}`, `{{nested.field}}`, `{{array[0].prop}}`
- **Pagination**: auto-generates Previous/Next buttons
- **Auto-refresh**: set `interval` in seconds

## Form Webhooks

```bash
vb formaction add '{
  "id": "contact-form",
  "formSelector": "form",
  "webhookUrl": "https://hooks.zapier.com/catch/xxx",
  "successMessage": "Thanks! We will get back to you soon.",
  "errorMessage": "Something went wrong. Please try again."
}'
```

Works with Zapier, Make, n8n, or any endpoint that accepts POST with JSON body.

---

## Export & Deploy

```bash
# Export separate files
vb export dist/
# Creates:
#   dist/index.html  — clean HTML, links to css/js
#   dist/styles.css  — theme variables + all CSS rules
#   dist/script.js   — data fetchers + form handlers (only if needed)

# Deploy to any static host:
cd dist
npx wrangler pages deploy .          # Cloudflare Pages
vercel                                # Vercel
netlify deploy --dir=.                # Netlify
# Or just push to GitHub with Pages enabled
```

The exported files are **fully static** — no server, no framework, no build step. Just HTML + CSS + JS.

---

## Deploy Your Own Instance

```bash
git clone https://github.com/MauricioPerera/vanillabuilder.git
cd vanillabuilder

# Create KV namespace
npx wrangler kv namespace create VANILLABUILDER_SESSIONS
# Update wrangler.toml with the namespace ID

# Deploy
npx wrangler pages deploy public --project-name my-vanillabuilder
```

**Cost**: Free tier covers everything (100K KV reads/day, 1K writes/day). Adaptive polling + versioning minimizes KV usage (~90% reduction vs naive polling).

---

## Architecture

```
public/
  index.html              Visual editor (self-contained single file)

functions/api/            Cloudflare Pages Functions
  _builder.js             PageBuilder: sections, theme, data sources, form actions, export
  _db.js                  Storage: js-doc-store + CloudflareKVAdapter + versioning
  js-doc-store.js         Document database (zero-dep, MongoDB-style queries)
  execute.js              POST /api/execute — single method
  batch.js                POST /api/batch — multiple methods
  poll.js                 GET /api/poll — versioned polling (cheap)
  sync.js                 POST /api/sync — editor pushes changes
  session.js              Session CRUD
  changelog.js            Change history
  health.js               Health check
  schemas.js              AI tool definitions

src/                      Core framework (21 modules, 80+ files)
cli.cjs                   CLI (zero dependencies, Node.js built-ins only)
test/                     913+ tests
```

### Optimizations
- **Adaptive polling**: 2s → 5s → 10s → 30s when idle, resets on change
- **KV versioning**: poll reads only version (10 bytes) instead of full page
- **Skip when hidden**: no polling or syncing when tab is not visible
- **js-doc-store**: indexed queries, batch persistence, collection-based storage

---

## Stats

| Metric | Value |
|--------|-------|
| Runtime dependencies | **0** |
| API methods | **20** |
| Section templates | **10** |
| Block types (editor) | **30** |
| Test cases | **913+** |
| Framework modules | **21** |
| Hosting cost | **$0** (Cloudflare free tier) |

## License

MIT
