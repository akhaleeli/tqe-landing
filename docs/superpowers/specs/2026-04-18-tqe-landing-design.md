# The Qur'an Explained — Donor Landing Page

**Date:** 2026-04-18
**Status:** Draft for user review
**Deploy target:** `quran-explained.pages.dev` (Cloudflare Pages)

## Goal

A single-page, design-led donor brief for *The Qur'an: Explained* (TQE), shareable
immediately with known donors. The page communicates what the project is, why it
matters, current progress, timeline to launch, and how to contribute. The sample
PDF must be downloadable, the donate routes must be unambiguous, and the whole
thing must feel like serious scholarship rather than a campaign landing page.

## Constraints

- **Ship ASAP.** User has donors waiting; priority is a shareable URL today or
  tomorrow, not a perfect site.
- **No DNS / backend access** to `quraniverse.ai` yet. Deploy to a `pages.dev`
  subdomain now; migrate to a proper subdomain/path later without code changes.
- **Minimum admin overhead.** Progress number updated manually (one edit, one
  commit); no email gate, no mailing list tooling, no CMS for this iteration.
- **No photo of the translator.** Page is about the project, not the person.

## Stack

- **Static HTML + CSS**, hand-crafted. A small amount of vanilla JS for scroll
  reveals, mouse-tilt on the hero book cover, and click-to-copy on bank details.
- **No framework.** Single `index.html`, single `styles.css`, single `script.js`,
  plus an `/assets/` folder for images and the sample PDF.
- **Fonts** via Google Fonts (serif display: *EB Garamond*; sans body: *Inter*).
- **Hosting:** Cloudflare Pages, deployed from a GitHub repo so future updates
  are one `git push` away.

## Design language

**Palette** (drawn from the book cover):
- Primary navy: `#0E2748`
- Accent brass/gold: `#C9A24A`
- Cream background: `#FBF7EE`
- Off-white panel: `#FFFFFF`
- Body text: `#1A1A1A`
- Muted text: `#5A5A5A`

**Typography:**
- Display / headings: *EB Garamond* (serif, 400 / 500 / 600 weights)
- Body: *Inter* (sans, 400 / 500)
- Monospaced (bank details): system `ui-monospace, SFMono-Regular, Menlo`

**Layout:**
- Max content width 1120px, generous gutters, vertical rhythm based on a
  24px baseline.
- Sections alternate cream and navy panels for visual rhythm. Navy panels use
  an off-white text colour; cream panels use near-black.
- Mobile-first; breakpoint at 768px for two-column layouts.

**Motion (gentle, deliberate):**
- Sections fade-and-rise 16px on entering viewport (Intersection Observer,
  400ms, ease-out). Runs once per session.
- Primary buttons: hover lifts 2px, box-shadow deepens, accent brightens.
- Links: underline sweeps left-to-right on hover (120ms).
- Hero book cover: subtle 3D tilt tracking cursor (max 6° rotation, scale 1.01).
  Disabled for `prefers-reduced-motion`.
- No parallax, no autoplay, no loading spinners.

**Accessibility:**
- WCAG AA contrast on all text/background pairs.
- Respect `prefers-reduced-motion`: strip all transforms, keep opacity fades.
- Keyboard-navigable; focus states visible and matched to the brass accent.
- Semantic HTML; landmarks for nav, main, footer.

## Page structure (top to bottom)

### 1. Sticky top nav
Thin navy bar, always visible. Left: *The Qur'an: Explained* wordmark in
serif. Right: a compact brass "Support the project" button that scrolls to
section 7.

### 2. Hero
Full viewport height on desktop, min 640px. Deep navy background with a
low-opacity (≤6%) Islamic geometric motif layered behind the content.

- **Left (60% width desktop, stacked on mobile):**
  - H1: *The Qur'an: **Explained*** — "Explained" rendered in brass.
  - Subhead: *An accessible one-volume commentary on the whole Qur'an,
    based on the teachings of the Prophet ﷺ and his Household (a.s.).*
  - Two CTAs stacked horizontally:
    - Primary (brass, filled): **Support the project** → scrolls to §7
    - Secondary (ghost, brass outline): **Download sample** → `/assets/sample.pdf`
