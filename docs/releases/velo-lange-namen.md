# Velopflege: Ein langer Velo-Name passt auf den Bildschirm

PR #<Nummer> · 05.11.2026 · Auftrag: Noah (Durchklick Etappe 4, Thread «Durchklicken Etappe 4: Velos und Alltag»), Befund E4-001

## Was ist neu
- Velopflege (Handy): Hat ein Velo einen langen Namen (zum Beispiel 70 Zeichen mit Leerzeichen), wurde die ganze Seite breiter als der Bildschirm (651 statt 390 px). Der Name stand in der Problemliste in einer Marke, die nicht umbrach, und in der Auswahl «Alle Velos» passte sich das Feld dem längsten Namen an. Jetzt brechen Marke und Velo-Knöpfe den Namen um, das Auswahlfeld bleibt auf Bildschirmbreite.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Nur die Velopflege (`ProblemList.svelte`, `GriffHead.svelte`): dort ist es der gemessene Fehler. Ein Name aus 120 Zeichen ohne ein einziges Leerzeichen schiebt weiter einzelne Velo-Seiten zur Seite (Velos, Pflege-Titel «Vor der Fahrt», Verschleiss, Inspektion, Werte erfassen). Das ist im Bericht der Etappe vermerkt und nicht geändert, weil so ein Name nicht vorkommt.
- Regressionstest `tests/e2e/velo-lange-namen.spec.js` (erfundene Daten): vorher rot, nachher grün.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Frontend-Durchklick Etappe 4 (Velos und Alltag): Befund E4-001 behoben.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ein Velo mit langem Namen (70 Zeichen) anlegen oder umbenennen, dann Velos › Pflege auf dem Handy öffnen: Die Seite lässt sich nicht seitwärts schieben.
2. In der Problemliste (wenn eine Panne eingetragen ist) und in der Reihe der Velo-Knöpfe bricht der Name in Zeilen um.
