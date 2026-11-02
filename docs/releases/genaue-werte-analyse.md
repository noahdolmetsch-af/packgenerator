# Genaue Werte in allen Analyse-Diagrammen

PR #<offen> · 27.10.2026 · Auftrag: Noah «die Diagramme sollen exakte Daten zeigen, nicht nur Schätzungen anhand ungenauer Skalen am Rand» (A1–A6, A11, A12, und überall)

## Was ist neu
- Alle Diagramme in Analyse nutzen den Baustein aus `src/lib/charts/` (PR «Genaue Werte: gemeinsamer Achsen-Baustein»):
  - Seite je Wert: Achse mit runden Stufen und Einheit, Gitterlinien, eine zweite Linie mit eigener Achse rechts. Ein Tipp zeigt Tag und genauen Wert, bei bis zu 12 Punkten steht die Zahl am Punkt.
  - Eigenes Diagramm: jede Zeile mit beschrifteten Stufen (Schlaf in Stunden), «Übereinander» mit Prozent-Stufen.
  - Was hängt zusammen: beide Achsen mit Stufen, der genaue Wert pro Punkt beim Darüberfahren.
  - Überblick: Haken pro Woche mit Achse, Tipp zeigt die Woche und den Schnitt; bis 12 Wochen die Zahl an der Säule.
  - Vergleiche: Achse, Tipp zeigt beide Zeiträume am selben Tag bzw. jede Aktivität in der Woche.
  - Muster: Jahr gegen Jahr mit Achse, Tipp zeigt beide Jahre im Monat; am Handy Monate als Buchstaben.
  - Velo-km: Achse in km, Punkte, Tipp zeigt die km jedes Velos in der Woche.
  - Tagesbild: Puls links, Schritte rechts mit Stufen, Tipp zeigt die Werte der Stunde; etwas höher.

## Was fällt weg oder rutscht tiefer
- Die Zahlen nur oben und unten am Rand (höchster/tiefster Wert) fallen weg, statt dessen runde Stufen.
- Über den Diagrammen von Velo-km, Überblick und Vergleiche steht neu eine Zeile mit den Werten der getippten Woche bzw. des Tages; das Diagramm rutscht um diese Zeile tiefer.

## Selbst entschieden
- Ohne Tipp zeigt die Zeile die neuste Woche bzw. den neusten Tag.
- Bei mehreren Linien keine Zahlen an den Punkten (zu dicht), dafür die Zeile oben.

## Entscheide (für decisions.md)
- siehe «Diagramme zeigen genaue Werte» (27.10.2026).

## Stand im Plan (roadmap.md / vorhaben.md)
- Analyse-Tool: alle Diagramme mit genauen Werten. Andere Seiten folgen in den Threads, die sie besitzen.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auswerten › Analyse › «Velos: km und Verschleiss»: links 0, 50, 100 … km.
2. Dort auf eine Woche tippen: darüber stehen die km jedes Velos.
3. Kachel «Ruhepuls» tippen, dann einen Tag im Diagramm: der Wert mit bpm erscheint.
