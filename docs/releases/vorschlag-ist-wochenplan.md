# Ein Vorschlag für die Woche: dein Wochenplan

PR #1783 · 23.11.2026 · Auftrag: Noah «3a» (Thread «Wochenplan-Vorschläge verlässlich machen»), Schritt 4 von 6

## Was ist neu
- Mit gespeichertem Wochenplan ist «Woche vorschlagen» (Training › Woche, erste Reihe) ein Link zum Wochenplan. Das ist jetzt der eine Vorschlag der Woche, mit TrainingPeaks und Spielplan (Schritte 1 und 2; das Stundenziel mit TrainingPeaks folgt als Schritt 3). Leichter, Härter, Regenwoche und Skitour-Woche bleiben als Schalter in derselben Reihe.
- Der ältere Vorschlag mit eigenen Stunden, festen Rollen (Ausdauer, Tempo, lange Fahrt) und den Wochenzielen aus Aktiv steht mit Wochenplan nicht mehr unten auf der Seite, ebenso nicht die Karte «Nächste Woche» (sie öffnete diesen Vorschlag).
- Ohne gespeicherten Wochenplan bleibt alles wie bisher.

## Warum
Befund vom 23.11.2026: zwei Planer, die nichts voneinander wussten. Der ältere ignorierte Wochenplan, TrainingPeaks und Spielplan und legte eigene Einheiten dazu: Velo doppelt, Liegestütze statt Tennis.

## Was fällt weg oder rutscht tiefer
- Mit Wochenplan: «Tage sperren», «Mal pro Woche» je Sportart, der Fokus (Ausdauer, Intervalle, Kraft, Erholung) und die gemerkten Änderungen des älteren Vorschlags sind nicht mehr zu sehen. Die gespeicherten Werte bleiben (`training.days`, `training.sportgoals`, `training.habits`), nichts wird gelöscht. Erholung entspricht der Leichteren Woche. Wer den alten Vorschlag wieder will, löscht den Wochenplan nicht: dazu sagt er «zurück» zu diesem PR.
- Ersatz für «Tage sperren»: im Wochenplan Fixtage und «Verschieben».

## Selbst entschieden
- Der Fokus Intervalle oder Kraft wird nicht nachgebaut; falls du ihn vermisst, kommt er als eigene Wochen-Art im Wochenplan (Schalter wie «Leichtere Woche»).
- Kein Schema, kein `api/`; kein gespeicherter Wert wird geändert oder gelöscht.

## Entscheide (eigene Datei `docs/decisions/vorschlag-ist-wochenplan.md`)
- 23.11.2026: ein Vorschlag, der Wochenplan (Noah «3a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- «Wochenplan-Vorschläge verlässlich machen»: Schritt 4 von 6.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Training › Woche: «Woche vorschlagen» öffnet den Wochenplan.
2. Unter «Meine Woche» steht kein zweiter Vorschlag.
