import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { currentUser } from '../../../../lib/auth';
import { json, requestError } from '../../../../lib/http';

async function favorite(request: Request, problemId: number, enabled: boolean) {
  const user = await currentUser(request, env.DB, env);
  if (!user) return json({ error: 'Bitte melde dich mit GitHub an.' }, { status: 401 });
  if (!Number.isInteger(problemId) || problemId < 1) return json({ error: 'Problem nicht gefunden.' }, { status: 404 });
  if (enabled) {
    await env.DB.prepare('INSERT OR IGNORE INTO favorites (problem_id, user_id) VALUES (?, ?)').bind(problemId, user.id).run();
  } else {
    await env.DB.prepare('DELETE FROM favorites WHERE problem_id = ? AND user_id = ?').bind(problemId, user.id).run();
  }
  return json({ favorite: enabled });
}

export const POST: APIRoute = async ({ params, request }) => {
  try {
    return favorite(request, Number(params.id), true);
  } catch (error) {
    console.error('favorite problem failed', error);
    return requestError(error);
  }
};

export const DELETE: APIRoute = async ({ params, request }) => {
  try {
    return favorite(request, Number(params.id), false);
  } catch (error) {
    console.error('unfavorite problem failed', error);
    return requestError(error);
  }
};
