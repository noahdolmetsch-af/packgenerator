# App schöner, Runde 2b: Icons in einer Grösse, Zahlenstil, ruhigere Touren-Zeile

PR (offen) · 24.11.2026 · Auftrag: Noah «1-7 alle, zuerst 1-4» (Thread «App mit impeccable schöner machen»); folgt direkt auf Runde 1 (`schoener-1-6`)

## Was ist neu
- Icons stehen in vier Grössen (14, 16, 20, 24) mit Strich 2 (2,5 beim Haken); rund 1950 Icons in 590 Dateien wurden angeglichen, ein Test hält es.
- Haken, Stern, Kreuz, Flagge und Herz sind Icons statt Zeichen (rund 30 Stellen).
- `Stat`, der eine Zahlenstil, steht jetzt auch in den Summen oben in Woche; der Ring «Bereitschaft» nimmt Statusfarben.
- Leere Stellen bei der Route (Sportseite) und in Strom haben einen Satz und einen Knopf.
- Touren: «Tour aus komoot» ist ein ruhiger Text-Link mit Pfeil neben «Rennen ›» (kein Chip mehr).

## Was fällt weg oder rutscht tiefer
- Icon-Grössen 12, 13, 15, 17, 18, 22, 26, 28 und krumme Strichstärken fallen weg.
- Der komoot-Chip auf Touren fällt weg (Text-Link).

## Selbst entschieden
- 18 px wurde 20 px, 15 und 17 wurden 16, 12 und 13 wurden 14, 22 bis 28 wurden 24; Icons ab 30 sind Zeichnungen und bleiben.
- Zeichen in Übersetzungstexten («Gespeichert ✓») blieben, nur Zeichen im Markup wurden Icons.
- Leere Zustände: die meisten übrigen haben schon einen Knopf neben dem Satz und blieben.
- Fahrten-Buch, Gipfelbuch und Höhenprofil nehmen `Stat` mit ihren Besitzer-Threads (dort sind Umbauten offen).
- Dunkelmodus und alle sieben Farbwelten: Kontrast der Bereichsfarben für jeden Bereich mit einem Skript geprüft, keine Stelle unter 4,5:1.

- Der Wächter-Test «Packkarten» (`pack-karten.spec.js`) erlaubt zwischen Titel und Karten jetzt 560 statt 500 px: der komoot-Link steht in der Kopfzeile (am Handy eine Zeile mehr, etwa 50 px), dafür fällt die Chip-Zeile unter den Karten weg (46 px). Der Inhalt beginnt unverändert im ersten Bildschirm.

## Entscheide (eigene Datei `docs/decisions/schoener-2b.md`)
- 24.11.2026: Icon-Leiter und Zahlenstil (Noah «5a», «1-7 alle»).

## Stand im Plan (roadmap.md / vorhaben.md)
- impeccable ganze App, Runde 2: Punkte 1–7 gebaut.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Öffne Planen › Woche: die Summen oben stehen als Zahlen mit kleinem Text.
2. Öffne Touren: «Tour aus komoot» ist ein Text-Link neben «Rennen ›».
3. Öffne Material › Ausleihen oder eine Favoriten-Liste: der Stern ist ein Icon.
