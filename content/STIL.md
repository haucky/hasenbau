# Stilleitfaden für die Gänge

Hasenbau richtet sich an Leserinnen und Leser mit akademischem Hintergrund, die außerhalb ihres Fachs lesen. Der Ton soll an eine Essayistin wie Juli Zeh erinnern und nicht an einen Abreißkalender: präzise, analytisch und nüchtern, gelegentlich ironisch, mit der Bereitschaft zum Urteil.

## Was der Text tun soll

- **Argumentieren statt verkünden.** Erst eine These, dann der Einwand, dann die Abwägung, so wie man einen Sachverhalt prüft. Darf der Text urteilen, dann tut er es und begründet sein Urteil.
- **Fachbegriffe verwenden und einordnen.** Der Begriff fällt dort, wo er gebraucht wird, mit Herkunft oder kurzer Definition im Satz selbst (Allometrie, Kardinalität, Lipogramm, Pathosformel, Physikalismus …). Der Text erklärt ihn, ohne die Leserin zu belehren.
- **Satzbau variieren.** Lange, hypotaktisch gebaute Sätze mit Einschüben, Konjunktiv der indirekten Rede und genauen Konnektoren (*indessen, freilich, gleichwohl, zumal, insofern*) wechseln mit kurzen Feststellungen. Die Länge folgt dem Gedanken und keinem Rhythmusschema.
- **Konkretes vor Allgemeinem.** Jahreszahlen, Orte, Namen, Zahlen, Zitate im Wortlaut, wo sie belegt sind. Eine Anekdote steht nur dann im Text, wenn sie etwas erklärt.
- **Absätze enden mit dem Gedanken.** Sie laufen nicht auf eine Pointe zu, die man auf eine Postkarte drucken könnte.

## Was der Text vermeidet

Die folgenden Muster gelten als typische Merkmale maschinell erzeugter Texte (vgl. Wikipedia: *Signs of AI writing*; t3n zu KI-Phrasen). Einzeln beweisen sie nichts, gehäuft verraten sie den Text.

| Muster | Beispiel, das nicht mehr vorkommen soll |
| --- | --- |
| Negativer Parallelismus | „Das ist kein X, sondern Y.“ / „nicht nur …, sondern auch …“ |
| Dreierreihen als Füllung | „Ekstase, Trauer, Raserei“, wo eine Sache genügt |
| Kalenderpointe am Absatzende | „Größe ist nie nur eine Frage des Maßstabs.“ |
| Gedankenstriche als Allzweckwerkzeug | mehr als ein Gedankenstrich pro Absatz |
| Floskelhafte Übergänge | *darüber hinaus, zusammenfassend, letztendlich, es ist wichtig zu betonen* |
| Schwärmerische Adjektive | *faszinierend, spannend, bemerkenswert, verblüffend, erstaunlich* |
| Hohle Bedeutungsbehauptungen | *unterstreicht, zeugt von, verdeutlicht die Bedeutung* |
| Vage Zuschreibungen | „Experten meinen …“ ohne Namen |
| Rhetorische Fragen als Einstieg | „Was wäre, wenn …?“ |
| Gleichförmige Absätze | drei Absätze von gleicher Länge und gleichem Bau |
| Floskel-Ausgang | „Ob …, ist eine offene Frage.“ als Schluss jeder Ebene |

## Die vier Ebenen

1. **Einstieg:** Ein konkreter Fall, eine Szene oder ein Befund, aus dem sich das Problem entwickelt. Ohne Vorkenntnisse lesbar, aber keineswegs einfach.
2. **Zusammenhang:** Ideengeschichte und Rezeption. Wer hat wann worüber gestritten, was folgt daraus?
3. **Fachliche Tiefe:** Das Instrumentarium des Fachs mit seinen Begriffen, Rechenwegen, Methoden, genau so weit, wie es sich ohne Formelsatz darstellen lässt.
4. **Offene Fragen:** Der aktuelle Forschungsstand mit seinen echten Kontroversen und Positionen, geschrieben wie ein Lagebericht.

## Prüfen

`node tools/stilcheck.mjs` zählt die Muster aus der Tabelle und meldet Ebenen, die auffallen. Das Skript ersetzt kein Gegenlesen, hält aber die gröbsten Rückfälle auf.
