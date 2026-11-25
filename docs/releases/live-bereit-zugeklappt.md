# Live-Seite ruhiger: «Bereit für unterwegs?» klappt zu

PR #<Nummer> · 23.11.2026 · Auftrag: Noah, Wahl «a) Vor der Fahrt zuklappen» (Thread «Live-Navigation», Vorschlag zur Live-Seite)

## Was ist neu
- Die Karte «Bereit für unterwegs?» vor dem Start ist eine Zeile («Karte und Sprache sind bereit.»), sobald die Karte entlang der Strecke auf dem Handy ist und die Sprache an. Ein Tipp auf die Zeile öffnet sie wieder.
- Solange etwas fehlt, bleibt die Karte offen und zeigt «Karte speichern» und «Sprache einschalten». Wer sie selbst auf- oder zugeklappt hat, dem bleibt sie so.
- Technik: `src/lib/live/ReadyCard.svelte` ist jetzt ein `details`; der Zustand kommt aus `readiness()`.

## Was fällt weg oder rutscht tiefer
- Die Zeile «Lieber mit OsmAnd fahren?» steht, wenn Karte und Sprache bereit sind, hinter dem Tipp auf «Bereit für unterwegs?» (vorher immer sichtbar). Der Weg: Karte öffnen, dann «Mit OsmAnd fahren».
- «Alles bereit. Gute Fahrt.» steht nur noch in der offenen Karte; die zugeklappte Zeile sagt dasselbe kürzer.

## Selbst entschieden
- Wer die Karte aufgeklappt hat, behält sie offen, auch wenn alles bereit ist.
- «Während der Fahrt» bleibt offen (Test `heimat.spec.js`: jede Funktion auf ihrer Seite sichtbar).
- Kein Backup nötig: keine Daten, kein Backup, kein Sync, nichts in `api/`.

## Entscheide (eigene Datei `docs/decisions/live-bereit-zugeklappt.md`)
- 23.11.2026: Live-Seite wird mit einer zugeklappten Bereit-Karte ruhiger (Option a)

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Live-Seite einer Tour mit Route öffnen: «Bereit für unterwegs?» ist offen und zeigt, was fehlt.
2. «Sprache einschalten» tippen und die Karte speichern: die Karte klappt zu einer Zeile zu.
3. Die Zeile tippen: sie öffnet sich wieder, «Lieber mit OsmAnd fahren?» steht darin.
