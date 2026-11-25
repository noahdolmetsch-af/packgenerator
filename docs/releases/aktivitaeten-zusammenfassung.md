# Die App startet etwa doppelt so schnell (Aktivitäten-Zusammenfassung, Teil 1)

PR #1752 · 25.11.2026 · Auftrag: Noah «a» vom 25.11.2026 (Thread «App doppelt so schnell machen»), Messbericht `notes/tempo-2-2026-11-24/README.md`

## Was ist neu
- **Ursache:** Eine Strava-Aktivität wiegt in `activities` im Schnitt 25 KB, weil rund 90 % Rohkurven einer einzelnen Fahrt sind (Herzfrequenz, Leistung, Höhe, Kilometer-Abschnitte). Mit Noahs 1'447 Aktivitäten (36 MB) lasen acht Stellen beim Start von Heute die ganze Tabelle, und jeder Seitenwechsel noch einmal. Gemessen mit Noahs Backup vom 24.11. (Computer ungebremst, Handy 4× gebremst): Heute-Inhalt 8.2 s / 25 s, Seitenwechsel blockiert im Mittel 0.9 s / 1.3 s.
- **Neue Tabelle `activitiesLite`** (Datenbank-Version 22, `src/lib/actlite.js`): dieselben Zeilen ohne die zwölf grossen Rohkurven (`HEAVY_KEYS`: ser, sprof, prof, segs, dprof, splits, hw, curve, climbs, secs5, laps, photos), etwa 4 MB statt 36 MB. Die kleinen Zusammenfassungen (hist, pHist, cHist, pCurve, halves, pauses …) bleiben drin.
- **Nachführung von selbst:** eine Dexie-Middleware schreibt die kleine Tabelle im selben Schritt wie jedes Speichern, Löschen oder Leeren von `activities` (auch in jeder Transaktion, auch beim Backup-Import «Ersetzen»). Die Tabelle ist abgeleitet: nicht im Backup, nicht im Abgleich (`TABELLEN_NUR_GERAET`), jederzeit neu aufbaubar.
- **Erster Start nach dem Update:** die Tabelle ist neu und leer, die Listen lesen noch die volle Tabelle (wie heute, einmal langsam). 4 Sekunden nach dem Start baut die App die kleine Tabelle im Hintergrund, 25 Zeilen pro Schritt (Lesen und Schreiben in derselben Transaktion), dann setzt sie eine Markierung (`meta` «actlite»). Danach lesen die Listen die kleine Tabelle. Stimmt die Zeilenzahl einmal nicht mehr mit `activities` überein, baut die App sie beim nächsten Start neu.
- **Umgestellt auf die kleine Tabelle** (Listen, die nie eine Rohkurve brauchen): Heute (Wochenkarte, Wochen-Kachel, Challenge-Zeile, Outdoor-Karte, Körper-Kachel), Woche, Flow-Daten (Meilensteine, Hobby-Serie), Abfragen («Wi gaht's»), Messwerte, Fahrtenbuch (`bikeActs`), Neuland, Erkenntnisse und die Vergangenen Touren (`loadPastActs`).
- **Gemessen im echten Build mit Noahs Backup** (Computer, ungebremst): Heute-Inhalt 8.2 s → 2.0 s, Seitenwechsel Woche/Touren/Auswerten blockieren 0–0.4 s statt 1.6–4 s. Handy (4× gebremst): Heute-Inhalt 25 s → 5.6–6.1 s, Seitenwechsel blockieren 0.3–0.7 s statt 1.4–4 s. Der allererste Start nach dem Update ist langsamer (Computer 5.6 s, Handy 8 s), weil die Tabelle erst im Hintergrund entsteht; ab dem zweiten Start gelten die schnellen Werte.

## Was fällt weg oder rutscht tiefer
- nichts. `activities` behält jede Zeile ganz; die Seite einer Fahrt, die Analysen, die Tour-Zeitleiste und alles, was schreibt, lesen weiter die volle Tabelle.

## Selbst entschieden
- **Sicherung gegen Datenverlust:** jede Zeile der kleinen Tabelle trägt die Marke `_lite`. Die Middleware verweigert es, eine solche Zeile in `activities` zu speichern (Fehler statt stilles Löschen der Kurven). Ein Test prüft das und dass kein Leser der kleinen Tabelle zurückschreibt oder eine Rohkurve beim Namen nennt.
- Die Versionsnummer des Datenbankformats (`SCHEMA_VERSION`) steigt auf 22 wie bei jeder neuen Tabelle, obwohl das Backup-Format gleich bleibt.
- Lieber nur Leser umgestellt, die in der Prüfung nie eine Rohkurve verlangt haben: ein Spion auf der kleinen Tabelle meldete beim Durchklicken von 168 Adressen mit Noahs Daten jeden Zugriff auf eine Rohkurve; die Rückblick-Liste («loadActs», Tour-Zeitleiste, Hub) bleibt deshalb auf der vollen Tabelle.
- Weitere Seiten (Training, Analyse, Auswerten-Wochen, Sportjahr, Touren-Listen, Rennen, Live u. a., rund 70 Stellen) folgen in Teil 2 und 3.

## Entscheide (eigene Datei `docs/decisions/aktivitaeten-zusammenfassung.md`)
- 25.11.2026: Weg a (abgeleitete Tabelle) statt einzelner Entschärfungen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Tempo «doppelt so schnell»: Teil 1 von 3 (Tabelle, Nachführung, Heute und Woche). Ziel halbe Zeit: weit übertroffen am Computer (8.2 → 2.0 s) und am Handy (25 → rund 6 s).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. App öffnen: Heute erscheint wie bisher (der allererste Start nach dem Update braucht einmal so lange wie bisher). Nach etwa 10 Sekunden ist die kleine Tabelle gebaut.
2. App ganz schliessen und neu öffnen: Heute zeigt den Inhalt nach wenigen Sekunden.
3. «Plan», «Touren», «Auswerten» nacheinander öffnen: jede Seite steht sofort.
4. Touren › Aktivitäten: eine Fahrt öffnen, Herzfrequenz-, Leistungs- und Höhenkurve sind da.
