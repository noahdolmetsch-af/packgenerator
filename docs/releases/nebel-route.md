# Nebel auf der Tour-Route

Auftrag: Noah «1a 2b 3a 4b 5b» (Thread «Nebelgrenze beim Wetter anzeigen», Idee b nach PR Nebelgrenze).

## Was ist neu
- Tour planen › «Wetter für diese Tour»: eine Zeile zum Nebel am Starttag: «Start im Nebel (Nebelgrenze ca. 800 m), ab km 16.7 über dem Nebel.», «Start über dem Nebel …» (dazu, wie viele km der Route im Nebel liegen), «Die ganze Route bleibt im Nebel …» oder «Am Start wird kein Nebel erwartet.»
- Dazu die Zeit, zu der sich der Nebel auflöst («Der Nebel löst sich gegen 11 Uhr auf: Start dann, und die Route ist ohne Nebel.») (Noah «5b»).
- Das Höhenprofil unter der Karte zeigt den Nebel als graues Band bis zur Nebelgrenze, mit der Beschriftung «Nebel bis ca. 800 m um 9 Uhr» (Noah «4b»).
- Gilt für Touren mit Startdatum in den nächsten 3 Tagen und mit Startort oder Route (die Luftschichten reichen so weit). Sonst steht nichts da.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Die Zeile steht unter der besten Startzeit und nutzt diese Zeit als Bezug. Das Profilband nutzt 9 Uhr am ersten Tag und sagt es in der Beschriftung, weil das Profil die beste Startzeit nicht kennt.
- Die Route wird gegen die Nebelgrenze des Starts gerechnet (eine Höhe für die ganze Route, kein Verlauf entlang der Route). Die Nebelgrenze ist eine Schätzung auf etwa 200 m, wie auf der Wetterseite.
- Nutzt die gemeinsamen Luftschichten (`profil.js`), keine zusätzliche Abfrage.
- Keine neue Funktion in `features.js` und kein neuer Absprung: es gehört zu «Wetter für eine Fahrt» (`f.weather`) und zur Planen-Seite. Kein «Gut zu wissen»-Text (die Seite hat die Karte «Was du hier tun kannst» nicht für diese Zeile).

## Entscheide (für decisions.md)
- 05.11.2026: Nebel in der Tour-Planung als Zeile und Profilband, mit Startzeit-Tipp (Noah «4b 5b»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Wetter: Idee «Nebel auf der Tour-Route» umgesetzt. «Morgens-Hinweis» folgt als eigener PR.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Eine geplante Tour mit Route und Start heute oder morgen öffnen: «Wetter für diese Tour» hat eine Zeile zum Nebel.
2. Das Höhenprofil ansehen: ein graues Band reicht bis zur Nebelgrenze.
3. An einem Nebeltag mit der Realität vergleichen: stimmen «ab km …» und die Auflösungszeit ungefähr?
