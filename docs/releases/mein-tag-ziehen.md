# Mein Tag: Einträge ziehen wie überall

Auftrag: Noah «wunsch hier und überall sonst wo sinnvoll: termine und trainings und aktivitäten können einfach per drag and drop verschoben … zb. auch im wochenplan, mein tag etc» (Thread «Termine per Ziehen verschieben»). Dies ist der angekündigte zweite Teil von `docs/releases/termine-ziehen.md`: «Mein Tag» (`#/day`) geht auf den gemeinsamen Baustein `src/lib/ui/timedrag.js`.

## Was ist neu
- **Ganzer Eintrag ziehbar:** In «Mein Tag» zieht man einen eigenen Eintrag jetzt an ihm selbst auf eine neue Zeit (Computer: mit der Maus, ein Klick öffnet ihn weiter; Handy: etwa eine halbe Sekunde drücken, dann ziehen). Der Griff, der untere Rand für die Länge und die Pfeiltasten gehen wie bisher (links und rechts ändert neu den Tag). Escape bricht ab. Die Umrechnung der Pixel in Minuten bleibt die der Seite (leere Stunden sind halb so hoch, `hourRows`).
- **Einheiten und Einträge ohne Zeit:** Eine Einheit des Trainingsplans (nur der Tag ändert sich, nicht ihre Zeit) und ein eigener Eintrag ohne Uhrzeit lassen sich auf den Chip eines anderen Tages ziehen; «Rückgängig» holt sie zurück. Ein Eintrag ist nur ziehbar, wenn er nicht abgehakt ist (Einheiten nur ab heute).
- **«Alles verschieben …»** unter der Zeitleiste an einem Tag mit zwei oder mehr beweglichen Einträgen (heute und später): alles zusammen auf einen anderen Tag (morgen ist vorgewählt), ein «Rückgängig». Dasselbe Fenster wie in «Woche planen» (`ShiftSheet.svelte`).
- **Baustein:** Ein Link im Eintrag startete beim Ziehen mit der Maus das eigene Ziehen des Browsers und schluckte die Maus; `timedrag.js` unterdrückt das jetzt (`dragstart`). Gilt auch für Woche, Wochenplan und Termine und Aufgaben.

## Was fällt weg oder rutscht tiefer
- nichts (der Griff, der untere Rand und die Pfeiltasten bleiben; die Abläufe «Ändern» und «Löschen» im Eintragsfenster bleiben)

## Selbst entschieden
- **«Verschieben …»-Fenster:** Für eigene Einträge ist das Eintragsfenster (Tippen auf den Eintrag: Tag und Uhrzeit) schon das Fenster zum Umlegen ohne Ziehen; ein zweites Fenster wäre doppelt. Einheiten ohne Fenster: «Alles verschieben …» oder auf den Tageschip ziehen.
- **Kalender-Termine** (Google, Touren, Strava, TrainingPeaks) bleiben in «Mein Tag» wie bisher fest; verschoben werden sie in «Termine und Aufgaben» (Noah «4a»).
- **Einträge ohne Zeit** ziehen nur auf einen anderen Tag (eine Zeit bekommen sie in «Plan mir den Tag»).
- **Keine neue Funktionszeile** in `features.js`, wie im ersten Teil: es ist dieselbe Bedienung; die Zeile «Mein Tag» in `docs/app-stand.md` ist ergänzt.

## Entscheide (eigene Datei `docs/decisions/mein-tag-ziehen.md`)
- Kein neuer Entscheid; setzt Noahs «2b» (alle Orte, ein Baustein) und «3a» (Handy: lange drücken) für «Mein Tag» um.

## Stand im Plan (roadmap.md / vorhaben.md)
- Kein Plan geändert; dient Klarheit (ein Weg überall).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Planen › Mein Tag: einen eigenen Eintrag an seinem Text auf eine andere Stunde ziehen (Handy: lange drücken, dann ziehen); «Rückgängig».
2. Eine Einheit oder einen Eintrag ohne Zeit auf den Tageschip von morgen ziehen.
3. «Alles verschieben …» unter der Zeitleiste; «Rückgängig».
