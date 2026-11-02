# Beleg-Foto am Computer gross und grün

Auftrag: Noah «bitte alles umsetzen» (Thread «Verbessern: Velos und Material verständlicher»), Prüfbericht: «Beleg direkt fotografieren» soll im Werkstattformular hervorstechen.

## Was ist neu
- Am Computer ist der Beleg-Knopf im «Werkstattbesuch erfassen» jetzt der grosse grüne Knopf «Beleg-Foto wählen» (vorher ein kleiner grauer «Foto wählen»). Am Handy war er schon gross und grün («Beleg fotografieren»), dort ändert sich nichts.
- `PhotoPick.svelte` bekommt dafür die Angabe `choose` (Text am Computer); alle anderen Stellen bleiben wie sie waren.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Der Knopf öffnet am Computer den Datei-Dialog (ein Computer hat meist keine Kamera), deshalb heisst er «wählen» und nicht «fotografieren».
- Der Test `kamera.spec.js` erwartet am Computer im Werkstattbesuch den neuen Text.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Am Computer: Velos › Werkstatt › «Werkstattbesuch erfassen»: oben ein grosser grüner Knopf «Beleg-Foto wählen».
2. Am Handy: unverändert, «Beleg fotografieren» öffnet die Kamera.
