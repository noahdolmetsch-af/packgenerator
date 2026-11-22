# Keine Freigabe pro PR (Regel)

22.11.2026 · Auftrag: Noah «b» (Thread «Weiteres Vorgehen nach dem Baustopp planen»)

## Was ist neu
- `CLAUDE.md`, Regel 3: PRs gehen nach grüner Prüfung von selbst online, auch mit Daten; die Einzelfreigabe entfällt.
- `docs/plan-nach-baustopp.md`: Hinweis auf die neue Regel, «(Halt)» bei Runde 1 korrigiert.
- `docs/decisions/keine-einzelfreigaben.md`: der Entscheid.

## Was fällt weg oder rutscht tiefer
- «ok NNN» vor dem Merge und die Einzelfreigabe für Daten, Backup, Sync, `api/`. Sicherungen bleiben: Kopie-Test, frisches Backup, volle Prüfung, «zurück».

## Selbst entschieden
- Reiner Doku-PR, keine Datei unter `src/`, kein «Was ist neu»-Eintrag.
- «Mit Backup vorher» heisst Kopie-Test plus frisches Backup von Noah.

## Entscheide (eigene Datei `docs/decisions/keine-einzelfreigaben.md`)
- 22.11.: keine Freigabe pro PR mehr (Noah «b»)

## Stand im Plan (roadmap.md / vorhaben.md)
- Unverändert.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. `CLAUDE.md` auf GitHub öffnen: Regel 3 endet mit «Since 22.11.2026 (Noah «b», 22:48) …».
