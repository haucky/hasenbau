const STORE_KEY = "hasenbau.v2";
const LEGACY_KEY = "hasenbau.v1";
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

// unlocks: [{ date, id, level }] – Ebene 1 schaltet der Hase frei (ein neuer Gang pro Tag),
// jede weitere Ebene der Abstieg „Tiefer hinab“ (einmal pro Tag, in einem beliebigen Gang).
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(STORE_KEY));
    if (s && Array.isArray(s.unlocks)) return { offset: 0, ...s };
    const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY));
    if (legacy && Array.isArray(legacy.history)) {
      return { offset: legacy.offset || 0, unlocks: legacy.history.map((h) => ({ date: h.date, id: h.id, level: 1 })) };
    }
  } catch {}
  return { unlocks: [], offset: 0 };
}

let state = load();
const save = () => localStorage.setItem(STORE_KEY, JSON.stringify(state));

function isoDate(d) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const now = () => new Date(Date.now() + state.offset * DAY_MS);
const today = () => isoDate(now());

const foundTopics = () => state.unlocks.filter((u) => u.level === 1);
const todaysTopic = () => foundTopics().find((u) => u.date === today());
const todaysDescent = () => state.unlocks.find((u) => u.level > 1 && u.date === today());
const depthOf = (id) => Math.max(0, ...state.unlocks.filter((u) => u.id === id).map((u) => u.level));
const gangNumber = (id) => foundTopics().findIndex((u) => u.id === id) + 1;

/* ---------- Gänge ---------- */

// Die Gänge liegen einzeln in content/hoehlen/ und werden erst geladen,
// wenn sie freigeschaltet sind. index.json gibt nur die Reihenfolge vor.
const order = fetch("content/index.json")
  .then((r) => r.json())
  .then((d) => d.hoehlen);

const topicCache = new Map();
function loadTopic(id) {
  if (!topicCache.has(id)) {
    topicCache.set(
      id,
      fetch(`content/hoehlen/${id}.json`).then((r) => {
        if (!r.ok) throw new Error(`Gang ${id} fehlt`);
        return r.json();
      })
    );
  }
  return topicCache.get(id).catch((err) => {
    topicCache.delete(id);
    throw err;
  });
}

// Ein Gang wird erst „gefunden“, wenn man dem Hasen folgt.
async function claimToday() {
  const existing = todaysTopic();
  if (existing) return existing.id;
  const ids = await order;
  const next = ids.find((id) => depthOf(id) === 0);
  if (!next) return null;
  state.unlocks.push({ date: today(), id: next, level: 1 });
  save();
  return next;
}

