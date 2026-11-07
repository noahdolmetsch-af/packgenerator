# Weg zum Ziel: Probefahrten (K4)

PR # · 07.11.2026 · Auftrag: Noah «3a» (Meilenstein-Leiste 50/100/200 km), Thread «Entwerfen Weg zum grossen Ziel»

## Was ist neu
- Neue Schrittart **Probefahrten** (`src/lib/weg/types/proben.js`): drei Schritte «Probefahrt: 50 km» (70 Tage vor dem Start), «100 km» (42 Tage), «200 km» (21 Tage). Ein freies Ziel bekommt nur 50 und 100 km.
- Ein Streifen «Probefahrten» mit drei Kreisen über der Zeitlinie, dazu «Längste Fahrt bisher: 87 km». Ein Tipp auf einen Kreis hakt von Hand ab oder nimmt zurück.
- Eine einzige Fahrt von mindestens dieser Länge (Strava oder die gezählten Velofahrten) hakt den Schritt von selbst ab. Gezählt wird, was in den 150 Tagen vor dem Start gefahren wurde, nicht am Starttag selbst; ohne Starttag die letzten 150 Tage bis heute. Eine Fahrt zählt für jeden Kreis, den sie erreicht. Zwei Fahrten werden nicht zusammengezählt.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Ein Kreis, den du abgewählt hast, wird nie wieder von selbst abgehakt (Regel von `applyAuto`).
- Die drei Abstände (70, 42, 21 Tage) und die Längen sind Vorschläge; jeder Schritt lässt sich umbenennen, verschieben und löschen.
- Es wird nichts gespeichert: der Streifen wird aus den Schritten und den Fahrten berechnet, daher kein Eingriff in Datenhaltung oder Backup.
- Fertig-Regel: Seite und Absprung gehören zu «Weg zum Ziel» (#1070). «Gut zu wissen» entfällt (die Seite hat keine Karte «Was du hier tun kannst»).

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Idee G: «3a» gebaut; als Nächstes Erholungsschritte (4e), Wetterfenster (4a), Rückblick (5a/5e/5c).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Weg zum Ziel › «Neuer Weg»: Schritte der Probefahrten angehakt lassen, anlegen.
2. Über der Zeitlinie stehen drei Kreise 50 / 100 / 200 km mit ihren Tagen.
3. Einen Kreis antippen: er wird grün mit Haken; nochmals antippen nimmt ihn zurück.
