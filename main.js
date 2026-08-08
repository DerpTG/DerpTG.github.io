/*
   main.js, shared behavior, loaded on every page.

   Three pieces, each checking for its own elements first so the file is safe
   on pages that don't use a given feature:

     1. Mobile nav    toggles the collapsed nav on narrow screens
     2. Resume modal  opens the PDF in an overlay
     3. Cert modal    shows a certification's detail and verification link

   Two things that used to live here are gone:
     - the experience accordions, because experience is now always open
     - the IntersectionObserver scroll reveal, replaced by CSS
       animation-timeline: view() in the MOTION section of style.css

   Page-specific widgets (the lab feed, the project records, the interests
   console, the kill chain and malware tools) still keep their own scripts inline.
*/


/* ---------- Mobile nav ---------- */
(function () {
  var tog = document.getElementById('navtog');
  var nav = document.getElementById('pagenav');
  if (!tog || !nav) return;

  tog.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    tog.setAttribute('aria-expanded', open ? 'true' : 'false');
    tog.textContent = open ? 'Close' : 'Menu';
  });

  // Close on Escape so keyboard users aren't trapped in the open menu.
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('open')) {
      nav.classList.remove('open');
      tog.setAttribute('aria-expanded', 'false');
      tog.textContent = 'Menu';
      tog.focus();
    }
  });
})();


/* ---------- Shared modal helper ----------
   Both overlays behave the same way: remember what was focused, move focus
   into the dialog, lock background scroll, and restore everything on close.
   Returns { open, close } so each modal can wire its own trigger. */
function makeModal(id, closeBtnId) {
  var modal = document.getElementById(id);
  if (!modal) return null;
  var last = null;

  function open() {
    last = document.activeElement;
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    var first = modal.querySelector('button, a[href]');
    if (first) first.focus();
  }

  function close() {
    modal.classList.remove('show');
    document.body.style.overflow = '';
    if (last && last.focus) last.focus();
  }

  var cb = document.getElementById(closeBtnId);
  if (cb) cb.addEventListener('click', close);
  // Clicking the backdrop (but not the box) closes.
  modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.classList.contains('show')) close();
  });

  return { open: open, close: close };
}


/* ---------- Resume modal ----------
   Any [data-resume] link opens it. The PDF is only fetched on first open, so
   it costs nothing on page load. */
(function () {
  var m = makeModal('resumeModal', 'closeResume');
  if (!m) return;
  var frame = document.getElementById('resumeFrame');

  document.querySelectorAll('[data-resume]').forEach(function (o) {
    o.addEventListener('click', function (e) {
      e.preventDefault();
      if (frame && (!frame.src || frame.src.indexOf('about:blank') > -1)) {
        frame.src = 'NaroditskiyFelixResume.pdf';
      }
      m.open();
    });
  });
})();


/* ---------- Certification modal ----------
   CERTS is keyed by the id in each badge's data-cert attribute, e.g.
   <button class="cert" data-cert="secplus">. Each entry has:
     name    full title, shown in the modal header
     issuer  who grants it
     blurb   one line on what it proves
     covers  topics, rendered as a list
     verify  public verification URL for the Verify button

   To add one later: add a badge with a new data-cert id and a matching entry
   here. Nothing else changes. */
