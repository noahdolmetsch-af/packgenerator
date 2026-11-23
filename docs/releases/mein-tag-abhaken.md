# Mein Tag: der Reiter «Abhaken» (Schritt 3c)

PR # · 23.11.2026 · Auftrag: Noah «ja» (11:48): die gemeinsame Abhak-Liste kommt direkt in «Mein Tag»; Plan `/mnt/project-files/notes/mein-tag-bauplan-2026-11-23/bauplan.md`

## Was ist neu
- «Mein Tag» hat einen dritten Reiter «Abhaken» (Adresse `#/day/abhaken`): derselbe Block wie «Heute abhaken» auf Aktiv. Eine Kachel für jede Sportart oder Gewohnheit, ein Tipp hakt ab (Dauer und Gefühl sind freiwillig, hinter den drei Punkten der Kachel), darunter die laufenden Challenges mit eigenem «Abhaken».
- Die Haken sind dieselben wie in Aktiv, auf Heute und in der Woche: nichts wird kopiert, bestehende Daten bleiben unverändert.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Es ist eine zweite Tür zur vorhandenen Funktion «Heute abhaken» (`TickGrid`, `OutdoorCard`, `ZielCards`, `TickSuggest`), keine neue Funktion; darum kein neuer Eintrag in `features.js`. Aktiv und Heute bleiben, wie sie sind.
- Ein Tipp bleibt auf «Mein Tag» (er springt nicht auf die Seite «Geschafft» wie in Aktiv); Dauer, Ort und Gefühl stehen hinter den drei Punkten der Kachel und auf der Seite «Geschafft». Die Mengen je Sportart (zum Beispiel Eishockey 2 Std) stehen weiter in Aktiv bei der Sportart; diese PR ändert sie nicht. Noahs Standard-Dauern prüfe ich mit «Plan mir den Tag» (Schritt 4).
- Die Trainings des Tages mit Uhrzeit stehen weiter im Reiter «Tag»; sie hier nochmals zu zeigen hiesse, ein Ding doppelt zu zählen.
- Kein neues Schema, kein Backup-Format, kein `api/`.

## Stand im Plan
- «Mein Tag»: Schritt 3c gebaut (3a To-dos, 3b Notizen, 3c Abhaken).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. «Mein Tag» öffnen, «Abhaken» tippen.
2. Eine Kachel antippen: sie ist abgehakt, «Rückgängig» wird angeboten.
3. Aktiv öffnen: dieselbe Kachel ist dort auch abgehakt.
