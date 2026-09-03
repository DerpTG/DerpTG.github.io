/* Shared behavior for every page. Each block bails early if its elements
   aren't there.

   The page widgets (kill chain, malware lab, project records, lab feed,
   the three exercises, interests) have their own scripts in parts/. */


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


/* Visible focusables in tab order, for the modal tab traps. Skips hidden
   elements and the PDF iframe. Focus escapes the trap on both. */
function focusablesIn(el) {
  return [].filter.call(
    el.querySelectorAll('button, a[href], [tabindex]:not([tabindex="-1"])'),
    function (n) { return !n.hidden && n.getClientRects().length > 0; });
}


/* ---------- Shared modal helper ----------
   Traps focus, locks background scroll, restores both on close. */
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
    /* aria-modal only tells screen readers the page is inert.
       Tab still walks out without a real trap. */
    var f = focusablesIn(modal);
    if (!f.length) return;
    var a = f[0], z = f[f.length - 1];
    if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
    else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
  });

  return { open: open, close: close };
}


/* ---------- Resume modal ----------
   Any [data-resume] link opens it. The PDF loads on first open. */
(function () {
  var m = makeModal('resumeModal', 'closeResume');
  if (!m) return;
  var frame = document.getElementById('resumeFrame');

  document.querySelectorAll('[data-resume]').forEach(function (o) {
    o.addEventListener('click', function (e) {
      e.preventDefault();
      if (frame && (!frame.src || frame.src.indexOf('about:blank') > -1)) {
        frame.src = 'NaroditskiyFelix_Cybersecurity_Resume.pdf';
      }
      m.open();
    });
  });
})();


/* ---------- Certification modal ----------
   Keyed by each badge's data-cert. Fields: name, issuer, blurb, covers[],
   verify (public verification URL). */
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
    // Nothing to verify for an in-progress cert. The button relabels.
    verifyEl.textContent = (id === 'cysa') ? 'Learn more' : 'Verify';
    m.open();
  }

  document.querySelectorAll('[data-cert]').forEach(function (badge) {
    badge.addEventListener('click', function () {
      openCert(badge.getAttribute('data-cert'));
    });
  });
})();


/* ---------- Coursework modal ----------
   Keyed by each chip's data-course. Fields: code, name, blurb, covers[].
   Chip labels come from the resume, not the catalogue. CYBER 362 and 366
   differ. */
