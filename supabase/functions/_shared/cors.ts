export function buildCorsHeaders(originHeader: string | null): Record<string, string> {
  const origin = (originHeader || '').trim()
  const isAllowed =
    !origin ||
    origin.includes('localhost') ||
    origin.includes('127.0.0.1') ||
    origin === 'https://plottrix.vercel.app' ||
    origin.endsWith('.vercel.app')

  return {
    'Access-Control-Allow-Origin': isAllowed ? (origin || '*') : 'https://plottrix.vercel.app',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Vary': 'Origin'
  }
}

export function jsonResponse(body: unknown, status: number, originHeader: string | null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...buildCorsHeaders(originHeader),
      'Content-Type': 'application/json; charset=utf-8'
    }
  })
}
