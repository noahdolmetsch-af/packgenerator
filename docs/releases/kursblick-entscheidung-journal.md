# Kursblick «Entscheidung»: das Journal (Teil 2 von 4, nur Daten, nichts sichtbar)

23.11.2026 · Auftrag: Noah «1, 3 und 4 zusammen» und «ok freigabe» (23.11.2026, Thread «Kursblick»); Bauplan `/mnt/project-files/notes/kursblick-entscheidung-bauplan-2026-11-23/bauplan.md`. Teil 1 ist online (#1546), Teil 2 kam erst danach (Vorgabe des Bündlers).

## Was ist neu
- **Nichts Sichtbares.** Dieser PR legt nur die Daten und das Rechnen für das Journal an: `src/lib/kurse/journal.js` mit Tests in `tests/kurse-journal.test.js` und einem Zusatz in `tests/kurse-privat.test.js`. Es gibt noch keine Seite, die es benutzt.
- **Neue Einstellung `kurse.journal`** (privat, wie `kurse.bestand` und `kurse.ziele`): bleibt auf dem Gerät, geht mit in die Sicherungsdatei und in den versiegelten Abgleich. Sie steht **nicht** in `DEVICE_SETTINGS`. Kein neues Dexie-Schema, keine neue Tabelle.
- **Form:** Depots (`echt` oder `uebung`), darin Einträge: Kauf, Verkauf, Dividende, Split (Datum, Menge, Preis, Gebühr, Betrag, Faktor).
- **Rechnen:** Verkäufe mit dem Durchschnittspreis; ein Split vervielfacht die Stücke ab seinem Tag (am selben Tag zuerst Split, dann Kauf, Verkauf, Dividende); Gebühren zählen zum Einstand; Dividenden von Hand. Ein Verkauf über den Bestand wird nie verweigert, er wird als «zu viel» gemeldet. Löschen blockiert nie.
- **Übernahme der bisherigen Posten aus «Meine Zahlen»** als «Eröffnung» (gleiche Rechnung wie die Anzeige dort): zweimal übernehmen verdoppelt nichts, das Original in `kurse.bestand` bleibt unverändert.
- **Übungsdepots** (beliebig viele, fiktiv): `echteEintraege` lässt sie für Gesamtbild, Verteilung und Kaufregel weg.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- **Nur Daten, keine Seite:** die Fertig-Regel (Seite, Absprung, Inhalt, leerer Zustand, nächster Schritt, App-Stand) folgt mit PR 3 und 4, wo die Seite entsteht. Keine Neuigkeit, keine Funktion in `features.js`.
- **Eintrag ohne Kaufdatum** (alter Posten ohne Tag): Eröffnung am Tag vor der ersten Dividende oder dem ersten Split, sonst heute; mit der Markierung `ohneTag`, damit die Seite es erklären kann.
- Die angenommenen Antworten ★ (Durchschnittspreis, Eröffnung, beliebig viele Übungsdepots, Gebühr pro Eintrag, nur echte Depots für Regel und Gewichtung) gelten, Noah kann sie ändern.

## Backup-Test (Pflicht vor Datenänderung)
- Kopie von Noahs Sicherung `pack-generator-2026-11-23-447.json` (vom 23.11. 04:47, jünger als ein Tag) in einem Wegwerf-Ordner: `settings` hat 148 Zeilen, **noch keine Zeile `kurse.*`** (die Sicherung ist älter als «Meine Zahlen»). `kurse.journal` fehlt also; `lies` macht daraus ein leeres Journal (0 Depots), nichts bricht, nichts wird geschrieben. Die Übernahme ohne Posten fügt nichts hinzu (0 neu), zweimal ebenso, `kurse.bestand` bleibt unverändert.
- Der volle Rundlauf mit Daten (Sicherung schreiben, lesen, wiederherstellen, Abgleich) steht in `tests/kurse-privat.test.js` mit erfundenen Zahlen und ist grün. Die Kopie ist wieder gelöscht, nichts davon liegt im Repo.
- Vor PR 3 (erstes Schreiben von `kurse.journal` auf dem Gerät) fragt der Thread nach einer frischen Sicherung, falls die letzte älter als ein Tag ist.

## Entscheide
- Keine neuen; siehe `docs/decisions/kursblick-entscheidung.md` (Journal und Depots).

## Stand im Plan (roadmap.md / vorhaben.md)
- Kursblick (vorhaben.md Punkt 19): Teil 2 gebaut, Reiter «Entscheidung» folgt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Nichts zu sehen: Kursblick sieht aus wie vorher.
2. Meine Zahlen öffnen: Bestand und Ziele sind unverändert da.
3. Die Tests stehen grün in der CI (`tests/kurse-journal.test.js`, `tests/kurse-privat.test.js`).
