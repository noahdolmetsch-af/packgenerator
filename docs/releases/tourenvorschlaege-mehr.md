# Tourenvorschläge: dreimal so viele Touren

PR folgt · 24.11.2026 · Auftrag: Noah «ziel 3 mal so viele touren», Thread «Mehr schwere MTB-Touren».

## Was ist neu
- Alle Etappen des offiziellen Netzes «Mountainbikeland Schweiz» (SchweizMobil, Open Government Data) mit Kanton: 470 statt 200. Die ersten 200 bleiben unverändert (gleiche Nummern, Titel, Daten) in `netz.js`; die übrigen 270 stehen in `netz-mehr.js`, damit keine Datei die 3-MB-Grenze erreicht (jede etwa 1,1 MB). Beide laden erst, wenn die Seite aufgeht.
- Tagestouren: zwei oder drei aufeinanderfolgende Etappen derselben Route (Etappennummern in Folge, Ende und Start höchstens 600 m auseinander) ergeben eine längere Tour (164 Stück, `src/lib/vorschlaege/tage.js`). Sie brauchen keine eigenen Daten: Linie, Höhen und Untergrund der Etappen werden beim Laden zusammengesetzt. Titel «Start der ersten → Ziel der letzten», Kilometer, Aufstieg und Abstieg als Summe, Kondition und Technik wie die schwerste Etappe, Kanton und Entfernung von der ersten. Unter dem Titel steht «2 Etappen» oder «3 Etappen».
- Zusammen 634 Touren. Im Standard («Kondition: Schwierig») sind es 263 statt 131; mit «Mittel» und «Leicht» alle 634.

## Was fällt weg oder rutscht tiefer
- nichts. Die Standard-Liste ist länger (mehr schwere Touren); Etappen mit unbekannter Kondition zählen wie «Leicht».

## Selbst entschieden
- Etappen ohne Kanton in den Daten (6) fehlen, weil Filter, Karte und Wetter den Kanton brauchen.
- Tagestouren höchstens aus drei Etappen: längere Ketten gibt es nur bei wenigen Routen und sie würden für einen Tag zu lang.
- Die Kette bricht, wenn der Kilometerabstand zwischen Ende und Start über 600 m liegt (zum Beispiel Hin- und Rückweg an verschiedenen Orten).
- Das Wetter fragt jetzt mehr Zellen an einmal an (alle Startpunkte); es gehen weiter nur Tourkoordinaten hinaus.
- Daten bauen: `python3 -I scripts/vorschlaege/build-netz.py mountainbikeland_2056.gpkg canton-cache.json src/lib/vorschlaege/data` schreibt beide Dateien.

## Entscheide (eigene Datei `docs/decisions/tourenvorschlaege-mehr.md`)
- 24.11.2026: dreimal so viele Touren; erster Schritt SchweizMobil vollständig plus Tagestouren.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung.
