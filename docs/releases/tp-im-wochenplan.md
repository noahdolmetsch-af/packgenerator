# Der Wochenplan kennt TrainingPeaks

Auftrag: Noah «1a 2a 3a 4a» (22.11.2026, Thread «TrainingPeaks ins Wochen-Soll einrechnen»), Schritt W1 von W1 bis W3. Kein `api/`, kein neues Datenformat, kein Dexie-Schema: der Planer liest die Einheiten, die schon in `training.plan` stehen (`src: 'tp'`).

## Was ist neu
- Der Wochenplan bekommt die Einheiten der Woche aus TrainingPeaks (`ctx.sessions`) und plant nur den Rest. Reine Funktion, keine Uhr, keine Datenbank.
- Ersatz nach Sportart (Noah «2a»): Velo ersetzt «Velo draussen» oder «Velo drinnen» (Titel mit «Indoor», «Zwift», «Rolle», «Trainer» → drinnen, sonst draussen), Lauf ersetzt «Laufen draussen» oder «Laufband», ein Titel mit Kraft, Strength oder Gym ersetzt «Gym». Wandern und alles andere ersetzt nichts, es zählt nur auf die Stunden. Tennis, Eishockey, Yoga, Sauna, Ruheblock und Mini-Workout bleiben immer.
- Eine Einheit fällt weg, wenn die TrainingPeaks-Minuten noch mindestens ihre halbe Länge decken. Die Minuten einer Art decken zuerst die eigene Art (drinnen → drinnen), der Rest die andere (Velo draussen und drinnen). Liegt TrainingPeaks allein über dem Soll, rechnet der Planer nie ins Minus: Hinweis «TrainingPeaks allein liegt über deinen N Std», bei den anderen Sportarten wird nichts weggenommen.
- Im Sommer schrumpfen die Velo-Stunden von «Velo draussen» im gleichen Verhältnis mit.
- TrainingPeaks steht fest an seinem Tag (mit Startzeit aus dem Plan). Die freien Einheiten weichen aus. «Was nicht passt» prüft es mit: drei harte Tage am Stück, mehr als drei Einheiten an einem Tag, Überschneidungen mit festen Einheiten und der fehlende freie Halbtag. Härte aus der Zone: 4 und 5 hart, 3 mittel, 1 und 2 leicht, ohne Zone mittel.
- Notizen im Wochenplan: «TrainingPeaks bringt diese Woche N Std …», «Ersetzt durch TrainingPeaks: 2 × «Velo draussen»», «TrainingPeaks allein liegt über deinen N Std».
- Die Zeile «Plan: X Std von Y Std» auf der Wochenplan-Seite zählt TrainingPeaks mit.
- Angeschlossen: Wochenplan-Seite, «Meine Woche» (Vorschläge), «Mein Trainingsplan» (Einheiten der Woche), Heute («Jetzt dran»), «Geschafft» (nächste offene Einheit) und «Dein nächster Stern». Überall dieselbe Woche.

## Was fällt weg oder rutscht tiefer
- Im Plan fallen die Velo-, Lauf- oder Gym-Einheiten weg, die TrainingPeaks in dieser Woche schon deckt. Alter Weg: der Plan zeigte sie zusätzlich, TrainingPeaks kam obendrauf. Neuer Weg: sie stehen nicht mehr da, die Notiz «Ersetzt durch TrainingPeaks» sagt, was. Zurück: den TrainingPeaks-Link herausnehmen oder die Einheit in «Meine Woche» löschen, dann kommen die Einheiten zurück (die Ziele bleiben unberührt).
- Wochen ohne TrainingPeaks bleiben Byte für Byte gleich (Wächter-Test).

## Selbst entschieden
- **Kein Schalter «ohne TrainingPeaks planen».** Ein Schalter pro Woche wäre ein neuer Eintrag in `training.weeklog` (neues Feld im Backup) und gehört zur Einzelfreigabe. Der Weg zurück ist der oben genannte. Soll er kommen: sag es, dann kommt er als eigener PR.
- **«Recovery Day»** hat keine Dauer und wird von `trainingpeaks.js` nicht gelesen. Das ändere ich hier nicht (Eingriff in den Feed-Leser, eigener Schritt); darum hält ein Ruhetag in TrainingPeaks den Tag noch nicht frei. Vorschlag: eigener kleiner PR, der ihn als Ruhetag liest.
- **Einheit ohne Uhrzeit** (z. B. eine lange Fahrt am Wochenende): sie zählt für Tageslast, Einheiten pro Tag und den freien Halbtag, als läge sie um 10:00. Überschneidungen werden bei ihr nicht gemeldet, und die freien Einheiten weichen ihr nicht aus.
- Ein Konflikt, an dem nur TrainingPeaks beteiligt ist, bekommt keinen Knopf «Einheit weglassen»: es gibt nichts im Plan, das man wegnehmen könnte.
- Hinweis zur Rechnung: im Winter-Grundplan stehen nur 2,5 Std Velo (1 × draussen, 1 × drinnen). 9 Std Velo aus TrainingPeaks ersetzen davon alles, der Rest kommt obendrauf; die Woche liegt dann über dem Soll von 15 Std. Das ist die Folge von «2a» (nur die gleiche Sportart). Die Notiz sagt es, nichts anderes wird gestrichen.

## Entscheide (eigene Datei `docs/decisions/tp-im-wochenplan.md`)
- 22.11.2026: TrainingPeaks zählt im Wochen-Soll mit (Noah «1a 2a 3a 4a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- TrainingPeaks im Wochen-Soll: W1 (Planer) fertig; W2 (Zählung und Wochenstern) und W3 (Doku und Hinweise) folgen.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Verbindungen › TrainingPeaks-Plan: Link da. Training › Wochenplan, diese oder nächste Woche: bei Einheiten aus TrainingPeaks steht unter den Tagen «Ersetzt durch TrainingPeaks».
2. Die Zeile «Plan: … Std von … Std» enthält TrainingPeaks.
3. «Was nicht passt»: liegen drei harte TrainingPeaks-Tage hintereinander, steht die Warnung da.
4. Heute › «Jetzt dran»: die ersetzte Velo-Einheit steht nicht mehr offen.
