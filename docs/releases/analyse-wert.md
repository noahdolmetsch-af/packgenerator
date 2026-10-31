# Eine Seite für jeden Wert (Analyse M6)

PR #<offen> · 27.10.2026 · Auftrag: Noah «alle Mockups 1:1 übernehmen … mit Opus 5.5» (Thread «Umsetzen Analyse-Tool mit allen Werten»)

## Was ist neu
- Ein Tipp auf eine Kachel in Auswerten › Analyse öffnet die Seite dieses Werts (`#/auswerten/analyse/<wert>`), für jeden Wert: Fitbit, Strava, Körper, «Wi gaht's?», jede Aktiv-Aktivität.
- Zeitraum T / W / M / 3 M / J / Alles, mit ‹ › zurück und vor.
- Vier Felder: Schnitt (oder Summe), tiefster und höchster Wert mit Tag (oder Tourname), dein üblicher Bereich (mittlere Hälfte der letzten 3 Monate).
- Verlauf: Touren als Band, üblicher Bereich als Fläche, 7-Tage-Schnitt, auf Wunsch das Vorjahr daneben; bis zu 2 weitere Werte als gestrichelte Ebenen mit eigener Achse rechts (Vorschläge: Schlaf, häufigste Aktivität, Velo-km).
- Bei «T» zeigen «Puls über den Tag», «Stündliche Aktivität» und Schritte die 24 Stunden.
- Tipp auf einen Punkt oder Tag: alle Werte dieses Tages, mit Tag davor / danach.
- Pro Wochentag und die Tage (neueste zuerst) mit Spalte «Tag davor» (was du am Vortag gemacht hast).
- Die Auswahl (Zeitraum, Ebenen, Vorjahr) bleibt pro Wert gespeichert.

## Was fällt weg oder rutscht tiefer
- Ein Tipp auf eine Kachel öffnet nicht mehr direkt Körperwerte (`#/flow/stats/…`) bzw. «Haken ausgewertet»: beide sind jetzt ein Link unten auf der neuen Seite («Auch in der bisherigen Ansicht» / «Auch in «Haken ausgewertet»»).

## Selbst entschieden
- Antwort 2a hiess «Körperwerte wird die Detailansicht». Weil die Mockups 1:1 gelten (M6 mit Ebenen, Touren-Band, Tag antippen), ist die Detailseite neu gebaut; die alten Seiten bleiben erreichbar.
- Ab 120 Tagen zeigt der Verlauf Wochenpunkte (Schnitt bzw. Summe), damit er lesbar bleibt.
- «Vorjahr» = 52 Wochen früher (gleicher Wochentag).
- Höchstens 2 Ebenen auf dieser Seite; bis zu 6 Werte kommen mit «Eigenes Diagramm».

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Analyse-Tool: Detail je Wert fertig. Nächste PRs: Eigenes Diagramm (D1–D6, oben auf Analyse), Aktiv-Überblick (M2), Vergleiche (M3), Muster und Rekorde (M4), eigene Rechnungen, Filter und gespeicherte Ansichten.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auswerten › Analyse › «Ruhepuls» tippen.
2. T, W, M, 3 M, J, Alles wechseln; mit ‹ zurück.
3. «+ Schlaf» tippen, dann einen Tag in der Liste: alle Werte dieses Tages.
