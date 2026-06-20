const GAP_MS = 120;
const DAYS = [1, 2, 3];
const SPEEDS = [1, 1.25, 1.5, 2];
const SUBSCRIBE_URL = "https://quraniverse-subscribe.akh-apps.workers.dev";

const settings = { reciter: "husary", voice: "v2", ar: true, en: true, cmt: true, order: "verses" };

let current = null;
let queue = [];
let total = 0;
let qi = 0;
let playing = false;
let sequence = true;
let activeOff = 0;
let pendingSeek = null;
let speedIdx = 0;
const audio = new Audio();

const $ = (s) => document.querySelector(s);
const speed = () => SPEEDS[speedIdx];
const fmt = (s) => {
  s = Math.max(0, Math.floor(s || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

/* ---- step builders (resolve to the currently-selected variant) ---- */
const arStep = (i) => { const a = current.verses[i].ar_audio[settings.reciter]; return { mode: "ar", vi: i, src: a.audio, dur: a.dur }; };
const enStep = (i) => { const a = current.verses[i].en_audio[settings.voice]; return { mode: "en", vi: i, src: a.audio, dur: a.dur }; };
const noteStep = (i) => { const n = current.notes[i]; return { mode: "note", ni: i, src: n.audio, dur: n.dur }; };
const introStep = () => ({ mode: "intro", src: current.intro.audio, dur: current.intro.dur });

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
  $("#dsurah").textContent = current.surah;
  $("#dref").textContent = `· Day ${current.day}`;

  const ol = $("#verses");
  ol.innerHTML = "";
  current.verses.forEach((v, i) => {
    const li = document.createElement("li");
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
    panel.appendChild(art);
  });

  document.querySelectorAll(".dtab").forEach((t) =>
    t.classList.toggle("dtab--active", +t.dataset.n === n)
  );
  buildQueue();
  updateBar();
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
  audio.src = step.src;
  audio.playbackRate = speed();
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
  if (audio.src && qi >= 0 && qi < queue.length && audio.currentTime > 0) {
    playing = true; audio.play().catch(() => {}); setPlayBtn(); // resume
  } else { playAll(); }
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
  audio.playbackRate = speed();
  $("#speed").textContent = `${speed()}×`;
}

/* ---- settings ---- */
function applySettings() {
  settings.reciter = $("#setReciter").value;
  settings.voice = $("#setVoice").value;
  settings.ar = $("#tAr").checked;
  settings.en = $("#tEn").checked;
  settings.cmt = $("#tCmt").checked;
  settings.order = $("#setOrder").value;
  stop();
  buildQueue();
  updateBar();
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
  $("#playAll").addEventListener("click", togglePlayAll);
  $("#speed").addEventListener("click", cycleSpeed);
  $("#seek").addEventListener("click", (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    seekTo((e.clientX - r.left) / r.width);
  });
  $("#gear").addEventListener("click", () => $("#settings").toggleAttribute("hidden"));
  // defaults
  $("#setReciter").value = settings.reciter;
  $("#setVoice").value = settings.voice;
  $("#setOrder").value = settings.order;
  ["setReciter", "setVoice", "setOrder", "tAr", "tEn", "tCmt"].forEach((id) =>
    $("#" + id).addEventListener("change", applySettings)
  );
  $("#subForm").addEventListener("submit", subscribe);
  loadDay(1);
}

init();
