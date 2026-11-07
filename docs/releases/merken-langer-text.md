# Merken und Heute: Ein langes Wort im To-do passt auf den Bildschirm

PR #<Nummer> · 05.11.2026 · Auftrag: Noah (Durchklick Etappe 4, Thread «Durchklicken Etappe 4: Velos und Alltag»), Befund E4-002

## Was ist neu
- Planen › Merken (Handy): Ein To-do mit einem sehr langen Wort ohne Leerzeichen (zum Beispiel 320 Zeichen: eine Internetadresse oder Bestellnummer) machte die Seite fast 1900 px breit; der Knopf «To-do hinzufügen» war dann kaum noch zu treffen. Jetzt bricht das Wort in der Zeile um.
- Heute › «Heute fällig»: Dasselbe To-do machte auch diese Zeile breiter als der Bildschirm. Jetzt endet der Text auf «…», das Feld bleibt auf Bildschirmbreite.
- Ursache: Der Zeilentext hatte keinen Umbruch, und der Listenpunkt der Marke «Heute fällig» durfte beliebig breit werden.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Nur Merken und Heute (`Merken.svelte`, `DueToday.svelte`). Die Woche und die Erinnerungen waren im Test in Ordnung.
- Regressionstest `tests/e2e/merken-langer-text.spec.js` (erfundene Daten): vorher rot, nachher grün.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Frontend-Durchklick Etappe 4 (Velos und Alltag): Befund E4-002 behoben.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Planen › Merken auf dem Handy: ein To-do mit einem langen Wort (zum Beispiel eine Internetadresse), fällig heute. Die Seite lässt sich nicht seitwärts schieben.
2. Auf Heute: die Zeile «Heute fällig» bleibt in der Bildschirmbreite.
