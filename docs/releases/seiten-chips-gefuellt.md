# Die gewählte Seite unter den Reitern ist gefüllt

Auftrag: Noah «1-5 a» (Thread «App an Mein-Tag-Design angleichen»), Bericht https://claude.ai/artifact/7XRsEHDQLkmU2nKDw97NBB. Schritt 3 von 6 des Design-Abgleichs mit Mein Tag.

## Was ist neu
- `PlaceTabs.svelte`: der Chip der Seite, auf der man ist (unter den Reitern von Woche, Touren, Velos und Auswerten), ist in der Farbe des Ortes gefüllt, die Schrift in `--pc-ink`. Vorher nur ein Rand und fette Schrift. Ein Zähler (zum Beispiel «Eingang 2») bleibt lesbar.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Die Reiter-Zeile (Unterstrich) bleibt: sie ist die Ebene des Ortes, die Chips sind die Ebene der Seite.
- Der knappe Kopf (ein Satz, Hilfezeile geschlossen) kommt seitenweise in den nächsten PRs, weil jeder Satz zu seiner Seite gehört. Dieser PR ändert nur die Chips, an einer Stelle für alle Orte.

## Entscheide
- keine neuen (siehe `docs/decisions/umschalter-gewaehlt-gefuellt.md`)

## Stand im Plan (roadmap.md / vorhaben.md)
- Design-Abgleich Mein Tag: Schritt 3 von 6.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auswerten › Übersicht: «Übersicht» unter den Reitern ist gefüllt, «Fragen» antippen wechselt die Füllung.
2. Woche › Notizen: «Eingang» mit Zähler, gewählt: Zahl gut lesbar.
3. Touren und Velos: gleiches Bild.
