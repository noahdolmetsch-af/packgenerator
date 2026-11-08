# Der Pin deckt keinen Text mehr zu

PR folgt · 08.11.2026 · Auftrag: Noah «was kommt danach alles noch? kannst du damit schon beginnen» (Thread «Anheft-Knopf am Computer ergänzen»), aus dem UX-Test 08.11.2026 (Befund D1 in Bereich 5, 2b-13 in Bereich 2b)

## Was ist neu
- Der Pin für Quick Links liegt nicht mehr auf Buchstaben oder Knöpfen. Vorher prüfte `placePin` nur fünf Punkte auf «antippbar» und nur die Zeilen des eigenen Titels; so lag der Pin am Computer auf der letzten Stelle der Brotkrume («…rten importieren») und auf «+ Setup-Foto». Jetzt prüft `free()` in `src/lib/quick/PinMarks.svelte` ein Raster über den Punkt: liegt dort ein Knopf oder ein Buchstabe, nimmt der Pin den nächsten Platz, sonst keinen.
- Ein Pin sagt beim Daraufhalten, was er tut: «Diese Seite an Quick Links anpinnen, mit ihrem Filter», bei einer Karte ««Name» an Quick Links anpinnen»; ist er schon gepinnt: «… ist in deinen Quick Links. Ein Tipp nimmt sie wieder heraus.»

## Was fällt weg oder rutscht tiefer
- Pins, die auf Text oder Knöpfen lagen, fallen weg (zum Beispiel der Pin an der Brotkrume von «Fahrten importieren», «Taschen-Plan», «Werkstatt-Spick»). Der Pin am Seitentitel rechts bleibt und macht dasselbe. Die Karte einer Funktion ohne freien Platz hat keinen Pin mehr; anpinnen geht dann über Quick Links › «Pin hinzufügen».

## Selbst entschieden
- Gedeutet habe ich den Auftrag «Anheft-Knopf am Computer» als die zwei Befunde der Arbeitsliste, die den Pin am Computer betreffen: D1 (deckt Text) und 2b-13 (Zweck steht nirgends). Der Titel der Arbeitsliste nennt keinen dritten Fall («fehlt»); falls Noah einen bestimmten Fall meint, bitte die Seite nennen.
- Nicht in diesem PR: doppelter Pin auf «So entscheidet die App» und «Teilen mit Vorschau» (7b, Seitenkopf und Karte) und schwebende Pins neben schmalen Seiten; sie gehören zur Ich-Ort-Vorlage.
- «anpinnen» statt «anheften», wie überall in der App; die Namensliste (PR #1180) ist noch nicht gemergt.
- Test: `tests/e2e/pinmarks.spec.js` prüft auf sieben Seiten, dass kein Pin auf einem Buchstaben oder Knopf liegt. Der Test zum Anpinnen auf Heute liest den Namen jetzt aus `data-pinname` statt aus `title`.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- UX-Test 08.11.2026: D1 (Pin deckt Text) erledigt, 2b-13 Text am Pin erledigt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Am Computer Velos › Pflege › Fahrten importieren öffnen: die Brotkrume über dem Titel ist ganz lesbar.
2. Den Zeiger auf den Pin rechts am Titel halten: «Diese Seite an Quick Links anpinnen, mit ihrem Filter».
3. Pin antippen: Quick Links zeigt die Seite; der Hinweis am Pin sagt nun, dass ein Tipp sie herausnimmt.
