# Abgleich sagt, wann er fertig ist

PR folgt · 1.11.2026 · Auftrag: Noah 1.11.2026 («im Frontend fehlt eine Erfolgsmeldung»)

## Was ist neu
- «Jetzt abgleichen» und das Koppeln (`src/lib/sync/SyncPanel.svelte`) zeigen danach «Fertig: X geholt, Y geschickt» oder «beide Geräte sind auf demselben Stand»; Fehler wie bisher.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Die Zahlen kommen aus dem Ergebnis von `syncNow` (`taken`, `sent`); der Sync selbst bleibt unverändert.

## Entscheide (für decisions.md)
- keine.

## Stand im Plan (roadmap.md / vorhaben.md)
- Abgleich Handy/Computer: Rückmeldung nach dem Lauf.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Daten › «Jetzt abgleichen»: danach steht eine «Fertig»-Zeile.
2. Nach dem Koppeln am zweiten Gerät steht dort, wie viele Einträge kamen.
