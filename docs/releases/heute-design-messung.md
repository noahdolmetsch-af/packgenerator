# Test heute-design: beide Knöpfe zusammen messen

PR folgt · 31.10.2026 · Auftrag: Reparatur der roten «Volle Prüfung» auf main (Koordinator 31.10.)

## Was ist neu
- Nichts in der App. Der Test `heute-design.spec.js` (Computer) maß «Startseite anpassen» und «Alle Bereiche» zu verschiedenen Zeiten. Kommt danach noch eine Kachel, rutschen beide nach unten, aber der Test verglich einen alten mit einem neuen Wert (Abstand 73 und 524 statt unter 8). Jetzt werden beide zusammen gemessen, bis die Seite ruhig ist.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Die Grenze (unter 8 px, eine Zeile am Computer) bleibt. Nur die Messung wartet, bis die Seite fertig ist.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- unverändert.

## Prüfschritte
1. Nichts in der App zu prüfen.
2. Unter Actions: «e2e-part (desktop, 2)» der Vollen Prüfung ist grün.
