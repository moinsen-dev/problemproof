import type { D1Database } from '@cloudflare/workers-types';

const sessionCookie = 'pp_session';
const oauthStateCookie = 'pp_oauth_state';
const oauthVerifierCookie = 'pp_oauth_verifier';
const thirtyDays = 60 * 60 * 24 * 30;

export interface AuthEnv {
  DB?: unknown;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  IDENTITY_HMAC_SECRET?: string;
  SESSION_SECRET?: string;
}

export interface AuthUser {
  id: number;
  displayName: string;
}

export function authConfig(env: AuthEnv) {
  const clientId = env.GITHUB_CLIENT_ID ?? '';
  const clientSecret = env.GITHUB_CLIENT_SECRET ?? '';
  const identitySecret = env.IDENTITY_HMAC_SECRET ?? '';
  const sessionSecret = env.SESSION_SECRET ?? '';
  return {
    clientId,
    clientSecret,
    identitySecret,
    sessionSecret,
    enabled: Boolean(clientId && clientSecret && identitySecret && sessionSecret),
  };
}

export function getCookie(request: Request, name: string): string {
  const cookie = request.headers.get('cookie') ?? '';
  const match = cookie.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : '';
}

export function cookie(name: string, value: string, options: { maxAge?: number; path?: string; httpOnly?: boolean } = {}) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    `Path=${options.path ?? '/'}`,
    'SameSite=Lax',
    'Secure',
  ];
  if (options.httpOnly ?? true) parts.push('HttpOnly');
  if (typeof options.maxAge === 'number') parts.push(`Max-Age=${options.maxAge}`);
  return parts.join('; ');
}

export function clearCookie(name: string) {
  return cookie(name, '', { maxAge: 0 });
}

export async function randomToken(bytes = 32): Promise<string> {
  const data = new Uint8Array(bytes);
  crypto.getRandomValues(data);
  return base64Url(data);
}

function base64Url(data: ArrayBuffer | Uint8Array): string {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function digest(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  return base64Url(await crypto.subtle.digest('SHA-256', data));
}

export async function hmac(secret: string, value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return base64Url(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value)));
}

export async function pkceChallenge(verifier: string): Promise<string> {
  return digest(verifier);
}

export async function sessionHash(secret: string, token: string): Promise<string> {
  return hmac(secret, `session:${token}`);
}

export async function tokenHash(secret: string, token: string): Promise<string> {
  return hmac(secret, `pat:${token}`);
}

export async function currentUser(request: Request, db: D1Database, env: AuthEnv): Promise<AuthUser | null> {
  const config = authConfig(env);
  if (!config.enabled) return null;
  const token = getCookie(request, sessionCookie);
  if (!token) return null;
  const hash = await sessionHash(config.sessionSecret, token);
  const row = await db.prepare(`
    SELECT u.id, u.display_name
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > datetime('now')
  `).bind(hash).first<{ id: number; display_name: string }>();
  return row ? { id: row.id, displayName: row.display_name } : null;
}

export async function bearerUser(request: Request, db: D1Database, env: AuthEnv): Promise<AuthUser | null> {
  const config = authConfig(env);
  if (!config.enabled) return null;
  const auth = request.headers.get('authorization') ?? '';
  const match = auth.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  const hash = await tokenHash(config.sessionSecret, match[1].trim());
  const row = await db.prepare(`
    SELECT u.id, u.display_name
    FROM personal_tokens t
    JOIN users u ON u.id = t.user_id
    WHERE t.token_hash = ? AND t.revoked_at IS NULL
  `).bind(hash).first<{ id: number; display_name: string }>();
  if (!row) return null;
  await db.prepare('UPDATE personal_tokens SET last_used_at = CURRENT_TIMESTAMP WHERE token_hash = ?').bind(hash).run();
  return { id: row.id, displayName: row.display_name };
}

export async function createSession(db: D1Database, env: AuthEnv, userId: number): Promise<string> {
  const config = authConfig(env);
  const token = await randomToken(32);
  const hash = await sessionHash(config.sessionSecret, token);
  await db.prepare(`
    INSERT INTO sessions (user_id, token_hash, expires_at)
    VALUES (?, ?, datetime('now', '+30 days'))
  `).bind(userId, hash).run();
  return token;
}

export async function destroySession(request: Request, db: D1Database, env: AuthEnv): Promise<void> {
  const config = authConfig(env);
  const token = getCookie(request, sessionCookie);
  if (!token || !config.enabled) return;
  await db.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sessionHash(config.sessionSecret, token)).run();
}

export const cookies = {
  session: sessionCookie,
  oauthState: oauthStateCookie,
  oauthVerifier: oauthVerifierCookie,
  maxAge: thirtyDays,
};
