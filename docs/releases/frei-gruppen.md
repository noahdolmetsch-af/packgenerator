# Freie Zeit in drei Gruppen

PR #1399 · 22.11.2026 · Auftrag: Noah «1a» (Thread «App-Landkarte»)

## Was ist neu
- Auf der Seite «Freie Zeit» (Planen › Alltag) stehen die acht Seiten unter drei Überschriften: «Für den Moment» (Impulse, Worauf hab ich Lust?, Mein Abend), «Für mich» (Was mir wesentlich ist, Meine Sammlungen, Reise-Wünsche) und «Rund ums Packen» (Erste Nacht, Fürs nächste Mal).

## Was fällt weg oder rutscht tiefer
- nichts. Jede Seite hat dieselbe Adresse und dieselben Daten; nur die Reihenfolge der Liste hat sich geändert (vorher eine Liste von Impulse bis Fürs nächste Mal).

## Selbst entschieden
- Die drei Überschriften sind feste Wegweiser der Seite, keine Gruppen mit Inhalten des Nutzers (darum ohne Umbenennen und Löschen; `PAGE_GROUPS` in `src/lib/frei.js`, `tests/frei.test.js` prüft, dass jede Seite in genau einer Gruppe steht).
- Die Überschrift «Rund ums Packen» fasst die beiden Seiten, die am Packen und an der Tour hängen.

## Entscheide
Siehe `docs/decisions/frei-gruppen.md`.

## Stand im Plan (roadmap.md / vorhaben.md)
- Freie-Zeit-Durchsicht (Noah «1a 2b 3a 4a»): Schritt 1 von 3 (Gruppen); danach Impulse und «Worauf hab ich Lust?» verlinken, dann Absprünge für Erste Nacht und Fürs nächste Mal.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Planen › Alltag › Freie Zeit öffnen: drei Überschriften über den acht Seiten.
2. «Impulse» antippen: die Seite öffnet sich wie vorher.
