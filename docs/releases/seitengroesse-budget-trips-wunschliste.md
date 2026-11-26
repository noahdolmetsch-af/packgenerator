# Seitengrösse: Budget für «Touren» und «Wunschliste» angehoben, main wieder grün

PR #1782 · 25.11.2026 · Auftrag: main reparieren (Bündler, Vorrang; gemeldet vom Thread «Wi gaht's?» bei PR 1777: `seitengroesse.spec.js` war schon auf main rot)

## Was ist neu
- Nichts Sichtbares geändert. Der Wächter «Seitengrösse» (`tests/seitengroesse-budget.json`) zählt die Elemente der langsamsten Seiten auf dem Handy; zwei Seiten lagen darüber: `#/trips` 1680 statt 1620 Elemente (3,7 % mehr), `#/gear?tab=wishlist` 1542 statt 1540. Die Zahl ist auf jedem Rechner gleich, es war also kein Wackler: der Test war auf main rot, fiel aber nur in PRs auf (die CI auf main baut nur).
- **Woher:** Bisect auf main: die Seite «Touren» ist seit dem Velos-Umbau (PR 1702, «Pflege vor Taschen, Fahrtenbuch und Inspektion», 24.11.) über dem Budget (1622) und danach Schritt für Schritt gewachsen (1668, 1676 mit «Dein Stand in Zahlen» auf Velos und Material, 1680 heute). Keine einzelne Änderung hat viel gebracht.
- **Fix:** das Budget beider Seiten steigt auf die heutige Zahl plus rund 3 % (`#/trips` 1730, `#/gear?tab=wishlist` 1590), wie bei PR 1684 («Grenzen für Aktiv und Meine Sportarten angehoben»). Alle anderen Seiten behalten ihr Budget. Der Wächter hält die Seiten weiter von stillem Wachsen ab, mit kleinerem Spielraum als die üblichen 12 %.
- **Dazu drei Tests, die in der vollen Prüfung dieses PR rot wurden (Teil 4 von 5), mit Ursache:**
  - `sonnen-ausfahrt.spec.js:145` (kurzer Schlaf): auf main seit PR 1769 («Wi gaht's? am Abend») rot, jedes Mal. Das Morgenfenster öffnet sich seit dort nur noch auf Wunsch und nicht mehr von selbst; der Test wartete 15 Sekunden auf dieses Fenster. Bisect lokal: PR 1766 grün, PR 1769 rot. Der Test prüft jetzt, dass das Fenster nicht aufgeht (so, wie es der Satz im Test schon sagte). Die CI hat es nicht gesehen, weil PR 1769 diese Datei nicht berührte.
  - `ski.spec.js:121` (Rucksack-Check): las die Gruppen sofort nach der Überschrift, bevor sie gebaut waren (leere Liste). Wartet jetzt auf die fünf Gruppen.
  - `sn5plus.spec.js:186` (Import prüfen): «Übernehmen» heisst auch der Knopf der Namensvorschläge unter Ich › Daten (`data-name-take`), die beim Wechsel zur Import-Seite noch im Bild sind: zehn Treffer statt einer. Der Test nimmt nur den Knopf der Import-Seite.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Budget anheben statt Seite leichter machen: 60 Elemente (3,7 %) wären nur mit einem Umbau der Seite «Touren» weg (zugeklappte Teile erst beim Öffnen bauen), und das ist App-Arbeit mit Bildern, nicht Sache des Wackel-Threads. Die Frage «Touren wieder leichter?» geht an den Thread «Tempo» (Priorität von Noah: schnellere App). Kleiner Spielraum (3 %) statt der üblichen 12 %, damit der Wächter weiter anschlägt.

## Entscheide
- keine.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. In GitHub: `e2e` grün (`seitengroesse.spec.js` auf Computer und Handy). In der App nichts zu prüfen.
