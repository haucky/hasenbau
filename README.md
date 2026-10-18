# Hasenbau

**Live:** https://haucky.github.io/hasenbau/ (GitHub Pages)

Gemacht für iPhone und Android. Auf größeren Bildschirmen bleibt die App eine schmale Handy-Spalte.

Eine kleine PWA: jeden Tag **ein** Gedanke aus Wissenschaft und Kunst – und jeden Tag ein Stück tiefer.

Beim Öffnen hockt ein weißer Hase am Rand seines Baus, wackelt mit den Ohren und verschwindet. Wer ihm folgt (Tipp auf den Bau), fällt in den Text des Tages.

## Starten

Keine Abhängigkeiten, kein Build. Irgendeinen statischen Server im Projektordner starten, z. B.:

```sh
npx http-server -c-1 .
# oder
python3 -m http.server
```

Dann `http://localhost:8080` öffnen. Service Worker und Installation funktionieren auf `localhost` oder über HTTPS (z. B. GitHub Pages).

**Demo-Modus:** `?demo` an die URL hängen – unter dem Text erscheinen „nächster Tag“ und „Zurücksetzen“, um den Tagesablauf durchzuspielen.

## Aufbau

| Datei | Inhalt |
| --- | --- |
| `index.html` | Garten-Szene (SVG-Hase und Bau), Leseansicht, Historie |
| `css/style.css` | Gestaltung, Hasen-Animation (Ohren, Blinzeln, Schnuppern) |
| `js/app.js` | Tageslogik, Sprung in den Bau, Rendering, Navigation |
| `content/index.json` | Reihenfolge der Hasenhöhlen – von zugänglich nach tief |
| `content/hoehlen/*.json` | Die 20 Gänge, je eine Datei mit vier Ebenen (Text, Frage, Quellen) |
| `content/RECHERCHE.md` | Recherche-Protokoll: was geprüft wurde, Belege, offene Punkte |
| `sw.js`, `manifest.webmanifest` | Offline-Fähigkeit und Installierbarkeit |

## Logik

- **Jeden Tag ein neuer Gang:** Wer dem Hasen folgt, findet das Thema des Tages und liest Ebene 1 (Einstieg). Wer einen Tag auslässt, verpasst nichts – es kommt einfach der nächste Gang in der Reihenfolge.
- **Einmal pro Tag tiefer:** Zusätzlich kann man pro Tag in *einem* gefundenen Gang (auch im heutigen) eine Ebene tiefer steigen: 1 Einstieg → 2 Zusammenhang → 3 Fachliche Tiefe → 4 Offene Fragen. So baut man mehrere Gänge parallel aus.
- Die Quellen sammeln sich unter dem Text, je tiefer man steigt.
- „Deine Gänge“ zeigt alle gefundenen Themen mit ihrer erreichten Tiefe und ob der heutige Abstieg noch frei ist.
- Gespeichert wird in `localStorage` (Schlüssel `hasenbau.v2`) als Liste von Freischaltungen `{date, id, level}`; ältere Daten (`hasenbau.v1`) werden übernommen.
- Die App zeigt nur freigeschaltete Höhlen. Die Dateien liegen aber offen im Repository und auf dem Server – wer im Quelltext stöbert, kann vorauslesen. Für echtes Verbergen bräuchte es ein Backend.
- Der Service Worker cacht alle Höhlen vorab, damit auch künftige Tage offline funktionieren.

## Neue Höhlen

Siehe Abschnitt „Neue Höhlen ergänzen“ in `content/RECHERCHE.md`.
