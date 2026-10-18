# Hasenbau

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
| `content/hoehlen/*.json` | Die 20 Hasenhöhlen, je eine Datei mit Text, tieferer Ebene, Frage und Quellen |
| `content/RECHERCHE.md` | Recherche-Protokoll: was geprüft wurde, Belege, offene Punkte |
| `sw.js`, `manifest.webmanifest` | Offline-Fähigkeit und Installierbarkeit |

## Logik

- Eine Höhle gilt als *freigeschaltet*, sobald man dem Hasen folgt. Erst dann wird sie geladen und in der Historie gespeichert (`localStorage`, Schlüssel `hasenbau.v1`).
- Pro Kalendertag gibt es genau eine Höhle. Wer einen Tag auslässt, verpasst nichts: Es kommt einfach die nächste in der Reihenfolge – so bleibt die Abfolge „Stück für Stück tiefer“ erhalten.
- Jede Höhle hat eine Oberfläche und eine tiefere Ebene („Tiefer hinab“), dazu eine Frage zum Weiterdenken sowie Quellen und Lektürehinweise.
- Die App zeigt nur freigeschaltete Höhlen. Die Dateien liegen aber offen im Repository und auf dem Server – wer im Quelltext stöbert, kann vorauslesen. Für echtes Verbergen bräuchte es ein Backend.
- Der Service Worker cacht alle Höhlen vorab, damit auch künftige Tage offline funktionieren.

## Neue Höhlen

Siehe Abschnitt „Neue Höhlen ergänzen“ in `content/RECHERCHE.md`.
