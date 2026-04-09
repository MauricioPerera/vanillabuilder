import { PageBuilder } from './_builder.js';

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const sid = url.searchParams.get('sessionId') || 'default';

  const stored = await env.SESSIONS.get(sid, 'json').catch(() => null);
  if (!stored) return Response.json({ ok: true, data: { html: '', sectionCount: 0 } });

  const builder = new PageBuilder(stored);
  const { data: html } = builder.getHTML();
  const { data: info } = builder.getPageInfo();

  return Response.json({ ok: true, data: { html, ...info } });
}
