# Wochenziel: die Zahl ist schon ausgefüllt

PR folgt · 17.11.2026 · Auftrag: Noah «c» (Thread «UI-Test der Seite Flow», Fund 6)

## Was ist neu
- Beim Hinzufügen eines Wochenziels steht die Zahl schon da: 150 bei Kilometern, 2 bei einer Sportart. Vorher war das Feld leer und «Hinzufügen» grau, ohne Grund.
- Wählst du etwas anderes aus, passt sich die Zahl an, solange du keine eigene getippt hast. Eine getippte Zahl bleibt.
- Ist das Feld leer, steht darunter «Tippe eine Zahl über 0.»

## Was fällt weg oder rutscht tiefer
- nichts. Der graue Beispieltext im Feld (Platzhalter) ist jetzt eine echte Zahl.

## Selbst entschieden
- Die Zahlen 150 und 2 sind dieselben wie im Beispieltext der Seite.
- Kein Datenformat und keine Speicherstruktur geändert.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Aktiv › Meine Wochenziele › «Wochenziel hinzufügen»: die Zahl steht schon da, «Hinzufügen» ist an.
2. Eine andere Sportart wählen: die Zahl wechselt auf 2; eine selbst getippte Zahl bleibt.
3. Zahl löschen: der Hinweis erscheint, «Hinzufügen» ist aus.