(function () {
  var m = makeModal('certModal', 'closeCert');
  if (!m) return;

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
      blurb: 'Security, Compliance & Identity Fundamentals. The concepts behind Microsoft\u2019s security and identity stack.',
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

  var nameEl = document.getElementById('certName');
  var bodyEl = document.getElementById('certBody');
  var verifyEl = document.getElementById('certVerify');

  function esc(x) {
    return String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function openCert(id) {
    var c = CERTS[id];
    if (!c) return;                                // unknown id, ignore

    nameEl.textContent = c.name;

    var covers = c.covers.map(function (i) {
      return '<li>' + esc(i) + '</li>';
    }).join('');

    bodyEl.innerHTML =
      '<span class="cert-issuer">' + esc(c.issuer) + '</span>' +
      '<p class="cert-blurb">' + esc(c.blurb) + '</p>' +
      '<span class="lbl">What it covers</span>' +
      '<ul class="cert-covers">' + covers + '</ul>';

    verifyEl.href = c.verify;
    // Nothing to verify for an in-progress cert, so the button relabels.
    verifyEl.textContent = (id === 'cysa') ? 'Learn more' : 'Verify';
    m.open();
  }

  document.querySelectorAll('[data-cert]').forEach(function (badge) {
    badge.addEventListener('click', function () {
      openCert(badge.getAttribute('data-cert'));
    });
  });
})();


/* ============================================================================
   MOTION

   Four pieces, all skipped when the visitor prefers reduced motion. The CSS
   side lives in the MOTION LAYER section of style.css.

     1. Scroll reveal  tag the recurring blocks with .reveal, stagger siblings
                       via --rd, then flip each to .in the first time it enters
                       the viewport. The class is added here rather than in the
                       markup, so nothing is hidden when JS is off.
     2. Widget swaps   the interactive panes animate their content changes.
     3. Smooth resize  panes animate between heights instead of snapping.
     4. Thumb stagger  photo strips cascade in.

   IntersectionObserver is used rather than CSS animation-timeline because
   Firefox still ships scroll-driven animations behind a flag, and this needs
   to work everywhere.
   ========================================================================= */
(function () {
  var reduce = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  /* ---- 1. Scroll reveal ---- */
  if ('IntersectionObserver' in window) {
    // .role is deliberately absent: it lives inside .org, which is already a
    // target, and two nested fades multiply into a muddy quarter-opacity
    // reveal. One block, one fade.
    var sel = [
      '.shead', '.sdesc', '.org', '.caps', '.certs', '.ncard',
      '.kc', '.term', '.feed', '.rec', '.lab-ex', '.ex-h', '.ex-sub',
      '.bio-main', '.bio-facts', '.contact h2', '.contact p', '.contact .cta',
      '.factband'
    ].join(',');
    var targets = document.querySelectorAll(sel);
    var counts = new Map();                    // parent -> sibling index
    targets.forEach(function (el) {
      var n = counts.get(el.parentNode) || 0;
      counts.set(el.parentNode, n + 1);
      el.style.setProperty('--rd', Math.min(n * 60, 220) + 'ms');
      el.classList.add('reveal');
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        el.classList.add('in');
        io.unobserve(el);
        /* Once the fade finishes, drop both classes. The reveal rule is
           declared after the hover rules and would otherwise keep overriding
           them, leaving hover stuck at the reveal's half-second duration. */
        var delay = parseInt(el.style.getPropertyValue('--rd'), 10) || 0;
        window.setTimeout(function () {
          el.classList.remove('reveal', 'in');
          el.style.removeProperty('--rd');
        }, delay + 620);
      });
    }, { rootMargin: '0px 0px -4% 0px', threshold: 0.02 });
    targets.forEach(function (el) { io.observe(el); });
  }

  if (!('MutationObserver' in window)) return;

  /* ---- 2. Widget swaps ----
     Terminal panes cascade line by line via the --d delay. Narrative and
     detail panes fade up by re-triggering the .swap animation. */
  document.querySelectorAll('.out').forEach(function (pane) {
    new MutationObserver(function () {
      var kids = pane.children;
      for (var i = 0; i < kids.length; i++) {
        kids[i].style.setProperty('--d', Math.min(i * 22, 500) + 'ms');
      }
      /* ---- 4. Thumb stagger ---- */
      pane.querySelectorAll('.shots').forEach(function (strip) {
        [].forEach.call(strip.children, function (t, i) {
          t.style.setProperty('--sd', (420 + i * 90) + 'ms');
        });
      });
    }).observe(pane, { childList: true });
  });

  document.querySelectorAll('.kc-nar, .kc-ioc, .siem-detail, .pcap-detail, .rec-pad, .feed-pad')
    .forEach(function (pane) {
      new MutationObserver(function () {
        pane.classList.remove('swap');
        void pane.offsetWidth;                 // restart the animation
        pane.classList.add('swap');
      }).observe(pane, { childList: true, subtree: true });
    });

  /* ---- 3. Smooth resize ----
     The viewers swap content of different lengths. Instead of snapping, each
     pane is held at a fixed pixel height; on every change we measure the new
     natural height and let a CSS transition carry it there. Heights are
     re-fixed without animating when webfonts land and on resize, so a pane
     never clips its content. */
  var panes = [
    document.querySelector('.kc-body'),   // kill chain
    document.getElementById('smpOut'),    // malware terminal
    document.getElementById('intOut')     // interests console
  ].filter(Boolean);
  if (!panes.length) return;

  var refreshers = panes.map(function (pane) {
    pane.classList.add('hsmooth');

    function settle(animate) {
      var from = pane.style.height;       // current fixed height, e.g. "412px"
      pane.style.height = 'auto';
      var to = pane.offsetHeight;
      if (animate && from) {
        pane.style.height = from;         // back to the old height...
        void pane.offsetWidth;            // ...commit it...
        pane.style.height = to + 'px';    // ...then transition to the new one
      } else {
        pane.style.height = to + 'px';
      }
    }

    settle(false);
    new MutationObserver(function () { settle(true); })
      .observe(pane, { childList: true, subtree: true });
    return function () { settle(false); };
  });

  function refreshAll() { refreshers.forEach(function (r) { r(); }); }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refreshAll);
  // Images inside a pane change its height once they decode.
  document.querySelectorAll('.out img').forEach(function (i) {
    i.addEventListener('load', refreshAll);
  });
  var t;
  window.addEventListener('resize', function () {
    clearTimeout(t); t = setTimeout(refreshAll, 150);
  });
})();


