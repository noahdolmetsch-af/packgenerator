# Live-Karte: der Zoom-Test wartet, bis die Pins neu gesetzt sind

PR #1783 · 24.11.2026 · Auftrag: Noah «beheben» (Thread «Wackel-Tests zuverlässig machen», `live.spec.js:62` Computer, 3 von 3 rot auf main)

## Was ist neu
- Nichts in der App. Nur der Test. Er stellt die App auf 130 % und liest sofort, ob die Seite zur Seite schiebt. Die Pin-Knöpfe («In Quick Links anheften», `PinMarks.svelte`) setzen sich aber ein Bild nach einer Grössenänderung neu; im ersten Bild stand der Pin noch dort, wo er ohne Zoom war, und schob die Seite um 177 px. Das ist seit den Pins auf der Live-Seite rot und trat nicht in der App auf, nur im Test, weil er den Zoom per Skript setzt und sofort misst.
- Der Test wartet jetzt drei Bilder nach dem Zoom (und nach dem Zurücksetzen) und prüft dann dasselbe wie vorher. Er findet ein falsch gesetztes Pin weiter (nachgemessen: der Pin steht nach dem Bild an seinem Platz).

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Nichts gelockert: dieselbe Prüfung («keine Zeile schiebt zur Seite»), nur nach der Zeit, die die App für das Neusetzen braucht.
- Die App bleibt: ein Pin, der sich beim Zoomen ein Bild später setzt, ist kein Fehler.

## Entscheide
- keine.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. In GitHub: `e2e` grün. In der App nichts zu prüfen.
