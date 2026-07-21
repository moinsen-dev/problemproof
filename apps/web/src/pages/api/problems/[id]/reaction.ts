import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { bearerUser, currentUser } from '../../../../lib/auth';
import { json, readJson, requestError } from '../../../../lib/http';
import { PROOF_REACTIONS, type ProofReaction } from '../../../../lib/types';

const writableReactions = ['not_my_problem', 'skip'] as const satisfies readonly ProofReaction[];

async function reactionCounts(problemId: number) {
  return env.DB.prepare(`
    SELECT
      (SELECT COUNT(*) FROM confirmations WHERE problem_id = ?) AS confirmations,
      (SELECT COUNT(*) FROM proof_reactions WHERE problem_id = ? AND reaction_type = 'not_my_problem') AS not_my_problem,
      (SELECT COUNT(*) FROM proof_reactions WHERE problem_id = ? AND reaction_type = 'skip') AS skips
  `).bind(problemId, problemId, problemId).first<{
    confirmations: number;
    not_my_problem: number;
    skips: number;
  }>();
}

export const POST: APIRoute = async ({ params, request }) => {
  try {
    const user = await currentUser(request, env.DB, env) ?? await bearerUser(request, env.DB, env);
    if (!user) return json({ error: 'Bitte melde dich mit GitHub an.' }, { status: 401 });

    const problemId = Number(params.id);
    if (!Number.isInteger(problemId) || problemId < 1) {
      return json({ error: 'Ungültige Problem-Reaktion.' }, { status: 422 });
    }

    const body = (await readJson(request)) as Record<string, unknown>;
    const reaction = typeof body.reaction === 'string' ? body.reaction : '';
    if (!PROOF_REACTIONS.includes(reaction as ProofReaction) || !writableReactions.includes(reaction as (typeof writableReactions)[number])) {
      return json({ error: 'Ungültige Problem-Reaktion.' }, { status: 422 });
    }

    const exists = await env.DB.prepare('SELECT 1 FROM problems WHERE id = ?').bind(problemId).first();
    if (!exists) return json({ error: 'Problem nicht gefunden.' }, { status: 404 });

    const confirmed = await env.DB.prepare('SELECT 1 FROM confirmations WHERE problem_id = ? AND user_id = ?')
      .bind(problemId, user.id)
      .first();
    if (confirmed) {
      await env.DB.prepare(`
        INSERT OR IGNORE INTO proof_reactions (problem_id, user_id, reaction_type, source)
        VALUES (?, ?, 'yes', 'confirmation')
      `).bind(problemId, user.id).run();
      const counts = await reactionCounts(problemId);
      return json({
        reaction: 'yes',
        ignored: true,
        confirmations: counts?.confirmations ?? 0,
        notMyProblem: counts?.not_my_problem ?? 0,
        skips: counts?.skips ?? 0,
      });
    }

    const source = typeof body.source === 'string' && body.source.trim()
      ? body.source.trim().slice(0, 40)
      : 'proof-feed';
    await env.DB.prepare(`
      INSERT INTO proof_reactions (problem_id, user_id, reaction_type, source)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(problem_id, user_id) DO UPDATE SET
        reaction_type = excluded.reaction_type,
        source = excluded.source,
        updated_at = CURRENT_TIMESTAMP
    `).bind(problemId, user.id, reaction, source).run();

    const counts = await reactionCounts(problemId);
    return json({
      reaction,
      confirmations: counts?.confirmations ?? 0,
      notMyProblem: counts?.not_my_problem ?? 0,
      skips: counts?.skips ?? 0,
    });
  } catch (error) {
    console.error('record proof reaction failed', error);
    return requestError(error);
  }
};
