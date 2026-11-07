# Kälte und Regen der nächsten 3 Stunden

PR (diese Änderung) · 04.11.2026 · Noah 02.11. Vorschlag 3 («a»), 03.11. «freigabe bitte fortfahren»; Ziel 6 «Lange Fahrten unterwegs verstehen»

## Was ist neu
- Bei den «Stopps» der Live-Karte (mit Strecke) neu die Karte «Nächste 3 Stunden» (`next3h.js`): Jetzt, +1, +2 und +3 Stunden mit gefühlter Temperatur und Regenwahrscheinlichkeit, jeweils am Ort, den du dann nach deinem Tempo erreichst (nicht dort, wo du jetzt bist).
- Ein Satz sagt es einfach: Regen (ab 50 %) mit der Stunde, in der er beginnt, «wird kalt» (gefühlt unter 8°), «kühl» (unter 15°), starker Wind (ab 30 km/h) oder «sieht gut aus».
- Ohne geladenes Wetter steht, was zu tun ist (Wetter entlang der Strecke laden).

## Was fällt weg oder rutscht tiefer
- nichts. Eine Karte mehr oberhalb von «Nächstes Wasser».

## Selbst entschieden
- Grenzen wie bei der Kleidungsempfehlung in «Entlang der Strecke» (`wxAdvice`): kalt < 8°, kühl < 15°, Regen ≥ 50 %, Wind ≥ 30 km/h.
- Die Karte nutzt das schon geladene Wetter der Strecke; sie lädt nichts selbst nach und speichert nichts. Keine neue Funktion in `features.js`.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan
- Vorschlag 3 gebaut; danach Licht/Akku, Schritt 6 «Offline».

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Live-Karte mit Strecke starten (Wetter der Strecke geladen), Stopps öffnen: die Karte «Nächste 3 Stunden» zeigt vier Stunden.
2. Der Satz darüber nennt Regen, Kälte, Wind oder «sieht gut aus».
