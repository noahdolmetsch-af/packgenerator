# Gemeinsame Einheiten lesen

PR #1311 · 21.11.2026 · Auftrag: Noah «1 a dann b, 2b, 3a, 4a, 5a» (Thread «Jede Sportart durchgehen», Umsetzungsauftrag S2)

## Was ist neu
- Nichts Sichtbares. Eine reine Lese-Funktion (`src/lib/flow/einheiten.js`, mit Tests) bringt die Haken von Aktiv (`flowLog`) und die Strava-Aktivitäten (`db.activities`) in **eine** Liste mit denselben Feldern: Tag, Sportart, Minuten, Quelle, optional Strecke, Höhe, Puls.
- Ein Strava-Haken und seine Aktivität zählen einmal (über `stravaId`); Zahlen wie Strecke und Puls kommen von der Aktivität.
- Minuten sind «gemessen» (Strava, Stoppuhr, eingetragen) oder «ca.» (die übliche Dauer der Sportart aus S1, Standard 60 Min). Die Schätzung wird nur beim Lesen gerechnet, nie gespeichert.
- Strava-Sportarten ohne Aktivität (Wandern, Langlauf, Schwimmen …) stehen als eigene Einheiten in der Liste, damit sie in der Auswertung nicht fehlen.

## Was fällt weg oder rutscht tiefer
- nichts (der PR ändert keine Anzeige und keine Daten)

## Selbst entschieden
- Ein Hand-Haken derselben Aktivität am selben Tag wie eine Strava-Aktivität ohne eigenen Haken gilt als **dieselbe Einheit** (wie bei «schon abgehakt» in `planTicks`); der Haken behält seine Quelle und seine eigenen Minuten, sonst bekommt er die Zeit und Zahlen von Strava. Eine zweite Fahrt am selben Tag ist eine eigene Einheit.
- Gezählte Mengen (Liegestütze: `perTap` über 1) und der Arbeitsweg bekommen **keine** Schätzung (60 Min Liegestütze wären Unsinn); sie haben `min: null`.
- Fitbit-Datei: Fitbit liefert nur Tageswerte, keine einzelnen Einheiten; es gibt nichts zu lesen. TrainingPeaks kommt später als Quelle `src: 'tp'` (ist in `quelleOf` vorbereitet, noch kein Lesen).
- Das Gefühl (`feel`) wird nur durchgereicht, sobald «Training erfassen» es speichert.
- Fertig-Regel: reine Lese-Funktion ohne Seite; Seite, Absprung, Leerzustand und nächster Schritt kommen mit S3 (Sportjahr). Zeile im App-Stand ergänzt.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Sportjahr: S2 gebaut (hängt an S1); S3 (Seite «Sportjahr») folgt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Nichts zu sehen. Die Tests (`tests/einheiten.test.js`) prüfen die Regeln; sichtbar wird es mit dem Sportjahr (S3).
