# Wackel-Test «Ausrüstung: von Material zur Seite» (ausruestung.spec): der Test öffnet die ganze Liste

22.11.2026 · Auftrag: Noah «ja» zu «jeden Tag einen Wackel-Test an der Ursache reparieren» (Thread «Prüfungen so einrichten, dass main grün bleibt»); entdeckt in PR 1345, Teil 1 (einmal rot, beim Neustart grün)

## Was ist neu
- Nur der Test ändert sich: `tests/e2e/ausruestung.spec.js` sucht die Zeile «Tourenski Test: Belag wachsen» auf Heute jetzt erst, nachdem er «Alle N zeigen» in der Karte «Jetzt dran» geöffnet hat.
- Ursache: «Jetzt dran» zeigt die ersten vier Zeilen. Welche anderen Zeilen schon da sind (der Hinweis zum Browser-Speicher, der zum Abgleich), hängt davon ab, was die Seite schon herausgefunden hat. Darum lag die Pflege-Zeile manchmal als fünfte oder sechste Zeile hinter dem Knopf und war nicht im Dokument.
- Nachgestellt unter Last (12 Läufe gleichzeitig): vorher 2 von 12 rot an dieser Zeile, nachher 0 (die übrigen roten Läufe in beiden Durchgängen sind reine Zeitüberschreitungen beim ersten Laden unter 12 Läufen auf 4 Kernen, an anderen Stellen des Tests). Mit 6 Läufen gleichzeitig: 12 von 12 grün.

## Was fällt weg oder rutscht tiefer
- nichts. Keine App-Änderung.

## Selbst entschieden
- Der Test wurde nicht gelockert: er verlangt weiter, dass die Pflege-Zeile auf Heute steht; er öffnet nur die Liste, wie es der Nutzer tun würde.
- Die App bleibt, wie sie ist: vier Zeilen und «Alle N zeigen» sind so gewollt.

## Prüfschritte (nach dem Merge)
1. In der Nachtprüfung steht «Ausrüstung: von Material zur Seite» nicht in der Wackel-Liste.
