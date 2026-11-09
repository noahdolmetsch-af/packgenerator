# Wochenplan, Teil 1: Planer und Stunden (nichts sichtbar)

PR folgt · 09.11.2026 · Auftrag: Noah «freigabe für Planer und Stunden … bau los» (Thread «Prüfen: Trainingsplan Woche packbar»)

## Was ist neu
- Reine Logik, noch keine Seite: `src/lib/training/wochenplan.js`. Aus den Zielen einer Woche (Einheiten mit Anzahl, Wochenstunden, Fixtage) entsteht eine Woche mit Zeiten. Regeln, keine KI: dieselbe Eingabe gibt immer dasselbe Ergebnis. Jede Platzwahl trägt einen Grund als Code (`why`), damit die Seite später «Warum hier?» sagen kann.
- **Wochenstunden → Einheiten:** `suggestFromHours` schlägt zu 6 bis 24 Std die passenden Einheiten vor (Winter: nach Wichtigkeit gefüllt, Sommer: Festes bleibt, Velo draussen füllt den Rest). Über etwa 20 Std meldet der Planer, dass es nicht mehr ohne Überlastung passt.
- **Änderungen von Hand** als reine Funktionen: `setHours`, `stepCount` (Plus/Minus), `toggleFix` (Fixtag setzen und lösen).
- **Regeln:** höchstens 3 Einheiten pro Tag (Ziel 1–2), höchstens 2 harte Tage am Stück, Sauna nach dem Gym, Laufband nach dem Gym, Intervalle einmal pro Woche und nie neben einem harten Tag, ein Ruheblock und ein freier Halbtag, Skitour-Woche ist leicht (Velo, Laufen, Mini-Workout entfallen, Tag vorher frei), Regenwoche macht aus Velo draussen Velo drinnen, Meditation jeden zweiten Tag fortlaufend über die Wochen, Dehnen direkt nach der Einheit an den Tagen dazwischen. Sommer ist vom 1. April bis 30. Oktober.
- **Stabile Einheiten:** jede Einheit hat eine feste Kennung (`tennis@1` für einen Fixtag, `bikeOut#2` für die zweite freie Einheit). Häkchen und Verschiebungen bleiben so bei ihrer Einheit, wenn ein Ziel geändert wird.
- **Konflikte** kommen als Liste mit Weg heraus (`warnings`, mit `fix`), nichts wird still gestrichen.
- **Einstellung `training.weekplan`** (Tabelle `settings`, reist in der Sicherung mit, kein `api/`, keine neue Tabelle, keine Änderung des Dexie-Schemas): `{ v: 1, winter, summer }`, je Jahreszeit Stunden, Anzahl pro Einheit, Fixtage. `planOf` macht jeden gespeicherten Wert sicher; fehlt er, gelten die Startwerte.
- Tests: `tests/wochenplan.test.js` (33 Fälle, auch Sicherung → Wiederherstellen und eine alte Sicherung ohne die Einstellung).

## Was fällt weg oder rutscht tiefer
- nichts. Die Wochenziele («Meine Wochenziele») bleiben unverändert und getrennt vom Plan (Noah 09.11.2026). «Training-Woche vorschlagen» und «Verpasst? Verschieben» bleiben.

## Selbst entschieden
- **Keine Texte im Planer:** er liefert Codes und Zahlen, die Seite (PR 2) macht daraus Deutsch mit `t()`. Darum keine German-Einträge in diesem PR.
- Eine Einstellung mit Winter und Sommer getrennt, weil beide Jahreszeiten eigene Ziele haben (Noah: Sommer kein Eishockey, 3× Tennis, ca. 8 Std Velo).
- Meditation fliessend über die Wochen (jeden zweiten Kalendertag), nicht «Woche 1/Woche 2» zum Umschalten.
- Keine «Was ist neu»-Datei und keine Zeile in `docs/app-stand.md`: es gibt noch keine Seite und keine Funktion im Katalog (Fertig-Regel gilt ab PR 2).
- Was nur eine Woche betrifft (Verschiebungen, Häkchen, Skitour- und Regenwoche) wird hier nicht gespeichert; es kommt als `ctx` hinein und folgt in PR 3 und 4.

## Entscheide (für decisions.md)
- 09.11.2026: Wochenziele bleiben getrennt vom Trainingsplan; der Plan füllt sie nicht und ersetzt sie nicht (Noah).
- 09.11.2026: Planer ohne KI, jede Platzwahl mit Grund (Noah «1a 2a 3a», Konflikt zeigen, Nutzer wählt).

## Stand im Plan (roadmap.md / vorhaben.md)
- Variabler Wochenplan (Vorhaben 18): Teil 1 von 5 gebaut.

## Prüfschritte (nach dem Merge)
Nichts zu sehen. Wer prüfen will: die Tests laufen in der CI (`tests/wochenplan.test.js`). Auf der echten Seite ändert sich nichts.
