import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { clearCookie, cookies, destroySession } from '../../lib/auth';

export const POST: APIRoute = async ({ request }) => {
  await destroySession(request, env.DB, env);
  return new Response(null, {
    status: 302,
    headers: {
      location: '/',
      'set-cookie': clearCookie(cookies.session),
    },
  });
};
