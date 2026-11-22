# Kleidung pro Stunde

PR (diese Änderung) · 05.11.2026 · Noah 05.11. («ebenfalls noch machen»); Ziel 6 «Lange Fahrten unterwegs verstehen»

## Was ist neu
- In der Karte «Nächste 3 Stunden» steht unter jeder Stunde mit Regen (ab 50 %), Kälte (gefühlt unter 8°), Kühle (unter 15°) oder Wind (ab 30 km/h) ein kurzer Tipp: Regenjacke, Warme Schicht + Handschuhe, Armlinge, Windweste (`wearTip` in `next3h.js`).

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Pro Stunde nur ein Tipp; Reihenfolge Regen, Kälte, Kühle, Wind. Trockene, milde, ruhige Stunden haben keinen.
- Gleiche Grenzen wie der Satz über den Stunden.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan
- Danach: Hell/Dunkel pro Stunde, Offline «Bereit für unterwegs?».

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Live-Karte mit Strecke und geladenem Wetter, Stopps öffnen: Eine Stunde mit viel Regen zeigt «Regenjacke».
2. Trockene, milde Stunden zeigen keinen Tipp.
