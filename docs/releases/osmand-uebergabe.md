# Mit OsmAnd fahren

PR · 23.11.2026 · Auftrag: Noah «1a» (Thread «Live-Navigation mit OsmAnd und Google vergleichen»)

## Was ist neu
- Auf der Karte «Bereit für unterwegs?» (Live-Seite vor dem Start) steht eine Zeile «Lieber mit OsmAnd fahren?» mit dem Knopf «Mit OsmAnd fahren». Ein Tipp gibt die Strecke samt Läden, Essen, Tankstellen und Wasser als Wegpunkten (GPX) an OsmAnd. Auf dem Handy öffnet sich die Teilen-Liste, sonst wird die Datei gespeichert; eine Zeile sagt, was in OsmAnd zu tippen ist.
- Neue Datei `src/lib/live/OsmandHandoff.svelte`; sie benutzt `routeGpx` und `saveGpx` (die gleiche Datei wie für Garmin).

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Ob Chrome auf dem Samsung A56 die GPX-Datei direkt an OsmAnd übergeben darf, ist ungeprüft (Noah: «test später», 5b). Darum gibt es die Rückfalllösung: Datei speichern und mit «Öffnen mit» in OsmAnd öffnen.
- Der Knopf steht nur vor dem Start; während der Fahrt zeigt die Karte ihn nicht.
- Die Fahrt zeichnet danach OsmAnd auf; sie lässt sich als GPX in die App laden (bestehender Import). Die Gewitterwarnung und die Stopps der Live-Seite fehlen in OsmAnd; die Zeile sagt das.
- Kein Backup nötig: keine Daten, kein Backup, kein Sync, nichts in `api/`.

## Entscheide
- Kein eigener Entscheid; der Auftrag steht im Vergleich «Live-Karte gegen OsmAnd, Google und Garmin» (Weg B).

## Stand im Plan (roadmap.md / vorhaben.md)
- Live-Navigation: Weg C (Garmin-Abbiegepunkte) folgt; Weg D (eigene Android-App) erst danach.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Live-Seite einer Tour mit Strecke öffnen: auf «Bereit für unterwegs?» steht «Lieber mit OsmAnd fahren?».
2. «Mit OsmAnd fahren» tippen: die Teilen-Liste öffnet sich (OsmAnd wählen) oder die Datei wird gespeichert.
3. In OsmAnd die Strecke öffnen und «Navigation» tippen.
