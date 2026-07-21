import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import {
  authConfig,
  clearCookie,
  cookie,
  cookies,
  createSession,
  getCookie,
  hmac,
} from '../../../lib/auth';

interface GitHubTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface GitHubUserResponse {
  id: number;
  login: string;
  created_at: string;
}

export const GET: APIRoute = async ({ request, url }) => {
  const config = authConfig(env);
  if (!config.enabled) return new Response('GitHub login is not configured yet.', { status: 503 });

  const code = url.searchParams.get('code') ?? '';
  const state = url.searchParams.get('state') ?? '';
  const storedState = getCookie(request, cookies.oauthState);
  const verifier = getCookie(request, cookies.oauthVerifier);
  const [expectedState, returnTo = '/'] = storedState.split(':');
  if (!code || !state || !expectedState || state !== expectedState || !verifier) {
    return new Response('Invalid OAuth callback.', { status: 400 });
  }

  const redirectUri = `${url.origin}/auth/github/callback`;
  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'user-agent': 'ProblemProof/0.1',
    },
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: redirectUri,
      code_verifier: verifier,
    }),
  });
  const tokenData = await tokenResponse.json() as GitHubTokenResponse;
  if (!tokenResponse.ok || !tokenData.access_token) {
    return new Response(tokenData.error_description ?? 'GitHub token exchange failed.', { status: 400 });
  }

  const userResponse = await fetch('https://api.github.com/user', {
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${tokenData.access_token}`,
      'user-agent': 'ProblemProof/0.1',
      'x-github-api-version': '2022-11-28',
    },
  });
  if (!userResponse.ok) return new Response('GitHub identity lookup failed.', { status: 400 });
  const githubUser = await userResponse.json() as GitHubUserResponse;
  const subjectHash = await hmac(config.identitySecret, `github:${githubUser.id}`);

  let identity = await env.DB.prepare(`
    SELECT user_id FROM identities WHERE provider = 'github' AND provider_subject_hash = ?
  `).bind(subjectHash).first<{ user_id: number }>();

  if (!identity) {
    const user = await env.DB.prepare(`
      INSERT INTO users (display_name) VALUES (?)
    `).bind(githubUser.login ? `@${githubUser.login}` : 'GitHub account').run();
    const userId = Number(user.meta.last_row_id);
    await env.DB.prepare(`
      INSERT INTO identities (user_id, provider, provider_subject_hash, provider_login, provider_created_at)
      VALUES (?, 'github', ?, ?, ?)
    `).bind(userId, subjectHash, githubUser.login, githubUser.created_at).run();
    identity = { user_id: userId };
  } else {
    await env.DB.prepare(`
      UPDATE identities
      SET provider_login = ?, provider_created_at = ?, updated_at = CURRENT_TIMESTAMP
      WHERE provider = 'github' AND provider_subject_hash = ?
    `).bind(githubUser.login, githubUser.created_at, subjectHash).run();
    await env.DB.prepare(`
      UPDATE users SET display_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(githubUser.login ? `@${githubUser.login}` : 'GitHub account', identity.user_id).run();
  }

  const session = await createSession(env.DB, env, identity.user_id);
  const headers = new Headers({ location: returnTo.startsWith('/') ? returnTo : '/' });
  headers.append('set-cookie', cookie(cookies.session, session, { maxAge: cookies.maxAge }));
  headers.append('set-cookie', clearCookie(cookies.oauthState));
  headers.append('set-cookie', clearCookie(cookies.oauthVerifier));
  return new Response(null, { status: 302, headers });
};
