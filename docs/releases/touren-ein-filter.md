# Ein Filter auf Touren

PR #1827 · 27.11.2026 · Auftrag: Noah «Ja» (26.11.2026 18:07) und Wahl «a» (26.11.2026 23:25) auf die offene Frage 1 aus «Touren-Seite klarer» (Thread «Touren-Seite klarer machen»); drittes Folge-Paket nach «Gehört zu ins ?-Fenster» und «Tipps ins ?-Fenster»

## Was ist neu
- Unter dem Titel von Touren steht eine Leiste (`src/lib/touren/TourBar.svelte`, Regeln in `tourbar.js`): das Wortfeld, die Knöpfe Jahr, Velo, Art und Distanz und «Mehr Filter». Sie filtern die Liste «Meine Touren» selbst; es gibt keine zweite Trefferliste mehr.
- Velo und Art sind derselbe Filter wie im Fenster (mehrere zugleich, mit Zahl; die Chips über der Liste nehmen ihn wieder weg). Distanz setzt den Kilometer-Bereich des Fensters (unter 30, 30 bis 80, über 80 km). Jahr wählt ein Kalenderjahr statt des Zeitraums; ein Tipp auf 12 Monate, Jahr oder Alle nimmt es wieder weg.
- «Mehr Filter» (vorher «Filter» rechts im Kasten) öffnet das bekannte Fenster mit Dauer, Höhenmetern, Wetter, Leistung und «Meine Filter»; die Zahl daneben zählt alle aktiven Filter.
- «Suche am Ort» (`SearchHere.svelte`, `ort.js`) hat nur noch Ich und Auswerten.

## Was fällt weg oder rutscht tiefer
- Weg: die Box «Liste filtern» rechts neben der Liste (am Computer) und der Knopf «Filter» dort; die Trefferliste und die Summe unter dem Feld auf Touren (die Liste «Meine Touren» zeigt dieselben Touren, «n von m · gefiltert» steht darüber).
- Weg: das Feld auf dem Reiter «Fahrten» (er hat eigene Filter).
- Tiefer: Dauer, Höhenmeter, Wetter, Leistung und gespeicherte Filter sind unverändert hinter «Mehr Filter».
- Umgezogen: Zeitraum und Status stehen jetzt auf jeder Breite über der Liste «Meine Touren».

## Selbst entschieden
- Jahr ist ein eigener Wert neben dem Zeitraum, damit auch ältere Jahre (2024, 2025 …) erreichbar bleiben; ein Tipp auf Zeitraum löscht das Jahr.
- «In Zahlen» rechnet bei gewähltem Jahr mit allen Monaten ab der ersten Tour des Jahres.
- Unter der Leiste steht, solange etwas filtert, eine Zeile «n von m Touren» mit «Zur Liste ↓»; am Handy öffnet sich die Liste dann von selbst, sonst bliebe sie hinter «Meine Touren» zugeklappt und der Filter wäre unsichtbar.
- Ein Übersetzungsfehler ist mitgekorrigiert: die Zeile der aktiven Filter über der Liste hiess «Heute abhaken», jetzt «Aktiv».
- Fertig-Regel: keine neue Funktion, die vorhandenen Filter an einem Ort.

## Entscheide (eigene Datei `docs/decisions/touren-ein-filter.md`)
- 26.11.2026: Noah «Ja», Wahl «a».

## Stand im Plan
Dient «Klarheit» und «Auffindbarkeit» (Block 1). Kein Plan geändert.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren öffnen: unter dem Titel steht die Leiste, rechts neben der Liste keine Box «Liste filtern».
2. Ein Wort einer Tour tippen: «Meine Touren» zeigt nur diese Touren.
3. Velo wählen: die Liste wird enger, ein Chip nimmt es weg; «Mehr Filter» zeigt dasselbe.
