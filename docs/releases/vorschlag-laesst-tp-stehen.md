# Ein Vorschlag lässt deine TrainingPeaks-Einheiten stehen

PR #1783 · 23.11.2026 · Auftrag: Noah «5a» (Thread «Wochenplan-Vorschläge verlässlich machen»)

## Was ist neu
- «Woche vorschlagen › Übernehmen» ersetzt nur noch die eigenen Einheiten und alten Vorschläge ab heute. Einheiten aus TrainingPeaks bleiben an ihrem Tag (`planAfterSuggestion` in `src/lib/training/suggest.js`).
- Der Knopf sagt «ersetzt die geplanten Tage» nur, wenn etwas Eigenes zu ersetzen da ist.

## Warum
Befund vom 23.11.2026: «Übernehmen» entfernte alle Einheiten der Woche ab heute, auch die aus TrainingPeaks. Der Abruf von TrainingPeaks hält eine entfernte Einheit für «von Hand entfernt» (`mergeFeed`) und holt sie nicht zurück. Dazu setzte der Wochenplan danach Velo draussen und drinnen neu: Velo doppelt.

## Was fällt weg oder rutscht tiefer
- nichts. Wer eine TrainingPeaks-Einheit nicht will, löscht sie wie bisher in «Meine Woche» von Hand.

## Selbst entschieden
- Kein neues Feld, kein Dexie-Schema, kein `api/`: die Änderung steht nur in der Liste, die «Übernehmen» schreibt.
- Der Vorschlag selbst bleibt unverändert; dass er neben TrainingPeaks eigene Velo-Einheiten vorschlagen kann, behebt der Schritt «Woche vorschlagen folgt dem Wochenplan» (Noah «3a»).

## Entscheide (eigene Datei `docs/decisions/vorschlag-laesst-tp-stehen.md`)
- 23.11.2026: «Übernehmen» lässt TrainingPeaks stehen (Noah «5a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- «Wochenplan-Vorschläge verlässlich machen»: Schritt 1 von 6 (danach Eishockey aus Spielerplus, Soll mit TrainingPeaks, ein Vorschlag, Soll-Anzeige, Vorlagen).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Training › Woche: «Woche vorschlagen», dann «Übernehmen».
2. Die Einheiten mit «TP» stehen weiter in der Woche; «Rückgängig» bringt den alten Plan zurück.
