# PRs ohne Daten gehen von selbst online

22.11.2026 · Auftrag: Noah «a» (erst «b», dann «oder besser a»; Antwort auf die Frage des Koordinators, ob PRs ohne «ok» online gehen dürfen; Thread «Weiteres Vorgehen nach dem Baustopp planen»)

- **PRs ohne Daten gehen nach grüner Prüfung ohne «ok» online.** Bilder, Prüfschritte und die «Online»-Meldung bekommt Noah trotzdem (Grund: weniger Wartezeit; verworfen: b «auch Daten ohne ok», c «bleibt wie bisher»).
- **Daten, Backup, Sync und `api/` brauchen weiter Noahs Einzelfreigabe** («ok NNN») und den Test mit der Kopie eines Backups; die volle Prüfung gilt für sie weiter.
- Er lockert «Claude merged nur nach Noahs ok» (CLAUDE.md, Regel 3) und «Never auto-merge» nur für PRs ohne Daten. «zurück» nimmt einen PR sofort zurück; «schliessen NNN» und «Ja force push NNN» bleiben.
- Selbst entschieden: «Daten» heisst, was `scripts/ci-scope.mjs` als schwer erkennt (Daten, Backup, Sync, Speicherstruktur, `api/`, Import/Export); im Zweifel gilt der PR als Daten-PR.
- Reihenfolge (Noah 22.11., 22:55 «warteliste nach allem anderen»): Die Warteliste kommt ganz zum Schluss, nach Wetter und Kursblick.