- **Right (40% width desktop, above text on mobile):**
  - `book-cover.png` with soft drop-shadow and the cursor-tracked 3D tilt.

### 3. The Challenge
Cream panel. Opens with a short paragraph framing the problem, then a 2×3 grid
of cards (stacks on mobile) drawn from the brief:

- No comprehensive, accessible tafsir based on Ahlulbayt teachings exists in English.
- 200,000+ UK Shi'a Muslims (millions globally) lack resources reflecting their theological perspective.
- Educational institutions rely on incomplete materials.
- Generational disconnect between young English-speaking Shi'a Muslims and reliable scholarship.
- Youth exposed to alternative ideologies need intellectual tools to anchor their faith.

Each card: small brass line-icon, short title, one-sentence body. Hover lifts
the card 2px and shifts the border from muted to brass.

### 4. What the book is
Navy panel. Centrepiece visual and the project's killer differentiator.

- H2: *One page of Qur'an. One page of commentary.*
- Full-width visual: two side-by-side cards — left labelled "Qur'an",
  cropped to the Arabic block from `page_42.png`; right labelled
  "Commentary", the translation/commentary block. Small caption beneath:
  *Sample page — Sūrat al-Baqara.*
- Four feature bullets below the spread, in a 2×2 grid:
  - Clear, readable Arabic script — equal to one page of the Mushaf
  - English translation based on a refined Ali Quli Qara'i text
  - Deeper reflections drawn from the most authoritative Shi'i tafsirs
  - Every claim footnoted to primary sources

### 5. Progress & timeline
Cream panel. Two-column (stacks on mobile):

- **Left: Progress ring.** Large circular SVG at 50%. Centred inside:
  **302 / 604** (big), "pages translated" (small). Below the ring:
  *Translation through verse 18:83.*
  Small italic caption: *Last updated: 18 Apr 2026.*
- **Right: Timeline.** Horizontal bar mirroring the Phase 1 timeline from the
  brief: Translation (Apr–Sep 2026) → Editing (Jun–Oct 2026) → Typesetting
  (Sep–Nov 2026) → Marketing (Aug 2026–Jan 2027) → **Launch (Jan 2027)**.
  Each band coloured distinctly but within the navy/brass/cream palette.
- Below both columns: **Funds raised: £25,000 of £60,000 (42%)** as a
  horizontal progress bar in brass, with the text *£35,000 still needed to
  fully fund the project.*

### 6. Team & scholarly foundation
Navy panel.

- **Left column:** Short paragraph about the principle translator —
  *Alexander Khaleeli, Hawza graduate; 15+ years in Islamic translation and
  publishing; currently pursuing PhD studies at the University of Exeter.*
  Immediately followed by: *Supported by a team of translators and editors
  with years of experience in translation, research, and publication.*
- **Right column:** Two-column list of the ten named tafsirs (italic serif,
  muted authors below each):
  - Tafsir al-Mizan — Allamah Tabataba'i
  - Tafsir Nimuneh — Ayatullah Makarem Shirazi
  - Tafsir Ala' al-Rahman — Ayatullah Jawad al-Balaghi
  - Tafsir al-Tasnim — Ayatullah Jawadi Amoli
  - Manshur-i Javid — Ayatullah Ja'far Sobhani
  - Majma' al-Bayan — Shaykh al-Tabrisi
  - Tafsir al-Safi — Fayd Kashani
  - Tafsir Nur al-Thaqalayn — Shaykh al-Huwayzi
  - Tafsir al-Burhan — Sayyid Hashim al-Bahrani
  - Atyab al-Bayan — Sayyid 'Abd al-Husayn Tayyib

  Small footer: *Commentary drawn from 30+ Shi'i tafsirs and compilations.*
- **Below both columns:** Three role-cards in a row — Publication Team,
  Technical Team, Subject Matter Experts — each with a short one-line
  description from the brief.

