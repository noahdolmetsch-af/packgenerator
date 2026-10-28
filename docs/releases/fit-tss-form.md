# Dein Velocomputer zählt in der Form

PR #… · 28.10.2026 · Auftrag: Noah «1 a und auf der fahrtseite 2 a und b» (Thread «Geräte und Datenquellen», Punkt 1a an Aktiv)

## Was ist neu
- Form und Erholung: Hat eine Fahrt eine FIT-Datei mit TSS, zählt diese TSS als Belastung (vor Wattmesser, Strava-Anstrengung und Puls).
- Ist dieselbe Fahrt auch auf Strava (gleicher Tag, etwa gleiche km, Start innerhalb 45 Minuten), zählt sie nur einmal. Eine Fahrt nur als FIT-Datei zählt jetzt auch (vorher nur km und Höhenmeter).
- Touren › Fahrten: In der Liste der gespeicherten Fahrten steht bei FIT-Fahrten «Trainingseffekt aerob / anaerob · TSS».
- Der Erklärtext auf der Form-Seite nennt die neue Reihenfolge.

## Was fällt weg oder rutscht tiefer
- nichts. Die Fahrtseite («Vom Gerät») bleibt wie sie ist.

## Selbst entschieden
- Gleiche Fahrt: dieselbe Regel wie beim km-Buch (Tag, km ±10 %, Start ±45 min).
- Belastungs-Reiter, Form-Verlauf und Bereitschaft rechnen alle mit derselben Zahl.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Aktiv zeigt neue Datenquellen: VO2max (eigener PR) und TSS/Trainingseffekt sichtbar. Die VO2max-Kachel auf Heute baut der Heute-Thread.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Fahrten: eine Fahrt aus einer FIT-Datei zeigt unter dem Namen Trainingseffekt und TSS.
2. Auswerten › Körperwerte › Aktivität › Belastung: der Tag dieser Fahrt zeigt ihre TSS.
