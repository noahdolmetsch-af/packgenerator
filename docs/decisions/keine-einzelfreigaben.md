# Keine Freigabe pro PR, keine Einzelfreigaben

22.11.2026 · Auftrag: Noah «b» (Antwort auf die Frage des Koordinators, ob PRs ohne «ok» online gehen dürfen; Thread «Weiteres Vorgehen nach dem Baustopp planen»)

- **Alles geht nach grüner Prüfung ohne «ok» online, auch Daten, Backup, Sync und `api/`** (Grund: Noah will alles Geplante mit weniger Aufwand durchbringen; verworfen: a «nur PRs ohne Daten gehen von selbst», c «bleibt wie bisher»).
- Er ersetzt «Claude merged nur nach Noahs ok» (CLAUDE.md, Regel 3), «Never auto-merge» und die Einzelfreigabe für Daten, Backup, Sync und `api/` (Entscheid vom 21.11.2026).
- Bleibt: Test mit der Kopie eines Backups vor einem PR mit Daten; ein frisches Backup von Noah liegt vor (Claude erinnert ihn, wenn das letzte älter als ein Tag ist); die volle Prüfung für solche PRs; «Online» erst nach grünem Deploy (bei `api/` mit Vercel «packgen» READY); «zurück» nimmt einen PR sofort zurück; «schliessen NNN» und «Ja force push NNN» bleiben.
- Selbst entschieden: «mit Backup vorher» heisst Kopie-Test plus frisches Backup von Noah, nicht mehr.
