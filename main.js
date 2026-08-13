/*
   main.js, shared behavior, loaded on every page.

   Eleven pieces, each checking for its own elements first so the file is safe
   on pages that don't use a given feature:

     1. Mobile nav       toggles the collapsed nav on narrow screens
     2. Modal helper     shared open/close/focus behaviour for the overlays
     3. Resume modal     opens the PDF in an overlay
     4. Cert modal       shows a certification's detail and verification link
     5. Motion           scroll reveals, widget swaps, animated pane heights
     6. Photo lightbox   full-size photo overlay, built at runtime
     7. Scrollable panes edge fades for panes that overflow at phone width
     8. V3 engine        nav plate, entrances, the scroll channel, tilt
     9. Node field       the hero's canvas background
    10. Case-open intro  the home page's opening animation
    11. Smooth scroll    eased wheel scrolling on pointer devices

   The experience accordions used to live here and are gone, because the
   experience section is now always open. The v2 entry gate is gone too: it
   was a screen you had to dismiss, and piece 10 is the same idea played as
   an animation you simply watch.

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


/* ---------- Focusable children ----------
   Visible focusable descendants, in tab order, for the overlay tab traps.

   Two things this deliberately gets right:

     Hidden elements are skipped. The resume modal's .pdf-fallback link is
     display:none until the browser turns out not to preview PDFs, and the
     lightbox hides its arrows when there is only one photo. Treating one of
     those as the last stop guards an element Tab never reaches, and focus
     walks straight out into the page behind.

     The <iframe> is skipped too, so Close is the last stop. Once focus moves
     into the PDF viewer the keydown fires in *its* document, the trap here
     never sees it, and focus escapes on the next Tab. Keyboard users reach
     the PDF through Download or Open in tab, which is the better route
     anyway: a PDF viewer is its own tab-order maze to get back out of. */
function focusablesIn(el) {
  return [].filter.call(
    el.querySelectorAll('button, a[href], [tabindex]:not([tabindex="-1"])'),
    function (n) { return !n.hidden && n.getClientRects().length > 0; });
}


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
    var first = focusablesIn(modal)[0];
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
    if (!modal.classList.contains('show')) return;
    if (e.key === 'Escape') { close(); return; }
    if (e.key !== 'Tab') return;
    /* These carry aria-modal="true", which tells a screen reader the rest of
       the page is inert, but that is only a promise: Tab still walks out into
       the page behind unless it is held here. The gate already does this. */
    var f = focusablesIn(modal);
    if (!f.length) return;
    var a = f[0], z = f[f.length - 1];
    if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
    else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
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
      '.bio-main', '.bio-facts', '.factband'
    ].join(',');
    /* v3 manages its own entrances for anything carrying data-rv or
       data-stagger, and for the children of a data-hinge row. Those elements
       match the selectors above too, and letting both systems claim one
       element means .reveal and .rv fight over transform: the element fades
       but never travels. */
    var targets = Array.prototype.filter.call(
      document.querySelectorAll(sel),
      function (el) {
        return !el.hasAttribute('data-rv') &&
               !el.hasAttribute('data-stagger') &&
               !el.closest('[data-hinge]');
      });
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

  /* Panes that fade in as one block. */
  document.querySelectorAll('.rec-pad, .feed-pad').forEach(function (pane) {
    new MutationObserver(function () {
      pane.classList.remove('swap');
      void pane.offsetWidth;                   // restart the animation
      pane.classList.add('swap');
    }).observe(pane, { childList: true, subtree: true });
  });

  /* Panes whose parts stagger in, the way the terminal staggers its lines.
     The kill chain used the block fade and its whole narrative appeared at
     once, which read as the text popping rather than loading.

     Several of these elements survive a swap (the kill chain only rewrites
     kcT.textContent, it does not replace the node), so the animation has to be
     re-armed by removing the class, forcing a reflow, and adding it back. */
  var CASCADE = {
    '.kc-nar': '.ttl, .att, p, .kc-method-lbl, .chip',
    '.kc-ioc': '.tag, .ioc > div',
    '.siem-detail': '.siem-dh, h4, .siem-meta > div, .tag, .siem-acts, .siem-verdict',
    /* pcap.js rewrites className outright, but it does that before setting
       innerHTML, so the observer re-adds the cascade class afterwards. */
    '.pcap-detail': '.pkt-tree .tag, .pkt-line, .pkt-note .tag, .pkt-note p'
  };
  Object.keys(CASCADE).forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (pane) {
      var parts = CASCADE[sel];
      function run() {
        var kids = pane.querySelectorAll(parts);
        for (var i = 0; i < kids.length; i++) {
          kids[i].style.setProperty('--d', Math.min(i * 42, 380) + 'ms');
        }
        pane.classList.remove('swap-cascade');
        void pane.offsetWidth;
        pane.classList.add('swap-cascade');
      }
      run();                                   // animate the initial content too
      new MutationObserver(run).observe(pane, { childList: true, subtree: true });
    });
  });

  /* The phish counter changes its text in place, so no new node appears to
     animate. Watch it and bump it instead. */
  var prog = document.getElementById('phishProg');
  if (prog) {
    new MutationObserver(function () {
      prog.classList.remove('bump');
      void prog.offsetWidth;                   // restart the animation
      prog.classList.add('bump');
    }).observe(prog, { childList: true, characterData: true, subtree: true });
  }

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
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'ArrowLeft') { show(i - 1); return; }
    if (e.key === 'ArrowRight') { show(i + 1); return; }
    if (e.key !== 'Tab') return;
    // Same trap as the other overlays. With one photo the arrows are hidden,
    // so the visible set is just Close and Tab simply holds there.
    var f = focusablesIn(box);
    if (!f.length) return;
    var a = f[0], z = f[f.length - 1];
    if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
    else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
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
    '.rail, .samples, .siem-queue, .out'
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


