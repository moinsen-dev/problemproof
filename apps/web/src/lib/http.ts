export function json(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set('content-type', 'application/json; charset=utf-8');
  headers.set('cache-control', 'no-store');
  return new Response(JSON.stringify(data), { ...init, headers });
}

export async function readJson(request: Request): Promise<unknown> {
  const type = request.headers.get('content-type') ?? '';
  if (!type.includes('application/json')) throw new Error('JSON_REQUIRED');
  const length = Number(request.headers.get('content-length') ?? 0);
  if (length > 20_000) throw new Error('PAYLOAD_TOO_LARGE');
  return request.json();
}

export function requestError(error: unknown): Response {
  if (error instanceof Error && error.message === 'JSON_REQUIRED') {
    return json({ error: 'Bitte sende JSON.' }, { status: 415 });
  }
  if (error instanceof Error && error.message === 'PAYLOAD_TOO_LARGE') {
    return json({ error: 'Die Eingabe ist zu groß.' }, { status: 413 });
  }
  return json({ error: 'Die Anfrage konnte nicht verarbeitet werden.' }, { status: 400 });
}
