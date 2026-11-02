# Schnell öffnen mit deinen Pins

PR (Heute, Kachel «Schnell öffnen») · 01.11.2026 · Auftrag: Noah «1a 2a 3b 4a 5a» (Thread «Vorschlagen Schnell-öffnen-Kachel mit Lieblingsfeatures»)

## Was ist neu
- Auf Heute zeigt «Schnell öffnen» jetzt eine Kachel mit deinen Quick-Links-Pins, alle auf einmal (`src/lib/home/PinsTile.svelte`). Ein Tipp öffnet die Funktion, wie in Quick Links.
- «Abkürzungen ändern» (Stift) direkt auf Heute: Funktion hinzufügen (Suche über alle Funktionen, auch versteckte), umbenennen, lösen mit Rückgängig, Reihenfolge mit Pfeilen und Ziehen, «Zurück zu den Vorschlägen».
- Start: 13 Lieblinge statt 20 Vorschläge (Schnellstart, Was ziehe ich an, Träume, Live-Karte, Notiz, SOS, Fahrt hochladen, Hitzekarte, Pflege, km eintragen, Teile-Verschleiss, Problem, Tick-Liste). Betrifft nur, wer Quick Links noch nie geändert hat.
- Gleiche Daten wie die Seite Quick Links (pro Gerät). Gruppen und Notizen bleiben dort. Backup und Sync-Format unverändert.

## Was fällt weg oder rutscht tiefer
- Die 8 kleinen Kacheln von Heute (Reise planen, Notiz, km, Pflege, Material, Anziehen, Vorlagen, Favoriten) sind durch diese Kachel ersetzt (Wand Version 18, einmalig). Weg zurück: «Kachel hinzufügen» (alle 8 bleiben im Katalog) oder als Pin anheften. Wer die Wand schon ohne diese Kacheln hatte, behält sie.

## Selbst entschieden
- Die Kachel hat eine Liste für alle Pins (Gruppen aus Quick Links werden hier nur als Reihenfolge gezeigt).
- Verschieben auf Heute ordnet die Gesamtliste; ein Pin übernimmt die Gruppe seines neuen Nachbarn.
- Hinzufügen landet in der letzten Gruppe von Quick Links.

## Entscheide (für decisions.md)
- 01.11.2026: «Schnell öffnen» auf Heute = Quick-Links-Pins, direkt änderbar (Noah 1a 2a 3b 4a 5a).

## Stand im Plan (roadmap.md / vorhaben.md)
- Entspricht dem Schritt «Top auf Heute» von Quick Links (7), in der Form «alle Pins».

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute: nach unten zu «Schnell öffnen». Deine Abkürzungen stehen dort; «Schnellstart» antippen.
2. «Abkürzungen ändern» › «Abkürzung hinzufügen», eine Funktion suchen und antippen.
3. Eine mit den Pfeilen verschieben, eine lösen, in der Meldung «Rückgängig» tippen.
