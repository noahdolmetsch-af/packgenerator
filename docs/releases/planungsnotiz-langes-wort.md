# Planungs-Notizen: Ein langes Wort bleibt in seiner Zeile

PR #<Nummer> · 05.11.2026 · Auftrag: Noah (Durchklick Etappe 2, Thread «Durchklicken Etappe 2: Touren und Material»), Befund E2-006

## Was ist neu
- Tour › Packen › Planungs-Notizen: Eine Notiz mit einem sehr langen Wort (zum Beispiel ein eingefügter Link) machte die ganze Seite breiter als den Bildschirm. Auf dem Handy rutschten der Knopf «Alles gepackt, los» und das × aus dem Bild. Jetzt bricht das Wort in seiner Zeile um.
- Ursache: Die Zeilen sind Teil eines Rasters und waren nie schmaler als das längste Wort (gleiche Ursache wie bei «Packliste aufräumen», E2-001).

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Nur diese Liste in diesem PR (eine Zeile CSS). Regressionstest `tests/e2e/planungsnotiz-langes-wort.spec.js` (erfundene Daten): vorher rot (Seite 1298 px breit auf dem Handy), nachher grün.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Frontend-Durchklick Etappe 2 (Touren und Material): Befund E2-006 behoben.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auf dem Handy eine Tour › Packen öffnen, eine Planungs-Notiz mit einem sehr langen Wort tippen und «Hinzufügen»: Die Notiz bricht in Zeilen um, die Seite lässt sich nicht seitwärts schieben.
2. «Alles gepackt, los» und das × der Notiz sind sichtbar.
