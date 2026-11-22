# Prüfung: kleine PRs bekommen nur die schnelle Prüfung

22.11.2026 · Auftrag: Noah «a» (Koordinator-Vorschlag «kleine PRs nur Wächter und betroffene Seite»), «prio high»

## Was ist neu
- Ein PR bekommt je nach geänderten Dateien eine von zwei Prüfungen (`scripts/ci-scope.mjs`, kein Handgriff nötig):
  - **Schnelle Prüfung** (Ziel etwa 10 bis 15 Minuten, ein Handy-Teil): die Wächter und der Kern (`guard`, `flow`, `tippzahl`, `functions`, `heimat`, `tote-knoepfe`), dazu die Tests der betroffenen Seiten und die eigenen Tests des PRs. Das gilt für Texte, Ansicht (`.svelte`, `.css`), Tests und Doku.
  - **Volle Prüfung** (wie bisher, 5 Handy-Teile): sobald ein PR Daten, Backup, Sync, Speicherstruktur (Dexie), Import/Export, `api/`, Buchung, Build- oder Workflow-Dateien, Hilfsskripte oder etwas Unbekanntes berührt.
- Vorher lief auch bei kleinen Änderungen die volle Prüfung, sobald eine Datei geändert wurde, die jede Seite lädt (zum Beispiel `App.svelte`) oder die der Plan nicht einer Seite zuordnen konnte. Das ist jetzt die schnelle Prüfung.
- Die volle Prüfung läuft weiter jede Nacht über alles (`volle-pruefung.yml`). Ein Fehler, den die schnelle Prüfung nicht sieht, fällt dort am nächsten Morgen auf und kommt in die Wackel-Liste oder als Issue.
- Der Computer-Wächter (`e2e (desktop)`) und `build` mit den Einheitstests laufen bei jedem PR wie bisher.

## Was fällt weg oder rutscht tiefer
- Bei kleinen PRs läuft die volle Handy-Prüfung nicht mehr vor dem Merge, sondern in der Nacht danach. Neu: ein Fehler kann erst am Morgen auffallen und wird dann auf `main` behoben (oder der PR mit «zurück» zurückgenommen).

## Selbst entschieden
- «Schwer» wird an den Pfaden erkannt, nicht an einer Liste von PR-Nummern: `api/`, `src/lib/sync`, `src/lib/maintenance`, `src/lib/booking`, Dateinamen mit `db`, `backup`, `sync`, `migrat`, `snapshot`, `dexie`, `persist`, `storage`, `import`, `export`, dazu Konfiguration, `.github/`, `scripts/` und `public/`. Ein Name, der nur ähnlich aussieht (zum Beispiel `async-…`), läuft voll: lieber einmal zu viel.
- Docs, News und deutsche Texte werden weiter nur nach ihren eigenen Regeln beurteilt, auch wenn ihr Dateiname «backup» enthält.
- Dateien, die jede Seite lädt, sind bei einem kleinen PR kein Grund mehr für die volle Prüfung, weil der Kern genau diese Wege schützt (Start, Tour-Schleife, jede Funktion erreichbar).
- Keine App-Änderung, nichts Sichtbares, kein «Was ist neu»-Eintrag.

## Prüfschritte (nach dem Merge)
1. Ein PR, der nur eine Seite oder einen Text ändert, zeigt unter «e2e (phone)» nur Teil 1 mit Tests (die anderen Teile werden übersprungen) und ist nach etwa 10 bis 15 Minuten grün.
2. Ein PR, der eine Datei mit «backup», «sync» oder `api/` im Pfad ändert, startet weiter alle fünf Teile.
