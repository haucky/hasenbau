import { IMPULSES } from "./impulses.js";

const STORE_KEY = "hasenbau.v1";
const DAY_MS = 864e5;

const $ = (sel) => document.querySelector(sel);
const garden = $("#garden");
const reader = $("#reader");
const historyView = $("#history");
const rabbit = $("#rabbit");
const rabbitBody = rabbit.querySelector(".r-body");
const hint = $("#hint");
const fall = $("#fall");

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const demoMode = new URLSearchParams(location.search).has("demo");

/* ---------- Zustand ---------- */

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(STORE_KEY));
    if (s && Array.isArray(s.history)) return { offset: 0, ...s };
  } catch {}
  return { history: [], offset: 0 };
}

let state = load();
const save = () => localStorage.setItem(STORE_KEY, JSON.stringify(state));

function isoDate(d) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const now = () => new Date(Date.now() + state.offset * DAY_MS);
const today = () => isoDate(now());
const byId = (id) => IMPULSES.find((i) => i.id === id);
const todaysEntry = () => state.history.find((h) => h.date === today());

// Der Impuls wird erst „abgerufen“, wenn man dem Hasen folgt.
function claimToday() {
  const existing = todaysEntry();
  if (existing) return existing;
  const next = IMPULSES.find((i) => !state.history.some((h) => h.id === i.id));
  if (!next) return null;
  const entry = { date: today(), id: next.id };
  state.history.push(entry);
  save();
  return entry;
}

const fmtLong = new Intl.DateTimeFormat("de-DE", { weekday: "long", day: "numeric", month: "long" });
const fmtShort = new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "long", year: "numeric" });
const parseIso = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

/* ---------- Views ---------- */

function show(view) {
  for (const v of [garden, reader, historyView]) v.classList.toggle("is-active", v === view);
  if (view !== garden) view.scrollTop = 0;
}

/* ---------- Garten & Hase ---------- */

let introTimers = [];
let hopAnimation = null;
const DIVE_END = "translate(70px, 104px) rotate(62deg)";

function clearIntro() {
  introTimers.forEach(clearTimeout);
  introTimers = [];
  hopAnimation?.cancel();
  hopAnimation = null;
  garden.classList.remove("is-wiggling", "is-looking");
}

function openBurrow() {
  rabbit.style.transform = DIVE_END;
  garden.classList.add("is-open");
  hint.textContent = todaysEntry() ? "Zurück in den Bau." : "Folge dem weißen Hasen.";
}

function hop() {
  hopAnimation = rabbit.animate(
    [
      { transform: "translate(0, 0) rotate(0)", offset: 0 },
      { transform: "translate(-2px, 1px) rotate(-4deg)", offset: 0.14 },
      { transform: "translate(32px, -36px) rotate(6deg)", offset: 0.45, easing: "ease-in" },
      { transform: "translate(62px, -5px) rotate(30deg)", offset: 0.72, easing: "ease-in" },
      { transform: DIVE_END, offset: 1 }
    ],
    { duration: 1150, easing: "cubic-bezier(.3,.1,.5,1)", fill: "forwards" }
  );
  rabbitBody.animate(
    [
      { transform: "scale(1, 1)" },
      { transform: "scale(1.08, .86)", offset: 0.14 },
      { transform: "scale(.94, 1.1)", offset: 0.3 },
      { transform: "scale(1, 1)", offset: 0.5 },
      { transform: "scale(.9, 1.12)", offset: 1 }
    ],
    { duration: 1150 }
  );
  hopAnimation.onfinish = () => {
    hopAnimation.commitStyles?.();
    hopAnimation.cancel();
    hopAnimation = null;
    openBurrow();
  };
}

