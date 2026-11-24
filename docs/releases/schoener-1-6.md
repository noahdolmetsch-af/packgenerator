# App schöner: Farbe pro Bereich und ruhigere Bausteine

PR (offen) · 24.11.2026 · Auftrag: Noah «1b 2a 3a 4a 5a» (Thread «App mit impeccable schöner machen»)

## Was ist neu
- Jeder Bereich hat seine Farbe: «+ Neu», gewählte Chips, der Strich unter dem Reiter und die Hauptknöpfe folgen ihr. Ausschaltbar unter Ich › Darstellung › Bedienung › «Farbe pro Bereich».
- Wetter hat ein eigenes Symbol.
- Überschriften stehen normal geschrieben, nicht mehr in Versalien. Der Pin-Knopf hat eine Form und trägt gesetzt die Bereichsfarbe.
- Leere Stellen in Aktiv, Rückblick, Training und auf Heute sagen in einem Satz, was fehlt, und bieten einen Knopf.
- Ein Haken wächst kurz, eine erledigte Zeile klappt weg. Bei «Bewegung: Aus» steht alles still.
- Haken, Stern, Kreuz, Flagge und Herz sind Icons statt Zeichen (rund 30 Stellen); `Stat` ist der eine Zahlenstil (Erwartung nach einer Tour, Summen oben in Woche).
- Icons stehen in vier Grössen (14, 16, 20, 24) mit Strich 2 (2,5 beim Haken); rund 1950 Icons in 590 Dateien wurden angeglichen, ein Test hält es.
- Der Ring «Bereitschaft» nimmt Statusfarben (grün, gelb, rot), nicht die Bereichsfarbe.
- Touren: «Tour aus komoot» ist ein ruhiger Text-Link mit Pfeil neben «Rennen ›» (kein Chip mehr), «Fahrt hochladen» bleibt der eine Knopf.

## Was fällt weg oder rutscht tiefer
- «Salbei statt Farbe pro Ort» (20.10.2026) fällt weg: ein grünes Salbei überall gibt es nur noch, wenn «Farbe pro Bereich» aus ist.
- Versalien-Überschriften fallen weg.
- Der schwarze Pin-Kreis fällt weg (gesetzter Pin: Bereichsfarbe).

## Selbst entschieden
- Ecken und Schatten: nur Leiter und Wächter mit Grundlinie, keine Massenersetzung (Noah «2a»).
- Chips-Zeile, Kopf und Rahmen blieben beim Design-Thread; Pin-Knopf am Handy (Paket 19) ist hier mit erledigt und dem Bündler gemeldet.
- Diagramm-Hauptfarbe folgt automatisch der Bereichsfarbe über `--hi`; die acht eigenen Diagramme wandern später einzeln ins Kit.
- `Stat` steht in Woche und in der Erwartungskarte; Fahrten-Buch, Gipfelbuch und Höhenprofil folgen mit ihren Besitzer-Threads (dort sind Umbauten offen). Der Kursblick hat den Stil schon.
- Icon 18 px wurde 20 px, 15 und 17 wurden 16, 12 und 13 wurden 14, 22 bis 28 wurden 24; Icons ab 30 sind Zeichnungen und bleiben.
- Leere Zustände: 11 Stellen jetzt klein mit Knopf; die übrigen haben schon einen Knopf neben dem Satz und blieben.
- Zeichen in Übersetzungstexten («Gespeichert ✓») blieben, nur Zeichen im Markup wurden Icons.
- Dunkelmodus und alle sieben Farbwelten: Kontrast der Bereichsfarben mit einem Skript für alle Bereiche geprüft, keine Stelle unter 4,5:1.

## Entscheide (eigene Datei `docs/decisions/schoener-1-6.md`)
- 24.11.2026: Farbe pro Bereich ersetzt «Salbei statt Farbe pro Ort» (Noah «1b»); 2a–5a wie oben.

## Stand im Plan (roadmap.md / vorhaben.md)
- impeccable ganze App, Runde 2: Punkte 1–6 gebaut; 7 und 8 bewusst nicht.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Öffne Touren, Auswerten und Wetter: «+ Neu» und der gewählte Chip haben je ihre Farbe.
2. Ich › Darstellung › Bedienung › «Farbe pro Bereich» ausschalten: überall wieder Salbei.
3. Hake in Plan › Heute abhaken etwas ab: der Haken wächst kurz.
