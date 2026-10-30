# Gewichte gleich gezählt

PR #396 · 27.10.2026 · Auftrag: Noah 26.10.2026 20:31 «1a» alle B-Fehler aus dem UI-Test 0.205 (Thread «Testen komplette App mit Fehlerliste»)

## Was ist neu
- `src/lib/bikes/bagwords.js` nennt Taschen und Flaschenhalter getrennt («1 Tasche, 2 Flaschenhalter»); Halter stecken im Velogewicht (SetupBand, SetupTab, SetupBar, TripBike, CalmPack).
- `weightByPlace` (touren.js) legt getragene Orte zu «Am Körper» und zählt Essen und Wasser extra; die Gewichtskarte sagt «mit Essen und Wasser: X kg», WornCard zeigt dasselbe Total.
- Die Anteile im Gewichtsbalken ergeben genau 100 %; der Kleiderschrank sagt «{n} eingeordnet ({kg}), {m} noch offen». Kein Schema-Wechsel.

## Was fällt weg oder rutscht tiefer
- Die Zeile «Rücken» in der Gewichtskarte geht in «Am Körper» auf (alt: eigene Zeile «Rücken» → neu: in «Am Körper» mitgezählt).

## Selbst entschieden
- Gewichte unter 1 kg stehen in g.
- «im Velogewicht» steht in der kleinen Zeile, damit lange Namen nicht gequetscht werden.
- Die Anteile runden nach der Methode des grössten Rests, damit sie 100 % ergeben.

## Entscheide (für decisions.md)
- 27.10.2026: Gewichte gleich gezählt (UI-Test 0.205 T7), Noah «1a» alle B-Fehler.

## Stand im Plan (roadmap.md / vorhaben.md)
- UI-Test 0.205 (Ziel Alltag): T7 erledigt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Velo › Setup: Die Zeile sagt «1 Tasche, 2 Flaschenhalter», bei den Haltern steht «im Velogewicht».
2. Packe eine Tour: «Am Körper» zeigt dieselben kg wie die Gewichtskarte, die Anteile ergeben 100 %.
