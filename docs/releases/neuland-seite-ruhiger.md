# Neuland-Seite ruhiger

PR (Nummer folgt beim Öffnen) · 27.11.2026 · Auftrag: Noah «1 2 3 4 5 6 7» (27.11.2026 17:32), Paket 2: Punkte 4, 5 und 6 und die Namen beim Mouseover (Thread «Neuland-Seite verbessern»).

## Was ist neu
- Kopf: unter dem Titel steht nur noch ein Satz («Was du zum ersten Mal erlebt hast, gefunden aus deinen Routen und Fahrten.»); «Sammlungen wählen» und «Heatmap» sind kleine Knöpfe. Die Zeile «So geht's» steht am Seitenende.
- Die Sammlungen stehen in einer Zeile (`data-nl-chips`); passt sie nicht, scrollt sie seitwärts und blendet am Rand aus; die gewählte Sammlung scrollt von selbst ins Bild. Danach folgen Karte und Liste der Sammlung, **darunter** die Fundliste (vorher stand sie davor).
- «Vielleicht gefahren: bitte bestätigen» steht oben auf der Seite, nach dem Satz «Neu 2026 …», und gilt für die Alpenpässe, auch wenn eine andere Sammlung gewählt ist.
- **Namen beim Mouseover** (Noah 27.11.2026 «bei mouseover erscheint der name der gemeinde / kanton»): am Computer zeigt die Maus auf einem Kanton, einer Gemeinde, einem Pass oder einem anderen Punkt der Neuland-Karte seinen Namen in einem kleinen Schild (`MapTip.svelte`, `tipOf` in `kartezoom.js`). Am Handy gibt es kein Mouseover; dort bleibt es beim Antippen. Die Karten «Weisse Flecken» bekommen dasselbe im nächsten PR.

## Was fällt weg oder rutscht tiefer
- Der lange Erklärtext unter dem Titel (Neu seit gestern, Neue Kilometer, OpenStreetMap einmal pro Woche) entfällt dort; die Dinge stehen an ihrem Ort (Karte «Neu seit gestern», Karte «Neue Kilometer», Hinweis bei den Türmen, Brücken und Wasserfällen).
- «So geht's» rutscht ans Seitenende; die Fundliste rutscht unter die gewählte Sammlung.

## Selbst entschieden
- «Was du hier tun kannst» ist die eine Hilfezeile unter dem Titel (Block Content first); «So geht's» bleibt als zweite ruhige Zeile am Ende der Seite, damit der Leitfaden-Einstieg erhalten bleibt.
- Die Zeile «Neu seit gestern» (grüne Karte) bleibt wie sie ist.
- Fertig-Regel: keine neue Funktion; Absprung, Hilfe und leere Zustände bleiben.

## Entscheide (eigene Datei `docs/decisions/neuland-seite-ruhiger.md`)
- 27.11.2026: Noah «1 2 3 4 5 6 7».

## Stand im Plan
Dient «Klarheit» und «Auffindbarkeit» (Block 1) und dem Leitfaden (Inhalt zuerst). Kein Plan geändert.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Neuland: unter dem Titel ein Satz, eine Zeile «Was du hier tun kannst», zwei kleine Knöpfe.
2. Die Sammlungen sind eine Zeile; am Handy scrollt sie seitwärts.
3. Alpenpässe wählen: Karte und Liste zuerst, die Fundliste darunter.
4. Am Computer: Maus auf einen Kanton der Karte halten, sein Name erscheint.
5. Ganz oben steht «2 vielleicht gefahren: bitte bestätigen» (wenn es solche gibt).
