# Suche: Themen in deiner Sprache, Felder mit Namen

PR folgt · 25.11.2026 · Auftrag: Noah «Alle B und C weitergeben» (Gesamttest Runde 2, Befunde C1 und C2; Thread «Suche vereinen»)

## Was ist neu
- **C2:** Eine Erkenntnis in der Suche zeigt ihr Thema jetzt in der Sprache der App (aus «Sleep» wird «Schlaf», aus «Bike» «Velo», aus «Pace» «Tempo»), gross geschrieben, wie auf der Seite «Gelernt». Die Suche findet die Erkenntnis auch mit dem deutschen Wort. Beide Orte nutzen jetzt dieselbe kleine Funktion (`src/lib/review/topicname.js`).
- **C1:** Das Suchfeld am Ort (Ich, Auswerten, geteilte Komoot-Routen, Touren) hat jetzt einen Namen für Screenreader (`aria-label`), nicht nur den grauen Hinweistext.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Die Funktion `topicName` ist aus `Learned.svelte` in eine eigene Datei gewandert, damit Seite und Suche dasselbe Wort zeigen (kein zweites Exemplar, das auseinanderläuft).
- Eine Erkenntnis ohne Thema zeigt in der Suche weiter nichts (nicht «Ohne Thema»), und die Suche findet sie nicht über «Ohne Thema».
- Nichts Sichtbares auf der Suche-Oberfläche selbst: der Unterschied ist das Thema-Wort in der Zeile (Bild) und der Name des Feldes (nur für Screenreader).
- Keine Datenänderung, kein Backup, kein `api/`.

## Entscheide (eigene Datei `docs/decisions/suche-feinschliff.md`)
- 25.11.2026: Noah gibt die kleinen Funde C1 und C2 aus dem Gesamttest weiter (Knopf «Alle B und C weitergeben»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Klarheit und Auffindbarkeit: zwei kleine Funde der Suche behoben; Plan unverändert.
