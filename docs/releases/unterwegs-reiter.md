# Reiter «Unterwegs» bei Touren

Auftrag: Noah «1 → 2 → 4 zuerst, je ein kleiner PR» (Thread «Menü umbauen: Punkte 1, 2, 4»), Menü-Analyse Punkt 2.

## Was ist neu
- Touren hat einen Reiter «Unterwegs»: er öffnet die Live-Karte. Die Seiten «Rennen» und «Rennen detailliert planen» (Rennplan) lassen denselben Reiter leuchten.
- Er steht an dritter Stelle, also auf dem Handy direkt sichtbar.

## Was fällt weg oder rutscht tiefer
- Auf dem Handy rutscht «Rückblick» (im Sommer) hinter «Alle 8». Im Winter (Dezember bis April, wenn «Skitouren» nach vorn rückt) rutschen «Vorlagen» und «Rückblick» dorthin. Beide sind weiter über «Alle 8» und die Seitenleiste erreichbar; wer eine eigene Reihenfolge gewählt hat, behält sie (der neue Reiter kommt ans Ende).
- Sonst nichts.

## Selbst entschieden
- Reiter statt neuer Seite: keine neue Adresse, #/live, #/race und #/racecheck bleiben gleich. Der Reiter hat einen neuen Schlüssel «underway», es wird nichts umbenannt; «Anpassen» (Verstecken, Umbenennen, Startreiter) gilt auch für ihn.
- «Nacht-Blatt» hat keine eigene Adresse; es bleibt, wo es ist.
- «Auf Heute erscheinen, sobald eine Tour läuft» gehört zu Heute (anderer Thread); hier nicht gebaut.

## Sicherheit
Kein Schema, kein Backup, keine Adresse geändert. Handy-Kurzbefehl «#/live» bleibt gültig. Rückweg: PR zurücknehmen.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren öffnen: «Unterwegs» steht an dritter Stelle und öffnet die Live-Karte.
2. Ein Rennen öffnen: «Unterwegs» leuchtet.
