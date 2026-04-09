import { PageBuilder } from './_builder.js';

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));
  const { method, params, sessionId } = body;

  if (!method) return Response.json({ ok: false, error: 'Missing "method"' }, { status: 400 });

  const sid = sessionId || 'default';

  // Load session from KV
  const stored = await env.SESSIONS.get(sid, 'json').catch(() => null);
  const builder = new PageBuilder(stored);

  // Execute
  const result = builder.execute(method, params || {});

  // Save session to KV (expire after 1 hour)
  await env.SESSIONS.put(sid, JSON.stringify(builder.toJSON()), { expirationTtl: 3600 });

  return Response.json({ ...result, sessionId: sid });
}
