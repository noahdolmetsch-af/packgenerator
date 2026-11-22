# Wackel-Test «v0540: Material-Detail» (v0540.spec): der Test wartet, bis das Fenster seinen Verlaufseintrag abgegeben hat

22.11.2026 · Auftrag: Noah «bitte fortfahren» zu «jeden Tag einen Wackel-Test an der Ursache reparieren» (Thread «Prüfungen so einrichten, dass main grün bleibt»); entdeckt in PR 1416, Teil 5 («8× dabei, 4× gebraucht», beim Wiederholen grün)

## Was ist neu
- Nur der Test ändert sich: `tests/e2e/v0540.spec.js` (erster Test) schliesst das Fenster mit der Hilfsfunktion `closeDialog` aus `settle.js`. Sie drückt Escape und wartet, bis das Fenster seinen Eintrag im Verlauf zurückgegeben hat.
- Ursache: Ein geschlossenes Fenster nimmt seinen Verlaufseintrag einen Augenblick später mit `history.back()` weg (`backclose.js`). Öffnete der Test in dieser Zeit schon die nächste Adresse (`#/gear?item=RA01`), machte dieser späte Schritt zurück die neue Adresse wieder rückgängig, und das Fenster der Ausrüstung fehlte. Unter Last (mehrere Läufe gleichzeitig) passierte das ab und zu. Der zweite Test in der Datei wartete schon darauf, der erste nicht.
- Nachgestellt unter Last (8 Läufe gleichzeitig, Handy): vorher 1 von 12 rot, nachher 36 von 36 grün.

## Was fällt weg oder rutscht tiefer
- nichts. Keine App-Änderung.

## Selbst entschieden
- Der Test wurde nicht gelockert: er prüft weiter dieselben Zeilen und Zustände. Er wartet nur auf einen Zustand der App (Fenster zu, Eintrag weg), den auch die anderen Specs so abwarten.
- Die App bleibt, wie sie ist.

## Prüfschritte (nach dem Merge)
1. In der Nachtprüfung steht «v0540: the top: name and one summary line …» nicht in der Wackel-Liste.
