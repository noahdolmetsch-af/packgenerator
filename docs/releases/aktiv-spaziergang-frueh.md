# Aktiv: Spaziergang und Namen mit dem ersten Start

PR folgt · 17.11.2026 · Auftrag: Noah «c» (Thread «UI-Test der Seite Flow», Fund 4)

## Was ist neu
- Die zweite Grundausstattung von Aktiv (die Spielnamen, die sechs Lieblingskacheln und der «Spaziergang») wird jetzt zusammen mit der ersten angelegt, also beim ersten Öffnen von Heute oder Aktiv. Vorher geschah es erst beim ersten Öffnen einer Aktivität (zum Beispiel einem Tipp auf «Meditation»), und die Zahl der Ziele sprang dort still von 10 auf 11.
- Neuer Test `tests/e2e/aktiv-seed-frueh.spec.js`: der Spaziergang ist nach dem ersten Start da, ein Tipp auf «Meditation» legt nichts an.

## Was fällt weg oder rutscht tiefer
- nichts. Wer die Grundausstattung schon hat (die Einstellung `flow.seed2` steht), merkt nichts. Der Spaziergang bleibt eine gewöhnliche Aktivität: umbenennen, ausblenden und löschen mit Rückgängig geht wie bei jeder anderen.

## Selbst entschieden
- Der Spaziergang bleibt «immer da» (frühere Entscheidung, Wetter-Vorschlag «Draussen») und wird nicht zu einer Vorschlags-Kachel gemacht; verschoben ist nur der Zeitpunkt.
- Kein Datenformat, keine Speicherstruktur, kein Backup-Format geändert; keine News-Datei und kein Eintrag in `app-stand.md`, weil nichts Sichtbares dazukommt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Nichts Sichtbares. Wer die App zum ersten Mal öffnet: Aktiv zeigt von Anfang an dieselbe Zahl von Zielen, auch nach einem Tipp auf «Meditation».
