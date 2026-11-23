# Rückblick in drei Stufen

PR #<Nummer> · 23.11.2026 · Auftrag: Noah «P1 und p2 k1 k2 k3 u1 u2 r1 r2 r3» (Thread «Bikepacking-Rennen: Stand und Ideen zeigen»), Vorschlag R1

## Was ist neu
- Im gespeicherten Rückblick einer Tour steht (nach «Aus jeder Tour lernen») die Karte «Später, je drei Fragen»: nach 1 Tag, 1 Woche und 1 Monat je drei kurze Fragen, ab dem letzten Tag der Tour gezählt.
  - Nach 1 Tag: Was tut weh? Was weisst du nach einer Nacht Schlaf? Was war der beste Moment?
  - Nach 1 Woche: Woran denkst du noch? Was würdest du mit den Taschen anders machen? Hat sich dein Körper erholt, wie du dachtest?
  - Nach 1 Monat: Was siehst du erst jetzt? Was würdest du dir vor dem nächsten Mal sagen? Was willst du fürs nächste Mal behalten?
- Eine Stufe, die noch nicht dran ist, nennt den Tag («Die Fragen kommen am …»). Eine Stufe, die dran ist, wartet offen. Beantwortete Stufen zeigen die Antworten, «Ändern» ändert sie, alle drei leeren und speichern nimmt sie weg (mit Rückgängig).
- Die Antworten gehören zur Tour (`trip.later`), kein neues Schema, im Backup wie die Tour.

## Was fällt weg oder rutscht tiefer
- nichts. Der Rückblick und alle seine Teile bleiben, die Karte steht unter «Aus jeder Tour lernen».

## Selbst entschieden
- Jede Antwort ist freiwillig, eine Stufe darf leer bleiben (Regel «alles ist ein Vorschlag»).
- Die Fragen sind fest (Vorschlag der App, in den Texten der App); eigene Fragen sind eine mögliche spätere Änderung.
- Noch keine Erinnerung auf Heute («n warten auf deinen Rückblick» zählt weiter nur den Rückblick selbst): wer den Rückblick öffnet, sieht, was dran ist. Eine Erinnerung wäre eine eigene kleine Änderung.
- Die Antworten werden nicht von selbst zu «Erkenntnissen» gemacht; sie stehen bei der Tour. Das wäre eine eigene Änderung mit Rückfrage.
- Daten: ein neues Feld an der Tour (bestehende Zeile), nichts Bestehendes ändert sich; Backup von Noah vom 23.11. 04:47 liegt bereit.

## Entscheide (eigene Datei `docs/decisions/spaeter-fragen.md`)
- 23.11.2026: R1 freigegeben (alle neun Vorschläge, siehe `docs/decisions/garmin-kurspunkte.md`)

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Den Rückblick einer vorbei gegangenen Tour öffnen und zu «Später, je drei Fragen» scrollen.
2. In der Stufe, die dran ist, eine Antwort tippen und «Speichern»: sie steht mit der Frage da.
3. «Ändern», alle Antworten leeren, speichern: die Stufe wartet wieder; «Rückgängig» bringt die Antworten zurück.
