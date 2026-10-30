# Import auf ein neues Gerät

PR #459 · 27.10.2026 · Auftrag: Noah 26.10.2026 20:31 «1a» alle B-Fehler aus dem UI-Test 0.205 (Thread «Testen komplette App mit Fehlerliste»)

## Was ist neu
- «Import prüfen» zählt die Beispiele vom ersten Start nicht als eigene Daten (`onlyExamples` in src/lib/firststart.js). Ein Gerät mit nur Beispielen gilt als leer: der Vorschlag heisst «Dieses Gerät ist noch leer … Übernimm die Datei mit «Alle Daten ersetzen»», und dieser Knopf ist hervorgehoben. Vorher stand «Dieses Gerät ist neuer. Schick besser ein Backup von hier», weil die Beispiele eben erst entstanden waren.
- Nach «Zusammenführen» sagt die Meldung, dass die Beispiele noch da sind und wie «Beispiele entfernen» sie wegnimmt. Kein Schema-Wechsel, Backup-Format gleich.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Auf Heute kommt keine neue Frage «Beispiele entfernen?» (Heute braucht Noahs OK); der Hinweis steht nach dem Import und der Knopf bleibt unter Daten und Backup.
- Nur Touren, Material und Velos zählen als «eigene Daten», wie bisher.
- Auch die Beispiel-Teile, die die App selbst in die Bausteine legt (Ohrstöpsel, Armlinge usw., `blocksMore.created`), zählen nicht als eigene Daten. Sonst galt ein Gerät mit Beispielen nie als leer.

## Entscheide (für decisions.md)
- 27.10.2026: Import auf ein neues Gerät (UI-Test 0.205 T10), Noah «1a» alle B-Fehler.

## Stand im Plan (roadmap.md / vorhaben.md)
- UI-Test 0.205 (Ziel Alltag): T10 erledigt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Daten und Backup, ein Backup auf einem Gerät mit nur den Beispielen öffnen: Der Vorschlag sagt «Dieses Gerät ist noch leer …».
2. Mit eigenen Daten auf dem Gerät bleibt der Vorschlag wie bisher.
