# VanillaBuilder

A **zero-dependency** visual web page builder with an **AI-friendly API**. Built entirely with **vanilla ES6+ JavaScript**. Deploy on Cloudflare Pages — any agent or human can build pages via HTTP requests or the visual editor.

**Live demo**: [vanillabuilder.pages.dev](https://vanillabuilder.pages.dev)

![Tests](https://img.shields.io/badge/tests-863+-brightgreen)
![Dependencies](https://img.shields.io/badge/dependencies-0-blue)
![API Methods](https://img.shields.io/badge/API_methods-19-purple)
![License](https://img.shields.io/badge/license-MIT-green)

## What is VanillaBuilder?

A visual page builder that works two ways:

1. **Visual Editor** — Humans drag blocks, edit text, pick colors in a browser UI
2. **HTTP API** — AI agents build pages with `curl` / `fetch` requests

Both work on the same page simultaneously. Changes sync in real-time via Cloudflare KV.

## Quick Start

### For Agents (API)

```bash
# Create a session
curl -X POST https://vanillabuilder.pages.dev/api/session \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"my-page"}'

# Build a page
curl -X POST https://vanillabuilder.pages.dev/api/batch \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "my-page",
    "actions": [
      {"method":"setTheme","params":{"colors":{"primary":"#059669"}}},
      {"method":"addSection","params":{"type":"hero","options":{"headline":"Hello World","buttonText":"Click Me"}}},
      {"method":"addSection","params":{"type":"features","options":{"heading":"Why Us","items":[{"icon":"⚡","title":"Fast","description":"Zero deps"}]}}},
      {"method":"addSection","params":{"type":"footer"}},
      {"method":"getFullPage","params":{"title":"My Page"}}
    ]
  }'

# Open in browser to see the result
open "https://vanillabuilder.pages.dev/?sessionId=my-page"
```

### For Humans (Editor)

Open [vanillabuilder.pages.dev](https://vanillabuilder.pages.dev) and:

- **Drag blocks** from the left panel to the canvas
- **Double-click text** to edit inline
- **Double-click icons** to open the icon picker
- **Double-click images** to change the URL
- **Click elements** to edit styles in the right panel
- **Theme tab** to set global colors, fonts, spacing
- **Data tab** to connect APIs and form webhooks
- **Session button** to get the share link

### CLI

```bash
# Zero dependencies — uses Node.js built-ins only
node cli.cjs new                                    # Create session
node cli.cjs add hero '{"headline":"Hello"}'        # Add section
node cli.cjs theme '{"colors":{"primary":"#dc2626"}}' # Set theme
node cli.cjs info                                   # Show stats
node cli.cjs open                                   # Open editor in browser
node cli.cjs export page.html                       # Save to file
```

## Features

### Visual Editor
- **30 blocks** across 5 categories (Basic, Media, Layout, Forms, Sections)
- **Drag & drop** with position indicator
- **Inline editing** — double-click text, icons, images
- **Style panel** — Dimension, Typography, Decorations, Layout, Flexbox
- **Theme panel** — Global colors, fonts, sizes, spacing, border radius
- **Data panel** — Connect external APIs and form webhooks
- **Responsive preview** — Desktop, Tablet, Mobile
- **Collapsible sidebars** — Maximize canvas space
- **Session management** — Share link, reset session

### AI API
- **19 methods** available via HTTP
- **Stateful sessions** — persisted in Cloudflare KV, isolated per user
- **Bidirectional sync** — agent and human edit the same page in real-time
- **Changelog** — tracks who made each change (agent or editor)
- **Tool schemas** — ready for AI function calling (Anthropic, OpenAI, generic)

### Design System / Theme
- Define once, apply everywhere
- Colors (12 tokens), fonts, sizes, spacing, border radius, max width
- All sections use CSS custom properties
- Change theme → entire page updates instantly

### Data Sources & Form Actions
- **Connect any REST API** — fetch data client-side, no backend
- **Dot notation** for nested data: `response.data.items`, `{{user.address.city}}`
- **Pagination** — configurable per-page, page param, limit param
- **Auto-refresh** — poll APIs on interval
- **Form webhooks** — POST to Zapier, Make, n8n, or any URL on submit
- **Success/error messages** — configurable per form
- **Redirect on success** — optional

## API Reference

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Service status |
| `GET` | `/api/schemas` | Tool definitions (`?format=anthropic\|openai\|generic`) |
| `POST` | `/api/session` | Create session `{"sessionId":"xxx"}` |
| `GET` | `/api/session` | Check session exists `?sessionId=xxx` |
| `DELETE` | `/api/session` | Delete session `?sessionId=xxx` |
| `POST` | `/api/execute` | Execute single method |
| `POST` | `/api/batch` | Execute multiple methods |
| `GET` | `/api/poll` | Get current page state `?sessionId=xxx` |
| `POST` | `/api/sync` | Editor pushes changes to API |
| `GET` | `/api/changelog` | View change history `?sessionId=xxx` |

### API Methods (19)

**Theme:**
- `setTheme` — Set colors, fonts, sizes, spacing, borderRadius, maxWidth
- `getTheme` — Get current theme

**Content:**
- `clearPage` — Remove all content
- `addSection` — Add pre-built section (hero, features, cta, testimonials, pricing, footer, contact, faq, navbar, stats)
- `addHTML` — Add raw HTML
- `removeSection` — Remove section by index

**CSS:**
- `addCSSRule` — Add CSS rule with selector and styles
- `removeSection` — Remove by index

**Data:**
- `addDataSource` — Connect external API with template and dot notation path
- `removeDataSource` — Remove data source
- `getDataSources` — List data sources
- `addFormAction` — Add webhook to form submit
- `removeFormAction` — Remove form action
- `getFormActions` — List form actions

**Export:**
- `getHTML` — Get page body HTML
- `getCSS` — Get CSS rules
- `getFullPage` — Get complete HTML document with theme, scripts, and styles

**Query:**
- `getPageInfo` — Section count, CSS rules, theme status, data sources, form actions
- `getAvailableSections` — List 10 section types with descriptions

**Generator:**
- `buildLandingPage` — Generate complete landing page from config object

### Tool Definitions for AI

```bash
# Anthropic format
curl https://vanillabuilder.pages.dev/api/schemas?format=anthropic

# OpenAI format
curl https://vanillabuilder.pages.dev/api/schemas?format=openai
```

### Example: Agent Builds a SaaS Landing Page

```bash
curl -X POST https://vanillabuilder.pages.dev/api/batch \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "my-saas",
    "actions": [
      {"method":"setTheme","params":{"colors":{"primary":"#4f46e5"},"fonts":{"heading":"Georgia, serif"}}},
      {"method":"clearPage"},
      {"method":"addSection","params":{"type":"navbar","options":{"brand":"CloudSync","ctaText":"Try Free"}}},
      {"method":"addSection","params":{"type":"hero","options":{"headline":"Sync Everything","subheadline":"Keep your team in sync.","buttonText":"Start Free"}}},
      {"method":"addSection","params":{"type":"features","options":{"heading":"Why Us","items":[{"icon":"⚡","title":"Fast","description":"Real-time sync"},{"icon":"🔒","title":"Secure","description":"E2E encrypted"}]}}},
      {"method":"addSection","params":{"type":"pricing","options":{"heading":"Plans","plans":[{"name":"Free","price":"$0","features":["1 Project"]},{"name":"Pro","price":"$19","features":["Unlimited","Support"],"popular":true}]}}},
      {"method":"addSection","params":{"type":"footer","options":{"copyright":"2026 CloudSync"}}},
      {"method":"getFullPage","params":{"title":"CloudSync"}}
    ]
  }'
```

### Example: Connect an API and Form Webhook

```bash
curl -X POST https://vanillabuilder.pages.dev/api/batch \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "my-page",
    "actions": [
      {"method":"addHTML","params":{"html":"<div id=\"posts\"></div>"}},
      {"method":"addDataSource","params":{
        "id":"blog",
        "url":"https://my-cms.com/api/posts",
        "path":"data.posts",
        "targetSelector":"#posts",
        "template":"<article><h3>{{title}}</h3><p>{{excerpt}}</p><small>{{author.name}}</small></article>",
        "pagination":{"perPage":10}
      }},
      {"method":"addSection","params":{"type":"contact","options":{"heading":"Contact"}}},
      {"method":"addFormAction","params":{
        "id":"contact",
        "formSelector":"form",
        "webhookUrl":"https://hooks.zapier.com/xxx",
        "successMessage":"Thanks!"
      }}
    ]
  }'
```

## Collaborative Editing

Multiple users/agents can edit the same page:

1. User opens editor, gets a `sessionId`
2. User shares the session link with an agent
3. Agent makes API calls with that `sessionId`
4. Editor auto-updates via polling (every 2 seconds)
5. Human edits sync back to API via MutationObserver
6. Changelog tracks who changed what

Reset session = new `sessionId` = old collaborators lose access.

## Deploy Your Own

```bash
# Clone
git clone https://github.com/MauricioPerera/vanillabuilder.git
cd vanillabuilder

# Create Cloudflare KV namespace
npx wrangler kv namespace create VANILLABUILDER_SESSIONS
# Update wrangler.toml with the namespace ID

# Deploy
npx wrangler pages deploy public --project-name my-builder
```

## Development

```bash
npm install           # Install dev dependencies
npm test              # Run 863+ tests
npm run test:watch    # Watch mode

# Local dev
npx http-server . -p 8080 --cors -c-1
open http://localhost:8080/examples/basic.html
```

## Architecture

```
public/
  index.html            # Visual editor (single file, self-contained)

functions/api/          # Cloudflare Pages Functions (serverless API)
  _builder.js           # PageBuilder: templates, theme, data sources, form actions
  _db.js                # Session & changelog storage (Cloudflare KV)
  execute.js            # POST /api/execute
  batch.js              # POST /api/batch
  poll.js               # GET /api/poll
  sync.js               # POST /api/sync (editor → API)
  session.js            # Session CRUD
  changelog.js          # GET /api/changelog
  health.js             # GET /api/health
  schemas.js            # GET /api/schemas (AI tool definitions)

src/                    # Core framework (21 modules, 80+ files)
  core/                 # EventEmitter, ReactiveModel, ReactiveCollection
  editor/               # Editor API
  dom_components/       # Component system (20+ types)
  style_manager/        # CSS property editor
  ...

cli.cjs                 # Zero-dep CLI (Node.js built-ins only)
test/                   # 863+ tests (Vitest)
```

## Stats

| Metric | Value |
|--------|-------|
| Runtime dependencies | **0** |
| API methods | **19** |
| Section templates | **10** |
| Block types | **30** |
| Test cases | **863+** |
| Framework modules | **21** |
| Component types | **20+** |

## License

MIT
