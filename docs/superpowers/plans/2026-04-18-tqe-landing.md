# The Qur'an Explained Landing Page — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a single-page, design-led donor landing page for *The Qur'an: Explained* to `quran-explained.pages.dev` with minimum friction.

**Architecture:** Pure static site — one `index.html`, one `styles.css`, one `script.js`, and an `/assets/` folder. No framework, no build step. Deployed to Cloudflare Pages from a GitHub repo. Motion via vanilla JS (Intersection Observer + `pointermove`). Progress numbers edited manually.

**Tech Stack:** HTML5, CSS3 (custom properties, grid, flexbox), vanilla JS (ES2020), Google Fonts (EB Garamond + Inter), inline SVG for icons and progress ring.

**Verification note:** This is a static landing page — there is no unit-test framework. Each task ends with a **browser check** (load `index.html` locally, confirm visual and behaviour) in place of a test run. For the final task we deploy and confirm on the live URL.

---

## File structure

After Task 1 the folder looks like this (paths relative to `/Users/alex_khaleeli/Claude Code/TQE Marketing/`):

```
index.html              # entire page markup
styles.css              # all styling, CSS custom properties
script.js               # scroll reveals, hero tilt, click-to-copy
assets/
  book-cover.png        # hero image (renamed)
  spread-arabic.png     # cropped Arabic block from page_42
  spread-commentary.png # cropped translation block from page_42
  sample.pdf            # downloadable sample (renamed)
  motif.svg             # Islamic geometric motif for hero background
  favicon.ico
  icon-*.svg            # card line-icons (one per challenge/support card)
docs/
  superpowers/
    specs/2026-04-18-tqe-landing-design.md    # approved spec
    plans/2026-04-18-tqe-landing.md           # this plan
source/                 # original delivered files kept for reference
  brief.pdf
  brief-cover.png
  page_42.png
  sample.pdf
```

Original source files (`The Qur'an Explained Project Brief.pdf`, etc.) are moved into `source/` so the project root stays clean and the deploy output is unambiguous.

---

### Task 1: Scaffold project structure and prepare assets

**Files:**
- Create: `index.html`, `styles.css`, `script.js`
- Create: `assets/` directory
- Move: source files into `source/`, renamed images into `assets/`

- [ ] **Step 1: Create folders and move source files**

Run from the project root (`/Users/alex_khaleeli/Claude Code/TQE Marketing/`):

```bash
mkdir -p assets source
mv "The Qur'an Explained Project Brief.pdf" source/brief.pdf
mv "The Qur'an Explained Project Brief.png" source/brief-cover.png
mv page_42.png source/page_42.png
mv "The Quran Explained Sample.pdf" source/sample.pdf
cp source/brief-cover.png assets/book-cover.png
cp source/sample.pdf assets/sample.pdf
```

Expected: `source/` contains four original files; `assets/` contains `book-cover.png` and `sample.pdf`.

- [ ] **Step 2: Crop page_42 into Arabic and commentary halves**

Use `sips` (ships with macOS, no install needed). The source `page_42.png` is approximately 830×1200px. Arabic block occupies the top third; commentary/translation the bottom two-thirds. Exact crop coords:

```bash
# Check actual dimensions first
sips -g pixelWidth -g pixelHeight source/page_42.png

# Arabic top block: full width, top 450px
sips --cropToHeightWidth 450 830 --cropOffset 0 0 source/page_42.png --out assets/spread-arabic.png

# Commentary bottom block: full width, from y=480 down to y=1150 (670px high)
sips --cropToHeightWidth 670 830 --cropOffset 480 0 source/page_42.png --out assets/spread-commentary.png
```

Note: if the measured dimensions differ, adjust crop offsets proportionally — the Arabic half is the top ~38% of the image, commentary is the bottom ~55%, with a small gap between.

Expected: two cropped PNGs land in `assets/`.

- [ ] **Step 3: Create the Islamic geometric motif SVG**

Create `assets/motif.svg` with an 8-point star tessellation. Used at low opacity behind the hero.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <pattern id="star8" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
      <g fill="none" stroke="#C9A24A" stroke-width="0.8">
        <polygon points="40,8 48,32 72,40 48,48 40,72 32,48 8,40 32,32" />
        <polygon points="40,20 44,36 60,40 44,44 40,60 36,44 20,40 36,36" />
        <circle cx="40" cy="40" r="3" />
      </g>
    </pattern>
  </defs>
  <rect width="200" height="200" fill="url(#star8)" />
</svg>
```

- [ ] **Step 4: Create a placeholder favicon**

Crop a 64×64 square from the book cover dome:

```bash
sips --cropToHeightWidth 400 400 --cropOffset 100 150 assets/book-cover.png --out /tmp/favicon-src.png
sips -z 64 64 /tmp/favicon-src.png --out assets/favicon.png
# Convert to ico (sips doesn't do ico; use a one-liner via python PIL which ships with macOS)
python3 -c "from PIL import Image; Image.open('assets/favicon.png').save('assets/favicon.ico', sizes=[(16,16),(32,32),(64,64)])"
rm assets/favicon.png
```

If PIL isn't available, a PNG favicon works too — just reference `favicon.png` in the `<link>` tag instead of `favicon.ico`. Both are supported by modern browsers.

- [ ] **Step 5: Create empty `index.html`, `styles.css`, `script.js`**

Create `index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="The Qur'an: Explained — an accessible one-volume commentary on the whole Qur'an, based on the teachings of the Prophet and his Household.">
  <title>The Qur'an: Explained</title>
  <link rel="icon" href="assets/favicon.ico">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <!-- content follows in later tasks -->
  <script src="script.js" defer></script>
</body>
</html>
```

Create empty `styles.css` and `script.js`:

```bash
touch styles.css script.js
```

- [ ] **Step 6: Browser check**

```bash
open index.html
```

Expected: blank page, title tab shows "The Qur'an: Explained", favicon visible, DevTools Network tab shows fonts loading, no 404s.

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "scaffold: assets, empty html/css/js, source archive"
```

---

### Task 2: CSS foundation — reset, tokens, typography, layout primitives

**Files:**
- Modify: `styles.css`

- [ ] **Step 1: Add reset, custom properties, base typography**

Replace the contents of `styles.css` with:

