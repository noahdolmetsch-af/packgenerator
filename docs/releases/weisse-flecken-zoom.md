# Weisse Flecken: Zoom und Namen beim Darüberfahren

PR (Nummer folgt beim Öffnen) · 27.11.2026 · Auftrag: Noah «karte zoombar. gibt es dazu bereits bilder?» (Karte «Weisse Flecken in der Nähe») und «bei mouseover erscheint der name der gemeinde / kanton» (Thread «Neuland-Seite verbessern»).

## Was ist neu
- Die Karte «Weisse Flecken in der Nähe» (Touren › Träume) zoomt wie die Neuland-Karte: Knöpfe + − «Ganze Karte», Ctrl und Mausrad, zwei Finger, doppeltes Tippen, Ziehen, ganzer Bildschirm. Gemeindegrenzen und der Punkt «Zu Hause» behalten ihre Grösse (`src/lib/neuland/kartezoom.svelte.js`, `ZoomBox.svelte`, `WhiteSpots.svelte`).
- Ein Tipp auf eine Gemeinde in der Liste «Am nächsten, noch nie besucht» lässt die Karte dorthin zoomen und färbt sie ein.
- Die Karte ist höher (am Laptop bis 520 statt 360 Pixel).
- Die Maus auf einer Gemeinde, einem Kanton oder einem Punkt zeigt deren Namen (`MapTip.svelte`, `data-name`): hier neu auf der Karte «Weisse Flecken»; auf der Neuland-Karte gibt es das seit dem PR «Neuland-Seite ruhiger» (#1852).

## Was fällt weg oder rutscht tiefer
- Nichts.

## Selbst entschieden
- Namen beim Darüberfahren nur mit der Maus; am Handy bleibt es beim Tipp.
- Der Zoom der Weissen Flecken ist eine zweite Umsetzung neben `NeulandMap.svelte` (gleiche Regeln aus `kartezoom.js`); beide später zusammenzuführen ist ein eigenes Paket.
- Fertig-Regel: Ausbau von `f.whitespots`, keine neue Funktion.

## Entscheide (eigene Datei `docs/decisions/weisse-flecken-zoom.md`)
- 27.11.2026: Noah zu Zoom und Namen.

## Stand im Plan
Dient «Klarheit» und «Auffindbarkeit» (Block 1). Kein Plan geändert.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Träume › «Weisse Flecken in der Nähe»: dreimal «+», die Karte zoomt hinein.
2. Mit der Maus über eine Gemeinde fahren: der Name erscheint.
3. In der Liste einen Ort antippen: die Karte springt dorthin.
4. Neuland: Maus über einen Kanton: der Name erscheint.
