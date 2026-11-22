# Trainingspause zählt auch Haken

Auftrag: Noah 21.11.2026 (Thread «Fix «letztes Training vor 5 Tagen» trotz Haken»): Die Morgenfrage «Was hat dich zuletzt vom Training abgehalten?» sagte «Dein letztes erfasstes Training war vor 5 Tagen», obwohl er in diesen Tagen Sportarten in der App abgehakt hatte.

## Was ist neu
- Die Regel «Pause vom Training» (Ich › Deine Abfragen › Fragen aus deinen Daten) zählt jetzt vier Quellen: Strava-Aktivitäten, Tennis (gespielt oder gegeben), die Haken von Aktiv und die Haken des Wochenplans.
- Dasselbe gilt für eigene Regeln mit dem Wert «Tage ohne Training» (`valueNow('pause')`).
- Die Zeile unter der Regel heisst «… (Strava, Tennis oder abgehakt)».

## Was fällt weg oder rutscht tiefer
- nichts. Wer nur Strava und Tennis nutzt, sieht dasselbe wie vorher. Wer abhakt, bekommt die Frage seltener (nur noch nach einer echten Pause).

## Selbst entschieden
- Als Training zählt jeder Haken einer Sportart des Rings «Bewegen» (auch Liegestütze und Stretching, wie bei «Tage mit Training» auf «Geschafft»), auch von einer Sportart, die du inzwischen gelöscht hast. Nicht gezählt: Meditation und Sauna (andere Ringe) und der Arbeitsweg mit dem Velo.
- Im Wochenplan zählt jede abgehakte Einheit ausser Meditation, Sauna und Ruheblock. Gezählt wird der Tag, an dem abgehakt wurde.
- Wie bisher werden nur die letzten 40 Tage gelesen; ohne Training in dieser Zeit gibt es nichts zu zählen und keine Frage.
- Keine neue Datenstruktur, nichts wird gespeichert, kein `api/`. Die Haken werden nur gelesen (`tickDays` in `src/lib/datenfragen.js`, gelesen in `abQuery`).
- Die gemeinsame Einheiten-Liste aus dem Thread «Sportjahr» (PR #1311, `einheiten.js`) ist noch nicht auf `main` und hängt an #1310. Dieser PR wartet nicht darauf. Wenn sie online ist, kann `tickDays` sie lesen; heute ist es eine kleine eigene Zählung der Tage.
- Die Regel «Langer Tag gestern» zählt weiter nur Strava-Zeit; ihr Text sagt das ausdrücklich («Strava-Aktivitäten zusammen»). Ein Haken mit Dauer zählt dort nicht (offen, siehe unten).

## Entscheide (für decisions.md)
- 21.11.2026: Eine Frage oder ein Hinweis zu «Training» zählt alle erfassten Einheiten (Strava, Tennis, Haken), nicht nur eine Quelle.

## Stand im Plan (roadmap.md / vorhaben.md)
- Ziel 5 (Alltag): nichts verschoben, ein Fehler behoben.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auf Aktiv eine Sportart abhaken (zum Beispiel Yoga).
2. Ich › Deine Abfragen › Fragen aus deinen Daten: die Zeile unter «Pause vom Training» nennt «abgehakt».
3. Am nächsten Morgen: die Frage «Was hat dich zuletzt vom Training abgehalten?» kommt nicht, solange der letzte Haken weniger Tage zurückliegt als die Regel sagt (Standard 4).
