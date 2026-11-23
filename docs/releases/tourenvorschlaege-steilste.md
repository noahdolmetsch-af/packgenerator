# Tourenvorschläge: die steilsten Stücke

PR (Nummer nach dem Öffnen) · 23.11.2026 · Auftrag: Noah «1-5a» (Idee B des Höhenprofil-Auftrags, Thread «100 kluge MTB-Touren vorschlagen»).

## Was ist neu
- **Die steilsten Stücke:** unter dem Höhenprofil einer vorgeschlagenen Tour stehen bis zu drei Anstiege ab 12 %, mit km-Bereich, Schnitt, höchster Steigung und Höhenmetern (`src/lib/map/steilste.js`, für alle Seiten mit Höhenprofil nutzbar; gerechnet aus den Höhen alle 100 m über Fenster von etwa 250 m).
- **Ein Tipp** färbt das Stück auf der Karte dunkelrot (weiss eingerahmt), die Karte und das Profil zoomen hinein; ein zweiter Tipp geht zurück zur ganzen Tour.
- Ist nichts steiler als 12 %, steht ein ruhiger Satz: «Kein Stück ist steiler als 12 %. Du kannst alles fahren.»

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Mehrere Fenster hintereinander werden zu einem Stück; fällt der Schnitt eines solchen Stücks unter 12 %, zählt nur das steilste Fenster darin.
- Nur Anstiege zählen (bergab fährt man, bergauf schiebt man).
- Leerer Zustand als ruhiger Satz statt grosser Karte, weil er unter dem Profil steht (Inhalt zuerst).
- Die Grenze 12 % steht als `STEEP_PCT` in `steil.js` (Noah «1-5a»).

## Entscheide (eigene Datei `docs/decisions/tourenvorschlaege-steilste.md`)
- 23.11.2026: 12 %, drei Stücke, nur auf der Seite der Tourenvorschläge.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Tourenvorschläge › eine Tour öffnen: unter dem Profil steht «Die steilsten Stücke».
2. Eines antippen: es wird auf der Karte dunkelrot, das Profil zoomt hinein. Nochmals antippen: zurück.
3. Am Handy: die Zeilen brechen um und passen in die Breite.
