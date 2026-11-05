# Sammel-Wand

Auftrag: Noah «jetzt umsetzen A, B, F und G» (Thread «Neuer Schwung», 05.11.2026), Idee F · PR #<Nummer>

## Was ist neu
- Neue Seite **Touren › Rückblick › Sammel-Wand** (`#/debrief/sammlung`): oben fünf Zahlen (Stempel, Pässe, Orte, Neuland, Sterne), darunter «Zuletzt dazugekommen» und je ein Regal für Tourenpass, Pässe, Gipfelbuch, Neuland und Sterne.
- Nur zum Anschauen: kein Ziel, keine Serie, keine Zahl für das, was fehlt. «Alle» öffnet die Liste, in der man etwas ändert.
- Ein leeres Regal sagt, warum es leer ist und wo es sich füllt. Ist alles leer, erklärt die Seite, woher Stempel, Pässe und Neuland kommen.
- Tourenpass und Pässe zeigen im «Als Nächstes» auf die Wand.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Die Wand liest nur und speichert nichts (keine neue Tabelle, Backup bleibt gleich).
- Ein Pass kann in zwei Regalen stehen (Pässe und Gipfelbuch) oder in Neuland. Die Wand gleicht das nicht ab; jede Liste behält ihre eigene Regel («eine Pass-Regel» bleibt eine eigene Runde).
- Ort in der App: unter Rückblick wie Pässe und Tourenpass, kein neuer Tab (die Leiste von Auswerten ist voll).
- Neuland wird erst nach dem ersten Anzeigen gezählt (lädt Kartendaten) und nur, wenn schon etwas gefahren wurde.
- Die Heute-Zeile «Neu gesammelt» aus der Idee ist ein eigener, späterer PR: «Neu seit gestern» (Neuland) gibt es schon.

## Stand im Plan (roadmap.md / vorhaben.md)
- Idee F aus «Neuer Schwung»: Wand gebaut; Heute-Zeile folgt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Rückblick › «Sammel-Wand» öffnen: oben die Zahlen, darunter die Regale.
2. Eine Zahl antippen: ihre Liste öffnet sich.
3. In einem Regal «Alle» antippen: dieselbe Liste.
4. Im Tourenpass und bei den Pässen: «Als Nächstes» nennt die Sammel-Wand.
