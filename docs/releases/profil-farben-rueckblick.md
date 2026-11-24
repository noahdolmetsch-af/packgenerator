# Profile im Rückblick in Farben

Auftrag: Noah «1-5a» (Thread «Detailliertes Höhenprofil verbessern»), Idee A «Überall dasselbe Profil», nach Fahrt-Seite (#1625) und Unterwegs (#1636).

## Was ist neu
- Im Rückblick (`#/debrief`, `src/lib/review/Hub.svelte`) ist das Höhenprofil in der Karte der letzten Tour nach Steigung eingefärbt (Grün flach, Gelb bis Dunkelrot steiler, Blau bergab). Die geplante Route bleibt als gestrichelte Linie darüber.
- Dasselbe gilt für das Profil auf der Seite einer gespeicherten Tour (`src/lib/review/TripSaved.svelte`), mit den Tagesgrenzen und Nummern.
- Antippen, darüberfahren oder die Pfeiltasten zeigen «km · Höhe · Steigung» der Stelle in einer Zeile über dem Profil.
- Gebaut auf der Eigenschaft `detail` von `src/lib/ui/Profile.svelte` (#1625).

## Was fällt weg oder rutscht tiefer
- nichts. Die Profile bleiben an derselben Stelle.

## Selbst entschieden
- Die kleinen Profile (Kacheln in Touren und Vergangene Touren, `small`) bleiben ruhig wie bisher: Sie stehen zum Teil in einem Link, ein Tipp öffnet dort die Tour. Das grosse Profil mit Werten ist auf der Tour-Seite und im Rückblick.
- Keine neue Funktion in `features.js`, nur eine Verbesserung der bestehenden Seite.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Rückblick öffnen: das Profil in der Karte der letzten Tour (mit hochgeladener Fahrt) ist farbig.
2. Die Mitte des Profils antippen: oben steht «km …, Höhe …, Steigung … %».
