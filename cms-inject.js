/**
 * CMS Inject — Sable & Brass Interiors
 * Fetches CMS data from /api/cms and injects content into elements
 * with data-cms attributes on the public-facing site.
 */
(function () {
  'use strict';

  const API_URL = '/api/cms';

  fetch(API_URL)
    .then(function (res) {
      if (!res.ok) return null;
      return res.json();
    })
    .then(function (data) {
      if (!data) return;

      // Inject photo URLs into <img> elements with data-cms="photo-*" or data-cms="headshot"
      var photoKeys = ['headshot', 'photo-intro', 'photo-lifestyle', 'photo-editorial', 'photo-signature'];
      photoKeys.forEach(function (key) {
        if (!data[key]) return;
        var el = document.querySelector('[data-cms="' + key + '"]');
        if (el && el.tagName === 'IMG') {
          el.src = data[key];
        }
      });

      // Inject contact info
      var contactKeys = ['contact-email', 'contact-phone', 'contact-location'];
      contactKeys.forEach(function (key) {
        if (!data[key]) return;
        var el = document.querySelector('[data-cms="' + key + '"]');
        if (!el) return;

        if (key === 'contact-email') {
          el.innerHTML = '<a href="mailto:' + data[key] + '">' + data[key] + '</a>';
        } else if (key === 'contact-phone') {
          var digits = data[key].replace(/\D/g, '');
          el.innerHTML = '<a href="tel:+' + digits + '">' + data[key] + '</a>';
        } else {
          el.textContent = data[key];
        }
      });
    })
    .catch(function () {
      // CMS not available — placeholders remain, site still works
    });
})();
