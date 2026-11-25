# Tourenkarte: kleinere Punkte

PR folgt · 25.11.2026 · Auftrag: Noah 25.11.2026 19:40 «bei den tourenvorschlägen bildern mit der karte sind die Punkte viel zu gross. gerade auf dem handy ist das unbrauchbar. besserer Vorschlag?», Thread «Mehr schwere MTB-Touren».

## Was ist neu
- Punkte und Linien der Karte sind kleiner (Punkt etwa 3 px Radius statt 7, Ring 6 px statt 12, Linie 1,4 px). Sie bleiben auf dem Bildschirm gleich gross, auch wenn die Karte gezoomt ist (`sizes` in `src/lib/vorschlaege/karte.js`).
- Auf der ganzen Schweiz mit über 200 Startpunkten sind die Punkte nochmals etwas kleiner und es gibt keine Wetter-Ringe (zu viel Lärm). Mit dem Standardfilter «Schwierig» (etwa 130 Punkte) bleibt alles wie bisher.
- Ein Tipp auf einen Kanton (Buchstaben oder Fläche) zoomt die Karte auf diesen Kanton (`viewOf` in `karte.js`, mehrere gewählte Kantone: Rahmen um alle). Dort sind die Wetter-Ringe wieder da. Oben links steht «Ganze Schweiz» zum Zurückgehen; ein zweiter Tipp auf den Kanton geht auch zurück.
- Die Zahlenkarte (Tipp auf einen Punkt) und die Tourlinie funktionieren wie bisher, auch gezoomt.

## Was fällt weg oder rutscht tiefer
- Die Wetter-Ringe auf der ganzen Karte, wenn mehr als 200 Startpunkte angezeigt werden. Sie erscheinen nach dem Tipp auf einen Kanton oder mit einem Filter, der die Zahl senkt. Die Legende «Ring = Wetter» steht dann auch nur dort.

## Selbst entschieden
- Grenze von 200 Startpunkten für «keine Ringe»: darunter (Standardfilter) sind die Ringe lesbar, darüber nicht.
- Punktgrösse 3,2 px, auf der dichten Karte 2,6 px; unsichtbare Tipp-Fläche 8 px Radius, damit der Finger noch trifft.
- Der Zoom folgt dem Kantonsfilter, es gibt kein eigenes Zwei-Finger-Zoomen (zu viel Umbau für den ersten Schritt).

## Entscheide (eigene Datei `docs/decisions/tourenkarte-punkte.md`)
- 25.11.2026: kleinere Punkte, Zoom auf den Kanton.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung.
