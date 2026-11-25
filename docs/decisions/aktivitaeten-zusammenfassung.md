# Aktivitäten-Zusammenfassung

25.11.2026 · Auftrag: Noah «a» (Thread «App doppelt so schnell machen»)

- Die App wird schneller gemacht über eine **abgeleitete Tabelle `activitiesLite`** (Aktivitäten ohne die grossen Rohkurven), nachgeführt von einer Middleware, nicht im Backup, nicht im Abgleich, jederzeit neu aufbaubar (Grund: 90 % einer Aktivität sind Kurven einer einzelnen Fahrt, acht Stellen lasen sie beim Start alle; verworfen: b «nur die schlimmsten Stellen einzeln entschärfen» (neun Stellen mit eigener Regel, kleinere Wirkung), die Rohkurven in eine eigene Tabelle auszulagern (verändert Backup, Abgleich und alle Leser, grösseres Risiko)).
- Ziel «doppelt so schnell» = halbe Zeit bei den gemessenen Werten: Heute-Inhalt am Computer höchstens 4 s, am Handy (4× gebremst) höchstens 12 s, Seitenwechsel höchstens 0.5 s blockiert.
- Regel für Leser: wer die Kurven einer Fahrt braucht oder eine gelesene Zeile zurückschreibt, liest `db.activities`; alle anderen Listen lesen `readLite`/`liteTable` (`src/lib/actlite.js`).
