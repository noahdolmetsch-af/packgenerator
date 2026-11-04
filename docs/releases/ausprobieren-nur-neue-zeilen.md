# «Ausprobieren» pro PR nur mit den eigenen Zeilen

PR (diese Änderung) · 03.11.2026 · Auftrag: Noah «1a» (Thread «Prüfen: Warum die Tests langsam sind»)

## Was ist neu
- Der Handy-Test «Ausprobieren» (jede Zeile unter Ich › Was ist neu führt an den richtigen Ort) tippt in einem PR nur noch die Zeilen der eigenen News-Datei. Heute sind es 555 Zeilen in 15 Teilen, danach meist 1 Teil.
- Die Nacht-Prüfung tippt weiter alle Zeilen.
- `scripts/ci-scope.mjs` rechnet aus den geänderten Dateien aus, welche Zeilen (`news=`); `deploy.yml` gibt das als `NEWS_ONLY` an den Test.
- In der App ändert sich nichts.

## Was fällt weg oder rutscht tiefer
- Weg: In einem PR werden alte Zeilen nicht mehr getippt. Bricht ein PR den Ort einer alten Zeile (zum Beispiel ein umbenanntes Merkmal), zeigt sich das erst nachts als Meldung «Volle Prüfung: ein Test ist rot». Ändert ein PR die Update-Liste, die Ziel-Tabelle, `src/lib/know/`, die Seite «Was ist neu» oder die Test-Helfer, laufen weiter alle Zeilen.

## Selbst entschieden
- Mit `NEWS_ONLY` nicht gesetzt (Nacht, lokal) oder `all` läuft alles wie bisher; leer heisst keine Zeilen, es bleibt nur der Kurztest «Neu» (1 Teil).
- Ein PR ohne News-Datei tippt keine Zeile.

## Entscheide (für decisions.md)
- 03.11.2026: «Ausprobieren» pro PR nur eigene Zeilen (Noah «1a»).

## Stand im Plan
- Verschlanken (Tests und Tempo): Schritt 1 der Messung vom 03.11.2026. Schritt 3 (Handy-Tests nur für den betroffenen Bereich) folgt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Im nächsten PR mit News-Datei zeigt Handy-Teil 1 in den Actions nur noch wenige «Ausprobieren»-Tests (ein Teil statt 15).
2. Am Morgen nach dem Merge steht der Lauf der Nacht-Prüfung mit allen Zeilen grün da.
