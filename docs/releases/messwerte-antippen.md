# Eigene Messwerte: Kurve zum Antippen

PR #1044 · 07.11.2026 · Auftrag: Noah «fortfahren» (Thread «Diagramme klickbar machen»), PR 8 von 8+, Aktiv: Sportseiten

## Was ist neu
- Die Kurve eines eigenen Messwerts auf einer Sportseite (`MeasureCard`: Beinpresse, Saunagänge, Pace …) läuft über den gemeinsamen `LineChart`: Achse mit runden Stufen (bei Pace in Minuten:Sekunden), die Zahl an jedem Punkt, genauer Wert mit Tag beim Zeigen oder mit den Pfeiltasten, Tippen öffnet ein Fenster (Wert, Sätze × Wiederholungen, Bestwert), «Als Tabelle».
- Gezeigt werden die letzten 24 Werte, älteste links; «Alle N Werte» darunter bleibt.

## Was fällt weg oder rutscht tiefer
- Die Kurve markierte den Bestwert mit einem orangen Punkt und drehte die Pace-Kurve um, damit oben immer «besser» war. Beides fällt weg: der Bestwert steht weiter in der Zeile «Bestwert» und im Tipp-Fenster, die Achse ist jetzt immer von klein nach gross beschriftet.

## Selbst entschieden
- Die Werte stehen in gleichen Abständen (wie bisher), nicht nach Datum verteilt.
- `AzmWeek` (Aktivzonenminuten) bleibt in OPEN: auf Aktiv wird nur die Kachel mit Ring und einer Zahl pro Tag gezeigt, die breite Karte mit Balken wird nirgends benutzt. Die Zahlen stehen schon da; ob die Kachel ein Diagramm sein soll, kommt mit den Heute-Kacheln.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Diagramme klickbar: PR 8 (Sportseiten, eigene Messwerte). Offen: weitere Aktiv-Seiten (Rest, Wohl, MedPatterns, MedReview, TrainingWeek, Garmin), Heute-Kacheln, Rückblick/Unterwegs/Rennen/Ski.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Eine Sportseite öffnen (zum Beispiel Gym) und unter «Dein Fortschritt» einen Messwert mit zwei oder mehr Werten haben.
2. Auf einen Punkt der Kurve zeigen: Tag und genauer Wert stehen darüber.
3. Einen Punkt antippen und «Als Tabelle» antippen.
