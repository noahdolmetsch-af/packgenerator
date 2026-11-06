# Prüffall PF16 läuft ruhiger (nur Test)

PR folgt · 06.11.2026 · Auftrag: Koordinator nach der CI-Beobachtung bei PR «Meine Aktivitäten» (Thread «Bereinigen: Doppeltes und Fehler auf Heute»)

## Was ist neu
- Nichts in der App. Der Test PF16 (`tests/e2e/pf.spec.js`) bekam wie Szenario 1 eine feste Uhr (Mittag in Zürich), damit Morgen und Abend des echten Tages Heute nicht verändern. Die Wartezeit für «Der Link öffnet die Liste nur zum Lesen» ist von 3 auf 15 Sekunden gestiegen, weil die zweite Seite unter Last länger braucht.
- Vorher: PF16 war unter Last (mehrere Tests gleichzeitig) auf `main` und auf Branches vier von vier Mal rot, und in der CI mehrfach ohne Änderung der App.
- Nachher: vier gleichzeitige Läufe auf dem Handy grün, einer auf dem Computer grün.

## Was fällt weg oder rutscht tiefer
- Nichts.

## Selbst entschieden
- Nur dieser eine Test angepasst; andere Prüffälle bleiben unverändert.
- Keine News-Datei (keine sichtbare Änderung).

## Entscheide (für decisions.md)
- Keine.

## Stand im Plan (roadmap.md / vorhaben.md)
- Keine Änderung.

## Prüfschritte
1. In der CI: `e2e (phone)` Teil mit `pf.spec.js` bleibt grün, auch wenn der Lauf lange dauert.
