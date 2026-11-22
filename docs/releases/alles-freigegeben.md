# Alles vorab freigegeben (Regel)

23.11.2026 · Auftrag: Noah «ich gebe jetzt ausdrücklich alles frei» (Thread «Weiteres Vorgehen nach dem Baustopp planen»)

## Was ist neu
- `CLAUDE.md`, Regel 3: Alles ist vorab freigegeben; jeder PR geht nach grüner Prüfung von selbst online, auch mit Daten. Backup bleibt Pflicht vor Datenänderungen.
- `docs/plan-nach-baustopp.md`: Hinweis auf die Regel.
- `docs/decisions/alles-freigegeben.md`: der Entscheid.

## Was fällt weg oder rutscht tiefer
- «ok NNN» vor dem Merge und die Einzelfreigabe für Daten, Backup, Sync, `api/`. Bleibt: Backup, Kopie-Test, volle Prüfung, «zurück», «schliessen NNN», «Ja force push NNN».

## Selbst entschieden
- Reiner Doku-PR, keine Datei unter `src/`, kein «Was ist neu»-Eintrag.
- «Backup Pflicht» heisst Kopie-Test plus frisches Backup von Noah, nicht mehr.

## Entscheide (eigene Datei `docs/decisions/alles-freigegeben.md`)
- 23.11.: alles vorab freigegeben (Noah)

## Stand im Plan (roadmap.md / vorhaben.md)
- Unverändert.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. `CLAUDE.md` auf GitHub öffnen: Regel 3 endet mit «Since 23.11.2026, 00:03 …».
