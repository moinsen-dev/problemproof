import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { currentUser } from '../../../../lib/auth';
import { json, readJson, requestError } from '../../../../lib/http';

const eventTypes = ['view', 'share'] as const;

function referrerSource(referrer: string) {
  if (!referrer) return 'direct';
  try {
    const host = new URL(referrer).hostname.toLowerCase();
    if (host.includes('linkedin.')) return 'linkedin';
    if (host.includes('github.')) return 'github';
    if (host.includes('problemproof.moinsen.dev')) return 'problemproof';
    if (host.includes('moinsen.dev')) return 'moinsen';
    return 'external';
  } catch {
    return 'unknown';
  }
}

export const POST: APIRoute = async ({ params, request }) => {
  try {
    const problemId = Number(params.id);
    if (!Number.isInteger(problemId) || problemId < 1) return json({ error: 'Problem nicht gefunden.' }, { status: 404 });
    const body = (await readJson(request)) as Record<string, unknown>;
    const eventType = typeof body.eventType === 'string' ? body.eventType : '';
    if (!eventTypes.includes(eventType as (typeof eventTypes)[number])) {
      return json({ error: 'Ungültiges Ereignis.' }, { status: 422 });
    }
    const exists = await env.DB.prepare('SELECT 1 FROM problems WHERE id = ?').bind(problemId).first();
    if (!exists) return json({ error: 'Problem nicht gefunden.' }, { status: 404 });
    const user = await currentUser(request, env.DB, env);
    const referrer = (request.headers.get('referer') ?? '').slice(0, 240);
    const source = typeof body.source === 'string' && body.source.trim()
      ? body.source.trim().slice(0, 40)
      : referrerSource(referrer);
    await env.DB.prepare(`
      INSERT INTO problem_events (problem_id, user_id, event_type, source, referrer)
      VALUES (?, ?, ?, ?, ?)
    `).bind(problemId, user?.id ?? null, eventType, source, referrer).run();
    return json({ ok: true });
  } catch (error) {
    console.error('track problem event failed', error);
    return requestError(error);
  }
};
