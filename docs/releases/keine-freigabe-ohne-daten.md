# PRs ohne Daten gehen von selbst online (Regel)

22.11.2026 · Auftrag: Noah «a» (Thread «Weiteres Vorgehen nach dem Baustopp planen»)

## Was ist neu
- `CLAUDE.md`, Regel 3: Ein PR ohne Daten geht nach grüner Prüfung von selbst online; Daten, Backup, Sync und `api/` behalten die Einzelfreigabe.
- `docs/plan-nach-baustopp.md`: Hinweis auf die Regel, «(Halt)» bei Runde 1 korrigiert.
- `docs/decisions/keine-freigabe-ohne-daten.md`: der Entscheid.

## Was fällt weg oder rutscht tiefer
- Bei PRs ohne Daten: «ok NNN» vor dem Merge. Bilder, Prüfschritte und «Online»-Meldung bleiben.

## Selbst entschieden
- Reiner Doku-PR, keine Datei unter `src/`, kein «Was ist neu»-Eintrag.
- Was als Daten gilt, bestimmt `scripts/ci-scope.mjs`; im Zweifel Daten-PR.

## Entscheide (eigene Datei `docs/decisions/keine-freigabe-ohne-daten.md`)
- 22.11.: PRs ohne Daten gehen von selbst online (Noah «a»)

## Stand im Plan (roadmap.md / vorhaben.md)
- Unverändert.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. `CLAUDE.md` auf GitHub öffnen: Regel 3 endet mit «Since 22.11.2026 (Noah «a», 22:48) …».
