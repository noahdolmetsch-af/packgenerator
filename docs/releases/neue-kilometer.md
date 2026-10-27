# Neue Kilometer

PR (diese Änderung) · 27.10.2026 · Auftrag: Noah «1-5 a» (Thread «Träume und Neuland prominent machen»), Idee N4

## Was ist neu
- Touren › Rückblick › Neuland: neuer Teil «Neue Kilometer» unten auf der Seite. Jedes Jahr mit «412 km neu · von 3210 km · 13 %» und einem Balken, darunter die letzten 5 Fahrten mit neuen km (`src/lib/neuland/NeueKm.svelte`).
- Die Regel (`src/lib/neuland/neuekm.js`): jede Velofahrt wird in Schritten von 100 m abgegangen; ein Schritt ist bekannt, wenn eine frühere Fahrt näher als 60 m vorbeiführte. Hin und zurück auf derselben Strasse zählt nur einmal.
- Die Linien sind dieselben wie in der Heatmap: Strava, GPX-Dateien, eigene Aufzeichnungen. Läufe und Wanderungen zählen nicht.
- Neue Funktion im Katalog: `f.newkm`.

## Was fällt weg oder rutscht tiefer
- nichts (der neue Teil steht ganz unten auf der Neuland-Seite)

## Selbst entschieden
- 60 m Abstand statt der Heatmap-Quadrate (2,4 km): so zählt eine Parallelstrasse als neu, ein GPS-Zittern auf derselben Strasse nicht.
- Auf Neuland statt auf Heute oder Träume: es ist ein Rückblick-Wert.
- Nichts wird gespeichert; die Zahl wird beim Öffnen gerechnet.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- «Träume und Neuland»: Schritt 8 von 20 (N4). Als Nächstes N3 «Heute passt: Ausflugstipps».

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Rückblick › Neuland öffnen und ganz nach unten scrollen.
2. «Neue Kilometer»: jedes Jahr zeigt neue km, alle km und den Anteil.
3. Darunter die letzten Fahrten mit neuen km; «Heatmap» öffnet die Heatmap.
