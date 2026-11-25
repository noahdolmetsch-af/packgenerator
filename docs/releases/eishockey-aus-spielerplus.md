# Eishockey kommt aus Spielerplus

PR #1783 · 23.11.2026 · Auftrag: Noah «1a» (Thread «Wochenplan-Vorschläge verlässlich machen»), Schritt 2 von 6

## Was ist neu
- Ist ein Spielerplus-Kalender der Sportart Eishockey an und wurde einmal geholt, sind seine Termine (Training und Spiel) das Eishockey der Woche. Der Wochenplan setzt keine eigene Eishockey-Einheit (bisher fix Sonntag 8:00) dazu; eine Woche ohne Termin hat keins. Unter den Stunden steht ein Satz dazu.
- Die Termine zählen für harte Tage, Überschneidungen und «Was nicht passt» wie die Einheiten des Plans; sie stehen fest. Steht ein Termin am Samstag, legt die Skitour-Woche die Tour auf den Sonntag.
- In Training › Woche tragen Termine aus Spielerplus den Namen des Teams («Testteam · Training»), nicht nur «Training».
- Ohne verbundenen Kalender bleibt alles wie bisher (Sonntag 8:00).

## Warum
Befund vom 23.11.2026: Der Planer kannte den Spielplan nicht. Zum Standard-Sonntag kamen die Termine als eigene Zeilen «Training» und «Spiel» dazu: bis zu drei Eishockey-Zeilen in einer Woche.

## Was fällt weg oder rutscht tiefer
- In Wochen mit Spielerplus-Kalender gibt es keine abhakbare Eishockey-Einheit im Wochenplan mehr (und keine in «Jetzt dran»). Eishockey wird weiter wie bisher in Aktiv abgehakt oder kommt von Strava; die Termine stehen in Heute › «Heute fällig».
- Das Eishockey-Ziel («1× pro Woche», Fixtag) im Wochenplan bleibt gespeichert und gilt wieder, sobald der Kalender aus ist.

## Selbst entschieden
- Nur ein Kalender mit der Sportart «Eishockey» zählt (Einstellung der Karte «Spielerplus-Kalender», `act`).
- Ein Termin ohne Dauer zählt 90 Minuten; ein Termin ohne Uhrzeit steht um 10:00 (nur für die Überschneidung, nie angezeigt).
- Die Termine zählen noch nicht auf die Wochenstunden (Soll); das macht Schritt 3 «Soll mit TrainingPeaks» zusammen mit TrainingPeaks.
- Kein Dexie-Schema, kein `api/`; Spielerplus bleibt ein Gerätewert.

## Entscheide (eigene Datei `docs/decisions/eishockey-aus-spielerplus.md`)
- 23.11.2026: Termine des Teams sind das Eishockey der Woche (Noah «1a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- «Wochenplan-Vorschläge verlässlich machen»: Schritt 2 von 6.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Training › Wochenplan: unter den Stunden steht «Diese Woche kommt das Eishockey aus deinem Spielerplus-Kalender …» (oder «… keinen Termin»).
2. Training › Woche: Spielerplus-Termine stehen auf ihren Tagen mit dem Teamnamen, kein zusätzliches «Eishockey» am Sonntag.
