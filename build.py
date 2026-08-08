#!/usr/bin/env python3
"""
build.py: assembles the site's HTML pages.

The nav, <head>, and footer are identical on every page, and keeping five
hand-edited copies in sync is how they drift. This renders them from one
template instead. Page bodies and the widget scripts live in parts/.

Run:  python3 build.py
"""
import io, os

SITE = os.path.dirname(os.path.abspath(__file__))
PARTS = os.path.join(SITE, 'parts')

NAV = [('index.html', 'Home'), ('projects.html', 'Projects'),
       ('lab.html', 'Lab'), ('about.html', 'About')]


def part(name):
    with io.open(os.path.join(PARTS, name), encoding='utf-8') as f:
        return f.read()


def head(page, title, desc, canon):
    nav = '\n'.join(
        '      <a href="%s"%s>%s</a>' % (h, ' class="here"' if h == page else '', l)
        for h, l in NAV)
    return """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="https://felixnaroditskiy.com/{canon}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Felix Naroditskiy">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="https://felixnaroditskiy.com/{canon}">
<meta property="og:image" content="https://felixnaroditskiy.com/img/og.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{title}">
<meta name="twitter:description" content="{desc}">
<meta name="twitter:image" content="https://felixnaroditskiy.com/img/og.png">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="alternate icon" href="favicon-32.png" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="style.css">
</head>
<body>

<header class="nav">
  <div class="wrap">
    <a class="brand" href="index.html"><i aria-hidden="true"></i>F. NARODITSKIY</a>
    <button class="navtog" id="navtog" aria-expanded="false" aria-controls="pagenav">Menu</button>
    <nav id="pagenav">
{nav}
    </nav>
    <span class="nav-act">
      <a class="solid" href="index.html#top">Contact me</a>
    </span>
  </div>
</header>
""".format(title=title, desc=desc, canon=canon, nav=nav)


RESUME_MODAL = """
<div class="modal" id="resumeModal" role="dialog" aria-modal="true" aria-label="Resume">
  <div class="modal-box">
    <div class="modal-hd">
      <span class="t">Resume &middot; F. Naroditskiy</span>
      <span class="actions">
        <a class="dl" href="NaroditskiyFelixResume.pdf" download>Download</a>
        <a href="NaroditskiyFelixResume.pdf" target="_blank" rel="noopener">Open in tab</a>
        <button id="closeResume">Close</button>
      </span>
    </div>
    <iframe id="resumeFrame" title="Resume" src="about:blank"></iframe>
    <p class="pdf-fallback">Your browser can&rsquo;t preview PDFs inline.<br><a href="NaroditskiyFelixResume.pdf" target="_blank" rel="noopener">Open the resume &rarr;</a></p>
  </div>
</div>
"""


def footer(next_href, next_label):
    return """
<footer>
  <div class="wrap">
    <span>&copy; 2026 F. Naroditskiy</span>
    <a href="%s">%s &rarr;</a>
  </div>
</footer>
""" % (next_href, next_label)


def write(name, html):
    with io.open(os.path.join(SITE, name), 'w', encoding='utf-8') as f:
        f.write(html)
    print('  %-16s %6d bytes' % (name, len(html.encode('utf-8'))))


def build():
    print('Building pages:')

    # ---- projects.html (casework + archive, merged) ----
    write('projects.html',
          head('projects.html', 'Projects &middot; Felix Naroditskiy',
               'Ransomware kill chain reconstruction, malware analysis casework, IR playbooks, risk analysis, and code.',
               'projects.html')
          + part('projects_body.html')
          + RESUME_MODAL
          + footer('lab.html', 'Next: the lab')
          + part('kc.js.html') + '\n' + part('malware.js.html') + '\n'
          + part('projects.js.html')
          + '\n<script src="main.js"></script>\n</body>\n</html>\n')

    # ---- lab.html ----
    write('lab.html',
          head('lab.html', 'Lab &middot; Felix Naroditskiy',
               'A running log of self-directed security work, laid out as a live alert feed, plus three exercises you can try yourself.',
               'lab.html')
          + part('lab_body.html')
          + RESUME_MODAL
          + footer('about.html', 'Next: about')
          + part('feed.js.html') + '\n' + part('siem.js.html') + '\n'
          + part('pcap.js.html') + '\n' + part('phish.js.html')
          + '\n<script src="main.js"></script>\n</body>\n</html>\n')

    # ---- about.html ----
    write('about.html',
          head('about.html', 'About &middot; Felix Naroditskiy',
               'About Felix Naroditskiy: background, approach, and what I do off the clock.',
               'about.html')
          + part('about_body.html')
          + RESUME_MODAL
          + footer('index.html', 'Get in touch')
          + part('interests.js.html')
          + '\n<script src="main.js"></script>\n</body>\n</html>\n')

    # ---- 404.html ----
    write('404.html',
          head('404.html', '404 &middot; Felix Naroditskiy',
               'Page not found.', '404.html').replace(
              '<link rel="canonical" href="https://felixnaroditskiy.com/404.html">',
              '<meta name="robots" content="noindex">')
          + part('404_body.html')
          + RESUME_MODAL
          + footer('index.html', 'Back to safety')
          + '\n<script src="main.js"></script>\n</body>\n</html>\n')

    print('Done. index.html is maintained by hand (it is the only unique layout).')


if __name__ == '__main__':
    build()
