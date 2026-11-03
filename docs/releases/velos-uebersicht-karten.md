# Velos-Übersicht Schritt 1: eine Karte pro Velo

Auftrag: Noah «bitte alles umsetzen» (Thread «Verbessern: Velos und Material verständlicher»), Mockup «Velos-Übersicht» (Artifact), Ziel: auf einen Blick sehen, welches Velo Aufmerksamkeit braucht.

## Was ist neu
- Oben auf «Velos» steht pro Velo eine Karte: Name, Kilometer, Status («n fällig», «nichts fällig» oder «keine Daten») und die nächste Arbeit. Die Wörter sind dieselben wie in der Pflege (`bikeCareWords`).
- Zwei Knöpfe pro Karte: «Pflege öffnen» und «Details zeigen» (wählt das Velo für die Seite darunter).
- Neue Datei `src/lib/bikes/BikeCards.svelte`, eingebaut in `src/pages/Bikes.svelte`.

## Was fällt weg oder rutscht tiefer
- nichts. Die Seite darunter (Band, Zeichnung, Karten) bleibt wie sie war und rutscht um die Kartenreihe nach unten.

## Selbst entschieden
- Die Karten erscheinen schon ab einem Velo (so ist die Übersicht auch bei einem Velo sichtbar).
- Die Knöpfe «Pflege eintragen» und «Problem notieren», «Als Nächstes» und «Werkstatt und Verlauf» kommen als Schritte 2 bis 4.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Velos öffnen: oben je Velo eine Karte mit Kilometern und Status.
2. «Pflege öffnen»: du landest in der Pflege dieses Velos.
