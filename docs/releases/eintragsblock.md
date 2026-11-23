# Eintragsblock für Mein Tag und Heute

Auftrag: Noah «1-5 a» (Thread «App an Mein-Tag-Design angleichen»), Bericht https://claude.ai/artifact/7XRsEHDQLkmU2nKDw97NBB. Schritt 2 von 6 des Design-Abgleichs mit Mein Tag.

## Was ist neu
- `src/lib/ui/EntryBlock.svelte`: ein Eintrag des Tages als Block (4 px Rand in der Farbe der Art, leicht getönter Grund, Zeit, Titel, zweite Zeile, runder Haken mit 44 px Tippfläche). Die Art: Sport, Termin, To-do, Reise, Velo-Arbeit, Spielerplus, neu Ruhe und Essen.
- `src/app.css`: zwei neue Variablen `--wk-rest` (grün) und `--wk-food` (orange), in jeder Farbwelt und im Dunkelmodus.
- Noch nichts zu sehen: der Mein-Tag-Thread und der Heute-Block (Schritt 6) nutzen den Baustein.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Der Baustein hat keine eigene Position: die Zeitleiste von Mein Tag gibt sie über `style` mit.
- Erledigt: durchgestrichen und mit der Textfarbe `--ink-2` statt durchsichtig, damit der Kontrast bleibt.
- Kein Zeitleisten-Baustein: dort bleibt Mein Tag bei seinem eigenen Raster.

## Entscheide
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Design-Abgleich Mein Tag: Schritt 2 von 6.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Nichts Sichtbares. Die App sieht aus wie vorher.
