# Analyse: lange Tour-Namen brechen um

PR #? · 25.11.2026 · Auftrag: Gesamttest Runde 2, Fund C6 (genauer beschrieben vom Gesamttest-Thread am 25.11.2026), Noah «Alle B und C weitergeben»

## Was ist neu
- In Auswerten › Analyse › ein Wert (Cardio-Belastung, Ruhepuls, spät …) endete ein langer Tour-Name in der Karte «Touren in diesem Zeitraum» am Handy in «…», ohne dass man den Rest lesen konnte. Er bricht jetzt in eine zweite Zeile um (`overflow-wrap: break-word` auf `.tn b` in `src/pages/analyse/AnalyseWert.svelte`); die Zeile wird höher, der Wert rechts bleibt.
- Neuer Test in `tests/e2e/schmal-analyse-320.spec.js`: drei erfundene Touren, zwei mit sehr langem Namen, bei 320 und 390 px; nichts ist abgeschnitten, kein Wort bricht innen, kein seitliches Scrollen. Ohne die Änderung ist er rot («cut: b "Bikepacking …"»).

- Test `sportjahr.spec.js` («Every page of Auswerten remembers its own period») angepasst: seit «Zeitraum in einer Zeile» (Übersicht) steht der Zeitraum-Schalter hinter «Ändern»; der Test klappt ihn dort auf. Er war nach dem Merge dieser Änderung rot (nur Test, kein App-Fehler).

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Umbrechen statt Tooltip: am Handy gibt es keinen Tooltip, der ganze Name soll sofort lesbar sein. Echte Tour-Namen sind meist kurz, die Zeile wächst nur bei langen.
- Die gleiche Regel gilt für die Tage mit den höchsten Werten («Top-Tage», `.tprow`), dort ist der Titel ein kurzes Datum.
