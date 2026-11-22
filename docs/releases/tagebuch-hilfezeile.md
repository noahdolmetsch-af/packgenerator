# Tagebuch: die Hilfezeile ist zurück

PR folgt · 22.11.2026 · Auftrag: Noah «so lassen - immer zugeklappt» (Entscheid vom 22.11.2026, `docs/decisions/zeile-was-du-hier-tun-kannst.md`)

## Was ist neu
- Unter dem Titel des Tagebuchs steht wieder die zugeklappte Zeile «Was du hier tun kannst» (ein Tipp öffnet das Fenster, das auch das «?» öffnet).
- Die kleine Zeile «So geht's» steht wieder wie auf jeder anderen Seite (zuerst offen, danach als Zeile).
- `LINE_OFF` in `src/lib/seiteninhalt.js` fällt weg: keine Seite ist ausgenommen.

## Was fällt weg oder rutscht tiefer
- Nichts. Es kommt nur zurück, was #1336 entfernt hatte: die Zeile unter dem Titel. Die Schreib-Karte, die Frage des Tages als eigene Karte und die vier Ansichten in einer Zeile bleiben.

## Selbst entschieden
- Die Tests, die #1336 für `LINE_OFF` angepasst hatte (`inhalt.spec.js`, `seiteninhalt.spec.js`, `anleitungen.spec.js`, `tests/seiteninhalt.test.js`), stehen wieder wie vorher (die Seite hat die Zeile wieder). Nichts gelockert.
- `quiet` am Einstieg des Tagebuchs ist weg: `quiet` war nur dafür da, dass die Hilfe nicht doppelt steht, als die Zeile fehlte. Das Tagebuch verhält sich jetzt wie die anderen Seiten.
- Die Zeile steht hinter dem Kopf des Tagebuchs (Titel, Satz und Einstellungen-Knopf), nicht zwischen Titel und Satz.

## Entscheide (eigene Datei)
- Der Entscheid von heute früh gilt weiter (`docs/decisions/zeile-was-du-hier-tun-kannst.md`); der Absatz «Offen» dort ist abgehakt.

## Stand im Plan (roadmap.md / vorhaben.md)
- Seitenregeln Stufe 2: Das Tagebuch hat die Zeile wieder; der Kopf-Baustein baut sie überall ein statt sie zu entfernen.

## Prüfschritte (nach dem Merge)
1. Planen › Notizen › Tagebuch: unter dem Titel steht die Zeile «Was du hier tun kannst», zugeklappt.
2. Auf die Zeile tippen: die Hilfe öffnet sich. Das «?» oben öffnet dasselbe.
3. Handy: die vier Ansichten stehen weiter in einer Zeile.