(function () {
  var m = makeModal('courseModal', 'closeCourse');
  if (!m) return;

  var COURSES = {
    capstone: {
      code: 'CYBER 440',
      name: 'Cyber Capstone',
      blurb: 'The culminating investigation course: analytic frameworks first, then technical analysis across malware, file systems, security logs, and network traffic, closing with an executive-level briefing.',
      covers: [
        'Team ransomware investigation across 12.7M+ packets and 90,000+ log entries',
        'Network analysis lab (Wireshark)',
        'Memory analysis lab (Volatility)',
        'System image analysis (Autopsy, FTK Imager)',
        'Windows Security Log analysis with a custom Python parser',
        'Executive briefing pitched above the technical detail'
      ]
    },
    ir: {
      code: 'CYBER 342W',
      name: 'Incident Response and Disaster Recovery',
      blurb: 'Incident response and continuity planning, delivered as a complete ransomware playbook for a fictional company.',
      covers: [
        'Ransomware IR playbook, preparation through recovery',
        'Mapped to NIST RMF and COBIT 2019',
        'MITRE ATT&CK technique mapping',
        'NCISS severity scoring driving role-based escalation',
        'Chain of custody and evidence preservation',
        'CISA-format tabletop exercises'
      ]
    },
    secops: {
      code: 'CYBER 362',
      name: 'Security Operations',
      blurb: 'Analytics studio covering detection engineering, cloud risk, and the controls that sit around infrastructure.',
      covers: [
        'Snort IDS deployment and custom rule writing',
        'Cloud vulnerability deep dive, including the Capital One breach',
        'Risk assessment and mitigation with ALE scoring',
        'Infrastructure controls and IPS placement',
        'Change management, CASB, federation and SSO',
        'ICS network segmentation trade-offs'
      ]
    },
    malware: {
      code: 'CYBER 366',
      name: 'Malware Analysis',
      blurb: 'Principles and practice of malware detection, analysis, and defense, run hands-on in an isolated lab.',
      covers: [
        'Twelve samples analyzed static and dynamic in FlareVM',
        'PE header verification and hashing',
        'Packer and obfuscation detection (Exe Info PE, PeStudio)',
        'Behavioral analysis (Process Monitor, Regshot, System Informer)',
        'Simulated network for C2 observation (FakeNet-NG)',
        'Family attribution, IOC extraction, and evasion techniques'
      ]
    },
    forensics: {
      code: 'IST 454',
      name: 'Computer Forensics',
      blurb: 'Forensic process, laboratory design, and evidence handling, with casework built in Autopsy.',
      covers: [
        'Forensic lab design: hardware, software, staffing, and budget',
        'Evidence handling and security protocols',
        'Autopsy investigations across redacted drive images',
        'Multi-task forensic reporting',
        'Facility maintenance and disaster recovery planning'
      ]
    },
    defense: {
      code: 'CYBER 262',
      name: 'Cyber Defense Studio',
      blurb: 'Eleven hands-on cyber-range labs spanning offense, network defense, logging, and DNS and firewall configuration.',
      covers: [
        'Set-UID buffer overflow to root (GDB, NOP sled, shellcode)',
        'Metasploit recon, NFS enumeration, and SSH key harvesting',
        'Snort NIDS with custom rules; OSSEC HIDS with file-integrity monitoring',
        'Centralized logging with Rsyslog, logwatch, and fail2ban',
        'Elasticsearch, Logstash, and Kibana pipeline with dashboards',
        'VyOS firewall, split-horizon BIND DNS, and DoS defenses'
      ]
    },
    infosec: {
      code: 'CYBER 456',
      name: 'Information Security Management',
      blurb: 'Security governance: policy, standards, auditing, and the regulatory environment around a breach.',
      covers: [
        'ISO/IEC 27000-series auditing',
        'PA Breach of Personal Information Notification Act analysis',
        'University policy, standards, and guidelines',
        'Ransomware and supply-chain threat research',
        'Contingency and incident response planning',
        'Microsoft Security Copilot and the AI-assisted SOC'
      ]
    },
    risk: {
      code: 'SRA 311W',
      name: 'Risk Analysis',
      blurb: 'Formal risk assessment method: defining the system, scoring the risks, and choosing treatment.',
      covers: [
        'Elder tech-support fraud risk assessment',
        'Likelihood and impact scoring across six risks',
        'MECE decomposition and interdiction points',
        'Benefit-cost comparison of controls',
        'Defense in depth and explicit residual risk',
        'Ten reflective risk journals'
      ]
    },
    law: {
      code: 'IST 432',
      name: 'Legal and Regulatory Environment of IST',
      blurb: 'Cyber law: privacy, intellectual property, ISP liability, contract formation, and jurisdiction.',
      covers: [
        'CDA Section 230 and ISP liability',
        'Computer Fraud and Abuse Act (CFAA)',
        'Video Privacy Protection Act (VPPA)',
        'ACPA, cybersquatting, and trademark',
        'Browsewrap and clickwrap contract formation',
        'Net neutrality and FCC policy'
      ]
    },
    networking: {
      code: 'IST 220',
      name: 'Networking',
      blurb: 'Enterprise network design built and troubleshot from a blank topology in Cisco Packet Tracer.',
      covers: [
        'VLANs and VTP for segmentation',
        'Port security restricting switch ports to known hosts',
        'Telnet access with password encryption',
        'VoIP telephony over the same topology',
        'IP addressing and subnetting',
        'Trunk and inter-VLAN routing troubleshooting'
      ]
    },
    integration: {
      code: 'IST 242',
      name: 'System Integration',
      blurb: 'Integrating systems across a message queue while keeping the payload encrypted end to end.',
      covers: [
        'Java application development',
        'AES encryption and decryption',
        'JSON serialization with Gson',
        'RabbitMQ message queuing',
        'Maven build management',
        'End-to-end secure patient-data pipeline'
      ]
    },
    databases: {
      code: 'IST 210',
      name: 'Databases',
      blurb: 'Relational design and SQL, from schema on paper to a working implementation.',
      covers: [
        'Relational schema design',
        'DDL: CREATE, DROP, and constraints',
        'DML: INSERT and querying',
        'Primary and foreign key relationships',
        'Oracle APEX',
        'Multi-table education and storefront models'
      ]
    },
    webdev: {
      code: 'IST 256',
      name: 'Web Development',
      blurb: 'Full-stack web application development delivered across weekly milestones.',
      covers: [
        'Angular front end',
        'Node.js and MongoDB back end',
        'Bootstrap, jQuery, and AJAX',
        'CRUD across products, shoppers, cart, and returns',
        'Written test plans per milestone',
        'Project management and UI ownership'
      ]
    },
    programming: {
      code: 'CMPSC 131',
      name: 'Programming and Computation',
      blurb: 'Python fundamentals through object-oriented design, ending in an honors robotics capstone.',
      covers: [
        'Conditionals, loops, and functions',
        'Lists, dictionaries, and strings',
        'Classes and objects',
        'File handling and data structures',
        'Exception handling',
        'Honors mBot robotics capstone in Python'
      ]
    }
  };

  var nameEl = document.getElementById('courseName');
  var bodyEl = document.getElementById('courseBody');

  function cesc(x) {
    return String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function openCourse(id) {
    var c = COURSES[id];
    if (!c) return;                                // unknown id, ignore

    nameEl.textContent = c.name;

    var covers = c.covers.map(function (i) {
      return '<li>' + cesc(i) + '</li>';
    }).join('');

    bodyEl.innerHTML =
      '<span class="cert-issuer">' + cesc(c.code) + '</span>' +
      '<p class="cert-blurb">' + cesc(c.blurb) + '</p>' +
      '<span class="lbl">What it covered</span>' +
      '<ul class="cert-covers">' + covers + '</ul>';

    m.open();
  }

  document.querySelectorAll('[data-course]').forEach(function (chip) {
    chip.addEventListener('click', function () {
      openCourse(chip.getAttribute('data-course'));
    });
  });
})();

/* ---------- Scroll reveals and widget swaps ----------
   All off under prefers-reduced-motion. CSS lives in MOTION LAYER.
   Uses IntersectionObserver. Firefox still keeps animation-timeline behind
   a flag. */
(function () {
  var reduce = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  /* ---- Scroll reveal ---- */
  if ('IntersectionObserver' in window) {
    // .role is omitted. It sits inside .org, which is already a target, and
    // nested fades multiply into a muddy quarter opacity.
    var sel = [
      '.shead', '.sdesc', '.org', '.caps', '.certs', '.ncard',
      '.kc', '.term', '.feed', '.rec', '.lab-ex', '.ex-h', '.ex-sub',
      '.bio-main', '.bio-facts', '.factband'
    ].join(',');
    /* Skip anything the motion engine owns: data-rv, data-stagger, and
       data-hinge children. Both systems set transform and fight. */
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
        /* Reveal is declared after the hover rules. Drop both classes
           when it finishes or hover keeps the reveal's duration. */
        var delay = parseInt(el.style.getPropertyValue('--rd'), 10) || 0;
        window.setTimeout(function () {
          el.classList.remove('reveal', 'in');
          el.style.removeProperty('--rd');
        }, delay + 620);
      });
      // Touch fires early, desktop late. Same as the motion engine below.
    }, {
      rootMargin: (window.matchMedia && window.matchMedia('(pointer: coarse)').matches)
        ? '0px 0px 9% 0px' : '0px 0px -4% 0px',
      threshold: 0.02
    });
    targets.forEach(function (el) { io.observe(el); });
  }

  if (!('MutationObserver' in window)) return;

  /* ---- Widget swaps ----
     Terminal panes cascade by --d delay; detail panes re-trigger .swap. */
  document.querySelectorAll('.out').forEach(function (pane) {
    new MutationObserver(function () {
      var kids = pane.children;
      for (var i = 0; i < kids.length; i++) {
        kids[i].style.setProperty('--d', Math.min(i * 22, 500) + 'ms');
      }
      /* ---- Thumb stagger ---- */
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

  /* Some of these survive a swap. The kill chain rewrites textContent
     instead of replacing the node. Remove the class, force a reflow, add it
     back. */
  var CASCADE = {
    '.kc-nar': '.ttl, .att, p, .kc-method-lbl, .chip',
    '.kc-ioc': '.tag, .ioc > div',
    '.siem-detail': '.siem-dh, h4, .siem-meta > div, .tag, .siem-acts, .siem-verdict',
    /* parts/pcap.js.html rewrites className, but does it before setting
       innerHTML. The observer re-adds the cascade class after. */
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

  /* The phish counter changes text in place. Nothing new is inserted, so
     watch it and bump it. */
  var prog = document.getElementById('phishProg');
  if (prog) {
    new MutationObserver(function () {
      prog.classList.remove('bump');
      void prog.offsetWidth;                   // restart the animation
      prog.classList.add('bump');
    }).observe(prog, { childList: true, characterData: true, subtree: true });
  }

  /* ---- Smooth resize ----
     Panes are pinned to a pixel height and transitioned to the new measured
     height on each swap. Re-fixed without animating on webfont load/resize. */
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


/* ---------- Photo lightbox ----------
   Any [data-lightbox] thumb opens full size. Built at runtime. Arrow keys
   step through the clicked set. */
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
    // Same trap as the other overlays. With one photo the arrows are hidden
    // and only Close is left.
    var f = focusablesIn(box);
    if (!f.length) return;
    var a = f[0], z = f[f.length - 1];
    if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
    else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
  });
})();


/* ---------- Scrollable panes ----------
   Picks which edge fade to show and rechecks on resize. style.css draws the
   scrollbar and the fades. */
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


/* ---------- Motion engine ----------
   Nav plate, entrances, scroll channel, tilt. Everything but the nav plate
   is off under prefers-reduced-motion.

   Attributes: data-rv="up|left|right|scale|rise|clip|blur", data-stagger,
   data-hinge, data-tilt. One rAF loop writes --sp on <html>, --p on
   [data-scene] and --py on [data-par]. */
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Nav plate ---- */
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

  /* ---- Entrances ---- */
  var RV = { up: 'rv-up', down: 'rv-down', left: 'rv-left', right: 'rv-right',
             scale: 'rv-scale', rise: 'rv-rise', clip: 'rv-clip', blur: 'rv-blur' };

  if ('IntersectionObserver' in window) {
    var entering = [];

    document.querySelectorAll('[data-rv]').forEach(function (el) {
      var cls = RV[el.getAttribute('data-rv')] || RV.up;
      el.classList.add('rv', cls);
      entering.push(el);
    });

    /* Stagger boxes pass the entrance to their children. The box is
       observed and carries .in. Children only carry a delay. */
    document.querySelectorAll('[data-stagger]').forEach(function (box) {
      box.classList.add('stag');
      Array.prototype.forEach.call(box.children, function (kid, i) {
        kid.style.setProperty('--rd', Math.min(i * 70, 420) + 'ms');
      });
      entering.push(box);
    });

    /* Capability cards stand up from their bottom edge. No stagger. They
       already arrive one at a time. */
    document.querySelectorAll('[data-tilt]').forEach(function (el) {
      el.classList.add('tilt');
      entering.push(el);
    });

    /* Root is inset to a mid-screen band. "Current" means the card level
       with the heading, not the topmost one on screen. */
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

    /* threshold must be 0. .rv-clip starts at inset(0 0 102% 0) and a
       clipped element always reports ratio 0. rootMargin does the waiting. */
    /* Desktop waits for the element to clear the fold. Touch can't. The
       viewport is short and momentum is high. Start it early instead. */
    var coarse = window.matchMedia &&
      window.matchMedia('(pointer: coarse)').matches;

    var eio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        eio.unobserve(en.target);
      });
    }, { rootMargin: coarse ? '0px 0px 9% 0px' : '0px 0px -8% 0px', threshold: 0 });
    entering.forEach(function (el) { eio.observe(el); });
  }

  /* ---- Scroll channel ---- */
  var scenes = [], pars = [], queued = false;

  document.querySelectorAll('[data-scene]').forEach(function (el) {
    scenes.push({ el: el, stage: null });
  });
  document.querySelectorAll('[data-par]').forEach(function (el) {
    var k = parseFloat(el.getAttribute('data-par'));
    pars.push({ el: el, k: isNaN(k) ? 0.06 : k });
  });

  var lastSp = '';

  /* Read everything before writing anything. Interleaving forces a layout
     per element. --sp is only written when it changes. It invalidates the
     whole document. */
  function frame() {
    queued = false;

    /* ---- Reads ---- */
    var vh = window.innerHeight;
    var y = window.pageYOffset || root.scrollTop;
    var maxY = root.scrollHeight - vh;
    var i, sceneP = [], parV = [];

    for (i = 0; i < scenes.length; i++) {
      var s = scenes[i];
      var r = s.el.getBoundingClientRect();
      var span = s.el.offsetHeight - (s.stage ? s.stage.offsetHeight : vh);
      var p = span > 0 ? (-r.top) / span : 0;
      sceneP.push(p < 0 ? 0 : p > 1 ? 1 : p);
    }
    for (i = 0; i < pars.length; i++) {
      var pr = pars[i].el.getBoundingClientRect();
      parV.push({
        vis: !(pr.bottom < -240 || pr.top > vh + 240),
        mid: pr.top + pr.height / 2 - vh / 2
      });
    }

    /* ---- Writes ---- */
    var sp = maxY > 0 ? (y / maxY).toFixed(3) : '0';
    if (sp !== lastSp) { lastSp = sp; root.style.setProperty('--sp', sp); }

    for (i = 0; i < scenes.length; i++) {
      scenes[i].el.style.setProperty('--p', sceneP[i].toFixed(4));
    }
    for (i = 0; i < pars.length; i++) {
      var o = pars[i], v = parV[i];
      // Off-screen layers keep their last offset and drop will-change. A long
      // page shouldn't hold a compositor layer per parallax element.
      if (!v.vis) {
        if (o.live) { o.el.style.willChange = ''; o.live = false; }
        continue;
      }
      if (!o.live) { o.el.style.willChange = 'transform'; o.live = true; }
      o.el.style.setProperty('--py', (-v.mid * o.k).toFixed(1) + 'px');
    }
  }

  function onScroll() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(frame);
  }

  // --sp is written on every page, with or without a scene or parallax layer.
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


