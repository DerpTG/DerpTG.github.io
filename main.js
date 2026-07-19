/*
   main.js. Shared behavior loaded on every page.

   Three independent pieces:
     1. Accordions   expand and collapse the work-history entries on the home
                     page.
     2. Resume modal open the resume PDF in an overlay.
     3. Cert modal   show a certification's details and a verification link.

   Each piece checks whether its elements exist before wiring anything up, so
   the file loads safely on pages that don't have a given feature. Page-specific
   widgets (the lab feed, the project records, the interests console, and the
   casework tools) have their own scripts inside those pages.
*/


/* Accordions.
   Used by the .entry rows in the home-page Experience section. Each row has a
   .e-btn button and a hidden .e-body. Clicking the button toggles the .on
   class on the parent .entry, and the CSS animates the body open from there.
   aria-expanded is flipped so screen readers announce the state. */
document.querySelectorAll('.e-btn').forEach(function (b) {
  b.addEventListener('click', function () {
    var entry = b.closest('.entry');            // the row this button belongs to
    var open = entry.classList.toggle('on');    // toggle returns the new state
    b.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
});


/* Resume modal.
   Any link with a data-resume attribute opens the #resumeModal overlay. The
   PDF loads into the iframe only on first open, so it isn't fetched until
   someone asks to see it. Wrapped in a function so its variables stay local. */
(function () {
  var modal = document.getElementById('resumeModal');
  if (!modal) return;                            // page has no resume modal, stop

  var frame = document.getElementById('resumeFrame');
  var openers = document.querySelectorAll('[data-resume]');

  // Open: load the PDF the first time, then reveal the overlay.
  openers.forEach(function (o) {
    o.addEventListener('click', function (e) {
      e.preventDefault();                        // don't follow the "#" href
      if (!frame.src || frame.src.indexOf('about:blank') > -1) {
        frame.src = 'NaroditskiyFelixResume.pdf';
      }
      modal.classList.add('show');
    });
  });

  // Close helpers: button, backdrop click, and Escape key.
  function close() { modal.classList.remove('show'); }
  var cb = document.getElementById('closeResume');
  if (cb) cb.addEventListener('click', close);
  modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
})();


/* Certification modal.
   Data and behavior for the clickable cert badges on the home page.

   CERTS is a lookup keyed by the id in each badge's data-cert attribute,
   for example <button class="cert" data-cert="secplus">. Each entry has:
     name    the full title shown in the modal header
     issuer  who grants it
     blurb   a one-line summary of what it proves
     covers  the topics it covers, rendered as a list
     verify  the public verification URL, opened by the Verify button

   To add a cert later, add a badge button in index.html with a new data-cert
   id and a matching entry here. Nothing else needs to change. */
(function () {
  var modal = document.getElementById('certModal');
  if (!modal) return;                            // page has no cert modal, stop

  var CERTS = {
    secplus: {
      name: 'CompTIA Security+ (SY0-701)',
      issuer: 'CompTIA',
      blurb: 'The baseline vendor-neutral security certification, and the one most SOC and analyst roles list as a floor requirement.',
      covers: [
        'Threats, attacks & vulnerabilities',
        'Security architecture & design',
        'Security operations & incident response',
        'Governance, risk & compliance (GRC)',
        'Identity & access management (IAM)',
        'Cryptography fundamentals'
      ],
      verify: 'https://www.credly.com/badges/85c74e12-ddc8-4fd3-98cd-b563e603d580/public_url'
    },
    sc900: {
      name: 'Microsoft SC-900',
      issuer: 'Microsoft',
      blurb: 'Security, Compliance & Identity Fundamentals. The concepts behind Microsoft\'s security and identity stack.',
      covers: [
        'Security, compliance & identity concepts',
        'Microsoft Entra ID (identity) capabilities',
        'Microsoft security solutions',
        'Compliance management & Microsoft Purview'
      ],
      verify: 'https://www.credly.com/badges/aa9d308a-e5e8-446e-86f5-edb1262d1912/linked_in_profile'
    },
    az900: {
      name: 'Microsoft AZ-900',
      issuer: 'Microsoft',
      blurb: 'Azure Fundamentals. Core cloud concepts and how Azure services, pricing, and governance fit together.',
      covers: [
        'Cloud concepts (IaaS / PaaS / SaaS)',
        'Core Azure architecture & services',
        'Management & governance tooling',
        'Pricing, SLAs & the shared-responsibility model'
      ],
      verify: 'https://learn.microsoft.com/en-us/users/felixnaroditskiy-9470/credentials/2902d3e84ef592'
    },
    dp900: {
      name: 'Microsoft DP-900',
      issuer: 'Microsoft',
      blurb: 'Azure Data Fundamentals. How relational and non-relational data work in the cloud.',
      covers: [
        'Core data concepts (relational vs. non-relational)',
        'Relational data services on Azure',
        'Non-relational data services on Azure',
        'Analytics workloads on Azure'
      ],
      verify: 'https://learn.microsoft.com/en-us/users/felixnaroditskiy-9470/credentials/2bbee80af57303dd'
    },
    cysa: {
      name: 'CompTIA CySA+',
      issuer: 'CompTIA \u00b7 In progress',
      blurb: 'The next step up from Security+, focused squarely on the analyst role: using data and tools to detect, triage, and respond to threats. This is the one I\u2019m studying for now.',
      covers: [
        'Security operations and monitoring',
        'Vulnerability management',
        'Incident response and management',
        'Reporting and communication'
      ],
      verify: 'https://www.comptia.org/certifications/cybersecurity-analyst'
    }
  };

  // Grab the empty slots in the modal that we fill on each open.
  var nameEl = document.getElementById('certName');
  var bodyEl = document.getElementById('certBody');
  var verifyEl = document.getElementById('certVerify');

  // Fill the modal from one CERTS entry, then reveal it.
  function openCert(id) {
    var c = CERTS[id];
    if (!c) return;                              // unknown id, ignore the click

    nameEl.textContent = c.name;

    // Build the body: issuer line, one-line blurb, then the "covers" list.
    var coversList = c.covers.map(function (item) {
      return '<li>' + item + '</li>';
    }).join('');

    bodyEl.innerHTML =
      '<span class="cert-issuer">' + c.issuer + '</span>' +
      '<p class="cert-blurb">' + c.blurb + '</p>' +
      '<span class="tag">What it covers</span>' +
      '<ul class="cert-covers">' + coversList + '</ul>';

    verifyEl.href = c.verify;                    // point the Verify button at the badge
    // In-progress certs have nothing to verify yet, so relabel the button.
    if (id === 'cysa') {
      verifyEl.textContent = 'Learn more';
    } else {
      verifyEl.textContent = 'Verify';
    }
    modal.classList.add('show');
  }

  // Wire every element that carries a data-cert id (badges and the hero link).
  document.querySelectorAll('[data-cert]').forEach(function (badge) {
    badge.addEventListener('click', function () {
      openCert(badge.getAttribute('data-cert'));
    });
  });

  // Close helpers: button, backdrop click, and Escape key.
  function close() { modal.classList.remove('show'); }
  var cb = document.getElementById('closeCert');
  if (cb) cb.addEventListener('click', close);
  modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
})();

/* Motion.
   Three pieces, each skipped when the visitor prefers reduced motion:
     1. Name decode      the hero name resolves from glyphs into text on load.
     2. Scroll reveal    key blocks fade up as they enter the viewport.
     3. Widget swaps     the interactive panes animate their content changes.
   The CSS side lives in the MOTION section of style.css. Because this file
   loads after the page-specific scripts, every widget already exists in the
   DOM by the time these observers attach. */
(function () {
  var reduce = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 1. Name decode.
     Any .scramble element resolves left-to-right from random glyphs into its
     data-text over roughly three-quarters of a second. The real text is in
     the markup, so without JS (or with reduced motion) it just reads normally. */
  document.querySelectorAll('.scramble').forEach(function (el) {
    var text = el.getAttribute('data-text') || el.textContent;
    if (reduce) { el.textContent = text; return; }
    var glyphs = '#/<>[]{}=+*^?!$%&';
    var frame = 0;
    var timer = setInterval(function () {
      var out = '', done = true;
      for (var i = 0; i < text.length; i++) {
        if (text[i] === ' ' || frame > i * 1.6 + 6) {
          out += text[i];
        } else {
          out += glyphs[(Math.random() * glyphs.length) | 0];
          done = false;
        }
      }
      el.textContent = out;
      frame++;
      if (done) { clearInterval(timer); el.textContent = text; }
    }, 26);
  });

  /* 2. Scroll reveal.
     Tag the recurring blocks with .reveal, stagger siblings via --rd, then
     flip each to .in the first time it enters the viewport. The class is
     added here (not in the markup) so nothing is hidden when JS is off. */
  if (!reduce && 'IntersectionObserver' in window) {
    var sel = [
      '.shead', '.sdesc', '.ncard', '.org', '.sgrid', '.certs',
      '.kc', '.term', '.feed', '.rec', '.lab-ex', '.ex-h', '.ex-sub',
      '.bio-main', '.bio-facts', '.contact h2', '.contact p', '.links'
    ].join(',');
    var targets = document.querySelectorAll(sel);
    var counts = new Map();                     // parent -> sibling index
    targets.forEach(function (el) {
      var n = counts.get(el.parentNode) || 0;
      counts.set(el.parentNode, n + 1);
      el.style.setProperty('--rd', Math.min(n * 70, 350) + 'ms');
      el.classList.add('reveal');
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* 3. Widget swaps.
     Watch each interactive pane for content changes. Terminal panes (.out)
     get a per-line cascade via the --d delay; the narrative/detail panes get
     a single fade-up by re-triggering the .swap animation. MutationObserver
     callbacks run before the next paint, so the delays land in time. */
  if (!reduce && 'MutationObserver' in window) {
    document.querySelectorAll('.out').forEach(function (pane) {
      new MutationObserver(function () {
        var kids = pane.children;
        for (var i = 0; i < kids.length; i++) {
          kids[i].style.setProperty('--d', Math.min(i * 20, 480) + 'ms');
        }
      }).observe(pane, { childList: true });
    });
    document.querySelectorAll('.kc-nar, .kc-ioc, .siem-detail, .pcap-detail')
      .forEach(function (pane) {
        new MutationObserver(function () {
          pane.classList.remove('swap');
          void pane.offsetWidth;                // restart the animation
          pane.classList.add('swap');
        }).observe(pane, { childList: true, subtree: true });
      });
  }
})();
