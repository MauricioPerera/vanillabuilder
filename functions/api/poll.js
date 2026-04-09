import { loadSession, sessionExists } from './_db.js';
import { PageBuilder } from './_builder.js';

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const sid = url.searchParams.get('sessionId');

  if (!sid) return Response.json({ ok: false, error: 'Missing "sessionId"' }, { status: 400 });

  const exists = await sessionExists(env, sid);
  if (!exists) return Response.json({ ok: true, data: { html: '', sectionCount: 0, sessionValid: false } });

  const stored = await loadSession(env, sid);
  if (!stored) return Response.json({ ok: true, data: { html: '', sectionCount: 0, sessionValid: true } });

  const builder = new PageBuilder(stored);
  const { data: html } = builder.getHTML();
  const { data: info } = builder.getPageInfo();

  return Response.json({ ok: true, data: { html, ...info, sessionValid: true } });
}
