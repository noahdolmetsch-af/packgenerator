# Wächter gegen private Daten

PR folgt · 02.11.2026 · Auftrag: Noah «1a danach 3 und 4» (Thread «Finden: Was wir übersehen haben»)

## Was ist neu
- Neuer Test `tests/private-data.test.js` (Regeln in `scripts/privatecheck.mjs`): er stoppt jeden PR, wenn im öffentlichen Repo eine Spur (GPX, FIT, TCX), eine Excel-Liste, ein Foto (JPG, HEIC), ein Archiv (ZIP) oder eine echte Pack-Generator-Sicherung liegt. Auch sehr grosse Bilder (über 2 MB) schlagen an.
- `.gitignore` schliesst dieselben Dateitypen aus, so wird ein Versehen schon beim Hinzufügen abgefangen.
- Geprüft vorher: so einen Test gab es nicht (nur `*.xlsx` und `*backup*.json` im `.gitignore`).

## Was fällt weg oder rutscht tiefer
- nichts (in der App ändert sich nichts, es ist nichts sichtbar)

## Selbst entschieden
- Erlaubt bleiben ausdrücklich nur die erfundenen Test-Dateien (Liste `ALLOWED`): ein Test-GPX, die fünf e2e-Fixtures, das Gesamttest-Fixture und zwei App-Screenshots mit erfundenen Daten in `qa/`. Die Liste darf nur kürzer werden oder bewusst im PR erweitert werden.

## Entscheide (für decisions.md)
- 02.11.2026: Private Dateien im öffentlichen Repo stoppt ein automatischer Test (Grund: ein Versehen wäre öffentlich und nicht rückgängig).

## Stand im Plan (roadmap.md / vorhaben.md)
- Lücken-Vorschläge 02.11.: Schritt 2 (Wächter) gebaut.

## Prüfschritte
1. Nichts zu sehen in der App. Der Test läuft bei jedem PR unter «build»; grün heisst: keine private Datei.
