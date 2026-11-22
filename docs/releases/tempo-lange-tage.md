# Lange Tage dauern länger

PR folgt · 21.11.2026 · Auftrag: Noah «1a 2b 3a 4a 5a», Vorschlag S1 «Tempo genauer»; auf Nachfrage am 21.11.2026 gewählt: «Nur Ermüdung ergänzen» (Tempo je Velo und Untergrund gibt es schon).

## Was ist neu
- Die Schätzung der Fahrzeit für eine Route (Plan › Route) rechnet bei einem **langen Tag** (ab 80 km am Tag) mit, wie viel länger deine langen Fahrten gedauert haben als deine kürzeren. Beispiel: Lange Fahrten dauerten bei dir etwa 20 % länger, dann steht in den Stunden diese 20 % drin.
- Unter dem Tempo-Satz steht dann eine Zeile, die das sagt und aus wie vielen langen Fahrten es kommt.
- Gerechnet wird mit dem Standardmass (16 km/h, 600 m Anstieg pro Stunde): jede Fahrt wird damit verglichen, dann die mittlere lange mit der mittleren kürzeren. Hügel zählen so nicht als Müdigkeit.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- **Keine Datenänderung:** der Wert wird nur aus den vorhandenen Fahrten gerechnet und nirgends gespeichert; darum keine Einzelfreigabe für das Speicherformat nötig.
- Erst ab **3 langen** (ab 80 km) und **5 kürzeren** Fahrten, nur wenn der Unterschied mindestens 5 % ist, höchstens 40 % (wir glauben mehr nicht).
- Gilt für alle Velos zusammen (Müdigkeit ist persönlich); wer «Zurück zur Standardregel» gewählt hat, bekommt sie nicht.
- Nur im Tourplaner (Fahrzeit-Vorschlag). Die Etappen-Zeiten in «Unterwegs» bleiben wie sie sind; «zweite Tageshälfte langsamer» innerhalb einer Fahrt braucht Daten pro Fahrthälfte und wäre eine eigene Frage.
- Die Fahrzeit bleibt ein Vorschlag (Knopf «… als Fahrzeit übernehmen»), nichts wird ohne Tipp gesetzt.
- Kein neuer Eintrag in `features.js`: es ist eine Verfeinerung von «Eigenes Tempo». Dessen Zeile in `docs/app-stand.md` bekommt einen Satz.

## Entscheide (für decisions.md)
- 21.11.2026: S1 wird auf «Ermüdung» verkleinert (Noah, Karte «a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Klügere App: S3 gebaut, S5 gebaut, S1 gebaut (PR offen), danach S6, S4.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Öffne eine Tour mit GPX-Route ab 80 km am Tag, Plan › Route (nach mindestens 3 langen und 5 kürzeren Fahrten): unter dem Tempo-Satz steht «Ein langer Tag: …».
2. Wechsle zu einer kurzen Route: die Zeile fehlt und die Stunden sind wie vorher.