```css
/* --- Reset --- */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body { line-height: 1.6; -webkit-font-smoothing: antialiased; }
img, svg { display: block; max-width: 100%; height: auto; }
button { font: inherit; cursor: pointer; border: none; background: none; }
a { color: inherit; text-decoration: none; }
ul { list-style: none; }

/* --- Design tokens --- */
:root {
  --navy: #0E2748;
  --navy-light: #1A3A63;
  --brass: #C9A24A;
  --brass-light: #DDB865;
  --cream: #FBF7EE;
  --white: #FFFFFF;
  --ink: #1A1A1A;
  --muted: #5A5A5A;
  --border: rgba(14, 39, 72, 0.12);
  --border-on-navy: rgba(201, 162, 74, 0.28);
  --shadow-sm: 0 2px 8px rgba(14, 39, 72, 0.08);
  --shadow-md: 0 8px 24px rgba(14, 39, 72, 0.12);
  --shadow-lg: 0 20px 48px rgba(14, 39, 72, 0.18);

  --font-display: 'EB Garamond', 'Georgia', serif;
  --font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: ui-monospace, 'SF Mono', Menlo, monospace;

  --container: 1120px;
  --gutter: clamp(20px, 4vw, 48px);
  --section-pad: clamp(64px, 9vw, 120px);
}

/* --- Body + typography --- */
body {
  font-family: var(--font-body);
  color: var(--ink);
  background: var(--cream);
}
h1, h2, h3 { font-family: var(--font-display); font-weight: 500; line-height: 1.15; letter-spacing: -0.01em; }
h1 { font-size: clamp(2.5rem, 6vw, 4.5rem); }
h2 { font-size: clamp(2rem, 4.5vw, 3rem); }
h3 { font-size: clamp(1.25rem, 2vw, 1.5rem); }
p { font-size: 1.0625rem; }
p.lead { font-size: 1.1875rem; color: var(--muted); }
em, i { font-style: italic; }

/* --- Layout primitives --- */
.container { max-width: var(--container); margin-inline: auto; padding-inline: var(--gutter); }
.section { padding-block: var(--section-pad); }
.section--navy { background: var(--navy); color: var(--cream); }
.section--navy h1, .section--navy h2, .section--navy h3 { color: var(--cream); }
.section--navy p { color: rgba(251, 247, 238, 0.85); }

/* --- Buttons --- */
.btn {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 14px 28px; border-radius: 4px;
  font-family: var(--font-body); font-weight: 500; font-size: 1rem;
  letter-spacing: 0.01em; text-align: center;
  transition: transform 180ms ease, box-shadow 180ms ease, background 180ms ease, color 180ms ease;
}
.btn--primary { background: var(--brass); color: var(--navy); box-shadow: var(--shadow-sm); }
.btn--primary:hover { background: var(--brass-light); transform: translateY(-2px); box-shadow: var(--shadow-md); }
.btn--ghost { background: transparent; color: var(--brass); border: 1.5px solid var(--brass); }
.btn--ghost:hover { background: var(--brass); color: var(--navy); transform: translateY(-2px); }

/* --- Links --- */
a.inline-link { position: relative; color: var(--brass); }
a.inline-link::after {
  content: ''; position: absolute; left: 0; bottom: -2px;
  width: 100%; height: 1px; background: currentColor;
  transform: scaleX(0); transform-origin: right; transition: transform 200ms ease;
}
a.inline-link:hover::after { transform: scaleX(1); transform-origin: left; }

/* --- Accessibility --- */
:focus-visible { outline: 2px solid var(--brass); outline-offset: 3px; border-radius: 2px; }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
  html { scroll-behavior: auto; }
}
```

- [ ] **Step 2: Browser check**

```bash
open index.html
```

Expected: page still blank but background is cream (`#FBF7EE`). No console errors. Fonts load (check DevTools Network).

- [ ] **Step 3: Commit**

```bash
git add styles.css
git commit -m "styles: reset, design tokens, typography, layout primitives"
```

---

### Task 3: Sticky nav and hero

**Files:**
- Modify: `index.html` (add nav + hero markup)
- Modify: `styles.css` (nav + hero styles)
- Modify: `script.js` (hero tilt)

- [ ] **Step 1: Add nav and hero markup inside `<body>` (before `<script>`)**

```html
<header class="nav">
  <div class="container nav__inner">
    <a href="#" class="nav__brand">The Qur'an: <em>Explained</em></a>
    <a href="#support" class="btn btn--primary nav__cta">Support the project</a>
  </div>
</header>

<main>
  <section class="hero">
    <div class="hero__motif" aria-hidden="true"></div>
    <div class="container hero__inner">
      <div class="hero__text">
        <p class="hero__bismillah">In His name, the Most High</p>
        <h1>The Qur'an:<br><span class="accent">Explained</span></h1>
        <p class="lead">An accessible one-volume commentary on the whole Qur'an, based on the teachings of the Prophet&nbsp;ﷺ and his Household&nbsp;(a.s.).</p>
        <div class="hero__cta">
          <a href="#support" class="btn btn--primary">Support the project</a>
          <a href="assets/sample.pdf" class="btn btn--ghost" download>Download sample</a>
        </div>
      </div>
      <div class="hero__visual">
        <img src="assets/book-cover.png" alt="The Qur'an: Explained — book cover" class="hero__cover" id="heroCover">
      </div>
    </div>
  </section>
</main>
```

- [ ] **Step 2: Add nav and hero CSS** — append to `styles.css`:

```css
/* --- Nav --- */
.nav {
  position: sticky; top: 0; z-index: 50;
  background: rgba(14, 39, 72, 0.92);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border-on-navy);
}
.nav__inner {
  display: flex; align-items: center; justify-content: space-between;
  padding-block: 14px;
}
.nav__brand {
  font-family: var(--font-display); font-size: 1.25rem; color: var(--cream);
  letter-spacing: 0.01em;
}
.nav__brand em { color: var(--brass); font-style: italic; }
.nav__cta { padding: 10px 20px; font-size: 0.9375rem; }
@media (max-width: 540px) {
  .nav__brand { font-size: 1.0625rem; }
  .nav__cta { padding: 8px 14px; font-size: 0.875rem; }
}

/* --- Hero --- */
.hero {
  position: relative;
  background: var(--navy);
  color: var(--cream);
  min-height: calc(100vh - 60px);
  display: flex; align-items: center;
  overflow: hidden;
  padding-block: clamp(80px, 12vw, 160px);
}
.hero__motif {
  position: absolute; inset: 0;
  background-image: url('assets/motif.svg');
  background-size: 160px 160px;
  opacity: 0.06;
  pointer-events: none;
}
.hero__inner {
  position: relative;
  display: grid; grid-template-columns: 1.2fr 1fr; gap: clamp(40px, 6vw, 80px);
  align-items: center;
}
@media (max-width: 880px) {
  .hero__inner { grid-template-columns: 1fr; text-align: center; }
  .hero__visual { order: -1; }
}
.hero__bismillah {
  font-family: var(--font-display); font-style: italic;
  color: var(--brass); font-size: 1rem; margin-bottom: 24px;
}
.hero h1 { margin-bottom: 24px; }
.hero h1 .accent { color: var(--brass); }
.hero .lead { max-width: 48ch; margin-inline: auto; margin-bottom: 36px; }
@media (min-width: 881px) { .hero .lead { margin-inline: 0; } }
.hero__cta { display: flex; gap: 16px; flex-wrap: wrap; }
@media (max-width: 880px) { .hero__cta { justify-content: center; } }
.hero__visual { display: flex; justify-content: center; perspective: 1200px; }
.hero__cover {
  max-width: 320px; width: 100%;
  filter: drop-shadow(0 30px 40px rgba(0,0,0,0.45));
  transform-style: preserve-3d;
  transition: transform 200ms ease-out;
  will-change: transform;
}
```

