/* ============================================================================
   Heli — analytics
   ----------------------------------------------------------------------------
   ONE PLACE TO TURN THIS ON. Paste your IDs into HELI_ANALYTICS below and
   everything else wires itself up. Until an ID is filled in, that provider
   stays completely dormant — no network calls, no console noise.

   Where to get the IDs
     GA4 measurement ID  ->  analytics.google.com -> Admin -> Data streams
                             -> your web stream. Looks like "G-XXXXXXXXXX".
     Meta Pixel ID       ->  business.facebook.com -> Events Manager
                             -> Data sources. A 15-16 digit number.

   What gets tracked once IDs are in
     page_view       every page (automatic)
     generate_lead   inquiry form submitted successfully  <- optimise for this.
                     Mark it as a conversion in GA4 and as your Meta objective.
     form_start      first keystroke in the inquiry form (start vs. finish =
                     your abandonment rate)
     form_error      submission failed
     cta_click       any Check Availability / pricing CTA, labelled by
                     placement so you can see which one earns the click
     scroll_depth    25 / 50 / 75 / 90 % — shows where the page loses people
     contact_click   email, phone, or WhatsApp link clicked
   ========================================================================== */

(function () {
  'use strict';

  var HELI_ANALYTICS = {
    // ---------------------------------------------------------------------
    // TODO: paste your IDs here. Leave blank to keep a provider switched off.
    // ---------------------------------------------------------------------
    ga4MeasurementId: '', // e.g. 'G-XXXXXXXXXX'
    metaPixelId: '',      // e.g. '1234567890123456'
    debug: false          // true = log events to the console instead of
                          // sending them. Handy for checking wiring locally.
  };

  var hasGA4 = /^G-[A-Z0-9]+$/i.test(HELI_ANALYTICS.ga4MeasurementId);
  var hasMeta = /^\d{10,20}$/.test(HELI_ANALYTICS.metaPixelId);

  /* -- GA4 loader --------------------------------------------------------- */
  if (hasGA4) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', HELI_ANALYTICS.ga4MeasurementId);

    var ga = document.createElement('script');
    ga.async = true;
    ga.src = 'https://www.googletagmanager.com/gtag/js?id=' +
      encodeURIComponent(HELI_ANALYTICS.ga4MeasurementId);
    document.head.appendChild(ga);
  }

  /* -- Meta Pixel loader -------------------------------------------------- */
  if (hasMeta) {
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
      t = b.createElement(e); t.async = !0; t.src = v;
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', HELI_ANALYTICS.metaPixelId);
    window.fbq('track', 'PageView');
  }

  /* -- Unified track() ---------------------------------------------------- */
  var META_EVENT_MAP = {
    generate_lead: 'Lead',
    form_start: 'InitiateCheckout',
    contact_click: 'Contact'
  };

  function track(eventName, params) {
    params = params || {};

    if (HELI_ANALYTICS.debug) {
      console.log('[heli-analytics]', eventName, params);
      return;
    }
    if (hasGA4 && typeof window.gtag === 'function') {
      window.gtag('event', eventName, params);
    }
    if (hasMeta && typeof window.fbq === 'function') {
      if (META_EVENT_MAP[eventName]) {
        window.fbq('track', META_EVENT_MAP[eventName], params);
      } else {
        window.fbq('trackCustom', eventName, params);
      }
    }
  }

  // Exposed so events/script.js can fire generate_lead / form_error.
  window.heliTrack = track;

  /* -- CTA + contact clicks ----------------------------------------------- */
  document.addEventListener('click', function (event) {
    var link = event.target && event.target.closest
      ? event.target.closest('a, button')
      : null;
    if (!link) return;

    var href = link.getAttribute('href') || '';
    var label = (link.textContent || '').trim().slice(0, 60);

    if (href.indexOf('mailto:') === 0) {
      track('contact_click', { method: 'email', link_text: label });
      return;
    }
    if (href.indexOf('tel:') === 0) {
      track('contact_click', { method: 'phone', link_text: label });
      return;
    }
    if (href.indexOf('wa.me') > -1 || href.indexOf('whatsapp') > -1) {
      track('contact_click', { method: 'whatsapp', link_text: label });
      return;
    }
    if (link.hasAttribute('data-cta')) {
      track('cta_click', {
        cta_location: link.getAttribute('data-cta'),
        link_text: label
      });
    }
  }, true);

  /* -- Form start (fires once) -------------------------------------------- */
  var inquiryForm = document.getElementById('heliEventForm');
  if (inquiryForm) {
    var startFired = false;
    inquiryForm.addEventListener('input', function () {
      if (startFired) return;
      startFired = true;
      track('form_start', { form_id: 'heliEventForm' });
    }, true);
  }

  /* -- Scroll depth ------------------------------------------------------- */
  var marks = [25, 50, 75, 90];
  var fired = {};
  var ticking = false;

  function measureScroll() {
    ticking = false;
    var doc = document.documentElement;
    var scrollable = doc.scrollHeight - window.innerHeight;
    if (scrollable <= 0) return;

    var pct = ((window.scrollY || doc.scrollTop) / scrollable) * 100;
    for (var i = 0; i < marks.length; i += 1) {
      var mark = marks[i];
      if (pct >= mark && !fired[mark]) {
        fired[mark] = true;
        track('scroll_depth', { percent_scrolled: mark });
      }
    }
    if (fired[90]) {
      window.removeEventListener('scroll', onScroll);
    }
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(measureScroll);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
}());
