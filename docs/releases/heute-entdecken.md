# Heute entdecken

Auftrag: Noah «1a 2b 3a 4a 5a» (Thread «Versteckte Inhalte auffindbar machen»), Schritte 2 und 3 in einem PR, weil beide nur Heute betreffen (Noah 23.11.2026 «PRs bündeln»).

## Was ist neu
- Die Zeile **«Heute entdecken»** steht direkt unter den Chips im Gruss von Heute: eine Idee, immer mit ihrem **«Warum»**. Vorher lag die Karte «Entdecken» ganz unten unter «Mehr» (Handy: Pixel 7573 von 8251).
- Quellen, in dieser Reihenfolge: ein Stern, der fast da ist (ab 60 %), die **Tourenvorschläge** (solange du sie nie geöffnet hast; mit der Zahl deiner Träume im «Warum»), **was neu ist** (solange das Update neu ist), sonst eine **Funktion zu deinem Moment**, die du noch nie geöffnet hast (wie bisher).
- «Ansehen» geht hin, × schiebt die Idee auf morgen, «Mehr Ideen» öffnet ein Fenster mit drei Ideen, je mit «Später» und «Nicht für mich» (beide mit Rückgängig), «Noch nie geöffnet: n von m» mit Weg zur Karte der App und einem Schalter, der die Zeile wegnimmt.
- Nie dieselbe Idee an zwei Tagen in Folge zuoberst.
- Die Daten laden erst, wenn die Seite ruhig ist (Leerlauf, spätestens nach 1,5 s): Heute startet gleich schnell wie vorher.

## Was fällt weg oder rutscht tiefer
- Die Karte «Entdecken» unter «Mehr» steht nicht mehr dort, sie ist die Zeile unter den Chips. Alter Weg: Heute › «Mehr» aufklappen › ganz unten. Neuer Weg: Heute, erster Bildschirm.
- Die alte Kachel bleibt als Kachel in der Heute-Wand (alte Wände funktionieren weiter); sie zeigt nur beim Anpassen von Heute den Schalter für die Zeile.
- Sonst nichts. «Später» und «Nicht für mich» der Funktionen gelten weiter (gleiche Listen `home.discover`, `ruhig.notForMe`).

## Selbst entschieden
- Die Zeile steht im Gruss nach der Zeile «Heute sind n Dinge dran» (wie im Entwurf), nicht als Kachel der Wand: Heute-Wand, Reihenfolge und Backup-Format bleiben unberührt, die Haken-Block-Arbeit des Prototyp-Threads kollidiert nicht.
- Die Tourenvorschläge nennen **keine Zahl der Touren** (Entwurf: «131»): die 1-MB-Tourendaten würden sonst mit Heute laden. Das «Warum» nennt stattdessen deine Träume.
- «Nicht für mich» bei Sternen und Neuigkeiten steht in der neuen Einstellung `home.ideas` (nicht in `ruhig.notForMe`, weil dort jede Zeile als Funktion gelesen wird).
- Wort «Ideen»: Noahs Entwurf sagt «Mehr Ideen»; `docs/namen.md` reserviert «Idee» für die Ideenliste. Hier gilt Noahs Entwurf.
- Keine Datenänderung: nur zwei Einstellungsschlüssel (`home.ideas` neu, `home.discover` wie vorher), kein Dexie-Schema, kein Backup-Format, kein `api/`.
- Fertig-Regel: Absprung ist die Zeile selbst; Seite/Handbuch in `src/lib/featreg/heute-entdecken.js`; die Zeile hat Leer-Zustand (keine Idee → keine Zeile); «Als Nächstes» entfällt (die Zeile führt weg); App-Stand-Zeile steht in der Zeile «Heute».

## Entscheide (eigene Datei)
- `docs/decisions/heute-entdecken.md`

## Stand im Plan
- Auffindbarkeit (Weg 3): Schritte 2 und 3 gebaut; Karte (1, 4) und Wegweiser (5) folgen als eigene PRs, «Nach Moment» (6) nur auf Noahs ausdrücklichen Wunsch.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute öffnen: unter «Heute fahren» / «Abhaken» steht «Heute entdecken» mit einer Idee und einer Zeile «Warum».
2. «Mehr Ideen» antippen: drei Ideen; bei einer «Später» tippen, «Rückgängig» holt sie zurück.
3. Anpassen: die alte Kachel «Entdecken» zeigt den Schalter; ausschalten, die Zeile ist weg.
