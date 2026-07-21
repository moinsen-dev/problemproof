import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { authConfig, currentUser, randomToken, tokenHash } from '../../../lib/auth';
import { json, readJson, requestError } from '../../../lib/http';

export const POST: APIRoute = async ({ request }) => {
  try {
    const user = await currentUser(request, env.DB, env);
    if (!user) return json({ error: 'Bitte melde dich mit GitHub an.' }, { status: 401 });
    const config = authConfig(env);
    const body = (await readJson(request)) as Record<string, unknown>;
    const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim().slice(0, 80) : 'Skill token';
    const token = `pp_${await randomToken(32)}`;
    const hash = await tokenHash(config.sessionSecret, token);
    await env.DB.prepare(`
      INSERT INTO personal_tokens (user_id, name, token_hash)
      VALUES (?, ?, ?)
    `).bind(user.id, name, hash).run();
    return json({ token, name }, { status: 201 });
  } catch (error) {
    console.error('create token failed', error);
    return requestError(error);
  }
};
