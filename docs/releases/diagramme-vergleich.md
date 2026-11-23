# Diagramme sagen mehr

22.11.2026 · Auftrag: Noah «alle sieben Punkte» (Diagramme besser), Schritte 4 bis 7 von 7 · `src/lib/charts/compare.js`, `BarChart.svelte`, `Readout.svelte`, Sportjahr, Rückblick pro Sportart

## Was ist neu
- Unter den Zahlen eines Balkens steht eine Zeile: «2 h mehr als im Vorjahr» (Sportjahr › Jahr, wenn es das Vorjahr gibt), sonst «Über / Unter / Etwa dein Schnitt» gegenüber den anderen Balken.
- «Etwa dein Schnitt» gilt innerhalb von 5 %. Gegen eine Lücke oder bei weniger als 3 echten Balken steht nichts.
- Über dem Diagramm stehen bis zu drei kurze Sätze nach festen Regeln: der höchste Balken, Anstieg oder Abfall der letzten drei, längste Pause. Unter 6 echten Balken oder ohne Auffälliges nichts (`sentence.js`, `BarChart sentences`).
- Im Fenster eines Balkens öffnet «Die N Einheiten ansehen» die Liste (Tag, Sportart, Zeit; im Rückblick km), neueste zuerst. Noah «a»: die Liste ist im Fenster statt einer neuen Seite (`ChartSheet list`).
- Jede Seite von Auswerten (Sportjahr, Rückblick, Start) merkt sich ihren eigenen Zeitraum (`pg.period.<seite>` im Browser des Geräts, Noah «4b»). Keine Datenänderung der App-Daten, nicht im Backup.
- Der Baustein: `readout(i).extra` in `BarChart`, jedes Balkendiagramm kann es nutzen.

## Was fällt weg oder rutscht tiefer
- Der eine gemeinsame Zeitraum für alle Seiten von Auswerten: jetzt pro Seite einstellen.

## Selbst entschieden
- Nur Sportjahr und Rückblick pro Sportart bekommen es jetzt.
- Die Zeiträume je Seite starten ohne eigene Wahl mit der bisherigen gemeinsamen Wahl, sonst mit der Woche.
- Bei «Noch nicht» / «Keine Daten» steht keine Vergleichszeile.

## Entscheide (für decisions/)
- Noah «4b»: Zeitraum je Seite merken (`docs/decisions/diagramme-zeitraum-merken.md`).

## Stand im Plan (roadmap.md / vorhaben.md)
- Diagramme besser machen: Alle sieben Punkte gebaut.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auswerten › Sportjahr › Jahr: auf einen Monat zeigen, unter den Zahlen steht der Vergleich.
2. Anderen Zeitraum wählen: «Über / Unter / Etwa dein Schnitt».
3. Einen Balken antippen, «Die N Einheiten ansehen» öffnet die Liste.
4. Sportjahr: «Jahr» wählen, Auswerten öffnen: springt nicht auf «Jahr».
