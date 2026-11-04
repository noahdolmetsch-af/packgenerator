# Der Tipp-Zahl-Wächter zählt die Kachel «Neu» nicht mit

PR (Test-Fix) · 04.11.2026 · Auftrag: Koordinator, Thread «Fix roten Tipp-Zahl-Wächter auf 826»

## Was ist neu
- Der Roboter `tippzahl.spec` (e2e-Teil 4) zählt Links in der Kachel «Neu» auf Heute nicht mehr als Weg. Die Kachel zeigt immer den **neuesten** Merge, ihr Knopf «Ausprobieren» springt also bei jedem PR woanders hin.
- Ursache des roten Wächters auf #826: dessen «Was ist neu»-Datei zeigt auf `#/live`. Damit lag `#/live` auf dem PR-Zweig für den Roboter einen Tipp von Heute entfernt, und er meldete «Near enough now: take it off TAP_GAPS». Nähme man `#/live` aus der Liste, würde der Wächter beim nächsten Merge mit einer anderen News wieder rot (die Seite ist ohne die Kachel weiter drei Tipp-Schritte weg).
- Mit dem Fix bleibt `TAP_GAPS` unverändert, und kein PR muss die Liste wegen seiner News anpassen.

## Was fällt weg oder rutscht tiefer
- nichts (nur der Test ändert sich, die App nicht)

## Selbst entschieden
- Keine «Was ist neu»-Datei: nichts, das Noah sieht.
- Die Kachel «Neu» ist ein Hinweis auf den letzten Merge, kein fester Weg zu einer Funktion; ein fester Weg muss ohne sie bestehen.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Nichts zu sehen. Der Wächter `tippzahl` bleibt auf allen offenen PRs grün, auch auf dem mit News-Link auf `#/live` (#826).
