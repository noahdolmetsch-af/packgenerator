# Excel-Konverter (einmalig)

Wandelt `Bikepacking_Master_v2.xlsx` in eine **Pack-Generator-Backup-Datei** um. Diese Datei importierst du in der App unter *Your data → Import backup*, genau wie ein normales Backup.

```
node tools/import-excel/convert.mjs \
  --excel Bikepacking_Master_v2.xlsx \
  --translations translations-de-en.json \
  --out pack-generator-import.json
```

## Woher kommt was?

| Excel-Blatt | Wird in der App zu | Englischer Text aus |
|---|---|---|
| Master + Wunschliste | `items` (Gear, Wunschliste über `ownership`, Priorität) | Prototyp (`LIB`, `ITEMS`) |
| Kits | `kits` + `settings` (Velo- und Fahrergewicht) | Übersetzungsdatei |
| Learnings | `learnings` | Prototyp (`RULES`) |
| Events | `events` | Prototyp (`EVENTS`), "303" aus der Übersetzungsdatei |
| Alpenbrevet | `details` bei den Events Alpenbrevet 2025 und 2026 | Übersetzungsdatei |
| Wartung | `maintenance` | Übersetzungsdatei |
| Bikes | `bikes` | Übersetzungsdatei |
| Gewichts-Check | `weightChecks` | Übersetzungsdatei |
| 303 Plan | geplanter Trip `trip-303` (Packliste, Kleidung nach Temperatur, Verpflegung, Zeitplan) | Übersetzungsdatei |
| Dashboard, Quellen, Anleitung | nicht importiert: beschreiben nur die Excel selbst | |

## Wichtig

- Die Excel-Datei, die Übersetzungsdatei und das Ergebnis sind **persönliche Daten** und kommen nie in dieses Repository (siehe `.gitignore`). Sie liegen im Projektordner.
- Texte ohne Übersetzung bleiben deutsch und werden am Ende aufgelistet.
- `mapping.js` enthält die reinen Umwandlungsregeln (eine Zeile rein, ein Datensatz raus); die Tests dazu stehen in `tests/mapping.test.js`.
