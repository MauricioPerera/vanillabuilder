/**
 * Auth helpers — zero dependencies, Web Crypto API only
 * Password hashing (PBKDF2) and JWT (HMAC-SHA256)
 */

// ── Password Hashing (PBKDF2) ──

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const hash = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, key, 256);
  return b64url(salt) + '.' + b64url(new Uint8Array(hash));
}

export async function verifyPassword(password, stored) {
  const [saltB64, hashB64] = stored.split('.');
  const salt = unb64url(saltB64);
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const hash = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, key, 256);
  return b64url(new Uint8Array(hash)) === hashB64;
}

// ── JWT (HMAC-SHA256) ──

export async function createJWT(payload, secret, expiresIn = 86400) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const claims = { ...payload, iat: now, exp: now + expiresIn };

  const headerB64 = b64url(new TextEncoder().encode(JSON.stringify(header)));
  const claimsB64 = b64url(new TextEncoder().encode(JSON.stringify(claims)));
  const data = headerB64 + '.' + claimsB64;

  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));

  return data + '.' + b64url(new Uint8Array(sig));
}

export async function verifyJWT(token, secret) {
  try {
    const [headerB64, claimsB64, sigB64] = token.split('.');
    if (!headerB64 || !claimsB64 || !sigB64) return null;

    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    const valid = await crypto.subtle.verify('HMAC', key, unb64url(sigB64), new TextEncoder().encode(headerB64 + '.' + claimsB64));
    if (!valid) return null;

    const claims = JSON.parse(new TextDecoder().decode(unb64url(claimsB64)));
    if (claims.exp && claims.exp < Math.floor(Date.now() / 1000)) return null;

    return claims;
  } catch {
    return null;
  }
}

// ── Base64url ──

function b64url(buf) {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function unb64url(str) {
  const s = atob(str.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice(0, (4 - str.length % 4) % 4));
  const buf = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) buf[i] = s.charCodeAt(i);
  return buf;
}

// ── Cookie helpers ──

export function setAuthCookie(token) {
  return `vb_token=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`;
}

export function clearAuthCookie() {
  return 'vb_token=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0';
}

export function getCookie(request, name) {
  const cookies = request.headers.get('Cookie') || '';
  const match = cookies.match(new RegExp(`${name}=([^;]+)`));
  return match ? match[1] : null;
}