function descend(id) {
  if (todaysDescent()) return false;
  state.unlocks.push({ date: today(), id, level: depthOf(id) + 1 });
  save();
  return true;
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
  hint.textContent = todaysTopic() ? "Zurück in den Bau." : "Folge dem weißen Hasen.";
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

  // Laden läuft parallel zum Fall in den Bau
  const rendered = claimToday()
    .then((id) => (id ? renderTopic(id) : renderEnd()))
    .catch(() =>
      renderMessage("Verschüttet", "Der Bau ist gerade nicht erreichbar.", "Ist das Gerät offline? Versuche es gleich noch einmal.")
    );
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

  await rendered;
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

const sep = () => el("span", { className: "sep", textContent: "·" });

const RABBIT_GLYPH = `<svg viewBox="0 0 26 26" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round"><ellipse cx="11" cy="18" rx="7" ry="5"/><circle cx="17" cy="12.5" r="3.6"/><path d="M15.5 9.5 q-2 -6 0 -8 q1.6 3 1.6 8 M17.6 9.2 q1 -6 3.6 -7 q0 3.5 -2 7.5"/><circle cx="4" cy="17" r="1.4"/></g></svg>`;

function renderMessage(meta, title, lead) {
  $("#impulse").replaceChildren(
    el("p", { className: "meta", textContent: meta }),
    el("h1", { textContent: title }),
    el("p", { className: "lead", textContent: lead })
  );
  if (demoMode) $("#impulse").append(demoControls());
}

function renderEnd() {
  renderMessage(
    "Ende des Baus",
    "Neue Gänge gibt es – vorerst – keine.",
    "Du hast alle Gänge gefunden, die es bisher gibt. In deinen Gängen kannst du aber weiter jeden Tag eine Ebene tiefer steigen."
  );
}

function sourceItem(s) {
  if (!s.url) return el("li", { textContent: s.text });
  return el("li", {}, el("a", { href: s.url, target: "_blank", rel: "noopener", textContent: s.text }));
}

function levelSection(lv, index) {
  return el(
    "section",
    { className: "level", id: `ebene-${index + 1}` },
    el("p", { className: "level-label", textContent: `Ebene ${index + 1} · ${lv.name}` }),
    el("h2", { textContent: lv.heading }),
    lv.lead && el("p", { className: "lead", textContent: lv.lead }),
    ...lv.body.map((t) => el("p", { className: "text", textContent: t }))
  );
}

async function descentControl(topic, depth) {
  const total = topic.levels.length;
  if (depth >= total) {
    return el("p", { className: "descent-note", textContent: "Du bist am Grund dieses Gangs angekommen." });
  }
  const used = todaysDescent();
  if (!used) {
    const next = topic.levels[depth];
    const btn = el("button", { className: "descend", type: "button" });
    btn.append(
      el("span", { textContent: "Tiefer hinab" }),
      el("span", { className: "descend-sub", textContent: `Ebene ${depth + 1} · ${next.name}` }),
      el("span", { className: "shaft" })
    );
    btn.addEventListener("click", async () => {
      if (!descend(topic.id)) return;
      await renderTopic(topic.id, { focus: depth + 1, animate: true });
    });
    return btn;
  }
  if (used.id === topic.id) {
    return el("p", { className: "descent-note", textContent: "Für heute bist du hier tiefer gestiegen. Morgen geht es weiter hinab." });
  }
  const other = await loadTopic(used.id).catch(() => null);
  const where = other ? `in „${other.title}“` : "in einem anderen Gang";
  return el("p", {
    className: "descent-note",
    textContent: `Heute bist du schon ${where} tiefer gestiegen. Morgen kannst du hier weiter hinab.`
  });
}

// Zeigt einen Gang mit allen bisher erreichten Ebenen. focus scrollt zu einer Ebene.
async function renderTopic(id, { focus = null, animate = false } = {}) {
  let topic;
  try {
    topic = await loadTopic(id);
  } catch {
    return renderMessage(
      "Verschüttet",
      "Dieser Gang ist gerade nicht erreichbar.",
      "Er konnte nicht geladen werden. Ist das Gerät offline? Versuche es gleich noch einmal."
    );
  }

  const depth = Math.max(1, depthOf(id));
  const levels = topic.levels.slice(0, depth);
  const found = foundTopics().find((u) => u.id === id);
  const isToday = found?.date === today();

  const meta = el("p", { className: "meta" });
  meta.append(`Gang ${gangNumber(id)}`, sep(), topic.field, sep(), `Ebene ${depth} von ${topic.levels.length}`);
  if (found && !isToday) meta.append(sep(), `gefunden am ${fmtShort.format(parseIso(found.date))}`);

  const first = levels[0];
  const sources = levels.flatMap((lv) => lv.sources || []);

  const coda = el("div", { className: "coda" });
  coda.innerHTML = RABBIT_GLYPH;
  coda.append(isToday ? "Morgen wartet ein neuer Gang." : "Aus deinen Gängen.");

  const article = $("#impulse");
  article.replaceChildren(
    meta,
    el("h1", { textContent: topic.title }),
    el("p", { className: "lead", textContent: first.lead }),
    ...first.body.map((t) => el("p", { className: "text", textContent: t })),
    ...levels.slice(1).map((lv, i) => levelSection(lv, i + 1)),
    await descentControl(topic, depth),
    sources.length &&
      el(
        "aside",
        { className: "sources" },
        el("p", { className: "label", textContent: "Quellen & Weiterlesen" }),
        el("ul", {}, ...sources.map(sourceItem))
      ),
    coda
  );
  if (demoMode) article.append(demoControls());

  if (focus && focus > 1) {
    const target = document.getElementById(`ebene-${focus}`);
    if (target) {
      if (animate) target.classList.add("is-new");
      requestAnimationFrame(() =>
        target.scrollIntoView({ behavior: animate && !reducedMotion ? "smooth" : "auto", block: "start" })
      );
    }
  }
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
    state = { unlocks: [], offset: 0 };
    save();
    goGarden(true);
  });
  return el("div", { className: "demo" }, next, reset);
}

