# Projektstand

Stand: 4. Oktober 2026

## Fertig
- Grundgerüst: Svelte + Vite, installierbar (PWA), funktioniert offline, online auf GitHub Pages.
- Bike-Cockpit-Prototyp unter `/cockpit/` als eigene Offline-App, mit Backup (Export/Import als JSON-Datei).
- Datenbank (IndexedDB/Dexie) mit Datenmodell für Gear, Kits, Trips, Debriefs, Learnings, Events, Wartung, Bikes.
- "Your data" auf der Startseite: Anzahl Datensätze, Export, Import (ersetzen oder zusammenführen), automatische Ordner-Sicherung am Desktop.
- Excel-Konverter (`tools/import-excel/`); deine Excel ist umgewandelt in `data/pack-generator-import.json` im Projektordner.
- **Gear-Seite (Ledger):** Kennzahlen, Gewicht nach Kategorie (Balken, antippen filtert), 10 schwerste Teile, Suche und Filter, Liste nach Kategorie, Wunschliste getrennt, Teil bearbeiten, hinzufügen, löschen.
- **To weigh (Waage-Modus):** ein Teil nach dem anderen, Gramm eintippen, "Save and next" oder "Skip". Am Phone als Tab, am Desktop über "Weigh missing items".
- Am Phone ist Gear zum Nachschlagen und Wägen da (Details ansehen, Gewicht eintragen).

## Läuft
- Nichts.

## Als Nächstes
1. Gear: Board-Seite (Kacheln nach Gewicht) als zweite Ansicht.
2. Taschen und vier Velo-Setups als eigene Liste.
3. Packen: Trip als Kopie des letzten, Standard-Set, Taschen am Velo, Ready-Check (Vorlage: Prototyp).
4. Bike care (Wartung mit Erinnerung zum Event-Datum).
5. Debrief, danach Learnings.
