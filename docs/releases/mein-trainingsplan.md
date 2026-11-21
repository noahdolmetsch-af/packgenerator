# Mein Trainingsplan: Plan und Gemachtes auf einer Seite

21.11.2026 · Auftrag: Noah «ich möchte alle entwürfe 1-3 umsetzen» (Thread «Jede Sportart durchgehen», Umsetzungsauftrag S6, Entwurf 3)

## Was ist neu
- Neue Seite **Mein Trainingsplan** (`#/flow/trainingsplan`), erreichbar auf Aktiv unter «Diese Woche» (neuer Link neben «Wochenplan») und als Unterseite von Training.
- Karte **Ziel**: Name und Tag des Ziels (`training.goal`), «noch N Wochen» (ruhiger Satz, wenn der Zieltag vorbei ist), woher der Plan kommt, «Plan ändern» und «Ziel ändern/setzen». Darunter vier Zahlen: Kalenderwoche, Stunden gemacht von geplant, Einheiten gemacht von allen, Anteil der Plan-Stunden bis heute.
- **Stunden pro Woche**: 4 Wochen zurück, diese Woche und 3 voraus; Balken = gemacht, Linie = Plan; Tipp auf einen Balken öffnet diese Woche Einheit für Einheit; «Als Tabelle».
- **Diese Woche**: jede Einheit mit Tag, Name, Quelle (Wochenplan oder Meine Woche), Zeit und Stand (gemacht, geplant, offen, losgelassen). Ein Tipp öffnet den Wochenplan, dort ändert man den Tag.
- **Plan gegen Ist, letzte 4 Wochen**: geplant, gemacht, Prozent. Unter 85 % ist nur die Farbe anders, kein Alarm, keine Note.
- Die Seite liest nur: `training.weekplan`, `training.weeklog` (vergangene Wochen aus den eingefrorenen Wochen), `training.plan` und `training.goal`. Sie schreibt nichts und ersetzt nichts. TrainingPeaks kommt später als weitere Quelle.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- **Abweichung vom Entwurf (m3):** «Phase» (Aufbau, Spitze, Erholung) und «Woche 47 von 9» fehlen, weil die App keine Phasen kennt (das Ziel hat nur Name und Tag). Die Kachel heisst dafür «Woche 41 / Kalenderwoche»; der Hintergrund hinter den Balken fehlt. Die Linie ist durchgehend, nicht ein Strich pro Woche.
- Als «gemacht» zählt bei Einheiten des Wochenplans der Haken (die geplante Dauer zählt), bei Einheiten aus «Meine Woche» die Strava-Aktivität des Tages (ihre gemessene Dauer) oder «Gemacht» von Hand.
- In die Stunden zählen keine kleinen Gewohnheiten (Meditation, Dehnen), kein Ruheblock und keine losgelassenen Einheiten; sie stehen aber in der Liste.
- Vergangene Wochen stehen nur dann im Vergleich, wenn der Wochenplan sie schon einmal gesehen und eingefroren hat; vorher gibt es keinen Plan zum Vergleichen.
- Fertig-Regel: (1) `f.meinplan` in `features.js` mit So geht's und Beispiel, (2) Absprung: Link unter «Diese Woche» auf Aktiv, (3) «Gut zu wissen»: nicht gebaut, die Seite steht nicht in `ON_PAGES`, (4) leerer Zustand: «Noch kein Plan» mit Weg zum Wochenplan, (5) nächster Schritt: «Plan ändern» und «Ziel ändern» in der ersten Karte, (6) Zeile im App-Stand.
- Namen: «Mein Trainingsplan» in `docs/namen.md` Nr. 29 (Name aus dem Entwurf; «Trainingspläne» bleibt der Ort mit den Beispielplänen).

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Sportjahr-Auftrag: S6 gebaut (unabhängig von S1 bis S5). Danach S8 Zusammenführen, S5, S9 bis S13.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Aktiv › «Diese Woche» › «Mein Trainingsplan» antippen: oben stehen Ziel, Woche, Stunden und Einheiten.
2. Im Diagramm einen Balken antippen: diese Woche Einheit für Einheit.
3. Unter «Diese Woche» eine Einheit antippen: der Wochenplan öffnet sich, dort lässt sich der Tag ändern.
