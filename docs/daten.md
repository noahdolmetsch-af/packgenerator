# Daten: wo was liegt und welche Regeln gelten

Stand: 14. Oktober 2026 (v0.131.0, «Daten einmal bereinigen»). Gilt für jede Arbeit am Code, für alle Threads.

## In einem Bild

- **Deine Daten** liegen in einer Datenbank im Browser (Dexie, Name `pack-generator`, Schema-Version 8, 22 Tabellen, `src/lib/db.js`). Das Backup (`backup.js`) und der Demo-Modus (`demo.js`) erfassen alle 22 Tabellen; nur die Tabelle `meta` (Gerätespeicher) reist nie mit.
- **Feste Listen** (Bereiche, Kategorien, Taschenplätze, Checklisten, Fragen …) stehen im Code. Für jede Liste gibt es **genau einen** Ort (Tabelle unten).
- **Einstellungen**: alles, was zu deinen Daten gehört, in der Tabelle `settings` (kommt ins Backup); reine Bildschirm-Dinge (Sprache, Farbe, Sortierung, offene Tabs) im `localStorage` des Geräts.

## Regeln

1. **Persönliches nie in den Code.** Keine echten Velos, km, Gewichte, Bestellungen, Rechnungen, Orte, Namen. Was nur für Noahs Daten gilt, steht in seinen Daten (Backup) oder privat in `/mnt/project-files/private/`. Tests und Beispiele nutzen erfundene Daten.
2. **Eine Liste, ein Ort.** Wer eine Liste braucht, importiert sie von ihrem Ort (Tabelle unten). Keine Kopie in einer zweiten Datei. Geht ein Import nicht (Kreis zwischen zwei Dateien), steht beim Duplikat ein Kommentar, woher es kommt.
3. **Alles pro Bereich steht beim Bereich** in `domains.js` (`DOMAINS`): Taschen, gesuchte Liter, Symbol, «in Sicht» im Fenster Neue Tour, Wörter für den Import, Beispiel-Vorlagen. Ein neuer Bereich (z.B. aus «Sportarten neu») ist **ein** neuer Eintrag dort plus seine Checklisten in `checks.js`.
4. **Alte Felder werden umgezogen, nicht ewig mitgeschleppt.** Ein Datenumzug läuft beim Start (`tidy.js`), ändert nur, was es noch braucht, und macht vor der ersten Änderung eine Kopie (Muster: `cleanup.js`, Kopie in `meta`). Vor dem Umzug lädt Noah ein Backup herunter.
5. **Tabellen bleiben im Schema**, auch wenn sie leer sind (`kits`, `weightChecks`), damit jedes ältere Backup sich öffnen lässt.
6. **Jede Tabelle hat einen Besitzer-Bereich** (Tabelle unten). Neue Funktionen schreiben in die Tabellen ihres Bereichs; fremde Tabellen nur lesen oder über die Funktionen des Besitzers ändern.

## Wo welche Liste liegt

| Liste | Ort |
|---|---|
| Bereiche/Sportarten mit Taschen, gesuchten Litern, Symbol, Import-Wörtern, Beispiel-Vorlagen | `src/lib/domains.js` `DOMAINS` |
| Alle Checklisten: Bereit-Check (Velo und pro Bereich), Vorabend, Zurück | `src/lib/checks.js` |
| Material-Kategorien und Kategorie-Gruppen (Kleidung, Laden, Verbrauch) | `src/lib/gear.js` `CATEGORIES`, `CLOTHING_CATEGORIES`, `CHARGE_CATEGORIES`, `CONSUMABLE_CATEGORIES` |
| Standardplatz eines Gegenstands | `src/lib/gear.js` `BAGS` |
| Plätze am Velo (mit Zeichnung) | `src/lib/bikes.js` `SLOTS`, `FIXED_ZONES` |
| Bausteine | `src/lib/gear.js` `SETS`; Nacht und Fahrt: `src/lib/context.js` (`NIGHT_BLOCKS`, `RIDE_BLOCKS`, `OUTDOOR_BLOCKS`) |
| Schichten und Körperzonen | `src/lib/wardrobe.js` `LAYERS`, `ZONES` |
| Pflege-Teile und Bereiche | `src/lib/care.js` `PARTS`, `AREAS` |
| Velo-Masse und Geometrie | `src/lib/bikespecs.js` |
| Werte beim Abholen (= Werte, die bleiben sollen) | `src/lib/sheets.js` `KEEP` |
| Rückblick-Auswahl | `src/lib/debrief.js` |
| Tages-Check-Fragen | `src/lib/flowcheck.js` |
| Meditationsarten und Vorlagen | `src/lib/flowmed.js` |
| Start-Aktivitäten «Im Flow» | `src/lib/flow.js` |
| Challenge-Vorschläge | `src/lib/challenge.js` |

## Besitzer der Tabellen

