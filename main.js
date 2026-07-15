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
    modal.classList.add('show');
  }

  // Wire every badge that has a data-cert id to open its entry.
  document.querySelectorAll('.cert[data-cert]').forEach(function (badge) {
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