# Tests schneller, volle Prüfung stündlich

PR (diese Änderung) · 28.10.2026 · Auftrag: Noah «1a 2b 3a» (Thread «Verbessern Weg von gebaut zu online»)

## Was ist neu
- Nichts in der App. Auf GitHub prüft jeder Test-Computer bei den Handy-Tests 3 Tests gleichzeitig statt 2. Es laufen dieselben Tests wie vorher, nur schneller (1a).
- Vor dem Merge laufen weiter alle Handy-Tests (2b).
- Die grosse Computer-Prüfung und der Gesamttest laufen nicht mehr nach jedem Merge. Sie laufen höchstens einmal pro Stunde, und nur wenn seit der letzten Prüfung etwas gemergt wurde, dazu jede Nacht alles (3a). Bei vielen Merges hintereinander werden so etwa 6 Test-Computer frei.

## Was fällt weg oder rutscht tiefer
- Die volle Prüfung direkt nach jedem Merge. Sie kommt jetzt höchstens eine Stunde später (Noah «3a»).

## Selbst entschieden
- Die App wird für die Handy-Tests weiterhin in jedem Teil gebaut. Das Bauen dauert nur etwa 30 Sekunden. Ein eigener Bau-Schritt müsste zuerst auf einen freien Computer warten und wäre darum langsamer.
- Die stündliche Prüfung läuft zur Minute 37. Fällt eine Prüfung aus (abgebrochen), versucht sie es in der nächsten Stunde noch einmal.

## Entscheide (für decisions.md)
- 28.10.2026: Handy-Tests mit 3 gleichzeitig, vor dem Merge weiter alle, volle Prüfung stündlich und nachts.

## Stand im Plan (roadmap.md / vorhaben.md)
- Verschlanken (Tests und Tempo): kürzere Wartezeit pro PR.

## Prüfschritte (nach dem Merge)
1. Nichts in der App anzuschauen.
2. Unter github.com/noahdolmetsch-af/packgenerator/actions läuft «Volle Prüfung» höchstens einmal pro Stunde.
