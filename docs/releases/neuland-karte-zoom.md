# Neuland: Karte zoomen und Liste kürzen

PR (Nummer folgt beim Öffnen) · 27.11.2026 · Auftrag: Noah «1 2 3 4 5 6 7» (27.11.2026 17:32) zu «Neuland verbessern; insb. muss die Karte wirklich ausgezeichnet sein mit Zoomfunktion» (Thread «Neuland-Seite verbessern»). Dies ist das erste von drei Paketen: Punkte 1 und 2.

## Was ist neu
- Die Karte in Neuland (und im Gipfelbuch, sie ist dieselbe Karte, `src/lib/neuland/NeulandMap.svelte`) lässt sich zoomen: Knöpfe + und −, «Ganze Karte», Mausrad mit Ctrl (auf dem Trackpad: zwei Finger auseinander), zwei Finger am Handy, doppeltes Tippen, mit der Maus oder einem Finger ziehen, Tasten + − 0 und Pfeile. Ein gewöhnliches Scrollen über der Karte scrollt weiter die Seite und zeigt kurz den Hinweis «Zum Zoomen: Ctrl und scrollen, oder zwei Finger». Rechnung in `src/lib/neuland/kartezoom.js`, geprüft in `tests/kartezoom.test.js`.
- Punkte und Namen bleiben beim Zoomen ungefähr gleich gross. Ab Zoom 2,5 tragen die Punkte ihre Namen; ein Name, der einen anderen decken würde, bleibt weg und erscheint bei mehr Zoom.
- Neben jedem Eintrag der Liste steht eine Nadel «Auf der Karte zeigen»: die Karte zoomt auf den Eintrag und markiert ihn; am Handy scrollt die Seite zur Karte (`data-nl-locate`).
- Ein Knopf «Ganzer Bildschirm» füllt den Bildschirm mit der Karte (Kopfzeile mit Schliessen, Escape schliesst).
- Die Liste unter der Karte zeigt zuerst die 10 neuesten Einträge, dann «Alle zeigen (n)» (vorher 30).

## Was fällt weg oder rutscht tiefer
- Von den ersten 30 Einträgen der Liste sind nur noch die ersten 10 sichtbar; die übrigen kommen mit «Alle zeigen».

## Selbst entschieden
- Mausrad zoomt nur mit Ctrl (Trackpad-Pinch zählt dazu), damit sich die lange Seite weiter scrollen lässt, wenn der Zeiger über der Karte steht.
- Am Handy bewegt ein Finger die Karte erst, wenn sie hineingezoomt ist; bei der ganzen Karte scrollt er die Seite. Zoomen geht dort mit +, doppeltem Tippen oder zwei Fingern.
- Ein Wechsel der Sammlung beginnt wieder mit der ganzen Karte; Abhaken eines Eintrags behält den Zoom.
- Punkt 3 («7 schwebende Knöpfe rechts»): kein Fehler der App. Die zwei runden Knöpfe stammen aus Noahs Browser (Erweiterung), sie erscheinen auch auf der Seite «Assistent» und in der App gibt es dort kein solches Element; beim Ganzseiten-Screenshot werden sie wiederholt. Nichts gebaut.
- Fertig-Regel: keine neue Funktion, sondern Ausbau der Karte von `f.neuland`; Absprung, Hilfe und leerer Zustand bleiben wie sie waren.

## Entscheide (eigene Datei `docs/decisions/neuland-karte-zoom.md`)
- 27.11.2026: Noah «1 2 3 4 5 6 7».

## Stand im Plan
Dient «Klarheit» und «Auffindbarkeit» (Block 1): die Karte wird benutzbar statt Bild. Kein Plan geändert.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Neuland › Alpenpässe: dreimal «+» an der Karte, sie zoomt hinein, Namen erscheinen.
2. Die Karte ziehen: sie bewegt sich; «Ganze Karte» springt zurück.
3. In der Liste die Nadel eines Passes antippen: die Karte springt dorthin.
4. «Ganzer Bildschirm»: die Karte füllt alles, Escape oder das Kreuz schliesst.
5. Die Liste zeigt 10 Einträge und «Alle zeigen».