/* ============================================================================
   V3 MOTION ENGINE

   Four pieces. The nav plate runs always, because it is a state change rather
   than an animation; the other three are skipped entirely under
   prefers-reduced-motion, which leaves the markup in its resting state.

     1. Nav plate    <html>.scrolled once past the fold threshold, which is
                     what fades the nav's background in over the dark hero.
     2. Entrances    data-rv="up|left|right|scale|rise|clip|blur" picks a
                     direction per element instead of v2's single fade-up;
                     data-stagger hands the entrance down to a block's
                     children so a list arrives line by line; data-hinge rows
                     swing their children in from the left edge. All added
                     here, never in the markup.
     3. Scroll       one rAF loop writes --sp (page progress) onto <html>,
                     --p (0 to 1 across a scene) onto every [data-scene], and
                     --py onto every [data-par]. CSS does the rest, so adding
                     a scroll-linked effect usually needs no new JS.
     4. Tilt         [data-tilt] cards stand up from their bottom edge as
                     they arrive, which is what the capabilities column uses.

   One rAF loop and one passive scroll listener serve all of it. Per-effect
   listeners were the alternative and they compound badly: six effects meant
   six handlers doing six layout reads per frame.
   ========================================================================= */
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- 1. Nav plate ---- */
  var navOn = null;
  function navCheck() {
    var on = (window.pageYOffset || root.scrollTop) > 40;
    if (on === navOn) return;
    navOn = on;
    root.classList.toggle('scrolled', on);
  }
  navCheck();
  window.addEventListener('scroll', navCheck, { passive: true });

  if (reduce) return;

  /* ---- 2. Entrances ---- */
  var RV = { up: 'rv-up', down: 'rv-down', left: 'rv-left', right: 'rv-right',
             scale: 'rv-scale', rise: 'rv-rise', clip: 'rv-clip', blur: 'rv-blur' };

  if ('IntersectionObserver' in window) {
    var entering = [];

    document.querySelectorAll('[data-rv]').forEach(function (el) {
      var cls = RV[el.getAttribute('data-rv')] || RV.up;
      el.classList.add('rv', cls);
      entering.push(el);
    });

    /* Stagger boxes hand the entrance down to their children, so a list
       arrives line by line instead of the whole block fading at once. The
       box itself is what gets observed and what carries .in; the children
       only carry their own delay. */
    document.querySelectorAll('[data-stagger]').forEach(function (box) {
      box.classList.add('stag');
      Array.prototype.forEach.call(box.children, function (kid, i) {
        kid.style.setProperty('--rd', Math.min(i * 70, 420) + 'ms');
      });
      entering.push(box);
    });

    /* Capability cards stand up from their bottom edge as they come up the
       screen. One class, no stagger: they arrive one at a time already. */
    document.querySelectorAll('[data-tilt]').forEach(function (el) {
      el.classList.add('tilt');
      entering.push(el);
    });

    /* Live index in the sticky column. A second observer rather than a scroll
       handler, with the root inset to a band across the middle of the screen,
       so "current" means the card sitting level with the heading rather than
       merely the topmost one still on screen. */
    var navItems = document.querySelectorAll('.capnav li');
    var cards = document.querySelectorAll('.capsplit-list > .cap');
    if (navItems.length && navItems.length === cards.length) {
      var nio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          var i = Array.prototype.indexOf.call(cards, en.target);
          if (i < 0) return;
          for (var k = 0; k < navItems.length; k++) {
            navItems[k].classList.toggle('on', k === i);
          }
        });
      }, { rootMargin: '-42% 0px -42% 0px', threshold: 0 });
      cards.forEach(function (c) { nio.observe(c); });
    }

    // Hinge rows stagger their own children; the row itself never animates.
    document.querySelectorAll('[data-hinge]').forEach(function (row) {
      Array.prototype.forEach.call(row.children, function (kid, i) {
        kid.classList.add('hinge');
        kid.style.setProperty('--rd', (i * 110) + 'ms');
        entering.push(kid);
      });
    });

    /* threshold must be 0, not a fraction.

       An element's own clip-path is applied when the intersection rect is
       computed, and .rv-clip starts at inset(0 0 102% 0), which clips it to
       zero height. So a clipped heading reports isIntersecting:true with
       intersectionRatio:0 forever, and any threshold above zero is never met:
       the section headings sat at opacity 0 permanently while their sibling
       paragraphs revealed normally.

       rootMargin does the waiting instead. Pulling the bottom edge in by 8%
       means an element still has to clear the fold before it fires, which is
       what the threshold was there for. */
    var eio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        eio.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0 });
    entering.forEach(function (el) { eio.observe(el); });
  }

  /* ---- 3 + 4. Scroll channel and pinning ---- */
  var scenes = [], pars = [], queued = false;

  document.querySelectorAll('[data-scene]').forEach(function (el) {
    scenes.push({ el: el, stage: null });
  });
  document.querySelectorAll('[data-par]').forEach(function (el) {
    var k = parseFloat(el.getAttribute('data-par'));
    pars.push({ el: el, k: isNaN(k) ? 0.06 : k });
  });

  function frame() {
    queued = false;
    var vh = window.innerHeight;

    /* Page scroll progress, 0 to 1, onto <html>. .sitebg positions its blooms
       from this, so the fixed background drifts for the whole length of the
       page instead of resetting per section. */
    var maxY = root.scrollHeight - vh;
    root.style.setProperty('--sp',
      maxY > 0 ? ((window.pageYOffset || root.scrollTop) / maxY).toFixed(4) : '0');

    for (var i = 0; i < scenes.length; i++) {
      var s = scenes[i];
      var r = s.el.getBoundingClientRect();
      var span = s.el.offsetHeight - (s.stage ? s.stage.offsetHeight : vh);
      var p = span > 0 ? (-r.top) / span : 0;
      s.el.style.setProperty('--p', (p < 0 ? 0 : p > 1 ? 1 : p).toFixed(4));
    }

    for (var j = 0; j < pars.length; j++) {
      var o = pars[j];
      var pr = o.el.getBoundingClientRect();
      // Off-screen layers keep their last offset and drop will-change, so a
      // long page is not holding a compositor layer per parallax element.
      if (pr.bottom < -240 || pr.top > vh + 240) {
        if (o.live) { o.el.style.willChange = ''; o.live = false; }
        continue;
      }
      if (!o.live) { o.el.style.willChange = 'transform'; o.live = true; }
      var mid = pr.top + pr.height / 2 - vh / 2;
      o.el.style.setProperty('--py', (-mid * o.k).toFixed(1) + 'px');
    }
  }

  function onScroll() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(frame);
  }

  // Always listening now: --sp is written on every page, whether or not the
  // page has a scene or a parallax layer on it.
  window.addEventListener('scroll', onScroll, { passive: true });

  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(frame, 140);
  });

  frame();
  // Webfonts and the portrait both change measurements the pin maths depends on.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(frame);
  }
  window.addEventListener('load', frame);

})();


