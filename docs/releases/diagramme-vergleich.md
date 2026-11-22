# Diagramme vergleichen

22.11.2026 · Auftrag: Noah «alle sieben Punkte» (Diagramme besser), Schritt 4 und 5 von 7 · `src/lib/charts/compare.js`, `BarChart.svelte`, `Readout.svelte`, Sportjahr, Rückblick pro Sportart

## Was ist neu
- Unter den Zahlen eines Balkens steht eine Zeile: «2 h mehr als im Vorjahr» (Sportjahr › Jahr, wenn es das Vorjahr gibt), sonst «Über / Unter / Etwa dein Schnitt» gegenüber den anderen Balken.
- «Etwa dein Schnitt» gilt innerhalb von 5 %. Gegen eine Lücke oder bei weniger als 3 echten Balken steht nichts.
- Über dem Diagramm stehen bis zu drei kurze Sätze nach festen Regeln: der höchste Balken, Anstieg oder Abfall der letzten drei, längste Pause. Unter 6 echten Balken oder ohne Auffälliges nichts (`sentence.js`, `BarChart sentences`).
- Der Baustein: `readout(i).extra` in `BarChart`, jedes Balkendiagramm kann es nutzen.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Nur Sportjahr und Rückblick pro Sportart bekommen es jetzt.
- «Weiterführen» (Punkt 6) nicht gebaut: kein Ziel vorhanden, das einen Zeitraum zeigt. Frage an Noah.
- Bei «Noch nicht» / «Keine Daten» steht keine Vergleichszeile.

## Entscheide (für decisions/)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Diagramme besser machen: Schritt 4 und 5 von 7 (Vergleich + Sätze). «Weiterführen» (Knopf «Die N Einheiten ansehen») wartet: es gibt noch keine Liste, die nach Zeitraum filtert.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auswerten › Sportjahr › Jahr: auf einen Monat zeigen, unter den Zahlen steht der Vergleich.
2. Anderen Zeitraum wählen: «Über / Unter / Etwa dein Schnitt».
