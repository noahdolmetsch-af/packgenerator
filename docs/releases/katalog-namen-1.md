# Katalog-Namen wie auf der Seite

PR #<Nummer> · 27.10.2026 · Auftrag: Noah «1a» (Thread «332 Use Cases sichtbar machen»)

## Was ist neu
- Vier Einträge in «Was die App alles kann» heissen jetzt wie auf ihrer Seite: «Meine Sportarten» (statt «Eine Seite pro Sportart»), «Alle Tipps» (statt «Tipps und «Wusstest du»»), «Neue Notiz» (statt «Schnellnotiz»), «Rückblick» (statt «Rückblick in 1 Minute»).
- Der Prüf-Roboter (`tests/e2e/heimat.spec.js`) findet diese vier jetzt auf ihrer Seite; die Liste der Lücken wird um 4 kürzer.

## Was fällt weg oder rutscht tiefer
- nichts. Die alten Namen der zwei Funktionen bleiben als Suchwörter, die Suche findet sie weiter.

## Selbst entschieden
- «Alle Tipps» führt jetzt zu Velos › Pflege, wo «Alle Tipps ›» im Kasten «Gut zu wissen» steht (vorher Aktiv › Heute, dort fand der Prüf-Roboter es nicht).
- «Neue Notiz» hat ihre Heimat jetzt auf der Seite Notizen statt auf Heute.
- Die zwei Tipps (Neue Notiz, Rückblick) haben keine Suchwörter; ihre alten Namen fallen in der Suche weg, der Text bleibt gleich.
- Die übrigen 26 Namens-Lücken haben auf ihrer Seite kein passendes Wort; sie bekommen in eigenen kleinen PRs eine kurze sichtbare Zeile.

## Entscheide (für decisions.md)
- 27.10.2026: Katalog-Namen an die Seite angleichen (Noah «1a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- 332 Use Cases sichtbar: 4 von 30 Namens-Lücken erledigt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Öffne «Was die App alles kann» und suche «Alle Tipps».
2. Tippe auf den Eintrag: Er öffnet Velos › Pflege; weiter unten steht im Kasten «Gut zu wissen» «Alle Tipps ›».
3. Suche «Schnellnotiz»: Es erscheint jetzt «Neue Notiz».
