import { clearAuthCookie } from '../_auth.js';

export async function onRequestPost() {
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json', 'Set-Cookie': clearAuthCookie() },
  });
}
