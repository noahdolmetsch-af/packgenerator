# Konflikt-Listen: eine Datei pro neue Funktion

PR #… · 31.10.2026 · Auftrag: Noah «1a», «kannst du damit schon beginnen» (Thread «Merge-Stau abbauen und Tests stabilisieren»)

Nichts davon ist in der App sichtbar.

## Was ist neu
- Jede neue Funktion des Katalogs legt **eine Datei** in `src/lib/featreg/<name>.js` an (Eintrag, Moment, «So geht's», Handbuch, Heimat-Seite, Lücke). `scripts/news.mjs` sammelt die Dateien in `index.gen.js` (nicht in Git), `featreg/index.js` fügt sie in die fünf Listen ein: `features.js`, `moment.js`, `know/howto.js`, `handbook.js`, `know/heimat.js`.
- Warum: bisher hängte jeder PR seine Zeile an dasselbe Listenende an, und offene PRs gerieten sich in die Haare. Jetzt berühren zwei PRs nie dieselbe Datei.
- Die alten Einträge bleiben, wo sie sind (kein Umzug). Anleitung: `src/lib/featreg/README.md`. Test: `tests/featreg.test.js`.

## Was fällt weg oder rutscht tiefer
- nichts. Wer eine Funktion in den alten Listen einträgt, darf das weiter tun; neue Funktionen sollen die neue Datei nehmen.

## Selbst entschieden
- Nicht alle ~400 alten Einträge verschoben (grosser Umzug, selbst Konfliktquelle). Nur neue Funktionen.
- `know/wann.js` und `know/spot.js` (selten) bleiben vorerst wie sie sind.
- Gleiches Muster wie bei den News-Dateien und den deutschen Texten (`auto.gen.js`).

## Entscheide (für decisions.md)
- keine

## Stand im Plan (roadmap.md / vorhaben.md)
- Thema «Merge-Stau»: Konflikt-Listen erledigt für neue Funktionen. Offen: Handy-Test-Ausfälle.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. In der App ändert sich nichts: Ich › Funktionen (Katalog) zeigt dieselben Einträge wie vorher.
2. Unter Actions: «build» und «e2e (desktop)» grün.
