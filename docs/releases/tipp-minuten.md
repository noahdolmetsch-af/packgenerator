# Ausflugstipp zählt für Draussen

PR #? · 24.11.2026 · Auftrag: Noah «1-3» (Vorschlag 1 von 3, Thread «Challenges nach Gelegenheit bauen»). Baut auf dem PR «Schwierigkeit» auf (gleiche Datei `TripTips.svelte`).

## Was ist neu
- Unter der Liste der Ausflugstipps (Touren › Träume › «Heute passt: Ausflugstipps») steht, solange die Challenge «Draussen» läuft, der Knopf **«Gemacht · +120 Min»** (die Zahl ist die gewählte Zeit). Ein Tipp zählt diese Minuten heute zu «Draussen», mit «Rückgängig».
- So werden Tipp und Challenge eins: ohne Strava zählt auch eine Ausfahrt, die du nach einem Tipp gemacht hast.

## Was fällt weg oder rutscht tiefer
Nichts. Ohne laufende Challenge fehlt der Knopf (nichts verändert sich).

## Selbst entschieden
- Die Minuten sind die **gewählte Zeit** (90 Min, 2 h …), nicht die Länge der Runde: Du entscheidest damit selbst, was zählt. Wer weniger gemacht hat, wählt kürzer oder gleicht auf Heute mit «+15 Min» an.
- Es werden Minuten von Hand für **heute** gezählt (wie «+30 Min» auf der Karte); Strava-Minuten zählen weiter von selbst, die App erkennt keine doppelte Fahrt. Wer mit Strava aufzeichnet, tippt «Gemacht» nicht.
- Kein neues Datenformat, keine Backup-Änderung: derselbe Eintrag `outdoor` wie die Karte.

## Entscheide
Noah «1-3» (alle drei Vorschläge bauen, Reihenfolge 1, 2, 3), siehe `docs/decisions/tipp-minuten.md`.

## Stand im Plan
- Challenges nach Gelegenheit: Vorschlag 1 von 3 (Tipp → Minuten).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Challenge «Draussen» auf Heute starten, dann Touren › Träume öffnen.
2. Unter den Ausflugstipps «Gemacht · +n Min» tippen: auf Heute stehen die Minuten bei «Draussen».
3. «Rückgängig» tippen: die Minuten sind wieder weg.
