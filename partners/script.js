(function () {
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

      var HELI_FORM_API = 'https://heli-form-api.helifrozenyogurt.workers.dev';
      function submitHeliForm(payload) {
        return fetch(HELI_FORM_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).then(function (response) {
          return response.json().catch(function () { return {}; }).then(function (body) {
            if (!response.ok || !body.success) { throw new Error(body.error || 'Submission failed'); }
            return body;
          });
        });
      }

      var form = document.getElementById('heliLeadForm');
      var statusEl = document.getElementById('heliFormStatus');
      if (form) {
        form.addEventListener('submit', function (event) {
          event.preventDefault();
          if (!form.checkValidity()) { form.reportValidity(); return; }
          var button = form.querySelector('button[type="submit"]');
          var originalText = button ? button.textContent : '';
          if (button) { button.disabled = true; button.textContent = 'Sending…'; }
          if (statusEl) { statusEl.className = 'form-status'; statusEl.textContent = ''; }
          var leadData = new FormData(form);
          submitHeliForm({
            type: 'Property inquiry',
            location: leadData.get('propertyName') || '',
            propertyType: leadData.get('propertyType') || '',
            addressCity: leadData.get('addressCity') || '',
            footTraffic: leadData.get('footTraffic') || '',
            contactName: leadData.get('contactName') || '',
            email: leadData.get('contactEmail') || '',
            phone: leadData.get('contactPhone') || '',
            website: leadData.get('website') || ''
          }).then(function () {
            form.reset();
            var heading = document.getElementById('siteReviewFormTitle');
            if (heading) { heading.hidden = true; }
            form.hidden = true;
            var success = document.getElementById('heliFormSuccess');
            if (success) { success.hidden = false; success.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
          }).catch(function () {
            if (statusEl) {
              statusEl.className = 'form-status err';
              statusEl.innerHTML = 'Something went wrong. Please email us directly at <a href="mailto:hello@helifrozenyogurt.com">hello@helifrozenyogurt.com</a>.';
            }
          }).finally(function () {
            if (button) { button.disabled = false; button.textContent = originalText; }
          });
        });
      }

      var revealEls = document.querySelectorAll('[data-reveal]');
      if ('IntersectionObserver' in window && revealEls.length) {
        var observer = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.12 });
        revealEls.forEach(function (element) { observer.observe(element); });
      } else {
        revealEls.forEach(function (element) { element.classList.add('is-visible'); });
      }
    })();
