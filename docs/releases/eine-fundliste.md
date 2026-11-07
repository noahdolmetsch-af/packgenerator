# Eine Fundliste

PR (diese Änderung) · 07.11.2026 · Auftrag: Noah «ok N10» (Thread «Träume N12, N18, N10 bauen»), Idee N10 von «Träume und Neuland»

## Was ist neu
- Touren › Rückblick › Neuland: oben die Karte «Fundliste» (`src/lib/neuland/FundList.svelte`). Sie zeigt alles, was du zum ersten Mal erreicht hast, dieses Jahr oder alle Jahre, neueste zuerst: Orte aus den Neuland-Sammlungen, Orte des Gipfelbuchs, die Neuland nicht schon hat, und deine eigenen Einträge zum «Neuland des Jahres». Vier Zeilen sind sichtbar, «Mehr anzeigen» öffnet den Rest.
- Dieselbe Liste (`findsOf` in `src/lib/neuland/funde.js`) ist das «Neuland des Jahres»: im Jahresheft (Zeile «Neuland 2026: …») und unter Ich › Was mir gut tut (Karte «Neuland 2026», sie zeigt acht Zeilen, der Rest hinter «Mehr anzeigen»). Eigene Einträge lassen sich dort wie bisher umbenennen und löschen; die Funde aus Neuland und Gipfelbuch kommen von selbst.
- Das Gipfelbuch zählt für Neuland mit: ein Besuch an einem Ort mit Koordinaten ist eine Linie aus einem Punkt (`visitLines`, in `readRaw` von `store.js`). Ein von Hand eingetragener Pass hakt also auch den Pass in Neuland ab, und ein Ort steht nur einmal in der Liste.
- Leere Liste: sagt, warum sie leer ist, und bietet «Eigenes Neuland hinzufügen» an. Unter der Liste steht, dass sie das «Neuland des Jahres» ist, mit Link.
- Neue Funktion `f.findlist`.

## Was fällt weg oder rutscht tiefer
- Neuland: die Reihe der Sammlungen und ihre Liste rutschen um die Karte «Fundliste» nach unten (vier Zeilen).
- Ich › Was mir gut tut: die Liste «Neuland des Jahres» zeigt mehr Zeilen (die Funde aus Neuland und Gipfelbuch), hat darum ein «Mehr anzeigen» nach acht Zeilen.

## Selbst entschieden
- **Speicher:** nichts Neues. Die Liste wird aus dem berechnet, was schon da ist (Neuland-Stand, Gipfelbuch, Neuland-Einträge). Backup-Format und Schema bleiben gleich.
- Ein Gipfelbuch-Ort, der innerhalb von 600 m eines abgehakten Neuland-Punktes liegt, steht nicht zusätzlich in der Liste (er ist derselbe Ort).
- Ein Eintrag, dessen Name schon in der Liste steht (Gross-/Kleinschreibung egal), wird nicht doppelt gezeigt.
- Gemeinden zählen auch als Funde (es kann viele geben): darum vier Zeilen und «Mehr anzeigen».
- Teile der Fertig-Regel: Absprung ist die Karte selbst auf Neuland; «Als Nächstes» ist der Link «Eigenes Neuland hinzufügen».

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- «Träume und Neuland»: N10 gebaut. Damit sind N10, N12 und N18 gebaut.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Rückblick › Neuland: oben steht «Fundliste» mit «Dieses Jahr» und «Alle Jahre».
2. Ich › Was mir gut tut › «Neuland hinzufügen»: Eintrag erscheint in der Fundliste.
3. Jahresheft (Touren › Rückblick › Jahr): die Zeile «Neuland 2026: …» zählt dieselben Funde.
