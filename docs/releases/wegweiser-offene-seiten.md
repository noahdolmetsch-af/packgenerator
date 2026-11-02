# Was du hier tun kannst, auf jeder Tour (Wegweiser 21: Seiten mit Platzhalter)

PR #… · 02.11.2026 · Auftrag: Noah «1-5a» (Inhalte, Claude schreibt das Wissen) und Plan «freigabe» Schritt 1–26 (Thread «Entdeckbarkeit versteckter Funktionen planen»)

## Was ist neu
- Die Karte «Was du hier tun kannst» erscheint auch auf Seiten einer einzelnen Sache: Rückblick einer Tour, ein Rennen (Übersicht, Route, Karte), ein Tagebucheintrag.
- `ON_PAGES` (`src/lib/seiteninhalt.js`) kennt Muster mit Platzhalter: `:name` steht für ein Stück der Adresse (z. B. `#/debrief/:trip`). Feste Seiten unter demselben Pfad (`#/debrief/logbook`, `#/race/…/ride` usw., Liste `RESERVED`) zählen nicht als «eine Tour».
- Zuklappen gilt pro Muster: wer die Karte bei einer Tour zuklappt, sieht sie bei jeder Tour als eine Zeile.
- «Gut zu wissen» für die 20 Funktionen dieser Seiten in `src/lib/wissen/offen.js`, Deutsch in `src/lib/i18n/de/wissen-offen.js`.

## Die 29 Funktionen mit Platzhalter-Heimat
| Seite | Funktionen | Karte |
|---|---|---|
| Rückblick einer Tour `#/debrief/:trip` | Panne, Tag zum Hören, Verbrauch buchen, Schlafplatz bewerten, Tourbild, Nicht gebraucht, Gefehlt, Reisespur, Link für die Familie, Reisebuch, Tourseite, Tagebuch, Mehr Fragen, Nachricht an dich (14) | an |
| Notiz `#/notes?open=:note` | Erinnerung an einem Ort, Verknüpfte Notizen, Skizze, Formatieren, Datei anhängen, Erinnere mich (6) | aus: die Notiz öffnet sich als Fenster über Notizen, die Karte läge unsichtbar dahinter |
| Rennen `#/race/:race` | Rennkarte, Anstiege (2) | an |
| Rennen › Route `#/race/:race/route` | Schlafplätze aus Listen, Nächte nach Wetter (2) | an |
| Rennen › Karte `#/race/:race/map` | Karte offline (1) | an |
| Tagebucheintrag `#/tagebuch/:entry` | Bildkarte (1) | an |
| Rennmodus `#/race/:race/ride` | Wo schlafe ich heute, Hotels anrufen, Powernap (3) | aus: im Rennen gehört der erste Bildschirm dem Fahren, wie bei Unterwegs |

20 an, 9 bewusst aus. Die 6 Notiz-Funktionen brauchen einen eigenen Ort (z. B. die Karte auf Notizen selbst oder «Gut zu wissen» im Notiz-Fenster); das ist eine Frage an Noah.

## Was fällt weg oder rutscht tiefer
- nichts fällt weg. Auf diesen Seiten rutscht der Inhalt um die Höhe der Karte tiefer, bis man sie mit × zuklappt (dann eine Zeile, für alle Seiten der gleichen Art).
- Rückblick einer Tour: die Karte startet zugeklappt (eine Zeile, Noah 02.11. «a»), damit die Chips und der Rückblick auf dem ersten Bildschirm bleiben; ein Tipp öffnet sie (14 Funktionen, 4 gezeigt). Rennen: die Karte ist offen, rund 570 px hoch, der Name des Rennens steht ganz unten. Computer: Rückblick eine Zeile.

## Selbst entschieden
- Rennmodus ohne Karte (wie Unterwegs und Heute).
- Offene Notiz ohne Karte: im Notiz-Fenster wäre sie verdeckt; auf dem Bild sichtbar.
- Ein Zuklappen gilt für alle Touren statt pro Tour: sonst müsste man bei jeder Tour neu zuklappen.
- Feste Unterseiten (Logbuch, Vergleich, Fahrt, Teilen …) gewinnen immer vor dem Platzhalter.

- Platzhalter-Seiten haben eine echte Id für Tests (`samplePage`, `SAMPLE_IDS` in `seiteninhalt.js`), damit der Test für Wegweiser 24 sie öffnen kann.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Vorhaben 17 «Wegweiser statt Katalog»: Schritt 21 von 26.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Rückblick öffnen und eine abgeschlossene Tour antippen: oben steht «Was du hier tun kannst», jede Funktion mit «Gut zu wissen».
2. × antippen und eine andere Tour öffnen: die Karte bleibt eine Zeile.
3. Unter Rennen ein Rennen öffnen: die Karte zeigt Rennkarte und Anstiege.
