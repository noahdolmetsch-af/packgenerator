# Packliste aufräumen: lange Namen passen auf den Bildschirm

PR #<Nummer> · 05.11.2026 · Auftrag: Noah (Durchklick Etappe 2, Thread «Durchklicken Etappe 2: Touren und Material»), Befund E2-001

## Was ist neu
- Bausteine › Packliste aufräumen: Hat ein Teil einen langen Namen (zum Beispiel eine Geldbörse mit Aufzählung in Klammern), wurde die ganze Seite auf dem Handy etwa 20 px breiter als der Bildschirm und der Text am rechten Rand war abgeschnitten. Jetzt bricht der Name in seiner Zeile um; Pfeile und × bleiben rechts.
- Ursache: Die Kästen der Seite waren Teil eines Rasters und nie schmaler als das längste Wort einer Zeile. Sie bleiben jetzt auf Bildschirmbreite.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Nur diese Seite in diesem PR (gleiche Ursache, eine Datei). Ob andere Seiten bei langen Namen ähnlich reagieren, hat der Durchlauf mit langen Namen geprüft; dort gab es keinen weiteren Fund.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Frontend-Durchklick Etappe 2 (Touren und Material): Befund E2-001 behoben.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auf dem Handy Bausteine › Packliste aufräumen öffnen: Die Seite lässt sich nicht seitwärts schieben, alle Wörter sind ganz zu lesen.
2. Bei «Immer dabei» steht jeder Name in seiner Zeile, Pfeile und × sind sichtbar.
