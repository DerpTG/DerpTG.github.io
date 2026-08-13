# DerpTG.github.io

My personal cybersecurity portfolio. Digital forensics, malware analysis, and incident response, with the governance and compliance work alongside it.

**Live at:** [felixnaroditskiy.com](https://felixnaroditskiy.com)

## Pages

| Page | What's on it |
|------|--------------|
| `index.html` | Landing page: case-open intro, full-bleed hero, facts strip, work history, the sticky-split capabilities, certifications, and the index into the other pages. **Keep this filename.** GitHub Pages serves `index.html` as the site root, so renaming it breaks the domain. |
| `projects.html` | Casework and archive in one place: an interactive kill-chain map, a terminal-style malware triage tool covering 12 samples, then the expandable project record list |
| `lab.html` | A running log of self-directed work as a live alert feed, plus three try-it-yourself exercises |
| `about.html` | Bio, quick facts, and an interests console. The computer-building entry carries photos of my own builds. |

## Design

Direction is **"evidence room"**: a cool gray-green ground rather than paper, near-black ink, and one saturated crimson used strictly as an index marker, never as decoration.

- `--ground #E7E9E4` · `--panel #F4F5F2` · `--ink #14171A` · `--signal #C8102E`
- Severity trio (`--sev-hi/md/lo`) always means threat level
- **Type:** Archivo for display and prose, IBM Plex Mono for data only. If it isn't machine-readable (a date, a count, a hash, an identifier) it isn't mono.
- Every text color clears WCAG AA (4.5:1) against both surface colors. Verified, not assumed.

**Two surfaces, and the dark one is boxed.** v2 had one, and `--ground` and `--panel` sat four points of lightness apart, so a panel never read as raised, only as slightly different paper. v3 keeps the evidence room as the resting state and adds a near-black counter-surface (`--void`).

Getting the relationship right took three tries, and the two failures are worth recording so they are not repeated:

1. **Full-bleed bands.** Dark sections ran edge to edge and the page banded — black, white, black, white — which reads as stripes rather than rhythm.
2. **Blended bands.** Those edges were then melted with a 260px gradient. Worse: a ramp between near-black and paper is visible *as a ramp*, you can see exactly where it starts and stops, and the padding needed to keep text off the blend left a dead zone above every one.

The answer was to stop treating dark as a band at all. **Below the hero, the dark only ever appears boxed** — `.darkbox` panels inset on the paper with the page margins still showing on both sides. There is no edge to blend and nothing cutting across the page, and the evidence-room reading is better for it: a screen sitting on the table rather than the lights going out. The hero is the single full-bleed dark surface, at the top of every page, where a hard clean edge into paper is exactly right.

`.darkbox` pairs with `.scene-dark`, which still supplies the surface tokens. `.darkbox` adds only the frame, the lift, and its own texture (grid and bloom from pseudo-elements, since these repeat six times and markup for it would be six times the noise), so anything that already knows how to sit on the dark surface works inside one.

The dark tokens mirror the light ones one for one (`--void`/`-2`/`-3`, `--void-ink`/`-mute`/`-faint`, `--void-rule`/`-2`), so a component moves between surfaces by swapping tokens rather than being rewritten. `--signal-d` exists because the brand crimson only reaches 3.2:1 on near-black and cannot legally be used for text there. Every dark-surface text colour clears AA against `--void`.

**One continuous background.** `.sitebg` is a fixed layer behind the whole document, on every page and every section. The light sections paint no background of their own, so it shows straight through them; the dark scenes are opaque and cover it, which is correct since they carry their own. Its three blooms are positioned from `--sp`, the page scroll progress `main.js` writes onto `<html>`, so the background drifts continuously for the length of the page rather than repeating per section. That is what makes a scroll read as one movement instead of a series of bands. Before it existed, the middle of every page was bare paper and the texture appeared and disappeared as you scrolled.

**Per-scene background layers.** Four stackable, `aria-hidden`, pointer-events-none children of any scene: `.bgl-grid` (technical grid, masked to fade at the edges), `.bgl-glow` (two soft radials), `.bgl-noise` (grain, so large dark fills do not band), and `.bgl-scan` (a slow sweep). They are elements rather than pseudo-elements because a scene routinely needs three at once. `.on-light` variants run at far lower alpha — the values that read as atmosphere on near-black read as dirt on paper. The one deliberate departure from crimson-only is a desaturated steel in the glow, never used on text.

**Case-open intro.** v2 opened on a full-page gate you had to dismiss. v3 plays the same screen instead of asking you to operate it: the case panel drops in, a cursor crosses to *Start investigation*, clicks it, and the panel leaves as the hero's own load sequence starts. About 1.6 seconds, home page only, once per browser session, and *any* input at all — a key, a click, a wheel, a touch — cuts it short.

The pre-paint half lives in `parts/index_head.html` and sets `html.intro` before the first frame; the same script bails on `prefers-reduced-motion` or a second view, so the intro is a flourish rather than a gate. That class pauses the hero's load sequence exactly the way v2's `.gating` did, which is what stops the intro playing to an empty room and the hero then replaying once it is gone. Building the whole thing from `main.js` is what made v2's gate flash the site for a frame first.

Two failure modes are handled explicitly: a page opened in a **background tab** gets no animation frames, so the sequence waits for `visibilitychange` rather than sitting on a black screen, and a `setTimeout` backstop ends it regardless — `setTimeout` is throttled in a hidden tab but still fires, so the intro can never get stuck. It is `aria-hidden` and carries no information; the hero underneath is in the DOM and readable throughout.

**Scrollable panes:** the kill-chain rail, malware sample list, SIEM queue, and interests list overflow at phone width, where mobile browsers use overlay scrollbars that stay invisible until you are already scrolling. Each gets a permanent scrollbar (`-webkit-appearance:none` is what stops iOS treating it as transient) plus a `mask-image` edge fade. `main.js` toggles `.at-start` / `.at-end` so the fade only shows on a side with content left, and clears entirely once the pane fits. A `.scroll-hint` label in each pane header appears only under `@media(pointer:coarse)`. Without the JS the panes still scroll, they just lose the affordance.

**Photo lightbox:** any element with `data-lightbox`, `data-full`, and `data-caption` opens full size in an overlay sharing the resume modal's chrome, with arrow-key and on-screen navigation. It is built by `main.js` and rebinds on a `lightbox:rescan` event, so widgets that redraw their thumbnails (the interests console) keep working. Adding more photos needs no new markup, only new entries in the `imgs` array.

**Signature element:** the hero name is revealed by retracting redaction bars. Pure CSS. The text underneath is ordinary markup, so it stays selectable, indexable, and readable with animation disabled.

The hero fills the viewport below the nav. The facts strip sits in its own band underneath it.

**Logos** are transparent PNGs cut from the source art, so they sit on the page background with no plate behind them.

## Interactive pieces

Each widget is a data array plus a render function, kept simple so the code stays readable:

- **Capabilities, sticky split** (`index.html`): the heading and a live contents index hold still on the left while the six cards travel up past them on the right, each tilting flat from its bottom edge as it arrives. The index marks whichever card is currently level with the heading, using an observer inset to a band across the middle of the screen rather than a scroll handler.

  This replaced a pinned horizontal track that scrolled the cards sideways. That version was wrong twice over: it stopped the page to run an effect, and the effect had more empty stage in it than content. The rule it taught is worth keeping — **a section that seizes the scroll had better be worth the seizure**. This one is part of the scroll instead of an interruption to it. Below 900px the split collapses and the heading stops sticking, leaving a plain stack of cards, which is also what a visitor with JavaScript off gets at any width.
- **Kill-chain map** (`projects.html`): a seven-stage MITRE ATT&CK timeline rebuilt from a capstone ransomware investigation
- **Malware triage terminal** (`projects.html`): static and dynamic analysis records for 12 detonated samples
- **Project records** (`projects.html`): a packet-capture-style list; each record opens to the story and the skills it used
- **Lab feed** (`lab.html`): the lab log as a SOC alert queue; each entry expands to the full write-up
- **Try it yourself** (`lab.html`): SIEM triage, a packet capture to read, and a phishing red-flag hunt
- **Interests console** (`about.html`): a terminal where picking an interest prints its detail. Entries with an `imgs` array also render a photo strip that opens in the lightbox; the rest stay text only.

## Tech

- HTML, CSS, and vanilla JavaScript. No libraries, no frameworks, no build step for the browser.
- **Cross-document view transitions** via `@view-transition { navigation: auto; }`, giving native page-to-page transitions across all five pages with zero JavaScript. Unsupporting browsers navigate normally.
- **Motion layer** (`MOTION LAYER` in `style.css`, `MOTION` in `main.js`), in four parts: scroll reveals, hover states, widget content swaps, and animated pane heights.
- **V3 motion engine** (`V3 MOTION ENGINE` in `main.js`) adds four more: the nav plate; directional entrances (`data-rv="up|left|right|scale|rise|clip|blur"`, `data-stagger` to hand the entrance down to a block's children so a list arrives line by line, `data-hinge` rows that swing their children in, and `data-tilt` cards that stand up from their bottom edge); a scroll channel writing `--sp` onto `<html>`, `--p` onto every `[data-scene]` and `--py` onto every `[data-par]`. One rAF loop and one passive scroll listener serve all of it, so adding a scroll-linked effect usually needs new CSS and no new JS.
- **Smooth scroll** (`SMOOTH SCROLL` in `main.js`) eases the wheel instead of jumping by its raw delta. It drives the real scroll position with `window.scrollTo` rather than translating a wrapper element — transforming a wrapper is the other common way to do this and it breaks `position: sticky`, `IntersectionObserver`, and native find-in-page, all three of which this site depends on. Deliberately narrow: `pointer: fine` only (touch already does momentum in hardware, and overriding it costs CPU to produce something worse), off under `prefers-reduced-motion`, and the wheel is left alone over anything that scrolls on its own, so the widget panes and open modals still scroll normally. Keyboard, scrollbar dragging, and anchors stay native, with the target resynced from any scroll it did not cause so nothing fights it.
- Still `IntersectionObserver` and `position: sticky` rather than CSS `animation-timeline`: **Firefox keeps scroll-driven animations behind a flag as of mid-2026** (~84% global support), so `animation-timeline` would leave a large minority with no motion at all. As in v2 every class is added by JS and never ships in the markup, so nothing is hidden when JS is off.
- **The `.js` flag.** An inline `<head>` script marks the document as scripted. The nav only drops its background over a dark page header while that flag is set, so with JavaScript off it keeps its plate instead of staying transparent over the light sections with dark text on them. Inline and in `<head>` because doing it from `main.js` would paint a solid nav over the hero for a frame first.
- Page-load intro is one orchestrated CSS sequence. Both motion layers are disabled under `prefers-reduced-motion`, which also drops the pinning, the parallax, and the scan sweep.
- **Hero node field** (`HERO NODE FIELD` in `main.js`): a canvas of drifting nodes linked when they come within range, with packets running along a link. It carries no information, is `aria-hidden`, draws a single static frame under `prefers-reduced-motion`, and stops painting entirely when the hero scrolls out of view or the tab is hidden.
- CSS custom properties: the whole palette is defined once in `:root` in `style.css`
- GitHub Pages, automatic deploy on every push
- Claude, my partner in crime for building it

## Build

The nav, `<head>`, and footer are identical on every page, and hand-maintaining five copies is how they drift out of sync. `build.py` renders them from one template instead.

```bash
python3 build.py
```

Page bodies and the widget scripts live in `parts/`. **Edit those, re-run, commit the generated HTML.** Every `.html` at the root is generated and carries a "do not edit" banner; editing one directly means losing the change on the next build.

All five pages go through the build, `index.html` included. Its layout is unique, so it passes a few extra slots to `head()` (a preloaded portrait, the JSON-LD, `<body id="top">`, the certification modal), but its chrome comes from the same template as everywhere else. Every page now passes `class="dark-top"`, which is what tells the nav it opens over a dark header and should start with no plate behind it.

You only need to re-run the build after editing something in `parts/`. Changes to `style.css`, `main.js`, or images need nothing.

> Nothing here is required to *serve* the site. GitHub Pages just publishes the HTML. The build step exists so the shared chrome has one source of truth.

## Structure

```
.
├── index.html          Home                   ┐
├── projects.html       Casework + archive     │
├── lab.html            Lab feed + exercises   │ generated
├── about.html          Bio and interests      │ by build.py
├── 404.html            Not-found page         ┘ do not edit
├── style.css           One stylesheet, tokens in :root
├── main.js             Nav, modals, gate, lightbox, motion
├── build.py            Page assembler
├── parts/              Page bodies + widget scripts, and the
│                       index-only head extras and body
├── img/
│   ├── felix.jpg       Portrait (+ felix-sm.jpg for 1x)
│   ├── og.png          Social share image
│   ├── logo-stemuli.png
│   ├── logo-feba.png   Employer marks, transparent PNGs
│   ├── builds/         PC build photos
│   ├── food/           Food photos
│   ├── watches/        Watch photos
│   └── outdoors/       Outdoor photos
│                       (each as name.jpg + name-sm.jpg)
├── favicon.svg         Brand mark (+ PNG/ICO fallbacks, apple-touch-icon)
├── sitemap.xml         + robots.txt, for search indexing
├── .well-known/
│   └── security.txt    Standard vulnerability-disclosure contact
├── CNAME               Custom domain. Do not delete. Removing it disconnects felixnaroditskiy.com.
└── NaroditskiyFelixResume.pdf
```

Photos live under `img/`. The favicon set stays at the root on purpose: browsers request `/favicon.ico` from the root by default, and `apple-touch-icon.png` is looked for there too, so moving those breaks the fallbacks. The resume stays at the root so it has a clean shareable URL.

### Adding photos

Drop the files in the matching `img/` subfolder as `name.jpg` (the full photo, uncropped, long edge up to 1400px) plus `name-sm.jpg` (a 440x440 square crop for the thumbnail), then add an entry to that interest's `imgs` array in `parts/interests.js.html`:

```js
imgs: [
  ['img/food/food-4', 'Caption that shows in the lightbox.']
]
```

The path has no extension. The thumbnail uses `-sm.jpg` and the lightbox uses the full file. Thumbnails are square and full images are never cropped, because several source photos are portrait and a landscape crop cut the subject out entirely. Re-run `python3 build.py`. No other changes needed: the lightbox binds to whatever is on the page.


## Contact

- **Email:** fnaroditskiy@gmail.com
- **LinkedIn:** [felix-naroditskiy](https://www.linkedin.com/in/felix-naroditskiy)

© 2026 Felix Naroditskiy
