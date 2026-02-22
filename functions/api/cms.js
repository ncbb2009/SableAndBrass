/**
 * Sable & Brass Interiors — CMS API
 * Cloudflare Pages Function at /api/cms
 *
 * GET  /api/cms          — Public: returns all CMS data (photos + contact)
 * GET  /api/cms (auth)   — Admin: returns all CMS data (same, but validates token)
 * POST /api/cms (auth)   — Admin: saves CMS data to KV
 *
 * Requires:
 *   - KV namespace bound as CMS_DATA
 *   - Environment variable ADMIN_TOKEN set in Cloudflare Pages
 */

const KV_KEY = 'site-cms-data';

const VALID_SECTIONS = [
  'headshot',
  'photo-intro',
  'photo-lifestyle',
  'photo-editorial',
  'photo-signature',
  'contact-email',
  'contact-phone',
  'contact-location',
];

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

export async function onRequest(context) {
  const { request, env } = context;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const kv = env.CMS_DATA;
  if (!kv) {
    return jsonResponse({ error: 'KV not configured' }, 500);
  }

  // GET — return CMS data (public for site, or admin with auth)
  if (request.method === 'GET') {
    const authHeader = request.headers.get('Authorization');

    // If auth header present, validate it (admin is loading data)
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      if (token !== env.ADMIN_TOKEN) {
        return jsonResponse({ error: 'Unauthorized' }, 401);
      }
    }

    const data = await kv.get(KV_KEY, 'json');
    return jsonResponse(data || {});
  }

  // POST — save CMS data (requires auth)
  if (request.method === 'POST') {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    if (token !== env.ADMIN_TOKEN) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON' }, 400);
    }

    // Filter to only valid sections
    const cleaned = {};
    for (const key of VALID_SECTIONS) {
      if (body[key] && typeof body[key] === 'string') {
        cleaned[key] = body[key].trim();
      }
    }

    await kv.put(KV_KEY, JSON.stringify(cleaned));
    return jsonResponse({ success: true, saved: Object.keys(cleaned) });
  }

  return jsonResponse({ error: 'Method not allowed' }, 405);
}
