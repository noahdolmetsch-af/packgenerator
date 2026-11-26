# Heute weniger doppelt lesen

25.11.2026 · Auftrag: Noah (Thread «App doppelt so schnell machen»; Koordinator 25.11.2026 22:37: «Handy noch schneller machen»)

- Beim Start von Heute lesen sechs bis sieben Orte die ganze kleine Aktivitäten-Tabelle (`readLite(db, (T) => T.toArray())`); jede Kopie von 1'447 Zeilen kostet das gebremste Handy rund 100 ms. Neu: `liteAll(db)` liest sie einmal und gibt jedem Ort eine eigene Kopie (ein Sortieren an einem Ort verändert die anderen nicht). Ein Speichern in `activities` (Middleware zählt `ver`) beendet das Teilen sofort, das Teilen endet sonst nach 1.5 s. In einer liveQuery meldet ein billiges `limit(1)` die Tabelle an, so läuft die Abfrage nach jeder Änderung neu.
- «Neu heute» las und zeichnete bei jedem Start die ganze Geschichte (alle Touren, Fahrten, Aktivitäten, Aufzeichnungen), obwohl es nur nach einer Fahrt seit gestern fragt. Neu: erst `readSince` (nur die Zeilen ab gestern über die Tages-Indizes); nur wenn seit gestern gefahren wurde, wird wie bisher alles gelesen. Gleichwertigkeit mit der ganzen Geschichte ist in `tests/neuheute-since.test.js` geprüft.
- Gemessen (Noahs Backup, privat; Handy 390 × 4; Referenz-Bau im selben Lauf, 2 × 3 Starts): Blockierzeit beim Start 3.1–3.7 s → 2.5–2.9 s (−15 bis −20 %), Aufbau von Heute 4.7–5.5 s → 4.4–4.7 s, lange Aufgaben 32–34 → 24–28.
- Verworfen nach Messung (kein Unterschied): das Kilometerbuch von sechs Kacheln gemeinsam lesen; die Kacheln unterhalb des ersten Bildschirms nach und nach bauen. Der «5½-s»-Wert ist die späteste Textzeile unten; die Begrüssung steht nach etwa 2 s.
- Regel: wer beim Start von Heute eine Liste der ganzen Aktivitäten braucht, nimmt `liteAll`, nicht `readLite(… toArray())`.
