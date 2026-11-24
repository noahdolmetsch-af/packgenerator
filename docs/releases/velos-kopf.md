# Velos: Seitenkopf schlanker, ein ruhiger Knopf

Auftrag: Noah «ja» (23.11.2026 20:27, Vorschlag des Koordinators für die Velos-Seite). Gehört zur Familie «Quer: Köpfe» des Design-Abgleichs.

## Was ist neu
- Am Handy stehen «Gehört zu Velo» und «Was du hier tun kannst» in **einer** Zeile unter dem Titel, nebeneinander (`SeitenInhalt.svelte` nimmt die zweite Zeile über `side`; `App.svelte` gibt sie nur für Velos am Handy hinein). Ein Tipp auf «Gehört zu …» öffnet die Chips unter der Zeile («Einklappen» schliesst sie, die Wahl bleibt gemerkt); «Was du hier tun kannst» öffnet wie bisher das Hilfefenster.
- Auf jeder Velo-Karte ist «Werkstattbesuch erfassen» ein ruhiger Knopf (`btn sm` statt `btn sm hi`).

## Was fällt weg oder rutscht tiefer
- Am Handy steht «Gehört zu …» nicht mehr als eigene Zeile über dem Titel, sondern halb breit neben der Hilfe-Zeile unter dem Titel. Die Wörter «Aufklappen» und «Hilfe öffnen» entfallen in dieser Zeile (die Pfeile bleiben).
- Die Karten haben keinen grünen Knopf mehr; die Wege bleiben dieselben.
- Am Computer ändert sich nichts.

## Selbst entschieden
- Nur Velos und nur am Handy. Ob das Muster auf anderen Seiten mit beiden Zeilen gilt (Touren, Packen, Ich, Rückblick, Neuland, Wetter), entscheidet der Koordinator mit Noah.

## Entscheide
- Noah «ja» zu beiden Änderungen auf Velos: `docs/decisions/velos-kopf.md`.

## Prüfschritte (nach dem Merge auf der echten Seite, am Handy)
1. Velos: unter dem Titel eine Zeile mit «Was du hier tun kannst» und «Gehört zu Velo» nebeneinander.
2. «Gehört zu Velo» antippen: die Chips erscheinen unter der Zeile, «Einklappen» schliesst sie.
3. Auf einer Velo-Karte: «Werkstattbesuch erfassen» ist ein ruhiger Knopf.
