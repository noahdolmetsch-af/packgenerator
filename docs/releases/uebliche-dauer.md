# Übliche Dauer je Sportart

PR #1310 · 21.11.2026 · Auftrag: Noah «1 a dann b, 2b, 3a, 4a, 5a» (Thread «Jede Sportart durchgehen», Umsetzungsauftrag S1)

## Was ist neu
- Jede Sportart hat eine «Übliche Dauer»: wie lange eine Einheit üblicherweise dauert. Ohne Einstellung gelten 60 Minuten.
- Im Bearbeiten-Fenster der Sportart (Aktiv › Meine Sportarten › Sportart › Bearbeiten) steht sie unter «Mindestdauer»: Standard 60, 30, 45, 90, 120 oder eigene Zahl.
- Auf «Meine Sportarten» steht die eingeklappte Zeile «Übliche Dauer»: alle Sportarten in einer Liste, mit Minus und Plus in Schritten von 15 Minuten; «Standard» nimmt eine Einstellung zurück (mit Rückgängig).
- Sie ist die Schätzung für Haken ohne gemessene Zeit. Die Auswertung («Sportjahr», nächste PRs) schreibt sie dann mit «ca.». Dieser PR stellt nur die Einstellung bereit; gezählt wird noch nichts neu.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Speicherort: Einstellung `sport.usualMin` = `{ <Aktivitäts-Nr.>: Minuten }` in `db.settings`. Kein Dexie-Schema-Wechsel. Die Einstellung kommt mit dem Backup und dem Abgleich mit (wie jede andere Einstellung); ein älteres Backup ohne sie gibt überall 60 Minuten.
- Die Schätzung wird nie in einen Haken geschrieben, sie wird erst beim Lesen gerechnet (kommt mit S2).
- `minMin` (Mindestdauer des Timers) bleibt unberührt und wird nicht wiederverwendet.
- Wird eine Aktivität gelöscht, bleibt ihr Eintrag in der Einstellung stehen (klein, harmlos; «Rückgängig» holt die Aktivität samt Dauer zurück).
- Sportarten ohne eigene Aktivität (Strava Wandern, Langlauf, Schwimmen) bekommen ihre übliche Dauer, sobald es dafür eine Aktivität gibt (S7); bis dahin gilt dort der Standard.
- Fertig-Regel: (1) keine eigene Seite, die Einstellung gehört zu «Meine Aktivitäten» (Zeile in `docs/app-stand.md`), (2) Absprung: Bearbeiten-Fenster und Seite «Meine Sportarten», (3) «Gut zu wissen»: nicht gebaut, die Seite steht nicht in `ON_PAGES`, der Erklärtext steht direkt in der Zeile, (4) leerer Zustand: die Zeile erscheint erst, wenn es Sportarten gibt, (5) nächster Schritt: folgt mit dem Sportjahr (S3), (6) App-Stand ergänzt.
- Namen: «Übliche Dauer» in `docs/namen.md` Nr. 26 (Arbeitsname, Noah kann umbenennen).

## Entscheide (für decisions.md)
- 21.11.2026: Einheiten ohne gemessene Dauer werden mit der üblichen Dauer der Sportart geschätzt und überall «ca.» genannt; Standard 60 Minuten (Noah «2b»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Sportjahr und Auswertung aller Sportarten: S1 gebaut; S2 (gemeinsame Einheiten lesen) und S3 (Sportjahr) folgen als eigene PRs.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Aktiv › Meine Sportarten: die Zeile «Übliche Dauer» öffnen und bei einer Sportart einmal auf «+» tippen: dort steht «75 Min» (ohne «Standard»).
2. Dieselbe Sportart antippen, «Bearbeiten»: «Übliche Dauer» zeigt «eigene» mit 75; auf «Standard» tippen und speichern.
3. Zurück in der Liste steht wieder «60 Min (Standard)».

## Prüfung mit einer Backup-Kopie
`tests/usualdauer.test.js` baut aus einer Datenbank mit der Einstellung ein Backup, liest es in eine leere Datenbank zurück (Einstellung ist da) und liest dieselbe Datei ohne die Einstellung zurück (überall 60 Minuten, nichts bricht).
