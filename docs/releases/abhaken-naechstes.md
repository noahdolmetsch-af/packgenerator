# Als Nächstes nach dem Abhaken

PR #? · 04.11.2026 · Auftrag: Noah «1a 2a 3a 4a 5a» plus Zusatzidee 5 (Thread «Untersuchen: Aktiv und Auswerten besser einbauen»), Schritt 7 von 9

## Was ist neu
- Die Meldung nach dem Abhaken (unten, mit «Rückgängig») hat eine Zeile «Als Nächstes» mit zwei Links: «Dein Verlauf» (die Seite der Sportart) und «Meilensteine» (alle Sterne). Ein Tipp schliesst die Meldung und öffnet die Seite.
- Gilt für jedes Abhaken (Heute, Aktiv, Sportseite), weil alle `tickWith` in `flow/ui.svelte.js` benutzen.

## Was fällt weg oder rutscht tiefer
- nichts. Die Meldung ist eine Zeile höher (zwei Links); «Rückgängig» und der Satz «Fast geschafft» bleiben.

## Selbst entschieden
- Die zwei Ziele stehen fest (Verlauf, Meilensteine), unabhängig davon, ob ein Stern nahe ist; der Satz «Fast geschafft» bleibt zusätzlich.
- Die Zeile liegt in der Meldung (nicht in der Liste von `alsnaechstes.js`), weil der Verlauf eine Sportseite ist und kein Eintrag in `features.js`.
- Nach einer Stoppuhr-Sitzung öffnet sich wie bisher die Auswertung der Sitzung; dort ändert dieser PR nichts.

## Stand im Plan
- Aktiv und Auswerten: Schritt 7 gebaut. Schritt 8 (ein Name für die Fragen) und Schritt 9 folgen.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute öffnen und eine Aktivität abhaken: unter der Meldung steht «Als Nächstes» mit «Dein Verlauf» und «Meilensteine».
2. «Meilensteine» tippen: die Seite öffnet sich, die Meldung schliesst sich.
3. Abhaken und «Rückgängig» tippen: der Haken ist weg.
