import { loadSession, saveSession, sessionExists, addLogEntry } from './_db.js';
import { PageBuilder } from './_builder.js';

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));
  const { method, params, sessionId, source } = body;

  if (!method) return Response.json({ ok: false, error: 'Missing "method"' }, { status: 400 });
  if (!sessionId) return Response.json({ ok: false, error: 'Missing "sessionId"' }, { status: 400 });

  const exists = await sessionExists(env, sessionId);
  if (!exists) return Response.json({ ok: false, error: 'Session not found. Create one first via POST /api/session' }, { status: 403 });

  const stored = await loadSession(env, sessionId);
  const builder = new PageBuilder(stored);
  const result = builder.execute(method, params || {});

  await saveSession(env, sessionId, builder.toJSON());

  // Log the change
  const readOnlyMethods = ['getHTML', 'getCSS', 'getFullPage', 'getPageInfo', 'getAvailableSections'];
  if (!readOnlyMethods.includes(method)) {
    await addLogEntry(env, sessionId, {
      source: source || 'api',
      action: method,
      summary: summarize(method, params),
    });
  }

  return Response.json({ ...result, sessionId });
}

function summarize(method, params) {
  switch (method) {
    case 'clearPage': return 'Cleared page';
    case 'addSection': return `Added ${params?.type || 'unknown'} section`;
    case 'addHTML': return 'Added custom HTML';
    case 'addCSSRule': return `Added CSS rule: ${params?.selector || ''}`;
    case 'removeSection': return `Removed section ${params?.index}`;
    case 'buildLandingPage': return 'Built landing page';
    default: return method;
  }
}
