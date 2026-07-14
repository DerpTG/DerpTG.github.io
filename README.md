# DerpTG.github.io

Personal cybersecurity portfolio for **Felix Naroditskiy** — digital forensics, malware analysis, and incident response, with the governance and compliance work alongside it.

**Live at:** [derptg.github.io](https://derptg.github.io)

---

## What this is

A hand-built static site — no framework, no build step, no dependencies. Just semantic HTML, one CSS stylesheet driven by custom properties, and small self-contained vanilla-JavaScript widgets. It's designed to be the opposite of a resume bullet: instead of *claiming* forensics and detection experience, it lets you click through real casework.

## Pages

| Page | What's on it |
|------|--------------|
| `index.html` | Landing page — intro, work history, capabilities, clickable certifications, contact |
| `casework.html` | The two headline investigations: an interactive **kill-chain map**, a **PCAP evidence viewer**, and a terminal-style **malware triage** tool covering 12 samples |
| `lab.html` | Self-directed lab log, an interactive **SIEM triage console**, and a branching **IR tabletop** exercise |
| `projects.html` | Project archive with expandable cards and a skills grid |
| `about.html` | Bio, background, and interests |

## Interactive pieces

Each widget is built the same simple way — a data array plus a render function — so the code stays readable:

- **Kill-chain map** (`casework.html`) — a 7-stage MITRE ATT&CK attack timeline reconstructed from a capstone ransomware investigation.
- **PCAP evidence viewer** (`casework.html`) — a Wireshark-style packet list where each packet expands to show its dissection and why it mattered as evidence.
- **Malware triage terminal** (`casework.html`) — static and dynamic analysis records for 12 detonated samples.
- **SIEM triage console** (`lab.html`) — a SOC alert queue where you pick a disposition for each alert and get scored against the right call.
- **IR tabletop** (`lab.html`) — a branching ransomware scenario scored against NCISS escalation tiers.

## Tech

- **HTML / CSS / vanilla JavaScript** — zero libraries or frameworks
- **CSS custom properties** — the whole palette is defined once in `:root` in `style.css`
- **GitHub Pages** — static hosting with automatic deploy on every push

## Structure

```
.
├── index.html        # Home
├── casework.html     # Kill chain, PCAP viewer, malware triage
├── lab.html          # Lab log, SIEM console, IR tabletop
├── projects.html     # Project archive + skills
├── about.html        # Bio + interests
├── style.css         # Single stylesheet (design tokens in :root)
├── main.js           # Shared behavior: accordions + resume/cert modals
└── NaroditskiyFelixResume.pdf
```

Page-specific JavaScript (the interactive widgets) lives inline at the bottom of each page it belongs to; `main.js` holds only the behavior shared across pages.

## Contact

- **Email:** fnaroditskiy@gmail.com
- **LinkedIn:** [felix-naroditskiy](https://www.linkedin.com/in/felix-naroditskiy)

---

© 2026 Felix Naroditskiy