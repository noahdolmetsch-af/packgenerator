# Projektstand

Stand: 4. Oktober 2026

## Fertig
- **App lernt (v0.19.0):** Debrief → "Your pace": GPX-Fahrten laden, die App rechnet dein Tempo (aus 8 Fahrten: 28.5 km/h plus 1 h pro 1070 m, Pausen +34 %). Pack und Ride day schätzen die Fahrzeit damit, der Ride day zeigt auch die Ankunft mit deinen üblichen Pausen. Nach 3 Debriefs schlagen die Templates vor, was raus kann (3× nicht gebraucht) und was rein soll (2× gefehlt). Neue Demo-Datei `private/demo/pack-generator-demo-app-lernt.json` (303, Hope 1000, Alpenbrevet).
- **Eine Liste "Before the trip" (v0.18.2):** Startseite, Pack und Bike care zeigen dieselbe Liste mit derselben Zahl: Vorbereitungs-Aufgaben mit Datum, was das Velo braucht (Werkstatt ab 14 Tagen vorher, Fälliges immer) und offene Reparaturen dieses Velos. Überfälliges zuerst und rot. In Bike care stehen die Aufgaben der Tour jetzt alle im Abschnitt der Tour, nicht mehr verteilt auf "Due now".
- **Probefahrt 303 (v0.18.1):** Die Lucerne 303 als Demo durchgespielt (14 Tage vorher, Packtag, Start, Nacht, Debrief). Daraus: Packtag warnt, wenn die Vorhersage kälter oder nasser ist als gepackt, und springt zu den passenden Layers; Debrief zeigt deine Notizen vom Tourtag und schlägt bei "fehlte" ähnliche Teile aus deinem Gear vor; Packtag am Phone ohne Querscrollen; Demo-Tag lässt sich mehrmals hintereinander wechseln. Demo-Datei: `private/demo/pack-generator-demo-lucerne-303.json` im Projektordner.
- **Tagesansicht, Werkstatt-Erinnerung, Demo-Modus (v0.18.0):** Pack → "Ride day": alle Taschen mit Inhalt, Etappe mit km, Höhenmetern, Fahrzeit, Ankunft und Höhenprofil, Wetter Stunde für Stunde am Start und am Ziel (bleibt offline sichtbar), Notizen für den Debrief. Mehrtägige Touren: Tag für Tag; Nonstop: eine Etappe über Nacht mit deinen Blöcken. Am Tourtag öffnet die Startseite die Tagesansicht. Pack und Bike care zeigen ab 14 Tagen vor einer Tour, was die Werkstatt noch machen muss. Demo-Dateien starten einen Demo-Modus, "End demo" setzt alles zurück.
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

- **Werkstatt und Setup-Fotos (v0.17.0):** Bike care zeigt pro Velo die Werkstatt-Besuche (Betrag, Arbeiten, Beleg-Fotos zum Vergrössern, km nachtragen), "Coming up" (Gabel- und Dämpfer-Service jährlich, Dichtmilch alle 3 Monate), Schlauch oder tubeless pro Rad, Kosten pro Jahr und pro 1000 km. Neue Teile: Bremsen, Laufräder, Hinterbau, Cockpit. Bikes zeigt eine Foto-Galerie pro Velo (antippen, wischen, "Show in Pack", einer Tour zuordnen). Pack zeigt das Foto blass hinter den Taschen, mit Knopf zum Vergrössern.
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
- [x] Import-Datei "Werkstatt und Fotos" am Handy mit Merge importiert.
- [ ] Am Desktop die Import-Datei nochmals mit Merge laden (Besuch Veloshop Vonäsch).
- [ ] Velos wägen: Die Gewichte sind Strava-Schätzungen (Bikes → Bike weight).
- [ ] Belege für das Canyon schicken, falls es welche gibt.
- [ ] Bike care → "Go through them": die 17 Juni-Aufgaben einmal durchgehen.
- [ ] Full-Frame-Tasche wägen (neu in Gear, TA14).
- [ ] Danach die 303 in Pack neu packen (Taschen für diese Tour prüfen).
- [ ] App auf dem Samsung A56 installieren (Anleitung im Chat).
- [ ] Für die 303 den Startort und die GPX-Route in Pack eintragen.
- [ ] Erstes Backup herunterladen (Startseite → Download backup).

## Läuft
- Nutzen pro Seite: Vorschläge N1-N16 im Dokument "Pack Generator: Mehr Nutzen pro Seite", 12 Fragen an Noah offen.

## Als Nächstes
1. 0.19.1-0.19.3: Nutzen pro Seite (nach Noahs Antworten).
2. 0.20.0: ganze App Deutsch/Englisch umschaltbar.
3. Paket 5: weitere Bereiche (Skitouren, Weekend-Trip, Weltreise) und Merkliste "All my favorite things".
