import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { bearerUser, currentUser } from '../../../../lib/auth';
import { json } from '../../../../lib/http';
import { getProblemByIdentifier, problemUrl, validationLabel } from '../../../../lib/problems';

export const GET: APIRoute = async ({ params, request, url }) => {
  const user = await currentUser(request, env.DB, env) ?? await bearerUser(request, env.DB, env);
  const problem = await getProblemByIdentifier(env.DB, params.id ?? '', user?.id ?? null);
  if (!problem) return json({ error: 'Problem nicht gefunden.' }, { status: 404 });
  return json({
    id: problem.id,
    slug: problem.slug,
    title: problem.title,
    statement: problem.statement,
    origin: problem.origin,
    targetGroup: problem.target_group,
    region: problem.region,
    category: problem.category,
    consequence: problem.consequence,
    source: problem.source,
    proofStatus: problem.proof_status,
    validationStatus: validationLabel(problem),
    confirmations: problem.confirmations_count,
    incidents: problem.incidents_count,
    averageSeverity: problem.average_severity,
    views: problem.views_count,
    shares: problem.shares_count,
    notMyProblem: problem.not_my_problem_count,
    skips: problem.skips_count,
    url: problemUrl(problem, url.origin),
    userState: {
      favorite: Boolean(problem.is_favorite),
      confirmed: Boolean(problem.user_confirmed),
      incident: Boolean(problem.user_incident),
      proofReaction: problem.user_proof_reaction,
    },
  });
};
