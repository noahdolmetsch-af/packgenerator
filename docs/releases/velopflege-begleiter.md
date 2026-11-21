# Inspektions-Begleiter

PR folgt · 21.11.2026 · Auftrag: Noah «1a 2a 3a 4a 5a» (Thread «Velopflege zum Inspektions-Begleiter machen»), Schritt C von A–E

## Was ist neu
- Die Inspektion (`src/lib/inspect/InspectRun.svelte`) führt jetzt durch den Check:
  1. **Das brauchst du**: alle Werkzeuge des Checks in einer Liste zum Antippen (nur für dich, es wird nichts gespeichert), dazu «Das schaust du zuerst an» aus dem letzten Check.
  2. **Ein Punkt pro Schritt**: Anleitung, Tipp, «Wann zur Werkstatt», «Letztes Mal» und bei Messpunkten (Kette, Beläge) die Rechnung «noch etwa N km bis zur Grenze»; «Zurück» und «Weiter».
  3. **Zusammenfassung**: was in Ordnung ist, was einen Blick braucht, was zu tun ist (To-dos), ausgelassene Punkte mit Sprung zum ersten; «Fertig · speichern» wie bisher.
- «Alle Punkte als Liste» zeigt weiter die bisherige Liste, jederzeit erreichbar.
- Keine neue Datenhaltung: gespeichert wird wie bisher das Ergebnis je Punkt.

## Was fällt weg oder rutscht tiefer
- Die Liste aller Punkte ist nicht mehr die erste Ansicht eines Checks. Sie ist über «Alle Punkte als Liste» (auf dem ersten Schritt und in jedem Schritt) erreichbar. Alles andere bleibt.

## Selbst entschieden
- Keine neue Funktion in `features.js`: Der Begleiter ist die neue Ansicht der bestehenden Funktion «Veloinspektion» (`f.inspect`). Teil 1, 2, 3 und 6 der Fertig-Regel bestehen dort schon («Gut zu wissen» zu `f.inspect`), Teil 4 (leere Ansicht) entfällt, weil ein Check immer Punkte hat, Teil 5 (Als Nächstes) ist die Zusammenfassung.
- Die Werkzeug-Häkchen werden nicht gespeichert, weil sie nur beim Bereitlegen helfen.
- Texte mit gleichem Englisch wie bestehende Knöpfe («Finish», «Next») haben einen eigenen Schlüssel `|step`, damit die deutschen Texte der alten Stellen unverändert bleiben.

## Entscheide (für decisions.md)
- 21.11.2026: Der Begleiter führt Punkt für Punkt, die Liste bleibt als Ausweg (Noah «2a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Velopflege-Begleiter: Schritte A und C gebaut, B, D, E offen.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Velos › Pflege › Inspektion: einen Schnellcheck starten. Der erste Schritt zeigt das Werkzeug.
2. «Los geht’s» tippen und mit «Weiter» durch die Punkte gehen; bei der Kette steht «noch etwa N km», wenn ein Messwert da ist.
3. Am Ende die Zusammenfassung lesen und «Fertig · speichern» tippen.
