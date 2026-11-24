# Mein Tag: klarere Zeitleiste

PR # · 24.11.2026 · Auftrag: Noah «was ja» (24.11.2026 22:42, Punkte 3 bis 6 der Durchsicht von «Mein Tag»)

## Was ist neu
- **Leere Stunden sind halb so hoch** (36 statt 72 Pixel). Eine Stunde mit Eintrag oder mit «jetzt» bleibt bei 72. Ziehen und Länger-Machen rechnen stückweise, so landet ein Eintrag weiter auf der Viertelstunde, die man trifft (`hourRows` in `src/lib/tag/timeline.js`).
- **Heute ist, was vorbei ist, heller** (nur auf heute, nur nicht abgehakte Einträge). Die «jetzt»-Linie bleibt, sie liegt durch die kürzere Zeitleiste näher am Rest.
- **Fast gleiche Trainings falten:** ein Vorschlag der App («Intervall-Einheit 1 h 25») neben dem Training aus TrainingPeaks gleicher Art («Drift Intervals 1 h 05») steht in einer zugeklappten Zeile «1 Vorschlag der App sieht aus wie dein Plan». Nichts wird gelöscht, darin steht jeder Vorschlag «wie «…»» (`src/lib/tag/similar.js`).
- **Ganztägige Termine als Band:** Kalendertermine ohne Uhrzeit, auch über mehrere Tage («BIKETRIP 3days»), stehen in einem Band oben im Tag. In «Heute laut Plan» bleiben sie wie bisher (`allDay` in `src/lib/woche.js`).
- **Der Punkt unter dem Tag** steht nur, wo an dem Tag wirklich etwas ist; reine Trainingsplan-Einheiten, die niemand angenommen hat, zählen nicht.

## Was fällt weg oder rutscht tiefer
- Der gleiche Abstand für jede Stunde: leere Stunden sind jetzt kleiner. Die Stundenzahlen leerer Stunden sind etwas heller.
- Ein von der App vorgeschlagenes Training, das einem Plan-Training gleicht, steht eine Ebene tiefer (zugeklappt).
- Ganztägige Termine stehen nicht mehr als Zeile unter «Ohne Zeit», sondern im Band.

## Selbst entschieden
- «Fast gleich» heisst: gleiche Art (`sessionKind`), Vorschlag der App gegen Import aus TrainingPeaks, Vorschlag noch nicht abgehakt. Eine Zeitgrenze braucht es nicht, weil beide am selben Tag stehen.
- Mehrtägige Termine zeigen das Band an jedem ihrer Tage.
- Die Auswahl der Rundung beim Ziehen (15 Minuten) bleibt; nur die Pixel pro Stunde sind nicht mehr überall gleich.
- Nicht angefasst: die Ebenen der Navigation, die abgeschnittenen runden Knöpfe und die doppelten Sonnen-Symbole gehören dem Thread «App schöner» (Punkte 1, 2, 7, 8).
- Keine Datenänderung.

## Beitrag zu den Zielen und Leitfaden
- Klarheit: weniger Leerraum, ein Training pro Block, ein Band statt einer Zeile ohne Zeit.
- Auffindbarkeit: der Tag zeigt auf einen Blick, wo etwas ist (Punkte, Band, «jetzt»).
- Leitfaden (`docs/leitfaden.md`): ein ruhiger Tag, nichts wird versteckt oder gelöscht.

## Stand im Plan
- Punkte 3 bis 6 der Durchsicht erledigt. Offen: Schritt 5 (Woche und Kalender ersetzen), Schritt 6.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. «Mein Tag» heute: leere Stunden niedrig, Stunde mit «jetzt» höher, Vergangenes heller.
2. Einen eigenen Eintrag ziehen und länger machen: er landet auf der Viertelstunde.
3. Tage oben: ein Punkt nur bei Tagen mit Einträgen.
4. Einen Tag mit ganztägigem Kalendertermin öffnen: Band oben.
