# Neuland liest die Strava-Linien

Auftrag: Noah 21.11.2026 «Neuland und Heatmap scheinen unterschiedliche Daten zu nutzen. was läuft hier falsch?» (Thread «Fix Neuland und Heatmap mit gleichen Daten»).

## Was ist neu
- Fehler: Strava speichert die Linie einer Fahrt als einen verschlüsselten Text (summary_polyline). Die Heatmap las ihn, Neuland nicht: für Neuland zählten Strava-Fahrten gar nicht (die Linie war «leer», ein Start- oder Endpunkt ist nicht gespeichert). Neuland sah nur GPX-Fahrten, Tour-Routen und Gipfelbuch.
- Neuland (und alles, was darauf aufbaut: «Neu heute» auf Heute, Fundliste, Sammel-Wand, Traumtouren-Karte, Wege hierher, Neue Kilometer-Zeilen) liest jetzt dieselben Linien wie die Heatmap: Strava-Linien, GPX-Fahrten, Aufzeichnungen der App.
- Test mit einer Kopie von Noahs Backup vom 21.11.2026 (nur lokal, nichts im Repo): vorher 24 Linien, nachher 1393; Gemeinden 103 → 849, Kantone 11 → 25, Pässe 5 → 37, Seen 7 → 34, Länder 1 → 12. Die Berechnung dauert rund 1 Sekunde.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Beide Seiten bleiben in einem Punkt unterschiedlich, mit Absicht: Neuland zählt auch die geplante Route einer Tour ab ihrem Starttag (so war es immer, steht in der Anleitung); die Heatmap zeichnet nur wirklich gefahrene Linien.
- Aufzeichnungen der App zählen in Neuland auch an Tagen mit Strava-Linie (für «gefunden» spielt doppelt keine Rolle); die Heatmap zeichnet sie dort nicht doppelt.
- Von Hand gesetzte Haken und «nicht dort» bleiben unverändert; neu gefundene Orte kommen nur dazu.

## Stand im Plan (roadmap.md / vorhaben.md)
- Nichts ändert sich im Plan.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Neuland öffnen: Gemeinden, Kantone, Pässe und Seen zeigen höhere Zahlen als vorher.
2. Heatmap öffnen und eine Fahrt antippen, dann in Neuland einen Ort entlang dieser Fahrt öffnen: «Warum zählt das?» nennt diese Fahrt.
