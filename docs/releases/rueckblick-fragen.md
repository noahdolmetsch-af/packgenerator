# Rückblick: Fragen später, aus der Fahrdatei und Mini-Bericht

PR #<Nummer> · 23.11.2026 · Auftrag: Noah «P1 und p2 k1 k2 k3 u1 u2 r1 r2 r3» (Thread «Bikepacking-Rennen: Stand und Ideen zeigen»), gebündelt als ein PR (Bündler 18:14)

Beitrag zu den Zielen (Noah 23.11. 18:09): *Klarheit*: jede Frage steht dort, wo man zurückschaut (Rückblick einer Tour, Seite «Fahrt», Teil «Danach» eines Rennens), mit einer Hauptsache. *Auffindbarkeit*: die Fragen kommen von selbst zur richtigen Zeit; das Bild ist ein Knopf im Teil «Danach».

## Was ist neu
### Rückblick in drei Stufen
- Im gespeicherten Rückblick einer Tour steht (nach «Aus jeder Tour lernen») die Karte «Später, je drei Fragen»: nach 1 Tag, 1 Woche und 1 Monat je drei kurze Fragen, ab dem letzten Tag der Tour gezählt.
  - Nach 1 Tag: Was tut weh? Was weisst du nach einer Nacht Schlaf? Was war der beste Moment?
  - Nach 1 Woche: Woran denkst du noch? Was würdest du mit den Taschen anders machen? Hat sich dein Körper erholt, wie du dachtest?
  - Nach 1 Monat: Was siehst du erst jetzt? Was würdest du dir vor dem nächsten Mal sagen? Was willst du fürs nächste Mal behalten?
- Eine Stufe, die noch nicht dran ist, nennt den Tag («Die Fragen kommen am …»). Eine Stufe, die dran ist, wartet offen. Beantwortete Stufen zeigen die Antworten, «Ändern» ändert sie, alle drei leeren und speichern nimmt sie weg (mit Rückgängig).
- Die Antworten gehören zur Tour (`trip.later`), kein neues Schema, im Backup wie die Tour.

### Fragen aus der Fahrdatei
- Auf der Fahrtenseite («Erkenntnisse von dieser Fahrt») stellt die App neu zwei Fragen aus der Temperatur der Datei: ab einer Stunde unter 5 °C «3 Std. unter 5 °C. Hast du gefroren?», ab einer Stunde über 28 °C «Hast du genug getrunken?». Bei älteren Fahrten ohne Zeitangabe reicht ein kältester Punkt von 0 °C oder weniger, ein wärmster von 32 °C oder mehr.
- «Ja, merken» legt eine Regel an (Thema Wetter), die beim nächsten Packen unter den Erkenntnissen der Tour auftaucht («warme Kleider, Handschuhe und ein Buff einpacken» oder «mehr Wasser, ein leichtes Shirt und Sonnencreme»). «Nein» behält nichts.
- Neue Fahrten merken sich die Minuten unter 5 und über 28 °C in der Fahrt (`sensors.coldMin`, `hotMin`); ältere Fahrten bleiben, wie sie sind.

### Mini-Bericht als Bild
- Im Teil «Danach» hat die Box «Rennbericht» neu den Knopf «Mini-Bericht als Bild»: ein Bild mit der Linie des Rennens und vier Zahlen (km, Höhenmeter, Fahrzeit, Tage), auf dem Gerät gemacht. Mit «Teilen» (Handy) oder «Speichern» (Computer) gehört es dir; wer nicht tippt, teilt nichts.
- Es ist dieselbe Karte wie das «Tourbild» im Rückblick einer Tour (`PostcardSheet.svelte`); für das Rennen nimmt sie die Linie des Rennens.

## Was fällt weg oder rutscht tiefer
- nichts. Was es vorher gab, bleibt, wie es ist (Einzelheiten je Teil unten).

### Rückblick in drei Stufen
- nichts. Der Rückblick und alle seine Teile bleiben, die Karte steht unter «Aus jeder Tour lernen».

### Fragen aus der Fahrdatei
- nichts. Es sind bis zu vier statt drei Vorschläge pro Fahrt.

