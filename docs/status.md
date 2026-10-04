# Projektstand

Stand: 4. Oktober 2026

## Fertig
- Grundgerüst: Svelte + Vite, installierbar (PWA), funktioniert offline, online auf GitHub Pages.
- Bike-Cockpit-Prototyp unter `/cockpit/` als eigene Offline-App, mit Backup (Export/Import als JSON-Datei).
- Datenbank (IndexedDB/Dexie) mit Datenmodell für Gear, Kits, Trips, Debriefs, Learnings, Events, Wartung, Bikes.
- "Your data" auf der Startseite: Anzahl Datensätze, Export, Import (ersetzen oder zusammenführen), automatische Ordner-Sicherung am Desktop.
- Excel-Konverter (`tools/import-excel/`); deine Excel ist umgewandelt in `data/pack-generator-import.json` im Projektordner.

## Läuft
- Nichts.

## Als Nächstes
1. Gear: Ledger (Tabellen nach Kategorie), Gewichtsübersicht, "To weigh"-Liste fürs Phone, Wunschliste, Bearbeiten.
2. Packen: Trip als Kopie des letzten, Standard-Set, Taschen am Velo, Ready-Check (Vorlage: Prototyp).
3. Debrief, danach Learnings.
