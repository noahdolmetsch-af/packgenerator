# Analyse übersichtlicher

23.11.2026 · Auftrag: Noah «ja» (Thread «Analyse-Seite viel besser machen»)

- Die Verbesserungen an Auswerten › Analyse (Übersicht und Eigenes Diagramm) kommen in einem PR, nicht in einzelnen (Noah «ja» auf den Vorschlag der Projektleitung; passt zu «wenige PRs, gebündelt», 23.11.2026).
- Die Auswahl (Was, Wie lange, Filter und Ansicht) steht im Eigenen Diagramm über dem Diagramm, nicht mehr darunter (ersetzt den Schritt «Auswerten in fünf Reiter, Schritt 12b»: erst das Diagramm, dann die drei Auswahlen).
- Zwei Aktiv-Einträge mit gleichem Namen zählen in der Rangliste als eine Zeile; die Daten werden nicht verändert.
- Selbstverständliche Paare (gleiche Grösse anders gemessen) stehen nicht in der Liste der stärksten Zusammenhänge; die Familien stehen in `src/lib/analyse/links.js` und sind änderbar.
- Testeinträge in den Touren werden nie automatisch gelöscht: sie werden Noah zum Löschen vorgeschlagen.
- Analyse zählt wie Heute › Diese Woche alle Sportarten: Haken aus Aktiv und Strava-Sportarten ohne Haken (ein Haken mit Strava-Aktivität zählt einmal; Velofahrten über ihre Haken). Folgt dem Entscheid vom 22.11.2026 «alle Sportarten».
