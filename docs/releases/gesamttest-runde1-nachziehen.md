# Gesamttest Runde 1: drei Prüfungen an die neuen Seiten angepasst

PR #<Nummer> · 24.11.2026 · Auftrag: Nacht-Lauf 24.11. (Thread «Wackel-Tests zuverlässig machen»; vier echte Fehlschläge nach den Umbauten «Material aufräumen» und «Velos aufräumen»)

## Was ist neu
- Nichts in der App. Drei Gesamttest-Prüfungen suchten Bedienelemente an ihrem alten Platz:
  - «notes, gear and past trips» (`consistency.spec.js`): die Ansichten liegen jetzt im geschlossenen Menü «Ansicht»; der Test öffnet es zuerst (`openViews`).
  - «S4 new item…» (`scenarios.spec.js`): «Wiegen» liegt im Menü «…»; der Test öffnet es zuerst (`openTools`).
  - «S11» (`scenarios.spec.js`): die Velo-Chips gibt es nicht mehr. Der Test prüft jetzt die Velo-Karten: die gewählte Karte ist die gerahmte (`aria-current`), die Karten bleiben in der Seite, nichts ist am Rand abgeschnitten, kein Seitwärts-Scrollen.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Nichts gelockert und nichts übersprungen: dieselben Aussagen, nur an den neuen Orten.
- `ride-running de` bei 320 px meldete einmal «Hinzufügen» ausserhalb des Bildschirms; ein Wiederholungslauf war grün. Ich beobachte es und baue nichts dafür, bis es ein zweites Mal rot ist.
- Beobachtung (Klasse C/D, nicht gebaut): auf dem Handy scrollt die Velo-Reihe `#/bikes?bike=<id>` nicht zur gewählten Karte.

## Entscheide
- keine.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. In GitHub: `e2e` grün. In der App nichts zu prüfen.
