# Contributing to VanillaBuilder

Thank you for your interest in contributing!

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USER/vanillabuilder.git`
3. Install dependencies: `npm install`
4. Run tests: `npm test`
5. Start dev server: `npx http-server . -p 8080 --cors -c-1`

## Development Guidelines

### Code Style

- **ES6+ JavaScript** - No TypeScript, no transpilation required for development
- **JSDoc comments** - Use JSDoc for all public methods and classes
- **No dependencies** - Never add runtime dependencies. Dev dependencies for testing/building only
- **Native DOM** - Use `document.createElement`, `querySelector`, `classList`, etc. No jQuery
- **ESM modules** - Use `import/export` everywhere

### Architecture

- Every module extends `Module` or `ItemManagerModule` from `src/core/`
- Models extend `ReactiveModel`, collections extend `ReactiveCollection`
- Views are plain classes that create/manage DOM elements directly
- Events flow through the `EditorModel` as a central bus

### Testing

- Write tests for every new feature or bug fix
- Use Vitest: `import { describe, it, expect, vi } from 'vitest'`
- Place tests in `test/` mirroring the `src/` structure
- Run: `npm test`

### Commits

- Use clear, descriptive commit messages
- One logical change per commit
- Run tests before committing

## Module Structure

Each module follows this pattern:

```
src/module_name/
  index.js          # Module class (extends Module or ItemManagerModule)
  model/
    ModelName.js    # ReactiveModel subclass
  view/
    ViewName.js     # DOM view class
```

## Reporting Issues

- Use GitHub Issues
- Include steps to reproduce
- Include browser/OS info if UI-related
- Include test case if possible
