# Kurspunkte für den Garmin

PR #<Nummer> · 23.11.2026 · Auftrag: Noah «P1 und p2 k1 k2 k3 u1 u2 r1 r2 r3» (Thread «Bikepacking-Rennen: Stand und Ideen zeigen»), Vorschlag P1 (gehört zu U2)

## Was ist neu
- Neben dem Knopf «GPX mit n Stopps» (bei der Route, unter Verpflegung, auf der Rennkarte) steht der Knopf «FIT-Kurs mit n Kurspunkten». Er speichert die Route als FIT-Kurs für den Garmin Edge 850 und 1040, mit den gewählten Orten (Läden, Wasser, Essen, Betten …) als Kurspunkte. Der Edge meldet sie unterwegs («Wasser in 12 km»), auch bei ausgeschaltetem Handy.
- Die Orte sind dieselben wie beim GPX: die gleichen Chips wählen, welche Arten mitkommen. Wasser wird als «Wasser», Läden, Essen und Tanken als «Essen» gemeldet, alles andere als allgemeiner Punkt.
- Technik: `toFit(..., { coursePoints })` schreibt FIT-Nachricht 32 (course_point), `coursePointsOf` setzt jeden Ort auf den nächsten Punkt der Linie. Mit einem unabhängigen FIT-Leser (fitdecode) gelesen.

## Was fällt weg oder rutscht tiefer
- nichts. Der GPX-Knopf, «GPX in FIT oder KML umwandeln» und die Garmin-Seiten bleiben, wie sie sind.

## Selbst entschieden
- Ein Ort, der mehr als 1.5 km von der Linie liegt, kommt nicht mit (er liegt nicht am Weg). Höchstens 100 Kurspunkte (Grenze des Edge), nach km sortiert.
- Der Knopf steht nur, wenn Orte da sind (sonst bleibt es beim GPX der Route); die Leerzeile erklärt dort schon, wie Orte geladen werden.
- Pässe und Anstiege als Kurspunkte («Pass Furka 2’429 m» im Mockup) sind nicht dabei: sie kommen als eigene kleine Änderung, sobald klar ist, was der Thread «Live-Navigation» an der Garmin-Datei ändert.
- Namen werden auf 15 Zeichen gekürzt (FIT-Grenze), nie mitten in einem Buchstaben.
- Wegen der Route mit Abbiegepunkten im Thread «Live-Navigation»: gleiche Funktion `toFit`, deshalb als kleine, getrennte Änderung gebaut (nur ein neuer Parameter und eine neue Nachricht).

## Entscheide (eigene Datei `docs/decisions/garmin-kurspunkte.md`)
- 23.11.2026: Kurspunkte als FIT-Kurs, alle neun Vorschläge freigegeben

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Verpflegung öffnen, eine Tour mit Route wählen, Orte von OpenStreetMap laden.
2. Unter den Stopps stehen «GPX mit n Stopps» und neu «FIT-Kurs mit n Kurspunkten». Den neuen Knopf tippen: eine .fit-Datei wird gespeichert (am Handy öffnet sich «Teilen»).
3. Die Datei in den Ordner «NewFiles» des Edge kopieren und als Kurs öffnen: die Orte werden unterwegs gemeldet.
