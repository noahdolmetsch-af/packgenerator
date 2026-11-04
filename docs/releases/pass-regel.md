# Eine Regel für Pässe

PR (noch offen) · 04.11.2026 · Auftrag: Noah «1a 2a 3a 4b 5a» (Thread «Plane Entdecken und Sammeln»), Schritt 2 der Reihenfolge

## Was ist neu
- Neue Datei `src/lib/passregel.js`: **bis 600 m** von der Passhöhe ist ein sicherer Treffer, **bis 1,2 km** heisst «bitte bestätigen», weiter weg ist es kein Treffer.
- **Pässe sammeln** (`#/debrief/paesse`): jeder Vorschlag kennt jetzt seinen Abstand. Bei einem knappen Treffer steht «Bitte bestätigen: die Linie ging … m neben der Passhöhe vorbei» und der Knopf heisst «Ja, gefahren». «Alle einsammeln» nimmt nur die sicheren («Alle sicheren einsammeln», wenn es auch knappe gibt).
- **Neuland › Alpenpässe**: ein Pass, an dem die Linie zwischen 600 m und 1,2 km vorbeiging, steht in der Box «vielleicht gefahren: bitte bestätigen» (`MaybeList.svelte`, `vielleicht.js`) mit «Ja, ich war dort» (zählt, mit dem Tag der Fahrt) und «Nicht dort» (kommt nicht wieder). Nichts zählt von selbst.
- Eine Zeile unter der Liste sagt die Regel in Worten.

## Was fällt weg oder rutscht tiefer
- «Alle einsammeln» nimmt knappe Pässe nicht mehr mit; man bestätigt sie einzeln. Vorher kamen alle Treffer bis 1,2 km auf einmal in die Sammlung.
- Neuland: wo vorher gar nichts stand, kann über der Liste eine Box stehen (nur wenn es knappe Treffer gibt).

## Selbst entschieden
- Neuland zählte schon bis 600 m; daran ändert sich nichts. Neu ist nur die Stufe darüber. «Pässe sammeln» schlug schon bis 1,2 km vor; neu ist die Kennzeichnung «bitte bestätigen».
- Gipfelbuch und Tourenpass bleiben unverändert: das Gipfelbuch sucht den höchsten Punkt einer Fahrt, der Tourenpass stempelt Touren. Beides sind keine Pass-Erkennungen im selben Sinn.
- Die beiden Sammlungen (Neuland: 130 Pässe, Pässe sammeln: 28 Pässe mit Schild) bleiben getrennt; sie teilen jetzt die Regel, nicht die Liste. Eine gemeinsame Liste wäre ein eigener, grösserer Schritt.
- «Nicht dort» nutzt dasselbe «nicht dort» wie bei gefundenen Orten (`state.nope`), kein neues Datenformat.

## Entscheide (für decisions.md)
- 04.11.2026: Pässe zählen überall mit einer Regel: bis 600 m sicher, bis 1,2 km bestätigen (Noah «1a»).

## Stand im Plan
- Entdecken und Sammeln: Schritt 2 von 7 (Eine Regel für Pässe). Als Nächstes «Verschiedene Wege zum selben Ziel».

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Rückblick › Pässe: ein Pass mit «Bitte bestätigen» zeigt den Abstand in Metern; «Ja, gefahren» legt das Schild ab.
2. Neuland › Alpenpässe: die Box «vielleicht gefahren» mit «Ja, ich war dort» und «Nicht dort».
