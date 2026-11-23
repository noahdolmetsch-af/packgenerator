# Speicher auf diesem Gerät messen

PR · 23.11.2026 · Auftrag: Noah «Die app ist 8gb gross. Mach 1 gb daraus ohne verluste» (Thread «Speicher der App auf 1 GB senken»)

## Was ist neu
- Ich › Daten: Karte «Speicher auf diesem Gerät». Ein Tipp misst, was die App im Browser speichert: Zwischenspeicher (App-Dateien, Kartenkacheln, Offline-Karten, KI-Modelle) und die Datentabellen. Nur lesen, nichts wird geändert.
- Die Karte sagt in einem Satz, ob die grosse Zahl echter Platz ist oder nur Chromes Aufschlag für Kartenbilder, und hat eine Zeile zum Kopieren.

## Warum
Messung im Chromium-Test: 20 Kartenbilder von einer fremden Website (25 KB, «opaque») zählt Chrome mit 166 MB (rund 8 MB je Bild); dieselben Bilder mit CORS geladen nur 0,5 MB. Die App behält bis zu 800 + 600 solche Kacheln (`vite.config.js`, `swisstopo-tiles`, `osm-tiles`, Status 0 erlaubt) – das ergibt 8 bis 11 GB in `navigator.storage.estimate()` und in Androids Seiteneinstellungen. Der nächste PR lädt die Kacheln lesbar (CORS) und räumt die alten nach.

## Was fällt weg oder rutscht tiefer
- nichts (neue Karte unten in der rechten Spalte von Ich › Daten, über dem Tempo-Messer)

## Selbst entschieden
- Messung nur auf Tipp, nicht beim Öffnen (liest alle Einträge der Zwischenspeicher).
- Fertig-Regel: Teil von «Daten und Backup» (eigene Zeile in `docs/app-stand.md`), kein eigener Absprung nötig; Leerzustand ist der Knopf selbst.

## Entscheide
- keine

## Stand im Plan
- Speicher senken: Schritt 1 von 2 (messen), Schritt 2 Kacheln schlank.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Daten öffnen, «Speicher messen» tippen.
2. Auf dem Handy: die Liste zeigt Kartenkacheln mit «nicht lesbar» und einen Satz zu Chromes Aufschlag.
3. «Zeile kopieren» und Noah schickt sie in den Chat.
