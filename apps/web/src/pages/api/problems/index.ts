import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { bearerUser, currentUser } from '../../../lib/auth';
import { json, readJson, requestError } from '../../../lib/http';
import { getProblems, problemUrl } from '../../../lib/problems';
import type { FeedFilters, Origin } from '../../../lib/types';
import { parseProblemInput, slugify } from '../../../lib/validation';

export const GET: APIRoute = async ({ url }) => {
  const requestedMode = url.searchParams.get('mode');
  const requestedOrigin = url.searchParams.get('origin');
  const filters: FeedFilters = {
    mode: requestedMode === 'new' || requestedMode === 'strong' ? requestedMode : 'needs-proof',
    search: (url.searchParams.get('q') ?? '').slice(0, 120),
    region: (url.searchParams.get('region') ?? '').slice(0, 80),
    targetGroup: (url.searchParams.get('targetGroup') ?? '').slice(0, 80),
    category: (url.searchParams.get('category') ?? '').slice(0, 80),
    origin: requestedOrigin === 'firsthand' || requestedOrigin === 'hypothesis' ? (requestedOrigin as Origin) : '',
  };
  return json({ problems: await getProblems(env.DB, filters) });
};

export const POST: APIRoute = async ({ request, url }) => {
  try {
    const user = await currentUser(request, env.DB, env) ?? await bearerUser(request, env.DB, env);
    if (!user) return json({ error: 'Bitte melde dich mit GitHub an.' }, { status: 401 });
    const body = (await readJson(request)) as Record<string, unknown>;
    body.participantId = `user:${user.id}`;
    if (!body.source) body.source = request.headers.get('authorization') ? 'api' : 'web';
    const parsed = parseProblemInput(body);
    if (!parsed.data) return json({ errors: parsed.errors }, { status: 422 });
    const input = parsed.data;
    const slug = `${slugify(input.title)}-${crypto.randomUUID().slice(0, 8)}`;
    const result = await env.DB.prepare(`
      INSERT INTO problems
        (slug, title, statement, origin, target_group, region, category, consequence, author_id, source, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      slug,
      input.title,
      input.statement,
      input.origin,
      input.targetGroup,
      input.region,
      input.category,
      input.consequence,
      input.participantId,
      input.source,
      user.id,
    ).run();
    return json({
      id: result.meta.last_row_id,
      slug,
      title: input.title,
      url: problemUrl({ slug }, url.origin),
    }, { status: 201 });
  } catch (error) {
    console.error('create problem failed', error);
    return requestError(error);
  }
};
