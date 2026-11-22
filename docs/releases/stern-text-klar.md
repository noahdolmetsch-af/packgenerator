# Stern-Zeile unter der Abhaken-Meldung: klarer

PR folgt · 18.11.2026 · Auftrag: Noah «c» (Thread «UI-Test der Seite Flow», Fund 7)

## Was ist neu
- Die kleine Zeile unter der Meldung nach dem Abhaken sagt jetzt «Noch 1× bis zum 1. Stern von «Wochen in Folge»» statt «Noch 1× bis Stern 1 · Wochen in Folge». Man sieht, dass es ein Stern ist und zu welchem Meilenstein er gehört. Dasselbe gilt für «Fast geschafft: noch … bis zum … Stern von «…»».
- Nur der deutsche Text ändert sich.

## Was fällt weg oder rutscht tiefer
- nichts. Die Zeile «Als Nächstes» und die Meldung selbst bleiben (Fertig-Regel «nächster Schritt»).

## Selbst entschieden
- Die Meldung wird nicht verkleinert: der zweite Teil von Fund 7 (Grösse am Handy) bleibt offen, weil «Als Nächstes» zur Fertig-Regel gehört und nicht ohne dein Ja wegfällt.
- Kein Datenformat, keine Speicherstruktur geändert.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Aktiv › Heute: eine Aktivität abhaken, die einen Schritt vor ihrem nächsten Stern steht.
2. Unter der Meldung steht «Noch 1× bis zum 1. Stern von «…»».
