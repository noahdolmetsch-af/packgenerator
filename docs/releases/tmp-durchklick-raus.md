# Probe-Specs tmp-durchklick laufen nicht mehr in der Prüfung

PR (diese Änderung) · 06.11.2026 · Auftrag: Koordinator, Befund aus dem Nebelgrenze-Thread (Thread «Prüfen: Warum die Tests langsam sind»)

## Was ist neu
- Die 9 Specs in `tests/e2e/tmp-durchklick/` (Durchklicken, Zufallstests, Wiederholungen, Bildschirmfotos) kamen mit #990 versehentlich auf main. Ihre eigene Kopfzeile sagt «temporary, not committed». Sie haben 30 bis 60 Minuten Zeitlimit, schreiben nach `/tmp` und prüfen nichts. Sie liefen in jedem Handy-Lauf mit und haben Teil 4 ins 35-Minuten-Limit getrieben (#1015, #993).
- `playwright.config.js` übergeht den Ordner jetzt überall: in der Prüfung der PRs, in der Nacht-Prüfung und im Gesamttest. Von Hand laufen sie weiter: `TMP_DURCHKLICK=1 npx playwright test tests/e2e/tmp-durchklick`.
- Ein Test in `tests/ci-image.test.js` sorgt dafür, dass die Regel bleibt und kein Workflow sie anschaltet.
- In der App ändert sich nichts.

## Was fällt weg oder rutscht tiefer
- Die 9 Probe-Specs laufen nicht mehr bei jedem PR und nicht mehr nachts. Sie haben nichts geprüft, was ein Fehler wäre (nur Protokolle in `/tmp`).

## Selbst entschieden
- Nicht «nur nachts», sondern gar nicht in der Prüfung: ein Lauf mit 60 Minuten Zeitlimit passt auch nicht in die Nacht-Prüfung, und ohne Behauptung zeigt er nichts.
- Die Dateien bleiben im Repo, damit der Thread, der sie gebraucht hat, sie von Hand starten kann. Löschen wäre der nächste Schritt, wenn niemand sie mehr braucht.
- `.github/workflows/deploy.yml` ist unverändert; das 35-Minuten-Limit bleibt, bis die neue Teil-4-Zeit sichtbar ist.
- `docs/app-stand.md` unverändert: keine App-Funktion.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan
- Verschlanken (Tests und Tempo): zusätzlicher Schritt zum Test-Plan, Ursache für das 35-Minuten-Limit bei Teil 4.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Beim nächsten PR mit dem Label «ok» in «e2e-part (4)» den Log öffnen: keine Zeilen mit `tmp-durchklick`.
2. Die Laufzeit von Teil 4 liegt wieder bei etwa 20 Minuten.
