# Lange Wörter passen im Gipfelbuch und bei deinen Fragen auf den Bildschirm

PR #<Nummer> · 05.11.2026 · Auftrag: Noah (Durchklick Etappe 5, Thread «Durchklicken Etappe 5: Training und Auswerten»), Befunde E5-004 und E5-005

## Was ist neu
- Gipfelbuch: Eine lange Notiz (bis 200 Zeichen) machte die Seite auf dem Handy mehr als vier Mal so breit wie den Bildschirm; die untere Leiste rutschte mit. Jetzt bricht die Notiz um. Ebenso der Name im Kopf der Ortsansicht, die Sportart-Zeile und die Meldung «… ist im Gipfelbuch».
- Deine Abfragen: Der Name einer eigenen Frage (bis 120 Zeichen) machte die Seite auf dem Handy 974 px breit. Jetzt bricht der Name in seiner Zeile um; die Zeile bleibt in der Bildschirmbreite.
- Ursache: ein langes Wort ohne Umbruchstelle in einem Kasten (Gitter mit «auto»-Spalte oder Absatz ohne Umbruchregel), der nicht schmaler als sein längstes Wort werden durfte. Gleiche Art wie E5-001 bis E5-003.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Zwei Seiten mit derselben Ursache in einem PR (Gipfelbuch.svelte, Abfragen.svelte).
- Nicht übernommen: Der Befund «Eigener Schnellstart» beim Timer (E5-006) liess sich nicht wiederholen: die 400 px kamen von der festen unteren Leiste, nicht vom Namen.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Frontend-Durchklick Etappe 5: Befunde E5-004 und E5-005 behoben.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auf dem Handy das Gipfelbuch öffnen, «Ort von Hand eintragen», ein einziges sehr langes Wort als Notiz, «Speichern»: die Seite lässt sich nicht seitwärts schieben.
2. Ich › Deine Abfragen, «Eigene Frage anlegen», ein einziges sehr langes Wort als Namen, «Speichern»: die Zeile bleibt auf dem Bildschirm.
