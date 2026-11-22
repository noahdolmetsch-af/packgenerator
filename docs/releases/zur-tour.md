# Für deine Tour: Wetter zur Tour

PR #… · 07.11.2026 · Auftrag: Noah «alle Vorschläge» der UI-Prüfung, Fund T3, und «5b» (Wetter zur Tour jetzt bauen) (Thread «Absprünge: Tourkarte und Wetter zur Tour»)

## Was ist neu
- Auf der Wetterseite (Teil «Jetzt») steht ganz oben die Karte **«Für deine Tour»** für die nächste geplante Tour (oder die Tour, mit deren Wetter-Weg man kam, `#/wetter?trip=…`): Name (führt zur Tour), Tag («Sa., 21. Nov. · in 3 Tagen»), das Wetter dieses Tages von 07 bis 20 Uhr («Regen ab 15:00 · 10–16 °C · 14 km/h» oder «trocken»).
- Bei erwartetem Regen eine Zeile **«Regenzeug: 2 von 3 gepackt»** (Teile mit «Bei Regen» oder aus einem Regen-Baustein auf der Packliste der Tour; «noch nichts auf der Liste», wenn keins dabei ist).
- Drei Wege: **Packliste öffnen**, **«Was ziehe ich an?»** (öffnet Heute mit der Kleidung), **«Beste Zeit für eine Fahrt»** (Teil «Planen» dieser Seite).
- Der Ort der Karte ist der Ort der Tour (eigener Ort oder Start der Route), sonst der Wohnort.
- Reine Logik in `src/lib/wetter/zurtour.js` (getestet), Karte `src/lib/wetter/ZurTour.svelte`, Texte `src/lib/i18n/de/zur-tour.js`.

## Was fällt weg oder rutscht tiefer
- nichts. Die Wetterseite ist darunter unverändert; die Wahl «Wohnort / Nächste Tour» bleibt.

## Selbst entschieden
- **Erst prüfen, ob der Wetterdienst antwortet:** aus der Cloud-Umgebung (Entwicklung) ist er nicht erreichbar (403). Darum steht die Karte auch ohne Prognose: ein Satz («Das Wetter für diesen Tag ist gerade nicht erreichbar. Die Wege darunter gehen trotzdem.») und alle Wege. Liegt die Tour weiter als 16 Tage weg: «Die Prognose reicht noch nicht bis zu diesem Tag.» Die Tests nutzen eine erfundene Prognose, die Wetterwerte wurden also nie mit dem echten Dienst gesehen; Prüfschritt 1 nach dem Merge zeigt das.
- Test- und archivierte Touren bekommen keine Karte (wie auf Heute).
- Nur bei erwartetem Regen die Regenzeug-Zeile, sonst würde sie bei trockenem Wetter nur Unruhe machen.
- Keine neue Funktion in `features.js` und kein neuer Ort: die Karte ist Teil der Wetterseite (`docs/app-stand.md`, Zeile «Wetter», angepasst). Leerer Zustand: ohne geplante Tour steht keine Karte da.
- «Wetter → Tour des Tages» und «Wetter → Wetterfenster der Woche» sind dabei: Name der Tour führt zur Tour, «Beste Zeit für eine Fahrt» zum Fenster auf derselben Seite.

## Entscheide (für decisions.md)
- 07.11.2026: Wetter zur Tour jetzt bauen, ohne auf den Wetterdienst im Test zu warten (Noah «5b»); die Karte nennt ehrlich, wenn der Dienst nicht antwortet.

## Stand im Plan (roadmap.md / vorhaben.md)
- UI-Prüfung «Absprünge»: T3 gebaut (nach T2).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Eine Tour mit Start in den nächsten Tagen planen, Touren › Wetter öffnen: oben steht «Für deine Tour» mit Tag und Wetter (Regen ab …, Temperatur, Wind).
2. Bei Regen: «Regenzeug» nennt, wie viel gepackt ist. «Packliste öffnen» öffnet die Liste.
3. «Was ziehe ich an?» öffnet Heute mit der Kleidung; «Beste Zeit für eine Fahrt» zeigt das Fenster.