- [ ] **Step 3: Add hero tilt to `script.js`**

Replace the contents of `script.js` with:

```javascript
// Hero book-cover subtle 3D tilt on pointer move
(function heroTilt() {
  const cover = document.getElementById('heroCover');
  if (!cover) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  const hero = cover.closest('.hero');
  const maxTilt = 6; // degrees

  function onMove(e) {
    const rect = hero.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rotY = (x - 0.5) * maxTilt * 2;
    const rotX = (0.5 - y) * maxTilt * 2;
    cover.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.01)`;
  }
  function onLeave() {
    cover.style.transform = 'rotateX(0) rotateY(0) scale(1)';
  }

  hero.addEventListener('pointermove', onMove);
  hero.addEventListener('pointerleave', onLeave);
})();
```

- [ ] **Step 4: Browser check**

```bash
open index.html
```

Expected:
- Sticky navy bar at top with wordmark left, brass button right
- Hero fills viewport: headline "The Qur'an: Explained" (Explained in brass), lead paragraph, two CTAs
- Book cover right, gets a subtle 3D tilt as cursor moves over the hero
- On mobile (DevTools responsive mode, ~375px), layout stacks; cover moves above text; tilt disabled by touch
- Console clean, no 404s

- [ ] **Step 5: Commit**

```bash
git add index.html styles.css script.js
git commit -m "feat: sticky nav and hero section with book-cover tilt"
```

---

### Task 4: The Challenge + What-the-book-is sections

**Files:**
- Modify: `index.html` (add §3 and §4)
- Modify: `styles.css` (card grid, dual-spread visual)

- [ ] **Step 1: Add §3 (Challenge) and §4 (What the book is) markup after the hero**

```html
<section class="section challenge" id="challenge">
  <div class="container">
    <div class="section__head">
      <h2>The challenge we're addressing</h2>
      <p class="lead">English-speaking Shi'a Muslims lack a comprehensive, accessible commentary on the Qur'an rooted in the teachings of the Ahlulbayt. The gap is quiet, generational, and growing.</p>
    </div>
    <div class="cards cards--3">
      <article class="card">
        <div class="card__icon">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 5a2 2 0 0 1 2-2h8l4 4v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M14 3v4h4"/><path d="M8 13h8M8 17h6"/></svg>
        </div>
        <h3>No comprehensive tafsir in English</h3>
        <p>No single-volume commentary based on Ahlulbayt's teachings currently exists in accessible English.</p>
      </article>
      <article class="card">
        <div class="card__icon">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="3"/><path d="M4 21c0-4 3-7 8-7s8 3 8 7"/></svg>
        </div>
        <h3>200,000+ UK Shi'a Muslims underserved</h3>
        <p>Millions more globally lack resources reflecting their theological perspective and scholarly tradition.</p>
      </article>
      <article class="card">
        <div class="card__icon">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 7l9-4 9 4-9 4z"/><path d="M7 10v5c0 2 2 3 5 3s5-1 5-3v-5"/></svg>
        </div>
        <h3>Educational institutions rely on patchwork materials</h3>
        <p>Teachers and seminaries assemble resources from fragmented and often inconsistent sources.</p>
      </article>
      <article class="card">
        <div class="card__icon">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 21s-8-5-8-11a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6-8 11-8 11z"/></svg>
        </div>
        <h3>A generational disconnect</h3>
        <p>Young English-speaking Shi'a Muslims are increasingly cut off from reliable, accessible scholarship.</p>
      </article>
      <article class="card">
        <div class="card__icon">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
        </div>
        <h3>A spiritual need, urgent and real</h3>
        <p>Exposed to competing ideologies, youth need the intellectual tools to anchor and defend their faith.</p>
      </article>
    </div>
  </div>
</section>

<section class="section section--navy book" id="book">
  <div class="container">
    <div class="section__head section__head--centered">
      <h2>One page of Qur'an.<br><span class="accent">One page of commentary.</span></h2>
      <p class="lead">A unique dual-page design, structured so readers can read the Arabic and its commentary in direct tandem — clear, paced, and always in context.</p>
    </div>
    <div class="spread">
      <figure class="spread__panel">
        <img src="assets/spread-arabic.png" alt="Arabic Qur'anic text, page 42 of Sūrat al-Baqara" loading="lazy">
        <figcaption>Qur'an</figcaption>
      </figure>
      <div class="spread__divider" aria-hidden="true"></div>
      <figure class="spread__panel">
        <img src="assets/spread-commentary.png" alt="English translation and commentary for the facing Arabic page" loading="lazy">
        <figcaption>Commentary</figcaption>
      </figure>
    </div>
    <p class="spread__caption">Sample page — Sūrat al-Baqara</p>
    <div class="cards cards--2 book__features">
      <div class="feature">
        <h3>Clear, readable Arabic script</h3>
        <p>Each page equals one page of the Mushaf, preserving the rhythm of the text.</p>
      </div>
      <div class="feature">
        <h3>Refined English translation</h3>
        <p>Based on a modified Ali Quli Qara'i translation, chosen for fidelity and readability.</p>
      </div>
      <div class="feature">
        <h3>Deeper reflections from authoritative Shi'i tafsirs</h3>
        <p>Commentary synthesised from more than thirty classical and contemporary sources.</p>
      </div>
      <div class="feature">
        <h3>Every claim footnoted to primary sources</h3>
        <p>Readers can trace any reflection back to its source and conduct further study.</p>
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Append CSS for section heads, cards, and the spread**

