# Fokus auf Intervalle oder Kraft für eine Woche

PR #1795 · 26.11.2026 · Auftrag: Noah «3a» (Thread «Wochenplan-Vorschläge verlässlich machen»)

## Was ist neu
- Training › Wochenplan, Karte «Diese Woche»: zwei neue Schalter neben «Leichtere Woche», «Härtere Woche», «Skitour-Woche» und «Regenwoche»: «Fokus Intervalle» und «Fokus Kraft».
- Fokus Intervalle: zwei Velo-Einheiten tragen das Wort «Intervalle», an Tagen, die nicht aufeinander folgen und nicht neben einem harten Tag liegen. Hat der Plan weniger als zwei Velo-Einheiten, kommen Velo-Einheiten drinnen dazu.
- Fokus Kraft: die Woche hat drei Gym-Einheiten, das Velo bleibt locker, keine Intervalle.
- Mit TrainingPeaks oder einem Trainingsplan in der Woche: bringen sie die Velo-Einheiten, ergänzt «Fokus Intervalle» keine eigenen und nimmt nichts weg; die Zeile sagt es. «Fokus Kraft» fügt ein Gym nur dazu, wenn kleine Einheiten Platz machen; sonst steht «kein Platz für mehr Gym-Einheiten» und nichts ändert sich.
- Die Stunden bleiben: kleine Einheiten (Laufen drinnen, Mini-Workout, Velo drinnen, Laufen draussen) machen Platz, und «Was der Plan selbst angepasst hat» sagt welche. Feste Tage und Tennis, Yoga, Eishockey bleiben.
- Eine Woche hat höchstens einen Fokus; in einer Skitour-Woche gilt er nicht, und eine Zeile unter den Schaltern sagt es. Jeder Tipp hat «Rückgängig»; die nächste Woche hat eigene Schalter. Die Wahl liegt in `training.weeklog` unter `mode` (neue Schlüssel `hit` und `kraft`), alte Sicherungen laden unverändert.
- Planer: `focusOf` und der Fokus-Block in `planWeek` (`src/lib/training/wochenplan.js`); auch Heute («Jetzt dran»), Geschafft und Mein Trainingsplan lesen die Woche über `weekFor` und sehen den Fokus.

## Warum
Mit dem Wochenplan als einzigem Vorschlag («Woche vorschlagen», Noah «3a») fehlte der Fokus Intervalle/Kraft des älteren Vorschlags. Noah wollte ihn als eigene Wochen-Art zurück.

## Was fällt weg oder rutscht tiefer
nichts. Die Zeile «Stell die Woche auf …» unter den Schaltern nennt die neuen Arten mit.

## Selbst entschieden
- Die Reihe in Training › Woche («Leichter», «Härter», «Regenwoche», «Skitour-Woche») bleibt wie sie ist; die neuen Schalter stehen nur im Wochenplan, sonst wäre die Reihe auf dem Handy zu lang. Die Wahl gilt dort trotzdem (gleiche Einstellung).
- Zwei Intervall-Einheiten, nicht drei, und mindestens ein Tag dazwischen (sonst zwei harte Tage in Folge).
- Kraft: drei Gym-Einheiten (der Plan hat meist zwei), nicht vier.
- Ausdauer und Erholung bekommen keinen Schalter (normale und Leichtere Woche decken sie).
- Kein Schema, kein `api/`.

## Entscheide (eigene Datei `docs/decisions/wochenplan-fokus.md`)
- Siehe dort: Fokus als Wochen-Art, ein Fokus pro Woche, Stunden bleiben.

## Stand im Plan (roadmap.md / vorhaben.md)
- «Wochenplan-Vorschläge verlässlich machen»: Fokus Intervalle/Kraft erledigt. Offen: das Ziel «Meine Wochenziele» (zum Beispiel 10 Std.) und das Ziel des Wochenplans (zum Beispiel 15 Std.) sind zwei getrennte Ziele.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Training › Wochenplan, «Diese Woche»: «Fokus Intervalle» tippen; zwei Velo-Einheiten tragen «Intervalle», eine Zeile sagt, was Platz gemacht hat.
2. «Fokus Kraft» tippen: die Intervalle sind weg, die Woche hat drei Gym-Einheiten; «Rückgängig» bringt den Stand davor.
