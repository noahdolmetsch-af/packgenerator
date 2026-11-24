# Wunschliste: ein Name, eine Knopfzeile, «+ Wunsch»

PR #<Nummer> · 24.11.2026 · Auftrag: Noah «1-5a» (impeccable ganze App, Paket 11; Thread «Packen nach Taschen am Bike ausbauen»)

## Was ist neu
- Chip, Seitentitel, Handbuch und Rundgang sagen «Wunschliste» statt «Einkauf» (die Adresse `#/gear?view=wish` bleibt).
- Jeder Wunsch hat nur noch eine Knopfzeile: «Gekauft» und «…». Bisher standen «30 Tage warten», «Gekauft» und in einer eigenen Zeile «…» untereinander, jeder Wunsch war etwa 187 Pixel hoch.
- «30 Tage warten» ist jetzt der erste Eintrag im «…». Wartet ein Wunsch schon, steht «wartet bis …» auf der Karte, und nach den Tagen die Frage «Noch nötig?» wie bisher.
- Der Daumen-Knopf unten heisst auf der Wunschliste «+ Wunsch» (Hilfetext «Wunsch hinzufügen»), sonst «+ Teil».

## Was fällt weg oder rutscht tiefer
- «30 Tage warten» rutscht ins «…»: ein Tipp mehr als bisher. Sonst fällt nichts weg.

## Selbst entschieden
- Preis und Kategorie in einer Zeile: nicht gebaut, weil die Karte in der Liste keinen Preis zeigt (der Preis steht im Fenster rechts und im Kopf der Seite); die Kategorie bleibt unter dem Namen.
- Die Karten in `MatCard` (andere Ansichten mit Wünschen) behalten den Knopf «30 Tage warten», damit dort nichts verschwindet.
- Englischer Name im Code bleibt `Shopping|tab`; nur der deutsche Text ändert sich.
- Wächter: `tests/e2e/wunschliste-eine-zeile.spec.js`.

## Entscheide (eigene Datei `docs/decisions/wunschliste-eine-zeile.md`)
- 24.11.2026: «Wunschliste» überall, eine Knopfzeile pro Wunsch (Noah «1-5a»)

## Stand im Plan (roadmap.md / vorhaben.md)
- impeccable ganze App, Welle 2: Paket 11 (Wunschliste) gebaut; Paket 14 (Vorrat) wartet auf Welle 3

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Material › Reiter «Wunschliste» öffnen: Titel und Chip heissen «Wunschliste».
2. Am Handy: jeder Wunsch hat eine Zeile mit «Gekauft» und «…», es passen mehr Wünsche auf den Bildschirm.
3. «…» tippen: «30 Tage warten» steht zuoberst; tippen, die Karte sagt «wartet bis …», «Rückgängig» nimmt es zurück.
4. Unten steht «+ Wunsch».
