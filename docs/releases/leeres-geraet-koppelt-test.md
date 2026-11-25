# Test: leeres Gerät koppelt und bekommt alles

PR #1783 · 22.11.2026 · Auftrag: Noah «1b 2a 3a 4a 5a», Punkt 5a (Thread «Sync»)

Nichts Sichtbares in der App (nur ein Test). Er läuft in der Prüfung und in der Nachtprüfung.

## Was ist neu
- Neuer Test in `tests/e2e/abgleich.spec.js`: Ein Gerät mit Daten schaltet den Abgleich ein. Ein zweites Gerät startet leer (Startfenster), wählt «Ich nutze die App schon auf einem anderen Gerät», tippt den Code, koppelt und hat danach gleich viele Einträge wie das erste.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Der Test folgt genau dem Weg, den Noah auf einem geleerten Handy gehen würde (Startfenster, Code, Koppeln). Er braucht darum die Wahl aus 2a im Startfenster.
- Erfundene Daten aus `fixture.json`, keine echten.

## Entscheide (eigene Datei `docs/decisions/leeres-geraet-koppelt-test.md`)
- 22.11.2026: Noah «1b 2a 3a 4a 5a»

## Stand im Plan
- Warteliste «Handy leer»: 5a gebaut, damit alle fünf Punkte (1b ohne Bau) erledigt.
