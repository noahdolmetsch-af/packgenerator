# Kartenkacheln zählen, was sie wiegen

PR · 23.11.2026 · Auftrag: Noah «Die app ist 8gb gross. Mach 1 gb daraus ohne verluste» (Thread «Speicher der App auf 1 GB senken»)

## Was ist neu
- Alle Kartenbilder von swisstopo und OpenStreetMap (Leaflet-Karten, Tour-Karte, Heatmap, Mini-Karten) werden mit CORS geladen (`crossorigin="anonymous"`). Chrome zählt sie dann mit ihrer echten Grösse (~25 KB) statt mit ~8 MB je Kachel.
- Früher gemerkte Kacheln (`swisstopo-tiles`, `osm-tiles`) lädt die App 20 s nach dem Start im Leerlauf einmal auf diese Art neu und ersetzt die alte Kopie (`src/lib/tilediet.js`): 2 gleichzeitig, mit Pause, nur online, nicht bei «Datensparen». Keine Kachel geht verloren; eine, die der Server nicht mehr hat (404), fällt weg.
- Workbox merkt «opaque» Antworten nicht mehr (`statuses: [200]`) und gibt eine alte opaque Kopie nie an eine CORS-Anfrage (sonst würde der Browser sie ablehnen).

## Warum (gemessen)
Im Chromium-Test mit 30 opaque Kacheln: 229 MB vor, 31 MB nach dem Neuladen (die 31 sind die App-Dateien); 30 Einträge blieben, 0 opaque. swisstopo antwortet mit `access-control-allow-origin: *`.

## Was fällt weg oder rutscht tiefer
- nichts. Offline-Karten (`pg-offline-map`), Daten, Backup und Sync sind nicht betroffen (nur die zwei Kachel-Zwischenspeicher).

## Selbst entschieden
- Neu laden statt löschen: «ohne Verluste» (auch Offline-Kacheln bleiben). Preis: einmalig bis ~1400 kleine Abrufe (~35 MB) im Hintergrund.
- Kein Backup nötig: keine Datenänderung (nur Zwischenspeicher der Karte, jederzeit neu ladbar).
- Die Bilderkennung (`vision-models`, 30 MB) bleibt bei `[0, 200]`, damit sie offline bleibt.

## Stand im Plan
- Speicher senken: Schritt 2 von 2. KI-Modelle (echte 0,5–1,6 GB je Modell) sind kein Aufschlag; ob etwas daran zu sparen ist, zeigt Noahs Messzeile.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. App öffnen, 1 Minute warten, Ich › Daten › «Speicher messen».
2. Kartenkacheln: wenige MB, «nicht lesbar» 0.
3. Eine Karte öffnen (Berg, Tour): Kacheln erscheinen.