```css
/* --- Section heads --- */
.section__head { max-width: 720px; margin-bottom: 56px; }
.section__head--centered { margin-inline: auto; text-align: center; }
.section__head h2 { margin-bottom: 16px; }
.section__head .lead { color: var(--muted); }
.section--navy .section__head .lead { color: rgba(251, 247, 238, 0.78); }
.accent { color: var(--brass); }

/* --- Card grid (used by Challenge §3 and Why Support §7) --- */
.cards { display: grid; gap: 24px; }
.cards--3 { grid-template-columns: repeat(3, 1fr); }
.cards--2 { grid-template-columns: repeat(2, 1fr); }
@media (max-width: 880px) { .cards--3 { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 560px) {
  .cards--3, .cards--2 { grid-template-columns: 1fr; }
}
.card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 32px 28px;
  transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease;
}
.card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); border-color: var(--brass); }
.card__icon {
  width: 48px; height: 48px;
  display: flex; align-items: center; justify-content: center;
  color: var(--brass); background: rgba(201, 162, 74, 0.1);
  border-radius: 8px; margin-bottom: 20px;
}
.card h3 { font-size: 1.25rem; margin-bottom: 10px; }
.card p { color: var(--muted); font-size: 0.9375rem; line-height: 1.55; }

/* --- Book spread (§4) --- */
.spread {
  display: grid; grid-template-columns: 1fr auto 1fr; gap: 24px;
  align-items: stretch; max-width: 960px; margin: 0 auto 16px;
}
.spread__panel {
  background: var(--cream); border-radius: 8px; padding: 24px;
  display: flex; flex-direction: column; align-items: center; gap: 16px;
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.35);
}
.spread__panel img { border-radius: 4px; max-height: 420px; width: auto; }
.spread__panel figcaption {
  font-family: var(--font-display); font-style: italic;
  color: var(--navy); font-size: 1.125rem;
}
.spread__divider { width: 1px; background: var(--border-on-navy); }
.spread__caption {
  text-align: center; font-family: var(--font-display); font-style: italic;
  color: rgba(251, 247, 238, 0.6); font-size: 0.9375rem; margin-bottom: 64px;
}
@media (max-width: 760px) {
  .spread { grid-template-columns: 1fr; }
  .spread__divider { display: none; }
}

/* --- Feature list (plain, no card border) --- */
.book__features { margin-top: 16px; }
.feature {
  padding: 24px 0;
  border-top: 1px solid var(--border-on-navy);
}
.feature h3 { color: var(--brass); font-size: 1.125rem; margin-bottom: 8px; font-weight: 500; }
.feature p { color: rgba(251, 247, 238, 0.8); font-size: 0.9375rem; }
```

- [ ] **Step 3: Browser check**

```bash
open index.html
```

Expected:
- §3 cream section: headline, lead, 3×2 grid (5 cards, last row has 2 centered or left-aligned — acceptable); hover lifts card and turns border brass
- §4 navy section: centered headline, dual-spread showing Arabic left and commentary right with caption underneath, four feature rows below
- Mobile: cards stack to 1 column ≤560px; spread stacks vertically ≤760px

- [ ] **Step 4: Commit**

```bash
git add index.html styles.css
git commit -m "feat: challenge section and dual-spread book showcase"
```

---

### Task 5: Progress & timeline section

**Files:**
- Modify: `index.html` (add §5)
- Modify: `styles.css` (progress ring + timeline styles)

- [ ] **Step 1: Add §5 markup after the §4 section**

```html
<section class="section progress" id="progress">
  <div class="container">
    <div class="section__head">
      <h2>Where we are right now</h2>
      <p class="lead">Half the Qur'an already translated. Editing, typesetting, and community outreach all proceed in parallel — not sequentially — so the manuscript and its audience arrive together.</p>
    </div>
    <div class="progress__grid">
      <div class="progress__ring-wrap">
        <svg class="progress-ring" viewBox="0 0 200 200" width="220" height="220" aria-hidden="true">
          <circle cx="100" cy="100" r="88" fill="none" stroke="var(--border)" stroke-width="10"/>
          <circle cx="100" cy="100" r="88" fill="none" stroke="var(--brass)" stroke-width="10"
                  stroke-linecap="round"
                  stroke-dasharray="553"
                  stroke-dashoffset="276.5"
                  transform="rotate(-90 100 100)"/>
        </svg>
        <div class="progress__ring-text">
          <strong>302 / 604</strong>
          <span>pages translated</span>
        </div>
        <p class="progress__verse">Translation through verse <strong>18:83</strong></p>
        <p class="progress__updated"><em>Last updated: 18 Apr 2026</em></p>
      </div>
      <div class="timeline">
        <h3 class="timeline__title">Phase 1 timeline</h3>
        <ol class="timeline__list">
          <li><span class="timeline__dot" data-stage="translation"></span><span class="timeline__stage">Translation</span><span class="timeline__dates">Apr&nbsp;–&nbsp;Sep&nbsp;2026</span></li>
          <li><span class="timeline__dot" data-stage="editing"></span><span class="timeline__stage">Editing</span><span class="timeline__dates">Jun&nbsp;–&nbsp;Oct&nbsp;2026</span></li>
          <li><span class="timeline__dot" data-stage="typesetting"></span><span class="timeline__stage">Typesetting</span><span class="timeline__dates">Sep&nbsp;–&nbsp;Nov&nbsp;2026</span></li>
          <li><span class="timeline__dot" data-stage="marketing"></span><span class="timeline__stage">Marketing &amp; promotion</span><span class="timeline__dates">Aug&nbsp;2026&nbsp;–&nbsp;Jan&nbsp;2027</span></li>
          <li class="timeline__launch"><span class="timeline__dot" data-stage="launch"></span><span class="timeline__stage">Launch</span><span class="timeline__dates">January&nbsp;2027</span></li>
        </ol>
      </div>
    </div>
    <div class="funds">
      <div class="funds__bar" aria-hidden="true"><div class="funds__fill" style="width:42%"></div></div>
      <div class="funds__labels">
        <p><strong>£25,000</strong> raised of <strong>£60,000</strong> &nbsp;·&nbsp; <span class="accent">42%</span></p>
        <p class="funds__gap">£35,000 still needed to fully fund the project.</p>
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Append CSS for the progress section**

```css
/* --- Progress --- */
.progress__grid {
  display: grid; grid-template-columns: auto 1fr; gap: 64px;
  align-items: center; margin-bottom: 72px;
}
@media (max-width: 760px) {
  .progress__grid { grid-template-columns: 1fr; gap: 48px; }
}
.progress__ring-wrap { position: relative; text-align: center; }
.progress-ring { display: block; margin: 0 auto; }
.progress__ring-text {
  position: absolute; top: 110px; left: 0; right: 0;
  display: flex; flex-direction: column; align-items: center;
}
.progress__ring-text strong {
  font-family: var(--font-display); font-size: 2.25rem; color: var(--navy);
}
.progress__ring-text span {
  font-size: 0.875rem; color: var(--muted); letter-spacing: 0.02em;
}
.progress__verse { margin-top: 24px; font-size: 1.0625rem; color: var(--ink); }
.progress__verse strong { font-family: var(--font-display); color: var(--brass); font-size: 1.125rem; }
.progress__updated { color: var(--muted); font-size: 0.875rem; margin-top: 4px; }

