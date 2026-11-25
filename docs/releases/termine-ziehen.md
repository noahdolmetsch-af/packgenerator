# Termine auf eine neue Zeit ziehen

Auftrag: Noah «wunsch hier und überall sonst wo sinnvoll: termine und trainings und aktivitäten können einfach per drag and drop verschoben, editiert, gelöscht werden» (Thread «Termine per Ziehen verschieben»); Antworten «1a 2b 3a 4a» und «2+3 dazu». Ein grosser PR (2b), gemeinsamer Baustein.

## Was ist neu
- **Ein gemeinsamer Baustein** (`src/lib/ui/timedrag.js`, Fenster `src/lib/ui/MoveSheet.svelte`, `src/lib/ui/ShiftSheet.svelte`): Computer: den Eintrag ziehen (oder seinen Griff), Pfeiltasten gehen auch (hoch und runter eine Viertelstunde, links und rechts ein Tag); Handy: etwa eine halbe Sekunde lang drücken, dann ziehen (vorher scrollt die Seite wie immer); Escape bricht ab. Dazu überall «Verschieben …» im Eintrag, damit Ziehen nie der einzige Weg ist.
- **Termine und Aufgaben › Woche** (`#/me/agenda`): ein Termin lässt sich auf eine andere Stunde oder einen anderen Tag ziehen, am unteren Rand ändert sich die Länge. Die Änderung geht an den Google Kalender (derselbe Schritt wie das Formular), die Meldung sagt «Auch in deinem Google Kalender geändert», «Rückgängig» schreibt den alten Stand zurück. In den Details gibt es «Verschieben …». Ein Termin aus einem Kalender ohne Schreibrecht, aus dem App-Kalender «Packgenerator» (den die App bei jedem Abgleich selbst schreibt) oder über mehrere Tage bleibt stehen und nennt den Grund. Löschen eines Termins bietet jetzt auch «Rückgängig» (legt ihn in Google neu an).
- **Wochenplan** (`#/flow/wochenplan`): eine Einheit auf einen anderen Tag ziehen macht dasselbe wie «Verschieben» (Tag, der Rest der Woche plant sich neu, «Rückgängig»).
- **Woche planen** (`#/week`): eigene Termine, To-dos und Einheiten des Trainingsplans lassen sich auf einen anderen Tag ziehen; «Verschieben …» (Tag und Uhrzeit) und «Kopieren»; Vorschläge aus «Noch zu planen» lassen sich auf einen Tag ziehen (wie «Übernehmen» für diesen Tag); «Alles verschieben …» unter einem Tag mit zwei oder mehr Einträgen legt alles zusammen auf einen anderen Tag (ein «Rückgängig»).

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- **Feste Einträge** (TrainingPeaks, Spielplan, Touren, Strava) sind nicht ziehbar (Noah «4a»); wo ein Grund nötig ist (Google), steht er in den Details.
- **Wiederholte Termine:** ein gezogener Termin einer Serie ändert nur diesen einen (wie das Formular); «Rückgängig» schreibt ihn zurück. Gelöschte wiederholte Termine kommen mit «Rückgängig» als einzelner Termin zurück.
- **Mehrtägige Termine** und Ganztags-Chips sind nicht ziehbar (Chip: «Verschieben …» ändert den Tag); Grund steht in den Details.
- **Keine eigene Funktionszeile** in `features.js`: es ist keine neue Seite, sondern eine Bedienung auf vier bestehenden Seiten; die Wege stehen in «Was ist neu» (mit «Ausprobieren») und in `docs/app-stand.md`.
- **Mein Tag** (`#/day`) hat schon Ziehen für eigene Einträge. Es wird nach dem Merge des Mein-Tag-Pakets (Punkte 3–6, Thread Mein Tag) auf den Baustein umgestellt, damit nicht zwei dieselbe Datei ändern (Tag.svelte). Der Baustein rechnet nicht mit festen Pixeln pro Stunde, sondern nimmt die Umrechnung der Seite.
- **Nicht dabei:** Hinweise auf Überschneidungen und Wetter beim Ziehen (Verbesserung 1, nicht gewählt).

## Entscheide (eigene Datei `docs/decisions/termine-ziehen.md`)
- 24.11.2026: Google-Termine werden beim Verschieben auch in Google geändert, mit «Rückgängig» (Noah «1a»); ein grosser PR (Noah «2b»); Handy lange drücken plus «Verschieben …» (Noah «3a»); feste Einträge bleiben fest (Noah «4a»); «Alles verschieben …», Ziehen aus Listen und «Kopieren» kommen dazu (Noah «2+3 dazu»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Kein Plan geändert; dient Klarheit (ein Weg überall) und Auffindbarkeit (Umplanen mit wenigen Tipps).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Planen › Termine und Aufgaben › Woche: einen Termin auf eine andere Stunde ziehen. Die Meldung nennt Google, «Rückgängig» holt ihn zurück; im Google Kalender stimmt die Zeit.
2. Tippe auf einen Termin, dann «Verschieben …»: Tag und Uhrzeit wählen, «Verschieben».
3. Planen › Woche: ein To-do auf einen anderen Tag ziehen (Handy: lange drücken, dann ziehen); «Alles verschieben …» unter einem Tag mit zwei Einträgen; «Rückgängig».
4. Training › Wochenplan: eine Einheit auf einen anderen Tag ziehen.
