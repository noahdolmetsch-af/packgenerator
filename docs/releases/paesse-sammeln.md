# Pässe sammeln

PR (noch offen) · 03.11.2026 · Auftrag: Noah «E und F» (Paket E, Idee 24, Thread «Bauen: Touren als Sammlung»)

## Was ist neu
- Neue Seite **Touren › Rückblick › Pässe** (`#/debrief/paesse`): Fahrten mit Linie (Strava und hochgeladene) schlagen die Pässe vor, über die sie gingen. Mit «Einsammeln» kommt das gelbe Schild (Name, Höhe, Tag) in deine Sammlung; «Alle einsammeln» nimmt alle Vorschläge.
- «Nicht gefahren» schiebt einen Vorschlag weg (mit Undo); eigene Pässe lassen sich hinzufügen, ändern (Name, Höhe, Tag) und entfernen (mit Undo).
- Der Katalog hat 28 Schweizer Pässe (`src/lib/paesse/katalog.js`). Ein Pass gilt als gefahren, wenn die Linie näher als 1,2 km an seiner Passhöhe vorbeigeht.
- Gespeichert in der Einstellung `paesse` (mit im Backup, kein neues Schema).

## Was fällt weg oder rutscht tiefer
- nichts. Im Rückblick-Hub kommt eine Zeile «Pässe» dazu.

## Selbst entschieden
- Nichts wird ohne Tippen gesammelt: die Fahrten schlagen nur vor (Regel «alles ist ein Vorschlag»).
- Koordinaten und Höhen im Katalog sind von mir aus dem Gedächtnis, ungefähr. Jeder Pass lässt sich in der Sammlung ändern; Noah kann den Katalog prüfen.
- Passnamen sind Eigennamen und gehen nicht durch `t()`. Bewegung des Schildes: keine, daher kein Thema für «Bewegung reduzieren».
- Fertig-Regel: Seite (`features.js` über featreg), Absprung (Zeile im Rückblick-Hub), Gut zu wissen (`wissen/zurueck.js`), leerer Zustand (`Empty`), «Als Nächstes» (Neuland, Heatmap).
- `docs/app-stand.md` ist noch nicht auf main (PR #742): die Zeile folgt im Sammel-Doku-PR.

## Entscheide (für decisions.md)
- nichts

## Stand im Plan
- Ideen Bewegung: Idee 24 gebaut.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Rückblick › Pässe: Vorschläge aus deinen Fahrten, «Einsammeln» legt ein gelbes Schild ab.
2. «Pass hinzufügen»: Name und Höhe eintragen, das Schild erscheint; «Ändern» und Löschen (mit Undo) gehen.
