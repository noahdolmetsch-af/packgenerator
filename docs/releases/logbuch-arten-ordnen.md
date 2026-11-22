# Verbesserungs-Logbuch L5, Schritt 1: Arten und Gruppen umbenennen und ordnen

22.11.2026 · Auftrag: Noah «L5 bauen» (Spez `05-logbuch-arten`, Antworten «1a 2a 3a 4a 5a»)

## Was ist neu
- Auf Ich › Verbesserungs-Logbuch steht unten die neue Karte **«Arten und Gruppen»** mit dem Knopf «Arten und Gruppen ändern». Er öffnet ein Fenster mit den vier Gruppen und ihren Arten.
- Jede Art und jede Gruppe lässt sich im Menü «⋯» **umbenennen**. Ein leerer Name bringt das Standardwort zurück. Jeder Schritt hat «Rückgängig».
- Gruppen und Arten lassen sich mit **Pfeilen oder Ziehen** ordnen. «Zurück zum Standard» holt die ersten 13 Arten in vier Gruppen zurück (mit «Rückgängig»).
- Im Fenster «Verbessern» führt der Link **«Arten ändern»** in dieses Fenster.
- Die Liste, der Filter, das Fenster «Verbessern», die Karte «Was passiert damit?» und «Auftrag kopieren» zeigen die neuen Namen und die neue Reihenfolge. Eigene Namen laufen nicht durch `t()`, die eingebauten bleiben deutsch.
- Die Liste liegt als eine Einstellung `logbuch.kinds`: im Backup, nicht im Geräteabgleich. Ohne Einstellung gilt die erste Fassung. Die Schlüssel der Arten ändern sich nie, alte Einträge bleiben gültig.

## Was fällt weg oder rutscht tiefer
- nichts. Die Karte «Was passiert damit?» nennt die Arten jetzt nach dem, was du eingestellt hast (vorher fester Text).

## Selbst entschieden
- Die Einstellung ist ein eigener Schlüssel `logbuch.kinds`; `syncLocal` nimmt alle Schlüssel mit `logbuch.` aus dem Geräteabgleich (wie `update.`). Kein neuer Tabellenstand, kein neues Backup-Format.
- Die Zeile in `GROUP_PLACES` und im Wächter `tests/groups.test.js` kommt mit Schritt 2 (Löschen mit Frage): der Wächter verlangt dort `GroupDeleteSheet`.
- `sortable.js`: eine Liste in einer Zeile einer anderen sortierbaren Liste (Arten in Gruppen) greift nur ihre eigenen Griffe, die äussere Liste startet dann nicht mit.
- Handbuch: ein Satz im Katalogtext der Funktion, kein neuer Schritt (die «So geht's»-Liste hat genau 3).
- «Gut zu wissen» und leerer Zustand: die Karte hat nur einen Knopf; eine Gruppe ohne Art zeigt «In dieser Gruppe ist noch keine Art.» (wird erst mit Schritt 2 möglich).

## Entscheide
- Siehe `docs/decisions/logbuch-arten-ordnen.md` und die Spez `05-logbuch-arten`: Noah «1a 2a 3a 4a 5a» (22.11.2026 08:57 UTC). Dieser PR setzt 1a (Karte und Link) und die Umbenennen- und Ordnen-Hälfte von 2a um.

## Stand im Plan (roadmap.md / vorhaben.md)
- L5 in drei PRs: 1 Speicher und Fenster (dieser), 2 Löschen mit Frage und Rückgängig, 3 neue Arten und Gruppen.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Verbesserungs-Logbuch › unten «Arten und Gruppen ändern» tippen.
2. Bei einer Art «⋯» › «Umbenennen», neues Wort speichern: es steht in der Liste und im Filter. «Rückgängig» tippen: das alte Wort ist zurück.
3. Eine Art mit den Pfeilen verschieben, dann «Zurück zum Standard» tippen: alles ist wie vorher.
