# Lange Einheiten-Namen brechen um

PR #1783 · 17.11.2026 · Auftrag: Noah «alle umsetzen 1-10» (Thread «UI-Test der Seite Flow Training», Fund 7)

## Was ist neu
- In der Woche von Training (geplante und gemachte Einheiten) endet ein langer Name nicht mehr mit «…», sondern bricht auf eine zweite Zeile um. Der Knopf wird dann zweizeilig.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Der Knopf behält seine Mindesthöhe (40 px), nur das Abschneiden fällt weg. Sehr lange Wörter ohne Lücke brechen (`overflow-wrap: break-word`), damit nichts über den Rand läuft.

## Entscheide (für decisions.md)
- keine

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Aktiv › Training: eine geplante Einheit antippen, einen langen Namen geben, speichern.
2. Der Name steht ganz, auf zwei Zeilen, ohne «…».
