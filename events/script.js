(function () {
  document.documentElement.classList.add('js');

  var header = document.getElementById('siteHeader');
  var navToggle = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');

  if (header && navToggle) {
    navToggle.addEventListener('click', function () {
      var open = header.classList.toggle('nav-open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });

    if (navLinks) {
      navLinks.addEventListener('click', function (event) {
        if (event.target && event.target.tagName === 'A') {
          header.classList.remove('nav-open');
          navToggle.setAttribute('aria-expanded', 'false');
          navToggle.setAttribute('aria-label', 'Open menu');
        }
      });
    }
  }

  var cartImage = document.getElementById('heroCartImage');
  if (cartImage) {
    cartImage.addEventListener('error', function handleImageError() {
      var fallback = cartImage.getAttribute('data-fallback');
      if (fallback && cartImage.getAttribute('src') !== fallback) {
        cartImage.setAttribute('src', fallback);
      }
    });
  }

  var HELI_FORM_API = 'https://heli-form-api.helifrozenyogurt.workers.dev';

  function submitHeliForm(payload) {
    return fetch(HELI_FORM_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (body) {
        if (!response.ok || !body.success) {
          throw new Error(body.error || 'Submission failed');
        }
        return body;
      });
    });
  }

  var form = document.getElementById('heliEventForm');
  var statusEl = document.getElementById('heliEventStatus');

  if (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var button = form.querySelector('button[type="submit"]');
      var originalText = button ? button.textContent : '';
      var formData = new FormData(form);
      var eventDate = formData.get('eventDate') || '';
      var guestCount = formData.get('guestCount') || '';
      var eventDetails = formData.get('eventDetails') || '';
      var eventType = formData.get('eventType') || '';
      var venueArea = formData.get('venueArea') || '';

      if (button) {
        button.disabled = true;
        button.textContent = 'Sending…';
      }
      if (statusEl) {
        statusEl.className = 'form-status';
        statusEl.textContent = '';
      }

      submitHeliForm({
        type: 'Event inquiry',
        location: venueArea,
        propertyType: eventType,
        addressCity: venueArea,
        footTraffic: [
          'Event date: ' + eventDate,
          'Guest count: ' + guestCount,
          eventDetails ? 'Details: ' + eventDetails : ''
        ].filter(Boolean).join(' | '),
        contactName: formData.get('contactName') || '',
        email: formData.get('contactEmail') || '',
        phone: formData.get('contactPhone') || '',
        website: formData.get('website') || ''
      }).then(function () {
        if (typeof window.heliTrack === 'function') {
          window.heliTrack('generate_lead', {
            form_id: 'heliEventForm',
            event_type: eventType,
            guest_count: guestCount
          });
        }
        form.reset();
        var title = document.getElementById('eventFormTitle');
        if (title) { title.hidden = true; }
        form.hidden = true;
        var success = document.getElementById('heliEventSuccess');
        if (success) {
          success.hidden = false;
          success.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }).catch(function () {
        if (typeof window.heliTrack === 'function') {
          window.heliTrack('form_error', { form_id: 'heliEventForm' });
        }
        if (statusEl) {
          statusEl.className = 'form-status err';
          statusEl.innerHTML = 'Something went wrong. Please email us directly at <a href="mailto:hello@helifrozenyogurt.com">hello@helifrozenyogurt.com</a>.';
        }
      }).finally(function () {
        if (button) {
          button.disabled = false;
          button.textContent = originalText;
        }
      });
    });
  }

  /* --------------------------------------------------------------
     Scroll reveal
     Previously: threshold 0.12 with no rootMargin and a .6s transition.
     On tall sections that fired late enough to leave a full viewport of
     blank white mid-scroll. Now:
       - threshold 0 + negative bottom rootMargin => fires just before the
         element enters view, so it is already opaque when the user gets there
       - anything in or above the first viewport is revealed immediately
       - a 2s failsafe reveals everything if the observer never fires
     -------------------------------------------------------------- */
  var revealEls = document.querySelectorAll('[data-reveal]');

  function revealAll() {
    for (var i = 0; i < revealEls.length; i += 1) {
      revealEls[i].classList.add('is-visible');
    }
  }

  if (!revealEls.length) {
    // nothing to do
  } else if (!('IntersectionObserver' in window)) {
    revealAll();
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });

    for (var j = 0; j < revealEls.length; j += 1) {
      var el = revealEls[j];
      // Above-the-fold content is never animated in - it must be there on paint.
      if (el.getBoundingClientRect().top < window.innerHeight * 1.25) {
        el.classList.add('is-visible');
      } else {
        observer.observe(el);
      }
    }

    // Failsafe: never leave content stranded at opacity 0.
    window.setTimeout(revealAll, 2000);
  }
})();