function playIntro() {
  clearIntro();
  garden.classList.remove("is-open");
  hint.textContent = "";
  rabbit.style.transform = "";
  $("#garden-date").textContent = fmtLong.format(now());

  if (reducedMotion) return openBurrow();

  const at = (ms, fn) => introTimers.push(setTimeout(fn, ms));
  at(700, () => garden.classList.add("is-wiggling"));
  at(2200, () => garden.classList.remove("is-wiggling"));
  at(2300, () => garden.classList.add("is-looking"));
  at(3900, () => garden.classList.remove("is-looking"));
  at(4000, () => garden.classList.add("is-wiggling"));
  at(4900, () => garden.classList.remove("is-wiggling"));
  at(5000, hop);
}

function holeCenter() {
  const r = $("#hole ellipse:nth-of-type(2)").getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

let entering = false;

async function enter() {
  if (entering) return;
  entering = true;
  clearIntro();
  openBurrow();

  const entry = claimToday();
  const { x, y } = holeCenter();
  const reach = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  fall.style.left = `${x}px`;
  fall.style.top = `${y}px`;

  if (!reducedMotion) {
    await fall.animate(
      [{ transform: "scale(0)" }, { transform: `scale(${(reach * 2.1) / 40})` }],
      { duration: 750, easing: "cubic-bezier(.6,0,.8,.4)", fill: "forwards" }
    ).finished;
  }

  renderImpulse(entry, true);
  reader.classList.add("is-falling");
  show(reader);
  history.pushState({ view: "today" }, "", "#heute");

  if (!reducedMotion) {
    await fall.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 700, easing: "ease-out" }).finished;
    fall.getAnimations().forEach((a) => a.cancel());
    setTimeout(() => reader.classList.remove("is-falling"), 1400);
  }
  entering = false;
}

$("#enter").addEventListener("click", enter);

/* ---------- Lesen ---------- */

const el = (tag, props = {}, ...children) => {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children.filter(Boolean));
  return node;
};

const RABBIT_GLYPH = `<svg viewBox="0 0 26 26" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round"><ellipse cx="11" cy="18" rx="7" ry="5"/><circle cx="17" cy="12.5" r="3.6"/><path d="M15.5 9.5 q-2 -6 0 -8 q1.6 3 1.6 8 M17.6 9.2 q1 -6 3.6 -7 q0 3.5 -2 7.5"/><circle cx="4" cy="17" r="1.4"/></g></svg>`;

function renderImpulse(entry, isToday) {
  const article = $("#impulse");
  article.replaceChildren();

  if (!entry) {
    article.append(
      el("p", { className: "meta", textContent: "Ende des Gangs" }),
      el("h1", { textContent: "Hier endet der Bau – vorerst." }),
      el("p", {
        className: "lead",
        textContent: "Du hast alle Gänge dieses Prototyps gefunden. In der Historie kannst du jeden noch einmal betreten."
      })
    );
    return;
  }

  const impulse = byId(entry.id);
  const depth = state.history.findIndex((h) => h.id === entry.id) + 1;

  const meta = el("p", { className: "meta" });
  meta.append(`${depth}. Ebene`, el("span", { className: "sep", textContent: "·" }), impulse.field);
  if (!isToday) {
    meta.append(el("span", { className: "sep", textContent: "·" }), fmtShort.format(parseIso(entry.date)));
  }

  const deeper = el(
    "section",
    { className: "deeper", id: "deeper" },
    el("p", { className: "deeper-label", textContent: "Eine Ebene tiefer" }),
    ...impulse.deeper.map((t) => el("p", { className: "text", textContent: t }))
  );

  const descend = el("button", { className: "descend", type: "button" });
  descend.append(el("span", { textContent: "Tiefer hinab" }), el("span", { className: "shaft" }));
  descend.setAttribute("aria-controls", "deeper");
  descend.setAttribute("aria-expanded", "false");
  descend.addEventListener("click", () => {
    deeper.classList.add("is-open");
    descend.remove();
    deeper.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
  });

  const coda = el("div", { className: "coda" });
  coda.innerHTML = RABBIT_GLYPH;
  coda.append(isToday ? "Morgen führt der Gang tiefer." : "Aus deinen Gängen.");

  article.append(
    meta,
    el("h1", { textContent: impulse.title }),
    el("p", { className: "lead", textContent: impulse.lead }),
    ...impulse.body.map((t) => el("p", { className: "text", textContent: t })),
    descend,
    deeper,
    el(
      "aside",
      { className: "question" },
      el("p", { className: "label", textContent: "Zum Weiterdenken" }),
      el("p", { textContent: impulse.question })
    ),
    el(
      "aside",
      { className: "sources" },
      el("p", { className: "label", textContent: "Weiterlesen" }),
      el("ul", {}, ...impulse.sources.map((s) => el("li", { textContent: s })))
    ),
    coda
  );

  if (demoMode) article.append(demoControls());
}

