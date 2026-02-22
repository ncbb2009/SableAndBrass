/**
 * cms-inject.js — Sable & Brass CMS content injector
 * Fetches live content from /api/cms and updates the DOM.
 * Fails silently so a KV outage never breaks the static site.
 */
(async function () {
  try {
    const res = await fetch('/api/cms');
    if (!res.ok) return;
    const cms = await res.json();

    // ── Bio ──────────────────────────────────────────────────────────────
    const headshot = document.querySelector('[data-cms="headshot"]');
    if (headshot && cms.bio?.headshotUrl) headshot.src = cms.bio.headshotUrl;

    const bioName = document.querySelector('[data-cms="bio-name"]');
    if (bioName && cms.bio?.firstName) {
      bioName.textContent = '';
      bioName.appendChild(document.createTextNode(cms.bio.firstName));
      bioName.appendChild(document.createElement('br'));
      bioName.appendChild(document.createTextNode(cms.bio.lastName || ''));
    }

    const p1 = document.querySelector('[data-cms="bio-p1"]');
    if (p1 && cms.bio?.p1) p1.textContent = cms.bio.p1;

    const p2 = document.querySelector('[data-cms="bio-p2"]');
    if (p2 && cms.bio?.p2) p2.textContent = cms.bio.p2;

    const p3 = document.querySelector('[data-cms="bio-p3"]');
    if (p3 && cms.bio?.p3) p3.textContent = cms.bio.p3;

    // ── Testimonials ─────────────────────────────────────────────────────
    const grid = document.querySelector('[data-cms="testimonials"]');
    if (grid && Array.isArray(cms.testimonials) && cms.testimonials.length) {
      grid.innerHTML = cms.testimonials.map(t =>
        `<div class="testi-card revealed">
          <span class="testi-mark">"</span>
          <p class="testi-text">${esc(t.quote)}</p>
          <div class="testi-stars">${'<span>\u2605</span>'.repeat(Math.min(5, t.stars || 5))}</div>
          <div class="testi-name">${esc(t.author)}</div>
          <div class="testi-loc">${esc(t.location)}</div>
        </div>`
      ).join('');
    }

    // ── Contact (footer on all pages) ────────────────────────────────────
    if (cms.contact) {
      document.querySelectorAll('[data-cms="contact-email"]').forEach(el => {
        el.textContent = cms.contact.email;
      });
      document.querySelectorAll('[data-cms="contact-phone"]').forEach(el => {
        el.textContent = cms.contact.phone;
      });
      document.querySelectorAll('[data-cms="contact-location"]').forEach(el => {
        el.textContent = 'Interior Design \u00b7 ' + cms.contact.location;
      });
    }

    // ── Site Photos ────────────────────────────────────────────────────────
    const ph = cms.photos || {};
    ['intro', 'lifestyle', 'editorial', 'signature'].forEach(key => {
      if (ph[key]) {
        document.querySelectorAll(`[data-cms="photo-${key}"]`).forEach(el => {
          if (el.tagName === 'IMG') el.src = ph[key];
        });
      }
    });

    // ── Pricing ──────────────────────────────────────────────────────────
    const pr = cms.pricing || {};
    [
      ['consulting-hourly-rate',   pr.consulting?.hourlyRate],
      ['consulting-price-halfday', pr.consulting?.halfDay],
      ['consulting-price-fullday', pr.consulting?.fullDay],
      ['staging-price-keyrooms',   pr.staging?.keyRooms],
      ['staging-price-fullhome',   pr.staging?.fullHome],
      ['staging-price-estate',     pr.staging?.estate],
      ['rental-price-studio',      pr.rental?.studio],
      ['rental-price-premium',     pr.rental?.premium],
      ['rental-price-luxury',      pr.rental?.luxury],
      ['design-price-signature',   pr.design?.signature],
      ['design-price-roombyroom',  pr.design?.roomByRoom],
      ['design-price-wholehome',   pr.design?.wholeHome],
    ].forEach(([key, val]) => {
      if (val != null) {
        document.querySelectorAll(`[data-cms="${key}"]`).forEach(el => {
          el.textContent = val;
        });
      }
    });

  } catch (_) { /* fail silently — never break the live site */ }

  function esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
})();
