const GAP_MS = 120;
const DAYS = [1, 2, 3];
const SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2];
const SPEED_BASE = 1.25; // narration (English + commentary) baseline: "1x" plays at 1.25x
const SUBSCRIBE_URL = "https://quraniverse-subscribe.akh-apps.workers.dev";

const settings = { reciter: "husary", voice: "v2", cvoice: "v2", ar: true, en: true, cmt: true, order: "verses" };

let current = null;
let noteEls = [];
let queue = [];
let total = 0;
let qi = 0;
let playing = false;
let sequence = true;
let activeOff = 0;
let pendingSeek = null;
let speedIdx = 1; // default label "1x"
let curMode = "ar";
const audio = new Audio();

const $ = (s) => document.querySelector(s);
const speed = () => SPEEDS[speedIdx]; // displayed label
// Actual playbackRate: recitation at the label rate; narration boosted by SPEED_BASE.
const rateFor = (mode) => SPEEDS[speedIdx] * (mode === "ar" ? 1 : SPEED_BASE);
const fmt = (s) => {
  s = Math.max(0, Math.floor(s || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

/* ---- step builders (resolve to the currently-selected variant) ---- */
const arStep = (i) => { const a = current.verses[i].ar_audio[settings.reciter]; return { mode: "ar", vi: i, src: a.audio, dur: a.dur }; };
const enStep = (i) => { const a = current.verses[i].en_audio[settings.voice]; return { mode: "en", vi: i, src: a.audio, dur: a.dur }; };
const noteStep = (i) => { const a = current.notes[i].audio[settings.cvoice]; return { mode: "note", ni: i, src: a.audio, dur: a.dur }; };
const introStep = () => { const a = current.intro[settings.cvoice]; return { mode: "intro", src: a.audio, dur: a.dur }; };

function buildQueue() {
  const q = [introStep()];
  if (settings.order === "verses") {
    current.verses.forEach((v, i) => {
      if (settings.ar) q.push(arStep(i));
      if (settings.en) q.push(enStep(i));
    });
    if (settings.cmt) current.notes.forEach((n, i) => q.push(noteStep(i)));
  } else {
    if (settings.cmt) current.notes.forEach((n, i) => { if (n.ref === null) q.push(noteStep(i)); });
    current.verses.forEach((v, i) => {
      if (settings.ar) q.push(arStep(i));
      if (settings.en) q.push(enStep(i));
      if (settings.cmt) current.notes.forEach((n, j) => { if (n.ref === v.ref) q.push(noteStep(j)); });
    });
  }
  let off = 0;
  q.forEach((s) => { s.off = off; off += s.dur; });
  queue = q;
  total = off;
}

/* ---- rendering ---- */
async function loadDay(n) {
  current = await (await fetch(`data/day${n}.json`)).json();
  stop();
  $("#dsurah").textContent = `Sūrat ${current.surah}`;
  $("#dref").textContent = `· Verses ${current.range[0]}–${current.range[1]}`;

  const ol = $("#verses");
  ol.innerHTML = "";
  current.verses.forEach((v, i) => {
    const li = document.createElement("div");
    li.className = "verse";
    li.dataset.i = i;
    li.dataset.ref = v.ref;
    li.innerHTML =
      `<div class="verse__ar" data-play="ar" title="Play recitation">${v.ar}</div>` +
      `<div class="verse__en" data-play="en" title="Play translation">${v.en}</div>` +
      `<div class="verse__ref">${v.ref}</div>`;
    li.querySelector('[data-play="ar"]').addEventListener("click", () => solo(arStep(i)));
    li.querySelector('[data-play="en"]').addEventListener("click", () => solo(enStep(i)));
    ol.appendChild(li);
  });

  const panel = $("#notes");
  panel.innerHTML = '<h2 class="notes__head">Commentary</h2>';
  noteEls = [];
  current.notes.forEach((nt, i) => {
    const art = document.createElement("article");
    art.className = "note";
    art.dataset.ni = i;
    if (nt.ref) art.dataset.ref = nt.ref;
    const ref = nt.ref ? `<span class="note__ref">${nt.ref}</span>` : "";
    const src = nt.sources && nt.sources.length
      ? `<p class="note__sources">Sources: ${nt.sources.join(" · ")}</p>` : "";
    art.innerHTML = `<h3>${nt.title}${ref}</h3><p>${nt.text}</p>${src}`;
    art.addEventListener("click", () => solo(noteStep(i)));
    if (nt.ref) {
      const linked = () => document.querySelector(`.verse[data-ref="${nt.ref}"]`);
      art.addEventListener("mouseenter", () => linked() && linked().classList.add("is-linked"));
      art.addEventListener("mouseleave", () => linked() && linked().classList.remove("is-linked"));
    }
    noteEls.push(art);
    panel.appendChild(art);
  });

  document.querySelectorAll(".dtab").forEach((t) =>
    t.classList.toggle("dtab--active", +t.dataset.n === n)
  );
  buildQueue();
  updateBar();
  layoutNotes();
}

// On mobile + interleaved order, move note cards inline between the verses they
// follow (matching the audio order). Otherwise keep them in the commentary panel.
function layoutNotes() {
  const ol = $("#verses");
  const panel = $("#notes");
  const inline = settings.order === "interleave" &&
    window.matchMedia("(max-width: 999px)").matches;
  if (inline) {
    panel.classList.add("is-hidden");
    current.notes.forEach((nt, i) => {
      const el = noteEls[i];
      if (nt.ref === null) {
        ol.insertBefore(el, ol.firstChild);
      } else {
        const v = ol.querySelector(`.verse[data-ref="${nt.ref}"]`);
        if (v) v.after(el); else ol.appendChild(el);
      }
    });
  } else {
    panel.classList.remove("is-hidden");
    noteEls.forEach((el) => panel.appendChild(el)); // restore in order
  }
}

/* ---- playback ---- */
function clearHL() {
  document.querySelectorAll(".verse").forEach((e) => e.classList.remove("is-active", "is-speaking-en"));
  document.querySelectorAll(".note").forEach((e) => e.classList.remove("is-active"));
}

function highlight(step) {
  clearHL();
  let el = null;
  if (step.mode === "note") {
    el = document.querySelector(`.note[data-ni="${step.ni}"]`);
    if (el) el.classList.add("is-active");
  } else if (step.mode === "ar" || step.mode === "en") {
    el = document.querySelector(`.verse[data-i="${step.vi}"]`);
    if (el) { el.classList.add("is-active"); if (step.mode === "en") el.classList.add("is-speaking-en"); }
  }
  if (el) el.scrollIntoView({ block: "center", behavior: "smooth" });
}

function playObj(step, off) {
  highlight(step);
  activeOff = off;
  curMode = step.mode;
  audio.src = step.src;
  audio.playbackRate = rateFor(step.mode);
  if (pendingSeek != null) {
    const within = pendingSeek; pendingSeek = null;
    const onmeta = () => { try { audio.currentTime = within; } catch (e) {} audio.removeEventListener("loadedmetadata", onmeta); };
    audio.addEventListener("loadedmetadata", onmeta);
  }
  audio.play().catch(() => {});
  setPlayBtn();
}

function playStep() {
  if (qi < 0 || qi >= queue.length) { playing = false; clearHL(); setPlayBtn(); updateBar(); return; }
  playObj(queue[qi], queue[qi].off);
}

function solo(step) {
  sequence = false;
  playing = true;
  const idx = queue.findIndex((s) => s.mode === step.mode && s.vi === step.vi && s.ni === step.ni);
  qi = idx;
  playObj(step, idx >= 0 ? queue[idx].off : 0);
}

function stop() {
  playing = false; sequence = true; qi = 0; activeOff = 0; pendingSeek = null;
  audio.pause();
  try { audio.currentTime = 0; } catch (e) {} // reset position so next Play starts fresh
  clearHL(); setPlayBtn(); updateBar();
}

function setPlayBtn() { const b = $("#playAll"); if (b) b.textContent = playing ? "⏸" : "▶"; }

function elapsed() { return activeOff + (audio.currentTime || 0); }
function updateBar() {
  const e = Math.min(elapsed(), total);
  $("#fill").style.width = total ? `${(e / total) * 100}%` : "0%";
  $("#time").textContent = `${fmt(e)} / ${fmt(total)}`;
}

audio.addEventListener("timeupdate", updateBar);
audio.addEventListener("ended", () => {
  if (!playing) return;
  if (!sequence) { playing = false; setPlayBtn(); return; }
  qi++;
  if (qi >= queue.length) { playing = false; clearHL(); setPlayBtn(); return; }
  setTimeout(playStep, GAP_MS);
});

function togglePlayAll() {
  if (playing) { audio.pause(); playing = false; setPlayBtn(); return; }
  if (qi >= 0 && qi < queue.length && audio.src && audio.currentTime > 0 && !audio.ended) {
    // resume a paused clip and continue the whole page from here
    sequence = true; playing = true; audio.play().catch(() => {}); setPlayBtn();
  } else if (qi >= 0 && audio.src && audio.ended) {
    // a clicked bit just finished — continue the page from the next item
    sequence = true; playing = true; qi++;
    if (qi < queue.length) playStep();
    else { playing = false; clearHL(); setPlayBtn(); }
  } else {
    playAll();
  }
}
function playAll() { sequence = true; qi = 0; playing = true; playStep(); }

function seekTo(ratio) {
  if (!total) return;
  const target = Math.min(total - 0.05, Math.max(0, ratio * total));
  const k = queue.findIndex((s) => target >= s.off && target < s.off + s.dur);
  sequence = true; qi = k < 0 ? queue.length - 1 : k;
  pendingSeek = target - queue[qi].off;
  playing = true; playStep();
}

function cycleSpeed() {
  speedIdx = (speedIdx + 1) % SPEEDS.length;
  audio.playbackRate = rateFor(curMode);
  $("#speed").textContent = `${speed()}×`;
  saveSettings();
}

/* ---- settings ---- */
function applySettings() {
  settings.reciter = $("#setReciter").value;
  settings.voice = $("#setVoice").value;
  settings.cvoice = $("#setCvoice").value;
  settings.ar = $("#tAr").checked;
  settings.en = $("#tEn").checked;
  settings.cmt = $("#tCmt").checked;
  settings.order = $("#setOrder").value;
  stop();
  buildQueue();
  updateBar();
  layoutNotes();
  saveSettings();
}

const PREFS_KEY = "qv-daily-prefs-v2";
function saveSettings() {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify({ ...settings, speedIdx })); } catch (e) {}
}
function loadSettings() {
  try {
    const s = JSON.parse(localStorage.getItem(PREFS_KEY) || "{}");
    for (const k of ["reciter", "voice", "cvoice", "ar", "en", "cmt", "order"])
      if (s[k] !== undefined) settings[k] = s[k];
    if (typeof s.speedIdx === "number" && SPEEDS[s.speedIdx] !== undefined) speedIdx = s.speedIdx;
  } catch (e) {}
}

/* ---- subscribe ---- */
async function subscribe(e) {
  e.preventDefault();
  const email = $("#subEmail").value;
  $("#subMsg").textContent = "…";
  try {
    const r = await fetch(SUBSCRIBE_URL, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, source: "daily" }),
    });
    $("#subMsg").textContent = r.ok ? "Thank you — you're on the list." : "Something went wrong. Please try again.";
    if (r.ok) $("#subForm").reset();
  } catch { $("#subMsg").textContent = "Something went wrong. Please try again."; }
}

