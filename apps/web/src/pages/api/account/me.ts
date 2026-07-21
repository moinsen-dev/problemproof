import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { bearerUser, currentUser } from '../../../lib/auth';
import { json } from '../../../lib/http';

export const GET: APIRoute = async ({ request }) => {
  const user = await currentUser(request, env.DB, env) ?? await bearerUser(request, env.DB, env);
  if (!user) return json({ error: 'Bitte melde dich mit GitHub an.' }, { status: 401 });
  return json({
    id: user.id,
    displayName: user.displayName,
  });
};
