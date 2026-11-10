# Wochenplan, Teil 5: Wochenstern, Loslassen, leichtere Woche, Skitour- und Regenwoche

PR folgt · 10.11.2026 · Auftrag: Noah «freigabe … bau los» (Thread «Prüfen: Trainingsplan Woche packbar»), Reihenfolge 1 bis 5 im Umsetzungsauftrag; Namensfrage: Noah 10.11.2026 «a»

## Was ist neu
- **Wochen-Art** (Karte «Diese Woche» / «Nächste Woche»): drei Knöpfe. **Leichtere Woche** zeigt 60 % der Stunden (nur diese Woche, die Ziele bleiben). **Skitour-Woche**: die Tour nimmt Samstag (Sonntag, wenn das Eishockey am Samstag ist), der Tag davor bleibt frei; Velo, Laufen und Mini-Workout fallen weg, und die Seite sagt es («Die Skitour nimmt den Sonntag: «Tennis» fällt an diesem Tag aus.»). **Regenwoche**: Velo draussen wird Velo drinnen. Die Wahl liegt in `training.weeklog` unter `mode` (gleiche Einstellung wie Teil 3 und 4, **keine** neue Tabelle, kein neuer Schema-Stand, kein `api/`).
- **Loslassen:** bei jeder Einheit der laufenden Woche nimmt «Loslassen» sie bewusst aus der Woche (durchgestrichen, Haken gesperrt, «Wieder zählen» macht es rückgängig). Das kostet nichts.
- **Wochenstern:** sind alle Einheiten der Woche abgehakt oder losgelassen (Meditation und Dehnen zählen nicht mit), steht «Wochenstern erreicht.»; vorher sagt «Noch 2 Einheiten bis zum Wochenstern.», wie weit es ist. Die Karte «Vergangene Wochen» zeigt den Stern an der Woche. Eine Serie («3 Wochen in Folge mit Stern») steht darunter.
- **Zwei Meilensteine** (Flow › Meilensteine, Gruppe «Tag für Tag»): «Wochen mit Stern» (1, 4, 12, 26, 52) und «Sternwochen in Folge» (2, 4, 8, 12, 26). Auf Heute erscheinen sie nicht (Regel der Datenmeilensteine).
- **Anschluss:** die Karte «Eine leichtere Woche würde passen» (Aktiv, Trainingsbelastung) hat den Link «Leichtere Woche im Wochenplan».
- **Namensfrage entschieden (Noah «a»):** die Seite heisst «Wochenplan»; die älteren Texte zu «Trainingspläne › Ausprobieren» heissen jetzt «Trainingswoche» («Zur Trainingswoche», «steht in deiner Trainingswoche»). `docs/namen.md` Zeile 22 angepasst.

## Was fällt weg oder rutscht tiefer
- nichts. Die älteren Texte heissen nur anders; die Funktionen sind dieselben.

## Selbst entschieden
- **Vergleich mit dem Entwurf («Variabler Plan»):** gleich bei der Karte Wochenstern mit Zähler, bei der Serie, bei «Loslassen», bei der leichteren Woche und der Skitour- und Regenwoche als Knöpfe. Weicht ab, weil: (1) die Karten im Entwurf waren «BEISPIEL, NICHT ECHT», jetzt rechnen sie mit den echten Häkchen; (2) die Wochen-Art wird pro Woche gespeichert und gilt nicht für die Ziele; (3) die leichtere Woche ist fest 60 % der Stunden (Planer `lightOf`), ohne eigenen Regler; (4) Meditation und Dehnen zählen für den Stern nicht, damit die kleinen Gewohnheiten ihn nicht blockieren.
- **Eingefrorene Wochen:** der Stern einer vergangenen Woche richtet sich nach dem Stand, der am Sonntag gespeichert wurde; spätere Planänderungen ändern ihn nicht.
- **Leere Wochen** (nichts geplant) bekommen nie einen Stern.
- Fertig-Regel: Seite (bestehend), Absprung (Link in der Karte «Eine leichtere Woche würde passen»), «Gut zu wissen» (bestehend; «Loslassen» erklärt ein Hinweis auf der Seite selbst), leere Ansicht und nächster Schritt (bestehend; unter dem Stern zeigt ein Link zu den Meilensteinen, wie es weitergeht), app-stand (Zeile ergänzt).

## Entscheide (für decisions.md)
- Namensfrage Wochenplan / Trainingswoche: Noah «a» (10.11.2026), steht in `docs/namen.md`.

## Stand im Plan (roadmap.md / vorhaben.md)
- Variabler Wochenplan (Vorhaben 18): Teil 5 von 5 gebaut; damit ist das Vorhaben umgesetzt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Aktiv › Wochenplan: unter «Diese Woche» «Leichtere Woche» tippen: weniger Stunden, nur für diese Woche. Nochmals tippen schaltet aus.
2. Bei einer Einheit «Loslassen» tippen: sie ist durchgestrichen und zählt nicht für den Wochenstern.
3. Auf Aktiv die Karte «Eine leichtere Woche würde passen» öffnen und «Leichtere Woche im Wochenplan» tippen: der Wochenplan öffnet sich.
