# Fragen aus der Fahrdatei

PR #<Nummer> · 23.11.2026 · Auftrag: Noah «P1 und p2 k1 k2 k3 u1 u2 r1 r2 r3» (Thread «Bikepacking-Rennen: Stand und Ideen zeigen»), Vorschlag R2

## Was ist neu
- Auf der Fahrtenseite («Erkenntnisse von dieser Fahrt») stellt die App neu zwei Fragen aus der Temperatur der Datei: ab einer Stunde unter 5 °C «3 Std. unter 5 °C. Hast du gefroren?», ab einer Stunde über 28 °C «Hast du genug getrunken?». Bei älteren Fahrten ohne Zeitangabe reicht ein kältester Punkt von 0 °C oder weniger, ein wärmster von 32 °C oder mehr.
- «Ja, merken» legt eine Regel an (Thema Wetter), die beim nächsten Packen unter den Erkenntnissen der Tour auftaucht («warme Kleider, Handschuhe und ein Buff einpacken» oder «mehr Wasser, ein leichtes Shirt und Sonnencreme»). «Nein» behält nichts.
- Neue Fahrten merken sich die Minuten unter 5 und über 28 °C in der Fahrt (`sensors.coldMin`, `hotMin`); ältere Fahrten bleiben, wie sie sind.

## Was fällt weg oder rutscht tiefer
- nichts. Es sind bis zu vier statt drei Vorschläge pro Fahrt.

## Selbst entschieden
- Keine neue Seite und keine neue Tabelle: die Fragen sind zwei weitere Vorschläge der bestehenden «Erkenntnisse von dieser Fahrt».
- Pause und Tempo gab es schon; der Puls (Zeit in hohen Zonen) kommt später, weil er die Zonen der Person braucht.
- Die Schwellen (5 °C, 28 °C, 60 Minuten) stehen als Konstanten in `src/lib/gpx.js`.
- Keine Änderung am Datenformat: die Fahrt bekommt zwei Zahlen mehr im Feld `sensors`; die Sicherung liest sie wie bisher.

## Entscheide (eigene Datei `docs/decisions/fahrdatei-fragen.md`)
- 23.11.2026: R2 freigegeben (alle neun Vorschläge)

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Im Rückblick «Fahrt hochladen» tippen und eine Fahrdatei mit Temperatur wählen (Radcomputer, kalter oder heisser Tag), speichern.
2. Unter «Erkenntnisse von dieser Fahrt» die Frage zur Kälte oder Hitze lesen.
3. «Ja, merken» tippen: die Regel steht unter Rückblick → Erkenntnisse; «Nein» behält nichts.
