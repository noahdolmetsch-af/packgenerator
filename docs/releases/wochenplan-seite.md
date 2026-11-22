# Wochenplan, Teil 2: die Seite

PR folgt · 09.11.2026 · Auftrag: Noah «freigabe … bau los» (Thread «Prüfen: Trainingsplan Woche packbar»), Reihenfolge 1 bis 5 im Umsetzungsauftrag

## Was ist neu
- **Seite «Wochenplan»** (`#/flow/wochenplan`, `src/pages/flow/Wochenplan.svelte`, lädt erst beim Öffnen): oben das Ziel pro Woche (6 bis 24 Std, Plus und Minus), darunter der Plan in Stunden mit Balken, die Einheiten pro Woche je mit Plus und Minus, die Woche Tag für Tag mit Zeiten, und «Was nicht passt».
- **Winter und Sommer** haben je eigene Ziele (1. April bis 30. Oktober ist Sommer, wie in Teil 1). In der Jahreszeit von heute gibt es «Diese Woche» und «Nächste Woche»; die andere Jahreszeit zeigt eine Beispielwoche ohne Datum.
- **Leere Ansicht:** solange nichts gespeichert ist, sagt die Seite warum («Noch kein Wochenplan») und bietet «Meinen Wochenplan starten». Sind alle Einheiten auf null, steht «Keine Einheiten gewählt» mit «Aus n Std vorschlagen».
- **Änderungen sind gespeichert** in `training.weekplan` (db.settings, im Backup, kein `api/`), jede mit einer Meldung. «Rückgängig» nimmt die letzte Änderung zurück (bis 20 Schritte, solange die Seite offen ist), «Zurück zum Grundplan» setzt die Jahreszeit auf die Startwerte, «Einheiten aus den Stunden neu vorschlagen» erscheint, sobald man von Hand geändert hat.
- **Was nicht passt:** drei harte Tage am Stück, mehr als drei Einheiten an einem Tag, überschneidende Einheiten, kein freier Halbtag, kein Platz für eine Einheit. Nichts wird still gestrichen; «Was der Plan selbst angepasst hat» steht eingeklappt.
- **Sprung:** auf Aktiv unter «Diese Woche» der Link «Wochenplan», in «Woche planen» unter dem Hinweis zum Training der Link «Wochenplan für dein Training» (die Zeile «Passt hier» dort hat schon vier, mehr erlaubt der Test nicht). Katalog (`f.wochenplan`, Handbuch mit drei Schritten und Beispiel), «Gut zu wissen», «Als Nächstes» am Seitenende (Wochenziele, Woche mit Wetter planen), Zeile in `docs/app-stand.md`.

## Was fällt weg oder rutscht tiefer
- nichts. «Meine Wochenziele», «Training-Woche vorschlagen», «Verpasst? Verschieben» und die Trainingspläne bleiben wie sie sind; der Wochenplan füllt die Wochenziele nicht und ersetzt sie nicht (Noah 09.11.2026).

## Selbst entschieden
- **Vergleich mit dem Entwurf («Variabler Plan»):** gleich in Aufbau und Reihenfolge (Stunden, Einheiten, Status, Woche) und gleichen Wörtern. Weicht ab, weil: (1) das Wochenraster ist eine Liste mit einer Zeile pro Einheit statt Kästchen, damit es am Handy lesbar bleibt; (2) die Schalter «Skitour-Woche» und «Regenwoche», «Abhaken», «Strava meldet» und «Fixtage» aus dem Entwurf fehlen noch, sie gehören zu Teil 3 bis 5; (3) die Warnungen zeigen noch keinen Knopf «Du hast die Wahl», das ist Teil 4.
- **Name «Wochenplan»:** so nennt es Noah. Ältere Texte nennen die Einheiten aus «Trainingspläne › Ausprobieren» auch «Wochenplan». Das ist noch nicht umbenannt; ein Vorschlag dafür kommt mit Teil 3, wenn beide nebeneinander auf Heute stehen.
- Die Einstellung wird erst gespeichert, wenn man «Meinen Wochenplan starten» tippt oder etwas ändert; ein Blick auf die Seite schreibt nichts.
- «Rückgängig» gilt nur, solange die Seite offen ist (wie die Meldungen anderer Seiten), und sie nimmt die ganze Einstellung (beide Jahreszeiten) zurück.
- Fertig-Regel: Seite, Absprung (Aktiv, «Passt hier» in Woche planen), «Gut zu wissen», leere Ansicht, nächster Schritt und app-stand sind da. Teil 3 bis 5 (Abhaken, Fixtage, Sterne) folgen als eigene PRs.
- Aufbau: Teil 1 (#1230) ist gemergt, dieser PR liegt auf `main`.

## Entscheide (für decisions.md)
- nichts Neues (Entscheide von Teil 1 gelten).

## Stand im Plan (roadmap.md / vorhaben.md)
- Variabler Wochenplan (Vorhaben 18): Teil 2 von 5 gebaut.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Aktiv › unter «Diese Woche» «Wochenplan» tippen, «Meinen Wochenplan starten»: die Woche erscheint mit Zeiten.
2. Das Plus neben «Ziel pro Woche» tippen: Einheiten und Woche ändern sich; «Rückgängig» tippen: wie vorher.
3. Bei «Tennis» das Minus tippen: eine Einheit weniger, der Plan zeigt seine Stunden; «Zurück zum Grundplan» setzt alles zurück.
