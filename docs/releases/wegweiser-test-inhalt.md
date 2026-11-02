# Eine Prüfung für die Hilfetexte (Wegweiser 24: Test Inhalt)

PR #… · 02.11.2026 · Auftrag: Plan «freigabe» Schritt 24 von 26 (Thread «Entdeckbarkeit versteckter Funktionen planen»)

## Was ist neu
- Sichtbar ändert sich nichts.
- `src/lib/know/inhalt.js` findet pro Funktion, was fehlt: «Wozu», mindestens 2 Schritte, Beispiel, «Gut zu wissen».
- Test `tests/inhalt.test.js`: eine neue Lücke macht den Test rot («ergänzen oder auf die Liste»), eine behobene muss von der Liste. Die Listen `NO_STEPS` und `NO_EXAMPLE` dürfen nur kürzer werden.
- Roboter `tests/e2e/inhalt.spec.js` öffnet jede Seite mit «Was du hier tun kannst» (Handy und Computer): die Karte hat Zeilen, jede mit «Gut zu wissen», nichts scrollt seitwärts.

## Gemessen am 02.11.2026 (442 Funktionen)
| Teil | fehlt bei |
|---|---|
| Wozu | 0 |
| mindestens 2 Schritte | 2 (Gut angekommen, Gute Nacht) |
| Beispiel | 0 |
| Gut zu wissen | 430 (nur gezählt; kommt Bereich für Bereich) |

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- «Gut zu wissen» wird nur gezählt, nicht erzwungen: auf den Seiten mit Karte prüft es schon `tests/wissen.test.js`, die übrigen Bereiche folgen.
- Die zwei Funktionen mit nur einem Schritt stehen auf der Liste statt neue Schritte zu erfinden; ein zweiter Schritt kommt mit ihrem Bereich.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Vorhaben 17 «Wegweiser statt Katalog»: Schritt 24 von 26.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Träume öffnen: «Was du hier tun kannst» sieht aus wie vorher.
2. Ich › Kompass öffnen: auch dort unverändert.
