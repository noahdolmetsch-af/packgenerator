# Hell oder dunkel pro Stunde

PR (diese Änderung) · 05.11.2026 · Noah 05.11. («ebenfalls noch machen»); Ziel 6 «Lange Fahrten unterwegs verstehen»

## Was ist neu
- In der Karte «Nächste 3 Stunden» zeigt jede Stunde eine Sonne (hell) oder einen Mond (dunkel). Berechnet mit der Sonnenzeit (`lightLeft`) für deinen Standort und die Uhrzeit der Stunde (`dark` in `nextHours`).

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Der Standort ist die aktuelle Position (in 3 Stunden ändert sich die Sonnenzeit um wenige Minuten). Ohne bekannte Position steht kein Symbol.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan
- Danach Offline «Bereit für unterwegs?».

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Live-Karte mit Strecke und Wetter, Stopps öffnen: Jede Stunde hat Sonne oder Mond.
2. Abends: Die Stunden nach Sonnenuntergang zeigen den Mond.
