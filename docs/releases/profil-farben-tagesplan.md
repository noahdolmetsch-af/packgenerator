# Das Profil des Tages in Farben (Unterwegs)

Auftrag: Noah «1-5a» (Thread «Detailliertes Höhenprofil verbessern»), Idee A «Überall dasselbe Profil», nach der Fahrt-Seite (#1625).

## Was ist neu
- Auf «Unterwegs» (`#/ride`, `src/pages/Ride.svelte`) ist das Höhenprofil der Etappe nach Steigung eingefärbt (Grün flach, Gelb bis Dunkelrot steiler, Blau bergab). Bei einer Tour über mehrere Tage bleibt die heutige Etappe kräftig, die anderen blasser.
- Antippen, darüberfahren oder die Pfeiltasten zeigen «km · Höhe · Steigung» der Stelle in einer Zeile über dem Profil; eine Zeile darunter sagt, was die Farben heissen.
- Gebaut auf der Eigenschaft `detail` von `src/lib/ui/Profile.svelte` (#1625).

## Was fällt weg oder rutscht tiefer
- nichts. Das Profil bleibt an derselben Stelle unter den Zeiten.

## Selbst entschieden
- **Planen** braucht keinen eigenen PR: Für Velotouren zeigt die Karte «Route» auf Planen schon das grosse Profil mit Steigungsfarben, Zoom und Antippen (`RouteClimbs`, `ProfileStrip`). Das einfache Profil steht dort nur noch im Teil «Route» einer Tour ohne Velo und im komoot-Fenster; beides lässt sich mit den Testdaten nicht erreichen und bleibt, wie es ist.
- Die Steigung kommt aus dem groben Profil der Route (Mittel über ca. 50 m).
- Keine neue Funktion in `features.js`, nur eine Verbesserung der bestehenden Seite.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Unterwegs öffnen mit einer Tour, die eine GPX-Route hat: das Profil unter den Zeiten ist farbig.
2. Die Mitte des Profils antippen: oben steht «km …, Höhe …, Steigung … %».