function demoControls() {
  const next = el("button", { type: "button", textContent: "Demo: nächster Tag" });
  next.addEventListener("click", () => {
    state.offset += 1;
    save();
    goGarden(true);
  });
  const reset = el("button", { type: "button", textContent: "Zurücksetzen" });
  reset.addEventListener("click", () => {
    state = { history: [], offset: 0 };
    save();
    goGarden(true);
  });
  return el("div", { className: "demo" }, next, reset);
}

/* ---------- Historie ---------- */

function renderHistory() {
  const list = $("#history-list");
  list.replaceChildren();
  if (!state.history.length) {
    list.append(el("li", { className: "empty", textContent: "Noch keine Gänge. Folge zuerst dem Hasen." }));
    return;
  }
  [...state.history].reverse().forEach((entry) => {
    const impulse = byId(entry.id);
    if (!impulse) return;
    const depth = state.history.indexOf(entry) + 1;
    const btn = el(
      "button",
      { type: "button" },
      el("span", { className: "depth", textContent: depth }),
      el("span", { className: "h-title", textContent: impulse.title }),
      el("span", { className: "h-meta", textContent: `${impulse.field} · ${fmtShort.format(parseIso(entry.date))}` })
    );
    btn.addEventListener("click", () => {
      renderImpulse(entry, entry.date === today());
      show(reader);
      history.pushState({ view: "past", id: entry.id }, "", `#gang/${entry.id}`);
    });
    list.append(el("li", {}, btn));
  });
}

/* ---------- Navigation ---------- */

function goGarden(replay = false) {
  show(garden);
  history.pushState({ view: "garden" }, "", location.pathname + location.search);
  replay ? playIntro() : openBurrow();
}

function goToday() {
  const entry = todaysEntry();
  if (!entry) return goGarden();
  renderImpulse(entry, true);
  show(reader);
  history.pushState({ view: "today" }, "", "#heute");
}

function goHistory() {
  renderHistory();
  show(historyView);
  history.pushState({ view: "history" }, "", "#historie");
}

document.addEventListener("click", (e) => {
  const target = e.target.closest("[data-go]");
  if (!target) return;
  ({ garden: () => goGarden(), today: goToday, history: goHistory })[target.dataset.go]();
});

window.addEventListener("popstate", (e) => {
  const s = e.state || { view: "garden" };
  if (s.view === "history") {
    renderHistory();
    show(historyView);
  } else if (s.view === "today" && todaysEntry()) {
    renderImpulse(todaysEntry(), true);
    show(reader);
  } else if (s.view === "past" && state.history.some((h) => h.id === s.id)) {
    const entry = state.history.find((h) => h.id === s.id);
    renderImpulse(entry, entry.date === today());
    show(reader);
  } else {
    show(garden);
    openBurrow();
  }
});

/* ---------- Start ---------- */

// Jeder Besuch beginnt im Garten – das Ritual ist Teil der App.
history.replaceState({ view: "garden" }, "", location.pathname + location.search);
playIntro();

if ("serviceWorker" in navigator) {
  addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}