| Bereich | Tabellen |
|---|---|
| Material | `items`, `containers` (Taschen), `kits` (leer, alt), `weightChecks` (leer, alt) |
| Touren und Packen | `trips`, `debriefs`, `learnings`, `events` (alte Logbuch-Touren), `rides` |
| Velos und Pflege | `bikes`, `maintenance`, `visits`, `photos`, `kmBook` |
| Notizen und Eingang | `notes` |
| Im Flow / Aktiv | `flowActs`, `flowLog`, `flowChecks`, `flowSessions`, `flowTemplates`, `flowStars` |
| App | `settings`, `meta` (nie im Backup) |

## Bereinigung 14.10.2026 (was geändert hat)

- Die einmaligen Datenumzüge nur für Noahs eigene Velos, Taschen und Gegenstände sind aus `updates.js` entfernt (sie waren auf seinen Daten schon gelaufen; Sicherung privat).
- `cleanup.js` (läuft nach den Updates): Kopie in `meta` (`cleanupBackup`), dann Velo-Reihenfolge (`bike.order`), Zusatznamen (`bike.aliases`) und das Velo der Excel-Reparaturen (`task.bikeId`) in die Daten; `kits` und `item.kits` geleert (die Kits sind seit v0.26.0 Vorlagen); die Gewichts-Prüfungen der Excel werden eine Notiz «Gewichts-Prüfungen aus der Excel»; die alten Baustein-Felder (`role` standard/optional, `always`, alte Baustein-Schlüssel, `split2026`, `lightSetDone`) gehen, ihr Inhalt steckt in `sets` und `leaveHome`.
- Doppelte Listen zusammengelegt: Bereiche (7 Stellen → `domains.js`), Checklisten (3 Dateien → `checks.js`), Kategorie-Gruppen (5 → `gear.js`), Outdoor-Bausteine (3 → `context.js`), Abhol-Werte, Schicht-Reihenfolge.
- Bleibt bewusst: der Import aus Noahs Excel (`bikes.js` Start-Taschen nach Excel-Nummern, `tools/import-excel/`) ist ein Werkzeug für genau diese Datei. Neutrale Start-Inhalte (Start-Aktivitäten, Beispiel-Texte, Platzhalter wie Orte) baut der Thread «Persönlich und Standard-Profil» ins Standard-Paket um.
- Nachtrag 14.10.2026 (Noah: «Mini Bag» und «Cargo Bag» in einer leeren App): Die Start-Taschen aus `bikes.js` (`START_BAGS`) entstehen nur noch, wenn eine Tasche der ersten Excel in den Daten ist. Vorher kamen die zwei Taschen ohne Gegenstand (Cargo cage, Mini bag) auch in eine leere App. Noch mit Inhalt startet eine leere App mit den Start-Aktivitäten «Im Flow» (`flow.js`) und den Tages-Check-Fragen (`flowcheck.js`); die wandern mit dem Standard-Paket in «mit Beispielen» (Thread «Persönlich und Standard-Profil»).
- Entschieden 14.10.2026 (Noah «b»): Wandern bekommt beim Start einen «Rucksack 15 L», passend zu den Taschen-Vorschlägen von 12–15 L (seine Antwort 3a). Skitour bleibt bei 30 L. Alte Touren behalten ihren gespeicherten Rucksack.

## Standard-Paket und «Listen und Typen» (0.134.0)

- Alle Grundlisten stehen im Verzeichnis `src/lib/standard.js` (`STANDARD_LISTS`). Das Verzeichnis liest jede Liste von ihrem Ort oben, es kopiert nichts. **Eine neue Grundliste bekommt dort einen Eintrag** (der Test `tests/standard.test.js` prüft eindeutige Schlüssel und Einträge).
- Eigene Änderungen einer Person (umbenennen, ausblenden, Reihenfolge, eigene Einträge) liegen getrennt in der Einstellung `listOverrides`; der Standard selbst ändert sich in den Daten nie. Änderungen am Standard werden als Vorschlag angeboten (`standardChanges`), nie automatisch übernommen.
- **Kategorien änderbar (0.134.0 «Listen und Typen»):** `src/lib/lists.js` legt die Änderungen beim Start (vor dem ersten Bild, höchstens einen Moment) und nach jedem Speichern auf `CATEGORIES`/`CATEGORY` in `gear.js` (am selben Ort, alle Seiten lesen dieselbe Liste). Der Standard steht unverändert in `STD_CATEGORIES`; `standard.js` liest von dort. Ausgeblendete Kategorien bleiben in der Liste (die Teile behalten sie), nur die Auswahl (`choosable`) lässt sie weg. Gelöschte (auch Standard, Noah 1b) sind weg; ihre Teile stehen unter «Ohne Kategorie», «Auf Standard zurücksetzen» holt sie wieder. Eigene Kategorien bekommen eine Farbe aus `OWN_COLORS` und ein Symbol (`ICON_CHOICES` in `gear/caticon.js`). Code, der eine Kategorie fest braucht, liest `STD_CATEGORIES` (Beispiel: die Farbe «Rennen» in TripDialog).
