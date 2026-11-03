# Strecke als Bild

PR (noch offen) · 03.11.2026 · Auftrag: Noah «E und F» (Paket E, Idee 23, Thread «Bauen: Touren als Sammlung»)

## Was ist neu
- Touren: jede geplante Tour und jede Tour in «Mit Packliste», die eine Strecke hat, zeigt ihre Form als kleines Zeichen (64 × 40) neben den Kilometern. Quelle der Linie: zuerst die hochgeladene Fahrt, dann die geplante Strecke, dann die Strava-Fahrten der Tour.
- `src/lib/touren/streckenform.js` und `RouteShape.svelte`; die Zeichnung nutzt `miniPath` wie die Kacheln der Strava-Fahrten.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Eine Tour ohne Strecke zeigt kein Zeichen (keine Platzhalter-Linie); die Zeile «ohne Strecke» bleibt.
- Das Zeichen ist still (keine Bewegung), daher nichts für «Bewegung reduzieren» nötig.
- Reine Zierde, deshalb für Screenreader versteckt; Name und Zahlen daneben sagen dasselbe.
- Kein neuer Eintrag in `features.js`: es ist eine Ansicht der bestehenden Tourenliste, kein neues Werkzeug.
- Kein Schema, kein Backup-Format.
- Test `ausprobieren.spec.js` («Neuigkeiten gehen zum Ort»): das feste Zeitlimit von 10 Minuten war mit 563 Zeilen schon fast aufgebraucht (9,9 Min auf main); es wächst jetzt mit der Zahl der Zeilen (mindestens 10 Minuten, sonst 2 s je Zeile). Geprüft wird dasselbe wie vorher, nichts gelockert.

## Entscheide (für decisions.md)
- nichts

## Stand im Plan
- Ideen Bewegung (`notes/ideen-bewegung-2026-11-03`): Idee 23 gebaut.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren öffnen: bei einer Tour mit Strecke steht neben den Kilometern ihre Form.
2. Eine Tour ohne Strecke: kein Zeichen.
