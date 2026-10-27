# Eine Serie

PR #352 · 27.10.2026 · Auftrag: Noah 26.10.2026 20:31 «1a» alle B-Fehler aus dem UI-Test 0.205 (Thread «Testen komplette App mit Fehlerliste»)

## Was ist neu
- Die Serie über alles wird an einer Stelle gelesen (`readSeries` in src/lib/home/series-data.js): Jahreszeile, Kachel «Serie und Meilensteine», Seite Meilensteine und der Meilenstein-Check auf Heute zählen gleich, mit denselben Fahrten wie «Diese Woche» (Fahrtenbuch, gezählte Strava-Fahrten, Strava-Velofahrten).
- Eine leere Woche zeigt «Noch nichts eingetragen» statt «0 Tage aktiv» und, wenn vorhanden, «Fitbit hat {n} Aktivzonen-Minuten gemessen». Kein Schema-Wechsel.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Die Serie zählt Strava-Velofahrten wie «Diese Woche».
- Die Jahreszeile zeigt die Serie erst, wenn sie gerechnet ist (kein kurzes «0»).
- Fitbit-Minuten machen eine Woche nicht aktiv, sie stehen nur als Hinweis (Gesundheitsdaten nur beobachten).

## Entscheide (für decisions.md)
- 27.10.2026: Eine Serie (UI-Test 0.205 T4), Noah «1a» alle B-Fehler.

## Stand im Plan (roadmap.md / vorhaben.md)
- UI-Test 0.205 (Ziel Alltag): T4 erledigt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute, «Diese Woche»: Ist nichts eingetragen, steht «Noch nichts eingetragen» und was Fitbit gemessen hat.
2. Auswerten › Meilensteine: «Serie über alles» zeigt dieselbe Zahl wie die Kachel auf Heute.