/* ============================================================================
   HERO NODE FIELD

   The hero's canvas background: a slow drift of nodes linked when they come
   within range, with occasional packets running along a link. It reads as
   both network topology and monitored traffic, which is the pair of things
   the page is actually about.

   It carries no information, so it is aria-hidden in the markup and nothing
   is lost when it does not run. Under prefers-reduced-motion a single static
   frame is drawn instead of animating, which keeps the composition without
   the movement. Painting stops whenever the hero scrolls out of view or the
   tab is hidden, so an idle background tab costs nothing.
   ========================================================================= */
(function () {
  var cv = document.getElementById('heroNet');
  if (!cv || !cv.getContext) return;

  var ctx = cv.getContext('2d');
  var reduce = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var nodes = [], packets = [], w = 0, h = 0, dpr = 1;
  var raf = 0, visible = true;
  var LINK = 150;                    // px within which two nodes are joined
  var pointer = { x: -1e4, y: -1e4 };

  function size() {
    var r = cv.getBoundingClientRect();
    w = r.width; h = r.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);   // 2 is plenty; 3 costs
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function build() {
    // Density by area, capped. A phone gets a sparser field than a desktop
    // rather than the same count crammed into a quarter of the space.
    var n = Math.round(Math.min(Math.max((w * h) / 20000, 26), 78));
    nodes = [];
    for (var i = 0; i < n; i++) {
      nodes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.16,
        vy: (Math.random() - 0.5) * 0.16,
        r: Math.random() * 1.5 + 0.9
      });
    }
    packets = [];
  }

  function spawn() {
    if (packets.length > 5) return;
    var a = (Math.random() * nodes.length) | 0;
    for (var b = 0; b < nodes.length; b++) {
      if (b === a) continue;
      var dx = nodes[a].x - nodes[b].x, dy = nodes[a].y - nodes[b].y;
      if (dx * dx + dy * dy < LINK * LINK) {
        packets.push({ a: a, b: b, t: 0, v: 0.006 + Math.random() * 0.008 });
        return;
      }
    }
  }

  function draw(step) {
    ctx.clearRect(0, 0, w, h);
    var i, j, a, b, dx, dy, d2;

    if (step) {
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        a.x += a.vx; a.y += a.vy;
        // Wrap rather than bounce: a bounce puts a visible hard edge on the
        // field, and the mask already fades the boundary out.
        if (a.x < -20) a.x = w + 20; else if (a.x > w + 20) a.x = -20;
        if (a.y < -20) a.y = h + 20; else if (a.y > h + 20) a.y = -20;
      }
    }

    // Links, drawn first so nodes sit on top of them.
    ctx.lineWidth = 1;
    for (i = 0; i < nodes.length; i++) {
      a = nodes[i];
      for (j = i + 1; j < nodes.length; j++) {
        b = nodes[j];
        dx = a.x - b.x; dy = a.y - b.y; d2 = dx * dx + dy * dy;
        if (d2 > LINK * LINK) continue;
        ctx.strokeStyle = 'rgba(237,240,235,' +
          (0.13 * (1 - Math.sqrt(d2) / LINK)).toFixed(3) + ')';
        ctx.beginPath();
        ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    // Pointer tether. Only the nearest few, so it stays a hint.
    if (pointer.x > -1e3) {
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        dx = a.x - pointer.x; dy = a.y - pointer.y; d2 = dx * dx + dy * dy;
        if (d2 > 34000) continue;
        ctx.strokeStyle = 'rgba(255,74,97,' +
          (0.30 * (1 - Math.sqrt(d2) / 184)).toFixed(3) + ')';
        ctx.beginPath();
        ctx.moveTo(a.x, a.y); ctx.lineTo(pointer.x, pointer.y);
        ctx.stroke();
      }
    }

    // Packets in transit.
    for (i = packets.length - 1; i >= 0; i--) {
      var p = packets[i];
      if (step) p.t += p.v;
      if (p.t >= 1) { packets.splice(i, 1); continue; }
      a = nodes[p.a]; b = nodes[p.b];
      if (!a || !b) { packets.splice(i, 1); continue; }
      var px = a.x + (b.x - a.x) * p.t, py = a.y + (b.y - a.y) * p.t;
      ctx.fillStyle = 'rgba(255,74,97,' + (0.9 * Math.sin(p.t * Math.PI)).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(px, py, 2.1, 0, 6.2832); ctx.fill();
    }

    // Nodes.
    for (i = 0; i < nodes.length; i++) {
      a = nodes[i];
      ctx.fillStyle = 'rgba(237,240,235,.5)';
      ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, 6.2832); ctx.fill();
    }
  }

  var since = 0;
  function loop() {
    raf = 0;
    if (!visible || document.hidden) return;
    if (++since > 42) { since = 0; spawn(); }
    draw(true);
    raf = requestAnimationFrame(loop);
  }

  function start() {
    if (reduce || raf || !visible || document.hidden) return;
    raf = requestAnimationFrame(loop);
  }
  function stop() {
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
  }

  function reset() {
    size();
    build();
    if (reduce) draw(false); else { stop(); start(); }
  }

  var st;
  window.addEventListener('resize', function () {
    clearTimeout(st); st = setTimeout(reset, 180);
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop(); else start();
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) start(); else stop();
    }, { threshold: 0 }).observe(cv);
  }

  // Pointer tether is a nicety on a mouse and meaningless on touch, where the
  // finger is where you are already looking. Left off there.
  if (window.matchMedia && window.matchMedia('(pointer: fine)').matches) {
    cv.parentNode.addEventListener('pointermove', function (e) {
      var r = cv.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
    });
    cv.parentNode.addEventListener('pointerleave', function () {
      pointer.x = pointer.y = -1e4;
    });
  }

  reset();
})();


