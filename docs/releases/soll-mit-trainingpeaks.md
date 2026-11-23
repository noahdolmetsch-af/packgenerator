# Dein Stundenziel hält mit TrainingPeaks

PR #<Nummer> · 23.11.2026 · Auftrag: Noah «2a und b» (Thread «Wochenplan-Vorschläge verlässlich machen»), Schritt 3 von 6

## Was ist neu
- 2a: Das Ziel pro Woche gilt für alles. TrainingPeaks und Spieltermine zählen voll mit; ist die Woche darüber, lässt der Plan zuerst das Unwichtigste weg: Mini-Workout, Laufen drinnen, das zweite Gym, Laufen draussen, Velo. Tennis, Yoga, Eishockey, das erste Gym und die Sauna bleiben. In einer Skitour-Woche gilt das nicht (die Tour ist der Plan). `fitToHours` in `src/lib/training/wochenplan.js`.
- Unter den Stunden steht, was weggelassen wurde («Um nahe an deinen 15 Std. zu bleiben, fällt diese Woche 1 × «Mini-Workout» weg») und, wenn es trotzdem nicht reicht, wie viel die Woche noch darüber liegt.
- 2b: Neues Feld «Ziel in Wochen mit TrainingPeaks» (Plus und Minus, «Wie das Ziel oben») stellt für solche Wochen ein eigenes Ziel ein. Es erscheint, sobald TrainingPeaks-Einheiten oder ein Spielerplus-Kalender da sind.

## Warum
Befund vom 23.11.2026: Das Ziel von 15 Std. hielt mit TrainingPeaks nicht (Beispiel 19,5 Std., mit Noahs 9 bis 11 Std. TrainingPeaks etwa 21 bis 23 Std.), weil TrainingPeaks nur die zwei Velo-Einheiten ersetzte. Der Hinweis «über dem Soll» kam nur, wenn TrainingPeaks allein mehr als 15 Std. hatte.

## Wichtig
Mit 9 Std. TrainingPeaks bleibt die Woche auch nach dem Weglassen bei etwa 19 Std., weil Tennis, Eishockey, Yoga, Gym und Sauna zusammen schon rund 7 Std. sind. Das Ziel von 15 Std. lässt sich dann nicht halten. Dafür gibt es 2b: ein eigenes Ziel für solche Wochen (zum Beispiel 20 Std.).

## Was fällt weg oder rutscht tiefer
- In Wochen mit viel TrainingPeaks fehlen Mini-Workout, Laufen drinnen, das zweite Gym und weitere Einheiten, die der Plan früher dazusetzte. Zurück: «Ziel in Wochen mit TrainingPeaks» höher stellen.
- Der Hinweis «Mit TrainingPeaks liegt die Woche über deinen Std. Nichts wird weggenommen» kommt nur noch, wenn der Plan nichts weggelassen hat.

## Daten (Prüfung mit Kopie)
- Kein Dexie-Schema, kein `api/`. Neu ist ein optionales Feld `tpHours` im bestehenden Ziel `training.weekplan` (je Jahreszeit). Ohne das Feld gilt das Ziel oben; alte Sicherungen laden unverändert (Test `configOf`).

## Selbst entschieden
- Weggelassen wird nie unter einen Boden: Tennis, Yoga, Eishockey, erstes Gym, Sauna und Ruheblock bleiben.
- Eine Einheit fällt nur weg, wenn die Woche um mehr als die halbe Einheit darüber liegt.
- Leichte und härtere Woche rechnen das eigene Ziel im gleichen Verhältnis.

## Entscheide (eigene Datei `docs/decisions/soll-mit-trainingpeaks.md`)
- 23.11.2026: Das Ziel gilt für alles, dazu ein eigenes Ziel für Wochen mit TrainingPeaks (Noah «2a und b»).

## Stand im Plan (roadmap.md / vorhaben.md)
- «Wochenplan-Vorschläge verlässlich machen»: Schritt 3 von 6.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Training › Wochenplan, diese Woche: unter den Stunden steht, was für dein Ziel wegfällt.
2. Unter «Ziel pro Woche» das «Ziel in Wochen mit TrainingPeaks» höher stellen: die Einheiten kommen zurück. «Wie das Ziel oben» nimmt es weg.
