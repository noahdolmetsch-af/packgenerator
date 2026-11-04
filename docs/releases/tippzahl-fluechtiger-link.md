# «Fahrt starten» wartet auf die Touren

PR (Test-Fix) · 04.11.2026 · Auftrag: Koordinator, Thread «Fix flackernden Tipp-Zahl-Wächter»

## Was ist neu
- Auf Aktiv zeigt die kleine Zeile «Fahrt starten ›» ihr Ziel jetzt erst, wenn die Touren gelesen sind. Vorher stand für einen Augenblick der Link auf die freie Fahrt (`#/live`) da und sprang dann auf die Live-Karte der heutigen Tour (`#/live/<id>`). Ein Tipp genau in diesem Moment ging auf die falsche Karte.
- Das war auch die Ursache des flackernden Wächters `tippzahl.spec` (e2e-Teil 4): Der Roboter las die Links von Aktiv manchmal im ersten Augenblick, sah `#/live` einen Tipp von Heute entfernt und meldete «Near enough now: take it off TAP_GAPS». Mit der Zeile erst nach dem Lesen der Touren ist das Ergebnis immer gleich: `#/live` bleibt in `TAP_GAPS`.
- Der Roboter kann mit `TIPPS_VIA='#/live'` den Weg zu einer Seite ausgeben (Hilfe für die nächste Suche).

## Was fällt weg oder rutscht tiefer
- nichts (die Zeile erscheint auf Aktiv einen Wimpernschlag später)

## Selbst entschieden
- Keine «Was ist neu»-Datei: nichts, das Noah sieht.
- `#/live` bleibt in `TAP_GAPS`: ohne Tour heute führt die Zeile auf Aktiv und das Heute-Kachel «Fahrt starten» weiter auf `#/live`; die Testdaten haben immer eine Tour heute, daher bleibt die Seite im Test drei Tipp-Schritte weit weg.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Aktiv öffnen: die Zeile «Fahrt starten ›» ist da und führt zur Live-Karte (bei einer Tour heute zu deren Karte, sonst zur freien Fahrt).
