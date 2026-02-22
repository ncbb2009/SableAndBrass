/**
 * Cloudflare Pages Function — /api/cms
 *
 * ── CLOUDFLARE SETUP (one-time) ──────────────────────────────────────────────
 *
 * 1. Create a KV namespace:
 *    Cloudflare dashboard → Workers & Pages → KV → Create namespace
 *    Name it: sable-brass-cms
 *
 * 2. Bind the KV namespace to your Pages project:
 *    Pages → sable-and-brass → Settings → Functions → KV namespace bindings
 *    Variable name : CMS_DATA
 *    KV namespace  : sable-brass-cms
 *    (Add to both Production and Preview)
 *
 * 3. Add an environment variable (same Settings page → Environment variables):
 *    Variable name : ADMIN_TOKEN
 *    Value         : <choose-a-strong-secret-token>
 *    (Add to both Production and Preview)
 *
 * 4. Redeploy the Pages project to activate the bindings.
 *    (Push a commit or use "Retry deployment" in the dashboard.)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const DEFAULTS = {
  bio: {
    headshotUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&q=80',
    firstName: 'Yohanna',
    lastName: 'Mueller',
    p1: "Born in Munich with a decade shaped by New York's most prestigious design houses, Yohanna Mueller arrived in San Francisco with a singular vision: to create interiors that do not merely look beautiful, but feel profoundly, unmistakably right.",
    p2: "Her signature aesthetic — Refined Organic Coastal Modern — weaves together the breezy calm of coastal living, the timeless balance of transitional architecture, and the meditative restraint of Japandi minimalism. The result: spaces that feel simultaneously deeply luxurious and immediately, organically at home.",
    p3: "Her creative lineage draws from Kelly Wearstler's sculptural warmth, Amber Lewis's textured coastal sophistication, Axel Vervoordt's museum-like serenity, Nate Berkus's layered elegance, and Vincent Van Duysen's architectural precision — all filtered through Yohanna's irreplaceable personal vision."
  },
  testimonials: [
    { quote: "Yohanna didn't just design our Pacific Heights home — she understood the life we wanted to live inside it. Every room is a perfect balance of calm and sophistication. We have hosted world-class guests who have been rendered speechless. Sable & Brass is in a category of one.", author: "Alexandra & James Whitmore", location: "Pacific Heights, San Francisco", stars: 5 },
    { quote: "After staging our Noe Valley property with Yohanna, we received four offers over asking within the first weekend. Buyers didn't just want the house — they wanted the life she had created inside it. The ROI was extraordinary. She is simply in a league entirely her own.", author: "David Chen", location: "Real Estate Developer · Noe Valley", stars: 5 },
    { quote: "Our rental property was performing averagely. Yohanna's team transformed it completely. Our new monthly rate is 32% higher and we're booked months in advance. The investment paid for itself inside a year. There are no words adequate for this level of talent and vision.", author: "Priya Mehta-Sandoval", location: "Rental Portfolio Owner · Marina District", stars: 5 },
    { quote: "I have worked with designers in New York, London, and Milan. Yohanna Mueller is the only one who truly listened — who understood I didn't want a beautiful home, I wanted a sanctuary. She delivered something I didn't know was possible. I will never work with anyone else.", author: "Catherine Roux", location: "Founder & CEO · Pacific Union Capital", stars: 5 },
    { quote: "The consulting session alone was worth its weight in gold. In two hours, Yohanna resolved problems we had lived with for years — with such elegant simplicity. The hourly rate seems significant until you realize it eliminates months of costly mistakes. Utterly transformational.", author: "Marcus & Elena Hoffmann", location: "Atherton, California", stars: 5 },
    { quote: "Our whole-home makeover in Sea Cliff is the closest thing to perfection I have experienced in any domain of my life. Yohanna's aesthetic — that extraordinary blend of coastal serenity and Japandi restraint — is unlike anything you will find anywhere else. Forever grateful.", author: "Thomas & Ingrid Bergström", location: "Sea Cliff, San Francisco", stars: 5 }
  ],
  contact: {
    email: 'hello@sableandbrass.com',
    phone: '+1 (415) 555-0190',
    location: 'San Francisco, California'
  },
  photos: {
    intro: '',
    lifestyle: '',
    editorial: '',
    signature: ''
  },
  pricing: {
    consulting: { hourlyRate: '$650', halfDay: '$4,800', fullDay: '$8,500' },
    staging:    { keyRooms: '$6,500', fullHome: '$14,500', estate: 'Custom' },
    rental:     { studio: 'From $18K', premium: 'From $45K', luxury: 'Custom' },
    design:     { signature: 'From $18K', roomByRoom: 'From $55K', wholeHome: 'Custom' }
  }
};

/** Deep merge: defaults ← stored (preserves nested defaults for missing keys) */
function deepMerge(defaults, stored) {
  const result = { ...defaults };
  for (const key of Object.keys(stored)) {
    if (
      result[key] && typeof result[key] === 'object' && !Array.isArray(result[key]) &&
      stored[key] && typeof stored[key] === 'object' && !Array.isArray(stored[key])
    ) {
      result[key] = deepMerge(result[key], stored[key]);
    } else {
      result[key] = stored[key];
    }
  }
  return result;
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

/** Preflight */
export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

/** Public content fetch — used by cms-inject.js on every page */
export async function onRequestGet({ env }) {
  try {
    const stored = await env.CMS_DATA?.get('content', { type: 'json' });
    // Deep merge: preserve default values for any missing nested keys
    const data = stored ? deepMerge(DEFAULTS, stored) : DEFAULTS;
    return new Response(JSON.stringify(data), {
      headers: {
        ...CORS,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300'
      }
    });
  } catch (_) {
    return new Response(JSON.stringify(DEFAULTS), {
      headers: { ...CORS, 'Content-Type': 'application/json' }
    });
  }
}

/** Admin write — requires Authorization: Bearer <ADMIN_TOKEN> */
export async function onRequestPost({ request, env }) {
  const auth = request.headers.get('Authorization') || '';
  if (!env.ADMIN_TOKEN || auth !== `Bearer ${env.ADMIN_TOKEN}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...CORS, 'Content-Type': 'application/json' }
    });
  }

  let body;
  try {
    body = await request.json();
  } catch (_) {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...CORS, 'Content-Type': 'application/json' }
    });
  }

  const { section, data } = body;

  // Token verification probe — doesn't write anything
  if (section === '_verify') {
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...CORS, 'Content-Type': 'application/json' }
    });
  }

  const VALID_SECTIONS = ['bio', 'testimonials', 'contact', 'pricing', 'photos'];
  if (!VALID_SECTIONS.includes(section)) {
    return new Response(JSON.stringify({ error: 'Invalid section' }), {
      status: 400,
      headers: { ...CORS, 'Content-Type': 'application/json' }
    });
  }

  try {
    const existing = (await env.CMS_DATA.get('content', { type: 'json' })) || { ...DEFAULTS };
    existing[section] = data;
    await env.CMS_DATA.put('content', JSON.stringify(existing));
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...CORS, 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' }
    });
  }
}
