# Tests finden den Knopf «Backup speichern» wieder

PR folgt · 08.11.2026 · Auftrag: Koordinator (roter Handy-Test blockiert u. a. #1203)

## Was ist neu
- Nichts in der App. Nur Tests: Seit #1197 heissen zwei Knöpfe auf Ich › Daten und Backup gleich («Backup speichern»): der in der Statuszeile (`data-status-save`) und der im Abschnitt «Backup-Datei». Die Tests PF09 und PF16 (`pf.spec.js`) fanden darum den Knopf nicht mehr eindeutig (strict mode violation).
- Die Tests wählen jetzt den Knopf ohne `data-status-save`. Dasselbe in `gesamttest/scenarios.spec.js` (zwei Stellen) und `integrations.spec.js`, wo der Knopf auf dieselbe Art gesucht wird.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Der Name der Knöpfe bleibt, wie ihn #1197 gesetzt hat (Namensliste Zeile 7); die App ist nicht angefasst.
- Keine «Was ist neu»-Datei, weil nichts Sichtbares ändert.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Nichts zu prüfen in der App. In GitHub: `e2e (phone)` zeigt für PF09 und PF16 grün.