/* --- Timeline --- */
.timeline__title { font-size: 1.25rem; margin-bottom: 24px; }
.timeline__list { border-left: 2px solid var(--border); padding-left: 24px; }
.timeline__list li {
  display: grid; grid-template-columns: 1fr auto; gap: 16px;
  align-items: baseline; padding: 16px 0; position: relative;
  border-bottom: 1px solid var(--border);
}
.timeline__list li:last-child { border-bottom: none; }
.timeline__dot {
  position: absolute; left: -32px; top: 22px;
  width: 12px; height: 12px; border-radius: 50%;
  background: var(--brass); box-shadow: 0 0 0 4px var(--cream);
}
.timeline__stage { font-family: var(--font-display); font-size: 1.125rem; color: var(--navy); }
.timeline__dates { font-size: 0.9375rem; color: var(--muted); white-space: nowrap; }
.timeline__launch .timeline__stage { color: var(--brass); font-weight: 500; }
.timeline__launch .timeline__dot { width: 16px; height: 16px; left: -34px; }

/* --- Funds --- */
.funds {
  max-width: 760px; margin: 0 auto; padding: 32px;
  background: var(--white); border: 1px solid var(--border); border-radius: 8px;
}
.funds__bar {
  height: 12px; background: var(--border); border-radius: 6px; overflow: hidden;
  margin-bottom: 20px;
}
.funds__fill {
  height: 100%; background: linear-gradient(90deg, var(--brass), var(--brass-light));
  border-radius: 6px;
}
.funds__labels p { font-size: 1.0625rem; }
.funds__labels p strong { font-family: var(--font-display); font-size: 1.25rem; color: var(--navy); }
.funds__gap { color: var(--muted); margin-top: 4px; font-size: 0.9375rem; }
```

- [ ] **Step 3: Browser check**

```bash
open index.html
```

Expected:
- Cream section below the navy book section
- Circular progress ring showing roughly half-filled in brass, with "302 / 604" and "pages translated" inside
- Below ring: "Translation through verse 18:83" and "Last updated: 18 Apr 2026"
- Right column: timeline with five stages, dots on a vertical line, launch row highlighted brass
- Below grid: fund-raising bar at ~42% fill, text "£25,000 raised of £60,000 · 42%"
- Mobile: grid collapses, ring stacks above timeline

- [ ] **Step 4: Commit**

```bash
git add index.html styles.css
git commit -m "feat: progress ring, phase 1 timeline, and funding bar"
```

---

### Task 6: Team & scholarly foundation

**Files:**
- Modify: `index.html` (add §6)
- Modify: `styles.css` (team section styles)

- [ ] **Step 1: Add §6 markup after §5**

```html
<section class="section section--navy team" id="team">
  <div class="container">
    <div class="section__head">
      <h2>The team and its scholarly foundation</h2>
    </div>
    <div class="team__grid">
      <div class="team__intro">
        <h3>Principal translator</h3>
        <p><strong>Alexander Khaleeli</strong> — Hawza graduate with more than fifteen years of experience in Islamic translation and publishing; currently pursuing PhD studies at the University of Exeter.</p>
        <p>Supported by a team of translators and editors with years of experience in translation, research, and publication.</p>
      </div>
      <div class="team__tafsirs">
        <h3>Drawn from 30+ Shi'i tafsirs — including</h3>
        <ul class="tafsirs">
          <li><em>Tafsir al-Mizan</em><span>Allamah Tabataba'i</span></li>
          <li><em>Tafsir Nimuneh</em><span>Ayatullah Makarem Shirazi</span></li>
          <li><em>Tafsir Ala' al-Rahman</em><span>Ayatullah Jawad al-Balaghi</span></li>
          <li><em>Tafsir al-Tasnim</em><span>Ayatullah Jawadi Amoli</span></li>
          <li><em>Manshur-i Javid</em><span>Ayatullah Ja'far Sobhani</span></li>
          <li><em>Majma' al-Bayan</em><span>Shaykh al-Tabrisi</span></li>
          <li><em>Tafsir al-Safi</em><span>Fayd Kashani</span></li>
          <li><em>Tafsir Nur al-Thaqalayn</em><span>Shaykh al-Huwayzi</span></li>
          <li><em>Tafsir al-Burhan</em><span>Sayyid Hashim al-Bahrani</span></li>
          <li><em>Atyab al-Bayan</em><span>Sayyid 'Abd al-Husayn Tayyib</span></li>
        </ul>
      </div>
    </div>
    <div class="team__roles">
      <div class="role">
        <h4>Publication team</h4>
        <p>Translators, editors, and typesetters.</p>
      </div>
      <div class="role">
        <h4>Technical team</h4>
        <p>Experts in app development, data architecture, and digital marketing.</p>
      </div>
      <div class="role">
        <h4>Subject-matter experts</h4>
        <p>Scholars, public speakers, and community influencers.</p>
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Append CSS for the team section**

