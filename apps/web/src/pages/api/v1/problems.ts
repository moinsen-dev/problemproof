import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { json } from '../../../lib/http';

export const GET: APIRoute = async ({ url }) => {
  const region = (url.searchParams.get('region') ?? '').slice(0, 80);
  const category = (url.searchParams.get('category') ?? '').slice(0, 80);
  const where: string[] = [];
  const values: string[] = [];
  if (region) { where.push('p.region = ?'); values.push(region); }
  if (category) { where.push('p.category = ?'); values.push(category); }
  const result = await env.DB.prepare(`
    SELECT
      p.id, p.slug, p.title, p.statement, p.origin, p.target_group, p.region, p.category,
      p.consequence, p.source, p.proof_status, p.created_at,
      COUNT(DISTINCT c.id) AS confirmations,
      COUNT(DISTINCT e.id) AS incidents,
      ROUND(AVG(e.severity), 1) AS average_severity,
      (SELECT COUNT(*) FROM problem_events ev WHERE ev.problem_id = p.id AND ev.event_type = 'view') AS views,
      (SELECT COUNT(*) FROM problem_events ev WHERE ev.problem_id = p.id AND ev.event_type = 'share') AS shares
    FROM problems p
    LEFT JOIN confirmations c ON c.problem_id = p.id
    LEFT JOIN evidence e ON e.problem_id = p.id
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    GROUP BY p.id
    ORDER BY confirmations DESC, p.created_at DESC
    LIMIT 100
  `).bind(...values).all();
  return json({
    data: result.results,
    privacy: 'Nur aggregierte Interaktionen; keine Teilnehmer-IDs und keine Vorfalltexte.',
  }, {
    headers: { 'access-control-allow-origin': '*' },
  });
};
