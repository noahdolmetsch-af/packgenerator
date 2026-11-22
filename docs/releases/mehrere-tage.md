# Mehrere Tage in einem Rutsch

PR #<Nummer> · 21.11.2026 · Auftrag: Noah 21.11.2026 («bitte hiermit fortfahren», Gestern nachtragen; Punkt «mehrere Tage in einem Rutsch»), Thread «Training erfassen vereinfachen». Baut auf «Gestern nachtragen» auf.

## Was ist neu
- Im Abhak-Fenster einer Kachel steht unter «Wann» der Knopf «Mehrere Tage in einem Rutsch». Dann sind die Tage-Knöpfe (Heute, Gestern, Vorgestern, «Anderer Tag») Schalter: Man schaltet ein, für welche Tage abgehakt wird.
- «Abhaken» macht für jeden Tag einen eigenen Eintrag. Jeder zählt an seinem Tag (Geschafft, Wochenziele, Auswerten). Die Uhrzeit (freiwillig) und die Dauer gelten für alle Einträge.
- Eine Zeile sagt, wie viele Tage es sind («Du hakst für 3 Tage ab …»). Die Meldung nennt die Zahl («· 2 Tage abgehakt»); ein «Rückgängig» nimmt alle Einträge zurück.
- Ein ungültiges Datum bei «Anderer Tag» sperrt «Abhaken», wie beim einzelnen Tag. «Nur ein Tag» schaltet zurück und behält den ersten eingeschalteten Tag.

## Was fällt weg oder rutscht tiefer
- Nichts. Der Knopf ist neu und steht unter den Tage-Knöpfen; wer ihn nicht antippt, hakt wie bisher einen Tag ab.

## Selbst entschieden
- Keine Datenänderung: es sind mehrere normale Einträge in `flowLog` (jeder mit `day` und `at`), keine neue Tabelle, kein neues Feld, kein Backup-Format. Darum keine Einzelfreigabe wegen Daten.
- Beim Einschalten bleibt der bisher gewählte Tag (meist «Heute») eingeschaltet; man schaltet ihn aus, wenn man ihn nicht will.
- Mehrere Dauer-Werte pro Tag (jeder Tag eine andere Dauer) gibt es nicht; dafür nochmal abhaken. Das Fenster bleibt klein.
- Der Pendel-Knopf nimmt in diesem Modus den ersten (neuesten) Tag.
- Fertig-Regel: Seite (Aktiv unverändert), Absprung unverändert, «Gut zu wissen» unverändert, leerer Zustand unverändert, nächster Schritt: wie beim Abhaken die Meldung; App-Stand (Zeile «Aktiv» ergänzt).

## Entscheide (eigene Datei `docs/decisions/mehrere-tage.md`)
- 21.11.2026: Mehrere Tage werden in einem Abhak-Fenster mit gleicher Dauer abgehakt; ein Rückgängig für alle.

## Stand im Plan (roadmap.md / vorhaben.md)
- Vereinfachen, Schritt 1 «Gestern nachtragen»: «mehrere Tage in einem Rutsch» fertig.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Aktiv: bei «Yoga» auf «•••» tippen, «Mehrere Tage in einem Rutsch» tippen.
2. «Heute» ausschalten, «Gestern» und «Vorgestern» einschalten, «Abhaken» tippen: Die Meldung sagt «2 Tage abgehakt».
3. «Geschafft» zeigt beide Tage. «Rückgängig» in der Meldung nimmt beide zurück.
