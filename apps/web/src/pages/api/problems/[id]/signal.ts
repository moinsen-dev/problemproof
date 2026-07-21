import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { bearerUser, currentUser } from '../../../../lib/auth';
import { json, readJson, requestError } from '../../../../lib/http';

export const POST: APIRoute = async ({ params, request }) => {
  try {
    const user = await currentUser(request, env.DB, env) ?? await bearerUser(request, env.DB, env);
    if (!user) return json({ error: 'Bitte melde dich mit GitHub an.' }, { status: 401 });
    const problemId = Number(params.id);
    const body = (await readJson(request)) as Record<string, unknown>;
    const participantId = `user:${user.id}`;
    const region = typeof body.region === 'string' ? body.region.trim().slice(0, 80) : '';
    if (!Number.isInteger(problemId) || problemId < 1) {
      return json({ error: 'Ungültige Bestätigung.' }, { status: 422 });
    }
    await env.DB.prepare(`
      INSERT OR IGNORE INTO confirmations (problem_id, participant_id, region, user_id)
      VALUES (?, ?, ?, ?)
    `).bind(problemId, participantId, region, user.id).run();
    const count = await env.DB.prepare(`
      SELECT COUNT(*) AS total FROM confirmations WHERE problem_id = ?
    `).bind(problemId).first<{ total: number }>();
    return json({ confirmations: count?.total ?? 0 });
  } catch (error) {
    console.error('confirm problem failed', error);
    return requestError(error);
  }
};
