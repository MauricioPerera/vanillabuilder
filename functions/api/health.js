export function onRequestGet() {
  return Response.json({ ok: true, version: '0.1.0', service: 'vanillabuilder' });
}
