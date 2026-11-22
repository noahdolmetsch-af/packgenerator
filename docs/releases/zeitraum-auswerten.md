# Ein Zeitraum für Auswerten

PR #941 · 05.11.2026 · Auftrag: Noah «Idee A verwerfen. Idee B: 1a 2b 3a 4a» (Thread «Aktiv und Auswerten»)

## Was ist neu
- Auf Auswerten steht oben ein Schalter «Zeitraum»: **Woche, Monat, Jahr, Alles, Eigener Zeitraum**. Woche, Monat und Jahr lassen sich mit ‹ › zurückblättern (nie über heute hinaus); «Eigener Zeitraum» hat zwei Datumsfelder.
- Dem Zeitraum folgen die **Liste der Sportarten** (früher fest «Letzte 7 Tage», jetzt mit dem Namen des Zeitraums) und der **Mittelwert bei «Wi gaht's?»** (früher «⌀ 7 Tage»).
- Die Wahl wird auf diesem Gerät gemerkt (`pg.period`: Modus und eigener Zeitraum); das Zurückblättern beginnt bei jedem Besuch wieder bei heute.
- Reine Rechnung in `src/lib/flow/zeitraum.js` (`rangeOf`, `step`, `labelOf`), die Listen in `rangeSummary` (`uebersicht.js`) und `averagesBetween` (`flowcheck.js`); `lastWeek` bleibt als Sonderfall.

## Was fällt weg oder rutscht tiefer
- nichts bei der Voreinstellung «Woche»: dann sieht Auswerten aus wie bisher, mit dem Schalter zusätzlich ganz oben.
- «Deine Woche in Zahlen» (mit Vergleich zu den 4 Wochen davor) steht nur noch bei «Woche» von heute; bei einem anderen Zeitraum fehlt sie, weil ihr Vergleich eine Woche ist. Die Seite bleibt über Aktiv erreichbar.

## Selbst entschieden
- 4a: «Heute», «Im Fokus» und «Überblick» und die Form-Karte haben keinen Zeitraum; eine Zeile unter dem Schalter sagt das.
- Die Woche ist weiter die laufenden 7 Tage bis heute (wie «Letzte 7 Tage»), Monat und Jahr sind Kalendermonat und Kalenderjahr.
- «Alles» beginnt am ersten Tag mit Daten; ein eigener Zeitraum mit nur einem Datum zählt wie die letzten 7 Tage, bis das zweite Datum gesetzt ist (mit Hinweis).
- Kein neuer Eintrag in `features.js`: es ist ein Schalter auf der bestehenden Seite Auswerten. Die Zeile in `docs/app-stand.md` ist erweitert.
- Leerer Zeitraum: «In diesem Zeitraum ist nichts erfasst.» statt einer leeren Karte.

## Stand im Plan (roadmap.md / vorhaben.md)
- Aktiv und Auswerten: Idee B gebaut; Idee A («Weiter, wo ich war») von Noah verworfen. Schritt 9 («Das fällt auf») wartet weiter.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auswerten öffnen: oben steht der Schalter, «Woche» ist gewählt, die Liste heisst «Letzte 7 Tage».
2. «Monat» tippen: die Liste heisst nach dem Monat; ‹ zeigt den Monat davor, › ist bei heute grau.
3. «Alles» tippen, dann «Eigener Zeitraum»: zwei Datumsfelder; Seite neu laden, die Wahl ist noch da.
