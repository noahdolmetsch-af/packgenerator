# Gestern nachtragen: ein Tag und eine Uhrzeit im Abhak-Fenster

PR #<Nummer> · 21.11.2026 · Auftrag: Noah 21.11.2026 («bitte hiermit fortfahren»; Vereinfachen-Runde «1a 2a 3a 4a 5a», Punkt 4a), Thread «Training erfassen vereinfachen»

## Was ist neu
- Im Abhak-Fenster einer Kachel (Aktiv › «•••» an der Kachel) steht ganz oben «Wann»: Heute, Gestern, der Tag davor und «Anderer Tag» (ein Datumsfeld, bis ein Jahr zurück). Darunter eine freiwillige Uhrzeit.
- Der Eintrag zählt an diesem Tag: «Geschafft» zeigt den Tag, der Verlauf, die Wochenziele und Auswerten lesen ihn dort. Für heute zählt er nicht.
- Für einen früheren Tag sagt eine Zeile unter «Wann», wofür man abhakt («Du hakst für Montag, 9. November ab …»), und die Meldung nach dem Abhaken nennt den Tag («· für gestern»). «Rückgängig» nimmt den Eintrag zurück wie immer.
- Ein Tag in der Zukunft oder mehr als ein Jahr zurück sagt es und lässt «Abhaken» nicht zu. Eine Uhrzeit in der Zukunft von heute gilt als «jetzt».
- Das Feld «Eigene Dauer» (PR 1347) steht jetzt auch in diesem Fenster neben den Dauer-Knöpfen (15, 30, 45, 60).

## Was fällt weg oder rutscht tiefer
- Nichts. Wer nichts wählt, hakt wie bisher für heute ab. «Wann» steht im selben Fenster, das schon Ort, Dauer und Stoppuhr hat.

## Selbst entschieden
- Keine Datenänderung: `flowLog` hat seit «Im Flow» die Felder `day` (der Tag, an dem es zählt) und `at` (der Zeitpunkt). Keine neue Tabelle, kein neuer Index, keine Schema-Version, kein neues Feld. Ein früherer Tag ohne Uhrzeit bekommt 12:00 Uhr als `at`.
- Der Auftrag nannte «bis 7 Tage zurück»; Noah schrieb «frei wählbar» (Datum und Uhrzeit). Darum: drei Knöpfe für die nächsten Tage und ein freies Datum bis ein Jahr zurück.
- Meilenstein-Sterne werden wie bisher mit dem heutigen Tag geprüft (ein nachgetragener Tag vergibt einen Stern am Tag des Eintrags, nicht rückwirkend).
- Der Pendel-Knopf («Pendeln») im selben Fenster nimmt den gewählten Tag mit; die Stoppuhr läuft immer jetzt.
- Dauer-Feld und «Wann» in einem PR, weil beide dasselbe Fenster betreffen.
- Nicht in diesem PR (kommt mit den nächsten Schritten der Vereinfachen-Runde): «Heute · Gestern» in der Liste «Heute dran» auf Heute.
- Fertig-Regel: Seite (`f.geschafft`/Aktiv unverändert), Absprung unverändert, «Gut zu wissen» unverändert, leerer Zustand unverändert, nächster Schritt: die Meldung führt wie immer zu «Geschafft»; App-Stand (Zeile «Aktiv» ergänzt).

## Entscheide (eigene Datei `docs/decisions/gestern-nachtragen.md`)
- 21.11.2026: Abhaken geht für jeden Tag bis ein Jahr zurück, mit freiwilliger Uhrzeit (Noah).

## Stand im Plan (roadmap.md / vorhaben.md)
- Vereinfachen, Schritt 1 «Gestern nachtragen»: Abhak-Fenster fertig; Schritt 2 (Liste «Heute dran» mit «Heute · Gestern») folgt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Aktiv: bei «Yoga» auf «•••» tippen. Oben steht «Wann» mit «Heute» gewählt.
2. «Gestern» wählen und «Abhaken» tippen: Die Meldung sagt «· für gestern»; «Was du gemacht hast» zeigt den gestrigen Tag.
3. Wieder «•••», «Anderer Tag», ein Datum und «07:30» eingeben, «Abhaken»: Das Training steht an diesem Tag im Verlauf.
4. Im selben Fenster 75 ins Feld «Eigene Dauer», «Setzen», «Abhaken»: «Geschafft» zeigt 75 Min.
