# Handy-Tests nur für den betroffenen Bereich

PR (diese Änderung) · 05.11.2026 · Auftrag: Noah «3a ja» (Thread «Handy-Tests nur für betroffenen Bereich»)

## Was ist neu
- Die Handy-Tests, die nach deinem «ok» (Label `ok`) auf GitHub laufen, prüfen nur noch die Seiten, die der PR wirklich berührt, nicht mehr die ganze App. Beispiel: Ändert ein PR nur «Ausgeliehen», laufen 5 passende Tests plus der Kern, statt rund 570.
- So findet das Programm die Seiten: `scripts/ci-map.mjs` liest, welche Datei welche andere lädt, und folgt der geänderten Datei rückwärts bis zu den Seiten (`PAGES` in `App.svelte`). Die Tests, die diese Seiten öffnen (`#/gear/lend` …) oder die Datei selbst laden, laufen.
- Der Kern läuft immer mit: `flow.spec.js` (die ganze Tour vom Start bis zum Rückblick) und `guard.spec.js` (Wächter).
- Ein PR mit wenigen Tests braucht weniger Rechner: ein Teil pro 20 Tests, höchstens 5. Teile ohne Arbeit installieren nichts. Das entlastet die Warteschlange.
- Nur deutsche Textdateien (`src/lib/i18n/de/…`), Doku oder News: gar keine Handy-Tests (wie «Texte lösen nichts aus»).
- Alles läuft wie bisher (5 Teile), wenn: eine Datei geändert wird, die jede Seite lädt (Heute, `App.svelte`, `features.js`, Navigation, Abfragen …); die Zuordnung unklar ist; Build-, Konfigurations- oder Workflow-Dateien oder Bilder geändert werden; mehr als 250 Tests gefunden werden.
- Gemessen an den letzten 120 Änderungen: 36 liefen mit Auswahl (im Mittel rund 50 statt 570 Tests), 6 ohne Handy-Tests, 78 weiter mit allem. Die Rechnerzeit sinkt deshalb deutlich, die Zahl der Rechner nur um etwa ein Fünftel.
- In der App ändert sich nichts.

## Was fällt weg oder rutscht tiefer
- Weg: Bei einem PR laufen nicht mehr alle Handy-Tests. Bricht ein PR etwas auf einer Seite, die er nicht berührt und deren Verbindung die Zuordnung nicht erkennt (zum Beispiel ein Test, der die Seite nur über einen Tipp erreicht), zeigt sich das erst nachts in der «Volle Prüfung» («Volle Prüfung: ein Test ist rot», mit den verdächtigen PRs).
- Weg: Texte allein lösen keinen Handy-Test mehr aus. Ein Test, der einen Text sucht, den ein anderer PR geändert hat, wird nachts rot, nicht im PR.

## Selbst entschieden
- Kern: `flow.spec.js` und `guard.spec.js`. Beide sind klein und decken Start, Tour und Layout ab.
- Obergrenze 250 Tests, danach läuft alles (ist gleich schnell verteilt, die Auswahl bringt dann nichts).
- Die Zuordnung ist vorsichtig: im Zweifel läuft alles. Wo die Zuordnung noch grob ist (Seiten «Ich» und «Material» kommen in vielen Tests als Zwischenstation vor), laufen eher zu viele Tests als zu wenige.
- Nichts abgebrochen: die Regel «ein neuer Lauf desselben PR ersetzt den alten» gilt schon (`concurrency` pro PR in `deploy.yml`).

## Entscheide (für decisions.md)
- 05.11.2026: Handy-Tests nur für den betroffenen Bereich (Noah «3a ja»).

## Stand im Plan
- Verschlanken (Tests und Tempo): Schritt 3 erledigt (Auswahl). Noch offen: Mittagsprüfung (4b), Auswahl auch für Dateien, die jede Seite lädt (Heute), nach Blick auf die Zahlen.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Im nächsten PR, der nur eine Seite betrifft (zum Beispiel «Ausgeliehen»), zeigt «e2e (phone)» in den Actions nur 1 bis 2 Teile mit Arbeit, die anderen sind in einer Minute fertig und grün.
2. Im Schritt «scope» des Teils steht `mode=specs` und die Liste der Tests.
3. Am Morgen nach dem Merge ist die «Volle Prüfung» der Nacht grün.
