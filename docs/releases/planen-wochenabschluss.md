# Wochen-Abschluss am Sonntag

PR #<Nummer> · 05.11.2026 · Auftrag: Noah «Planen 2b» (Thread «Bauen: Planen 2a und 2b», Ideen-Doc «Ideen für alle Bereiche»)

## Was ist neu
- Planen › Woche zeigt am Sonntag eine Karte «Wochen-Abschluss» mit drei Zeilen: **Erledigt**, **Noch offen**, **Rutscht in die nächste Woche** (`src/lib/woche/abschluss.js`, `WeekClose.svelte`).
- Die dritte Zeile listet deine eigenen offenen To-dos und Velo-Arbeiten, jede mit Haken. «… auf Montag verschieben» setzt die angehakten auf den nächsten Montag (Uhrzeit bleibt), mit «Rückgängig».
- Danach «Nächste Woche planen» (Sonntagsplanung) und «Nächste Woche ansehen». «Später» blendet die Karte aus.
- An anderen Tagen steht neben den Zahlen der Woche die Taste «Wochen-Abschluss zeigen».

## Was fällt weg oder rutscht tiefer
- Am Sonntag steht «Woche abschliessen» (alte offene To-dos früherer Tage einzeln: auf heute, weglassen, ohne Tag behalten) nicht mehr zusätzlich daneben, solange der Wochen-Abschluss offen ist. Wer einzelne Aufgaben anders behandeln will, nimmt dort den Haken weg und «Später» blendet die Karte aus; dann erscheint «Woche abschliessen» wieder. An allen anderen Tagen ändert sich dort nichts.

## Selbst entschieden
- Keine neue Funktion in `features.js`: `f.weekplan` bekommt Text und Handbuch-Schritt dazu (kein neuer Absprung nötig, die Karte steht auf der Woche selbst).
- Google-Aufgaben kann die App nicht verschieben: sie zählen in «Noch offen», rutschen aber nicht.
- Einheiten aus dem Trainingsplan zählen nur bis heute als «offen» (zukünftige Tage der Woche noch nicht).
- Kein neues Datenfeld: der Zustand «Später» gilt nur, solange die Seite offen ist.

## Entscheide (für decisions.md)
- 05.11.2026: Der Wochen-Abschluss verschiebt nur, was du anhakst, nur auf den nächsten Montag und immer mit Rückgängig (Noah «Planen 2b»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Ideen für alle Bereiche: Planen 2b ist gebaut (Planen 2a eigener PR).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Planen › Woche am Sonntag öffnen (sonst «Wochen-Abschluss zeigen» antippen): drei Zeilen.
2. Bei einer Aufgabe den Haken wegnehmen, dann «… auf Montag verschieben»: nur die anderen stehen am Montag der nächsten Woche.
3. «Rückgängig» antippen: alles steht wieder am alten Tag.
