# Erholung und Rituale

Auftrag: Noah «1a 2a 3 gym normalfall 1h sonst a 4b 5a» (22.11.2026, Thread «Alle Sportarten und Erholung», Schritt J); «alles freigegeben» 23.11.2026

## Was ist neu
- Karte «Erholung und Rituale» im Wochenrückblick (unter «Form und Erholung») und im Sportjahr (über «Haken und Rhythmus»): Sauna, Meditation, Freunde, Kaltwasser, Nap, Wald und alles, was in den Ringen Ruhe und Geist liegt, als Mal pro Woche, an wie vielen Tagen, mit dem Ziel der Aktivität. Im Sportjahr zusätzlich das Mittel pro Woche und das Jahr davor.
- Zeit steht nur, wo sie gemessen wurde. Die übliche Dauer («ca.») wird bei Ritualen nicht aufsummiert. Ritualminuten zählen nie in die Sportstunden.
- Rechnung rein lesend (`src/lib/flow/rituale.js`), keine neue Einstellung, kein Schema.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Aktivitäten mit Ziel, aber ohne Haken, stehen mit «0 Mal» da (so sieht man das Ziel); pausierte Aktivitäten und solche ohne Ziel und ohne Haken nicht.
- Haken von Tourtagen (`via: 'trip'`) zählen im Rückblick nicht, wie bei den Sportzahlen.
- Wer keine Aktivität in den Ringen Ruhe oder Geist hat, sieht keine Karte (der Einstieg ist «Meine Aktivitäten»).
- Eigene Gruppen: «Freunde» und «Wald» erscheinen, sobald sie als Aktivität im Ring Ruhe oder Geist angelegt sind; ihren Ring ändert Noah in «Meine Aktivitäten».

## Entscheide (eigene Datei `docs/decisions/erholung-rituale.md`)
- 22.11.2026: Rituale als Mal pro Woche mit Ziel, nie als Sportstunden.

## Stand im Plan (roadmap.md / vorhaben.md)
- Alle Sportarten und Erholung: J erledigt; K und L folgen.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Wochenrückblick: Karte «Erholung und Rituale» mit deinen Ritualen, den Malen der Woche und dem Ziel.
2. Auswerten › Sportjahr: dieselbe Karte für den Zeitraum, im Jahr mit «Im Jahr davor».
