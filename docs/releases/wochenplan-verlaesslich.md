# Wochenplan-Vorschläge verlässlich machen

PR #1783 · 24.11.2026 · Auftrag: Noah «1a», «2a und b», «3a», «4a», «5a», «a ★ Ja» und «Variante b» (Thread «Wochenplan-Vorschläge verlässlich machen»). Sieben Schritte desselben Wochenplans in einem PR (eine News-Datei, damit die Versionsnummer stimmt).

## Was ist neu
- Ist ein Spielerplus-Kalender der Sportart Eishockey an und wurde einmal geholt, sind seine Termine (Training und Spiel) das Eishockey der Woche. Der Wochenplan setzt keine eigene Eishockey-Einheit (bisher fix Sonntag 8:00) dazu; eine Woche ohne Termin hat keins. Unter den Stunden steht ein Satz dazu.
- Die Termine zählen für harte Tage, Überschneidungen und «Was nicht passt» wie die Einheiten des Plans; sie stehen fest. Steht ein Termin am Samstag, legt die Skitour-Woche die Tour auf den Sonntag.
- In Training › Woche tragen Termine aus Spielerplus den Namen des Teams («Testteam · Training»), nicht nur «Training».
- Ohne verbundenen Kalender bleibt alles wie bisher (Sonntag 8:00).
- Mit gespeichertem Wochenplan ist «Woche vorschlagen» (Training › Woche, erste Reihe) ein Link zum Wochenplan. Das ist jetzt der eine Vorschlag der Woche, mit TrainingPeaks und Spielplan (Schritte 1 und 2; das Stundenziel mit TrainingPeaks folgt als Schritt 3). Leichter, Härter, Regenwoche und Skitour-Woche bleiben als Schalter in derselben Reihe.
- Der ältere Vorschlag mit eigenen Stunden, festen Rollen (Ausdauer, Tempo, lange Fahrt) und den Wochenzielen aus Aktiv steht mit Wochenplan nicht mehr unten auf der Seite, ebenso nicht die Karte «Nächste Woche» (sie öffnete diesen Vorschlag).
- Ohne gespeicherten Wochenplan bleibt alles wie bisher.
- 2a: Das Ziel pro Woche gilt für alles. TrainingPeaks und Spieltermine zählen voll mit; ist die Woche darüber, lässt der Plan zuerst das Unwichtigste weg: Mini-Workout, Laufen drinnen, das zweite Gym, Laufen draussen, Velo. Tennis, Yoga, Eishockey, das erste Gym und die Sauna bleiben. In einer Skitour-Woche gilt das nicht (die Tour ist der Plan). `fitToHours` in `src/lib/training/wochenplan.js`.
- Unter den Stunden steht, was weggelassen wurde («Um nahe an deinen 15 Std. zu bleiben, fällt diese Woche 1 × «Mini-Workout» weg») und, wenn es trotzdem nicht reicht, wie viel die Woche noch darüber liegt.
- 2b: Neues Feld «Ziel in Wochen mit TrainingPeaks» (Plus und Minus, «Wie das Ziel oben») stellt für solche Wochen ein eigenes Ziel ein. Es erscheint, sobald TrainingPeaks-Einheiten oder ein Spielerplus-Kalender da sind. Solange es nicht gesetzt ist, steht dort der Knopf «20 Std. für diese Wochen vorschlagen» (das Ziel oben plus 5 Std.); ein Tipp setzt ihn, Plus und Minus ändern ihn (Noah 24.11.2026 «2b»).
- Training › Woche: die Zeile bei den Wochenpfeilen («geplant 19:20 von 15:00 Std.») zählt jetzt alles: eigene Einheiten, TrainingPeaks, die Vorschläge des Wochenplans und die Termine des Teams. Das Ziel ist das des Wochenplans; in einer Woche mit TrainingPeaks oder Teamterminen das eigene Ziel dafür (Schritt 3), sonst das Ziel pro Woche. Ohne Wochenplan zählt wie bisher «Meine Wochenziele».
- Wochenplan › Einheiten pro Woche: unter dem Namen jeder Sportart steht «Diese Woche 2 von 3», wie viele Einheiten die Woche wirklich hält. TrainingPeaks, Teamtermine und das Stundenziel können welche wegnehmen. Eishockey mit Spielerplus: «Diese Woche 1 aus dem Spielplan».
- Die Einheiten eines Trainingsplans in Gebrauch (Training › Trainingspläne, gespeichert als `src: 'tpl:<id>'` in `training.plan`) stehen im Wochenplan fest an ihrem Tag und zählen auf die Wochenstunden, genau wie die aus TrainingPeaks (`tpWeek` in `src/lib/training/wochenplan.js`). Der Planer lässt so viele eigene Einheiten der gleichen Sportart weg, wie der Plan deckt.
- Eigene Hinweise unter den Stunden: «Dein Trainingsplan bringt … Std.», «Ersetzt durch deinen Trainingsplan: …», «Dein Trainingsplan allein liegt über deinen … Std.». Kommen TrainingPeaks und Plan zusammen, behält TrainingPeaks seine Worte.
- Im Wochenplan steht eine ruhige Zeile «2 alte Vorschläge aus «Woche vorschlagen» liegen noch in deiner Woche.» mit «Entfernen». Es nimmt nur Einheiten heraus, die der ältere Vorschlag gesetzt hat (`src: 'sug'`), ab heute und noch nicht abgehakt (`oldSuggestions`, `withoutOldSuggestions` in `src/lib/training/suggest.js`). Eigene Einheiten, TrainingPeaks und Trainingspläne bleiben. Danach «… entfernt» mit «Rückgängig».

