# DESIGN.md — Aditya Online Center (Awwwards Art Direction & System)

## Phase 0: Brief
- **Subject:** **ADITYA ONLINE CENTER** (`आदित्य ऑनलाइन सेंटर`) — Official Digital Documentation, Form-Filling & Cyber Studio in Ward No. 08, Near G.A. High School, Kateya, Gopalganj, Bihar (`PIN 841437`).
- **Audience:** Students, job seekers, families, and citizens in Kateya & Gopalganj ordering ATS resumes, marriage biodata, government/scholarship form applications, and 300-DPI PDF formatting from mobile or desktop.
- **Job to be Done:** Allow customers to inspect required documents, preview live drafts, submit orders with private document uploads, verify manual UPI payments via 12-digit UTR, and track/download final print-ready PDFs.
- **Languages:** Bilingual English (`EN`) & Hindi (`हिं` / Devanagari).
- **Stack:** Existing Vite + React 19 + TypeScript + Tailwind CSS v4 + Firebase Auth & Firestore.

---

## Phase 1: Concept Card

### Three Candidate Concepts Evaluated
1. **The Studio Press Ledger (Material & Craft):** Borrows from precision print-making, A4 bond paper, 300-DPI registration marks, and warm ember foil stamping. *(Originality: 5/5, Fit: 5/5, Feasibility: 5/5, Portability: 1/5 — Selected)*
2. **Gopalganj Civic Telegraph (Place & Coordinates):** Built around regional postal indices (`841437`) and railway/telegraph boards. *(Originality: 4/5, Fit: 4/5, Feasibility: 4/5, Portability: 2/5)*
3. **Kinetic Devanagari Grid (Typographic System):** Pure Swiss bilingual grid with oversized Devanagari/Latin numerals. *(Originality: 4/5, Fit: 4/5, Feasibility: 5/5, Portability: 3/5)*

### Winning Concept Card
```text
Idea:        A local cyber cafe elevated into a precision 300-DPI digital print & documentation studio.
Metaphor:    An illuminated darkroom & architectural print press where raw phone photos become stamped A4 deliverables.
Signature:   Interactive 3D Document Studio Stage + Clip-Path Before/After Transformation Slider (raw handwritten notes → stamped 300-DPI studio PDF).
Emotion:     Immediate institutional trust, clarity, and tactile craft within the first 3 seconds.
Motion verb: "Stamp & Settle" — primary targets invert or sweep with a crisp specular fill and subtle vertical press on hover/active (`cubic-bezier(0.16, 1, 0.3, 1)`).
Screenshot:  The split Hero Stage showing the official Aditya Online Center emblem, luminous headline "Your Digital World, Simplified.", live Kateya coordinates (26.5167° N, 84.0167° E), and the 3D Isometric Document Hologram.
```

---

## Phase 2: Art Direction System

### 1. Palette (Named Roles)
| Role | Hex | Usage |
| :--- | :--- | :--- |
| **Ground (Light Canvas)** | `#F7F3EA` | Warm archival bond-paper cream canvas (`60%` surface allocation) |
| **Ground (Obsidian Stage)** | `#101014` | Charcoal black darkroom stage for Hero, Before/After Studio, and Footer |
| **Elevated Surface** | `#FFFDF9` / `#17171E` | High-contrast ledger cards and translucent obsidian panels (`30%` surface allocation) |
| **Ink (Primary Text)** | `#101014` / `#F7F3EA` | High-contrast AA/AAA body and display ink |
| **Muted Ink** | `#5C5852` / `#D8D3C8` | Secondary captions, bilingual subtitles, and specification metadata |
| **Hairline** | `#DCD4C6` / `rgba(255,255,255,0.15)` | 1px structural registration lines and ledger dividers |
| **Primary Accent (Ember)** | `#FF5C35` | Neon ember orange for primary CTAs, active tabs, and focus rings (`10%` accent budget) |
| **Secondary Accent (Amber)** | `#FFB547` | Warm gold/amber for numerals, coordinates, and verified badges |

### 2. Typography
- **Display Face:** `'Bricolage Grotesque'` paired with `'Noto Sans Devanagari'` for Hindi headlines.
  - Hero `<h1>`: `clamp(2.25rem, 4.2vw, 3.75rem)`, `line-height: 1.03`, `letter-spacing: -0.025em`, optical alignment (`text-wrap: balance`).
  - Section `<h2>`: `clamp(1.75rem, 3vw, 2.75rem)`, `line-height: 1.08`, `letter-spacing: -0.02em`.
- **Body Face:** `'Plus Jakarta Sans'` / `'DM Sans'` paired with `'Noto Sans Devanagari'` (`16px` base, `1.55`–`1.65` line-height, `65ch` max measure).
- **Monospace / Tabular Data:** `'JetBrains Mono'` with `font-variant-numeric: tabular-nums` for order IDs (`AOC-YYYYMMDD-XXXX`), INR tariffs (`₹49`), coordinates (`26.5167° N, 84.0167° E`), and UTR numbers.

### 3. Grid, Rhythm & Shape
- **Grid:** 12-column architectural container (`max-w-7xl`, `24px` desktop gutter, `16px` mobile gutter) with visible registration metadata and hairline dividers.
- **Section Rhythm:** Alternates dark obsidian stage (`00. Hero`) → warm archival cream (`01. Curated Service Index`, `01.B Exam Radar`) → dark obsidian (`01.C Before/After Studio`) → warm cream (`01.D Multi-Service Bundle Estimator`, `01.F Student Utility Lab`, `02. 4-Step Process`, `03. Verified Reviews`, `04. FAQ`).
- **Motion Language:**
  - Single cubic-bezier family: `cubic-bezier(0.16, 1, 0.3, 1)`.
  - Primary CTA buttons use `.awwwards-magnetic-cta` (specular sweep + `-2px` lift on hover, `+1px` stamp on active press, unmistakable `focus-visible` outline).
  - Idle state: Continuous subtle 60fps canvas perspective horizon & floating 3D telemetry layers in the Hero stage, automatically paused when off-screen or under `prefers-reduced-motion: reduce`.

### 4. Composition Plan (ASCII Wireframes)
```text
[00. HERO STAGE — 12-Col Asymmetric Split]
+-----------------------------------+-----------------------------------+
| [Logo] ADITYA ONLINE CENTER       |  +-----------------------------+  |
| Your Digital World, Simplified.   |  | 3D ISOMETRIC DOCUMENT STAGE |  |
| [Explore Services] [Track Order]  |  | + Pointer-Reactive Parallax |  |
| [Search Command Bar            ]  |  +-----------------------------+  |
| [08 Srv] [₹40-100] [1-8H] [100%]  |  [Quick Order Tracker: AOC-...]   |
+-----------------------------------+-----------------------------------+

[01. SERVICE INDEX — Asymmetric Bento & Specification Cards]
+-----------------------------------------------------------------------+
| 01. CURATED 3D SERVICE INDEX              [Filter by Keyword       ]  |
| [All (8)] [Resumes (3)] [PDF (2)] [Forms & Scholarships (3)]          |
+-----------------------+-----------------------+-----------------------+
| 01. ATS Resume (Dark) | 02. Marriage Biodata  | 03. Hindi/Eng Typing  |
+-----------------------+-----------------------+-----------------------+

[01.C BEFORE & AFTER STUDIO — Interactive 8/4 Split]
+-----------------------------------------------+-----------------------+
| [Clip-Path Drag/Click Slider: Before | After] | Studio Audit Ledger   |
| Raw Phone Notes <===> 300-DPI Print-Ready PDF | + Direct Order CTA    |
+-----------------------------------------------+-----------------------+
```
