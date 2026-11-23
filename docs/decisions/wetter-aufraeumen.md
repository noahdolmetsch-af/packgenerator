# Wetterseite aufräumen

- 23.11.2026, Noah: «was fällt dir beim wetter auf?», dann «ja» zum Vorschlag in fünf Punkten (Thread «Wetter besser machen», über den Koordinator): eine einzige Regen-Startzeit für die ganze Seite, eine Kurzantwort ganz oben, Leeres ausblenden und Gleiches zusammenfassen, Kleinigkeiten (Ortsname, «−0», Überschriften), Diagramme mit Achse und Werten.
- Regel (Selbst entschieden): Open-Meteo stempelt den Regen einer Stunde (und eines Viertels) an ihrem Ende. Die Seite zählt darum den Wert mit dem Stempel 06:00 als Regen von 05:00 bis 06:00. Alle Teile nutzen dafür `src/lib/wetter/regenzeit.js`. Die ersten 3 Stunden gelten nach dem 15-Minuten-Regen, der Rest des Tages nach den Stunden.
