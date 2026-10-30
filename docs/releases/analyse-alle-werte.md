# Alle Fitbit-Werte in der Analyse

PR #<offen> · 27.10.2026 · Auftrag: Noah «alle holen, zumindest optional anzeigen … mit Opus 5.5» (Thread «Umsetzen Analyse-Tool mit allen Werten»)

## Was ist neu
- Der Server holt bei Google Health zusätzlich (geprüft im Discovery-Dokument v4, gleiche Berechtigungen wie bisher, keine Kosten): VO₂max (`daily-vo2-max`, mit Cardio-Fitness-Stufe), Distanz der Uhr (`distance`), Stockwerke (`floors`), Höhenmeter der Uhr (`altitude`), Gewicht und Körperfett (`weight`, `body-fat`, alle Quellen), tiefster und mittlerer Puls am Tag (`heart-rate`), Minuten pro Pulszone (`time-in-heart-rate-zone`), Minuten pro Aktivitätsstufe (`activity-level`: sitzend, leicht, mittel, sehr aktiv), die Fitbit-Trainings (`exercise`), pro Stunde Schritte und Puls (`rollUp` mit 1 Stunde).
- Jeder neue Wert ist freiwillig: gibt Google ihn nicht, fehlt nur er, die alten Werte kommen trotzdem.
- Die App speichert die neuen Werte im Fitbit-Tag (`healthDays`, keine neue Tabelle, kein neues Datenbank-Schema). Der nächste Abruf holt einmal die letzten 90 Tage neu.
- Auswerten › Analyse zeigt die neuen Werte als Kacheln (Herz, Bewegung, Körper). «Puls über den Tag» und «Stündliche Aktivität» zeigen im kleinen Bild die Stunden des Tages.
- Neuer Schalter **«Auch Werte ohne Daten»**: zeigt jeden Wert, auch ohne Daten, gestrichelt. Dazu Platzhalter für Werte, die Google oder Garmin nicht herausgeben (Schlafindex, Unruhe, Cardio-Belastung, Tagesform; Garmin-Trainingszustand, Trainingseffekt, VO₂max, Laktatschwelle, HFV-Stress, Radfahrvermögen).

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Neue Kacheln sind noch nicht antippbar; die Detailseite je Wert (Mockup M6) kommt im nächsten PR für alle Werte.
- Gewicht von Fitbit steht als eigene Kachel neben deinem selbst eingetragenen Gewicht (nichts wird überschrieben).
- «Stündliche Aktivität» wie bei Fitbit: Stunden zwischen 9 und 21 Uhr mit mindestens 250 Schritten.
- Der Schalter «Auch Werte ohne Daten» ist zu Beginn aus und bleibt gespeichert.

## Entscheide (für decisions.md)
- 27.10.2026: Alle Werte holen, die Google Health frei gibt; nicht freie Werte als Platzhalter, später eigene Rechnung (4a).

## Stand im Plan (roadmap.md / vorhaben.md)
- Analyse-Tool: neue Google-Werte geholt. Nächste PRs: Detail je Wert (M6), Eigenes Diagramm (D1–D6), Aktiv-Überblick (M2), Ebenen und Vergleiche (M3), Muster und Rekorde (M4), eigene Rechnungen, Filter und gespeicherte Ansichten.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Fitbit › «Jetzt holen» tippen und warten.
2. Auswerten › Analyse: unter Herz «VO₂max (Cardio-Fitness)» und «Puls über den Tag», unter Bewegung «Distanz (Uhr)», «Stockwerke», «Stündliche Aktivität».
3. Oben «Auch Werte ohne Daten» tippen: gestrichelte Kacheln, auch Garmin-Platzhalter.
4. Nach dem Merge: Vercel «packgen» READY prüfen (api/ geändert).