/* ============================================================================
   CASE-OPEN INTRO

   v2 opened on a gate you had to dismiss. This is the same screen played as a
   short animation instead: the case panel drops in, a cursor crosses to
   "Start investigation", clicks it, and the panel leaves as the hero's own
   load sequence starts. Nothing to click, nothing to get past.

   Two things keep it from being an obstacle. It is skipped entirely under
   prefers-reduced-motion and after the first view of a session, and any input
   ends it immediately: a key, a click, a wheel, a touch.

   The pre-paint half lives in parts/index_head.html, which sets html.intro
   before the first frame. That class pauses the hero's load sequence, so the
   hero is already sitting in its pre-animation state when this runs. Building
   the whole thing from here without that flag is what made v2's gate flash
   the site for a frame before covering it.

   It is aria-hidden and carries no information: the hero underneath is in the
   DOM and readable the whole time, so a screen reader never sees any of it.
   ========================================================================= */
(function () {
  var root = document.documentElement;
  if (!root.classList.contains('intro')) return;

  try { sessionStorage.setItem('fn.intro.seen', '1'); } catch (e) {}

  var scr = document.createElement('div');
  scr.className = 'intro-scr';
  scr.setAttribute('aria-hidden', 'true');
  scr.innerHTML =
    '<div class="intro-panel">' +
      '<div class="intro-bar"><span class="t"><i></i>case.open</span></div>' +
      '<div class="intro-body">' +
        '<span class="intro-k">Case file</span>' +
        '<span class="intro-nm">F. Naroditskiy</span>' +
        '<span class="intro-sub">Cybersecurity &middot; Forensics &middot; Incident response</span>' +
        '<span class="intro-go"><span class="h">Start investigation</span>' +
          '<span class="d">Open the site</span><span class="arw">&rarr;</span></span>' +
      '</div>' +
    '</div>' +
    '<i class="intro-cur"></i>';
  document.body.insertBefore(scr, document.body.firstChild);

  var go = scr.querySelector('.intro-go');
  var cur = scr.querySelector('.intro-cur');
  var timers = [];
  var done = false;

  function at(ms, fn) { timers.push(window.setTimeout(fn, ms)); }

  /* The cursor travels between measured points rather than percentages: the
     panel is centred, so its button lands somewhere different at every
     viewport size. */
  function aim() {
    var b = go.getBoundingClientRect();
    cur.style.setProperty('--tx', Math.round(b.left + b.width * 0.34) + 'px');
    cur.style.setProperty('--ty', Math.round(b.top + b.height * 0.56) + 'px');
  }

  function off() {
    document.removeEventListener('keydown', skip);
    window.removeEventListener('wheel', skip);
    window.removeEventListener('touchstart', skip);
    scr.removeEventListener('click', skip);
  }

  function finish() {
    if (done) return;
    done = true;
    timers.forEach(clearTimeout);
    scr.classList.add('out');
    /* Release the hero sequence as the panel leaves, so the two overlap
       rather than the page sitting still between them. */
    window.setTimeout(function () { root.classList.remove('intro'); }, 150);
    window.setTimeout(function () {
      if (scr.parentNode) scr.parentNode.removeChild(scr);
    }, 620);
    off();
  }

  function skip(e) {
    // A modifier-only keypress is not an attempt to skip anything.
    if (e && e.type === 'keydown' &&
        (e.key === 'Shift' || e.key === 'Control' ||
         e.key === 'Alt' || e.key === 'Meta')) return;
    finish();
  }

  document.addEventListener('keydown', skip);
  window.addEventListener('wheel', skip, { passive: true });
  window.addEventListener('touchstart', skip, { passive: true });
  scr.addEventListener('click', skip);

  function play() {
    // Measured after a frame, so the panel has been laid out before we aim.
    requestAnimationFrame(function () {
      /* Beats, in ms from the panel landing. Each gap is doing something:
         the panel gets a moment to settle before anything moves, the cursor
         glide is the longest single step, the button holds its hover state
         long enough to register as a hover, and the click is allowed to land
         before the panel leaves. Shortening any of them makes the sequence
         read as hurried rather than as a thing being operated. */
      aim();
      scr.classList.add('in');
      at(900,  function () { aim(); cur.classList.add('move'); });   // glide, .95s
      at(2000, function () { go.classList.add('hot'); });            // arrives, hovers
      at(2380, function () { cur.classList.add('press'); go.classList.add('hit'); });
      at(2900, finish);                                              // + .44s exit
    });
  }

  /* A page opened in a background tab gets no animation frames, so starting
     the sequence there would leave the panel sitting on a black screen until
     the tab came forward. Wait for the tab instead, and keep a timer as a
     backstop: setTimeout is throttled in a hidden tab but still fires, so the
     intro can never end up stuck no matter what happens to rAF. */
  if (document.hidden) {
    document.addEventListener('visibilitychange', function once() {
      if (document.hidden) return;
      document.removeEventListener('visibilitychange', once);
      play();
    });
  } else {
    play();
  }
  window.setTimeout(finish, 9000);
})();


