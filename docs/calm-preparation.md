# Fortschritt: Entwürfe 2 und 3

Stand: 7. Oktober 2026. Dieser Schritt setzt die beiden ausgewählten Ansichten um. Er schliesst die zugehörigen Arbeitspakete des umfassenden Ablaufplans noch nicht vollständig ab.

## Gelieferte Schritte und messbare Abnahme

| Schritt | Ergebnis | Überprüfbares Kriterium | Nachweis |
|---|---|---|---|
| 1. Ansicht beruhigen | Tourkontext, flache Materialzeilen und eine Hauptaktion | In der Planungsansicht stehen keine Pack-Checkboxen; seltene Aktionen sind im Menü | `preparation.spec.js`, Desktop-/Mobilaufnahme |
| 2. Entscheidungen entwerfen | Auswahl, Alternativen und Mengen zunächst im lokalen Entwurf | Alternative auswählen und «Zurück» drücken verändert die gespeicherte Liste nicht | Unit- und Browser-Test |
| 3. Auswahl bestätigen | Nur bestätigte Vorschläge speichern, bestehende Einträge erhalten | Ausgewählte Alternative erscheint; nicht ausgewählte Vorschläge werden nicht neu ergänzt | `preparation.test.js`, Browser-Test |
| 4. Mengen bearbeiten | Mengenknöpfe, Neuberechnung und verlässliche Speicherung | Dreimal 80 g ergibt 240 g und bleibt nach Neuladen erhalten; Mengenänderung setzt den Packhaken zurück | Unit- und Browser-Test |
| 5. Details bei Bedarf zeigen | Wetter, Gewichte, Materialsuche und Zeilenaktionen | Gruppierung verändert keine Packorte; Hinzufügen/Verschieben lässt sich rückgängig machen | Browser-Test und manuelle Vorschauprüfung |
| 6. Packkontrolle anschliessen | Bestehender Packtag bleibt die Kontrollansicht | Hauptaktion öffnet Packkontrolle; bisherige Tourabläufe funktionieren in DE/EN auf Handy und Desktop | Vier bestehende Szenarien × zwei Bildschirmgrössen |
| 7. Darstellung prüfen | Lokale Schriften, mobile Zeilen und Touch-Bedienung | Kein horizontaler Überlauf bei 390 px; korrekte Beschriftung «Touren»; Mengenknöpfe 44 px hoch | Browser-Tests und `design-qa.md` |

Gesamtprüfung: **195 Unit-Tests und 12 Browser-Tests bestanden**. Der Browserlauf erstellt vorher einen frischen Produktionsbuild. Zwei der zwölf Tests erstellen zusätzlich die visuellen Nachweise. Es wurden künstliche Beispieldaten verwendet; der persönliche Datenexport ist nicht Teil des Repositorys.

## Einordnung im freigegebenen Ablaufplan

| Arbeitspaket | In diesem Schritt erreicht | Noch offen |
|---|---|---|
| AP03 – Typografie, Farbrollen, Komponenten | Gestaltung der beiden zentralen Ansichten und offline verfügbare Produktfonts | Übertragung auf weitere Screens |
| AP13 – Auswahl mit Wirkungsvorschau | Bestätigung, Abbruch, Alternativen und explizites Auslassen | Vollständige Kontext-Rangfolge, Herkunft und Vorschau aller Ersetzungen |
| AP14 – Mengenprüfung | Stundenregel erklären, manuell bestätigen, Menge erhalten | Strukturierte Regelkonflikte, Wasserbedarf/Kapazität und vollständige Grenzen |
| AP15 – Wetter und Alternativen | Bestehende Wetterregeln in der neuen Entscheidungsansicht | Alle Fälle nach späteren Kontextänderungen und vollständige Konfliktbehandlung |
| AP19 – Packtag und Bereitschaft | Ruhige Planung mit Übergang zur bestehenden Kontrolle | Vollständige Überarbeitung der Bereitschaftsbegriffe und aller Zustände |
| AP21 – Mobile/Tastatur-Prüfung | 390-px-Prüfung und vorhandene automatisierte Tourabläufe | 320 px und Screenreader-Stichprobe |

## Nächster überprüfbarer Schritt

Beide Ansichten in der Vorschau mit den drei Alltagstouren durchgehen und die Verständlichkeit von Auswahl, Mengenprüfung und Packkontrolle abnehmen. Anschliessend offene Kontext-/Übernachtungsregeln konkretisieren und erst nach der Änderungsprüfung veröffentlichen. Materialverwaltung, neue Bausteine und ein umfassendes Cockpit sind kein Bestandteil dieses Umsetzungsschritts.

Die Screenshots und der Vergleich mit den ausgewählten Entwürfen stehen in `qa/`; die genaue Prüfung ist in `design-qa.md` dokumentiert.