```css
/* --- Team --- */
.team__grid {
  display: grid; grid-template-columns: 1fr 1.2fr; gap: 64px;
  margin-bottom: 64px;
}
@media (max-width: 880px) { .team__grid { grid-template-columns: 1fr; gap: 48px; } }
.team__intro h3, .team__tafsirs h3 {
  font-size: 1rem; text-transform: uppercase; letter-spacing: 0.1em;
  color: var(--brass); margin-bottom: 20px; font-weight: 500; font-family: var(--font-body);
}
.team__intro p { margin-bottom: 16px; max-width: 40ch; }
.team__intro p strong { color: var(--brass); font-weight: 500; }
.tafsirs {
  display: grid; grid-template-columns: 1fr 1fr; gap: 20px 32px;
}
@media (max-width: 560px) { .tafsirs { grid-template-columns: 1fr; } }
.tafsirs li { display: flex; flex-direction: column; }
.tafsirs em {
  font-family: var(--font-display); font-size: 1.125rem; color: var(--cream);
}
.tafsirs span {
  font-size: 0.875rem; color: rgba(251, 247, 238, 0.6); margin-top: 2px;
}
.team__roles {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;
  padding-top: 48px; border-top: 1px solid var(--border-on-navy);
}
@media (max-width: 760px) { .team__roles { grid-template-columns: 1fr; } }
.role h4 {
  font-family: var(--font-display); font-size: 1.25rem; color: var(--brass);
  margin-bottom: 8px; font-weight: 500;
}
.role p { font-size: 0.9375rem; color: rgba(251, 247, 238, 0.8); }
```

- [ ] **Step 3: Browser check**

```bash
open index.html
```

Expected:
- Navy section with two-column layout: translator bio left, list of 10 tafsirs right (italic titles, muted authors)
- Below, three role cards side by side: Publication Team / Technical Team / Subject Matter Experts
- Mobile: everything stacks cleanly

- [ ] **Step 4: Commit**

```bash
git add index.html styles.css
git commit -m "feat: team and scholarly foundation section"
```

---

### Task 7: Why-Support + How-to-Support sections

**Files:**
- Modify: `index.html` (add §7 and §8)
- Modify: `styles.css` (donate cards)
- Modify: `script.js` (click-to-copy for bank details)

- [ ] **Step 1: Add §7 and §8 markup after §6**

```html
<section class="section why" id="why">
  <div class="container">
    <div class="section__head section__head--centered">
      <h2>Why support this project?</h2>
    </div>
    <div class="cards cards--3 why__cards">
      <article class="card">
        <div class="card__icon"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 3v7M12 10c-4 0-7 3-7 7 0 2 1 3 3 3h8c2 0 3-1 3-3 0-4-3-7-7-7z"/></svg></div>
        <h3>Sadaqa Jariya</h3>
        <p>Ongoing, continuous benefit — the most durable form of giving.</p>
      </article>
      <article class="card">
        <div class="card__icon"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="12,3 15,9 21,10 17,15 18,21 12,18 6,21 7,15 3,10 9,9"/></svg></div>
        <h3>First of its kind</h3>
        <p>Filling a genuine, identified gap in English-language scholarship.</p>
      </article>
      <article class="card">
        <div class="card__icon"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M8 21h8M12 18v3"/></svg></div>
        <h3>A digital ecosystem</h3>
        <p>Phases 2 and 3 — daily Qur'an challenge and app — sustain long-term engagement.</p>
      </article>
      <article class="card">
        <div class="card__icon"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 21l7-18 7 18M9 14h6"/></svg></div>
        <h3>An experienced team</h3>
        <p>A proven track record of delivery in Islamic translation and publishing.</p>
      </article>
      <article class="card">
        <div class="card__icon"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 12a8 8 0 0 1 14-5l2-2v6h-6l2-2a6 6 0 0 0-10 3M20 12a8 8 0 0 1-14 5l-2 2v-6h6l-2 2a6 6 0 0 0 10-3"/></svg></div>
        <h3>Sustainability</h3>
        <p>All revenue reinvested into free distribution and widening access.</p>
      </article>
    </div>
  </div>
</section>

<section class="section section--navy support" id="support">
  <div class="container">
    <div class="section__head section__head--centered">
      <h2>How to support</h2>
      <p class="lead">Donations are routed through our registered partner charity, <strong>Compassion for Humanity</strong>.</p>
    </div>
    <div class="support__grid">
      <article class="donate-card">
        <h3>Bank transfer</h3>
        <dl class="bank">
          <div><dt>Account name</dt><dd><button class="copy" data-copy="Compassion for Humanity">Compassion for Humanity</button></dd></div>
          <div><dt>Bank</dt><dd><button class="copy" data-copy="Lloyds Bank">Lloyds Bank</button></dd></div>
          <div><dt>Account no.</dt><dd><button class="copy" data-copy="21451960">21451960</button></dd></div>
          <div><dt>Sort code</dt><dd><button class="copy" data-copy="30-54-66">30-54-66</button></dd></div>
          <div><dt>Reference</dt><dd><button class="copy" data-copy="Tafsir Project">Tafsir Project</button></dd></div>
        </dl>
        <p class="donate-card__note"><em>Click any line to copy.</em></p>
      </article>
      <article class="donate-card">
        <h3>Online</h3>
        <p>Donate via our partner charity's online portal.</p>
        <a href="https://sad.qa/Qurancommentary" class="btn btn--primary" target="_blank" rel="noopener">Donate online</a>
      </article>
      <article class="donate-card">
        <h3>PayPal</h3>
        <p>Direct PayPal donation, suitable for international supporters.</p>
        <a href="https://www.paypal.com/donate/?hosted_button_id=RLCNCZCY9FR7C" class="btn btn--primary" target="_blank" rel="noopener">Donate via PayPal</a>
      </article>
      <article class="donate-card">
        <h3>Gift Aid</h3>
        <p>UK taxpayers — boost your donation by 25% at no extra cost.</p>
        <a href="https://compassionforhumanity.org.uk/gift_aid" class="btn btn--primary" target="_blank" rel="noopener">Claim Gift Aid</a>
      </article>
    </div>
    <p class="support__footnote">Compassion for Humanity &nbsp;·&nbsp; UK Registered Charity No.&nbsp;1194528 &nbsp;·&nbsp; Donations are Gift Aid eligible and tax-deductible for businesses.</p>
  </div>
</section>
```

- [ ] **Step 2: Append CSS for §7 and §8**

