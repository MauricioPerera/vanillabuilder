import { saveSession, sessionExists, addLogEntry } from './_db.js';

/**
 * POST /api/sync — Editor pushes its current HTML state to the API
 * Body: { sessionId, html, source? }
 *
 * This is the reverse of /api/poll: the editor sends its changes
 * so the API (and any agent) can see what the human modified.
 */
export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));
  const { sessionId, html } = body;

  if (!sessionId) return Response.json({ ok: false, error: 'Missing "sessionId"' }, { status: 400 });
  if (html === undefined) return Response.json({ ok: false, error: 'Missing "html"' }, { status: 400 });

  const exists = await sessionExists(env, sessionId);
  if (!exists) return Response.json({ ok: false, error: 'Session not found' }, { status: 403 });

  // Save the HTML as a single section (the editor manages the full body)
  const sections = html ? [html] : [];
  await saveSession(env, sessionId, { sections, cssRules: [], syncedFromEditor: true });

  await addLogEntry(env, sessionId, {
    source: 'editor',
    action: 'sync',
    summary: 'Editor synced changes',
  });

  return Response.json({ ok: true, sessionId });
}
