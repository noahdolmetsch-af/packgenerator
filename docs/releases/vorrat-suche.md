# Vorrat: Teil mit Suchfeld auswählen

PR #<Nummer> · 05.11.2026 · Auftrag: Noah (Durchklick Etappe 2, Antwort «4a» und Design «b»)

## Was ist neu
- Material › Vorrat › «Auch als Vorrat führen»: Die Auswahl aller Teile, die noch kein Vorrat sind, hat bei vielen Teilen ein Suchfeld («Alle Teile durchsuchen»). Die Liste zeigt nur, was zu den Wörtern passt (Umlaute und Akzente spielen keine Rolle). Findet nichts, steht «Kein Teil gefunden». Das gewählte Teil bleibt in der Liste.
- Neue Hülle `src/lib/ui/SearchSelect.svelte` für jede lange Auswahlliste (ab 12 Einträgen erscheint das Suchfeld). Gebaut ist sie vorerst nur hier (Design-Vorschlag b: «Lange Auswahllisten bekommen ein Suchfeld»); weitere Stellen kommen einzeln.

## Was fällt weg oder rutscht tiefer
- nichts. Bis 12 Teile sieht die Auswahl wie vorher aus (kein Suchfeld).

## Selbst entschieden
- Eine normale Auswahl bleibt es (auf dem Handy öffnet sie die Auswahl des Telefons); das Suchfeld sitzt darüber. Kein eigenes Aufklappmenü, damit Tastatur und Vorlesehilfe wie gewohnt gehen.
- Ab 12 Einträgen erscheint das Suchfeld (Konstante `min`).
- Regressionstest `tests/e2e/vorrat-suche.spec.js` (erfundene Daten, 30 Teile): Suchfeld da, Liste wird kürzer, «Kein Teil gefunden», Hinzufügen klappt; Handy und Computer. `paket-h` (Vorrat) bleibt grün.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Durchklick Etappe 2: Klasse-D-Frage 4 und Design-Vorschlag b umgesetzt, für Vorrat.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Material › Vorrat öffnen, nach unten zu «Auch als Vorrat führen»: Über der Liste steht «Alle Teile durchsuchen».
2. Einen Teil des Namens tippen: Die Liste wird kurz. Teil wählen, «Hinzufügen»: Es ist ein Vorrat (mit «Rückgängig»).
