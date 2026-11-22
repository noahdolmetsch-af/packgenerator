# «Stopps in der Nähe» gehört in der Leiste zu Touren

PR #1437 · 22.11.2026 · Auftrag: Noah «1-3» (Thread «App-Landkarte», Lücke aus der App-Landkarte)

## Was ist neu
- Auf der Seite «Stopps in der Nähe» (`#/stopps`) ist in der Leiste «Touren» markiert. Vorher war dort kein Ort markiert.

## Was fällt weg oder rutscht tiefer
- nichts. Die Adresse und die Seite bleiben gleich.

## Selbst entschieden
- «Stopps in der Nähe» gehört zu Touren (Wasser, Tankstelle, Essen um dich herum oder entlang der Strecke einer Tour); es steht in der Liste der Seiten von Touren in `placeOf` (`src/lib/nav.js`). Einen eigenen Reiter gibt es nicht, damit die Reiter von Touren gleich bleiben.
- Ein Test prüft den Ort (`tests/stops-nearby.test.js`).

## Entscheide
Keine eigene Entscheid-Datei: Es ist die Korrektur einer Lücke, keine neue Regel.

## Stand im Plan (roadmap.md / vorhaben.md)
- App-Landkarte, Lücke 1 von 3 (Noah «1-3»).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. «Stopps in der Nähe» öffnen: in der Leiste ist «Touren» markiert.
2. «Touren» tippen: die Touren-Seite öffnet sich.
