# Test «Eingang Abgelegt» am Monatsanfang

Auftrag: Koordinator (Thread «Merge-Stau abbauen und Tests stabilisieren»), Handy-Teil 5 rot bei mehreren PRs. Nichts Sichtbares in der App.

## Was ist neu
- `tests/e2e/v0471.spec.js` («Ich» zeigt einen Punkt, der Eingang ist neueste zuerst): klappt vor dem Zählen alle Monate in «Abgelegt» auf.
- Ursache: «Abgelegt» zeigt nur den neuesten Monat offen. Die Test-Notizen sind von heute, vor 2 und vor 3 Tagen. Am 1. bis 3. eines Monats liegen die zwei älteren im Vormonat und sind zugeklappt, der Test sah 1 statt 3 Zeilen. Ab dem 1.11.2026 rot, vorher grün.
- Die App ist in Ordnung: ältere Monate zugeklappt zu lassen ist gewollt («Nach Monat», SL).

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Kein Test gelockert: er zählt weiter genau 3 Zeilen, prüft jede Zeile und das Ziel, klappt nur die Monate auf.

## Entscheide (für decisions.md)
- keine

## Stand im Plan (roadmap.md / vorhaben.md)
- Tests stabilisieren: Monatsgrenze im Eingang-Test behoben.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Nichts in der App prüfen. Der Handy-Teil 5 ist danach grün.
