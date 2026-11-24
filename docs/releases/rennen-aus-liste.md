# Rennen aus der Rennliste und Countdown-Zeiten

Auftrag: Noah 24.11.2026 «a» (Thread «Bikepacking-Rennen: Stand und Ideen zeigen»), erster Schritt der Rennvorbereitung: Brücke von der privaten Rennliste («Rennatlas») in die App, ab 24.11. 18:43 als vollständiger Rennatlas nach Noahs Mockup und die Zeiten des Velo-Countdowns.

## Was ist neu
- Touren › Rennen hat drei Reiter wie Mein Tag: «Kommende», «Rennatlas» und «Erledigt». Im Reiter «Rennatlas» wählt man einmal die JSON-Datei, die die eigene Rennliste speichert; die App liest sie nur auf dem Gerät und behält die Rennen (Einstellung «rennatlas», im Backup). Eine neue Datei ersetzt die Rennen, Sterne, «angemeldet» und gespeicherte Filter bleiben.
- **Liste** (Mockup 1): Suche; Filter «Anzeigen», «Untergrund», «Land», «Dauer» (zwei Regler) und «Anmeldung» (öffnet in 30 Tagen, jetzt offen, passt in meine Lücke), jeweils mit Zahl; am Handy hinter dem Knopf «Filter» (Fenster mit «n Rennen zeigen»); die gesetzten Filter als Pillen zum Wegtippen; «n von 140 Rennen»; Sortierung (Tag, Name, Länge, Anmeldung); gespeicherte Filter (speichern, antippen, umbenennen, löschen mit Rückgängig); je Rennen Datumskachel, Ort, Dauer, Untergrund, km, Hm, Balken für die Länge, Stand der Anmeldung und der Stern.
- **Zeitstrahl** (Mockup 2) «Mein Rennjahr»: die Karten «Bald fällig», «Danach» (die nächsten zwei Anmeldungen deiner Favoriten) und «Prüfen» (angemeldet, aber die Anmeldung ist noch nicht offen); die Konfliktwarnung («gehen nur auf, wenn du … in höchstens n Tagen fährst»); ein Balken pro Rennen (kräftig = angemeldet, blasser = Favorit, heller Teil = längste Dauer, grauer Rand = 2 Erholungstage); Überschneidungen rot schraffiert; freie Fenster grün mit der Zahl der Rennen, die hineinpassen; «Kalenderdatei (.ics) laden» und «Anmeldetermine in meinen Kalender».
- **Karte** (Mockup 3): Europa und die dichteste Gegend (meist die Alpen) mit den Umrissen der Länder, die die App schon hat; die Startorte als nummerierte Punkte (angemeldet kräftig, Favorit blasser, Überschneidung rot); Tippen öffnet das Rennen. Die Punkte brauchen `lat` und `lon` in der Datei.
- Ein Rennen antippen: Fenster mit Start, Ort, Distanz, Höhenmeter, Dauer, Untergrund, Anmeldung, Öffnung, Anmeldeschluss, Notiz und Link; «Als Favorit merken», «Als angemeldet markieren» und «Rennen anlegen» (macht ein Rennen der App mit Name, Starttag, Tagen = längste Zeit und erstem Velo; «Rückgängig» nimmt es zurück). In der Zeitstrahl-Ansicht legt ein Knopf alle angemeldeten und alle Favoriten an, die es noch nicht gibt.
- Auf der Seite des Rennens steht, solange noch keine Strecke geladen ist, «Laut deiner Rennliste: … km und … m hoch.»
- Velo-Countdown: neu «Ab jetzt ändert sich nichts mehr» 6 Wochen vorher (Velo, Taschen, Gepäck, Licht, Halterungen), «Velo-Service in der Werkstatt» 3 Wochen vorher, «Neue Teile jetzt montieren» 8 Wochen vorher, danach einfahren mit allem Montierten. Oben ein Band: Tage bis zum Start, «Stopp in n Tagen» und eine Zeitleiste mit Heute, Stopp und Start.

## Was fällt weg oder rutscht tiefer
- Auf der Rennen-Seite stehen «Kommende» und «Erledigt» nicht mehr als Überschriften untereinander, sondern als Reiter. Im Reiter «Rennatlas» stehen Einleitung und die Knöpfe «Neues Rennen» und «Rennen-Check» nicht (sie bleiben in «Kommende» und «Erledigt»).
- Das Ankreuzen und das Saison-Raster der ersten Fassung (PR 1701) fallen weg: Der Zeitstrahl ersetzt das Raster, das Fenster zu einem Rennen und der Knopf im Zeitstrahl ersetzen das Ankreuzen.
- Im Countdown heissen vier Schritte anders und stehen zu anderen Zeiten (Service und Teile früher). Erledigte Haken gehen nicht verloren.

## Selbst entschieden
- Die Datei ist eine einfache JSON-Liste (oder `{ asOf, races: [...] }`), keine Schnittstelle, kein Server. Höchstens 400 Zeilen und 2 MB. Neue, freiwillige Felder: `opens`, `closes`, `quality`, `note`, `lat`, `lon`.
- «Passt in meine Lücke»: Das Rennen überschneidet sich (mit 2 Erholungstagen hinter der längsten Dauer) mit keinem deiner Rennen, also angemeldet, Favorit oder schon in der App.
- Zwei Rennen sind ein Konflikt, wenn sich die längste Dauer plus 2 Erholungstage überschneiden; es steht «gehen nur auf, wenn … in höchstens n Tagen», solange die kürzeste Dauer reicht, sonst «liegen auf denselben Tagen».
- Zwei Rennen mit gleichem Namen und Tag werden einmal gezählt.
- Das Rennen bekommt das erste Velo der Liste; das lässt sich im Rennen ändern.
- Die Länderumrisse der Karte sind die «Neuland»-Daten, die schon in der App liegen; sie laden erst, wenn man die Karte öffnet.
- Noch nicht gebaut (braucht Daten, Mockup Teil 2): Filter «Art» und «Schotter mindestens x %», «Region», die Rennen-Seite mit «belegt / fehlt», ein neu gefundenes Rennen, die rote Linie von Start zu Ziel.
- Keine echten Rennen im Repo: Tests und Bilder im Repo nehmen erfundene Rennen.

## Entscheide (für decisions)
- 24.11.2026: Erst die Brücke und die Countdown-Zeiten (Noah «a»); Packkiste, Rucksack und Getränke danach.

## Stand im Plan (roadmap.md / vorhaben.md)
- Rennvorbereitung aus der Rennliste: Schritt 1 (Brücke + Countdown) fertig; Anmelde-Wecker, Versorgungs-Check, Anreise-Check, Passt zu meiner Form folgen einzeln.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Rennen › «Rennatlas» öffnen und die Datei der eigenen Rennliste wählen.
2. In der Liste filtern (Land, Untergrund, Dauer, «Passt in meine Lücke»), einen Filter speichern und wieder wählen.
3. «Zeitstrahl»: Karten, Konfliktwarnung und Balken stimmen mit deinen angemeldeten Rennen; «Karte»: die Startorte stehen am richtigen Ort.
4. Ein Rennen antippen, «Rennen anlegen»: Name, Tag, Tage und die Zeile mit km und Höhenmetern stimmen.
5. Rennen › Velo-Countdown: «Ab jetzt ändert sich nichts mehr» steht 6 Wochen vor dem Start.
