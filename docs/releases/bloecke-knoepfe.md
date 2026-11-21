# Block-Knöpfe beim Abhaken

21.11.2026 · Auftrag: Noah «a) Block-Knöpfe beim Abhaken» und Festlegung «Abhaken» (21.11.2026): Blockgrösse pro Sportart einstellbar (Sauna 12, Laufen indoor 10, eigene Sportarten frei), der Knopf merkt sich die letzte Wahl, Blöcke für alle Sportarten (Thread «Auswertung über alle Sportarten», Umsetzungsauftrag S-Folge)

## Was ist neu
- Auf der Seite «Geschafft» zeigt die Dauer bei **Sauna** die Knöpfe «1 × 12 Min» bis «4 × 12 Min» und bei **Laufen indoor** (auch «Rennen indoor», Laufband) «1 × 10 Min» bis «4 × 10 Min». Ein Tipp speichert die Minuten im Haken (wie bisher 30/45/60/90), derselbe Tipp nochmals nimmt sie zurück.
- Der Knopf deiner **letzten Wahl** ist gestrichelt markiert (bei Laufen indoor zuerst «2 ×», bei Sauna «1 ×»). Markiert heisst nur: hier tippst du am ehesten; geschrieben wird erst mit dem Tipp.
- **Jede Sportart** kann Blöcke bekommen: neben den Dauer-Knöpfen steht «In Blöcken», dort tippst du die Länge eines Blocks (1 bis 1440 Min) und speicherst. Bei Sauna und Laufen indoor steht «Block ändern», «Standard» (oder «Keine Blöcke» bei eigenen Sportarten) holt den Ausgangswert zurück, mit Rückgängig.
- Neue Einstellung `sport.blocks` in `db.settings` (`{ [Sportart]: { size, last } }`), kommt ins Backup, kein Schema-Wechsel. Neue Datei `src/lib/flow/bloecke.js`, Tests `tests/bloecke.test.js` und `tests/e2e/bloecke.spec.js`.

## Was fällt weg oder rutscht tiefer
- nichts. Bei Sportarten ohne Blöcke bleiben die Knöpfe 30/45/60/90 wie bisher; bei Sauna und Laufen indoor ersetzen die Block-Knöpfe sie (die Dauer lässt sich weiter über das Bearbeiten-Fenster und die «Übliche Dauer» einstellen).

## Selbst entschieden
- **Markiert, nicht vorbelegt:** «2 vorbelegt» bei Laufen indoor heisst hier: der Knopf «2 ×» ist markiert. Es wird nichts automatisch in den Haken geschrieben (die Minuten stehen erst nach dem Tipp im Haken, wie bisher). Wer es doch automatisch will, sagt es.
- **Keine neue Funktion im Katalog:** die Block-Knöpfe sind Teil von «Geschafft» (`f.geschafft`), darum kein neuer Eintrag in `features.js`, kein «Passt hier» und kein «Gut zu wissen» (Fertig-Regel Teil 1 bis 3, 6: bestehende Funktion).
- **Feld «Eigene Minuten»:** kommt aus dem Thread «Training erfassen» (`MinInput.svelte`) und wird danach neben den Blöcken ergänzt; hier ist nur das Feld für die Blockgrösse.
- Mehr als vier Blöcke: das Feld «Eigene Minuten» deckt es später ab.
- Eine Sportart mit eigener Blockgrösse behält ihre «Letzte Wahl» auch, wenn die Blockgrösse zurückgesetzt wird.

## Entscheide (für decisions.md)
- Block-Knöpfe beim Abhaken: Sauna 12, Laufen indoor 10, jede Sportart einstellbar, letzte Wahl markiert (Noah 21.11.2026).

## Stand im Plan (roadmap.md / vorhaben.md)
- Sportjahr: Blöcke aus der Frage vom 21.11.2026 sind gebaut; offen bleibt das Feld «Eigene Minuten» daneben.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Aktiv › Sauna abhaken: «Geschafft» zeigt «1 × 12 Min» bis «4 × 12 Min»; «2 × 12 Min» tippen, der Knopf ist dunkel (24 Min). Nochmals tippen: weg.
2. Tennis abhaken › «In Blöcken» › 30 tippen › Speichern: die Knöpfe zählen Blöcke von 30 Minuten.
