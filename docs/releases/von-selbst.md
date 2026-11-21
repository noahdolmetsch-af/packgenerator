# Tür «Von selbst»: «Wie war's?» nach einer Strava- oder Fitbit-Aktivität

PR folgt · 20.11.2026 · Auftrag: Noah «1-5a» (Thread «Training erfassen und auswerten vereinfachen», Umsetzungsauftrag T3). Erweitert am 21.11.2026 nach Noahs Antwort («auch auf Aktivitäten von Health anwenden», «mehr Daten»). **Datenänderung: neues Feld `feelWord` an den Strava-Aktivitäten (Sync-Feld) und die Einstellung `training.healthfeel` für Fitbit-Trainings, Einzelfreigabe von Noah nötig.**

## Was ist neu
- Ganz oben auf Aktiv steht eine Karte «Neu von Strava · Heute 07:10 / Morgenrunde · 8.2 km · 46 Min · Ø Puls 148 / Wie war's?» mit **leicht, gut, hart** und «Später». Sie fragt nach der neusten Aktivität der letzten 3 Tage ohne Antwort, **für jede Sportart** (vorher nur Velofahrten).
- **Neu (Noah 21.11.):** Dasselbe gilt für ein Training, das die Uhr aufgezeichnet hat (Fitbit über Google Health, `healthDays.exercises`): «Neu von Fitbit · Heute 06:40 / Beispiel-Lauf · 8.4 km · 48 Min · Tempo 5:43 min/km · 55 m hoch · Ø Puls 150 · 41 Zonenminuten · 520 kcal / Wie war's?». Das neuere von beiden (Strava oder Fitbit) wird zuerst gefragt. Hat Strava dasselbe Training auch (gleicher Tag, Start innerhalb von 20 Minuten), fragt nur Strava.
- **Mehr Daten (Noah 21.11.):** Die Karte zeigt, was da ist: Strecke, Zeit, Tempo (Laufen, Gehen, Wandern) oder km/h, Höhenmeter, Ø und max. Puls, Ø Leistung, kcal, Zonenminuten und Schritte (Fitbit). Nichts wird bewertet oder erfunden.
- Die Antwort wird als Wort am Feld `feelWord` der Aktivität gespeichert (`light`, `good`, `hard`). Ein zweiter Tipp auf dieselbe Antwort (auf der Seite der Aktivität) nimmt sie zurück.
- Auf der Seite jeder Aktivität (nicht mehr nur Fahrten) stehen die drei Wörter und das alte 1 bis 10 nebeneinander; eine Zahl ersetzt ein Wort und umgekehrt (nie beides).
- Für die Trainingspläne zählt ein Wort wie die Mitte seiner Zahlen: leicht 2, gut 5, hart 8 von 10 (Zonen 1, 3, 4).

## Was fällt weg oder rutscht tiefer
- Die Karte «Wie anstrengend war deine Fahrt?» (1 bis 10) steht nicht mehr auf Aktiv › Training, sondern als «Wie war's?» ganz oben auf Aktiv. Das 1 bis 10 bleibt auf der Seite der Aktivität (eine Ebene tiefer).
- Der Text «Nach jeder Fahrt fragt die App …» in Trainingspläne, Handbuch und Hilfe heisst jetzt «Nach einer neuen Strava-Aktivität …».
- Sonst nichts. Alte Antworten (1 bis 10, auch die von Strava) bleiben, zählen weiter und werden nicht erneut gefragt.

## Selbst entschieden
- **Zuordnung alt auf neu** (zum Lesen, nichts wird umgeschrieben): 1–3 leicht, 4–6 gut, 7–10 hart. Die Seite der Aktivität zeigt eine alte Zahl weiter als Zahl, nicht als Wort.
- Wort für die Pläne: leicht 2, gut 5, hart 8. Eine eigene Zahl geht vor einem Wort, ein Wort vor Stravas eigenem «Wie anstrengend» (`rpe`).
- «Später» setzt `feelSkip` (wie das bisherige «Überspringen»): für diese Aktivität kommt die Karte nicht mehr. Weil nur 3 Tage zurück gefragt wird, ist es ohnehin «später heute oder nie»; auf der Seite der Aktivität lässt sich jederzeit antworten.
- Gefragt wird jede Strava-Aktivität (auch kurze Spaziergänge); eine Mindestdauer habe ich nicht erfunden. Die Karte zeigt immer nur eine, die neuste.
- **Fitbit-Antworten** liegen in einer Einstellung `training.healthfeel` (`{ v: 1, map: { '<Tag>|<Start>|<Typ>': { w } | { skip } } }`, höchstens 200, die ältesten fallen weg), weil ein Fitbit-Training keine eigene Zeile hat. Keine neue Tabelle, kein Index, keine Schema-Version; die Einstellung geht ins Backup und in den Abgleich wie jede andere. Die Antwort hat noch keinen zweiten Ort zum Ansehen (nur die Karte auf Aktiv); die Auswertung dazu ist ein eigener Schritt, wenn du sie willst.
- Ein Training der Uhr ohne Startzeit gilt als dasselbe wie die Strava-Aktivität des Tages, wenn die Dauer bis auf 10 % stimmt.
- Das neue Feld `feelWord` ist in der Liste der behaltenen Felder (`KEEP`, bleibt bei neuem Strava-Abruf) und ein eigenes Feld im Abgleich zwischen Geräten (`FETCHED.activities.own`), sonst würde es zur Rückfrage führen.
- Der Strava-Haken (`src/lib/stravaticks.js`) bleibt unverändert; das Gefühl am Haken (T2, `feel` am Verlauf-Eintrag) und das Wort an der Aktivität sind zwei getrennte Orte.
- Fertig-Regel: Seite (`f.feel` neu beschrieben), Absprung (die Karte selbst auf Aktiv), «Gut zu wissen»: keine neue Karte, leerer Zustand (die Karte fehlt, wenn nichts zu fragen ist), nächster Schritt: «Später» oder Wort, App-Stand (Zeile Aktiv).

## Entscheide (für decisions.md)
- 19.11.2026: Das Gefühl nach einer Strava-Aktivität heisst «Wie war's?» mit leicht, gut, hart; gilt für alle Sportarten (Noah «1-5a»).

## Datenänderung und Prüfung (CLAUDE.md Regel 3)
- Neues, freiwilliges Feld `feelWord` an `activities`. Kein neuer Index, keine neue Tabelle, keine neue Schema-Version. Aktivitäten ohne das Feld bleiben gültig.
- Geprüft in `tests/healthfeel.test.js` (Fitbit-Antworten, Doppelte mit Strava, Grenze 200, Fakten) und `tests/feelword.test.js`: Zuordnung, Lesen alter Antworten, Feld in `KEEP` und im Abgleich, Speichern mit und ohne Feld; die Backup-Tabelle `activities` nimmt das Feld wie jedes andere mit (Export und Import wie bei `feel`, siehe `tests/feel.test.js`).

## Stand im Plan (roadmap.md / vorhaben.md)
- Training erfassen vereinfachen: T1, T2 und T3 gebaut; T4 «Plan zuerst» folgt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Aktiv: ganz oben steht, bei einer neuen Strava-Aktivität oder einem Fitbit-Training der letzten 3 Tage, die Karte «Wie war's?» mit Strecke, Zeit, Tempo, Puls und mehr.
2. «gut» tippen: die Karte ist weg. Training › Aktivitäten › die Aktivität: «gut» ist markiert.
3. «gut» noch einmal tippen: wieder offen; die Karte erscheint wieder auf Aktiv.
