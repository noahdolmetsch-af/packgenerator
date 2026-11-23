# «Diese Woche» für alle Sportarten

Auftrag: Noah «1a 2a 3a 4a 5a» (22.11.2026, Thread «Alle Sportarten und Erholung»), Schritt E. Noah 23.11.2026: «zu viele PRs», darum nur dieser eine kleine PR für E; Analyse, Eigenes Diagramm und Statistik bleiben offen.

## Was ist neu
- Heute › «Diese Woche»: eine Strava-Sportart ohne Haken (zum Beispiel Laufen) ist jetzt ein Punkt mit Namen und zählt den Tag als aktiv. Vorher fehlte sie, weil die Karte nur Haken und Fahrten las (`stravaOthers` in `src/lib/flow/tickfokus.js`).
- Auswerten › «Im Fokus»: die Zahl der Einheiten einer abgehakten Sportart ist kleiner, damit «2 Sitzungen» am Handy und am Computer nicht abgeschnitten wird (aufgefallen auf den Bildern von PR 1499).

## Schritt E: was ich geprüft habe
| Seite | Zählt aus | Ergebnis |
|---|---|---|
| Heute › Deine Woche | gemeinsame Rechnung (Schritt A) | schon gleich |
| Heute › Diese Woche | Haken + Fahrtenliste | Strava-Sportarten ohne Haken fehlten: jetzt dabei |
| Heute › Velo im Monat | dieselbe Fahrtenliste wie die Wochenrechnung | schon gleich, nichts zu tun |
| Jahresziel, Sportjahr | gemeinsame Einheiten-Liste | schon gleich |
| Wochenziele, Aktiv-Ringe | Haken von Aktiv (Strava-Haken kommen über «Strava abhaken») | so gewollt: Ziele zählen, was du abhakst; nicht geändert |
| Analyse, Eigenes Diagramm, Aktiv › Statistik | eigene Messwerte (Strava, Fitbit) | nicht umgestellt; bleibt offen |
| Tagebuch, Chronik | zeigen Einträge, zählen nicht | nichts zu tun |

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Eine Wanderung oder ein Spaziergang aus Strava gehört in der App zu «Spazieren» (Ring Ruhe) und zählt darum wie bisher nicht als Bewegung, weder im Sportjahr noch in «Diese Woche». Das habe ich nicht geändert.
- Strava-Fahrten bleiben bei den Fahrten (eine Liste, jede einmal); ein Strava-Haken, der eine Aktivität schon verknüpft, zählt einmal.
- Nur Lesen: kein Datenformat, kein Backup, keine Synchronisation, kein `api/`.

## Entscheide
- Eigene Datei `docs/decisions/diese-woche-alle-sportarten.md`.

## Stand im Plan (roadmap.md / vorhaben.md)
- «Alle Sportarten und Erholung»: D und E fertig; offen bleiben nur Analyse, Eigenes Diagramm und Aktiv › Statistik (eigene Messwerte).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute › «Diese Woche»: ein Tag mit einem Strava-Lauf ohne Haken zeigt einen Punkt und «Laufen», die Zeile darüber zählt ihn als aktiven Tag.
2. Auswerten › «Im Fokus»: die Karte einer abgehakten Sportart zeigt «2 Sitzungen» ganz, daneben die Zeit.
