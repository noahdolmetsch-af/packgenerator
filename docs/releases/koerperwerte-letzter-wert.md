# Körperwerte nie leer: letzter Wert mit Tag, Hinweis, Fitbit beim Ziehen

PR · 07.11.2026 · Auftrag: Noah «1a 2a 3a 4a» (Thread «Klären leere Körperwerte auf Heute»)

## Was ist neu
- «Dein Körper heute»: Fehlt ein Wert von heute (zum Beispiel Ruhepuls und Schlaf am Morgen), zeigt die Kachel für genau diesen Wert den letzten der letzten 7 Tage gross, mit «von gestern» oder dem Datum. Vorher galt das nur, wenn alle vier Werte fehlten; war nur ein Wert von heute da (etwa die Aktivzonen-Minuten), standen «–» und «gestern 54» daneben.
- Eine Zeile unter den Werten sagt, dass Fitbit noch nicht alles von heute geliefert hat, mit «Jetzt holen».
- Heute ganz oben nach unten ziehen holt jetzt auch die Fitbit-Werte (wenn verbunden und ein Schlüssel auf dem Gerät ist), höchstens 15 Sekunden lang.

## Was fällt weg oder rutscht tiefer
- Das «–» mit «gestern 54» daneben fällt weg: der Wert steht jetzt gross, der Tag klein dahinter.

## Selbst entschieden
- Der Pfeil (Vergleich mit gestern) fehlt bei einem Wert vom Vortag; bei heutigen Werten in einer gemischten Kachel steht «heute», wo sonst kein Vergleich möglich ist.
- Die Hinweiszeile erscheint nur mit Fitbit verbunden; bei einem Fehler bleibt der bestehende Knopf «Jetzt nochmals versuchen» (kein zweiter Knopf).
- «Jetzt laden» (Update-Balken): Noah sagt «nichts passiert». Das wird in einem eigenen PR untersucht (eine Änderung, ein PR).

## Entscheide (für decisions.md)
- Keiner neu.

## Stand im Plan
- Fitbit-Werte immer aktuell: letzter Wert pro Wert statt alles-oder-nichts.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute öffnen: unter «Dein Körper heute» steht bei jedem fehlenden Wert der letzte mit «von gestern», kein «–».
2. Die Zeile «Fitbit hat noch nicht alle Werte von heute geliefert» mit «Jetzt holen» tippen: die Werte aktualisieren sich.
3. Am Handy Heute oben nach unten ziehen: das Rad meldet «Wetter, Strava und Fitbit werden neu geladen …».
