# Nach der Fahrt: Höhe, Runden und Strava-Werte

PR #<Nummer> · 27.10.2026 · Auftrag: Noah «prüfe, ob wir wirklich alles so gemacht haben» (Thread «Bikepacking und Ultra-Rennen»)

## Was ist neu
- Die Aufnahme speichert die GPS-Höhe des Handys mit jedem Punkt. Eine Fahrt ohne Strecke hat darum ihre Höhenmeter (in 4-m-Schritten gegen das Zittern, wie die Live-Kachel).
- «Deine Fahrt» zeigt das Höhenprofil über Puls und Leistung, auf derselben Zeitachse. Zugesagt am 20.10.2026 («Puls und Leistung als Kurve, zusammen mit dem Höhenprofil»).
- Runden haben ihren eigenen Ø-Puls und ihre Ø-Leistung (20.10.2026 «Runden-Taste»), als Tabelle «Runden» nach der Fahrt.
- Eine Strava- oder Garmin-Fahrt zur selben Zeit ergänzt fehlende Höhenmeter, Puls und Leistung (20.10.2026 «ergänzt die App ihre Daten damit»).
- Die gespeicherte Fahrt behält Höhenprofil, Runden und die Sensorwerte, so dass der Rückblick und die Auswertung sie lesen.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Höhenmeter: zuerst aus dem Profil der Strecke, sonst aus dem GPS, sonst aus der Strava-/Garmin-Fahrt.
- Als «zur selben Zeit» gilt eine Velofahrt, die mindestens einen Drittel der Live-Fahrt überdeckt.
- Die Runden-Werte in den Datenfeldern während der Fahrt baut der Thread «Bauen Live Navigation» (Live.svelte gehört ihm).
- Strava-Werte, die erst nach dem Speichern ankommen, kommen beim Tipp auf «Rückblick» in die gespeicherte Fahrt; «Deine Fahrt» zeigt sie sofort.

## Datenspeicher
- Kein neues Dexie-Schema. Die Punkte einer Aufnahme haben neu einen 4. Wert (Höhe), ältere Punkte mit 3 Werten gehen weiter. Die Fahrt in `rides` hat neu `profile`, `laps`, `sensors` (hrAvg, hrMax, wAvg, wMax) und `twinId`.

## Stand im Plan (roadmap.md / vorhaben.md)
- Paket U (Bikepacking und Ultra-Rennen): Nachprüfung 27.10.2026, Teil 2 von 3.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Live-Karte ohne Strecke starten, ein Stück fahren, «Fahrt beenden»: Unter «Deine Fahrt» stehen Höhenmeter und das Höhenprofil.
2. Während der Fahrt «Neue Runde» tippen: Nach der Fahrt zeigt «Runden» jede Runde mit km, Zeit, Ø-Puls und Ø-Leistung (mit Sensor).
