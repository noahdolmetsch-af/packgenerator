# Gipfelbuch: Namen und Sammlungen

PR #<Nummer> · 24.11.2026 · Auftrag: Noah «alle 1-5 zusammen» (Thread «Gipfelbuch ausbauen»), Ideen 1 und 4 von 5

## Was ist neu
- Unter «Gefunden in deinen Fahrten» stehen jetzt auch Pässe und Gipfel mit ihrem Namen, Höhe und Position. Ein Tipp auf «Ins Gipfelbuch» trägt sie ein (mit Rückgängig); «Ändern» öffnet das Fenster, «Nicht dabei» legt den Vorschlag weg. Ist der Ort schon im Buch, steht «Nochmal bei …» (ein weiterer Besuch).
- Erkannt wird auf der Linie der Fahrt (Strava oder Datei): Rennvelo, Gravel und Bike finden Pässe, Wandern, Skitouren und Läufe Gipfel und Pässe. Bis 600 m von der Linie ist es sicher, bis 1,2 km steht «nahe an der Strecke, bitte prüfen» (dieselbe Regel wie bei «Pässe sammeln»).
- Neu unter den Orten: «Sammlungen» (zu, ohne Ziel und ohne Balken, nur «n von m»): «Alle Viertausender», «Pässe über 2000 m», «Zürcher Hausberge». Wer den Ort hat, sieht ihn mit Stern und Link auf seine Seite; bei den anderen steht «Ich war da» (Fenster mit Name, Höhe und Ort der Liste, den Tag fragt es).
- Eigene Listen: «Neue Liste» mit Name und Orten (einer pro Zeile); ändern, löschen (Rückgängig). Eingebaute Listen lassen sich ausblenden und wieder zeigen.

## Was fällt weg oder rutscht tiefer
- nichts. Die bisherigen Vorschläge (höchster Punkt einer Fahrt) bleiben; ein höchster Punkt, den ein Ort der Liste erklärt (±150 m Höhe), erscheint nur noch einmal, mit dem Namen.

## Selbst entschieden
- Der Katalog nimmt die Listen, die Neuland schon hat (Gipfel ab 3000 m, 125 Pässe), dazu die 15 Schweizer Gipfel aus dem Wetter und fünf Zürcher Hausberge von Hand (gerundet, bitte prüfen; das ist ein Anfang, eigene Listen ergänzen ihn). Kein neuer Datenbezug, nichts kostet etwas.
- Ein Ort der Liste gilt als «im Buch», wenn der Name passt oder ein Besuch im Buch höchstens 1,5 km entfernt ist.
- Eigene Listen und ausgeblendete Listen stehen in der Einstellung `gipfelbuch-listen`, nicht im Buch. Kein neues Dexie-Schema.
- Fahrten ohne mindestens 300 Hm werden für Rennvelo, Gravel und Bike nicht nach Pässen durchsucht (Tempo).
- «Fertig-Regel»: Seite = `f.gipfelbuch` (Text und Worte ergänzt); Absprung = der Weg über Gipfelbuch, Neuland und Sammel-Wand besteht; Leerzustand: eine Liste ohne Orte sagt es; als Nächstes = Link auf die Ortsseite; App-Stand = Gipfelbuch-Zeile ergänzt.

## Entscheide (eigene Datei `docs/decisions/<name>.md`)
- 24.11.2026: Sammlungen ohne Ziel – `docs/decisions/gipfel-sammlungen.md`

## Stand im Plan (roadmap.md / vorhaben.md)
- Gipfelbuch ausbauen: Ideen 1 und 4 von 5 online (nach «Seite pro Gipfel»); danach die Karte und «Welcher Berg ruft?».

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Gipfelbuch öffnen: unter «Gefunden in deinen Fahrten» stehen Pässe oder Gipfel mit Namen (wenn eine Fahrt darüber führte); «Ins Gipfelbuch» tippen, «Rückgängig» geht.
2. Nach unten zu «Sammlungen»: «Pässe über 2000 m» öffnen, die Zahl «n von m» stimmt mit dem Buch.
3. Bei einem Pass «Ich war da» tippen, speichern: die Zahl steigt um eins.
4. «Neue Liste» anlegen, zwei Orte eintragen, speichern, wieder löschen und «Rückgängig».
