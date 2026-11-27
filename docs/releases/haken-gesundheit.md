# Haken-Analysen: Was Bewegung mit dir macht, Garmin gegen Fitbit

PR #1842 · 27.11.2026 · Auftrag: Noah «1a 2a 3a 4a 5a» (Thread «Abhaken auf einen Blick verbessern», Haken-Analysen an einem Ort, Paket B von drei)

## Was ist neu
- Auswerten › Woche hat unter dem Wochenpensum die Karte «Was Bewegung mit dir macht»: die Aktivzonen-Minuten jeder Woche als Balken, darunter Ruhepuls, HRV oder Schlaf derselben Woche als Linie (Chips), und ein Satz, wie die Woche danach nach Wochen mit mehr Aktivzonen-Minuten aussah («ein Muster, keine Ursache»).
- Darunter, wo dieselbe Einheit von Garmin und Fitbit aufgezeichnet wurde: die mittleren Pulse nebeneinander, das Mittel des Unterschieds und die letzten fünf Einheiten. Garmin ist die Aufzeichnung, die zählt.
- Der Zeitraum-Schalter oben gilt auch für diese Karte.

## Was fällt weg oder rutscht tiefer
- nichts. «Was auffällt» und der Bericht der Woche rutschen eine Karte tiefer.

## Selbst entschieden
- Fertig-Regel: kein neuer Eintrag in `features.js` (Teil der Seite Auswerten › Woche); leerer Zustand steht in der Karte und führt zu den Verbindungen (Fitbit); «Gut zu wissen» entfällt.
- Zwei Diagramme (Balken und Linie) mit derselben Wochen-Achse statt eines Diagramms mit zwei Achsen.
- Schwellen für den Satz (20 Wochen, Unterschied und Korrelation mindestens 0,2) stehen oben in `src/lib/flow/hakengesundheit.js`.
- Die Puls-Gegenüberstellung zeigt nur Einheiten, die ein Garmin-Gerät über Strava aufgezeichnet hat; sie verändert nichts und wählt nichts (die Wahl «Garmin zählt» macht `flow/dieselbe.js`).

## Entscheide (eigene Datei `docs/decisions/haken-gesundheit.md`)
- 27.11.2026: 4a und «Garmin gewinnt bei doppelten Aktivitäten».

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung (Paket B von drei; C Aufräumen folgt).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auswerten › Woche öffnen: unter dem Wochenpensum steht «Was Bewegung mit dir macht» mit Balken und Linie.
2. Auf «HRV» und «Schlaf» tippen: die Linie wechselt, der Satz darunter ebenfalls.
3. Weiter unten «Garmin gegen Fitbit» (nur wenn es doppelte Aufzeichnungen gibt): zwei Zahlen je Einheit und der Unterschied.