/* ---------- Deine Gänge ---------- */

function depthBars(depth, total) {
  const bars = el("span", { className: "depth-bars" });
  bars.setAttribute("aria-label", `Ebene ${depth} von ${total}`);
  for (let i = 0; i < total; i++) bars.append(el("i", { className: i < depth ? "on" : "" }));
  return bars;
}

async function renderHistory() {
  const list = $("#history-list");
  const status = $("#history-status");
  const found = foundTopics();

  if (!found.length) {
    status.textContent = "";
    list.replaceChildren(el("li", { className: "empty", textContent: "Noch keine Gänge. Folge zuerst dem Hasen." }));
    return;
  }

  const used = todaysDescent();
  if (used) {
    const t = await loadTopic(used.id).catch(() => null);
    status.textContent = t ? `Heute bist du schon in „${t.title}“ tiefer gestiegen.` : "Heute bist du schon tiefer gestiegen.";
  } else {
    status.textContent = "Heute kannst du noch in einem Gang eine Ebene tiefer steigen.";
  }

  // Zuletzt besuchte Gänge zuerst
  const lastActivity = (id) => state.unlocks.reduce((idx, u, i) => (u.id === id ? i : idx), -1);
  const entries = [...found].sort((a, b) => lastActivity(b.id) - lastActivity(a.id));
  const topics = await Promise.all(entries.map((e) => loadTopic(e.id).catch(() => null)));

  list.replaceChildren();
  entries.forEach((entry, i) => {
    const topic = topics[i];
    if (!topic) return;
    const depth = depthOf(entry.id);
    const total = topic.levels.length;
    const btn = el(
      "button",
      { type: "button" },
      el("span", { className: "depth", textContent: gangNumber(entry.id) }),
      el("span", { className: "h-title", textContent: topic.title }),
      el(
        "span",
        { className: "h-meta" },
        depthBars(depth, total),
        `${topic.field} · gefunden am ${fmtShort.format(parseIso(entry.date))}`
      )
    );
    btn.addEventListener("click", async () => {
      await renderTopic(entry.id, { focus: depth });
      show(reader);
      history.pushState({ view: "gang", id: entry.id }, "", `#gang/${entry.id}`);
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

async function goToday() {
  const entry = todaysTopic();
  if (!entry) return goGarden();
  await renderTopic(entry.id);
  show(reader);
  history.pushState({ view: "today" }, "", "#heute");
}

async function goHistory() {
  await renderHistory();
  show(historyView);
  history.pushState({ view: "history" }, "", "#gaenge");
}

document.addEventListener("click", (e) => {
  const target = e.target.closest("[data-go]");
  if (!target) return;
  ({ garden: () => goGarden(), today: goToday, history: goHistory })[target.dataset.go]();
});

window.addEventListener("popstate", async (e) => {
  const s = e.state || { view: "garden" };
  if (s.view === "history") {
    await renderHistory();
    show(historyView);
  } else if (s.view === "today" && todaysTopic()) {
    await renderTopic(todaysTopic().id);
    show(reader);
  } else if (s.view === "gang" && depthOf(s.id) > 0) {
    await renderTopic(s.id, { focus: depthOf(s.id) });
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
