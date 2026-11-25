# Die Suche findet Seiten

PR #1783 · 23.11.2026 · Auftrag: Noah «ja» (Thread «Navigation ohne Sackgassen», «Die Suche (/) könnte auch Seiten und Abschnitte finden»)

## Was ist neu
- Die Suche findet jeden Ort, Reiter und jede Seite der Karte der App (`src/lib/nav/seiten.js`, aus `nav.js`) über ihren Namen, auch die, die bisher keine handgeschriebene Zeile hatten (zum Beispiel «Erholung», «Gewicht», «Heatmap»). Das Ergebnis sagt, wo die Seite steht («Woche › Training»).
- Die handgeschriebenen Zeilen (`src/lib/nav/menu.js`, mit ihren Suchwörtern) bleiben und kommen zuerst; wo eine Karten-Seite dieselbe Adresse hat, erscheint sie nicht doppelt.
- Prüfungen: `tests/seiten.test.js` (jede Seite der Karte ist über ihren Namen zu finden) und `tests/e2e/suche-seiten.spec.js` (Handy und Computer).

## Was fällt weg oder rutscht tiefer
- nichts. Die Suche zeigt weiter höchstens vier Seiten pro Anfrage; weitere stehen hinter «mehr».

## Selbst entschieden
- Abschnitte innerhalb einer Seite (`?at=…`) kommen noch nicht in die Suche; das Gerüst für Abschnitt-Links steht seit «Zurück an dieselbe Stelle» und wird später genutzt.
- Eigene Namen aus «Anpassen» werden noch nicht gesucht (nur die Namen der App).

## Entscheide
- Keine eigene Datei: Fortsetzung von `docs/decisions/wege-waechter.md`.

## Stand im Plan (roadmap.md / vorhaben.md)
- Navigation ohne Sackgassen: «Die Suche findet Seiten» erledigt. Folgt: gleiche Namen überall, Zurück am Eingang, Abschnitte in der Suche.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auf die Lupe tippen und «Erholung» tippen: ein Ergebnis «Erholung» mit «Woche › Training» darunter.
2. Auf das Ergebnis tippen: die Seite Erholung öffnet.
