# Neue Sammlungen: Aussichtstürme, Hängebrücken, Wasserfälle

PR (diese Änderung) · 28.10.2026 · Auftrag: Noah «1-5 a» (Thread «Träume und Neuland prominent machen»), Idee N18

## Was ist neu
- Neuland hat drei neue Sammlungen: «Aussichtstürme», «Hängebrücken» und «Wasserfälle» der Schweiz (`src/lib/neuland/neuland.js`).
- Die Orte kommen aus OpenStreetMap (ODbL). Ein Tipp auf «Aus OpenStreetMap laden» holt sie einmal vom freien Overpass-Dienst (`src/lib/neuland/osm.js`); danach liegen sie auf dem Gerät und gehen offline. Gesendet wird nur die Art des Orts und «Schweiz».
- Deine Routen und Fahrten haken sie ab wie Pässe oder Seen (Turm und Brücke etwa 200 m, Wasserfall 300 m). «Herausforderungen mit Ende» kennen die drei auch.
- Quellenzeile mit Datum und «Neu laden». Neue Funktion im Katalog: `f.osmsets`.

## Was fällt weg oder rutscht tiefer
- Neuland: die Sammlungs-Knöpfe bekommen drei mehr; die Liste der Sammlungen wird etwas länger. Sonst nichts.

## Selbst entschieden
- Laden nur auf Tipp, nicht automatisch: kein Datenverkehr ohne Zustimmung, null Kosten.
- Die geladene Liste liegt in `db.meta` und nicht im Backup (ein Tipp holt sie wieder); Haken von Hand sind im Backup wie bisher.
- Gleichnamige Orte näher als 500 m zählen als einer (eine Brücke ist oft in mehreren Stücken gezeichnet).

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- «Träume und Neuland»: Schritt 18 von 20 (N18). Als Nächstes N10 «Eine Fundliste».

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Rückblick › Neuland: «Wasserfälle» wählen und «Aus OpenStreetMap laden» tippen.
2. Die Liste füllt sich; ein Wasserfall an einer deiner Routen ist abgehakt.
3. Unten steht «Orte © OpenStreetMap-Mitwirkende (ODbL)» mit Datum.
