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
| `js/impulses.js` | Die kuratierten Impulse, geordnet von zugänglich nach tief |
| `sw.js`, `manifest.webmanifest` | Offline-Fähigkeit und Installierbarkeit |

## Logik

- Ein Impuls gilt als *abgerufen*, sobald man dem Hasen folgt. Erst dann wird er in der Historie gespeichert (`localStorage`).
- Pro Kalendertag gibt es genau einen Impuls. Wer einen Tag auslässt, verpasst nichts: Es kommt einfach der nächste in der Reihenfolge – so bleibt die Abfolge „Stück für Stück tiefer“ erhalten.
- Jeder Impuls hat eine Oberfläche und eine tiefere Ebene („Tiefer hinab“), dazu eine Frage zum Weiterdenken und Lektürehinweise.
