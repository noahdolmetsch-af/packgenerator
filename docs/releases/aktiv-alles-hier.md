# Alles hier, ganz oben in Aktiv

PR #? · 04.11.2026 · Auftrag: Noah «1a» (03.11.2026, «Aktiv und Auswerten»), Schritt 1 von 9

## Was ist neu
- Direkt unter dem Titel von **Aktiv** steht das Feld «Alles hier» mit zehn Kacheln: Meine Sportarten, Timer, Trainingspläne, Training, Woche planen, Wochenrückblick, Meditation, Was mir gut tut, Gipfelbuch, Meilensteine.
- «Ändern»: Kacheln mit Pfeilen oder Griff verschieben, ausblenden (mit Rückgängig), wieder zeigen, «Wie am Anfang». Der Baustein stammt vom Velos-PR (`src/lib/alleshier.js`, `ui/AllHere.svelte`); hier kommt nur die Liste `aktiv` dazu.

## Was fällt weg oder rutscht tiefer
- «Gehört zu …» (GehoertDazu) fällt in Aktiv weg (Noah «4a»): Die Kacheln zeigen mehr und sind veränderbar.
- «Heute abhaken» und die Woche rutschen um das Feld nach unten (Handy etwa einen halben Bildschirm). Wer das Feld nicht braucht, blendet die Kacheln unter «Ändern» aus.

## Selbst entschieden
- Die zehn Funktionen sind die zum Tun in Aktiv; Auswertendes (Form, Ringe, Analyse) bleibt in Auswerten.
- Das Feld steht nur auf der Startseite von Aktiv, nicht auf Unterseiten.
- Kein «Alles hier» auf Auswerten: Noah hat dort die drei Gruppen gewählt (Schritt 2).
- Fertig-Regel: «Alles hier» ist ein Weg zu bestehenden Funktionen, keine neue Funktion (kein `features.js`-Eintrag, kein «Gut zu wissen»).
- Test `gehoert.test.js` und `wegweiser-gehoert-dazu.spec.js` angepasst, weil Aktiv die Zeile absichtlich nicht mehr hat.

## Stand im Plan
- Aktiv und Auswerten: Schritt 1 von 9 gebaut.

## Prüfschritte
1. Aktiv öffnen: unter dem Titel «Alles hier» mit zehn Kacheln; «Meilensteine» tippen: die Seite öffnet sich.
2. «Ändern», eine Kachel ausblenden, «Rückgängig» tippen: sie ist wieder da.
