# Neuland: Quellen und Lizenzen der Daten

Alle Daten liegen in der App (offline, keine Kosten, kein Dienst mit Schlüssel). Jede Datei wird erst geladen, wenn sie gebraucht wird (eigener Chunk).

| Datei | Inhalt | Quelle | Lizenz |
|---|---|---|---|
| `cantons.js` | 26 Kantone (Umrisse, vereinfacht) | npm `swiss-maps` 4.7.0, Jahr 2024 (Interactive Things); Geodaten BFS/swisstopo, generalisierte Gemeindegrenzen | Paket: BSD-3-Clause; Geodaten: OGD, freie Nutzung mit Quellenangabe «BFS, swisstopo» |
| `municipalities.js` | 2134 Gemeinden (Stand 2024) mit Kanton | wie oben | wie oben |
| `lakes-shapes.js` | 22 grosse Seen (Umrisse) | wie oben | wie oben |
| `countries.js` | Länder der Welt (vereinfacht), deutsche Namen von Hand ergänzt | npm `world-atlas` 2.0.2, `countries-50m` (Natural Earth) | Natural Earth: gemeinfrei (public domain); Paket: ISC |
| `passes.js` | Strassenpässe (CH, I, F, A) | eigene Zusammenstellung, Koordinaten gerundet | frei, ohne fremde Rechte |
| `huts.js` | SAC-Hütten und weitere Berghütten in der Schweiz | eigene Zusammenstellung, Koordinaten gerundet | frei, ohne fremde Rechte |
| `peaks.js` | Gipfel ab 3000 m in der Schweiz, alle Viertausender | eigene Zusammenstellung, Koordinaten gerundet | frei, ohne fremde Rechte |
| `lakes-points.js` | kleinere Seen (Mitte und ungefährer Radius) | eigene Zusammenstellung, Koordinaten gerundet | frei, ohne fremde Rechte |

## Erzeugen

`scripts/neuland/build.mjs` macht aus den beiden npm-Paketen die Dateien `cantons.js`, `municipalities.js`, `lakes-shapes.js` und `countries.js` (Bögen vereinfacht, Ganzzahlen, Delta-Kodierung). Die Pakete kommen nur für das Skript in einen Notizordner (`npm pack swiss-maps@4.7.0 world-atlas@2.0.2`), nie in `package.json`.

## Eigene Zusammenstellung

Offene Datensätze (OpenStreetMap, Wikidata, swisstopo) waren beim Bauen von hier aus nicht erreichbar. Pässe, Hütten, Gipfel und kleine Seen sind darum von Hand zusammengestellt: Name, Breite, Länge, Höhe, Kanton/Land. Die Orte sind auf etwa 0.001–0.005° gerundet und können um einige hundert Meter danebenliegen. In der App lässt sich jeder Eintrag korrigieren (Name, Ort), ausblenden oder ergänzen; das gilt nur für die eigenen Daten. Später kann ein OSM-Auszug (ODbL, «© OpenStreetMap-Mitwirkende») die Listen ersetzen; die Ids (`p-`, `h-`, `k-`, `lk-` + Name) bleiben dann gleich, solange die Namen gleich bleiben.
