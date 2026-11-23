# Die Zeile «Mit OsmAnd fahren» sitzt wie die anderen

PR #<Nummer> · 23.11.2026 · Auftrag: Noah «1a» (Thread «Live-Navigation»), Nachbesserung zu «Mit OsmAnd fahren»

## Was ist neu
- Auf der Karte «Bereit für unterwegs?» steht die Zeile «Lieber mit OsmAnd fahren?» jetzt wie die beiden Zeilen darüber: Symbol links, Titel und Erklärung untereinander, der Knopf rechts. Vorher liefen Titel, Erklärung und Meldung ineinander, weil die Zeilenformate nur für die Karte selbst galten.

## Was fällt weg oder rutscht tiefer
- nichts. Nur das Aussehen der Zeile ändert sich.

## Selbst entschieden
- Die Formate stehen noch einmal in der Datei der Zeile (`OsmandHandoff.svelte`), weil Svelte sie sonst nur der Karte gibt.

## Entscheide
- keine

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Live-Seite einer Tour mit Strecke öffnen, zur Karte «Bereit für unterwegs?» scrollen.
2. Die Zeile «Lieber mit OsmAnd fahren?» hat das gleiche Bild wie die Zeilen darüber: Knopf rechts, Text links.