/* ============================================================================
   SMOOTH SCROLL

   Eases the wheel instead of jumping by its raw delta, which is what makes a
   long page feel like one continuous movement rather than a series of steps.

   It drives the real scroll position with window.scrollTo rather than
   translating a wrapper element. Transforming a wrapper is the other common
   way to do this and it breaks position:sticky, IntersectionObserver and
   native find-in-page, all three of which this site depends on.

   Deliberately narrow:
     - pointer:fine only. Touch devices already do momentum in hardware, and
       overriding it costs CPU to produce something worse.
     - off under prefers-reduced-motion.
     - the wheel is left alone over anything that scrolls on its own (the
       widget panes, an open modal), so those still scroll normally.
     - keyboard, scrollbar dragging and in-page anchors stay native. The
       target resyncs from any scroll this did not cause, so nothing fights it.
   ========================================================================= */
(function () {
  var mm = window.matchMedia;
  if (!mm || !mm('(pointer: fine)').matches) return;
  if (mm('(prefers-reduced-motion: reduce)').matches) return;

  var root = document.documentElement;
  var EASE = 0.115;            // per frame; lower is smoother and laggier
  var target = window.pageYOffset || root.scrollTop;
  var raf = 0, driving = false;

  // CSS smooth scrolling and this would each try to own the same position.
  root.style.scrollBehavior = 'auto';

  function maxY() { return root.scrollHeight - window.innerHeight; }

  function step() {
    raf = 0;
    var cur = window.pageYOffset || root.scrollTop;
    var d = target - cur;
    if (Math.abs(d) < 0.5) { window.scrollTo(0, target); driving = false; return; }
    driving = true;
    window.scrollTo(0, cur + d * EASE);
    raf = requestAnimationFrame(step);
  }

  /* Panes that scroll on their own keep the native wheel. Without this the
     malware sample list and the SIEM queue would scroll the page instead of
     themselves. */
  function ownScroll(node) {
    for (var el = node; el && el !== document.body; el = el.parentNode) {
      if (el.nodeType !== 1) continue;
      if (el.classList && el.classList.contains('modal')) return true;
      var cs = getComputedStyle(el);
      if ((cs.overflowY === 'auto' || cs.overflowY === 'scroll') &&
          el.scrollHeight > el.clientHeight + 1) return true;
      if ((cs.overflowX === 'auto' || cs.overflowX === 'scroll') &&
          el.scrollWidth > el.clientWidth + 1) return true;
    }
    return false;
  }

  window.addEventListener('wheel', function (e) {
    if (e.ctrlKey) return;                                   // pinch zoom
    if (document.body.style.overflow === 'hidden') return;   // a modal is up
    if (ownScroll(e.target)) return;

    // deltaMode 1 is lines, 2 is pages. Normalise both to pixels.
    var d = e.deltaY;
    if (e.deltaMode === 1) d *= 18;
    else if (e.deltaMode === 2) d *= window.innerHeight;

    e.preventDefault();
    if (!driving) target = window.pageYOffset || root.scrollTop;
    target = Math.max(0, Math.min(maxY(), target + d));
    if (!raf) raf = requestAnimationFrame(step);
  }, { passive: false });

  /* Resync from anything that moved the page itself: keyboard, anchor jumps,
     scrollbar drags, the browser restoring a position. */
  window.addEventListener('scroll', function () {
    if (!driving) target = window.pageYOffset || root.scrollTop;
  }, { passive: true });

  window.addEventListener('resize', function () {
    target = Math.max(0, Math.min(maxY(), target));
  });
})();
