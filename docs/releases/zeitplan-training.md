# Training als Zeitplan: Uhrzeit und freier Slot

PR #<Nummer> · 21.11.2026 · Schritt V4b der neuen Ordnung · Entscheid Noah «V4 ok» (21.11.2026 20:07 UTC); Bilder https://claude.ai/artifact/GNcF9PjPknnCyUicL7vgk4

## Was ist neu
- Woche › Training › Karte «Meine Woche» ist der **Zeitplan**: jeder Tag listet in der Reihenfolge der Uhrzeit die eigenen Einheiten (durchgezogen), die aus TrainingPeaks («TP»), die Vorschläge des Wochenplans (gestrichelt) und die Termine (ruhig, nur zum Anschauen).
- Unter jedem Tag steht der **freie Slot** («frei 11:00–13:00»). Ein Tipp öffnet «Neue Einheit» mit der Startzeit des Slots.
- «Neue Einheit»: Startzeit (freiwillig), alle Sportarten aus «Meine Sportarten» als Chips (statt der Auswahlliste), Dauer, Zone, und «Tour einplanen» mit den gemerkten Touren.
- Die Einheit trägt ihre Startzeit (neues freiwilliges Feld `time` in `training.plan`); TrainingPeaks bringt die Startzeit aus dem Plan mit.

## Was fällt weg oder rutscht tiefer
- Die Auswahlliste «Sportart» in der Einheiten-Maske: ersetzt durch Chips.
- Das kleine «+» bei jedem Tag: ersetzt durch die Zeile des freien Slots (gleiche Funktion, grösserer Tippbereich).
- Geplante Einheiten sind nicht mehr gestrichelt (gestrichelt ist jetzt der Vorschlag des Wochenplans).

## Selbst entschieden
- Kein neuer Speicherbereich: die Startzeit ist ein freiwilliges Feld an der Einheit in `training.plan` (alte Einheiten ohne Zeit bleiben gültig und stehen am Ende des Tages). Backup-Format unverändert.
- Termine zeigt der Zeitplan nur zum Anschauen (Quelle wie «Woche planen»), sie zählen für den freien Slot mit einer Stunde.
- Vorschläge des Wochenplans erscheinen nur für diese und die nächste Woche und ohne Meditation und Dehnen (die gehören nach «Alltag»); ein Tipp öffnet den Wochenplan.
- «Tour einplanen» füllt die Maske vor (Name der Tour, Velo, 4 Std.); alles bleibt änderbar. Bei Winter-Touren (Ski) ist die Art «Andere».
- Noch nicht in diesem PR (kommt mit V4b2): Knöpfe «Härter» und «Leichter» ganz oben, Karte «Dein Stand», Kacheln, Meditation nach «Alltag».

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Plan «ganze App»: V4b teilweise (Zeitplan, Slot, Neue Einheit); Rest als V4b2.

## Prüfschritte (nach dem Merge, auf der echten Seite)
1. Woche › Training: unter «Meine Woche» zeigt jeder Tag das Geplante mit der Uhrzeit vorn.
2. Tippe den freien Slot eines Tages: «Neue Einheit» öffnet sich mit der Startzeit des Slots.
3. Wähle eine Sportart, stelle Minuten ein, speichere: die Einheit steht im Tag zur Uhrzeit.
