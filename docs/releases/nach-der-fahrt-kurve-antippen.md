# Nach der Fahrt: die Kurven zum Antippen

PR 17 · 10.11.2026 · Auftrag: Noah «ja» (Thread «Diagramme antippbar und genau machen»), Unterwegs › Nach der Fahrt, `live/SensorCurve.svelte`

## Was ist neu
- Die Kurven nach einer Fahrt (Höhenprofil, Puls, Leistung) sind Diagramme nach den Regeln der App, auf `LineChart`: Achse mit Einheit, Zeit darunter, der Durchschnitt als gestrichelte Linie, Zeigen nennt Zeit und Wert, Tippen öffnet ein Fenster (Wert, Durchschnitt, höchster Wert, «Der davor» / «Der danach»), «Als Tabelle» listet die Zeiten mit den Werten.
- Der Wächter `charts-rules` zählt `SensorCurve.svelte` zu den fertigen Diagrammen.

## Was fällt weg oder rutscht tiefer
- nichts. Die Kurve ist höher (100 statt 70 px) und hat eine Achse; die Zeile mit Ø und max. darüber bleibt.

## Selbst entschieden
- Bis 120 Punkte pro Kurve (Mittel je Abschnitt, vorher 300), die Zeit zählt ab der ersten Messung.
- Ein Schritt pro PR; Datenseite, Wetter-Zeitleiste, Ski-Saison und die Aktiv-Reste folgen einzeln.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Diagramme klickbar: PR 17 (Unterwegs, Kurven nach der Fahrt). Danach `live/DpChart`, `map/WxTimeline`, `ski/SkiSeason`, Aktiv-Reste.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Eine Fahrt mit Live beenden: unter «Nach der Fahrt» auf die Höhenkurve zeigen, Zeit und Meter stehen darüber.
2. Die Kurve antippen: Fenster mit Wert, Durchschnitt und höchstem Wert, «Der davor» / «Der danach» blättern.
3. «Als Tabelle» antippen: die Zeiten mit ihren Werten.
