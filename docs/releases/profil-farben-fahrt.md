# Das Profil einer Fahrt in Farben

Auftrag: Noah «1-5a» (Thread «Detailliertes Höhenprofil verbessern»), Idee A «Überall dasselbe Profil», Skizze https://claude.ai/artifact/HuGZ1A5L5JX8mv19XRvf7g

## Was ist neu
- Das Höhenprofil auf der Fahrt-Seite (unter «Zahlen» und unter «Geplant gegen echt») ist nach Steigung eingefärbt: Grün flach, Gelb bis Dunkelrot steiler, Blau bergab. Es sind dieselben Farben wie im grossen Profil.
- Antippen, darüberfahren oder die Pfeiltasten zeigen in einer Zeile über dem Profil «km · Höhe · Steigung» der Stelle; ohne Tipp steht dort höchster und tiefster Punkt.
- Eine Zeile unter dem Profil sagt, was die Farben heissen.
- `src/lib/ui/Profile.svelte` hat dafür die Eigenschaft `detail`. Die anderen Seiten bekommen sie je in einem eigenen PR (Planen, Heute, Rückblick, Kacheln).

## Was fällt weg oder rutscht tiefer
- nichts. Das Profil bleibt gleich gross und an derselben Stelle; die orange gestrichelte Planlinie und die Etappen-Hervorhebung bleiben.

## Selbst entschieden
- Die Fahrt-Seite ist hier die Seite einer Fahrt (`#/debrief/ride/<Nr>`, `src/pages/Rides.svelte`).
- Die Farben stehen nur mit `detail`: Heute, Kacheln und Rückblick bleiben klein und ruhig (Noah 3a).
- Die Farben kommen aus dem groben Profil der Fahrt (bis 800 Punkte), die Steigung ist also ein Mittel über etwa 50 m und bei kurzen Rampen etwas flacher als im feinen Profil.
- Keine neue Funktion in `features.js`: es ist eine Verbesserung der bestehenden Seite (Fertig-Regel: Seite, Absprung und Inhalt bestehen).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Rückblick › Fahrten › eine Fahrt mit GPX öffnen: das Profil unter «Zahlen» ist farbig.
2. Die Mitte des Profils antippen: oben steht «km …, Höhe …, Steigung … %».
3. Weiter unten «Geplant gegen echt» (wenn vorhanden): dasselbe Profil mit der orangen Planlinie.
