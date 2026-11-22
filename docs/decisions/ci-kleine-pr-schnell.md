# Prüfung: kleine PRs schnell, schwere PRs voll

22.11.2026 · Auftrag: Noah «a» (Thread «Prüfungen so einrichten, dass main grün bleibt», Koordinator-Vorschlag a/b)

- Kleine PRs (Texte, Ansicht, Tests, Doku) bekommen nur die Wächter, den Kern und die Tests der betroffenen Seite; die volle Prüfung läuft nachts über alles (Grund: bei fast jedem PR 25 bis 70 Minuten Wartezeit; verworfen: «bleibt wie heute», b).
- PRs mit Daten, Backup, Sync, Speicherstruktur oder `api/` werden weiter bei jedem PR voll geprüft, automatisch an den geänderten Pfaden erkannt (`HEAVY` in `scripts/ci-scope.mjs`).
- Bekanntes Risiko, von Noah in Kauf genommen: Ein Fehler kann erst im Nachtlauf auffallen statt vor dem Merge. Er ersetzt den früheren Grundsatz vom 05.11.2026 («eine Datei, die jede Seite lädt, startet alles») nur für kleine PRs.
