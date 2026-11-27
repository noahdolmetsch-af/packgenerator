# Ein Wochenziel statt zwei

26.11.2026 · Auftrag: Noah «Ja» (26.11.2026 18:11) auf die Frage «ohne etwas zu verlieren» (Thread «Wochenplan-Vorschläge verlässlich machen»)

- Zwei Stundenziele widersprachen sich sichtbar: das Trainingsziel (`training.goal`, bei Noah 10 Std., Ende 24.10.2026, also schon vorbei) und die Stunden des Wochenplans (`training.weekplan`, 15 Std.).
- **Regel:** Ist ein Wochenplan gespeichert, zählen dessen Stunden (`weekHours` in `wochenplan.js`); sonst zählen die Stunden des Trainingsziels, solange sein Tag nicht vorbei ist. Ein Ziel mit vergangenem Tag bleibt gespeichert und unverändert, zählt aber nicht mehr (Anzeige «endete am …» statt «noch 0 Wochen»). Nichts wird gelöscht oder überschrieben.
- Gilt auf Training › Woche (Zielstrich, «Diese Woche … von … Std.», «Dein Stand»), den Wochenseiten (Woche, Tag, Woche planen) und «Geschafft». `Sportjahr` hat sein eigenes Ende-Datum und bleibt unverändert.
- **Alte «Woche vorschlagen»-Logik (`SuggestWeek.svelte`):** bleibt. Geprüft: Sie erscheint nur ohne gespeicherten Wochenplan; Noahs Tageslimits (`training.days`) und Gewohnheiten (`training.habits`) sind leer. Sie zu entfernen träfe 19 Testdateien und Nutzer ohne Wochenplan; ein Umzug von Tageslimits in den Wochenplan wäre ein eigener Planer-Schritt («freier Tag»), nur auf Noahs Wunsch.
