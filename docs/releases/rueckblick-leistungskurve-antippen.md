# Rückblick: die Leistungskurve zum Antippen

PR 13 · 08.11.2026 · Auftrag: Noah «ja» (Thread «Diagramme antippbar und genau machen»), Rückblick, «Puls und Leistung»

## Was ist neu
- Die Leistungskurve in «Puls und Leistung» (`HeartPower.svelte`, nur mit Leistungsmesser) nutzt jetzt `LineChart`: genaue Watt beim Zeigen oder mit den Pfeiltasten, Tippen öffnet ein Fenster (beste Leistung über die Dauer, W/kg wenn das Gewicht bekannt ist, «Kürzere Dauer» / «Längere Dauer»), «Als Tabelle» listet die fünf Dauern.
- Der Wächter `charts-rules` zählt `HeartPower.svelte` jetzt zu den fertigen Diagrammen.

## Was fällt weg oder rutscht tiefer
- nichts. Die Kurve hat dieselben fünf Punkte (5 s bis 60 min) wie vorher, jetzt mit Achse in Watt.

## Selbst entschieden
- Die Zonenbalken (Herzfrequenz Z1–Z5, Leistung Z1–Z7) bleiben, wie sie sind: jede Zone nennt schon Zeit und Anteil als Zahl, es sind Anteile und keine Reihe.
- Die kleinen Balken von «Relative Effort» und «Belastung» (`MiniBars`) folgen als eigener PR.
- Ein Schritt pro PR; `InZahlen` kommt einzeln.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Diagramme klickbar: PR 13 (Rückblick, Leistungskurve). Danach `MiniBars`, `InZahlen`, Unterwegs, Rennen, Ski, Garmin.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Rückblick einer Tour mit Leistungsmesser › «Körper und Leistung» › Leistungskurve: auf die Kurve zeigen, Dauer und Watt stehen darüber.
2. Eine Dauer antippen: Fenster mit bester Leistung, «Kürzere Dauer» / «Längere Dauer» blättern.
3. «Als Tabelle» antippen: die fünf Dauern mit Watt.
