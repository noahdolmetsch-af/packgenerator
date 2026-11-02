# Gut zu wissen beim Packen (Wegweiser 16: Inhalte Packen)

PR #… · 02.11.2026 · Auftrag: Noah «1-5a» (Inhalte, Claude schreibt das Wissen, kurz mit etwas Humor) und Plan «freigabe» Schritt 1–26 (Thread «Entdeckbarkeit versteckter Funktionen planen»)

## Was ist neu
- Die Karte «Was du hier tun kannst» mit «Gut zu wissen» erscheint auf 8 Seiten des Bereichs Packen: Packen, Vorlagen, Bausteine, Packliste aufräumen, Bausteine prüfen, Rucksack-Check (Skitour), Kisten-Etiketten, Checks pro Tour-Art.
- 46 neue Wissens-Texte (`src/lib/wissen/packen.js`, Deutsch in `src/lib/i18n/de/wissen-packen.js`): Schichten, Gewicht, Laden, Plan B, Wasser unterwegs, Reparatur.

## Was fällt weg oder rutscht tiefer
- nichts fällt weg. Auf Packen startet die Karte zugeklappt als eine Zeile (die Packliste bleibt oben; ein Tipp öffnet sie). Auf den anderen 7 Seiten rutscht der Inhalt um die Karte tiefer, bis man sie mit × zuklappt (pro Seite gespeichert). Auf Packen hat die Karte 36 Funktionen; sichtbar sind 4, der Rest hinter «Alle 36 zeigen».

## Selbst entschieden
- «Vergangene Touren» (`#/pack/past`) gehört zum Bereich Zurück und bleibt für jenen Schritt.
- Velos-Kleider (`#/wardrobe`) gehört zum Bereich Velo.
- Im Test «nichts auf nicht eingeschalteten Seiten» steht jetzt eine leere Seitenliste statt Packen als Beispiel.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Vorhaben 17 «Wegweiser statt Katalog»: Schritt 16 von 26.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Packen öffnen: oben steht eine Zeile «Was du hier tun kannst». Antippen: die Karte geht auf, jede Funktion mit «Gut zu wissen».
2. Packen › Vorlagen öffnen: dort ist die Karte offen. × antippen: sie wird eine Zeile, auch nach dem Neuladen.
