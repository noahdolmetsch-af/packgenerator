# Heute: drei kleine Korrekturen

PR folgt · 04.11.2026 · Auftrag: Noah «1 und 3» (Thread «Bereinigen: Doppeltes und Fehler auf Heute»), Punkt 3 a–c

## Was ist neu
- **a) Schreibweise:** Der Gruss oben hiess «wi gahts?», die Frage darunter «Wie gaht's?», die Funktion «Wi gaht's?». Jetzt steht überall «wi gaht's?» / «Wi gaht's?» (`src/lib/home/hallo.js`).
- **b) Abgeschnittene Texte:** In «Diese Woche» waren die Tagesspalten zu schmal (am Handy etwa 45 px, am Computer etwa 70 px), darum stand dort «Ten…» und «Stre…». Jetzt stehen die Aktivitäten in ganzen Zeilen unter den Tagen («Mi Tennis spielen», «Fr Stretching + Mini-Workout · Liegestütze»), am Handy und am Computer. Die Spalten zeigen nur noch Wochentag und Punkte. «Aktiv heute» selbst schneidet nichts ab (geprüft bei 390 und 1440 px).
- **c) «Velo im November: 0 km ▼ 100 %»:** Die Prozent vergleichen mit den gleichen Tagen des letzten Monats, das stand aber nirgends. Jetzt steht darunter «Gleiche Tage im Oktober: 38 km» (`MonthTile.svelte`, `monthKm` gibt `before` mit).

## Was fällt weg oder rutscht tiefer
- Die abgeschnittenen Namen in den Tagesspalten von «Diese Woche» fallen weg; die Namen stehen stattdessen in ganzen Zeilen unter den Tagen.

## Selbst entschieden
- Schreibweise «Wi gaht's?» (wie der Name der Funktion), mit geradem Apostroph wie überall in der App.
- Keine neue Funktion im Katalog: reine Korrekturen, keine neue Seite.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Heute bereinigen: Punkt 3 (Fehler) gebaut; Punkt 1 (Doppeltes) wartet auf Noahs a/b-Antwort.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute öffnen: der Gruss lautet «…, wi gaht's?»; antippen: die Frage im Fenster heisst «Wi gaht's?».
2. «Diese Woche»: unter den Tagen stehen die Aktivitäten in ganzen Zeilen.
3. Kachel «Velo im …»: unter den Prozent steht, womit verglichen wird.
