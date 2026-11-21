# «Deine Abfragen» baut wieder weniger Elemente (Knöpfe im Gruss erst beim Aufklappen)

PR #<Nummer> · 21.11.2026 · Auftrag: Koordinator (Test «Seitengrösse» auf main rot, der Thread «Prüfungen» wartet darauf), Thread «Wackel-Tests auf main reparieren»

## Was ist neu
- Nichts, was man sieht. Der Block «Knöpfe im Gruss» auf `#/me/abfragen` (`HelloButtonsSection.svelte`, seit #1047) baute seinen Editor auch zugeklappt: gut 1500 Elemente. Die Seite kam so auf rund 3700 statt der erlaubten 2420 (Wächter `tests/e2e/seitengroesse.spec.js`, Budget aus `tests/seitengroesse-budget.json`).
- Jetzt wird der Editor erst gebaut, wenn man den Block aufklappt (wie bei Meine Sportarten und Meilensteine). Die Seite baut zugeklappt rund 2200 Elemente und öffnet damit schneller.
- Das Budget bleibt, wie es ist (nichts gelockert).

## Was fällt weg oder rutscht tiefer
- nichts. Der Block steht am selben Ort, klappt gleich auf und zeigt dasselbe.

## Selbst entschieden
- Keine «Was ist neu»-Datei, weil nichts Sichtbares ändert. `docs/app-stand.md` bleibt, es gibt keine neue Funktion.
- Gemessen mit den fiktiven Daten des Wächters (`home0460-fixture.js`), Fenster 390 px.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Deine Abfragen öffnen: weiter unten steht «Knöpfe im Gruss». Antippen: der Editor mit Gesichtern, Gefühlen und Plänen klappt auf, wie vorher.
2. In GitHub: «Volle Prüfung» zeigt `seitengroesse.spec.js` grün.
