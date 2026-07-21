import type { D1Database } from '@cloudflare/workers-types';
import type { FeedFilters, ProblemRow } from './types';

const SELECT_PROBLEMS = `
  SELECT
    p.id, p.slug, p.title, p.statement, p.origin, p.target_group, p.region, p.category,
    p.consequence, p.source, p.proof_status, p.created_at,
    COUNT(DISTINCT c.id) AS confirmations_count,
    COUNT(DISTINCT e.id) AS incidents_count,
    ROUND(AVG(e.severity), 1) AS average_severity,
    GROUP_CONCAT(DISTINCT NULLIF(e.workaround, '')) AS workarounds,
    (SELECT COUNT(*) FROM problem_events ev WHERE ev.problem_id = p.id AND ev.event_type = 'view') AS views_count,
    (SELECT COUNT(*) FROM problem_events ev WHERE ev.problem_id = p.id AND ev.event_type = 'share') AS shares_count,
    CASE WHEN ? IS NOT NULL AND EXISTS (
      SELECT 1 FROM favorites f WHERE f.problem_id = p.id AND f.user_id = ?
    ) THEN 1 ELSE 0 END AS is_favorite,
    CASE WHEN ? IS NOT NULL AND EXISTS (
      SELECT 1 FROM confirmations uc WHERE uc.problem_id = p.id AND uc.user_id = ?
    ) THEN 1 ELSE 0 END AS user_confirmed,
    CASE WHEN ? IS NOT NULL AND EXISTS (
      SELECT 1 FROM evidence ue WHERE ue.problem_id = p.id AND ue.user_id = ?
    ) THEN 1 ELSE 0 END AS user_incident
  FROM problems p
  LEFT JOIN confirmations c ON c.problem_id = p.id
  LEFT JOIN evidence e ON e.problem_id = p.id`;

export async function getProblems(db: D1Database, filters: FeedFilters, userId: number | null = null): Promise<ProblemRow[]> {
  const where: string[] = [];
  const values: unknown[] = [userId, userId, userId, userId, userId, userId];
  if (filters.mode === 'needs-proof') where.push("p.proof_status = 'needs-proof'");
  if (filters.mode === 'strong') where.push("p.proof_status = 'strong'");
  if (filters.mode === 'favorites') where.push('p.id IN (SELECT problem_id FROM favorites WHERE user_id = ?)');
  if (filters.mode === 'confirmed') where.push('p.id IN (SELECT problem_id FROM confirmations WHERE user_id = ?)');
  if (filters.mode === 'posted') where.push('p.user_id = ?');
  if (filters.mode === 'favorites' || filters.mode === 'confirmed' || filters.mode === 'posted') values.push(userId ?? -1);
  if (filters.search) {
    where.push('(p.title LIKE ? OR p.statement LIKE ? OR p.target_group LIKE ? OR p.category LIKE ?)');
    const needle = `%${filters.search}%`;
    values.push(needle, needle, needle, needle);
  }
  for (const [column, value] of [
    ['p.region', filters.region],
    ['p.target_group', filters.targetGroup],
    ['p.category', filters.category],
    ['p.origin', filters.origin],
  ] as const) {
    if (value) {
      where.push(`${column} = ?`);
      values.push(value);
    }
  }
  const ordering = filters.mode === 'new' ? 'p.created_at DESC' : 'confirmations_count DESC, p.created_at DESC';
  const sql = `${SELECT_PROBLEMS}
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    GROUP BY p.id
    ORDER BY ${ordering}
    LIMIT 100`;
  const result = await db.prepare(sql).bind(...values).all<ProblemRow>();
  return result.results;
}

export async function getProblemByIdentifier(db: D1Database, identifier: string, userId: number | null = null): Promise<ProblemRow | null> {
  const numericId = Number(identifier);
  const where = Number.isInteger(numericId) && numericId > 0 ? 'p.id = ?' : 'p.slug = ?';
  const value = Number.isInteger(numericId) && numericId > 0 ? numericId : identifier;
  const result = await db.prepare(`${SELECT_PROBLEMS}
    WHERE ${where}
    GROUP BY p.id
    LIMIT 1
  `).bind(userId, userId, userId, userId, userId, userId, value).first<ProblemRow>();
  return result ?? null;
}

export function problemUrl(problem: Pick<ProblemRow, 'slug'>, origin = 'https://problemproof.moinsen.dev') {
  return `${origin.replace(/\/$/, '')}/problems/${problem.slug}`;
}

export function validationLabel(problem: Pick<ProblemRow, 'confirmations_count' | 'incidents_count' | 'views_count' | 'shares_count' | 'proof_status'>) {
  if (problem.proof_status === 'strong' || (problem.confirmations_count >= 3 && problem.incidents_count >= 3)) return 'Muster erkennbar';
  if (problem.confirmations_count > 0 || problem.incidents_count > 0 || problem.views_count > 0 || problem.shares_count > 0) return 'Erste Signale';
  return 'Unbewiesen';
}

export function validationChecks(problem: Pick<ProblemRow, 'target_group' | 'confirmations_count' | 'incidents_count' | 'views_count' | 'shares_count'>) {
  return [
    {
      label: 'Zielgruppe klar',
      status: problem.target_group.length >= 2 ? 'passed' : 'missing',
      detail: problem.target_group,
    },
    {
      label: 'Mindestens 3 Bestätigungen',
      status: problem.confirmations_count >= 3 ? 'passed' : problem.confirmations_count > 0 ? 'partial' : 'missing',
      detail: `${problem.confirmations_count}/3`,
    },
    {
      label: 'Mindestens 3 konkrete Vorfälle',
      status: problem.incidents_count >= 3 ? 'passed' : problem.incidents_count > 0 ? 'partial' : 'missing',
      detail: `${problem.incidents_count}/3`,
    },
    {
      label: 'Öffentliche Reaktion messbar',
      status: problem.views_count > 0 || problem.shares_count > 0 ? 'partial' : 'missing',
      detail: `${problem.views_count} Views · ${problem.shares_count} Shares`,
    },
  ] as const;
}

export async function getFilterOptions(db: D1Database) {
  const [regions, groups, categories] = await db.batch([
    db.prepare('SELECT DISTINCT region AS value FROM problems ORDER BY region'),
    db.prepare('SELECT DISTINCT target_group AS value FROM problems ORDER BY target_group'),
    db.prepare('SELECT DISTINCT category AS value FROM problems ORDER BY category'),
  ]);
  return {
    regions: (regions.results as { value: string }[]).map((row) => row.value),
    groups: (groups.results as { value: string }[]).map((row) => row.value),
    categories: (categories.results as { value: string }[]).map((row) => row.value),
  };
}