function init() {
  const tabs = $("#dtabs");
  DAYS.forEach((n) => {
    const b = document.createElement("button");
    b.className = "dtab"; b.dataset.n = n; b.textContent = `Day ${n}`;
    b.addEventListener("click", () => loadDay(n));
    tabs.appendChild(b);
  });
  $("#heroStart").addEventListener("click", () => {
    if (!playing) playAll();
    $(".dbar").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  $("#playAll").addEventListener("click", togglePlayAll);
  $("#speed").addEventListener("click", cycleSpeed);
  $("#seek").addEventListener("click", (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    seekTo((e.clientX - r.left) / r.width);
  });
  $("#gear").addEventListener("click", () => {
    const s = $("#settings");
    s.toggleAttribute("hidden");
    $("#gear").classList.toggle("is-open", !s.hasAttribute("hidden"));
  });
  // restore saved preferences and reflect them in the controls
  loadSettings();
  $("#setReciter").value = settings.reciter;
  $("#setVoice").value = settings.voice;
  $("#setCvoice").value = settings.cvoice;
  $("#setOrder").value = settings.order;
  $("#tAr").checked = settings.ar;
  $("#tEn").checked = settings.en;
  $("#tCmt").checked = settings.cmt;
  $("#speed").textContent = `${speed()}×`;
  ["setReciter", "setVoice", "setCvoice", "setOrder", "tAr", "tEn", "tCmt"].forEach((id) =>
    $("#" + id).addEventListener("change", applySettings)
  );
  $("#subForm").addEventListener("submit", subscribe);
  window.matchMedia("(max-width: 999px)").addEventListener("change", layoutNotes);
  loadDay(1);
}

init();
