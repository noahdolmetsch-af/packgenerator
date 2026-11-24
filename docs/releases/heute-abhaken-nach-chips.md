# «Heute abhaken» steht direkt nach den Chips

Auftrag: Noah 23.11.2026 «1a» (Thread «Prototyp», Prüfung Heute); Ziele Klarheit und Auffindbarkeit (Noah 23.11.2026 18:09)

## Was ist neu
- Der Block **«Heute abhaken»** steht jetzt **gleich unter den Chips** («Heute fahren», «Abhaken» …), noch vor der Zeile «n Dinge dran», vor «Heute entdecken» und vor allen Kacheln. Das Häufigste (abhaken) liegt damit am Anfang der Seite, ohne zu suchen.
- Der Block ist nicht mehr eine Kachel der Wand. Beim Anpassen von Heute («Startseite anpassen») steht er wie bisher als Kachel der Wand: verschieben, ausblenden, Grösse ändern. Ist er ausgeblendet, steht auch oben nichts.
- Nichts am Block selbst ändert sich (Kacheln, «n offen», «Alle ›», «Rückgängig»).

## Was fällt weg oder rutscht tiefer
- Nichts fällt weg. Die Karten «Abenteuer im Monat» und «Heute entdecken» rutschen eine Stelle tiefer (unter «Heute abhaken»); die Zeile «n Dinge dran» ebenfalls. Alt: Chips, Satz, Karten, dann «Heute abhaken» als erste Kachel. Neu: Chips, «Heute abhaken», Satz, Karten, Wand.

## Selbst entschieden
- **Wand bleibt gleich:** die gespeicherte Wand (Version 23) ändert sich nicht, keine Datenänderung. Der Block bleibt in der Wand gespeichert, nur die Anzeige holt ihn nach oben.
- **Fertig-Regel:** Seite und Absprung: der Block selbst; Leer-Zustand und nächster Schritt wie in «Heute abhaken als erster Block»; keine neue Funktion in `features.js`.
- Tests: `tests/e2e/bedienung.spec.js` «night quiet» wartete auf das Körper-Band; auf dem leeren Gerät steht seit «Starte hier» (1633) die Karte `[data-start-here]` (Test war auf main rot).
- Tests: Reihenfolge-Annahmen in `heute-a`, `heute-p6`, `heute-ruhig`, `home-0460`, `meine-tour` und `heute-haken-block` auf die neue Stelle angepasst (`[data-haken-top]` nach `.ghead`, vor `.wall`).

## Wie das zu Klarheit und Auffindbarkeit beiträgt
- Eine Hauptsache am Seitenanfang: nach dem Gruss kommt gleich das Abhaken, das am häufigsten gebraucht wird.

## Entscheide (für decisions.md)
- Keine neue Entscheidung (Noah 23.11.2026 «1a» steht in `docs/decisions/heute-abhaken-block.md`).

## Stand im Plan (roadmap.md / vorhaben.md)
- Plan unverändert.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute öffnen: gleich unter den Chips steht «Heute abhaken».
2. Eine Kachel antippen: abgehakt, «Rückgängig» erscheint.
3. «Startseite anpassen» tippen: «Heute abhaken» steht als Kachel in der Wand und lässt sich verschieben.
