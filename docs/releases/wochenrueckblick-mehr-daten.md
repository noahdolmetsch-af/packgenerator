# Wochenrückblick: Gewicht, Meditation, Touren, Schlafphasen

PR folgt · 02.11.2026 · Auftrag: Noah «1a 2b 3a» (Thread «Verbessern Wochenrückblick: Fehler und mehr Daten», Runde 2, PR 2 von 3)

## Was ist neu
- Kachel «Gewicht, Meditation und Touren»: letztes Gewicht der Woche (eigener Eintrag aus Ich › Gewicht, sonst Fitbit/Apple), Meditationsminuten und Sitzungen aus Aktiv, deine Touren der Woche (antippbar), jeweils gegen die gleichen Tage der Woche davor.
- Kachel «Schlafphasen»: Tiefschlaf, REM, Leichtschlaf, Wach, Mittel pro Nacht der Nächte mit Phasen (Fitbit).
- Gewicht, Meditation, Tiefschlaf und REM öffnen «Verlauf und alle Zahlen» (8 Wochen), wie die anderen Kacheln.
- Nur Daten, die die App schon hat; nichts Neues unter `api/`, kein neues Datenfeld.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Ein eigener Gewichtseintrag zählt vor dem Wert der Uhr, wenn beide am selben Tag da sind.
- «Touren» zeigt deine geplanten Touren, die die Woche berühren (ohne übersprungene und archivierte); die Fahrten aus Strava stehen schon unter «Km pro Velo».
- Eine Kachel ohne Wert in der Woche ist nicht da (nie 0).

## Entscheide (für decisions.md)
- 02.11.2026: mehr Daten im Wochenrückblick: Gewicht, Meditation, Touren der Woche, Schlafphasen (Noah «2b»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Wochenrückblick Runde 2: PR 2 von 3 (PR 3 Ältere Wochen).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Aktiv › Woche › Wochenrückblick, zu «Gewicht, Meditation und Touren» scrollen.
2. Unter «Gewicht» auf «Verlauf und alle Zahlen» tippen: 8 Wochen als Balken und Tabelle.
3. Bei «Schlafphasen» den Verlauf des Tiefschlafs öffnen (nur mit Fitbit-Phasen sichtbar).
