# Aktiv: Rückblick Meditation und Training zum Antippen

PR folgt · 07.11.2026 · Auftrag: Noah «ja pr 9» (Thread «Diagramme klickbar machen»), PR 9, Aktiv-Seiten (Teil 2)

## Was ist neu
- Drei weitere Diagramme laufen über `BarChart`: «Minuten pro Woche» (mit der Ziellinie) und «Minuten pro Monat» im Meditations-Rückblick (`MedReview`), «Wann es am tiefsten geht» in den Mustern (`MedPatterns`, Farbe = Tiefe bleibt) und «Rückblick» des Trainings (`TrainingWeek`, Stunden pro Woche nach Zone, Plan als Linie).
- Achse mit runden Stufen, genaue Zahlen beim Zeigen oder mit den Pfeiltasten, Tippen öffnet ein Fenster (Woche, Monat, Stunde mit Einheiten und Tiefe, Woche mit den Stunden jeder Zone), «Als Tabelle».
- `BarChart` kann Lücken in der Linie (`null`, zum Beispiel eine Woche ohne Plan) und eigene Achsenschritte (`steps`, damit Zähler nie «0,5 Einheiten» sagen).

## Was fällt weg oder rutscht tiefer
- nichts. Ziellinie, Farbe nach Tiefe, Legende und die Zeile «Diese Woche … Std.» bleiben.

## Selbst entschieden
- Beim Wochen-Diagramm der Meditation steht nur jede zweite Wochenbeschriftung unter den Balken (auf dem Handy sonst übereinander); das Zeigen und die Tabelle nennen jede Woche.
- Bei den Stunden des Tages stehen die Beschriftungen alle 6 Stunden (vorher alle 3). Stunden ohne Tiefe sind jetzt hellgrau statt unsichtbar.
- Der Kalender des Rückblicks (Tagesfelder) bleibt, er ist kein Balkendiagramm. Offen in Aktiv: Wohl (Balance-Linie), Ruhe (Ring), Garmin-Übersicht und -Fokus, Aktivzonen-Kachel, Gewicht-Linie, Formkarte und Ringe: das sind Ringe oder kleine Kacheln, sie kommen mit den Heute-Kacheln.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Diagramme klickbar: PR 9 (Meditation, Training Rückblick). Danach Heute-Kacheln, Rückblick/Unterwegs/Rennen/Ski, Garmin.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Aktiv › Meditation › Rückblick, zu «Minuten pro Woche» scrollen und auf einen Balken zeigen: Woche, Minuten und Ziel stehen darüber.
2. Eine Woche antippen, dann «Als Tabelle» antippen.
3. Aktiv › Training, zu «Rückblick» scrollen und eine Woche antippen: die Stunden jeder Zone.
