# Rennen aus der Rennliste und Countdown-Zeiten

Auftrag: Noah 24.11.2026 «a» (Thread «Bikepacking-Rennen: Stand und Ideen zeigen»), erster Schritt der Rennvorbereitung: Brücke von der privaten Rennliste («Rennatlas») in die App und die Zeiten des Velo-Countdowns.

## Was ist neu
- Touren › Rennen hat jetzt drei Reiter wie Mein Tag: «Kommende», «Rennliste» und «Erledigt». Im Reiter «Rennliste» wählt man die JSON-Datei, die die eigene Rennliste speichert; die App liest sie nur auf dem Gerät. Oben zeigt ein Saison-Raster (12 Monate) die gewählten Rennen als Balken; Rennen am selben Tag sind markiert und es steht ein Hinweis darüber. Darunter die Liste nach Monaten, mit Chips «Alle · Angemeldet · Favoriten · Neu»; angemeldete Rennen und Favoriten sind vorgewählt, Rennen, die es schon gibt (gleicher Name und Tag), sind grau markiert und nicht wählbar. Eine Leiste unten sagt, wie viele gewählt sind («Alle ankreuzen», «Alle abwählen»).
- «… Rennen anlegen» macht aus jeder Wahl ein Rennen mit Namen, Starttag, Tagen (die längste Zeit, bei «6–10 Tage» also 10) und dem ersten Velo. «Rückgängig» nimmt alle wieder weg.
- Auf der Seite des Rennens steht, solange noch keine Strecke geladen ist, «Laut deiner Rennliste: … km und … m hoch.»
- Velo-Countdown: neu «Ab jetzt ändert sich nichts mehr» 6 Wochen vorher (Velo, Taschen, Gepäck, Licht, Halterungen), «Velo-Service in der Werkstatt» 3 Wochen vorher, «Neue Teile jetzt montieren» 8 Wochen vorher, danach einfahren mit allem Montierten.
- Der Countdown hat oben ein Band (Entwurf D): Tage bis zum Start, «Stopp in n Tagen» und eine Zeitleiste mit Heute, Stopp und Start. Der Schritt «Ab jetzt ändert sich nichts mehr» ist dunkel hervorgehoben; die Schritte stehen in «Bis zum Stopp» und «Bis zum Start».

## Was fällt weg oder rutscht tiefer
- Auf der Rennen-Seite stehen «Kommende» und «Erledigt» nicht mehr als Überschriften untereinander, sondern als Reiter; die Box zum Aufklappen für die Rennliste ist ersetzt durch den Reiter «Rennliste».
- Im Countdown heissen vier Schritte anders und stehen zu anderen Zeiten (Service und Teile früher). Erledigte Haken gehen nicht verloren, die Schritte behalten ihre Kennungen, wo der Sinn gleich bleibt.

## Selbst entschieden
- Die Datei ist eine einfache JSON-Liste (oder `{ races: [...] }`), keine Schnittstelle, kein Server. Höchstens 400 Zeilen und 2 MB.
- Zwei Rennen mit gleichem Namen und Tag werden einmal gezählt.
- Das Rennen bekommt das erste Velo der Liste; das lässt sich im Rennen ändern.
- Die Angaben der Liste (km, Höhenmeter, Ort, Untergrund, Link, Quelle, «geprüft am») bleiben am Rennen gespeichert; sichtbar ist vorerst nur die Zeile mit km und Höhenmetern.
- Keine echten Rennen im Repo: Tests und Bilder nehmen erfundene Rennen.

## Entscheide (für decisions)
- 24.11.2026: Erst die Brücke und die Countdown-Zeiten (Noah «a»); Packkiste, Rucksack und Getränke danach.

## Stand im Plan (roadmap.md / vorhaben.md)
- Rennvorbereitung aus der Rennliste: Schritt 1 (Brücke + Countdown) fertig; Anmelde-Wecker, Versorgungs-Check, Anreise-Check, Passt zu meiner Form folgen einzeln.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Rennen › «Rennen aus deiner Rennliste übernehmen» öffnen und die Datei der eigenen Rennliste wählen.
2. Die Rennen stehen in der Liste, angemeldete und Favoriten sind angekreuzt; «Rennen anlegen» tippen.
3. Ein Rennen öffnen: Name, Tag, Tage und die Zeile mit km und Höhenmetern stimmen.
4. Rennen › Velo-Countdown: «Ab jetzt ändert sich nichts mehr» steht 6 Wochen vor dem Start.
