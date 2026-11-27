# Neue Kilometer auf der Karte

PR (Nummer folgt beim Öffnen) · 27.11.2026 · Auftrag: Noah «1 2 3 4 5 6 7» (27.11.2026 17:32), Punkt 7 (Thread «Neuland-Seite verbessern»).

## Was ist neu
- Die Karte «Neue Kilometer» (am Ende von Neuland) hat unter den Jahresbalken den Teil «Wo es neu war»: Chips für jedes Jahr und «Alle Jahre», darunter eine zoombare Karte mit den Strecken, die du zum ersten Mal gefahren bist, und darunter «{km} km neu · Jahr».
- `newKmOf(lines, { segments: true })` gibt je Fahrt auch die neuen Strecken als Linien zurück (`segs`), `newSegments(lines, byId, year)` sammelt sie für ein Jahr; ohne `segments` bleibt alles wie vorher (gleiche Zahlen).
- `NeulandMap` hat eine zweite Linienebene `newLines` (kräftig, Akzentfarbe; Breite wächst beim Zoomen nur wenig).

## Was fällt weg oder rutscht tiefer
- Nichts fällt weg. «Letzte Fahrten mit neuen km» rutscht unter die neue Karte.

## Selbst entschieden
- Platz am Seitenende in der bestehenden Karte (Content first), kein neuer Block oben.
- Ausschnitt: Schweiz ab 80 % der Punkte dort, sonst auf die mittleren 90 % der Punkte zentriert.
- Fertig-Regel: keine neue Funktion, sondern ein Teil von «Neue Kilometer» (Absprung, Hilfe, leerer Zustand gelten weiter: ohne neue Strecken steht die Karte nicht da).

## Entscheide (eigene Datei `docs/decisions/neue-km-karte.md`)
- 27.11.2026: Noah «1 2 3 4 5 6 7».

## Stand im Plan
Dient «Klarheit» und «Auffindbarkeit» (Block 1). Kein Plan geändert.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Neuland, ans Ende scrollen: Karte «Neue Kilometer».
2. Unter «Wo es neu war» ein Jahr antippen: die neuen Strecken dieses Jahres.
3. «Alle Jahre»: alle neuen Strecken; mit + hineinzoomen.
