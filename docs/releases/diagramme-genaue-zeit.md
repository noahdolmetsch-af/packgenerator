# Genaue Zeit beim Zeigen auf ein Diagramm

21.11.2026 · Auftrag: Noah «1a 2b 3a» (Thread «Diagramme antippbar und genau machen»), Sportjahr, Rückblick pro Sportart, Meine Woche

## Was ist neu
- Beim Zeigen oder Tippen auf einen Balken steht die Zeit als «34 h 24 min» statt auf eine Stunde gerundet (Zeile über dem Diagramm, Tabelle, Fenster). Ein gemeinsamer Baustein `hoursMin` (`src/lib/charts/exact.js`).
- Die kurze Zahl auf dem Balken und die Kacheln mit den Summen bleiben kurz (Noah «1a»).

## Was fällt weg oder rutscht tiefer
- nichts. Die Zeilen sind etwas länger.

## Selbst entschieden
- Nur Diagramme mit Stunden brauchten die Änderung. Die anderen Diagramme zeigen ganze Zahlen (Puls, Watt, Belastung) oder schon eine oder zwei Stellen und bleiben.
- Die Tabelle von «Meine Woche» zeigte schon «h:mm» und bleibt.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Diagramme besser machen: Schritt 0 von 7 (genaue Werte). Danach Handy-Grösse, Farben, «Keine Daten», Vergleich, Satz, Weiterführen, Zeitraum merken.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auswerten › Sportjahr › «Jahr»: auf einen Monat zeigen, die Stunden stehen als Stunden und Minuten.
2. Den Monat antippen: das Fenster nennt die Sportarten mit genauer Zeit.
3. «Als Tabelle»: die Spalte «Stunden» zeigt Stunden und Minuten.
