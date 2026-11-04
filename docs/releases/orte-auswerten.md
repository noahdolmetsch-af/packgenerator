# Orte nach Auswerten

PR #? · 04.11.2026 · Auftrag: Noah «1a 2a 3a 4a 5a» (Thread «Untersuchen: Aktiv und Auswerten besser einbauen»), Schritt 4 von 9

## Was ist neu
- Heatmap, Neuland, Gelernt und Jahr sind Seiten des Ortes Auswerten (Tabs in `PLACE_TABS.analysis`). Die Adressen bleiben (`#/heatmap`, `#/neuland`, `#/gelernt`, `#/jahr`).
- In «Alle n» von Auswerten stehen Heatmap, Neuland und Jahr in der Gruppe «Was habe ich gemacht?», Gelernt in «Was habe ich gelernt?».
- Der Pfad auf Heatmap und Neuland heisst «‹ Auswerten» statt «‹ Touren › Rückblick».

## Was fällt weg oder rutscht tiefer
- In Touren › Rückblick stehen die vier Seiten nicht mehr als eigene Seiten des Ortes Touren. Die Knöpfe und Zeilen dorthin bleiben, sie öffnen die Seiten jetzt im Ort Auswerten. Der Tab «Rückblick» leuchtet auf diesen Seiten nicht mehr.

## Selbst entschieden
- Neuland steht in «Was habe ich gemacht?» (wo du zum ersten Mal warst), nicht bei «gelernt».
- Neuer Tab-Name «Jahr» für «Dein Jahr als Bildgeschichte» (kurz für die Leiste); die Seite selbst heisst weiter wie bisher.
- Die Pfade von Gelernt und Jahr sind unverändert (beide haben keinen).
- Keine neue Funktion in `features.js`; Zeilen der vier Seiten in `docs/app-stand.md` ergänzt (Ort Auswerten).
- `tests/fuenforte.test.js`: höchstens 16 Tabs in Auswerten (vorher 12), «neuland» zählt nicht mehr als «kommt später».

## Stand im Plan
- Aktiv und Auswerten: Schritt 4 (vier Seiten nach Auswerten) gebaut.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auswerten öffnen, «Alle 16» tippen: Heatmap, Neuland, Gelernt und Jahr stehen in den Gruppen.
2. Touren › Rückblick öffnen, «Heatmap» tippen: die Seite öffnet sich, oben steht «‹ Auswerten».
3. Auf Heatmap «Neuland» tippen: Neuland öffnet sich, ebenfalls in Auswerten.
