# Keine halb leeren Zeilen auf Heute (Handy)

PR #? · 05.11.2026 · Auftrag: Noah «ETAPPE 1» (Frontend-Durchklick, Thread «Durchklicken Etappe 1: Heute und Ich»)

Fund E1-001 des Durchklicks mit dem echten Backup (Klasse C, Anzeige). Hier steht kein Wert aus den echten Daten; der Fehler lässt sich mit erfundenen Testdaten nachstellen (`tests/e2e/heute-halbe-karte.spec.js`).

## Was ist neu
- Auf dem Handy (4 Spalten) füllt eine kleine Karte von Heute (Grösse «w», z. B. «Heute-Check», «VO₂max»), die keine zweite kleine Karte neben sich hat, die ganze Zeile. Vorher stand sie allein auf halber Breite, rechts blieb eine leere Hälfte, und der Text brach in eine schmale Spalte um.
- Auf dem Computer galt die Regel schon («Heute ruhiger» 3a, 8 Spalten); jetzt gilt sie mit `fillers(tiles, 4)` auch auf dem Handy.

## Was fällt weg oder rutscht tiefer
- nichts. Zwei kleine Karten stehen weiter nebeneinander; nur eine einzelne wird breiter.

## Selbst entschieden
- Die Regel ist dieselbe wie auf dem Computer (eine Karte, die ihre Zeile halb leer liesse, streckt sich bis zum Zeilenende); sie wurde nur auf 4 Spalten übertragen.
- Keine neue Funktion, daher keine Zeile in `docs/app-stand.md` und kein Eintrag in `features.js`.

## Entscheide (für decisions.md)
- keine

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung
