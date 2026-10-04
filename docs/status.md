# Projektstand

Stand: 4. Oktober 2026

## Fertig
- Grundgerüst: Svelte + Vite, installierbar (PWA), funktioniert offline, online auf GitHub Pages.
- Bike-Cockpit-Prototyp: seit 4.10.2026 archiviert in `archive/cockpit/`, nicht mehr online.
- Datenbank (IndexedDB/Dexie) mit Datenmodell für Gear, Kits, Trips, Debriefs, Learnings, Events, Wartung, Bikes.
- "Your data" auf der Startseite: Anzahl Datensätze, Export, Import (ersetzen oder zusammenführen), automatische Ordner-Sicherung am Desktop.
- Excel-Konverter (`tools/import-excel/`); deine Excel ist umgewandelt in `data/pack-generator-import.json` im Projektordner.
- **Gear-Seite (Ledger):** Kennzahlen, Gewicht nach Kategorie (Balken, antippen filtert), 10 schwerste Teile, Suche und Filter, Liste nach Kategorie, Wunschliste getrennt, Teil bearbeiten, hinzufügen, löschen.
- **To weigh (Waage-Modus):** ein Teil nach dem anderen, Gramm eintippen, "Save and next" oder "Skip". Am Phone als Tab, am Desktop über "Weigh missing items".
- Am Phone ist Gear zum Nachschlagen und Wägen da (Details ansehen, Gewicht eintragen).
- Gear-Korrekturen nach dem ersten Rundgang: Kategorien auf- und zuklappbar, Gear-Gewicht ohne Essen und Wasser, Brand und Model getrennt, Wägen beginnt mit Teilen für jede Tour, Phone-Layout verbessert.

- **Bikes:** eigene Taschenliste, 4 Velo-Setups mit Velo-Zeichnung, Montagepunkte ein/aus, Velo- und Fahrergewicht.
- **Pack:** Tour wählen oder neu (Kopie der letzten Tour mit demselben Velo, sonst Standard-Set), Tasche auf der Zeichnung wählen, Teile hinzufügen, verschieben, Anzahl, abhaken (am Phone Tasche für Tasche), Taschen pro Tour ändern, Ready-Check (Standardliste, pro Tour änderbar), Systemgewicht.

- **Logbuch, Fahrten-Import, Teilen (v0.16.0):** Debrief zeigt die 12 alten Touren als Logbuch. Im Debrief lassen sich Fahrten aus Strava oder Garmin als Datei importieren (km werden zusammengezählt). Pack → "Share link" kopiert einen Link zur Packliste (nur lesen), "Print / PDF" speichert sie als PDF.
- **Wetter, Route und Velo-Foto (v0.15.0):** In Pack unter "Ride and weather" eine GPX-Route laden (Distanz, Höhenmeter, geschätzte Fahrstunden), Startort suchen, Wettervorhersage pro Tourtag von Open-Meteo, ein Klick packt für diese Vorhersage. Offline bleibt die letzte Vorhersage sichtbar. Startseite zeigt die Vorhersage. Bikes → Edit → Foto deines Velos; es erscheint in Pack hinter den Taschen.
- **Packtag und Debrief-Lernen (v0.14.0):** Pack → "Packing day" im Vollbild, Tasche für Tasche mit grosser Schrift, antippen = in der Tasche, am Schluss der Ready check; der Bildschirm bleibt an. Learnings stehen als kleiner Hinweis beim passenden Item. Debrief fragt nach den km der Tour und zählt sie zum Velo. "Leave at home" erst nach 3× nicht gebraucht. Startseite erinnert ans Backup, wenn das letzte älter als 14 Tage ist.
- **Debrief und Startseite (v0.13.0):** Debrief in 3 Schritten (Wie war's, Items durchgehen, Zusammenfassung mit Vorschlägen für Gear, Learnings und Template), alle Learnings durchsuchbar. Startseite zeigt die nächste Tour mit Countdown, Packstand, Ready check, Wartung vor der Tour, Learnings, Velos und Gear. Dazu alle Vorschläge aus dem Design-Audit auf Gear, Pack, Templates, Bikes und Bike care.
- **Pack mit grossen Taschen-Kästen (v0.12.0):** Taschen zeigen Inhalt direkt auf dem Velo, ruhiger Kopf, Layers gruppiert, Ready check zugeklappt, am Phone Taschen als Streifen. Alle Taschen als Liste mit "Move", Zweck-Namen, Vorlagen als Knöpfe, Undo, ruhigere Farben.
- **Design-Runde 1 und Template-Editor (v0.11.0):** Gewichte in einer Zeile, Wetter klappt zu, Kacheln ziehen, kurze Namen in der Zeichnung, Templates direkt bearbeiten.
- **Templates (v0.10.0):** Setup speichern, aktualisieren, neue Tour daraus; Seite Pack → Templates; Kacheln mit "−" statt Häkchen.
- **Ready-Check aufgeräumt (v0.9.0):** eine kurze Liste, "Tick all checks", "Save as my standard"; "Always with me" sind jetzt Teile "On every trip". Prototyp archiviert.
- **Neues Pack-Layout (v0.8.0):** drei Spalten, "Not packed" nach Kategorie zugeklappt, Etiketten, "+" oder Ziehen auf eine Tasche, Kacheln mit Füllbalken, Ready-Check kurz, am Phone fixe Leiste "Adding to".
- **Runde 3 (Antworten 1–10):** 4 echte Velos mit Setups, fixe Halterungen, Nacht-Sets inkl. Light, Wetter mit Kleider-Vorschlag, Volumen-Warnung mit Taschen-Vorschlag, Wägen aus Pack, Druckliste, Gepäck vorne/hinten, Inventar-Check.

## To-do für Noah
- [ ] **Inventar durchgehen:** Gear → "Check inventory" (am Phone Tab "Check"). Pro Teil: Still have it / Gone / Replaced by… / fehlende Teile mit "Add item" ergänzen.
- [ ] Scott Scale, Scott Spark und Factor LS wägen (ohne Taschen, mit Garmin-, Quad-Lock- und Flaschenhalterungen) und auf "Bikes" eintragen. Canyon ist erledigt (10.1 kg).
- [ ] Neue Teile wägen: "Trainerhose lang chillig" und "Gilet Fleece kuschelig".
- [ ] **Service-Fotos** der 4 Velos hochladen (daraus trage ich den letzten Service pro Teil ein), dazu den km-Stand.
- [ ] Bike care → "Go through them": die 17 Juni-Aufgaben einmal durchgehen.
- [ ] Full-Frame-Tasche wägen (neu in Gear, TA14).
- [ ] Danach die 303 in Pack neu packen (Taschen für diese Tour prüfen).
- [ ] App auf dem Samsung A56 installieren (Anleitung im Chat).
- [ ] Für jedes Velo ein Foto von der Seite aufnehmen und unter Bikes → Edit hinzufügen.
- [ ] Für die 303 den Startort und die GPX-Route in Pack eintragen.
- [ ] Erstes Backup herunterladen (Startseite → Download backup).

## Läuft
- Noah testet Pack mit der 303 (Testplan im Chat), danach erster echter Debrief.

## Als Nächstes
1. Paket 4: ganze App Deutsch/Englisch umschaltbar.
2. Paket 5: weitere Bereiche (Skitouren, Weekend-Trip, Weltreise) und Merkliste "All my favorite things".
3. Bike care und Packen verfeinern nach deinem Test mit der 303 und den Service-Fotos.