/* ---------- Hero node field ----------
   Decorative canvas background, aria-hidden. Draws one static frame under
   prefers-reduced-motion. Stops painting off-screen and on hidden tabs. */
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
    // Density by area, capped. A phone gets a sparser field than a desktop.
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
        // Wrap instead of bouncing. A bounce puts a hard edge on the field.
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

    // Nodes, drawn over the links.
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

  // Pointer tether is meaningless on touch. The finger is already the focus.
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


/* ---------- Case-open intro ----------
   Runs about 3s, once per session. Any input ends it. aria-hidden throughout.
   parts/index_head.html sets html.intro before this runs. */
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
        '<span class="intro-sub">Cybersecurity &middot; IT &middot; Incident response</span>' +
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

  /* Measured points, not percentages. The panel is centred, so the button
     moves with the viewport. */
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
    /* Release the hero sequence as the panel leaves so the two overlap. */
    window.setTimeout(function () { root.classList.remove('intro'); }, 150);
    window.setTimeout(function () {
      if (scr.parentNode) scr.parentNode.removeChild(scr);
    }, 620);
    off();
  }

  function skip(e) {
    // Ignore modifier-only keypresses.
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
    // Measured after a frame, once the panel has been laid out.
    requestAnimationFrame(function () {
      /* Beats, in ms from the panel landing. */
      aim();
      scr.classList.add('in');
      at(900,  function () { aim(); cur.classList.add('move'); });   // glide, .95s
      at(2000, function () { go.classList.add('hot'); });            // arrives, hovers
      at(2380, function () { cur.classList.add('press'); go.classList.add('hit'); });
      at(2900, finish);                                              // + .44s exit
    });
  }

  /* Background tabs get no rAF. Wait for visibility, with a timer as a
     backstop. setTimeout is throttled when hidden but still fires. */
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
