# Tests: eine Datums-Falle beheben, Unit-Tests schneller

PR #… · 31.10.2026 · Auftrag: Noah «1a», «bitte umsetzen» (Thread «Merge-Stau abbauen und Tests stabilisieren»)

Nichts davon ist in der App sichtbar, nur in den Tests.

## Was ist neu
- `tests/stravaticks.test.js` schlug seit dem 31.10.2026 immer fehl (nicht zufällig): `setSport()` nimmt das echte heutige Datum, und die festen Tage im Test lagen ausserhalb der 14-Tage-Frist. Der Test fixiert jetzt die Uhr (nur `Date`) auf den 19.10.2026.
- Die Unit-Tests luden für jede der 541 Dateien alle deutschen Texte (rund 60 % der Testzeit). Jetzt laden nur die 38 Dateien sie, die Deutsch brauchen, mit der ersten Zeile `import './setup/de.js';`. Lokal: 115 s statt 160 s.
- Wer einen neuen Unit-Test schreibt, der deutsche Texte prüft, setzt diese Zeile an den Anfang (Hinweis steht in `tests/setup/de.js`).

## Was fällt weg oder rutscht tiefer
- nichts (kein App-Code geändert)

## Selbst entschieden
- Beides in einem PR, weil beides nur Tests betrifft und ein Branch nur einmal gepusht wird.
- Pro Datei ein Import statt einer Erkennung per Dateitext: so ist sichtbar, welche Tests Deutsch brauchen.

## Entscheide (für decisions.md)
- keine

## Stand im Plan (roadmap.md / vorhaben.md)
- Thema «Merge-Stau»: Punkt 1 (Flakes) angefangen, Punkt 3 (CI-Zeit) erster Schritt. Punkt 2 (Konflikt-Listen) folgt als eigener PR.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Nichts in der App zu prüfen.
2. Unter Actions: «build» läuft grün, der Schritt «npm test» braucht deutlich weniger als 2 Minuten.
