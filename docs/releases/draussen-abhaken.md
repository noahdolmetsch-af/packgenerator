# Draussen: «Abhaken» auf der Karte

Auftrag: Noah 22.11.2026 01:36 UTC («a»: jede Challenge-Karte bekommt den grünen Knopf «Abhaken», auch die Karte Draussen, wie bei den Gewohnheiten). Thread «Challenges in den Vordergrund stellen». Schritt 3a.

## Was ist neu
- Die Karte «Draussen» auf Heute hat den grünen Knopf **«Abhaken»**: er zählt die Minuten dazu, die bis zum Tagesziel fehlen (Strava mitgezählt). Danach steht dort «Abgehakt · zurücknehmen»; ein zweiter Tipp (oder «Rückgängig» in der Meldung) nimmt die von Hand dazugezählten Minuten wieder weg.
- +15, +30, +60 und eigene Minuten bleiben für Teilmengen.

## Was fällt weg oder rutscht tiefer
- Nichts. Auf Heute kommt keine Karte dazu, die Karte «Draussen» bekommt einen Knopf.

## Selbst entschieden
- Hat Strava das Tagesziel allein erreicht, gibt es nichts abzuhaken: der Knopf erscheint dann nicht (die Zeile sagt «Heute geschafft»).
- «Zurücknehmen» entfernt nur Minuten von Hand, nie Strava.
- Keine neue Einstellung und kein neues Datenformat: der Knopf schreibt in `outdoor.hand` wie die +-Knöpfe.
- Gleiche Texte wie bei den Gewohnheiten («Abhaken», «Abgehakt · zurücknehmen»).
- Fertig-Regel: keine neue Seite, darum entfallen Seite, Inhalt und App-Stand-Zeile; die Beschreibung der Karte im App-Stand nennt den Knopf.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auf Heute bei «Draussen» «Abhaken» tippen: «Heute geschafft», der Knopf heisst «Abgehakt · zurücknehmen».
2. Den Knopf noch einmal tippen: die fehlenden Minuten sind wieder offen.
