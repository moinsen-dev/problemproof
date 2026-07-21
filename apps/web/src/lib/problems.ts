import type { D1Database } from '@cloudflare/workers-types';
import type { FeedFilters, ProblemRow } from './types';

const SELECT_PROBLEMS = `
  SELECT
    p.id, p.slug, p.statement, p.origin, p.target_group, p.region, p.category,
    p.consequence, p.proof_status, p.created_at,
    COUNT(DISTINCT c.id) AS confirmations_count,
    COUNT(DISTINCT e.id) AS incidents_count,
    ROUND(AVG(e.severity), 1) AS average_severity,
    GROUP_CONCAT(DISTINCT NULLIF(e.workaround, '')) AS workarounds
  FROM problems p
  LEFT JOIN confirmations c ON c.problem_id = p.id
  LEFT JOIN evidence e ON e.problem_id = p.id`;

export async function getProblems(db: D1Database, filters: FeedFilters): Promise<ProblemRow[]> {
  const where: string[] = [];
  const values: unknown[] = [];
  if (filters.mode === 'needs-proof') where.push("p.proof_status = 'needs-proof'");
  if (filters.mode === 'strong') where.push("p.proof_status = 'strong'");
  if (filters.search) {
    where.push('(p.statement LIKE ? OR p.target_group LIKE ? OR p.category LIKE ?)');
    const needle = `%${filters.search}%`;
    values.push(needle, needle, needle);
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
