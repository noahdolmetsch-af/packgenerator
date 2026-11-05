# Eigene Wochenziele

PR folgt · 05.11.2026 · Auftrag: Noah «4a und b» (Thread «Ideen für alle Bereiche der App», Idee Aktiv 4b «Eigene Ziele pro Woche»)

## Was ist neu
- Auf Aktiv, zwischen «Diese Woche» und den Ringen, steht die Karte «Meine Wochenziele»: ein paar eigene Ziele für die Kalenderwoche Montag bis Sonntag, je mit Balken und «x von y» (zum Beispiel «1× von 2×» Meditation, «105 km von 150 km» Velo).
- Es gibt zwei Arten: **Velo-Kilometer** (alle Fahrten wie auf Heute: Strava, hochgeladene Fahrten, eigene Aufzeichnungen) und **eine Sportart** (Anzahl der Haken, bei Sportarten mit «pro Tipp» die Menge). Beides zählt von Montag bis heute.
- Am Anfang ist die Karte leer und sagt warum; Vorschläge zum Antippen: 2× Meditation, 150 km, 3× Stretching. Eigenes Ziel: «Wochenziel hinzufügen», was und wie viel.
- «Ändern»: Zahl ändern, mit Pfeilen oder Ziehen ordnen, löschen (fragt in der App, dann «Rückgängig»). Gelöscht wird nur das Ziel, Haken und Fahrten bleiben.
- Sind alle Ziele erreicht, sagt die Karte es und führt zum Wochenrückblick. Sonst steht da, wie viele Tage die Woche noch hat.
- Gespeichert als Einstellung `flow.weekGoals` (kommt in die Sicherung und in den Abgleich). Code: `src/lib/flow/weekgoals.js` (Regeln, rein), `src/lib/flow/WeekGoals.svelte`.
- Neue Funktion im Katalog: «Meine Wochenziele» (`f.weekgoals`, Ort Aktiv `#/flow`).

## Was fällt weg oder rutscht tiefer
- nichts. Die Ringe zählen weiter «letzte 7 Tage gegen die Ziele der Sportarten»; die Wochenziele sind eigene, getrennte Ziele für die Kalenderwoche. Ein Satz auf der Karte und im Handbuch sagt das.

## Selbst entschieden
- Nur zwei Arten (Kilometer und Sportart). Höhenmeter und Minuten könnten folgen, wenn du sie willst.
- Karte auf Aktiv neben «Diese Woche» (dort fällt der Blick auf die Woche), nicht auf Heute.
- Keine Vorgabe: am Anfang ist die Liste leer; nichts wird ungefragt gesetzt.
- Höchstens 12 Ziele, jede Art nur einmal (ein Kilometer-Ziel, ein Ziel je Sportart).
- Ist eine Sportart gelöscht, bleibt das Ziel mit dem Hinweis «Diese Sportart gibt es nicht mehr»; ändern oder löschen bleibt möglich.
- Fertig-Regel: Seite (Katalog, Handbuch, Beispiel), Absprung (Aktiv selbst), «Gut zu wissen» (`wissen/koerper.js`), leerer Zustand, nächster Schritt (Wochenrückblick bei «alle erreicht»), Zeile in `docs/app-stand.md`: alle sechs sind da.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Ideen für alle Bereiche (05.11.): Aktiv 4b gebaut (4a Ruhetag-Hinweis ist ein eigener PR).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Aktiv öffnen: «Meine Wochenziele» steht neben «Diese Woche». Tippe «Meditation · 2×» und «Velo-km · 150 km».
2. Haken eine Sportart mit Ziel ab: der Balken füllt sich. Eine Fahrt von heute zählt zu den Kilometern.
3. «Ändern»: Zahl ändern, ein Ziel mit Pfeil nach oben schieben, ein Ziel löschen und «Rückgängig» tippen.
4. «Wochenziel hinzufügen»: eine Sportart und eine Zahl wählen, «Hinzufügen».
