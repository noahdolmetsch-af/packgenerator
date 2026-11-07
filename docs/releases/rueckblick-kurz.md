# Rückblick in 30 Sekunden

PR (Touren 3b) · 05.11.2026 · Auftrag: Noah «3b» aus «Ideen für alle Bereiche» (Thread «Bauen: Touren 3a und 3b»)

## Was ist neu
- Im offenen Rückblick einer Tour steht ganz oben die Karte «Rückblick in 30 Sekunden» mit drei Fragen und Gesichtern: 1. Wie war die Fahrt? (5 Gesichter), 2. War das Gepäck richtig? (Genau richtig / Zu viel / Zu wenig), 3. Hat dir etwas gefehlt? (Nein / Ja, dann Name eintippen).
- «Kurzfassung speichern» speichert wie das lange «Fertig»: der Rückblick ist abgeschlossen, Tour beendet, Kilometer gebucht. Es werden keine Vorschläge übernommen (wie beim langen «Fertig» ohne Häkchen).
- Die Antworten landen in denselben Feldern wie im langen Rückblick: «Fahrspass» (Skala aus «Was hat es gut gemacht?»), «Gepäck» (Menge) und «Was hat gefehlt». Darunter sieht man sie sofort im langen Formular.
- Logik: `src/lib/debrief/kurz.js`; Karte: `src/lib/debrief/Kurz.svelte`; Tests `tests/rueckblick-kurz.test.js`, `tests/e2e/rueckblick-kurz.spec.js`.

## Was fällt weg oder rutscht tiefer
- Der lange Rückblick (Gepäck-Chips, Fehlendes, Satz fürs nächste Mal, Mehr) rutscht um eine Karte nach unten. Nichts fällt weg.

## Selbst entschieden
- Keine neue Speicherstelle: Frage 1 zählt als «Fahrspass» (1 bis 5), so erscheint sie auch unter «Was hat es gut gemacht?» und im Mittelwert über alle Touren.
- Die Karte zeigt Frage 2 vorbelegt («Genau richtig»), weil der lange Rückblick auch «wie geplant» vorbelegt ist.
- Das Gesicht noch einmal antippen nimmt die Antwort zurück (wie bei den Skalen).
- Die Karte steht nur im offenen Rückblick; im gespeicherten Rückblick ist sie weg («Antworten ändern» bringt sie wieder).
- Kein eigener Eintrag in `features.js`: die Karte gehört zum Rückblick (Zeile «Tour-Rückblick» in `docs/app-stand.md` ergänzt).

## Entscheide (für decisions.md)
- 05.11.2026: Die Kurzversion des Rückblicks schreibt in dieselben Felder wie die lange; es gibt nur einen Rückblick pro Tour.

## Stand im Plan (roadmap.md / vorhaben.md)
- Ideen für alle Bereiche, Touren 3b: gebaut. 3a (Tour-Ampel) ist ein eigener PR.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Rückblick einer gefahrenen Tour öffnen: oben steht «Rückblick in 30 Sekunden».
2. Ein Gesicht antippen: darunter bei «Was hat es gut gemacht?» ist «Fahrspass» gleich gesetzt.
3. «Kurzfassung speichern»: der Rückblick ist gespeichert und die Tour steht unter «Rückblick fertig».
