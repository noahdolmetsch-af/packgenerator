# Leichter und Härter oben auf Training

PR #<Nummer> · 22.11.2026 · Schritt V4b2 (Teil 2) der neuen Ordnung · Entscheid Noah «1a» (22.11.2026 17:44), Bilder https://claude.ai/artifact/GNcF9PjPknnCyUicL7vgk4

## Was ist neu
- Woche › Training: ganz oben eine Reihe mit «Woche vorschlagen» (öffnet den Vorschlag für die Woche) und, sobald ein Wochenplan gespeichert ist, den Schaltern «Leichter», «Härter», «Regenwoche» und «Skitour-Woche».
- «Härter» ist neu: 120 % der Stunden des Wochenplans (höchstens 24), nur für die gezeigte Woche. Eine Woche ist leichter oder härter, nie beides. Auch auf der Seite «Wochenplan» gibt es «Härtere Woche».
- Jeder Schalter nimmt sich mit einem zweiten Tipp zurück; unten erscheint «Rückgängig».

## Was fällt weg oder rutscht tiefer
- Nichts. «Leichtere Woche», «Skitour-Woche» und «Regenwoche» bleiben auf der Seite «Wochenplan»; die Reihe oben ist der kürzere Weg zu denselben Schaltern.

## Selbst entschieden
- Kein neues Datenformat: «Härter» ist ein weiteres Feld (`hard`) in `mode` der Einstellung `training.weeklog`; alte Daten bleiben gültig, das Backup bleibt lesbar.
- Ohne gespeicherten Wochenplan zeigt die Reihe nur «Woche vorschlagen» und «Wochenplan einrichten ›», weil die Schalter den Wochenplan umstellen.
- Für vergangene Wochen steht nur «Woche vorschlagen» (vergangene Wochen sind eingefroren).
- «Karte «Dein Stand»» folgt als eigener PR (Teil 3).

## Entscheide (eigene Datei `docs/decisions/woche-leichter-haerter.md`)
- 22.11.2026: Leichter und Härter oben auf Training (Noah «1a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Plan «ganze App»: V4b2 Teil 2 gebaut.

## Prüfschritte (nach dem Merge, auf der echten Seite)
1. Woche › Training: oben steht die Reihe mit «Woche vorschlagen».
2. Hast du einen Wochenplan: tippe «Härter»; es ist markiert. Auf der Seite «Wochenplan» steht «Härtere Woche» markiert.
3. Tippe «Leichter»: «Härter» ist wieder aus.
