# Die Suche findet mehr (V1) und zeigt Treffer lesbarer (V4)

PR #1783 · 23.11.2026 · Auftrag: Noah «1a 2a 4a 5a» und «3b» (Warteliste 1, Thread «Warteliste fertig bauen, online später»)

## Was ist neu
- Die Suche oben findet zusätzlich: **Fahrten** (Strava-Fahrten und Fahrten aus dem km-Buch ohne Strava: Titel, Datum, Velo), **Orte** (Gipfelbuch), **Erkenntnisse**, **Velopflege** (Werkstattbesuche), **Training** (geplante Einheiten), **Aufgaben** (eigene To-dos und Google-Aufgaben) und die **Funktionen unter Ich** (Einstellungen, Werkzeuge, Verbindungen).
- Gefundene Wörter sind im Titel markiert.
- Über der Trefferliste stehen Knöpfe «Alle | Fahrten · 6 | Erkenntnisse · 1 …» mit der Zahl; ein Tipp zeigt nur diese Art, **«Alle 6 zeigen»** zeigt jeden Treffer.
- Bei einem Tippfehler steht neben «Nichts für … Gesucht: …» der Knopf **«Meintest du …?»**; ein Tipp setzt das Wort ins Feld.
- Kurzwörter: «fahrten», «orte», «aufgaben», «erkenntnisse» schränken auf diese Art ein (wie «touren» oder «material»).

## Was fällt weg oder rutscht tiefer
- nichts. Befehle, «Zuletzt geöffnet», Sprachsuche, «Kluge Suche» und die Funktionen-Treffer bleiben. Eine Funktion, die schon als Treffer unter «Ich» steht, erscheint nicht noch einmal unter «Funktionen».

## Selbst entschieden
- Gelesen wird erst beim Tippen (Tempo-Regel), Zeile für Zeile, ohne Linien und Profile; die Tabellen liegen in `src/lib/suche/mehrload.js`, die Auswahl in `src/lib/suche/mehr.js`.
- Ein Fahrten-Treffer öffnet die Liste «Fahrten von Strava», ein Ort das Gipfelbuch, eine Erkenntnis die Erkenntnisse, Velopflege die Werkstattbesuche, Training die Trainingswoche, eine eigene Aufgabe die Woche. Einzelne Detailseiten für jede Fahrt gibt es nicht.
- Gesundheit: Es gibt keine Treffer aus Gesundheitswerten (Noah «5a»); Gesundheitsseiten werden wie bisher als Seite gefunden, ohne Zahl.
- «Einstellungen» sind hier die Funktionen unter Ich (rund 150, auch Werkzeuge). Eine Liste einzelner Schalter pro Zeile folgt mit dem eigenen Suchfeld auf Ich (V2, eigener PR).
- Fertig-Regel: erweitert die bestehende Suche, kein neuer Ort; Zeile in `docs/app-stand.md` ergänzt.

## Entscheide (eigene Datei `docs/decisions/suche-mehr.md`)
- 22.11.2026: Noah «1a 2a 3b 4a 5a» – Verweis; Text in der eigenen Datei.

## Stand im Plan
- Warteliste 1 (Suche): V1 und V4 gebaut. V2 (Suchfeld auf Ich, Touren, Auswerten) folgt als eigener PR. V3 entfällt (3b).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Suche antippen, ein Wort aus einer deiner Fahrten eintippen: eine Gruppe «Fahrten» mit Tag, km, Velo.
2. Ein Wort eintippen, das mehrere Arten haben: Wörter markiert, Knöpfe mit Zahlen; «Fahrten» antippen zeigt alle Fahrten.
3. Einen Namen mit einem falschen Buchstaben tippen: «Meintest du …?» setzt das richtige Wort ein.

Keine Datenänderung (es wird nur gelesen).
