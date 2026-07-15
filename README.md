# DerpTG.github.io

Personal cybersecurity portfolio for **Felix Naroditskiy**. Digital forensics, malware analysis, and incident response, with the governance and compliance work alongside it.

**Live at:** [derptg.github.io](https://derptg.github.io)

## What this is

A static portfolio site built with semantic HTML, a single CSS stylesheet driven by custom properties, and small vanilla-JavaScript widgets, with no framework or build step behind it.

This portfolio site was built with Claude, in the same fashion I work and learn every day: moving fast, staying accurate, and picking up new things along the way. I drove every decision that mattered, from the design and structure to the content and voice, and reviewed it all before it shipped. The whole point was to build something you can dig into and explore, not just another page of bullet points describing work you'll never get to see.

## Pages

| Page | What's on it |
|------|--------------|
| `index.html` | Landing page: intro, work history, capabilities, clickable certifications, contact |
| `casework.html` | The two headline investigations: an interactive kill-chain map and a terminal-style malware triage tool covering 12 samples |
| `lab.html` | A running log of self-directed work, laid out as a live alert feed |
| `projects.html` | The project archive as an expandable record list, with the skills for each project labeled inside |
| `about.html` | Bio, quick facts, and an interests console |

## Interactive pieces

Each widget is a data array plus a render function, kept simple so the code stays readable:

- **Kill-chain map** (`casework.html`): a seven-stage MITRE ATT&CK timeline reconstructed from a capstone ransomware investigation.
- **Malware triage terminal** (`casework.html`): static and dynamic analysis records for 12 detonated samples.
- **Lab feed** (`lab.html`): the lab log presented as a SOC alert queue; each entry expands to the full write-up.
- **Project records** (`projects.html`): a packet-capture-style list; each record opens to the story and the skills it used.
- **Interests console** (`about.html`): a terminal where selecting an interest prints its detail.

## Tech

- HTML, CSS, and vanilla JavaScript, with no libraries or frameworks
- CSS custom properties, so the whole palette is defined once in `:root` in `style.css`
- GitHub Pages for static hosting, with automatic deploy on every push

## Structure

```
.
├── index.html        Home
├── casework.html     Kill chain and malware triage
├── lab.html          Lab feed
├── projects.html     Project records
├── about.html        Bio and interests
├── style.css         One stylesheet, tokens defined in :root
├── main.js           Shared behavior: accordions and the resume/cert modals
└── NaroditskiyFelixResume.pdf
```

Page-specific JavaScript lives inline at the bottom of each page. `main.js` holds only the behavior shared across pages.

## Contact

- **Email:** fnaroditskiy@gmail.com
- **LinkedIn:** [felix-naroditskiy](https://www.linkedin.com/in/felix-naroditskiy)

© 2026 Felix Naroditskiy