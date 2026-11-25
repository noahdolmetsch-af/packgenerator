# Seitengrösse: Budget für «Touren» und «Wunschliste» angehoben, main wieder grün

PR #1782 · 25.11.2026 · Auftrag: main reparieren (Bündler, Vorrang; gemeldet vom Thread «Wi gaht's?» bei PR 1777: `seitengroesse.spec.js` war schon auf main rot)

## Was ist neu
- Nichts Sichtbares geändert. Der Wächter «Seitengrösse» (`tests/seitengroesse-budget.json`) zählt die Elemente der langsamsten Seiten auf dem Handy; zwei Seiten lagen darüber: `#/trips` 1680 statt 1620 Elemente (3,7 % mehr), `#/gear?tab=wishlist` 1542 statt 1540. Die Zahl ist auf jedem Rechner gleich, es war also kein Wackler: der Test war auf main rot, fiel aber nur in PRs auf (die CI auf main baut nur).
- **Woher:** Bisect auf main: die Seite «Touren» ist seit dem Velos-Umbau (PR 1702, «Pflege vor Taschen, Fahrtenbuch und Inspektion», 24.11.) über dem Budget (1622) und danach Schritt für Schritt gewachsen (1668, 1676 mit «Dein Stand in Zahlen» auf Velos und Material, 1680 heute). Keine einzelne Änderung hat viel gebracht.
- **Fix:** das Budget beider Seiten steigt auf die heutige Zahl plus rund 3 % (`#/trips` 1730, `#/gear?tab=wishlist` 1590), wie bei PR 1684 («Grenzen für Aktiv und Meine Sportarten angehoben»). Alle anderen Seiten behalten ihr Budget. Der Wächter hält die Seiten weiter von stillem Wachsen ab, mit kleinerem Spielraum als die üblichen 12 %.

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