### 7. Why support
Cream panel. Five-card grid (3 + 2 layout on desktop, stacked on mobile):

- **Sadaqa Jariya** — High impact with global benefit
- **First of its kind** — Meeting a critical educational need
- **Digital ecosystem** — Phases 2 & 3 ensure continuous engagement
- **Experienced team** — Proven track record of delivery
- **Long-term sustainability** — All revenue reinvested into widening access

Each card: small brass icon, title, one-sentence body. Matches §3 hover
treatment.

### 8. How to support
Navy panel, the conversion section. Four cards in a 2×2 grid (single
column on mobile):

- **Bank Transfer** — full details in monospaced type, each field
  click-to-copy (brief visual confirmation on copy):
    - Account Name: Compassion for Humanity
    - Bank: Lloyds Bank
    - Account No: 21451960
    - Sort Code: 30-54-66
    - Ref: Tafsir Project
    - UK Registered Charity No: 1194528
- **Online** — brass button → `https://sad.qa/Qurancommentary`
- **PayPal** — brass button → `https://www.paypal.com/donate/?hosted_button_id=RLCNCZCY9FR7C`
- **Gift Aid** — brass button → `https://compassionforhumanity.org.uk/gift_aid`

Small footnote below: *Compassion for Humanity · UK Registered Charity No.
1194528 · Donations are Gift Aid eligible and tax-deductible for businesses.*

### 9. Footer
Centred, navy-on-cream, single line: *In His name, the Most High.*
Small print beneath: copyright, charity number, a plain `mailto:` contact
link (address TBD at deploy time).

## Assets

**In the project folder (`TQE Marketing/`):**
- `The Qur'an Explained Project Brief.pdf` — source of all copy
- `The Quran Explained Sample.pdf` — the 48-page sample for download (rename
  to `assets/sample.pdf` at deploy)
- `The Qur'an Explained Project Brief.png` — book cover render (rename to
  `assets/book-cover.png`)
- `page_42.png` — sample page for the §4 dual-panel visual (crop into two
  assets: `assets/spread-arabic.png`, `assets/spread-commentary.png`)

**To create:**
- An Islamic geometric motif for the hero background (low-opacity SVG — I can
  generate one, or source from an open licence).
- Line-icons for §3 and §7 cards (generate inline SVGs from Lucide or similar).
- A `favicon.ico` + touch icon.

## Update workflow (manual, for now)

1. User tells Claude the new verse / page count.
2. Claude edits `index.html`, bumping:
   - `<div class="progress-ring" data-percent="50">` → new percent
   - `<strong>302 / 604</strong>` → new number
   - `Translation through verse <span>18:83</span>` → new verse
   - `Last updated: <span>18 Apr 2026</span>` → today
3. `git commit -am "progress: through verse X:Y"` and push.
4. Cloudflare Pages auto-rebuilds within ~30s.

## Deployment

- Fresh GitHub repo under the user's account: `tqe-landing` (or similar).
- New Cloudflare Pages project connected to the repo, auto-deploys from `main`.
- `pages.dev` URL: `quran-explained.pages.dev`.
- Build command: none (pure static). Output directory: root.
- A future custom domain (`quraniverse.ai/explained` or
  `explained.quraniverse.ai`) is a Cloudflare dashboard change; no code edits.

## Deferred / not in scope

- **Email gating** of the sample download. Add once user has backend access
  (plan: Buttondown integration via Cloudflare Pages Function).
- **Auto-updating progress** via a launchd job scanning the translation
  pipeline. User elected manual updates.
- **Scholar endorsements / quotes.** To be added to a new section between
  §6 and §7 when the user has them.
- **Multi-page structure** (team page, phases page, sample viewer). Not
  needed for this iteration; current scope is a single donor brief.
- **Analytics.** Not in scope for v1; can add Cloudflare Web Analytics
  (privacy-preserving, no cookies) at any time via dashboard.

## Open / to confirm at deploy

- **Contact email address** for the footer.
- **Favicon** — user can supply, otherwise I'll extract a clip of the book
  cover dome as a placeholder.
