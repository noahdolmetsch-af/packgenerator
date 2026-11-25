# Alte Vorschläge entfernen

PR #1783 · 24.11.2026 · Auftrag: Noah «a ★ Ja» (Thread «Wochenplan-Vorschläge verlässlich machen»), Schritt 7

## Was ist neu
- Im Wochenplan steht eine ruhige Zeile «2 alte Vorschläge aus «Woche vorschlagen» liegen noch in deiner Woche.» mit «Entfernen». Es nimmt nur Einheiten heraus, die der ältere Vorschlag gesetzt hat (`src: 'sug'`), ab heute und noch nicht abgehakt (`oldSuggestions`, `withoutOldSuggestions` in `src/lib/training/suggest.js`). Eigene Einheiten, TrainingPeaks und Trainingspläne bleiben. Danach «… entfernt» mit «Rückgängig».

## Warum
Befund mit Noahs echtem Plan: alte Vorschläge lagen noch in der Woche, die Zeile sagte «geplant 28:21 von 15:00 Std.», obwohl der Wochenplan nur 15 Std. setzt.

## Was fällt weg oder rutscht tiefer
Nichts. Die alten Einheiten gehen nur, wenn Noah «Entfernen» tippt (mit Rückgängig).

## Selbst entschieden
- Die Zeile steht im Wochenplan unter den Hinweisen zu den Stunden, nicht über dem Inhalt (Content first).
- Nach der Bildprüfung (impeccable, ohne Prüfprogramm): gleichartige Hinweise unter den Stunden sind eine Zeile mit Liste («fällt diese Woche weg: 1 × «Mini-Workout», 1 × «Gym» …», «Ersetzt durch TrainingPeaks: …») statt vier fast gleicher Absätze; bei Eishockey aus dem Spielplan fehlt das irreführende «1 fest, 0 frei».
- Stundenkarte im Wochenplan kurz und geordnet (Noah 24.11.2026: «die infos finde ich sehr relevant, aber die darstellung ist ein wenig erschetternd», Vorschlag b): unter dem Balken drei Zahlenzeilen (TrainingPeaks, Trainingsplan, Spieltermine, «Dein Plan ergänzt»), «Ersetzt durch …» und «fällt weg» als Chips, der Hinweis «über deinen Stunden» mit «20 Std. vorschlagen» direkt daneben, die langen Erklärsätze hinter «Mehr dazu». «Plan: x von y Std.» zählt jetzt die Spieltermine mit (vorher fehlten sie, der Balken war kleiner als die Woche).
- Kein Schema, kein `api/`.

## Entscheide (eigene Datei `docs/decisions/alte-vorschlaege-weg.md`)
- 24.11.2026: alte Vorschläge aus «Woche vorschlagen» mit einem Tipp entfernen, Eigenes und TrainingPeaks bleiben (Noah «a ★ Ja»).

## Stand im Plan (roadmap.md / vorhaben.md)
- «Wochenplan-Vorschläge verlässlich machen»: Schritt 7.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Training › Wochenplan: liegen noch alte Vorschläge in der Woche, sagt es eine Zeile; «Entfernen» tippen.
2. Training › Woche: die alten Vorschläge sind weg, Eigenes und TrainingPeaks bleiben; «Rückgängig» bringt sie zurück.