```css
/* --- Why support --- */
.why__cards .card h3 { color: var(--navy); }

/* --- How to support --- */
.support__grid {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px;
  margin-bottom: 32px;
}
@media (max-width: 760px) { .support__grid { grid-template-columns: 1fr; } }
.donate-card {
  background: var(--navy-light); border: 1px solid var(--border-on-navy);
  border-radius: 8px; padding: 32px;
  display: flex; flex-direction: column; gap: 16px;
  transition: transform 220ms ease, border-color 220ms ease;
}
.donate-card:hover { transform: translateY(-2px); border-color: var(--brass); }
.donate-card h3 { color: var(--brass); font-size: 1.375rem; }
.donate-card p { color: rgba(251, 247, 238, 0.85); font-size: 0.9375rem; flex: 1; }
.donate-card .btn { align-self: flex-start; }
.bank { display: flex; flex-direction: column; gap: 6px; }
.bank > div { display: grid; grid-template-columns: 120px 1fr; gap: 12px; align-items: baseline; }
.bank dt {
  font-size: 0.8125rem; color: rgba(251, 247, 238, 0.55);
  letter-spacing: 0.04em; text-transform: uppercase;
}
.bank dd { font-family: var(--font-mono); font-size: 0.9375rem; }
.bank button.copy {
  color: var(--cream); text-align: left;
  padding: 4px 6px; margin: -4px -6px; border-radius: 4px;
  transition: background 150ms ease;
  font-family: inherit;
}
.bank button.copy:hover { background: rgba(201, 162, 74, 0.15); }
.bank button.copy.copied { background: var(--brass); color: var(--navy); }
.donate-card__note {
  font-size: 0.8125rem; color: rgba(251, 247, 238, 0.5);
  margin-top: 4px;
}
.support__footnote {
  text-align: center; font-size: 0.875rem;
  color: rgba(251, 247, 238, 0.6); max-width: 720px;
  margin: 24px auto 0;
}
```

- [ ] **Step 3: Add click-to-copy handler to `script.js`**

Append to `script.js`:

```javascript
// Click-to-copy for bank details
(function copyDetails() {
  document.querySelectorAll('button.copy').forEach(btn => {
    btn.addEventListener('click', async () => {
      const value = btn.dataset.copy || btn.textContent.trim();
      try {
        await navigator.clipboard.writeText(value);
        btn.classList.add('copied');
        const original = btn.textContent;
        btn.textContent = 'Copied';
        setTimeout(() => {
          btn.classList.remove('copied');
          btn.textContent = original;
        }, 1400);
      } catch (err) {
        console.warn('Copy failed', err);
      }
    });
  });
})();
```

- [ ] **Step 4: Browser check**

```bash
open index.html
```

Expected:
- §7 cream "Why support": 5-card grid (3+2), same hover as Challenge section
- §8 navy "How to support": 2×2 grid of donate cards; Bank Transfer card has click-to-copy on each field (click "21451960" → briefly changes to "Copied" with brass background)
- Online / PayPal / Gift Aid cards each show a brass button linking out in a new tab
- Footnote centred below the grid

- [ ] **Step 5: Commit**

```bash
git add index.html styles.css script.js
git commit -m "feat: why-support grid and donation card block with click-to-copy"
```

---

### Task 8: Footer and scroll-reveal motion

**Files:**
- Modify: `index.html` (add footer)
- Modify: `styles.css` (footer + reveal classes)
- Modify: `script.js` (Intersection Observer reveals)

- [ ] **Step 1: Add footer markup after the final `</section>`**

```html
<footer class="footer">
  <div class="container footer__inner">
    <p class="footer__bismillah"><em>In His name, the Most High</em></p>
    <p class="footer__small">
      © 2026 The Qur'an: Explained &nbsp;·&nbsp; Compassion for Humanity &nbsp;·&nbsp; UK Registered Charity No. 1194528
    </p>
  </div>
</footer>
```

- [ ] **Step 2: Append CSS for footer and reveal animation**

```css
/* --- Footer --- */
.footer { background: var(--cream); padding-block: 56px; border-top: 1px solid var(--border); }
.footer__inner { text-align: center; }
.footer__bismillah {
  font-family: var(--font-display); font-size: 1.25rem;
  color: var(--navy); margin-bottom: 12px;
}
.footer__small { font-size: 0.8125rem; color: var(--muted); }

/* --- Reveal on scroll --- */
.reveal {
  opacity: 0; transform: translateY(16px);
  transition: opacity 500ms ease, transform 500ms ease;
  will-change: opacity, transform;
}
.reveal.is-visible { opacity: 1; transform: none; }
@media (prefers-reduced-motion: reduce) {
  .reveal { opacity: 1; transform: none; transition: none; }
}
```

- [ ] **Step 3: Append scroll-reveal to `script.js`**

```javascript
// Fade-and-rise reveals
(function scrollReveal() {
  const targets = document.querySelectorAll('.section, .hero__text, .hero__visual');
  targets.forEach(t => t.classList.add('reveal'));

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) {
    targets.forEach(t => t.classList.add('is-visible'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  targets.forEach(t => io.observe(t));
})();
```

- [ ] **Step 4: Browser check**

```bash
open index.html
```

Expected:
- Footer appears at bottom: "In His name, the Most High" in serif italic, small print beneath
- Scrolling the page: each section fades in from slightly below as it enters the viewport (~500ms)
- Setting DevTools "emulate prefers-reduced-motion: reduce" → all reveals disappear, everything visible immediately

- [ ] **Step 5: Commit**

```bash
git add index.html styles.css script.js
git commit -m "feat: footer and scroll-reveal motion with reduced-motion support"
```

---

### Task 9: Accessibility and responsive audit

**Files:**
- Modify: `index.html`, `styles.css` (fixes based on audit findings)

- [ ] **Step 1: Keyboard navigation audit**

Open page, press Tab repeatedly from page load. Verify tab order: nav CTA → hero CTAs → download link → donate CTAs → bank copy buttons → external donate links.

Every interactive element should show a visible brass focus ring. If any element is skipped or focus is invisible, add `tabindex="0"` where missing and confirm the `:focus-visible` rule covers it.

- [ ] **Step 2: Reduced-motion audit**

In DevTools → Rendering → "Emulate CSS media feature prefers-reduced-motion: reduce". Reload. Confirm:

- Hero book cover does not tilt when hovered
- Section reveals are absent (everything visible from the start)
- Card and button hover effects degrade to colour-only (no translate)

- [ ] **Step 3: Contrast audit**

Use DevTools Lighthouse or a tool like https://webaim.org/resources/contrastchecker/ to spot-check:
- Cream background + ink text (`#1A1A1A` on `#FBF7EE`) — AAA
- Muted text on cream (`#5A5A5A` on `#FBF7EE`) — must be ≥4.5:1; if it fails, darken `--muted` to `#4A4A4A`
- Brass on navy (`#C9A24A` on `#0E2748`) — must be ≥4.5:1
- Dimmed text on navy (`rgba(251,247,238,0.6)` on `#0E2748`) — must be ≥4.5:1; if it fails, raise the alpha to 0.7

