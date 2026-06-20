const GAP_MS = 120;
const DAYS = [1, 2, 3];
const SPEEDS = [1, 1.25, 1.5, 2];
const SUBSCRIBE_URL = "/subscribe"; // replaced with the Worker URL in Task 11

let current = null;
let queue = [];
let total = 0;
let qi = 0;
let playing = false;
let speedIdx = 0;
let pendingSeek = null;
const audio = new Audio();

const $ = (s) => document.querySelector(s);
const speed = () => SPEEDS[speedIdx];
const fmt = (s) => {
  s = Math.max(0, Math.floor(s || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

async function loadDay(n) {
  const data = await (await fetch(`data/day${n}.json`)).json();
  current = data;
  stop();
  $("#dsurah").textContent = data.surah;
  $("#dref").textContent = `· Day ${data.day}`;

  const ol = $("#verses");
  ol.innerHTML = "";
  data.verses.forEach((v, i) => {
    const li = document.createElement("li");
    li.className = "verse";
    li.dataset.i = i;
    li.dataset.ref = v.ref;
    li.innerHTML =
      `<div class="verse__ar">${v.ar}</div>` +
      `<div class="verse__en">${v.en}</div>` +
      `<div class="verse__ref">${v.ref}</div>`;
    li.addEventListener("click", () => playFrom(i));
    ol.appendChild(li);
  });

  const panel = $("#notes");
  panel.innerHTML = '<h2 class="notes__head">Commentary</h2>';
  data.notes.forEach((nt, i) => {
    const art = document.createElement("article");
    art.className = "note";
    art.dataset.ni = i;
    if (nt.ref) art.dataset.ref = nt.ref;
    const ref = nt.ref ? `<span class="note__ref">${nt.ref}</span>` : "";
    const src = nt.sources && nt.sources.length
      ? `<p class="note__sources">Sources: ${nt.sources.join(" · ")}</p>` : "";
    art.innerHTML =
      `<h3>${nt.title}${ref}</h3><p>${nt.text}</p>${src}` +
      `<button class="note__play" type="button">▶ Play</button>`;
    art.querySelector(".note__play").addEventListener("click", () => playNote(i));
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

function buildQueue() {
  queue = [{ src: current.intro.audio, mode: "intro", dur: current.intro.dur }];
  current.verses.forEach((v, i) => {
    queue.push({ src: v.ar_audio, vi: i, mode: "ar", dur: v.ar_dur });
    queue.push({ src: v.en_audio, vi: i, mode: "en", dur: v.en_dur });
  });
  current.notes.forEach((nt, i) => {
    queue.push({ src: nt.audio, ni: i, mode: "note", dur: nt.dur });
  });
  let off = 0;
  queue.forEach((s) => { s.off = off; off += s.dur; });
  total = off;
}

function clearHL() {
  document.querySelectorAll(".verse").forEach((e) =>
    e.classList.remove("is-active", "is-speaking-en")
  );
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
    if (el) {
      el.classList.add("is-active");
      if (step.mode === "en") el.classList.add("is-speaking-en");
    }
  }
  if (el) el.scrollIntoView({ block: "center", behavior: "smooth" });
}

function elapsed() {
  const step = queue[qi];
  return (step ? step.off : 0) + (audio.currentTime || 0);
}

function updateBar() {
  const e = playing || audio.currentTime ? elapsed() : (queue[qi] ? queue[qi].off : 0);
  $("#fill").style.width = total ? `${(e / total) * 100}%` : "0%";
  $("#time").textContent = `${fmt(e)} / ${fmt(total)}`;
}

function playStep() {
  if (qi >= queue.length) {
    playing = false;
    clearHL();
    setPlayBtn();
    updateBar();
    return;
  }
  const step = queue[qi];
  highlight(step);
  audio.src = step.src;
  audio.playbackRate = speed();
  if (pendingSeek != null) {
    const within = pendingSeek;
    pendingSeek = null;
    const onmeta = () => {
      try { audio.currentTime = within; } catch (e) {}
      audio.removeEventListener("loadedmetadata", onmeta);
    };
    audio.addEventListener("loadedmetadata", onmeta);
  }
  audio.play().catch(() => {});
  setPlayBtn();
}

function stop() {
  playing = false;
  audio.pause();
  qi = 0;
  pendingSeek = null;
  clearHL();
  setPlayBtn();
}

function setPlayBtn() {
  const b = $("#playAll");
  if (b) b.textContent = playing ? "⏸" : "▶";
}

function togglePlayAll() {
  if (playing) {
    audio.pause();
    playing = false;
    setPlayBtn();
    return;
  }
  if (queue.length && qi < queue.length && audio.src) {
    playing = true; // resume
    audio.play().catch(() => {});
    setPlayBtn();
  } else {
    playAll();
  }
}

audio.addEventListener("ended", () => {
  qi++;
  if (!playing) return;
  setTimeout(playStep, GAP_MS);
});
audio.addEventListener("timeupdate", updateBar);

function playAll() {
  qi = 0;
  playing = true;
  playStep();
}

function playFrom(i) {
  qi = queue.findIndex((s) => s.vi === i && s.mode === "ar");
  playing = true;
  playStep();
}

function playNote(i) {
  qi = queue.findIndex((s) => s.mode === "note" && s.ni === i);
  playing = true;
  playStep();
}

function seekTo(ratio) {
  if (!total) return;
  const target = Math.min(total - 0.05, Math.max(0, ratio * total));
  const k = queue.findIndex((s) => target >= s.off && target < s.off + s.dur);
  qi = k < 0 ? queue.length - 1 : k;
  pendingSeek = target - queue[qi].off;
  playing = true;
  playStep();
}

function cycleSpeed() {
  speedIdx = (speedIdx + 1) % SPEEDS.length;
  audio.playbackRate = speed();
  $("#speed").textContent = `${speed()}×`;
}

async function subscribe(e) {
  e.preventDefault();
  const email = $("#subEmail").value;
  $("#subMsg").textContent = "…";
  try {
    const r = await fetch(SUBSCRIBE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, source: "daily" }),
    });
    $("#subMsg").textContent = r.ok
      ? "Thank you — you're on the list."
      : "Something went wrong. Please try again.";
    if (r.ok) $("#subForm").reset();
  } catch {
    $("#subMsg").textContent = "Something went wrong. Please try again.";
  }
}

function init() {
  const tabs = $("#dtabs");
  DAYS.forEach((n) => {
    const b = document.createElement("button");
    b.className = "dtab";
    b.dataset.n = n;
    b.textContent = `Day ${n}`;
    b.addEventListener("click", () => loadDay(n));
    tabs.appendChild(b);
  });
  $("#playAll").addEventListener("click", togglePlayAll);
  $("#speed").addEventListener("click", cycleSpeed);
  $("#seek").addEventListener("click", (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    seekTo((e.clientX - r.left) / r.width);
  });
  $("#subForm").addEventListener("submit", subscribe);
  loadDay(1);
}

init();
