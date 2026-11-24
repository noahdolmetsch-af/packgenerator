# Das Profil auf Heute in Farben

Auftrag: Noah «1-5a» (Thread «Detailliertes Höhenprofil verbessern»), Idee A «Überall dasselbe Profil», nach Fahrt-Seite (#1625), Unterwegs (#1636) und Rückblick (#1651).

## Was ist neu
- Auf Heute (`#/`, `src/pages/Home.svelte`) ist das Höhenprofil in der Karte der nächsten Tour nach Steigung eingefärbt (Grün flach, Gelb bis Dunkelrot steiler, Blau bergab). Es steht dort am Handy; die breite Karte am Computer hat kein Profil, wie bisher.
- Antippen, darüberfahren oder die Pfeiltasten zeigen «km · Höhe · Steigung» der Stelle in einer Zeile über dem Profil.
- Gebaut auf der Eigenschaft `detail` von `src/lib/ui/Profile.svelte` (#1625).

## Was fällt weg oder rutscht tiefer
- nichts. Das Profil bleibt an derselben Stelle, im selben Format.

## Selbst entschieden
- Heute wird wie jede Seite behandelt (Regel 6); die Änderung ist eine Zeile und berührt das Layout von Heute nicht.
- Die breite Karte am Computer bekommt kein Profil (bisheriges Verhalten, nicht Teil dieses Auftrags); der Test läuft darum nur am Handy.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute am Handy öffnen mit einer geplanten Tour mit Route: das Profil in der Karte der Tour ist farbig.
2. Die Mitte antippen: oben steht «km …, Höhe …, Steigung … %».
