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
- Gear-Korrekturen nach dem ersten Rundgang: Kategorien auf- und zuklappbar, Gear-Gewicht ohne Essen und Wasser, Brand und Model getrennt, Wägen beginnt mit Teilen für jede Tour, Phone-Layout verbessert.

- **Bikes:** eigene Taschenliste, 4 Velo-Setups mit Velo-Zeichnung, Montagepunkte ein/aus, Velo- und Fahrergewicht.
- **Pack:** Tour wählen oder neu (Kopie der letzten Tour mit demselben Velo, sonst Standard-Set), Tasche auf der Zeichnung wählen, Teile hinzufügen, verschieben, Anzahl, abhaken (am Phone Tasche für Tasche), Taschen pro Tour ändern, Ready-Check (Standardliste, pro Tour änderbar), Systemgewicht.

- **Runde 3 (Antworten 1–10):** 4 echte Velos mit Setups, fixe Halterungen, Nacht-Sets inkl. Light, Wetter mit Kleider-Vorschlag, Volumen-Warnung mit Taschen-Vorschlag, Wägen aus Pack, Druckliste, Gepäck vorne/hinten, Inventar-Check.

## To-do für Noah
- [ ] Prototyp-Daten sichern: im Bike Cockpit auf "Saved · Backup" tippen → Export, Datei aufbewahren.
- [ ] **Inventar durchgehen:** Gear → "Check inventory" (am Phone Tab "Check"). Pro Teil: Still have it / Gone / Replaced by… / fehlende Teile mit "Add item" ergänzen.
- [ ] Scott Scale, Scott Spark und Factor LS wägen (ohne Taschen, mit Garmin-, Quad-Lock- und Flaschenhalterungen) und auf "Bikes" eintragen. Canyon ist erledigt (10.1 kg).
- [ ] Neue Teile wägen: "Trainerhose lang chillig" und "Gilet Fleece kuschelig".
- [ ] Bike care einmal durchspielen (Fragen im Chat).
- [ ] Full-Frame-Tasche wägen (neu in Gear, TA14).
- [ ] Danach die 303 in Pack neu packen (Taschen für diese Tour prüfen).

## Läuft
- Nichts.

## Als Nächstes
1. Bike care mit Erinnerungen vor dem Event (Noah, Runde C Antwort 9).
2. Packen verfeinern nach deinem ersten Test mit der 303.
3. Prototyp ablösen, wenn die 303 in der neuen App gepackt ist.
3. Bike care (Wartung mit Erinnerung zum Event-Datum).
4. Debrief, danach Learnings.
5. Gear: Board-Seite (Kacheln nach Gewicht) als zweite Ansicht.
