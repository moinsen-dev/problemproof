import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { bearerUser, currentUser } from '../../../../lib/auth';
import { json, readJson, requestError } from '../../../../lib/http';
import { parseEvidenceInput } from '../../../../lib/validation';

export const POST: APIRoute = async ({ params, request }) => {
  try {
    const user = await currentUser(request, env.DB, env) ?? await bearerUser(request, env.DB, env);
    if (!user) return json({ error: 'Bitte melde dich mit GitHub an.' }, { status: 401 });
    const problemId = Number(params.id);
    if (!Number.isInteger(problemId) || problemId < 1) return json({ error: 'Problem nicht gefunden.' }, { status: 404 });
    const body = (await readJson(request)) as Record<string, unknown>;
    body.participantId = `user:${user.id}`;
    const parsed = parseEvidenceInput(body);
    if (!parsed.data) return json({ errors: parsed.errors }, { status: 422 });
    const input = parsed.data;
    const existing = await env.DB.prepare(`
      SELECT 1 FROM evidence WHERE problem_id = ? AND user_id = ?
    `).bind(problemId, user.id).first();
    if (existing) return json({ error: 'Du hast für dieses Problem bereits einen Vorfall ergänzt.' }, { status: 409 });
    await env.DB.prepare(`
      INSERT INTO evidence
        (problem_id, participant_id, happened, frequency, severity, story, workaround, region, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      problemId,
      input.participantId,
      input.happened,
      input.frequency,
      input.severity,
      input.story,
      input.workaround,
      input.region,
      user.id,
    ).run();
    await env.DB.prepare(`
      INSERT OR IGNORE INTO confirmations (problem_id, participant_id, region, user_id)
      VALUES (?, ?, ?, ?)
    `).bind(problemId, input.participantId, input.region, user.id).run();
    const totals = await env.DB.prepare(`
      SELECT
        (SELECT COUNT(*) FROM evidence WHERE problem_id = ?) AS incidents,
        (SELECT COUNT(*) FROM confirmations WHERE problem_id = ?) AS confirmations
    `).bind(problemId, problemId).first<{ incidents: number; confirmations: number }>();
    return json(totals, { status: 201 });
  } catch (error) {
    console.error('create evidence failed', error);
    return requestError(error);
  }
};
