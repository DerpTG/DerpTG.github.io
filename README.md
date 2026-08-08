# DerpTG.github.io

My personal cybersecurity portfolio. Digital forensics, malware analysis, and incident response, with the governance and compliance work alongside it.

**Live at:** [felixnaroditskiy.com](https://felixnaroditskiy.com)

## Pages

| Page | What's on it |
|------|--------------|
| `index.html` | Landing page: entry gate, full-height hero, work history, capabilities, clickable certifications, contact. **Keep this filename.** GitHub Pages serves `index.html` as the site root, so renaming it breaks the domain. |
| `projects.html` | Casework and archive in one place: an interactive kill-chain map, a terminal-style malware triage tool covering 12 samples, then the expandable project record list |
| `lab.html` | A running log of self-directed work as a live alert feed, plus three try-it-yourself exercises |
| `about.html` | Bio, quick facts, and an interests console. The computer-building entry carries photos of my own builds. |

## Design

Direction is **"evidence room"**: a cool gray-green ground rather than paper, near-black ink, and one saturated crimson used strictly as an index marker, never as decoration.

- `--ground #E7E9E4` · `--panel #F4F5F2` · `--ink #14171A` · `--signal #C8102E`
- Severity trio (`--sev-hi/md/lo`) is the only other color, and it always means threat level
- **Type:** Archivo for display and prose, IBM Plex Mono for data only. If it isn't machine-readable (a date, a count, a hash, an identifier) it isn't mono.
- Every text color clears WCAG AA (4.5:1) against both surface colors. Verified, not assumed.

**Entry gate:** a full-page case-open screen offering Start investigation, Open casework, and Open the lab. It is opaque rather than an overlay, so the home page is never sitting blurred behind it. Built by `main.js` rather than written into the markup, so the site is never behind it: with JavaScript off it never renders and crawlers reach the page directly. Home page only, once per browser session (`sessionStorage`), dismissed by Escape, the X, or any option. While it is up, `<html>` carries `.gating`, which pauses the hero's load sequence so the intro plays when the visitor arrives rather than behind the screen. Focus is trapped while it is open.

**Photo lightbox:** any element with `data-lightbox`, `data-full`, and `data-caption` opens full size in an overlay sharing the resume modal's chrome, with arrow-key and on-screen navigation. It is built by `main.js` and rebinds on a `lightbox:rescan` event, so widgets that redraw their thumbnails (the interests console) keep working. Adding more photos needs no new markup, only new entries in the `imgs` array.

**Signature element:** the hero name is revealed by retracting redaction bars. Pure CSS. The text underneath is ordinary markup, so it stays selectable, indexable, and readable with animation disabled.

The hero fills the viewport below the nav. The facts strip sits in its own band underneath it.

**Logos** are transparent PNGs cut from the source art, so they sit on the page background with no plate behind them.

## Interactive pieces

Each widget is a data array plus a render function, kept simple so the code stays readable:

- **Kill-chain map** (`projects.html`): a seven-stage MITRE ATT&CK timeline rebuilt from a capstone ransomware investigation
- **Malware triage terminal** (`projects.html`): static and dynamic analysis records for 12 detonated samples
- **Project records** (`projects.html`): a packet-capture-style list; each record opens to the story and the skills it used
- **Lab feed** (`lab.html`): the lab log as a SOC alert queue; each entry expands to the full write-up
- **Try it yourself** (`lab.html`): SIEM triage, a packet capture to read, and a phishing red-flag hunt
- **Interests console** (`about.html`): a terminal where picking an interest prints its detail. Entries with an `imgs` array also render a photo strip that opens in the lightbox; the rest stay text only.

## Tech

- HTML, CSS, and vanilla JavaScript. No libraries, no frameworks, no build step for the browser.
- **Cross-document view transitions** via `@view-transition { navigation: auto; }`, giving native page-to-page transitions across all five pages with zero JavaScript. Unsupporting browsers navigate normally.
- **Motion layer** (`MOTION LAYER` in `style.css`, `MOTION` in `main.js`), in four parts: scroll reveals, hover states, widget content swaps, and animated pane heights. Reveals use `IntersectionObserver` rather than CSS `animation-timeline`, because Firefox still ships scroll-driven animations behind a flag and would otherwise get no reveal at all. The `.reveal` class is added by JS, never in the markup, so nothing is hidden when JS is off.
- Page-load intro is one orchestrated CSS sequence. The whole motion layer is disabled under `prefers-reduced-motion`.
- CSS custom properties: the whole palette is defined once in `:root` in `style.css`
- GitHub Pages, automatic deploy on every push
- Claude, my partner in crime for building it

## Build

The nav, `<head>`, and footer are identical on every page, and hand-maintaining five copies is how they drift out of sync. `build.py` renders them from one template instead.

```bash
python3 build.py
```

Page bodies and the widget scripts live in `parts/`. Edit those, re-run, commit the generated HTML. `index.html` is maintained by hand, since it's the only page with a unique layout.

> Nothing here is required to *serve* the site. GitHub Pages just publishes the HTML. The build step exists so the shared chrome has one source of truth.

## Structure

```
.
├── index.html          Home (hand-maintained)
├── projects.html       Casework + archive     ┐
├── lab.html            Lab feed + exercises   │ generated
├── about.html          Bio and interests      │ by build.py
├── 404.html            Not-found page         ┘
├── style.css           One stylesheet, tokens in :root
├── main.js             Nav, modals, gate, lightbox, motion
├── build.py            Page assembler
├── parts/              Page bodies + widget scripts
├── img/
│   ├── felix.jpg       Portrait (+ felix-sm.jpg for 1x)
│   ├── og.png          Social share image
│   ├── logo-stemuli.png
│   ├── logo-feba.png   Employer marks, transparent PNGs
│   ├── builds/         PC build photos (build-N.jpg + build-N-sm.jpg)
│   └── food/           Food photos (food-N.jpg + food-N-sm.jpg)
├── favicon.svg         Brand mark (+ PNG/ICO fallbacks, apple-touch-icon)
├── sitemap.xml         + robots.txt, for search indexing
├── .well-known/
│   └── security.txt    Standard vulnerability-disclosure contact
├── CNAME               Custom domain. Do not delete. Removing it disconnects felixnaroditskiy.com.
└── NaroditskiyFelixResume.pdf
```

Photos live under `img/`. The favicon set stays at the root on purpose: browsers request `/favicon.ico` from the root by default, and `apple-touch-icon.png` is looked for there too, so moving those breaks the fallbacks. The resume stays at the root so it has a clean shareable URL.

### Adding photos

Drop the files in `img/builds/` or `img/food/` as `name.jpg` plus a half-size `name-sm.jpg`, then add an entry to that interest's `imgs` array in `parts/interests.js.html`:

```js
imgs: [
  ['img/food/food-4', 'Caption that shows in the lightbox.']
]
```

The path has no extension. The thumbnail uses `-sm.jpg` and the lightbox uses the full file. Re-run `python3 build.py`. No other changes needed: the lightbox binds to whatever is on the page.


## Contact

- **Email:** fnaroditskiy@gmail.com
- **LinkedIn:** [felix-naroditskiy](https://www.linkedin.com/in/felix-naroditskiy)

© 2026 Felix Naroditskiy
