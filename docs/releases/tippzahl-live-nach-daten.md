# Der Tipp-Zahl-Wächter lässt «Live-Karte» je nach Daten nah oder fern sein

PR (Test-Fix) · 04.11.2026 · Auftrag: Koordinator, Thread «Fix roten Tipp-Zahl-Wächter auf 826»

## Was ist neu
- `#/live` (freie Fahrt) bleibt in `TAP_GAPS`, aber der Roboter `tippzahl.spec` meldet «Near enough now» für diese Seite nicht mehr. Neue Liste `TAP_GAPS_BY_DATA` in `src/lib/know/tipps.js`, dazu eine Prüfung in `tests/tippzahl.test.js`: jeder Eintrag steht auch in `TAP_GAPS`, und die Liste hat genau diese eine Seite.
- Grund: Die Kachel «Fahrt starten» auf Heute und Aktiv führt nur dann auf `#/live`, wenn für heute keine Tour geplant ist (sonst auf `#/live/<Tour>`). Auf GitHub fand der Roboter `#/live` deshalb zwei Tipps von Heute entfernt, lokal nicht, auch nachdem #851 die Kachel «Neu» ausgenommen hatte (CI-Lauf von #826: 12 Seiten weit statt 13). Das hängt an den Daten, nicht am Code des jeweiligen PR.
- Neue Seiten, die zu weit weg sind, meldet der Roboter weiter. Eine andere Seite, die nah genug wird, auch.

## Was fällt weg oder rutscht tiefer
- nichts (nur der Test ändert sich, die App nicht)

## Selbst entschieden
- Keine «Was ist neu»-Datei: nichts, das Noah sieht.
- Nur `#/live` ist ausgenommen, mit Grund im Code. Die Ursache, warum die Kachel in CI auf `#/live` zeigt, habe ich nicht im Lauf nachgestellt: Ich schliesse es aus dem Code der Kachel und aus der Zahl 12 statt 13 im CI-Log.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Nichts zu sehen. Der Wächter `tippzahl` bleibt auch auf #826 grün.
