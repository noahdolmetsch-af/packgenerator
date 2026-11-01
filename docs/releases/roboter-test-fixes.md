# Zwei kleine Anzeigefehler behoben

PR (Roboter-Test) · 01.11.2026 · Auftrag: Noah «mache einen kompletten UI-Test … kleinere Dinge behebst du gleich» (Thread «Prüfen: kompletter Roboter-UI-Test»)

## Was ist neu
- Analyse: unter dem Verlauf zeigte «höchster» den Text «({day})», wenn der höchste Tag in einer Tour lag. Jetzt steht dort der Tourname (`AnalyseWert.svelte`: Touren haben `title`, nicht `name`). Gleiches für das Tour-Band und die Zeile «Tour:» am angetippten Tag (`detail.js tripBands`).
- Heute, «Schnell öffnen» auf dem Handy: lange Namen («Was ziehe ich an?», «Ausfahrt starten») enden nicht mehr mit «…», sondern brechen in eine zweite Zeile um (`Wall.svelte`).

## Was fällt weg oder rutscht tiefer
- Nichts.

## Selbst entschieden
- Zwei Zeilen statt einer Kürzung; erst die dritte Zeile würde abgeschnitten.

## Entscheide (für decisions.md)
- Keine.

## Stand im Plan (roadmap.md / vorhaben.md)
- Keine Änderung. Weitere Funde des Roboter-Tests stehen im Bericht (DocX im Projektordner).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Analyse › SpO2 öffnen: bei «höchster» steht ein Tag oder Tourname, nie «{day}».
2. Auf dem Handy Heute › «Schnell öffnen»: «Was ziehe ich an?» ist lesbar.
