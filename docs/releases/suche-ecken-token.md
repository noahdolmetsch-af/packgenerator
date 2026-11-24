# Suche: Ecken aus dem Token

PR #1728 · 24.11.2026 · Auftrag: Bündler (Main rot nach Zusammentreffen der Suche, PR 1725, mit «App schöner Runde 1», PR 1716)

## Was ist neu
- Nichts Sichtbares geändert, nur: zwei Ecken-Werte in `src/lib/nav/Search.svelte` (`border-radius: 10px`) stehen jetzt als `var(--r-ctl)` (gleicher Wert, 10 px). Das behebt den roten Stil-Test (`tests/style-lint.test.js`) auf main.
- Der Eintrag «radius» für die Suche in `tests/guard-baseline.json` ist weg (die Datei hat jetzt keine Radius-Verstösse mehr; die Baseline wird nur kürzer).

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Die Baseline wird nicht hochgesetzt, sondern kürzer (Regel: Baseline wächst nie).

## Entscheide (eigene Datei `docs/decisions/<name>.md`)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung
