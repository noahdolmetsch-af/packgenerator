# Ausgeliehen: Die Meldung steht beim Speichern

PR #<Nummer> · 05.11.2026 · Auftrag: Noah (Durchklick Etappe 2, Thread «Durchklicken Etappe 2: Touren und Material»), Befund E2-005

## Was ist neu
- Material › Ausgeliehen › Neue Leihliste: Tippte man «Speichern» ohne Namen oder ohne gewählte Sache, stand die rote Meldung ganz oben über dem Formular. Mit langer Liste war sie ausser Sicht, es sah aus, als geschehe nichts. Jetzt steht sie direkt über «Speichern».
- Meldungen, die nichts mit dem Formular zu tun haben (zum Beispiel Speichern fehlgeschlagen bei «Zurück»), bleiben oben.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Nur Ort der Meldung geändert, Text und Verhalten bleiben.
- Regressionstest `tests/e2e/leihliste-fehler-sichtbar.spec.js` (erfundene Daten): vorher rot (Meldung nicht im Bild), nachher grün.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Frontend-Durchklick Etappe 2 (Touren und Material): Befund E2-005 behoben.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Material › Ausgeliehen › Neue Leihliste: Namen tippen, ohne Sache auf «Speichern» tippen: die Meldung erscheint direkt über dem Knopf.
2. Eine Sache wählen und speichern: die Liste wird angelegt, die Meldung ist weg.
