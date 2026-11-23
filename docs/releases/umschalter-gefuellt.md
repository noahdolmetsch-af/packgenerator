# Das gewählte Feld ist gefüllt

Auftrag: Noah «1-5 a» (Thread «App an Mein-Tag-Design angleichen»), Bericht https://claude.ai/artifact/7XRsEHDQLkmU2nKDw97NBB. Schritt 1 von 6 des Design-Abgleichs mit Mein Tag.

## Was ist neu
- Umschalter (`Seg.svelte`): das gewählte Feld ist in der Hauptfarbe der Farbwelt gefüllt (vorher weisser Knopf in grauer Schale). Die Farbe gleitet weiter wie bisher.
- Filter-Chips (`Seg` als Chips, `ChipChoice`, `StateChips`): der gewählte Chip ist in der Hauptfarbe gefüllt (vorher dunkel).
- Die Zahl hinter dem Namen behält auf dem gefüllten Feld die Farbe der Schrift.

## Was fällt weg oder rutscht tiefer
- nichts. Der weisse Knopf in grauer Schale fällt weg, die graue Schale bleibt.

## Selbst entschieden
- Hauptfarbe = `--hi` (Salbei: Salbeigrün, wie der Hauptknopf). Die Orts-Reiter oben (Unterstrich) und die Seiten-Chips unter den Reitern bleiben vorerst; sie ändern sich mit den Seitenkopf-PRs (3 bis 5).
- `OptionButton` (Wahlknöpfe in Fenstern) und die vielen eigenen Chips einzelner Seiten bleiben, sie nutzen schon die Akzentfarbe. Aufräumen Seite für Seite.

## Entscheide (eigene Datei `docs/decisions/umschalter-gewaehlt-gefuellt.md`)
- 23.11.2026: «gewählt» ist überall gefüllt in der Hauptfarbe (Frage 2a).

## Stand im Plan (roadmap.md / vorhaben.md)
- Design-Abgleich Mein Tag: Schritt 1 von 6.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Rückblick: im Umschalter «12 Monate · Jahr · Alle» ist das gewählte Feld gefüllt, Tippen lässt die Farbe gleiten.
2. Auswerten › Übersicht: «Woche · Monat · Jahr · Alles» ebenso.
3. Dunkelmodus (Ich › Aussehen): Schrift auf dem gefüllten Feld gut lesbar.
