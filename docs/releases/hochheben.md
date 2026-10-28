# Zeilen heben sich beim Sortieren

PR (B19) · 27.10.2026 · Auftrag: Noah «ich möchte b13 bis b24 alle umsetzen. 1a 2a 3a 4a 5a» (Thread «Planen Bausteine B13 bis B24»)

## Was ist neu
- Hältst du den Griff ⠿ einer Zeile, hebt sie sich mit Schatten über die anderen (überall, wo man ziehen kann: Kategorien, Ziele, Listen …).
- Die anderen Zeilen gleiten weicher zur Seite; beim Landen an einem neuen Platz vibriert das Handy kurz (Android).

## Was fällt weg oder rutscht tiefer
- nichts. Pfeile ↑↓ gehen wie bisher.

## Selbst entschieden
- Der Stil kommt mit dem gemeinsamen Baustein `sortable.js` (ein kleines Stylesheet), damit `app.css` und jede Liste unverändert bleiben.
- Bei «Bewegung reduzieren» kein Vergrössern, nur der Schatten.
- Kein gestrichelter Platzhalter: die anderen Zeilen machen schon Platz, das reicht.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Neuer Schwung, Bausteine B13 bis B24: B19 gebaut; als Nächstes E8 Schalter «Bewegung».

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Listen und Typen › Kategorien: den Griff ⠿ einer Zeile halten. Die Zeile hebt sich mit Schatten.
2. Nach unten ziehen und loslassen: sie bleibt am neuen Platz.
