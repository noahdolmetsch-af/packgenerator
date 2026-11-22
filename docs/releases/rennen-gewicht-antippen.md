# Rennen: das Gewicht entlang der Route zum Antippen

PR 16 · 10.11.2026 · Auftrag: Noah «Ja» (Thread «Diagramme antippbar und genau machen»), Rennen › Vorbereiten, `race/prep/Load.svelte`

## Was ist neu
- Die Kurve «Gesamtgewicht entlang der Route» ist ein Diagramm nach den Regeln der App, auf `LineChart`: Achse in kg, Kilometer darunter, Zeigen nennt den Kilometer mit dem Gewicht, Tippen öffnet ein Fenster («Weiter vorn» / «Weiter hinten», dazu «Schwerste Stelle» und «Leichteste Stelle»), «Als Tabelle» listet alle paar Kilometer das Gewicht.
- Der Wächter `charts-rules` zählt `Load.svelte` zu den fertigen Diagrammen.

## Was fällt weg oder rutscht tiefer
- nichts. Die kleine Kurve (90 px, ohne Achse, mit einem Punkt bei der schwersten Stelle) ist ein Diagramm mit Achse (110 px); die Zeile «Am schwersten bei km …» bleibt darunter.

## Selbst entschieden
- Der Punkt auf der schwersten Stelle fällt weg; das Fenster nennt sie («Schwerste Stelle»).
- Ein Schritt pro PR; die übrigen Unterwegs-, Rennen- und Ski-Diagramme folgen einzeln.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Diagramme klickbar: PR 16 (Rennen, Gewicht entlang der Route). Danach `live/DpChart`, `SensorCurve`, `WxTimeline`, `SkiSeason`, Aktiv-Reste.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Rennen › dein Rennen (oder das Beispielrennen) › Vorbereiten › «Gesamtgewicht entlang der Route»: auf die Linie zeigen, Kilometer und kg stehen darüber.
2. Die Linie antippen: Fenster mit dem Gewicht, «Weiter vorn» / «Weiter hinten» blättern.
3. «Als Tabelle» antippen: Kilometer mit Gewicht.
