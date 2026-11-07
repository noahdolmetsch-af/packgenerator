# Lange Wörter passen bei Neuland und Träumen auf den Bildschirm

PR #<Nummer> · 05.11.2026 · Auftrag: Noah (Durchklick Etappe 5, Thread «Durchklicken Etappe 5: Training und Auswerten»), Befunde E5-002 und E5-003

## Was ist neu
- Neuland: Ein sehr langes Wort in der Suche («Nichts gefunden für …») machte die Seite auf dem Handy rund 2900 px breit. Jetzt bricht das Wort um.
- Träume: Nach «Hinzufügen» steht eine Meldung mit dem Namen des Traums. Bei einem sehr langen Namen wurde die Seite auf dem Handy 674 px breit (auch die untere Leiste). Jetzt bricht der Name in der Meldung um.
- Ursache (beide): ein langes Wort ohne Umbruchstelle in einem Kasten, der nicht schmaler als sein längstes Wort werden durfte. Gleiche Art wie E2-006, E3-002, E3-004, E3-005.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Zwei kleine Stellen mit derselben Ursache in einem PR (Neuland.svelte, Dreams.svelte).

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Frontend-Durchklick Etappe 5 (Aktiv, Auswerten): Befunde E5-002 und E5-003 behoben.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auf dem Handy Touren › Träume öffnen, ein sehr langes Wort als Namen tippen, «Hinzufügen»: die Seite lässt sich nicht seitwärts schieben.
2. Neuland öffnen, ein sehr langes Wort in die Suche tippen: «Nichts gefunden für …» bleibt auf dem Bildschirm.
