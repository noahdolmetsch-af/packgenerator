# Kursblick «Entscheidung»: der Rechen-Code (Teil 1 von 4, nichts sichtbar)

PR folgt · 23.11.2026 · Auftrag: Noah «1, 3 und 4 zusammen» und «ok freigabe» (23.11.2026, Thread «Kursblick»); Bauplan in 4 kleinen PRs (`/mnt/project-files/notes/kursblick-entscheidung-bauplan-2026-11-23/bauplan.md`)

## Was ist neu
- **Nichts Sichtbares.** Dieser PR legt nur den Rechen-Code an, auf dem die nächsten PRs aufbauen: `src/lib/kurse/signale.js` mit Tests in `tests/kurse-signale.test.js` (28 Tests, nur erfundene Zahlen).
- **Trend-Ampel:** der Preis gegen das Mittel der letzten 50 und 200 Schlusskurse (grün: über beiden, rot: unter beiden, gelb: dazwischen), dazu der Abstand in Prozent.
- **Lage:** wo der Preis zwischen dem tiefsten und dem höchsten Schlusskurs der letzten fünf Jahre liegt (unteres Fünftel «günstig», oberes Fünftel «sehr teuer»).
- **Eigene Kaufregel:** Grundbetrag pro Monat, Faktor bei Rot, Faktor bei sehr teuer (0, ½, 1, 1½ oder 2). Beide Faktoren werden multipliziert, wenn beide gelten. Der Vorschlag nennt Betrag und Menge.
- **Rückblick:** die Regel über die letzten 60 Monate (erster Handelstag jedes Monats) gegen «immer gleich viel»: eingezahlt, Menge, Durchschnittspreis, Wert heute, Gewinn.
- **Verteilung:** Gruppen mit Ziel in Prozent und Spielraum in Punkten: Anteil jetzt, Abweichung, Franken zum Ziel (verkaufen oder nachkaufen), «im Rahmen». Dazu die Stellen, an denen sich eine Kaufregel und ein Ziel widersprechen.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- **Nur Beobachtungen und eigene Regeln.** Nichts sagt einen Preis voraus, kein Text nennt eine Anlageempfehlung. Reicht eine Reihe nicht für den Mittelwert (unter 200 Schlusskurse) oder für die Lage (unter 250), sagt der Code «nicht bekannt» und die Regel kauft den Grundbetrag; es wird nichts erraten.
- **Nur Rechnen, keine Daten.** Kein neuer Speicher, kein Schema, keine Einstellung; die Daten (Journal, Depots) kommen in PR 2 mit Backup-Test.
- **Keine Neuigkeit, keine Funktion in `features.js`:** der Code hat noch keine Seite. Die Fertig-Regel (Seite, Absprung, Inhalt, leerer Zustand, nächster Schritt, App-Stand) wird mit PR 3 erfüllt, wo die Seite entsteht.
- **Reihenfolge der PRs:** 1 Rechen-Code, 2 Journal und Depots (Daten), 3 Reiter «Entscheidung» für Gold, 4 Reiter für das ganze Portfolio.

## Entscheide (eigene Datei `docs/decisions/kursblick-entscheidung.md`)
- 23.11.2026: Noahs Wahl und die angenommenen Antworten ★ (Verweis).

## Stand im Plan (roadmap.md / vorhaben.md)
- Kursblick (vorhaben.md Punkt 19): der neue Reiter «Entscheidung» ist geplant, Teil 1 gebaut.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Nichts zu sehen: Kursblick sieht aus wie vorher (Heute, Gold mit Referenztag, Märkte, Meine Zahlen, Quellen).
2. Die Tests stehen grün in der CI (`tests/kurse-signale.test.js`).