### Mini-Bericht als Bild
- nichts. Der ausführliche Rennbericht (druckbare Seite) bleibt, wie er ist.

## Selbst entschieden
### Rückblick in drei Stufen
- Jede Antwort ist freiwillig, eine Stufe darf leer bleiben (Regel «alles ist ein Vorschlag»).
- Die Fragen sind fest (Vorschlag der App, in den Texten der App); eigene Fragen sind eine mögliche spätere Änderung.
- Noch keine Erinnerung auf Heute («n warten auf deinen Rückblick» zählt weiter nur den Rückblick selbst): wer den Rückblick öffnet, sieht, was dran ist. Eine Erinnerung wäre eine eigene kleine Änderung.
- Die Antworten werden nicht von selbst zu «Erkenntnissen» gemacht; sie stehen bei der Tour. Das wäre eine eigene Änderung mit Rückfrage.
- Daten: ein neues Feld an der Tour (bestehende Zeile), nichts Bestehendes ändert sich; Backup von Noah vom 23.11. 04:47 liegt bereit.

### Fragen aus der Fahrdatei
- Keine neue Seite und keine neue Tabelle: die Fragen sind zwei weitere Vorschläge der bestehenden «Erkenntnisse von dieser Fahrt».
- Pause und Tempo gab es schon; der Puls (Zeit in hohen Zonen) kommt später, weil er die Zonen der Person braucht.
- Die Schwellen (5 °C, 28 °C, 60 Minuten) stehen als Konstanten in `src/lib/gpx.js`.
- Keine Änderung am Datenformat: die Fahrt bekommt zwei Zahlen mehr im Feld `sensors`; die Sicherung liest sie wie bisher.

### Mini-Bericht als Bild
- Keine neue Bildmaschine: der Vorschlag «Bild mit Linie und vier Zahlen» gibt es schon als Tourbild; sie nochmals zu bauen wäre doppelt. Darum nur der Knopf nach dem Rennen.
- Die Zahlen sind die der Tourbild-Karte: aus den Fahrten dieser Tour (sonst aus der Route). Wer die Fahrten nicht hochgeladen hat, sieht km und Höhenmeter der Route und keine Fahrzeit.
- Das Foto ist freiwillig, wie beim Tourbild.

## Entscheide 
- 23.11.2026: alle neun Vorschläge freigegeben (siehe `docs/decisions/garmin-kurspunkte.md`), eine Datei `docs/decisions/rueckblick-fragen.md`

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung

## Prüfschritte (nach dem Merge auf der echten Seite)
### Rückblick in drei Stufen
1. Den Rückblick einer vorbei gegangenen Tour öffnen und zu «Später, je drei Fragen» scrollen.
2. In der Stufe, die dran ist, eine Antwort tippen und «Speichern»: sie steht mit der Frage da.
3. «Ändern», alle Antworten leeren, speichern: die Stufe wartet wieder; «Rückgängig» bringt die Antworten zurück.

### Fragen aus der Fahrdatei
1. Im Rückblick «Fahrt hochladen» tippen und eine Fahrdatei mit Temperatur wählen (Radcomputer, kalter oder heisser Tag), speichern.
2. Unter «Erkenntnisse von dieser Fahrt» die Frage zur Kälte oder Hitze lesen.
3. «Ja, merken» tippen: die Regel steht unter Rückblick → Erkenntnisse; «Nein» behält nichts.

### Mini-Bericht als Bild
1. Ein Rennen öffnen und zum Teil «Danach» gehen (das Muster-Rennen genügt).
2. In der Box «Rennbericht» «Mini-Bericht als Bild» tippen: ein Bild mit Linie und vier Zahlen erscheint.
3. «Teilen» oder «Speichern» tippen, oder schliessen: nichts wird von selbst geteilt.

## Entscheide 
- 23.11.2026: alle neun Vorschläge freigegeben (siehe `docs/decisions/garmin-kurspunkte.md`), eine Datei `docs/decisions/rueckblick-fragen.md`

## Entscheide 
- 23.11.2026: alle neun Vorschläge freigegeben (siehe `docs/decisions/garmin-kurspunkte.md`), eine Datei `docs/decisions/rueckblick-fragen.md`
