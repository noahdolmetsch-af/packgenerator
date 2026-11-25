# Navigation schlanker: ein Ort, ein Reiter, eine Seite, jedes nur einmal

PR (offen) · 25.11.2026 · Auftrag: Noah «was ja» (24.11.2026, Bild «Mein Tag»), Entwurf mit Bildern freigegeben am 25.11.2026 (Thread «App mit impeccable schöner machen»). Stützt Klarheit.

## Was ist neu
- Die Pfad-Zeile («Woche › Mein Tag») steht nur noch, wenn die Seite einen eigenen, tieferen Titel hat. Wo Leiste, Reiter und Chips Ort, Reiter und Seite schon nennen, fehlt sie.
- Die Seitenleiste am Computer nennt die Unterseite unter dem markierten Reiter («Mein Tag» unter «Woche») und markiert sie; der Reiter «Woche» ist dann nicht mehr fett.
- Das «i» des Reiters steht am Ende der Chips statt in einer eigenen Zeile; wo es keine Chips gibt, bleibt es in der Pfad-Zeile.
- Am Computer beginnt die Seite 32 Punkte höher, direkt unter den zwei runden Symbolen.

## Was fällt weg oder rutscht tiefer
- Die Zeile «Woche › Mein Tag» (und gleiche Zeilen, wo der Titel nur der Name des Ortes, des Reiters oder eines Chips ist).
- Das «i» in der eigenen Zeile, wo Chips da sind.

## Selbst entschieden
- Die Chips bleiben am Computer stehen (die grössere Variante «Chips nur in der Seitenleiste» baut etwa 24 Tests um; Noah wählte die leichte).
- Das «i» folgt dem Schalter «Pfad» in Ich › Darstellung (aus = auch das «i» am Reiter weg).
- Die zwei runden schwebenden Knöpfe im Screenshot sind Browser-Erweiterungen, nicht die App.

## Entscheide (eigene Datei `docs/decisions/navigation-schlank.md`)
- 25.11.2026: leichte Variante (Noah, Knopf «Freigeben (leicht)»).

## Stand im Plan (roadmap.md / vorhaben.md)
- impeccable ganze App: Navigation schlanker gebaut.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Öffne Planen › Woche › Mein Tag: keine Zeile «Woche › Mein Tag».
2. Am Computer steht «Mein Tag» in der Seitenleiste unter «Woche» und ist markiert.
3. Planen › Woche: die Zeile «Woche › Diese Woche» steht noch.
