# DerpTG.github.io

My personal cybersecurity portfolio. Digital forensics, malware analysis, and incident response, with the governance and compliance work alongside it.

**Live at:** [felixnaroditskiy.com](https://felixnaroditskiy.com)

## Pages

| Page | What's on it |
|------|--------------|
| `index.html` | Case-open intro, hero, facts, work history, capabilities, certifications, and the index into the rest. **Keep this filename** — GitHub Pages serves it as the site root. |
| `projects.html` | An interactive kill-chain map, a terminal-style triage tool covering 12 malware samples, then the project record list |
| `lab.html` | Self-directed lab work as a live alert feed, plus three try-it-yourself exercises |
| `about.html` | Bio, quick facts, and an interests console with photos |

## Design

Direction is **"evidence room"**: a cool gray-green ground rather than paper, near-black ink, and one saturated crimson used strictly as an index marker, never as decoration.

- `--ground #E7E9E4` · `--panel #F4F5F2` · `--ink #14171A` · `--signal #C8102E`
- **Type:** Archivo for display and prose, IBM Plex Mono for data only. If it isn't machine-readable (a date, a count, a hash, an identifier) it isn't mono.
- Every text colour clears WCAG AA (4.5:1) against both surfaces.

**Two surfaces.** The evidence room is the resting state. A near-black counter-surface (`--void`) carries tokens mirroring the light ones one for one, so a component moves between them by swapping tokens rather than being rewritten. `--signal-d` is the lifted crimson for dark backgrounds, and the severity trio has `-d` twins, because the paper values are too dim on near-black.

**Where the dark goes.** Full-bleed in page headers. Below them it appears boxed — `.darkbox` panels inset on the paper, so nothing bands across the page. On the subpages the contrast comes from title bars: the terminal path, `projects.log`, the lab feed header, each exercise header, the kill chain. Each bar is near-black with a crimson block starting the title and a matching outline on the panel, while the content underneath stays on paper where dense technical text reads best.

**Signature:** the hero name is revealed by retracting redaction bars. Pure CSS, over ordinary markup, so it stays selectable, indexable, and readable with animation off.

## Interactive pieces

Each widget is a data array plus a render function, kept simple so the code stays readable:

- **Case-open intro** (`index.html`) — a case panel opens itself on screen. Home page only, once per session, ended by any input, skipped under reduced motion.
- **Capabilities** (`index.html`) — sticky heading and live index on the left, cards tilting in on the right
- **Kill-chain map** (`projects.html`) — a seven-stage MITRE ATT&CK timeline from a capstone ransomware investigation
- **Malware triage terminal** (`projects.html`) — static and dynamic analysis records for 12 detonated samples
- **Project records** (`projects.html`) — a packet-capture-style list; each record opens to the story and the skills it used
- **Lab feed** (`lab.html`) — the lab log as a SOC alert queue
- **Try it yourself** (`lab.html`) — SIEM triage, a packet capture to read, and a phishing red-flag hunt
- **Interests console** (`about.html`) — a terminal where picking an interest prints its detail, with a photo strip that opens in the lightbox

## Tech

HTML, CSS, and vanilla JavaScript. No libraries, no frameworks, no build step for the browser. Scrolling is native. GitHub Pages, automatic deploy on every push.

Motion runs from JavaScript rather than CSS `animation-timeline`, since Firefox still keeps scroll-driven animations behind a flag. Every animation class is added by JS and never ships in the markup, so with JavaScript off nothing is hidden, and the whole layer is disabled under `prefers-reduced-motion`.

Named sections in the source, each carrying its own notes:

| Where | What |
|-------|------|
| `MOTION LAYER` (css) · `MOTION` (js) | scroll reveals, hover, widget swaps, animated pane heights |
| `V3 MOTION ENGINE` (js) | nav plate, directional entrances, the scroll channel |
| `HERO NODE FIELD` (js) | the canvas background on every page header |
| `CASE-OPEN INTRO` (js) | the opening animation |

## Build

The nav, `<head>`, and footer are identical on every page, and hand-maintaining five copies is how they drift. `build.py` renders them from one template instead.

```bash
python3 build.py
```

Page bodies and the widget scripts live in `parts/`. **Edit those, re-run, commit the generated HTML.** Every `.html` at the root is generated and carries a "do not edit" banner; editing one directly means losing the change on the next build. Changes to `style.css`, `main.js`, or images need no rebuild.

> Nothing here is required to *serve* the site. GitHub Pages just publishes the HTML. The build exists so the shared chrome has one source of truth.

## Structure

```
.
├── index.html          Home                   ┐
├── projects.html       Casework + archive     │
├── lab.html            Lab feed + exercises   │ generated
├── about.html          Bio and interests      │ by build.py
├── 404.html            Not-found page         ┘ do not edit
├── style.css           One stylesheet, tokens in :root
├── main.js             Nav, modals, lightbox, motion, intro
├── build.py            Page assembler
├── parts/              Page bodies + widget scripts
├── img/                Portrait, logos, and the interest photo folders
│                       (each photo as name.jpg + name-sm.jpg)
├── favicon.svg         Brand mark (+ PNG/ICO fallbacks, apple-touch-icon)
├── sitemap.xml         + robots.txt, for search indexing
├── .well-known/
│   └── security.txt    Vulnerability-disclosure contact
├── CNAME               Custom domain. Do not delete.
└── NaroditskiyFelixResume.pdf
```

The favicon set stays at the root because browsers request `/favicon.ico` and `apple-touch-icon.png` from there by default. The resume stays at the root so it has a clean shareable URL.

### Adding photos

Drop the files in the matching `img/` subfolder as `name.jpg` (uncropped, long edge up to 1400px) plus `name-sm.jpg` (a 440x440 square crop for the thumbnail), then add an entry to that interest's `imgs` array in `parts/interests.js.html`:

```js
imgs: [
  ['img/food/food-4', 'Caption that shows in the lightbox.']
]
```

The path has no extension — the thumbnail uses `-sm.jpg`, the lightbox uses the full file. Re-run the build. Nothing else needs changing; the lightbox binds to whatever is on the page.

## Contact

- **Email:** fnaroditskiy@gmail.com
- **LinkedIn:** [felix-naroditskiy](https://www.linkedin.com/in/felix-naroditskiy)

© 2026 Felix Naroditskiy
