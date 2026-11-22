# Wächter: jede Seite hat einen Ort, eine Seite hat ein Zuhause

PR #1450 · 22.11.2026 · Auftrag: Noah «1-3» (Thread «App-Landkarte», Wächter W3 und W4)

## Was ist neu
- Nichts in der App. Zwei neue Prüfungen in `tests/orte.test.js`:
  - **W3 «Jede Seite hat ein Zuhause»:** Jede Seite aus `App.svelte` hat einen Ort in der Leiste (`placeOf`) oder steht in der Liste `GAST_SEITEN` (Seiten für Leute ohne die App: geteilter Link, Karte, Anmeldung, Bezahl-Link, Shop-Kauf).
  - **W4 «Eine Seite, ein Ort»:** Heisst eine Seitendatei in `App.svelte` unter zwei Namen, stehen beide Namen unter demselben Ort. Erlaubte Ausnahme: «Fahrten» (`stravarides`) ist Auswerten › Fahrten und dieselbe Seite wie Touren (Noah 20.10.2026).
- Beide Listen dürfen nur kürzer werden; ein Test meldet, wenn ein Eintrag nicht mehr nötig ist.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Die Prüfungen fanden «Stopps in der Nähe» (Ort fehlte, PR 1437) und zuvor «Impulse» (zwei Orte, PR 1379). Beides ist behoben.
- **Adressen mit `#/me/…` ausserhalb von «Ich» (Lücke L8) bleiben, wie sie sind:** 11 Seiten (Termine, Mail, Alltag, Freie Zeit, Kompass, Links, Werkzeugkasten, Wi gaht's?, Was mir gut tut, Zusammenhänge, Gewicht) haben eine Adresse mit `#/me/…`, stehen aber bei Planen, Touren oder Auswerten. Adressen umzuziehen bräche alte Links und Lesezeichen (Durchklick DK6). So steht es schon in der App-Landkarte («Nichts ändern, nur als Wissen»).

## Entscheide
Keine eigene Entscheid-Datei: nur Prüfungen, keine neue Regel für Noah.

## Stand im Plan (roadmap.md / vorhaben.md)
- App-Landkarte, Lücken 2 und 3 von 3 (Noah «1-3»): W3 und W4 hier; der «Sackgassen-Roboter» W5 folgt als eigener Schritt.

## Prüfschritte
1. Nichts zu prüfen in der App. Auf GitHub laufen die Tests grün (`tests/orte.test.js`).
