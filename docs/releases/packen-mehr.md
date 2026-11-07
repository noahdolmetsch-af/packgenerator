# Packen: zuerst die Liste, der Rest in fünf Gruppen

PR #<Nummer> · 07.11.2026 · Auftrag: Noah «1a 2a 3a 4b 5a» und «ja» (Thread «Vereinfachen der App ohne Verlust», Schritt 2 der Reihenfolge)

## Was ist neu
- Auf der Seite Packen steht die Packliste mit ihren Taschen wie bisher. Alles Weitere, was eine Tour haben kann, liegt darunter in **«Mehr zu dieser Tour»**, in fünf geschlossenen Gruppen (echte `<details>`, der Inhalt bleibt auf der Seite):
  - **Wetter und Warnungen:** Plan B bei schlechtem Wetter.
  - **Vorher und am Abend:** Velopflege («Vor der Tour»), «Bereit für die Tour?», Laden am Abend davor, Papiere, Generalprobe, Vorbereiten (Sport pro Tag, unklare Stellen, Grenzübertritt), In der Wäsche, Erst am Morgen, Check-in, «Gut angekommen», Einkaufsliste.
  - **Mit anderen:** Zu zweit packen.
  - **Packen leichter machen:** Startliste je Sportart.
  - **Daraus lernen:** «Für nächstes Mal» und Rückblick-Hinweise (soweit schon vorher auf der Seite), «Aus früheren Touren» (Ersatzteil, Schlafplatz), Ballast, Packzeit.
- Eine Gruppe öffnet sich von selbst, wenn ein Link in sie führt (Einkaufsliste `#/pack?shop`, Velopflege von Heute oder vom Push). Eine Gruppe ohne Inhalt blendet sich aus.
- Der Verlust-Wächter (`tests/fixtures/funktionen.json`, Abschnitt `versteckt`) kennt jetzt für jede verschobene Funktion den Weg dorthin; Suche, Karte der App und Katalog führen weiter zu allen.
- Dieselben Karten (`PackExtras`, `DoorCard`) können einzelne Falten zeigen (`only`), damit eine Karte auf zwei Gruppen verteilt werden kann. Ohne `only` sehen sie aus wie vorher.

## Was fällt weg oder rutscht tiefer
- Plan B, Check-in, «Gut angekommen», Sport pro Tag, unklare Stellen, Grenzübertritt, Generalprobe, Papiere, Wäsche, Morgenliste, Zu zweit packen, Packzeit, «Für nächstes Mal», «Aus früheren Touren»: standen offen neben der Packliste (rechte Spalte auf dem Computer, direkt unter dem Kopf auf dem Handy). Jetzt: Packen › Mehr zu dieser Tour › Gruppe (zwei Tipps).
- Velopflege («Vor der Tour»), Laden am Abend davor, Ballast, Startliste, Einkaufsliste: standen als Zeilen unter der Packliste. Jetzt: Packen › Mehr zu dieser Tour › Gruppe (zwei Tipps).
- Sonst nichts: Wetter der Tour, Gewicht, Route, Velo, Ampel, Planungs-Notizen und die Packliste selbst bleiben, wo sie waren.

## Selbst entschieden
- Der Stand je Gruppe («2 offen») fehlt noch: Jede Gruppe zeigt einen kurzen Satz, was drin ist. Der Stand braucht Zahlen aus jeder Karte und ist ein späterer, eigener Schritt.
- «Wetter und Warnungen» enthält vorerst nur Plan B: «Wetter der Tour» und die Warnung (`TripAlert`) bleiben oben, wie im Entwurf («Warnung bleibt als Zeile am Tourkopf»).
- Kopf und «Jetzt»-Karte der Seite kommen aus dem Pfad-Baustein des Threads «Tour von A bis Z»; dieser PR fasst sie nicht an (abgestimmt).
- Die Browser-Tests laufen mit `pg.packmore = open` (wie `pg.windows = quiet`), damit die bestehenden Prüfungen die Falten in den Gruppen finden; `tests/e2e/packen-mehr.spec.js` prüft den geschlossenen Standard. Zwei Specs (`haustuer`, `lernen-packen`) suchen ihre Falten jetzt auf der Seite statt in einer Karte, weil die Karte auf Gruppen verteilt ist.
- Die Gruppenkarten behalten ihre Zustand-Merkung je Tour (offen/zu) nur, solange die App offen ist.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- «Vereinfachen ohne Verlust», Schritt 2 (Packen, Basis und fünf Gruppen): gebaut, wartet auf Freigabe.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Packen mit einer Tour öffnen: unter der Packliste steht «Mehr zu dieser Tour» mit geschlossenen Gruppen.
2. «Vorher und am Abend» öffnen: Velopflege, Laden, Papiere, Check-in und die Einkaufsliste sind da.
3. Oben rechts auf die Suche tippen und «Plan B» oder «Zu zweit packen» eingeben: beide werden gefunden.
