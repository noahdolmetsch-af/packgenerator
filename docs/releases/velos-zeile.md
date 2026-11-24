# Velos: eine Zeile über den Karten

PR (offen) · 23.11.2026 · Auftrag: Noah «1-5 a» (impeccable-Prüfung der Velos-Seite, Punkt 1)

## Was ist neu
- Über den Karten steht eine Zeile: «Deine Velos 4» links, «Reihenfolge und Standard-Velo ändern» rechts (öffnet dasselbe Fenster wie bisher).
- «Werkstatt und Verlauf» ist eine einzige Zeile, solange kein Besuch da ist: «Werkstatt: noch kein Besuch · Zur Werkstatt». Mit Besuchen bleibt die Karte wie sie war.
- Über dem Namen des Velos unter den Karten steht klein «Gewähltes Velo» (bei mehreren Velos).

## Was fällt weg oder rutscht tiefer
- Die Zeile «Standard-Velo und Reihenfolge · Ändern» unter den Karten ist weg; ihr Knopf steht über den Karten.
- Das einsame «4 Velos» unter den Karten ist weg (die Zahl steht in der neuen Zeile); die Zeile mit der nächsten Tour bleibt.
- Die Karte «Werkstatt und Verlauf» ohne Besuch ist keine Karte mehr, sondern eine Zeile.

## Beitrag zu den Hauptzielen
- **Klarheit:** man sieht, dass alles unter den Karten zum gewählten Velo gehört; eine Zeile weniger.
- **Auffindbarkeit:** die Reihenfolge ändert man dort, wo die Velos stehen.
- **Leitfaden:** «das Velo im Griff haben» (Touren und Velo).

## Selbst entschieden
- Der Knopf «Reihenfolge und Standard-Velo ändern» erscheint nur bei mehr als einem Velo (wie die alte Zeile); «Gewähltes Velo» auch.
- Das Fenster der Reihenfolge wird jetzt von den Karten geöffnet (`BikeCards.svelte`), nicht mehr vom Setup.

## Entscheide
- `docs/decisions/velos-zeile.md`

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung
