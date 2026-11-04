# Dein Velo zeigt seine Pflege

PR folgt · 03.11.2026 · Auftrag: Noah «b» (alle 5 Ideen von «Paket C: Das Velo lebt»; Thread «Durchgehen: offene Fragen einzeln»), Idee 22

## Was ist neu
- Velos › Übersicht: Jede Velo-Karte zeigt ein kleines gezeichnetes Velo.
- Es glänzt (kleine Sterne) bis 7 Tage nach Putzen, Ölen, Service, Teilewechsel oder einer erledigten Reparatur.
- Ab 45 Tagen ohne eingetragene Pflege liegt Staub darauf, ab 90 Tagen hängt zusätzlich eine Spinnwebe am Rad. Eine Zeile sagt, seit wie vielen Tagen.
- Ohne jeden Eintrag sieht das Velo normal aus (es gibt nichts zu beurteilen, also nie «staubig» aus Unwissen).
- Der Wechsel blendet in einer halben Sekunde ein; bei «Bewegung reduzieren» am Gerät ohne Bewegung.

## Was fällt weg oder rutscht tiefer
- nichts. Die Karte wird um das Bild höher (96 px breit, oben).

## Selbst entschieden
- Als Pflege zählen: Putzen, Service, Wechsel, erledigte Reparatur, Service des ganzen Velos. Ein reiner Check und «Arbeit nötig» zählen nicht (sie sind keine Pflege).
- Die Grenzen 7 / 45 / 90 Tage sind ein Vorschlag im Code (`src/lib/bikes/pflegezustand.js`), noch nicht einstellbar.
- Nur auf der Velo-Karte in Velos; Heute und die Pflegeseite zeigen das Bild nicht (kleine PRs).
- Keine neue Funktion im Sinn der Fertig-Regel (Ansicht einer bestehenden Karte): kein eigener Eintrag in `features.js`.
- `docs/app-stand.md` liegt noch nicht in `main`; die Zeile zur Velo-Karte kommt dazu, sobald die Datei da ist.

## Entscheide (für decisions.md)
- 03.11.2026: Noah «b» – Paket C «Das Velo lebt» wird ganz gebaut, in der Reihenfolge 22, 21, 12, 17, 16, je ein PR.

## Stand im Plan (roadmap.md / vorhaben.md)
- «Neuer Schwung» / Velo-Momente: Idee 22 gebaut.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Velos öffnen: Jede Karte zeigt ein kleines gezeichnetes Velo.
2. Bei einem Velo eine Pflege eintragen (geputzt, Kette geölt): das Velo glänzt, die Karte sagt «Zuletzt gepflegt».
3. Ein Velo, bei dem lange nichts eingetragen ist: Staub, und die Zeile nennt die Tage.