Apply any adjustments needed and commit them.

- [ ] **Step 4: Responsive audit**

Test the page in DevTools responsive mode at widths 375, 540, 768, 1024, 1440. Check:

- No horizontal scroll at any width
- All grids collapse correctly (challenge cards → 2 cols at 880, 1 col at 560; book features → 1 col at 560; spread → 1 col at 760; progress grid → 1 col at 760; team grid → 1 col at 880; support grid → 1 col at 760)
- Nav CTA shrinks to fit without wrapping at 375px
- Book cover shrinks and sits above hero text at 880px
- Font scaling (`clamp()`) remains legible at small widths

Adjust any layout issues found.

- [ ] **Step 5: Semantic / SEO check**

Inspect HTML in DevTools Elements panel:
- Exactly one `<h1>` (inside hero)
- Each section has an `id` so nav anchors work
- All images have meaningful `alt` attributes or `aria-hidden` when decorative
- `<meta name="description">` is in place (set in Task 1)
- Document language is `en`

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "a11y: contrast fixes and responsive polish from audit"
```

If no changes were needed, skip the commit.

---

### Task 10: Deploy to Cloudflare Pages

**Files:**
- Add remote: GitHub
- Deploy target: `quran-explained.pages.dev`

**Context:** The user's Cloudflare API token (full zone / DNS / Pages / SSL access) and account ID are saved in `~/.claude/projects/-Users-alex-khaleeli/memory/credentials_cloudflare.md`. Read it for the values.

- [ ] **Step 1: Create a public GitHub repo and push**

Authenticate gh CLI if needed (`gh auth status`). Then:

```bash
cd "/Users/alex_khaleeli/Claude Code/TQE Marketing"
gh repo create tqe-landing --public --source=. --remote=origin --description="The Qur'an: Explained — donor landing page"
git push -u origin main
```

Expected: `https://github.com/akhaleeli/tqe-landing` (or similar) exists and reflects the current tree.

- [ ] **Step 2: Read Cloudflare credentials**

Read `~/.claude/projects/-Users-alex-khaleeli/memory/credentials_cloudflare.md` to get `CF_API_TOKEN` and `CF_ACCOUNT_ID`. Export them:

```bash
export CF_API_TOKEN="<token-from-memory>"
export CF_ACCOUNT_ID="<account-id-from-memory>"
```

- [ ] **Step 3: Create the Cloudflare Pages project connected to the GitHub repo**

```bash
curl -sS -X POST "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/pages/projects" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "quran-explained",
    "production_branch": "main",
    "source": {
      "type": "github",
      "config": {
        "owner": "akhaleeli",
        "repo_name": "tqe-landing",
        "production_branch": "main",
        "pr_comments_enabled": false,
        "deployments_enabled": true,
        "production_deployment_enabled": true,
        "preview_deployment_setting": "all",
        "preview_branch_includes": ["*"],
        "preview_branch_excludes": ["main"]
      }
    },
    "build_config": {
      "build_command": "",
      "destination_dir": ""
    }
  }' | tee /tmp/cf-pages-create.json
```

If this returns an error about the GitHub integration (e.g. the repo isn't visible to Cloudflare), fall back: in the Cloudflare dashboard → Pages → Create → Connect to Git → authorize `akhaleeli/tqe-landing`. Configure: production branch `main`, build command empty, output directory `/`.

- [ ] **Step 4: Trigger the first deployment**

If the project was created via API, the first deploy starts automatically on connection. Verify status:

```bash
curl -sS "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/pages/projects/quran-explained/deployments" \
  -H "Authorization: Bearer $CF_API_TOKEN" | jq '.result[0] | {id: .id, status: .latest_stage.name, url: .url}'
```

Wait until `status` shows `success`. Deploy should take 30–60 seconds for a static site this size.

- [ ] **Step 5: Live verification**

```bash
open https://quran-explained.pages.dev
```

Expected on the live URL:
- All sections render identically to local
- Book cover, spread images, and sample PDF all load (no 404s in DevTools Network)
- Sample download works: click "Download sample" → the 48-page PDF downloads
- Copy-to-clipboard works on HTTPS (some browsers block on file://)
- Mobile layout correct at narrow widths (test with DevTools)
- No mixed-content warnings, no console errors

- [ ] **Step 6: Final commit and push**

If any last-minute tweaks were needed during live verification:

```bash
git add -A
git commit -m "deploy: production polish for quran-explained.pages.dev"
git push
```

---

## Update workflow (post-launch, for reference)

To bump progress weekly:

1. Edit `index.html`:
   - `stroke-dashoffset="276.5"` — recompute: `553 - (553 × percent/100)`
   - `<strong>302 / 604</strong>` — new page count
   - `Translation through verse <strong>18:83</strong>` — new verse
   - `Last updated: 18 Apr 2026` — today's date
2. `git commit -am "progress: through verse X:Y (Y of 604 pages)" && git push`
3. Cloudflare Pages redeploys automatically (~30s).

---

## Self-review

**Spec coverage:**
- §1 Sticky nav — Task 3 ✓
- §2 Hero (headline, subhead, 2 CTAs, book cover with tilt, motif) — Task 1 (motif), Task 3 ✓
- §3 Challenge (2×3 card grid, icons, hover) — Task 4 ✓
- §4 What the book is (dual-spread, 4 features) — Task 4 ✓
- §5 Progress (ring, timeline, funds bar) — Task 5 ✓
- §6 Team (translator bio + supporting team line, 10 tafsirs, 3 roles) — Task 6 ✓
- §7 Why support (5-card grid) — Task 7 ✓
- §8 How to support (bank w/ click-to-copy, 3 external) — Task 7 ✓
- §9 Footer — Task 8 ✓
- Motion (reveals, tilt, reduced-motion) — Tasks 3, 7, 8 ✓
- Accessibility pass — Task 9 ✓
- Deployment to `quran-explained.pages.dev` — Task 10 ✓
- Assets preparation (crop, rename, motif, favicon) — Task 1 ✓

**Placeholder scan:** no "TBD" / "handle edge cases" / "similar to earlier"; all code blocks complete.

**Type consistency:** CSS token names (`--navy`, `--brass`, `--cream`, etc.) used identically across tasks. Class names (`.card`, `.section--navy`, `.btn--primary`) consistent. `data-copy` attribute used in Task 7 markup and Task 7 script. Image filenames (`book-cover.png`, `spread-arabic.png`, `spread-commentary.png`, `sample.pdf`) match between Task 1 and all referencing markup.
