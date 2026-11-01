# Wächter: jede Funktion ist überall vollständig

PR #? · 29.10.2026 · Auftrag: Noah «1a 2a 3a» (Thread «Liste aller Funktionen»), Heute als Begleiter PR 13 von 13 (10 und 11 gestrichen, Noah «a» 29.10.2026)

## Was ist neu
- Ein neuer Test `tests/funktion-vollstaendig.test.js` prüft bei jeder Änderung, dass jede Funktion des Katalogs: Titel und Text (deutsch), einen Handbuch-Eintrag, «So geht's» mit genau 3 kurzen Schritten (deutsch), genau einen Moment und eine Heimseite oder einen Grund (GAPS) hat. Er prüft auch, dass keine Liste eine Funktion nennt, die der Katalog nicht kennt, und dass jeder Eintrag von «Gesten und Tricks» deutsch ist.
- Fehlt etwas, nennt der Test die Funktion und die Stelle.
- Der Test lief grün auf dem heutigen Stand: es fehlt nichts.

## Was fällt weg oder rutscht tiefer
- nichts (kein sichtbarer Unterschied in der App)

## Selbst entschieden
- Bestehende Einzeltests bleiben; der neue bündelt sie zu einer Fehlermeldung pro Lücke.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Vorhaben 15 «Heute als Begleiter»: PR 13 von 13; PR 4, 5, 7–9 offen.

## Prüfschritte
- Nichts zu sehen, der Test läuft bei jedem PR in der Prüfung (build).
