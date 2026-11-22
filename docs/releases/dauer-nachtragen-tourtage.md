# Dauer nachtragen für Tourtage

21.11.2026 · Auftrag: Noah 21.11.2026 22:47 (Karte «Tourtage ohne Strava-Zeit», Sportjahr S12, Thread «Bauen: Sportjahr und Auswertung aller Sportarten»)

## Was ist neu
- **Tourtage ohne Zeit** stehen jetzt auch in «Dauer nachtragen»: «Tour «Name» am 6. Okt.: wie lange?». Gemeint ist ein vergangener Tag einer Tour mit Sportart (Velo, Skitour, Wandern) ohne Strava-Aktivität an dem Tag und ohne Haken mit Minuten.
- **Keine Schätzung.** Bis du antwortest, zählt so ein Tag 0 Stunden (Noahs Entscheid). Ein Tipp auf 60, 120, 180 oder 240 Min oder eine eigene Zahl schreibt einen Haken der Sportart für diesen Tag mit den Minuten (Quelle «Tour») und zählt als gemessen; «Rückgängig» nimmt ihn wieder weg.
- Neue Dateien `src/lib/flow/tourtage.js` (rein, Tests `tests/tourtage.test.js`); `DauerNachtragen.svelte` und `tests/e2e/dauer-nachtragen.spec.js` erweitert.

## Was fällt weg oder rutscht tiefer
- nichts. Der Block «Dauer nachtragen» zeigt zusätzlich die Tourtage; die Haken-Zeilen bleiben, wie sie waren. Der Text im Block sagt jetzt «Einträge» statt «Haken».

## Selbst entschieden
- **Eigene Knöpfe 1, 2, 3, 4 Stunden** statt 15 bis 60 Min: ein Tourtag dauert Stunden. Die eigene Zahl bleibt (bis 1440 Min).
- **Nicht gefragt für «Velo draussen»:** diese Sportart zählt Tourtage schon selbst als Haken; ein zweiter Haken würde doppelt zählen. Ebenso nicht für Wochenende und Weltreise (keine Sportart) und nicht ohne passende Aktivität oder wenn sie pausiert ist.
- **Heute und die Zukunft werden nicht gefragt**; nur vergangene Tage, höchstens 60 Tage pro Tour.
- **Der Haken heisst in den Auswertungen «von Hand»** (Quelle «Tour» ist nur im Haken gespeichert, `via: 'tour'`).
- **Fertig-Regel:** Teil des Blocks «Dauer nachtragen» (Seite und app-stand-Satz bestehen, ergänzt), Leerzustand = der Block fehlt.

## Entscheide (eigene Datei `docs/decisions/dauer-nachtragen-tourtage.md`)
- 21.11.2026: Tourtage ohne Strava-Zeit und ohne Minuten-Haken bekommen keine Schätzung, sondern kommen in «Dauer nachtragen».

## Stand im Plan (roadmap.md / vorhaben.md)
- Sportjahr S12 komplett (Haken-Teil und Tourtage). Offen: S5, S13.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Aktiv › Meine Aktivitäten › «Dauer nachtragen» öffnen: eine vergangene Tour ohne Strava steht als «wie lange?».
2. «3 Std.» (180 Min) tippen: der Tag verschwindet aus der Liste und zählt im Sportjahr; «Rückgängig» bringt ihn zurück.