/* ============================================================================
   ENTRY GATE

   The markup lives in index.html and is shown by CSS the moment the head
   script adds .gating to <html>, which happens before first paint. This file
   only wires the behaviour, so nothing here affects when the gate appears.

   With JavaScript off the head script never runs, .gating is never added, the
   gate stays hidden, and the site loads normally.
   ========================================================================= */
(function () {
  var host = document.getElementById('gate');
  var root = document.documentElement;
  if (!host || !root.classList.contains('gating')) return;

  var KEY = 'fn.gate.seen';
  function seen() { try { sessionStorage.setItem(KEY, '1'); } catch (e) {} }

  /* The markup ships with hidden so the gate never appears without JS. CSS
     overrides it under .gating for an instant first paint, but the attribute
     is still set, which would make every host.hidden check below read true.
     Clear it now that we know the gate is genuinely up. */
  host.hidden = false;

  var first = host.querySelector('.gate-opt');
  if (first) first.focus();

  function dismiss() {
    seen();
    host.classList.add('closing');
    // Release the hero sequence as the screen clears, so the two overlap.
    window.setTimeout(function () { root.classList.remove('gating'); }, 200);
    window.setTimeout(function () {
      host.hidden = true;
      host.classList.remove('closing');
      var h1 = document.querySelector('.hero h1');
      if (h1) h1.focus({ preventScroll: true });
    }, 470);
  }

  host.addEventListener('click', function (e) {
    if (e.target.closest('[data-gate-close]')) { e.preventDefault(); dismiss(); return; }
    if (e.target.closest('a.gate-opt')) seen();   // leaving via a link still counts
  });

  document.addEventListener('keydown', function (e) {
    if (host.hidden) return;
    if (e.key === 'Escape') { dismiss(); return; }
    if (e.key !== 'Tab') return;
    // Keep focus inside the screen while it is up.
    var f = host.querySelectorAll('button, a[href]');
    if (!f.length) return;
    var a = f[0], z = f[f.length - 1];
    if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
    else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
  });
})();


/* ============================================================================
   PHOTO LIGHTBOX

   Any [data-lightbox] thumbnail opens full size in an overlay, with the same
   chrome as the resume modal. Built here so it works for however many photos
   a page carries, and so adding more later needs no new markup.

   Arrow keys and the on-screen arrows step through the set that was clicked.
   ========================================================================= */
