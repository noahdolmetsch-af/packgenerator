# App schöner: Farbe pro Bereich und ruhigere Bausteine

PR (offen) · 24.11.2026 · Auftrag: Noah «1b 2a 3a 4a 5a» (Thread «App mit impeccable schöner machen»)

## Was ist neu
- Jeder Bereich hat seine Farbe: «+ Neu», gewählte Chips, der Strich unter dem Reiter und die Hauptknöpfe folgen ihr. Ausschaltbar unter Ich › Darstellung › Bedienung › «Farbe pro Bereich».
- Wetter hat ein eigenes Symbol.
- Überschriften stehen normal geschrieben, nicht mehr in Versalien. Der Pin-Knopf hat eine Form und trägt gesetzt die Bereichsfarbe.
- Leere Stellen in Aktiv, Rückblick, Training und auf Heute sagen in einem Satz, was fehlt, und bieten einen Knopf.
- Ein Haken wächst kurz, eine erledigte Zeile klappt weg. Bei «Bewegung: Aus» steht alles still.
- Haken, Stern und Kreuz sind Icons statt Zeichen; `Stat` ist der eine Zahlenstil (zuerst bei der Erwartung nach einer Tour).

## Was fällt weg oder rutscht tiefer
- «Salbei statt Farbe pro Ort» (20.10.2026) fällt weg: ein grünes Salbei überall gibt es nur noch, wenn «Farbe pro Bereich» aus ist.
- Versalien-Überschriften fallen weg.
- Der schwarze Pin-Kreis fällt weg (gesetzter Pin: Bereichsfarbe).

## Selbst entschieden
- Ecken und Schatten: nur Leiter und Wächter mit Grundlinie, keine Massenersetzung (Noah «2a»).
- Chips-Zeile, Kopf und Rahmen blieben beim Design-Thread; Pin-Knopf am Handy (Paket 19) ist hier mit erledigt und dem Bündler gemeldet.
- «Tour aus komoot» als Nebenaktion statt Chip und die Knopf-Formen in der Touren-Zeile sind nicht dabei (Design-Thread).
- Diagramm-Hauptfarbe folgt automatisch der Bereichsfarbe über `--hi`; die acht eigenen Diagramme wandern später einzeln ins Kit.
- `Stat` zuerst nur an einer Stelle; Woche, Fahrten-Buch, Gipfelbuch und Kursblick folgen mit ihren Besitzer-Threads, weil dort Tests Zahlentexte prüfen.

## Entscheide (eigene Datei `docs/decisions/schoener-1-6.md`)
- 24.11.2026: Farbe pro Bereich ersetzt «Salbei statt Farbe pro Ort» (Noah «1b»); 2a–5a wie oben.

## Stand im Plan (roadmap.md / vorhaben.md)
- impeccable ganze App, Runde 2: Punkte 1–6 gebaut; 7 und 8 bewusst nicht.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Öffne Touren, Auswerten und Wetter: «+ Neu» und der gewählte Chip haben je ihre Farbe.
2. Ich › Darstellung › Bedienung › «Farbe pro Bereich» ausschalten: überall wieder Salbei.
3. Hake in Plan › Heute abhaken etwas ab: der Haken wächst kurz.
