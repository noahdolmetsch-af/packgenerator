# Mehr Seiten öffnen schneller (Aktivitäten-Zusammenfassung, Teil 2)

PR #1760 · 25.11.2026 · Auftrag: Noah «a» vom 25.11.2026 (Thread «App doppelt so schnell machen»), Teil 1 (PR #1752) ist online

## Was ist neu
- **Rund 50 weitere Lesestellen** lesen die kleine Tabelle `activitiesLite` statt der vollen `activities`: Auswerten › Analyse, Training (Liste, Pläne), Sportjahr, Rückblick, Auswerten-Woche, Verbindungen, Gewicht, Chronik, Heatmap, Touren (Analyse, Verlauf, Wochenplan, Meinplan), Rennen (Vorbereitung, Rückblick, Briefing, Detail), Lernen (Tagebuch, Beobachtungen, Chronik-Karte), Assistent, Suche, Traumreise, Neuland, Veloimgriff, Live-Speichern. Die Umstellung lief mit einem Skript über alle reinen Lesestellen.
- **Gemessen vorher:** ein Spion über 168 Adressen mit Noahs Daten (Backup vom 24.11.) fand nach Teil 1 noch 18 Adressen, die die ganze Tabelle (1'447 Zeilen, 36 MB) lasen; Analyse und Auswerten › Übersicht sogar zwei- bis viermal. **Nachher:** 0 Adressen lesen die volle Tabelle als Liste (Seiten mit Rohkurven lesen einzelne Zeilen).
- **Prüfung auf fehlende Rohkurven:** ein zweiter Spion auf der kleinen Tabelle meldete beim Durchklicken von 168 Adressen und 46 Seiten einzelner Fahrten (Aktivität, Tour, Spur) jeden Zugriff auf eine Rohkurve oder ein Zurückschreiben: keiner. Dazu der Text-Test aus Teil 1, der jede Stelle ablehnt, die eine Rohkurve beim Namen nennt.
- **Zwei Sicherungen neu:** (1) `liteTable` zählt vor jedem Lesen beide Tabellen. Weichen die Zahlen ab (eine Zeile kam an der App vorbei hinein), antwortet die volle Tabelle und die kleine wird neu gebaut. (2) **Fehler aus Teil 1 behoben:** eine Seite, die die kleine Tabelle über `liveQuery` liest, merkte spätere Speichern nicht, wenn die Prüfung der Tabelle beim App-Start noch lief (Dexie verliert die Verfolgung, wenn sie auf ein fremdes Versprechen wartet). Sichtbar wurde es an der Karte «Wie war's?» (blieb nach dem Antippen stehen) und betraf auch die Heute-Karten aus Teil 1. Jetzt wartet `liteTable` mit `Dexie.Promise`; neuer Test `tests/actlite-live.test.js` (schlägt ohne die Korrektur fehl).

## Was fällt weg oder rutscht tiefer
- nichts. Auf der vollen Tabelle bleiben bewusst: die Seite einer Fahrt (`TrainingAct`), Live und «Nach der Fahrt» (Runden), Tour (Fotos), Tour-Vorschläge (Höhenprofil), Gipfelbuch (Profil) und alles, was schreibt (Strava-Abruf, Tour bearbeiten, Wochen-Haken, Heatmap-Nachtrag).

## Selbst entschieden
- Weniger neue Lesestellen von Hand prüfen, mehr dem Spion trauen: Zwei Spione (Rohkurve gelesen, volle Tabelle gelesen) über alle Adressen mit Noahs Daten und der Text-Test ersetzen das Durchlesen von 50 Stellen.
- Der Test `vorschlaege.spec.js` lädt die App nach dem Schreiben an der App vorbei neu (aus Teil 1), jetzt zusätzlich durch die Zählung nicht mehr nötig, bleibt aber als Normalfall.

## Entscheide (eigene Datei `docs/decisions/aktivitaeten-zusammenfassung-2.md`)
- 25.11.2026: Alle reinen Lese-Listen auf die kleine Tabelle, Seiten mit Rohkurven bleiben auf der vollen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Tempo «doppelt so schnell»: Teil 2 von 3 (Lesestellen). Teil 3: Neu-Heute (`NeuHeute`), Seite «Funktionen» (#/features, 3 s am Handy), Packen (1.1 s am Handy).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. «Auswerten › Analyse», «Training», «Sportjahr», «Touren» und ein Rennen nacheinander öffnen: jede Seite steht ohne Stocken.
2. Eine Fahrt im Training öffnen: Herzfrequenz-, Leistungs- und Höhenkurve sind da.
3. Heute: eine neue Strava-Fahrt ausfüllen («Wie war's?» antippen): die Karte verschwindet sofort.
