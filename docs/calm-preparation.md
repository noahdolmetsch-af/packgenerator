# Fortschritt: Entwürfe 2 und 3

Stand: 7. Oktober 2026. **Veröffentlicht über PR #32**, Merge `be041f1`, Anzeigeversion 0.22.0. [Release und Live-Nachweis](releases/2026-10-07-calm-preparation.md). Dieser Schritt setzt die beiden ausgewählten Ansichten um; er schliesst die zugehörigen Gesamtarbeitspakete nicht vollständig ab. Verbindlicher AP-Status: [Roadmap](roadmap.md), Prüfgrenzen: [Prüfregister](verification.md).

## Gelieferte Schritte und messbare Abnahme

| Schritt | Ergebnis | Überprüfbares Kriterium | Nachweis |
|---|---|---|---|
| 1. Ansicht beruhigen | Tourkontext, flache Materialzeilen und eine Hauptaktion | In der Planungsansicht stehen keine Pack-Checkboxen; seltene Aktionen sind im Menü | `tests/e2e/preparation.spec.js`, Desktop-/Mobilaufnahme |
| 2. Entscheidungen entwerfen | Auswahl, Alternativen und Mengen zunächst im lokalen Entwurf | Alternative auswählen und «Zurück» drücken verändert die gespeicherte Liste nicht | Unit- und Browser-Test |
| 3. Auswahl bestätigen | Nur bestätigte Vorschläge speichern, bestehende Einträge erhalten | Ausgewählte Alternative erscheint; nicht ausgewählte Vorschläge werden nicht neu ergänzt | `tests/preparation.test.js`, Browser-Test |
| 4. Mengen bearbeiten | Mengenknöpfe, Neuberechnung und verlässliche Speicherung | Dreimal 80 g ergibt 240 g und bleibt nach Neuladen erhalten; Mengenänderung setzt den Packhaken zurück | Unit- und Browser-Test |
| 5. Details bei Bedarf zeigen | Wetter, Gewichte, Materialsuche und Zeilenaktionen | Gruppierung verändert keine Packorte; Hinzufügen/Verschieben lässt sich rückgängig machen | Browser-Test und manuelle Vorschauprüfung |
| 6. Packkontrolle anschliessen | Bestehender Packtag bleibt die Kontrollansicht | Hauptaktion öffnet Packkontrolle; bisherige Tourabläufe funktionieren in DE/EN auf Handy und Desktop | Vier bestehende Szenarien × zwei Bildschirmgrössen |
| 7. Darstellung prüfen | Lokale Schriften, mobile Zeilen und Touch-Bedienung | Kein horizontaler Überlauf bei 390 px; korrekte Beschriftung «Touren»; Mengenknöpfe 44 px hoch | Browser-Tests und `design-qa.md` |

Gesamtprüfung: **227 Unit-Tests und 12 Browser-Tests bestanden**. Der Browserlauf erstellt vorher einen frischen Produktionsbuild. Zwei der zwölf Tests erstellen zusätzlich die visuellen Nachweise. Es wurden künstliche Beispieldaten verwendet; der persönliche Datenexport ist nicht Teil des Repositorys.

## Einordnung im freigegebenen Ablaufplan

Diese Tabelle beschreibt ausschliesslich den Beitrag von PR #32. Für PR #30 und Gesamtstatus die Roadmap verwenden. AP07-Zielnavigation ist im Packbereich zusätzlich teilweise umgesetzt; andere Screens behalten die bestehende Navigation.

| Arbeitspaket | In diesem Schritt erreicht | Noch offen |
|---|---|---|
| AP03 – Typografie, Farbrollen, Komponenten | Gestaltung der beiden zentralen Ansichten und offline verfügbare Produktfonts | Übertragung auf weitere Screens |
| AP13 – Auswahl mit Wirkungsvorschau | Bestätigung, Abbruch, Alternativen und explizites Auslassen | Vollständige Kontext-Rangfolge, Herkunft und Vorschau aller Ersetzungen |
| AP14 – Mengenprüfung | Stundenregel erklären, manuell bestätigen, Menge erhalten | Strukturierte Regelkonflikte, Wasserbedarf/Kapazität und vollständige Grenzen |
| AP15 – Wetter und Alternativen | Bestehende Wetterregeln in der neuen Entscheidungsansicht | Alle Fälle nach späteren Kontextänderungen und vollständige Konfliktbehandlung |
| AP19 – Packtag und Bereitschaft | Ruhige Planung mit Übergang zur bestehenden Kontrolle | Vollständige Überarbeitung der Bereitschaftsbegriffe und aller Zustände |
| AP21 – Mobile/Tastatur-Prüfung | 390-px-Prüfung und vorhandene automatisierte Tourabläufe | 320 px und Screenreader-Stichprobe |

Die während der Umsetzung eingetroffene Version 0.22.0 ist integriert. Ihre ehrlichen Gewichtssummen, Schätzungen, Favoriten und gemeinsamen Bereitschaftsaussagen bleiben erhalten; die Browserprüfung kontrolliert ausdrücklich Summen mit Lücken und «keine Daten» bei fehlender Pflegehistorie.

## Nächster überprüfbarer Schritt

Die Veröffentlichung dieses Teilschritts ist abgeschlossen. Beide Ansichten jetzt mit den drei Alltagstouren und den zwei Material-/Listenaufgaben abnehmen; Verständlichkeit und Zeitmessungen protokollieren. Anschliessend offene Kontext-/Übernachtungsregeln konkretisieren; PR #31 zur Eventvorbereitung ist inzwischen im Branch integriert; vor separater Veröffentlichung Dokumentabgleich und fachliche Abnahme abschliessen. Materialverwaltung, neue Bausteine und ein umfassendes Cockpit sind kein Bestandteil dieses Umsetzungsschritts.

Die Screenshots und der Vergleich mit den ausgewählten Entwürfen stehen in `qa/`; die genaue Prüfung ist in `design-qa.md` dokumentiert.


## Bedienverträge der beiden Screens

- Packliste → „Wettervorschläge prüfen“ öffnet „Noch zu entscheiden“; die Route bleibt `#/pack`. Der Reviewzustand ist kein eigener dauerhaft teilbarer Deep Link.
- Auswahl, Alternative und Mengenfeld ändern erst den Entwurf. „Zurück“ speichert ihn nicht; „Auswahl übernehmen“ speichert die bestätigten Änderungen für diese Tour.
- Bereits vorhandene Materialien bleiben sichtbar hinter einem aufklappbaren Bereich; Nichtauswahl eines Vorschlags entfernt keine schon vorhandenen Gegenstände.
- Mengenknöpfe der Packliste speichern sofort; zusätzliches Material und eine geänderte Menge/Position setzen den betreffenden Packzustand auf offen. Das Standardsetup oder eine andere Tour wird nicht darüber bearbeitet.
- „Nach Kategorie“ ist eine Anzeigegruppierung, keine Änderung des Packorts. Die Hauptaktion startet den vorhandenen Packtag.
- Fehlende Regeln/Wetter dürfen eine leere Vorschlagsansicht ergeben; das bedeutet nicht, dass die gesamte Tour vollständig geprüft oder bereit ist.

Die neue Packliste bietet keine neue Sternaktion pro Zeile. Favorisieren erfolgt in der vorhandenen Materialverwaltung. Die Kandidatenliste verwendet die bestehende Sortierung; vollständige Kontextpräferenzen/Favoritenrangfolge ist nicht neu umgesetzt.
