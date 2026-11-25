# Test «Training › Woche: Vorschlag» läuft ruhig

PR #<Nummer> · 07.11.2026 · Auftrag: Koordinator (roter Test `training.spec.js:274` blockiert den Spruch-PR #1060), Thread «Fix wackelnden Training-Wochentest»

## Was ist neu
- Nichts in der App. Nur der Test `tests/e2e/training.spec.js` (Teil 5, «Woche: a suggestion for the week …») war rot.
- Ursache: Es war **nicht der Wochentag**. Die feste Uhr (`clock.js`) setzt jeden Test auf einen Mittwoch mitten im Monat, der Test lief also schon unabhängig vom echten Tag. Der Fehler war ein Wettlauf: Nach «Übernehmen» schliesst sich der Vorschlag sofort, der Plan wird aber erst danach gespeichert. Der Test zählte die geplanten Tage in dem Augenblick dazwischen und fand 0.
- Jetzt wartet der Test, bis die geplanten Tage sichtbar sind (`toBeVisible` statt `count()`). Geprüft wird weiterhin dasselbe: übernehmen, geplante Tage da, Rückgängig, wieder leer.
- #1083 hat in `training.spec.js` nur eine andere Zeile (das Wochen-Diagramm des Rückblicks) angefasst, keine Überschneidung.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Keine neue Uhr eingebaut, weil die feste Uhr schon gilt; die App (`SuggestWeek.svelte`) bleibt unberührt.
- Keine «Was ist neu»-Datei, weil nichts Sichtbares ändert. `docs/app-stand.md` bleibt gleich, weil sich nichts an den Funktionen ändert.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Nichts zu prüfen in der App. In GitHub: `e2e (phone)` und `e2e (desktop)` zeigen für `training.spec.js` grün.
