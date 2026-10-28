# Heute als Begleiter 1: die Moment-Regeln

PR #? · 28.10.2026 · Auftrag: Noah «1a 2a 3a», «1a 2a 3a 4a», «ok freigabe», «ja» (Thread «Liste aller Funktionen mit Sprunglink»)

## Was ist neu
- `src/lib/moment.js`: die 8 Momente und die Regel, in welchem Moment du gerade bist (von oben nach unten, die erste passende gilt): 1 Unterwegs (Tour läuft), 2 Zurück (Tour vorbei, Rückblick offen, höchstens 14 Tage), 3 Packen (Start in 2 Tagen oder weniger, oder Packen begonnen), 4 Tour planen (Tour in den nächsten 14 Tagen), 5 Velo und Material (Pflege fällig), 6 Alltag und Woche (Sonntag ab 17 Uhr oder etwas im Eingang), 7 Körper und Training (Morgen 6–11 Uhr), 8 Lust und Ideen (sonst).
- Jede der 402 Funktionen des Katalogs hat ihren Moment (`FEATURE_MOMENTS`), Daten und Hilfe stehen in der Basis `app`.
- In der App ist noch nichts sichtbar. Die Moment-Karte auf Heute kommt mit PR 4.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Der Starttag zählt als Packen, bis «Packen abschliessen» getippt ist (wie `currentStep` in `phase.js`).
- Bei mehreren Touren zählt die nächste; bei mehreren offenen Rückblicken der jüngste.
- `packDays` aus «Eigene Werte» gilt auch für den Moment Packen.
- Neue Funktionen in `features.js` brauchen ab jetzt einen Eintrag in `FEATURE_MOMENTS`, sonst schlägt `tests/moment.test.js` an. Der Hinweis steht in `CLAUDE.md`.

## Entscheide (für decisions.md)
- 28.10.2026: Heute als Begleiter, 8 Momente, 13 kleine PRs (eingetragen).

## Stand im Plan (roadmap.md / vorhaben.md)
- Vorhaben 15 «Heute als Begleiter»: PR 1 von 13.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Nichts Sichtbares: die App sieht aus wie vorher.
2. Die Tests `tests/moment.test.js` sind auf GitHub grün.
