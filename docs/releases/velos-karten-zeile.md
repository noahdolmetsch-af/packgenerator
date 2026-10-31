# Velo-Karten: die kleine Zeile wird nicht mehr abgeschnitten

31.10.2026 · Auftrag: Koordinator (Handy-Tests Velos rot auf main)

## Was ist neu
- Auf schmalen Handys (320 px) wird die Zeile «Typ · km» unter dem Velo-Namen nicht mehr mit «…» abgeschnitten, sondern bricht um (`src/lib/bikes/SetupBand.svelte`). Ursache war #439 «Velos als Karten», nicht #464.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Umbrechen statt kürzen; die Karte darf dafür etwas höher werden.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Velos öffnen: Typ und km unter jedem Namen sind ganz lesbar.
2. Fenster schmal machen: die Zeile bricht um.
