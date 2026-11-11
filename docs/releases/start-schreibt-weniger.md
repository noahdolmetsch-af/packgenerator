# Ruhigerer Start: Touren nur schreiben, wenn sich etwas ändert

Auftrag: Noah «ich möchte 1-4 umsetzen, nachdem 1251 durch ist» (Thread «Messen: warum die App langsam ist»), Punkt 2. Bericht `notes/messen-2026-11-10/README.md` im Projektordner.

## Was ist neu
- `ensureTrips` (`src/lib/trips.js`, Start-Schritt) schrieb jede Tour neu, auf die seine Bedingung zutraf, auch wenn der Schritt nichts verbessern konnte (zum Beispiel eine Tour, deren Velo nicht gefunden wird und die deshalb jedes Mal «ohne Velo» bleibt). Gemessen mit Noahs echten Daten: 10 Touren bei jedem Start.
- Jetzt wird eine Tour nur geschrieben, wenn sich ihr Inhalt wirklich ändert (Vergleich mit sortierten Feldern). Der Rückgabewert zählt die wirklich geschriebenen Touren.
- Jedes Schreiben weckt Live-Abfragen, Ordner-Backup und Abgleich; weniger Schreiben am Start heisst weniger davon.
- Neuer Test `tests/ensuretrips-leise.test.js`: eine Tour, die der Schritt nicht verbessern kann, wird bei keinem Start geschrieben; eine Tour, die ihn braucht, genau einmal.

## Was fällt weg oder rutscht tiefer
- nichts. Kein Schema, kein Backup-Format geändert; die Touren sehen danach genau gleich aus.

## Selbst entschieden
- Der Vergleich ist ein Text-Vergleich mit sortierten Feldern, kein neues Feld an der Tour (kein Merker in den Daten).
- Keine Bilder: nichts Sichtbares ändert sich.

## Stand im Plan
- Tempo: #1251 (Datenbank-Einstellung) und Noahs Punkt 2 (dieser PR) erledigt; offen: Punkt 1 (Fahrten schlank), Punkt 3 (Abgleich und Erinnerungen), Punkt 4 (Ordner-Backup höchstens alle 30 s).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. App zweimal hintereinander neu laden: Heute zeigt dieselben Touren.
2. Eine Tour aus Touren öffnen: die Packliste ist, wie du sie verlassen hast.
