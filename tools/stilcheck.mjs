// Prüft die Gänge auf typische Muster maschinell klingender Texte (siehe content/STIL.md).
// Aufruf: node tools/stilcheck.mjs [id …]
import { readFileSync } from "node:fs";

const root = new URL("../content/", import.meta.url);
const { hoehlen } = JSON.parse(readFileSync(new URL("index.json", root), "utf8"));
const only = process.argv.slice(2);

const PHRASES = [
  "faszinierend", "spannend", "bemerkenswert", "verblüffend", "erstaunlich", "eintauchen", "Reise",
  "darüber hinaus", "zusammenfassend", "letztendlich", "in der Tat", "es ist wichtig", "unterstreicht",
  "zeugt von", "verdeutlicht", "Fest steht", "Die Pointe", "Kurz gesagt", "Mit anderen Worten",
  "eine offene Frage", "bleibt offen", "Experten", "Schlüssel zu", "nicht zuletzt", "vielschichtig"
];

const sentences = (t) => t.split(/(?<=[.!?…])\s+(?=[„A-ZÄÖÜ0-9])/).filter((s) => s.trim());
const words = (s) => s.split(/\s+/).filter(Boolean).length;

let total = 0;
const report = [];
for (const id of hoehlen) {
  if (only.length && !only.includes(id)) continue;
  const topic = JSON.parse(readFileSync(new URL(`hoehlen/${id}.json`, root), "utf8"));
  topic.levels.forEach((lv, i) => {
    const paras = [lv.lead, ...lv.body].filter(Boolean);
    const text = paras.join("\n");
    const issues = [];

    const dashes = (text.match(/ – /g) || []).length;
    if (dashes > paras.length) issues.push(`${dashes} Gedankenstriche`);

    const neg = text.match(/\b(nicht|kein\w*)\b[^.;:?!]{0,80}, sondern\b/g) || [];
    if (neg.length) issues.push(`„nicht/kein … sondern“ ×${neg.length}`);

    for (const p of PHRASES) if (new RegExp(`(^|[^\\p{L}])${p}($|[^\\p{L}])`, "iu").test(text)) issues.push(`Phrase „${p}“`);

    const qs = (text.match(/\?/g) || []).length;
    if (qs > 2) issues.push(`${qs} Fragezeichen`);

    // Kalenderpointe: sehr kurzer Schlusssatz eines Absatzes
    const kicker = paras.filter((p) => {
      const s = sentences(p);
      return s.length > 1 && words(s[s.length - 1]) <= 7;
    }).length;
    if (kicker > 1) issues.push(`${kicker} Absätze enden mit Kurzsatz`);

    // Satzlängen-Varianz
    const lens = sentences(text).map(words);
    const mean = lens.reduce((a, b) => a + b, 0) / lens.length;
    const sd = Math.sqrt(lens.reduce((a, b) => a + (b - mean) ** 2, 0) / lens.length);
    if (lens.length > 5 && sd < 6) issues.push(`gleichförmige Satzlängen (σ=${sd.toFixed(1)})`);

    const wc = words(text);
    if (wc < 180) issues.push(`nur ${wc} Wörter`);

    if (issues.length) report.push(`${id} · Ebene ${i + 1}: ${issues.join("; ")}`);
    total += issues.length;
  });
}

console.log(report.join("\n") || "Keine Auffälligkeiten.");
console.log(`\n${total} Hinweise.`);
