# Rückgängig statt Undo

PR #1783 · 19.11.2026 · Auftrag: Noah «mache einen kompletten test der website … behebe dabei kleine fehler direkt» (Thread «Ganze Website testen und Fehler beheben»)

## Was ist neu
- Vier alte Zeilen unter Ich › Was ist neu (`src/lib/whatsnew-alt-de.js`) hatten im deutschen Text das englische Wort «Undo»: «mit Ändern und Undo», «Grund und Undo pro Zeile», «sofort, mit Undo», «Teile zwischen Taschen verschieben, mit Undo». Sie sagen jetzt «Rückgängig» wie `docs/namen.md` und der Rest der App.
- Ein Suchlauf über alle deutschen Texte (News, `i18n/de`, Wissen) fand kein weiteres «Undo» in deutschem Text.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Nur der deutsche Text geändert; die englischen Schlüssel bleiben (sie werden in der Sprache Englisch gezeigt).

## Entscheide (für decisions.md)
- keine

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Was ist neu: nach «Undo» suchen: nichts gefunden.
2. Nach «Teile zwischen Taschen» suchen: die Zeile endet mit «mit Rückgängig».
