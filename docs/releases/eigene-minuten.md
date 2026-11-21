# Eigene Dauer: neben den Dauer-Knöpfen ein Feld für Minuten

PR folgt · 21.11.2026 · Auftrag: Noah 21.11.2026 («für alle aktivitäten möchte ich neben den vorgeschlagenen buttons immer zusätzlich die option, eine eigene dauer in min einzugeben»), Thread «Training erfassen vereinfachen».

## Was ist neu
- Auf «Geschafft» steht unter den Dauer-Knöpfen (30, 45, 60, 90 Min) ein Feld «Eigene Dauer» mit «Min» und «Setzen». Ganze Minuten von 1 bis 1440; Enter oder «Setzen» speichert. Die Dauer steht danach oben und zählt in «Diese Woche».
- Passt die gespeicherte Dauer zu keinem Knopf, steht sie im Feld (kein Knopf ist dann markiert). Eine falsche Eingabe (7,5, Text, 0, mehr als 1440) sagt es und ändert nichts.
- Der Baustein ist eine eigene Komponente (`src/lib/flow/MinInput.svelte`, Regeln in `src/lib/flow/feel.js`: `parseMinutes`, `setMinutes`), die auch das Blatt von «Plan zuerst» (T4) und die Block-Knöpfe nutzen werden.

## Was fällt weg oder rutscht tiefer
- Nichts. Die Knöpfe bleiben, das Feld kommt dazu.

## Selbst entschieden
- Die Dauer ist wie bisher das Feld `min` am Eintrag des Verlaufs; es gibt kein neues Feld, keine neue Tabelle, keine Schema-Version.
- Ein getippter Wert wird nicht wie ein Knopf zurückgenommen, wenn man ihn noch einmal setzt; man ersetzt ihn mit einem anderen Wert (zum Entfernen dient der Knopf-Tipp auf eine gewählte Dauer oder «Rückgängig»).
- Ganze Minuten reichen (kein «1,5 Std»); 1440 Minuten sind die Obergrenze (ein Tag).
- Wo es sonst Dauer-Knöpfe gibt (Blatt «Plan zuerst», Block-Knöpfe von Sauna und Laufen indoor, «Strava»-Haken haben ihre Zeit von Strava), kommt dasselbe Feld mit den PRs dieser Schritte dazu.
- Fertig-Regel: Seite (`f.geschafft` ergänzt), Absprung unverändert, «Gut zu wissen» unverändert, leerer Zustand unverändert, nächster Schritt unverändert, App-Stand (Zeile «Geschafft» ergänzt).

## Entscheide (für decisions.md)
- 21.11.2026: Wo es Dauer-Knöpfe gibt, gibt es immer auch ein Feld für eigene Minuten (Noah).

## Stand im Plan
- Training erfassen vereinfachen: T1, T2 online; T3 und diese Ergänzung folgen.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Aktiv: eine Kachel antippen: «Geschafft» öffnet sich. Unter den Dauer-Knöpfen steht «Eigene Dauer».
2. 75 eintragen und «Setzen» tippen: oben steht «· 75 Min», kein Dauer-Knopf ist markiert.
3. 7,5 eintragen und Enter drücken: «Ganze Minuten von 1 bis 1440», die 75 bleibt.
