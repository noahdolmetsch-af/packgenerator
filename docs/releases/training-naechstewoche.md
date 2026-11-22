# Rückblick schlägt die nächste Woche vor

PR folgt · 07.11.2026 · Auftrag: Noah «8 Rückblick schlägt nächste Woche vor» (Thread «Verbessern Training: intelligentere Wochenpläne»)

## Was ist neu
- **Grund** (Noah «1-3 a»): Die Karte sagt, warum («2 geplante Einheiten sind letzte Woche ausgefallen», «Alle geplanten Einheiten … gemacht», «Nichts geplant»).
- **Eigene Sportarten:** Sie zeigt dein Ziel pro Sportart (z. B. «Lauf 2×»); der Wochenvorschlag nutzt es schon.
- **Wann:** ab Freitag bis zum Sonntag, bis die nächste Woche geplant ist; «Jetzt nicht» legt sie für diese Woche weg (`training.nextkeep`).
- Im «Rückblick» auf Aktiv › Training steht unter «Nächste Woche» (wenn letzte Woche Trainingszeit da ist): «Ähnlich weiter», «Etwas mehr» (+10 %, mindestens +½ h), «Entlastung» (60 %), je mit den Stunden.
- Ein Tipp springt auf die nächste Woche und öffnet den Wochenvorschlag mit diesen Stunden. Übernommen wird erst mit «Übernehmen» (mit Rückgängig), alles bleibt änderbar.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Stunden in halben Stunden gerundet, mindestens 1 h; bezogen auf die echte Zeit der letzten Woche (Strava).
- Nur angezeigt, wenn die laufende Woche gezeigt wird, letzte Woche mindestens 1 h da war und es Freitag bis Sonntag ist.
- «Jetzt nicht» statt «Später»: kürzer; die Karte kommt in der nächsten Woche wieder.
- Kein eigener Eintrag in features.js: die Karte gehört zum Rückblick auf der Seite Training.

## Entscheide (für decisions.md)
- 07.11.2026: Der Rückblick wählt nur die Stunden; Aufbau und Details macht weiter der Wochenvorschlag.

## Stand im Plan (roadmap.md / vorhaben.md)
- Training verbessern: Punkt 8 (Rückblick schlägt nächste Woche vor).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Aktiv › Training, zum «Rückblick»: unter «Nächste Woche» «Etwas mehr» tippen.
2. Die Woche springt auf die nächste, der Vorschlag ist offen mit den Stunden.
3. «Übernehmen»: die Woche ist geplant, «Rückgängig» holt es zurück.
