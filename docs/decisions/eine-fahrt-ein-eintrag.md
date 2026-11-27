# Eine Fahrt = ein Eintrag (Garmin gewinnt gegen Fitbit)

27.11.2026 · Auftrag: Noah «1a 2a 3a 4a» (Thread «Wie war's? nach Fitbit-Aktivität reparieren»)

- Anlass: Die Charge 6 erkennt Trainings von selbst (auch Spaziergänge). Dieselbe Fahrt kann zugleich von Garmin (über Strava) und von Fitbit kommen; Dauer, Minuten und Puls unterscheiden sich, weil die Uhr zu spät startet oder die Fahrt in Stücke teilt und das Handgelenk anders misst als der Brustgurt.
- Entscheid 1a: Strava/Garmin gewinnt. Das Fitbit-Gegenstück bleibt eine zweite Messung und geht in keine Karte, keinen Vorschlag und keine Summe ein.
- Entscheid 2a: eine Regel für alle Karten (`src/lib/flow/dieselbe.js`): gleicher Tag und die Zeiten berühren sich, oder die gleiche Sportart liegt bis 30 Minuten daneben; ohne Zeit die gleiche Länge (10 %). Vorher gab es drei Regeln (20 Minuten nach dem Start, Überlappung ±30 Minuten, ein Haken pro Tag).
- Entscheid 3a (3b war ersetzt): zwei Strava-Aufzeichnungen derselben Fahrt (Edge 850 und 1040) kommen als Vorschlag «Zusammenlegen?» mit Knopf, nichts wird still gelöscht (Paket 2).
- Entscheid 4a: ein Spaziergang, den die Uhr von selbst erkannt hat, wird nie gefragt und nie gezählt.
- Ergänzung Noah 27.11.2026: Unterschiede beim Puls (Gurt gegen Handgelenk) sind für ihn spannend; sie kommen als Zeile auf der Seite der Fahrt und als Zahl in Auswerten (Paket 3).
- Ersetzt: die Regel «Start innerhalb von 20 Minuten» in `healthfeel.js` und die eigene Überlappungsregel in `fitbittraining.js`.