(function () {
  var thumbs = [];

  function bind() {
    thumbs = [].slice.call(document.querySelectorAll('[data-lightbox]'));
    thumbs.forEach(function (t, n) {
      if (t.dataset.lbBound) return;            // don't double-bind on rescan
      t.dataset.lbBound = '1';
      t.addEventListener('click', function (e) {
        e.preventDefault();
        open([].slice.call(document.querySelectorAll('[data-lightbox]')).indexOf(t));
      });
    });
  }

  var box = document.createElement('div');
  box.className = 'modal';
  box.id = 'photoModal';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-label', 'Photo');
  box.innerHTML =
    '<div class="modal-box photo-box">' +
      '<div class="modal-hd">' +
        '<span class="t" id="photoCap">Photo</span>' +
        '<span class="actions">' +
          '<button id="photoPrev" aria-label="Previous photo">\u2190</button>' +
          '<button id="photoNext" aria-label="Next photo">\u2192</button>' +
          '<button id="photoClose">Close</button>' +
        '</span>' +
      '</div>' +
      '<div class="photo-stage"><img id="photoImg" alt=""></div>' +
    '</div>';
  document.body.appendChild(box);

  var img = box.querySelector('#photoImg');
  var cap = box.querySelector('#photoCap');
  var i = 0, last = null;

  function show(n) {
    i = (n + thumbs.length) % thumbs.length;
    var t = thumbs[i];
    img.src = t.getAttribute('data-full');
    img.alt = t.getAttribute('data-caption') || '';
    cap.textContent = t.getAttribute('data-caption') || 'Photo';
    box.querySelector('#photoPrev').hidden = thumbs.length < 2;
    box.querySelector('#photoNext').hidden = thumbs.length < 2;
  }

  function openAt(n) {
    last = document.activeElement;
    show(n);
    box.classList.add('show');
    document.body.style.overflow = 'hidden';
    box.querySelector('#photoClose').focus();
  }

  function close() {
    box.classList.remove('show');
    document.body.style.overflow = '';
    img.src = '';
    if (last && last.focus) last.focus();
  }

  function open(n) { thumbs = [].slice.call(document.querySelectorAll('[data-lightbox]')); openAt(n); }
  bind();
  document.addEventListener('lightbox:rescan', bind);

  box.querySelector('#photoClose').addEventListener('click', close);
  box.querySelector('#photoPrev').addEventListener('click', function () { show(i - 1); });
  box.querySelector('#photoNext').addEventListener('click', function () { show(i + 1); });
  box.addEventListener('click', function (e) { if (e.target === box) close(); });

  document.addEventListener('keydown', function (e) {
    if (!box.classList.contains('show')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') show(i - 1);
    else if (e.key === 'ArrowRight') show(i + 1);
  });
})();


/* ============================================================================
   SCROLLABLE PANES

   The kill-chain rail, the malware sample list, the SIEM queue and the
   interests list all overflow at phone width, where the browser's overlay
   scrollbar stays invisible until you are already scrolling. Each pane gets a
   persistent scrollbar and an edge fade from style.css; this decides which
   fade to show and re-checks whenever the pane can change size.

   Everything degrades cleanly: without this the panes still scroll, they just
   lose the affordance.
   ========================================================================= */
(function () {
  var panes = [].slice.call(document.querySelectorAll(
    '.rail, .samples, .siem-queue, .out, .gate-body'
  ));
  if (!panes.length) return;

  function update(el) {
    var x = el.scrollWidth > el.clientWidth + 2;
    var y = el.scrollHeight > el.clientHeight + 2;
    var cs = getComputedStyle(el);
    // Only treat an axis as scrollable if overflow actually allows it.
    x = x && /auto|scroll/.test(cs.overflowX);
    y = y && /auto|scroll/.test(cs.overflowY);

    el.classList.toggle('scroll-x', x);
    el.classList.toggle('scroll-y', y && !x);   // one axis at a time is enough

    if (!x && !y) { el.classList.remove('at-start', 'at-end'); return; }

    var pos, max;
    if (x) { pos = el.scrollLeft; max = el.scrollWidth - el.clientWidth; }
    else   { pos = el.scrollTop;  max = el.scrollHeight - el.clientHeight; }

    el.classList.toggle('at-start', pos <= 2);
    el.classList.toggle('at-end', pos >= max - 2);
  }

  panes.forEach(function (el) {
    update(el);
    el.addEventListener('scroll', function () { update(el); }, { passive: true });

    // Content swaps change the scrollable length (picking a new malware sample
    // rewrites the terminal, picking an interest adds a photo strip).
    if ('MutationObserver' in window) {
      new MutationObserver(function () { update(el); })
        .observe(el, { childList: true, subtree: true });
    }
  });

  function updateAll() { panes.forEach(update); }

  // Width changes flip these panes between scrolling and not.
  if ('ResizeObserver' in window) {
    var ro = new ResizeObserver(updateAll);
    panes.forEach(function (el) { ro.observe(el); });
  }
  var t;
  window.addEventListener('resize', function () {
    clearTimeout(t); t = setTimeout(updateAll, 120);
  });
  // Webfonts landing changes text metrics, and images change pane height.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(updateAll);
  window.addEventListener('load', updateAll);
})();
