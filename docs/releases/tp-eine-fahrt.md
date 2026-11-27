# Eine Fahrt erfüllt eine geplante Einheit

PR (Nummer folgt) · 27.11.2026 · Auftrag: Noah «Ja, beheben» und «warum betrifft es nur diese einzelne einheit?» (Thread «TrainingPeaks-Einheiten korrekt übernehmen»)

## Was ist neu
- Sind an einem Tag zwei Einheiten derselben Sportart geplant (zum Beispiel «Zwift» und «MTB Basemiles»), hakte eine einzige gefahrene Fahrt bisher beide ab. Jetzt ordnet die App Fahrt und Einheit eins zu eins zu: zuerst die gleiche Startzeit, sonst die nächste Dauer. Die andere Einheit bleibt offen und kann von Hand abgehakt werden.
- Gilt überall, wo «erledigt» gezählt wird: Meine Woche, Wochenrückschau, Wochensumme, Wochenplan und die Landschaft im Formular.
- Die gespeicherten Daten ändern sich nicht.

## Was fällt weg oder rutscht tiefer
- nichts. Ein von Hand gesetzter Haken bleibt.

## Selbst entschieden
- Gleiche Sportart geht vor «andere»; eine Einheit der Art «andere» nimmt eine Fahrt nur, wenn keine passendere Einheit sie braucht.
- Eine zweite Fahrt am selben Tag hakt die zweite Einheit ab (jede Fahrt höchstens eine Einheit).
- Nichts Neues über dem Inhalt (Content first): keine neue Funktion, daher ändern «Absprung», «Gut zu wissen» und «Leerer Zustand» nichts.

## Entscheide (eigene Datei `docs/decisions/tp-eine-fahrt.md`)
- 27.11.2026: Eine Aktivität erfüllt höchstens eine geplante Einheit.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung (Reparatur zu Klarheit und Verlässlichkeit im Training)

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Training › Meine Woche, Fr 27.11.: «Bike: Zwift» (geplant 1:00) ist durch die gefahrene Zwift-Fahrt abgehakt.
2. Ein zweites geplantes Training am gleichen Tag bleibt offen, solange keine zweite Fahrt da ist.
3. Wochenrückschau: die Zahl der erledigten Einheiten stimmt mit der Anzahl der Haken überein.
