# Quick Links

PR (Quick Links, Schritt 1 von 8) · 28.10.2026 · Auftrag: Noah «1a 2a 3a 4a 5a», «6a … 20b» und «ok quick links» (Thread «Quick Links»)

## Was ist neu
- Neuer Ort «Quick Links» (Pin-Symbol, Taste `g q`): in der Leiste unten am Handy und in der Seitenleiste am Computer (`src/pages/Quick.svelte`, `src/lib/nav.js`).
- 20 Vorschläge zum Start in 5 Gruppen: Vor der Tour, Unterwegs, Nach der Tour, Velo, Aktiv und Alltag. Ein Tippen öffnet die Funktion (`goFeature`) (`src/lib/quick/quicklinks.js`).
- «Anpinnen»: Suche über alle Funktionen der App, oder nach Bereichen aufgeklappt. Gruppe wählbar.
- «Bearbeiten»: Reihenfolge mit Pfeilen und Ziehen, eigener Name und Notiz pro Pin, Gruppe wechseln, Lösen mit Rückgängig. Gruppen hinzufügen, umbenennen, löschen (die Pins bleiben, «Ohne Gruppe» vorgewählt) und ordnen.
- Handy und Computer haben je eigene Pins (Noah 13); beide sind im Backup. Knopf «Pins vom anderen Gerät übernehmen».
- Erklärung im Handbuch, in «So geht's» und in «Was ist neu».

## Was fällt weg oder rutscht tiefer
- Nichts fällt weg. Die Leiste unten am Handy hat einen Ort mehr (Quick Links ganz rechts); die Seitenleiste am Computer eine Zeile mehr. Wer ihn nicht will, blendet ihn unter «Anpassen» aus.

## Selbst entschieden
- Pin 📌 statt Stern (Stern heisst schon «Lieblingsteil» bei Material).
- Quick Links steht ganz rechts in der Leiste, damit die gewohnten Orte bleiben, wo sie sind.
- Gerät erkannt an der Bedienung: Finger = Handy, Maus = Computer. Ein zweites Handy zeigt dieselben Pins wie das erste.
- Lösen fragt nicht zuerst, sondern bietet Rückgängig (schneller, nichts geht verloren).
- Die 20 Vorschläge habe ich aus den 400 Funktionen nach Tour-Ablauf ausgewählt; sie sind normale Pins und lassen sich lösen.
- Pins in der Seitenleiste (Idee 16) kommen erst in einem späteren Schritt, damit dieser PR klein bleibt.

## Entscheide (für decisions.md)
- 28.10.2026: Quick Links ist ein eigener Ort mit Pins pro Gerät; die Pin-Markierung überall folgt in Schritt 2.

## Stand im Plan (roadmap.md / vorhaben.md)
- Quick Links: Schritt 1 (Seite, Ort, Vorschläge, Gruppen, Pins pro Gerät) mit diesem PR. Es folgen: 2 Pin-Markierung überall + Rundgang, 3 Springen und Leuchten + Ansicht mit Filter, 4 Zuletzt geöffnet / Vorschlag / Aufräumen nach 30 Tagen, 5 Werte und Punkt, 6 Passend zum Moment, 7 Top 4 auf Heute, 8 Suche, `g q` überall, App-Symbol-Kurzbefehle.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Unten (Handy) oder links (Computer) «Quick Links» antippen: 20 Vorschläge in 5 Gruppen.
2. «Wetter für eine Fahrt» antippen: die Wetter-Seite öffnet sich.
3. «Bearbeiten»: einen Pin mit dem Pfeil nach oben schieben, mit dem Papierkorb lösen, dann «Rückgängig».
