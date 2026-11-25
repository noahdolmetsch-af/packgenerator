# Heute und die Touren öffnen wieder schnell (Aktivitäten-Zusammenfassung, Korrektur)

PR #NNNN · 25.11.2026 · Auftrag: Noah «a» vom 25.11.2026 (Thread «App doppelt so schnell machen»), Folge von Teil 2 (PR #1760, online)

## Was ist neu
- **Gefunden bei der Abschlussmessung** mit Noahs Backup (Handy, 4× gebremst, echter Build): nach Teil 2 stand der Inhalt von Heute erst nach 9–11 s (vorher 2–4 s), Touren öffnete in 5.2 s (vorher 1.2 s), die Blockierzeit beim Start war 3–3.5 s statt 0.6–0.9 s.
- **Ursache:** Teil 2 liess `liteTable` vor jedem Lesen beide Tabellen zählen. Das Zählen der grossen Tabelle `activities` (36 MB) kostet Sekunden, und Heute fragt beim Start rund zwanzigmal.
- **Beleg in drei Bauvarianten, gleiche Daten und Bremse:** Stand Teil 1 (PR 1752): Start 2.1–3.9 s / 0.6–0.9 s Blockade. Stand nach Teil 2: 9.0–11.4 s / 3.0–3.6 s. Stand nach Teil 2 ohne die Zählung: 2.3–4.0 s / 0.6–1.1 s. Mit der Korrektur (Zählung weg, `Dexie.Promise` bleibt): 2.3–3.9 s / 0.6–1.0 s; Touren 1.1 s, Analyse 0.9 s.
- **Korrektur:** die Zählung vor jedem Lesen ist weg; die Prüfung der Zeilenzahl steht weiter einmal beim App-Start. Das Warten mit `Dexie.Promise` (das «Wie war's?»-Karten-Problem aus Teil 1) bleibt und kostet nichts.

## Was fällt weg oder rutscht tiefer
- Die Sicherung «eine Zeile kam an der App vorbei hinein» (Test schreibt direkt in IndexedDB, ohne die App neu zu laden) gilt nur noch nach einem Neustart der App. Die Tests, die so schreiben, laden die App danach neu.

## Selbst entschieden
- Keine neue Sicherung als Ersatz: ein Vorfall nur in Tests, im Alltag schreibt alles durch die App (Middleware) und der Start prüft die Zahlen.
- Merkregel in `docs/decisions/aktivitaeten-zusammenfassung-fix.md`: `liteTable` darf `activities` nicht anfassen.

## Entscheide (eigene Datei `docs/decisions/aktivitaeten-zusammenfassung-fix.md`)
- 25.11.2026: Zählung vor jedem Lesen zurückgenommen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Tempo «doppelt so schnell»: Teil 1 und 2 online, Korrektur hier. Letzte langsame Seite: «Funktionen» (#/features, 3–4 s am Handy), danach Teil 3.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. App ganz schliessen und neu öffnen: Heute zeigt den Inhalt nach wenigen Sekunden.
2. «Touren» und «Auswerten › Analyse» öffnen: jede Seite steht sofort.
3. Heute: eine neue Strava-Fahrt ausfüllen («Wie war's?» antippen): die Karte verschwindet sofort.
