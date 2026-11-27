# Kleine Pakete desselben Threads dürfen in einen PR

PR (Nummer steht im PR) · 27.11.2026 · Auftrag: Noah «a» 27.11.2026 17:38 (Thread «Regeln und Anweisungen auf neuen Stand bringen»)

## Was ist neu
- `docs/regeln.md` Block 4: kleine, freigegebene Pakete desselben Threads (zum Beispiel die drei Lichter-Teile) dürfen zusammen in einen PR. Datenänderungen und Test-Fixes bleiben einzeln.
- `CLAUDE.md` («Limits»): gleicher Punkt.
- `docs/regeln-archiv.md`: die ersetzte Fassung steht wörtlich dort.
- Nichts Sichtbares geändert, nur Regeln.

## Was fällt weg oder rutscht tiefer
- «Jeden Teil eines Bereichs (zum Beispiel Mein Tag) als eigenen PR» gilt nur noch für grössere Teile.

## Selbst entschieden
- Noahs «a» gilt für kleine Pakete desselben Threads; die ältere Regel «Mein Tag: jeder Teil ein eigener PR» (25.11.2026 20:08) habe ich nicht gestrichen, sondern auf «grössere Teile» eingeengt. Was «klein» ist, entscheidet der Thread mit dem Bündler.
- Daten-PRs und Test-Fixes bleiben einzeln, wie der Bündler es meldet und wie es schon in Block 4 stand.

## Entscheide (eigene Datei `docs/decisions/<name>.md`)
- 27.11.2026: Kleine Pakete desselben Threads zusammen – siehe `docs/decisions/pakete-buendeln.md`

## Stand im Plan (roadmap.md / vorhaben.md)
- unverändert

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Nichts zu prüfen in der App. Auf GitHub `docs/regeln.md` öffnen: Block 4 nennt «kleine Pakete desselben Threads dürfen zusammen».
