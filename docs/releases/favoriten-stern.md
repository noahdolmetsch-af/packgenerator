# Ein Stern statt Pin

PR #1826 · 27.11.2026 · Auftrag: Noah «1-5a» und Freigabe der Karte «Konzept Favoriten freigeben» (Thread «Lieblingsinhalte besser sichtbar machen»)

Schritt 1 von 4 des Konzepts «Favoriten» (Stern statt Pin; danach Heute-Kachel mit «Alle»-Fenster, Sterne an Tour, Packliste und Velo, Suche).

## Was ist neu
- Die kleine Marke oben rechts auf den Karten ist ein **Stern** statt einer Pinnadel; ein ausgefüllter Stern heisst «ist ein Favorit».
- Die Sache heisst überall **«Favorit»**, der Ort **«Favoriten»** (Seite, Seitenleiste, Heute-Kachel, Rundgang, Hilfe). Die Adresse `#/quick` und alle bisherigen Pins bleiben; die Suche findet die Seite weiter mit «Quick Links», «Pin» und «Abkürzung».
- Ein nackter Link oder Knopf ohne Karte darum (zum Beispiel «Tour aus komoot») bekommt keinen Stern mehr; Karten, Reiter und Seitentitel behalten ihn.

## Was fällt weg oder rutscht tiefer
- Die Pinnadel auf nackten Links und Knöpfen fällt weg (sie lag dort auf Chips und war Lärm). Ein schon gemerkter Favorit davon bleibt in «Favoriten» und auf Heute; nur der Stern auf der Seite selbst fehlt.
- Sonst nichts: keine Daten, keine Adressen, keine Gruppen ändern sich.

## Selbst entschieden
- Nur die deutschen Texte (und der Katalog-Titel) wurden umbenannt; die englischen Quelltexte bleiben, um den Umbau klein zu halten. Der Katalog-Titel heisst im Englischen jetzt «Favourites|quick» (der Schlüssel «Quick Links» steht noch in einer alten News-Datei mit anderer Übersetzung).
- Frage 2 («Wort für das Material») ist noch offen; ich bin von ★ a ausgegangen. Die Seite «Favoriten» für bewährtes Material (`#/favorites`) wird in diesem PR **nicht** umbenannt, das kommt als eigener kleiner PR, sobald Noah entschieden hat.
- Ein Browser-Test (`pinmarks.spec.js:6`) war einmal rot, als zwei Tests gleichzeitig auf dem Cloud-Rechner liefen; mit einem Test nach dem anderen lief er sieben Mal grün (Auslastung des Rechners, kein Fehler der App).

## Entscheide (eigene Datei `docs/decisions/favoriten-stern.md`)
- 27.11.2026: ein Stern statt Pin, ein Wort «Favorit»

## Stand im Plan (roadmap.md / vorhaben.md)
- Favoriten, Schritt 1 (Stern statt Pin): erledigt mit diesem PR; offen: Heute-Kachel mit «Alle»-Fenster und «Oft genutzt», Sterne an Tour, Packliste und Velo, Suche.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute öffnen: oben rechts auf einer Karte steht ein Stern; antippen, der Stern füllt sich, «… ist jetzt ein Favorit» erscheint mit Rückgängig.
2. In der Seitenleiste unter Heute «Favoriten» öffnen: die Karte steht in der ersten Gruppe, die alten Pins sind alle da.
3. Touren öffnen: «Tour aus komoot» und «Fahrt hochladen» tragen keinen Stern mehr.
