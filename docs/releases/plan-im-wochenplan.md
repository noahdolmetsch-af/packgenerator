# Dein Trainingsplan im Wochenplan

PR #<Nummer> · 24.11.2026 · Auftrag: Noah «5a» (Thread «Wochenplan-Vorschläge verlässlich machen»), Schritt 6 von 6

## Was ist neu
- Die Einheiten eines Trainingsplans in Gebrauch (Training › Trainingspläne, gespeichert als `src: 'tpl:<id>'` in `training.plan`) stehen im Wochenplan fest an ihrem Tag und zählen auf die Wochenstunden, genau wie die aus TrainingPeaks (`tpWeek` in `src/lib/training/wochenplan.js`). Der Planer lässt so viele eigene Einheiten der gleichen Sportart weg, wie der Plan deckt.
- Eigene Hinweise unter den Stunden: «Dein Trainingsplan bringt … Std.», «Ersetzt durch deinen Trainingsplan: …», «Dein Trainingsplan allein liegt über deinen … Std.». Kommen TrainingPeaks und Plan zusammen, behält TrainingPeaks seine Worte.

## Warum
Befund vom 23.11.2026: Der Trainingsplan «Ultra» (92 Velo-Einheiten ab 28.12.) wurde vom Wochenplan nicht erkannt; ab da stand Velo doppelt (Plan und eigene Einheiten).

## Was fällt weg oder rutscht tiefer
In Wochen mit einem Trainingsplan setzt der Wochenplan weniger eigene Einheiten (Velo, Laufen, Gym der gleichen Sportart), weil der Plan sie deckt. Zurück: den Plan aus der Woche nehmen (Training › Trainingspläne) oder das Stundenziel erhöhen.

## Selbst entschieden
- «Übernehmen» beim älteren Vorschlag ersetzt Einheiten eines Trainingsplans weiterhin (wie vorher); nur TrainingPeaks ist davor geschützt. Der Vorschlag ist mit Wochenplan nicht mehr zu sehen.
- Kein Schema, kein `api/`.

## Entscheide (eigene Datei `docs/decisions/plan-im-wochenplan.md`)
- 24.11.2026: Trainingsplan-Einheiten zählen im Wochenplan wie TrainingPeaks (Noah «5a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- «Wochenplan-Vorschläge verlässlich machen»: Schritt 6 von 6.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Training › Trainingspläne: einen Plan in die Woche nehmen.
2. Training › Wochenplan: unter den Stunden steht «Dein Trainingsplan bringt … Std.»; die Woche hat daneben keine zweite Velo-Einheit.
