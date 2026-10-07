# Design QA: Entscheidungsprüfung und Packliste

Geprüft am 7. Oktober 2026. Umfang: ausgewählte Entwürfe 2 und 3 auf der bestehenden Svelte-Anwendung, Route `#/pack`. Die Aufnahmen enthalten ausschliesslich künstliche Testdaten.

## Ergebnis und offene Punkte

Keine offenen P0/P1/P2-Befunde im umgesetzten Umfang. Die Ansichten und ihr Übergang sind funktional geprüft; dies ist keine vollständige Barrierefreiheitszertifizierung oder Abnahme des gesamten Produktplans.

- Akzeptierte Abweichung: Beide Ansichten verwenden dieselbe einfache Phasennavigation. Materialentscheidungen gehören zu «Planen»; «Packen» startet die vorhandene Packkontrolle. Der Entwurf 2 hatte einen abweichenden nummerierten Schrittindikator.
- Akzeptierte Inhaltsabweichung: Die reale Regelberechnung liefert in der Prüftour fünf Vorschläge, der Entwurf zeigt drei. Zusätzliche gültige Vorschläge werden nicht für eine kürzere Aufnahme versteckt. Deshalb liegt der Bestätigungsbereich weiter unten.
- Akzeptierte Textabweichung: Freitextnotizen werden nicht automatisch als Widerspruch interpretiert. «Mengenregel und Materialnotiz prüfen» zeigt Regel und Notiz zur manuellen Entscheidung. Die Herkunft der bereits vorhandenen Materialien wird nicht als «automatisches Standardset» behauptet.
- P3: Native quadratische Checkboxen statt der runden Auswahlmarken im Entwurf; Tastaturbedienung und eindeutige Auswahlzustände bleiben erhalten. Die Primäraktion ist einfarbig statt leicht texturiert.

## Vergleichsgrundlage und Nachweise

| Ansicht | Visuelle Quelle | Browser-Aufnahme | Vollansicht, nebeneinander | Detailvergleich |
|---|---|---|---|---|
| Entwurf 2 | `qa/source-review.png` | `qa/review-desktop.png` | `qa/review-comparison-full.png` | `qa/review-comparison-detail.png` |
| Entwurf 3 | `qa/source-pack.png` | `qa/pack-desktop.png` | `qa/pack-comparison-full.png` | `qa/pack-comparison-detail.png` |

Quellen: jeweils 1487 × 1058 px. Desktop: CSS-Viewport 1487 × 1058, deviceScaleFactor 1. Packliste als Ganzseitenaufnahme 1487 × 1107 px; Prüfung 1487 × 1423 px. Für den Vollvergleich wird die Aufnahme auf die ersten 1058 px zugeschnitten, ohne Skalierung. Die ungekürzten Aufnahmen bleiben separat erhalten. Die Details verwenden identische Ausschnittkoordinaten beider Bilder; sie sind kein pixelgenauer Regressionstest.

Zustand Packliste: Alpine Tagestour, Scott Spark, 6 Stunden, 4–12 °C/Schauer; Körper und Fahrrad geschlossen, Rahmentasche geöffnet, vier Zeilen, Carb-Pulver zweimal. Prüfzustand: Regenjacke entfernt und Pulver auf eins reduziert, dann Wettervorschläge geöffnet. Regelbedingt zusätzliche Kleidungsstücke sichtbar. Testzeit auf 7. Oktober fixiert.

Mobil: CSS-Viewport 390 × 844, deviceScaleFactor 1, Touch. `qa/pack-phone.png` (390 × 1674) und `qa/review-phone.png` (390 × 1895) sind Ganzseitenaufnahmen. Die feste Navigation erscheint auf Höhe des Aufnahme-Viewports; beim tatsächlichen Scrollen bleibt sie am Bildschirmrand. Es gibt kein mobiles Quellbild: geprüft wurden die responsive Übertragung und Bedienbarkeit, keine behauptete Pixelübereinstimmung.

Zusätzlich wurde die laufende Vorschau im Cloud-Browser geprüft (1363 × 936 CSS px).

## Vergleichshistorie

