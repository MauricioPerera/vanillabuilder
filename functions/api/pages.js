import { loadSession } from './_db.js';
import { PageBuilder } from './_builder.js';

// GET /api/pages — list all pages for the authenticated user
export async function onRequestGet({ request, env, data }) {
  if (!data.userId) return Response.json({ ok: false, error: 'Login required' }, { status: 401 });

  const { results } = await env.DB.prepare(
    'SELECT session_id, shared, created_at FROM user_sessions WHERE user_id = ? ORDER BY created_at DESC'
  ).bind(data.userId).all();

  // Enrich with section count from KV
  const pages = [];
  for (const row of results) {
    const stored = await loadSession(env, row.session_id);
    const builder = stored ? new PageBuilder(stored) : null;
    const info = builder ? builder.getPageInfo().data : { sectionCount: 0 };
    pages.push({
      sessionId: row.session_id,
      shared: !!row.shared,
      createdAt: row.created_at,
      sectionCount: info.sectionCount,
      hasTheme: info.hasTheme || false,
    });
  }

  return Response.json({ ok: true, data: pages });
}
