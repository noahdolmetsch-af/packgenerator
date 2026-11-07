# Laufende Timer schweben am Computer oben rechts

PR #<Nummer> · 06.11.2026 · Auftrag: Noah «2a» (Thread «Durchklicken Etappe 5», Bericht Frage 2)

## Was ist neu
- Am Computer (ab 720 px Breite) sitzen die Pille des laufenden Timers (`TimerFloat.svelte`) und die der Stoppuhr oder Meditation (`FlowLayer.svelte`) oben rechts statt unten rechts. Vorher deckten sie «Speichern» und andere Knöpfe unten rechts zu.
- Laufen beide, steht die Stoppuhr oben, der Timer darunter. Auf dem Handy ändert sich nichts: die Pillen bleiben über der unteren Leiste.

## Was fällt weg oder rutscht tiefer
- Die Pillen wandern am Computer von unten rechts nach oben rechts (alt: unten, neu: oben).

## Selbst entschieden
- Nur ab 720 px; kleinere Bildschirme behalten den bisherigen Platz.
- Die Meldung unten (Toast) schiebt die Pille am Computer nicht mehr hoch, da sie nicht mehr darunter liegt.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Frontend-Durchklick Etappe 5, Bericht Frage 2a: umgesetzt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Am Computer einen Timer starten und eine andere Seite öffnen: die Pille ist oben rechts.
2. Eine Meditation starten und «Starten» gedrückt lassen: beide Pillen stehen übereinander, nichts überdeckt «Speichern».
