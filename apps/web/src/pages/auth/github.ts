import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { authConfig, cookie, cookies, pkceChallenge, randomToken } from '../../lib/auth';

export const GET: APIRoute = async ({ url }) => {
  const config = authConfig(env);
  if (!config.enabled) return new Response('GitHub login is not configured yet.', { status: 503 });

  const state = await randomToken(24);
  const verifier = await randomToken(48);
  const challenge = await pkceChallenge(verifier);
  const redirectUri = `${url.origin}/auth/github/callback`;
  const returnTo = url.searchParams.get('returnTo') ?? '/';

  const authorize = new URL('https://github.com/login/oauth/authorize');
  authorize.searchParams.set('client_id', config.clientId);
  authorize.searchParams.set('redirect_uri', redirectUri);
  authorize.searchParams.set('scope', '');
  authorize.searchParams.set('state', state);
  authorize.searchParams.set('code_challenge', challenge);
  authorize.searchParams.set('code_challenge_method', 'S256');
  authorize.searchParams.set('prompt', 'select_account');

  const headers = new Headers({ location: authorize.toString() });
  headers.append('set-cookie', cookie(cookies.oauthState, `${state}:${returnTo}`, { maxAge: 600 }));
  headers.append('set-cookie', cookie(cookies.oauthVerifier, verifier, { maxAge: 600 }));
  return new Response(null, { status: 302, headers });
};
