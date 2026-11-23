# Material: Prüfungen nach «Material aufräumen» repariert

23.11.2026 · Auftrag: Bündler «main ist wieder rot, Part 4» (Thread «Velos und Material aufräumen»)

Kein sichtbarer Unterschied in der App, darum keine News-Datei (Patch-Nummer).

## Was ist neu
- nichts in der App. Zwei Prüfungen auf main sind wieder grün.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- `tests/e2e/sk.spec.js` liest die Kacheln von Material aus `src/lib/sk/pages.js` Zeile für Zeile. Der Kommentar hinter der Zeile
  `gear:` (aus «Material aufräumen») machte die Zeile für die Prüfung unlesbar. Er steht jetzt eine Zeile darüber, die Kacheln
  sind unverändert.
- `tests/e2e/sn-c.spec.js` (Bausteine prüfen): Seit «Pfad aus einer Quelle» (#1526) nennt der Pfad den Reiter der Seitenleiste
  («Velos und Material › Sets › Prüfen»), nicht mehr «Bausteine». Die Prüfung schaut weiter, dass der Pfad zu `#/blocks`
  zurückführt; nichts gelockert.
- Keine Datenänderung.

## Entscheide
- Keine neue.

## Stand im Plan (roadmap.md / vorhaben.md)
- unverändert.

## Prüfschritte
1. Material öffnen, ganz unten: die Kacheln «Vorlagen» und «Packen» stehen wie bisher.
2. «Bausteine prüfen» öffnen: der Pfad oben führt mit «Sets» zurück zu den Bausteinen.
