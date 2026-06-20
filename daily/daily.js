const GAP_MS = 200;
const DAYS = [1, 2, 3];
const SUBSCRIBE_URL = "/subscribe"; // replaced with the Worker URL in Task 11

let current = null;
let queue = [];
let qi = 0;
let playing = false;
const audio = new Audio();

const $ = (s) => document.querySelector(s);

async function loadDay(n) {
  const data = await (await fetch(`data/day${n}.json`)).json();
  current = data;
  stop();
  $("#dsurah").textContent = data.surah;
  $("#dref").textContent = `· Day ${data.day}`;
  $("#cmtTitle").textContent = data.commentary.title;
  $("#cmtText").textContent = data.commentary.text;
  const ol = $("#verses");
  ol.innerHTML = "";
  data.verses.forEach((v, i) => {
    const li = document.createElement("li");
    li.className = "verse";
    li.dataset.i = i;
    li.innerHTML =
      `<div class="verse__ar">${v.ar}</div>` +
      `<div class="verse__en">${v.en}</div>` +
      `<div class="verse__ref">${v.ref}</div>`;
    li.addEventListener("click", () => playFrom(i));
    ol.appendChild(li);
  });
  document.querySelectorAll(".dtab").forEach((t) =>
    t.classList.toggle("dtab--active", +t.dataset.n === n)
  );
}

function buildQueue() {
  queue = [];
  current.verses.forEach((v, i) => {
    queue.push({ src: v.ar_audio, vi: i, mode: "ar" });
    queue.push({ src: v.en_audio, vi: i, mode: "en" });
  });
  queue.push({ src: current.commentary.audio, vi: -1, mode: "cmt" });
}

function clearHL() {
  document.querySelectorAll(".verse").forEach((e) =>
    e.classList.remove("is-active", "is-speaking-en")
  );
  $("#commentary").classList.remove("is-active");
}

function highlight(step) {
  clearHL();
  if (step.mode === "cmt") {
    $("#commentary").classList.add("is-active");
    $("#commentary").scrollIntoView({ block: "center", behavior: "smooth" });
    return;
  }
  const el = document.querySelector(`.verse[data-i="${step.vi}"]`);
  el.classList.add("is-active");
  if (step.mode === "en") el.classList.add("is-speaking-en");
  el.scrollIntoView({ block: "center", behavior: "smooth" });
}

function playStep() {
  if (qi >= queue.length) {
    playing = false;
    clearHL();
    setPlayBtn();
    return;
  }
  const step = queue[qi];
  highlight(step);
  audio.src = step.src;
  audio.play().catch(() => {});
  setPlayBtn();
}

function stop() {
  playing = false;
  audio.pause();
  clearHL();
  setPlayBtn();
}

function setPlayBtn() {
  const b = $("#playAll");
  if (b) b.textContent = playing ? "⏸ Pause" : "▶ Play page";
}

function togglePlayAll() {
  if (playing) {
    audio.pause();
    playing = false;
    setPlayBtn();
    return;
  }
  if (queue.length && qi < queue.length && audio.src) {
    playing = true; // resume mid-page
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

function playAll() {
  buildQueue();
  qi = 0;
  playing = true;
  playStep();
}

function playFrom(i) {
  buildQueue();
  qi = queue.findIndex((s) => s.vi === i);
  playing = true;
  playStep();
}

function playCommentary() {
  buildQueue();
  qi = queue.length - 1;
  playing = true;
  playStep();
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
  $("#playCmt").addEventListener("click", playCommentary);
  $("#subForm").addEventListener("submit", subscribe);
  loadDay(1);
}

init();
