# Knapper Seitenkopf bei Wetter

Auftrag: Noah «1-5 a» (Thread «App an Mein-Tag-Design angleichen»), Bericht https://claude.ai/artifact/7XRsEHDQLkmU2nKDw97NBB, Frage 3a. Schritt 5 (Wetter) von 6 des Design-Abgleichs.

## Was ist neu
- Am Handy beginnt die Reihe «Gehört zu: Tour planen» über dem Titel als eine Zeile (`gd:wetter` in `START_FOLDED`, `src/lib/ui/kartenzeile.js`), wie schon bei Packen, Touren, Velos und Material. Ein Tipp öffnet die Karte, «Einklappen» schliesst sie; die Wahl bleibt gemerkt. Am Computer bleibt sie offen.
- Der Satz unter dem Titel ist kürzer: «Das Wetter fürs Velo: heute, die beste Zeit, das Regenradar und deine Webcams.»

## Was fällt weg oder rutscht tiefer
- Am Handy: die fünf Chips «Tour-Zustände, Assistent, …, alle 37 ›» stehen nicht mehr offen über dem Titel, sondern hinter einem Tipp auf die Zeile «Gehört zu …» (gleiche Links, eine Zeile statt rund 170 px).
- Der Halbsatz «Alles ist ein Vorschlag» im Kopf entfällt; das gilt in der ganzen App (Regel 11) und steht auf den Hilfeseiten.

## Selbst entschieden
- Nur Wetter: andere Seiten mit offener Reihe (Ich, Rückblick, Neuland) folgen einzeln. Touren und Velos beginnen am Handy schon als Zeile.
- Prüfung `tests/e2e/karten-zeile-handy.spec.js` hat eine Zeile mehr (Wetter); nichts gelockert.

## Entscheide
- keine neuen (siehe `docs/decisions/umschalter-gewaehlt-gefuellt.md`)

## Prüfschritte (nach dem Merge auf der echten Seite, am Handy)
1. Wetter: über dem Titel eine Zeile «Gehört zu: Tour planen», keine Chips.
2. Die Zeile antippen: die Chips erscheinen, «Einklappen» schliesst sie wieder.
3. Am Computer: die Chips stehen offen wie bisher.
