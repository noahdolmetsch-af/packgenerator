# Test «Meldungen kommen ins Bild» wieder grün

PR (diese Änderung) · 06.11.2026 · Auftrag: Koordinator nach Noahs Etappe 2 (Test von #1001); nichts in der App, nur ein Test

## Was ist neu
- Nichts Sichtbares. Der Test `tests/e2e/meldung-sichtbar.spec.js` setzte voraus, dass die Seite «Was ist neu» (`#/me/news`) länger als drei Bildschirme ist. Seit die Seite alle Versionen ausser der neuesten einklappt, war sie auf dem Handy etwas darunter (2493 statt 2532 px), und der Test fiel auf `main` selbst durch. Dadurch wurde `e2e (phone)` bei jedem PR rot.
- Jetzt hängt der Test unten an die Seite eine unsichtbare Fläche, falls sie zu kurz ist. Er prüft das Scrollen, nicht die Länge dieser Seite; die Prüfung «die Seite ist lang genug» bleibt bestehen.

## Was fällt weg oder rutscht tiefer
- nichts (kein App-Code geändert).

## Selbst entschieden
- Fläche statt anderer Seite: Keine Seite bleibt sicher lang, die Länge von «Was ist neu» ändert sich mit jedem Release.
- Kein Test gelockert: Die Bedingung (mehr als drei Bildschirme) und beide Prüfungen sind unverändert.
- Keine «Was ist neu»-Zeile, weil nichts in der App zu sehen ist.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- nichts.

## Prüfschritte (nach dem Merge)
1. `e2e (phone)` bei einem offenen PR läuft ohne Fehler in `meldung-sichtbar.spec.js`.