1. Erste Gegenüberstellung: `qa/pack-comparison-initial.jpg`, `qa/review-comparison-initial.jpg`. P2: Mengenregler zu weit rechts, unpassende Seitenränder und ständig sichtbares Suchfeld. Korrektur: neue Grid-Spalten, separate Seitenränder für beide Ansichten und kompakte Suche. Diese frühen Aufnahmen hatten unterschiedliche Bildgrössen; sie dienen nur der Verlaufskontrolle.
2. Normierter Vergleich: `qa/pack-comparison-before.png`, `qa/review-comparison-before.png`. P2: Schrift-Fallback veränderte Logo, Textbreiten und Hierarchie. Korrektur: vorhandene Fira Sans und Sofia Sans Extra Condensed lokal eingebunden, Aufnahme nach `document.fonts.ready`.
3. Mobile Prüfung: P2: «Rückblick» im Kopf vermittelte den falschen Seitenkontext. Korrektur: «Touren» im Packbereich. Die umfassenden Tests fanden ausserdem eine zu breite deutsche Überschrift auf der Startseite; `min-width: 0` und Umbruch beheben den Überlauf. Drag-and-drop ist auf Touch-Geräten deaktiviert; Verschieben erfolgt über das Zeilenmenü.
4. Schlussvergleich: die Voll- und Detailbilder in der Tabelle zeigen die korrigierten Ansichten. Kein verbleibender aktionsbedürftiger P0/P1/P2-Befund.

## Fünf geprüfte Gestaltungsflächen

| Fläche | Prüfung |
|---|---|
| Schrift | Bestehende Schriftfamilien lokal, klare Titelhierarchie 58/44/28 px am Desktop; 34/23 px mobil. Lange Namen umbrechen, Mengen verwenden tabellarische Ziffern. Exakte Schriftmetadaten des generierten Entwurfs sind nicht verfügbar; die bestehenden Produktfonts sind die Referenz. |
| Abstände | Flache Zeilen, Haarlinien, konsistente Spalten, eingerückte Materialien, nur eine Tasche zunächst offen. Hauptaktion der Packliste im 1058-px-Viewport sichtbar. Review-Höhe folgt der tatsächlichen Vorschlagszahl. |
| Farben | Dunkelgrüner Kopf, helle Fläche, Orange für Primäraktion, blasses Grün für Auswahl und Gelb für den Prüfhinweis. Auswahl wird zusätzlich durch Checkboxen gekennzeichnet. |
| Assets | Vorhandene Wortmarke als Text mit bestehender Logoschrift, standardisierte Lucide-Bedienicons als Vektoren. Keine dekorativen Rasterbilder oder erfundenen Produktfotos. Vorhandene Setup-Fotos bleiben über das Menü erreichbar. |
| Text | Reale Tourdaten, Stückzahlen, Mengen und bekannte Gewichte. Fehlende Gewichte ausdrücklich benannt. Speichern erst nach Bestätigung; keine behauptete automatische Freitextanalyse. |

## Interaktionen und technische Prüfung

- Entwurf bearbeiten, abbrechen und erneut öffnen; vor Bestätigung wird keine Alternative gespeichert.
- Alternative übernehmen; Materialmenge ändern, Gewicht berechnen und nach Neuladen erhalten.
- Nach Kategorien gruppieren, ohne Packorte zu verändern; unbekannte Kategorien behalten ihre Zeilen.
- Material suchen/ergänzen, zwischen Packorten verschieben und mit Undo wiederherstellen.
- Bestehende Packkontrolle öffnen; bisherige Tourabläufe auf Desktop/Handy in DE und EN abschliessen.
- Kompakte globale Suche öffnen, «Carb» finden und mit Escape schliessen; Profilmenü öffnen/schliessen.
- Kein horizontaler Überlauf bei den geprüften 390-px-Ansichten. Beschriftete Mengen-/Aktionsknöpfe, native Dialoge, sichtbarer Fokus und mobile Mengenknöpfe mit 44 px Höhe.
- `TZ=UTC npm test`: 195 Tests bestanden. UTC entspricht den Erwartungen des bestehenden Demo-Datumstests.
- `npm run e2e`: frischer Produktionsbuild und 12 Browser-Tests bestanden. Verbleibende Buildhinweise: vorhandene Initialwert-Warnung in PackDay und Bundle-Grössenhinweis.
- Neue Browserstrecke: keine JavaScript-Seitenfehler. Im Cloud-Browser wurden nur Meldungen einer Browser-Erweiterung gefunden, keine App-Fehler in den geprüften Meldungen.

Prüfgrenzen: 320 px, vollständige Screenreaderprüfung und Fehler bei verweigerten Datenbankzugriffen sind noch offen. Der vorhandene Datenimport wurde in den automatisierten Tests per Tastatur bestätigt; die bestehende mobile Überdeckung des Importknopfs durch die feste Navigation gehört nicht zu diesen beiden Ansichten. Freitext-Konflikterkennung und neue Übernachtungslogik sind nicht implementiert.

## Umsetzungskontrolle

- [x] Beide ausgewählten Ansichten im echten Produkt verbunden.
- [x] Vorherige visuelle P2-Befunde korrigiert und erneut verglichen.
- [x] Reale Speicherung, Undo und Packkontrolle geprüft.
- [x] Desktop-/Mobilaufnahmen und reproduzierbare Tests vorhanden.
- [ ] Veröffentlichung und anschliessende Live-Abnahme.

final result: passed