## Warum
Befund vom 23.11.2026: Der Planer kannte den Spielplan nicht. Zum Standard-Sonntag kamen die Termine als eigene Zeilen «Training» und «Spiel» dazu: bis zu drei Eishockey-Zeilen in einer Woche.
Befund vom 23.11.2026: zwei Planer, die nichts voneinander wussten. Der ältere ignorierte Wochenplan, TrainingPeaks und Spielplan und legte eigene Einheiten dazu: Velo doppelt, Liegestütze statt Tennis.
Befund vom 23.11.2026: Das Ziel von 15 Std. hielt mit TrainingPeaks nicht (Beispiel 19,5 Std., mit Noahs 9 bis 11 Std. TrainingPeaks etwa 21 bis 23 Std.), weil TrainingPeaks nur die zwei Velo-Einheiten ersetzte. Der Hinweis «über dem Soll» kam nur, wenn TrainingPeaks allein mehr als 15 Std. hatte.
Befund vom 23.11.2026: «geplant 7:23 Std.» zählte die Vorschläge nicht mit, die Zahl passte nie zum Ziel; und niemand sah, warum eine Sportart in der Woche weniger vorkam als im Ziel.
Befund vom 23.11.2026: Der Trainingsplan «Ultra» (92 Velo-Einheiten ab 28.12.) wurde vom Wochenplan nicht erkannt; ab da stand Velo doppelt (Plan und eigene Einheiten).
Befund mit Noahs echtem Plan: alte Vorschläge lagen noch in der Woche, die Zeile sagte «geplant 28:21 von 15:00 Std.», obwohl der Wochenplan nur 15 Std. setzt.

## Was fällt weg oder rutscht tiefer
- In Wochen mit Spielerplus-Kalender gibt es keine abhakbare Eishockey-Einheit im Wochenplan mehr (und keine in «Jetzt dran»). Eishockey wird weiter wie bisher in Aktiv abgehakt oder kommt von Strava; die Termine stehen in Heute › «Heute fällig».
- Das Eishockey-Ziel («1× pro Woche», Fixtag) im Wochenplan bleibt gespeichert und gilt wieder, sobald der Kalender aus ist.
- Mit Wochenplan: «Tage sperren», «Mal pro Woche» je Sportart, der Fokus (Ausdauer, Intervalle, Kraft, Erholung) und die gemerkten Änderungen des älteren Vorschlags sind nicht mehr zu sehen. Die gespeicherten Werte bleiben (`training.days`, `training.sportgoals`, `training.habits`), nichts wird gelöscht. Erholung entspricht der Leichteren Woche. Wer den alten Vorschlag wieder will, löscht den Wochenplan nicht: dazu sagt er «zurück» zu diesem PR.
- Ersatz für «Tage sperren»: im Wochenplan Fixtage und «Verschieben».
- In Wochen mit viel TrainingPeaks fehlen Mini-Workout, Laufen drinnen, das zweite Gym und weitere Einheiten, die der Plan früher dazusetzte. Zurück: «Ziel in Wochen mit TrainingPeaks» höher stellen.
- Der Hinweis «Mit TrainingPeaks liegt die Woche über deinen Std. Nichts wird weggenommen» kommt nur noch, wenn der Plan nichts weggelassen hat.
nichts. Die Zeile stand schon da, sie zählt nur mehr. Kein neuer Block über dem Inhalt.
In Wochen mit einem Trainingsplan setzt der Wochenplan weniger eigene Einheiten (Velo, Laufen, Gym der gleichen Sportart), weil der Plan sie deckt. Zurück: den Plan aus der Woche nehmen (Training › Trainingspläne) oder das Stundenziel erhöhen.
Nichts. Die alten Einheiten gehen nur, wenn Noah «Entfernen» tippt (mit Rückgängig).

## Selbst entschieden
- Nur ein Kalender mit der Sportart «Eishockey» zählt (Einstellung der Karte «Spielerplus-Kalender», `act`).
- Ein Termin ohne Dauer zählt 90 Minuten; ein Termin ohne Uhrzeit steht um 10:00 (nur für die Überschneidung, nie angezeigt).
- Die Termine zählen noch nicht auf die Wochenstunden (Soll); das macht Schritt 3 «Soll mit TrainingPeaks» zusammen mit TrainingPeaks.
- Kein Dexie-Schema, kein `api/`; Spielerplus bleibt ein Gerätewert.
- Der Fokus Intervalle oder Kraft wird nicht nachgebaut; falls du ihn vermisst, kommt er als eigene Wochen-Art im Wochenplan (Schalter wie «Leichtere Woche»).
- Kein Schema, kein `api/`; kein gespeicherter Wert wird geändert oder gelöscht.
- Weggelassen wird nie unter einen Boden: Tennis, Yoga, Eishockey, erstes Gym, Sauna und Ruheblock bleiben.
- Eine Einheit fällt nur weg, wenn die Woche um mehr als die halbe Einheit darüber liegt.
- Leichte und härtere Woche rechnen das eigene Ziel im gleichen Verhältnis.
- «Plus und Minus» je Sportart: die bestehenden Knöpfe ändern die Zahl für jede Woche (das Soll); eine Zahl nur für diese eine Woche ist nicht gebaut. Dafür gibt es «Verschieben», «Loslassen» und die Wochen-Art. Falls du eine Zahl nur für diese Woche willst, sag es.
- Kein Schema, kein `api/`, nur Anzeige.
- «Übernehmen» beim älteren Vorschlag ersetzt Einheiten eines Trainingsplans weiterhin (wie vorher); nur TrainingPeaks ist davor geschützt. Der Vorschlag ist mit Wochenplan nicht mehr zu sehen.
- Kein Schema, kein `api/`.
- Die Zeile steht im Wochenplan unter den Hinweisen zu den Stunden, nicht über dem Inhalt (Content first).
- Nach der Bildprüfung (impeccable, ohne Prüfprogramm): gleichartige Hinweise unter den Stunden sind eine Zeile mit Liste («fällt diese Woche weg: 1 × «Mini-Workout», 1 × «Gym» …», «Ersetzt durch TrainingPeaks: …») statt vier fast gleicher Absätze; bei Eishockey aus dem Spielplan fehlt das irreführende «1 fest, 0 frei».
- Stundenkarte im Wochenplan kurz und geordnet (Noah 24.11.2026: «die infos finde ich sehr relevant, aber die darstellung ist ein wenig erschetternd», Vorschlag b): unter dem Balken drei Zahlenzeilen (TrainingPeaks, Trainingsplan, Spieltermine, «Dein Plan ergänzt»), «Ersetzt durch …» und «fällt weg» als Chips, der Hinweis «über deinen Stunden» mit «20 Std. vorschlagen» direkt daneben, die langen Erklärsätze hinter «Mehr dazu». «Plan: x von y Std.» zählt jetzt die Spieltermine mit (vorher fehlten sie, der Balken war kleiner als die Woche).
- Kein Schema, kein `api/`.
- Sieben Schritte in einem PR, eine News-Datei: mehrere News-Dateien in einem PR bekämen dieselbe Versionsnummer (`tests/whatsnew.test.js`).

## Entscheide (eigene Datei `docs/decisions/wochenplan-verlaesslich.md`)
- Siehe dort: Eishockey aus Spielerplus, Soll mit TrainingPeaks (2a und b), Woche vorschlagen ist der Wochenplan (3a), Zahlen der Woche (4a), Trainingsplan wie TrainingPeaks (5a), alte Vorschläge entfernen, Stundenkarte kurz.

## Stand im Plan (roadmap.md / vorhaben.md)
- «Wochenplan-Vorschläge verlässlich machen»: Schritte 1 bis 7 erledigt; offen: Fokus Intervalle/Kraft als eigene Wochen-Art (Noah «3a»).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Training › Wochenplan: unter «Ziel pro Woche» stehen die Teile der Woche als Zahlen; «Mehr dazu» öffnet die lange Erklärung.
2. Liegen noch alte Vorschläge in der Woche, sagt es eine Zeile; «Entfernen» tippen, Training › Woche zählt danach weniger; «Rückgängig» bringt sie zurück.
