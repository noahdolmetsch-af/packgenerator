# Pack Generator – Ablauf- und Umsetzungsplan

> Umsetzung in einzeln prüfbaren Arbeitspaketen. Checkboxen bezeichnen vollständig erledigte Schritte; Teilumsetzungen werden im Fortschrittsregister beschrieben. Keine Delegation allein aufgrund dieses Dokuments.

**Goal:** Aus der vorhandenen Anwendung einen verständlichen Tourvorbereitungs-Assistenten entwickeln: Tourkontext → nachvollziehbare Vorschläge → Packliste → Packkontrolle → Unterwegs → Rückblick.

**Architecture:** Material, Fahrradsetup, Bausteine und Vorlagen bilden die wiederverwendbare Grundlage; die konkrete Tour besitzt eigene Mengen, Packorte und Kontrollzustände. Empfehlungen zeigen ihren Grund und werden ausdrücklich übernommen. Bestehende Daten und bewährte Funktionen werden erhalten; Umsetzung in prüfbaren Teiländerungen.

**Tech Stack:** Svelte 5, Vite 8, JavaScript, Dexie/IndexedDB (Schema 4), Vitest mit fake-indexeddb, Playwright/Chromium, GitHub Actions/Pages, vite-plugin-pwa. Reale Verantwortlichkeiten und Pfade: [Architektur](architecture.md); Testbefehle und Grenzen: [Prüfregister](verification.md).

**Spec:** Von Noah abgenommenes Konzept aus der Produkt-/UX-Analyse `packgenerator-analyse.html` vom 07.10.2026 (historischer Ausgangsstand v0.20.2, privat gespeichert). Verbindliche aktuelle Produktentscheidungen: [Entscheidungslog](decisions.md). Zielanwendung: https://noahdolmetsch-af.github.io/packgenerator/#/.

**Stand:** Version 1.1 · 07.10.2026 · mit `main` nach PR #32 abgeglichen. PR #30 liefert AP03–AP06; PR #32 veröffentlicht die ausgewählten Entwürfe 2 und 3. Der Gesamtplan ist damit teilweise umgesetzt. [Releasebeleg](releases/2026-10-07-calm-preparation.md) und [Prüfregister](verification.md) unterscheiden Implementierung, Prüfung und fachliche Abnahme.

**Nachtrag 08.10.2026 (Version 1.2):** Live ist v0.35.0. M1 bis M4 und AP25 sind als Software ausgeliefert, M5 teilweise; AP29 ist erledigt. Was pro Meilenstein mit welchem Release kam und die Reihenfolge nach 0.36 steht unten in [Stand und nächste Pakete (8.10.2026)](#stand-und-nächste-pakete-8102026). Die Abschnitte bis zum Fortschrittsregister beschreiben weiterhin den Plan und seine Kriterien.

## Global Constraints

- Primärer Produktkern: Tourvorbereitungs-Assistent für MTB, alpine Touren, Bikepacking und Ultracycling. Materialverwaltung unterstützt diesen Kern; Fahrradpflege liefert Bereitschaftsinformationen.
- Bestehende importierte Touren, Packhaken, Material-IDs, Vorlagen, Learnings und Werkstatthistorie erhalten; Datenübergänge vor Veröffentlichung prüfen.
- Neue Testdaten beginnen mit `test_data_gtp_`; keine bestehenden Nutzerdaten für negative oder destruktive Tests verwenden.
- „Material“ = Gegenstand; „Fahrradsetup“ = Bike, feste Anbauteile und Taschenpositionen; „Baustein“ = wiederverwendbare Materialgruppe; „Vorlage“ = wiederverwendbare Tourzusammenstellung; „Packliste“ = konkrete Tourinstanz.
- Zustände unterscheiden: vorgeschlagen, auf der Liste, noch einzupacken, gepackt, Bereitschaft offen/geprüft. „Weitere Materialien“ bezeichnet Materialien ausserhalb der Tour.
- Vorschläge werden ausdrücklich übernommen; Änderungen an einer Tour ändern nicht still das Standardsetup oder eine Vorlage. Undo erhalten.
- Fehlende Gewichte und Kapazitäten offen kennzeichnen; unbekannt bedeutet nicht null. Keine vollständige Gewichtssumme oder sichere Taschenpassung aus lückenhaften Daten behaupten.
- Beibehalten: Dunkelgrün/Orange, Fahrradfotos zur Orientierung, Packtag, serielle Wiegefunktion, Wunschliste, Vorlagen und Learnings mit Herkunft.
- Gestaltungsziel der Gesamtroadmap: Fira Sans für Inhalte/Bedienung; Titel 32–40 px, Abschnittstitel 20–24 px, Body 16 px, Labels 14 px, Zeilenhöhe ca. 1.5. Sofia Sans Extra Condensed auf Logo/wenige Akzente begrenzen. Schriftvergrösserung darf diese Basiswerte überschreiten.
- Für die ausgewählten Screens weichen die tatsächlichen Desktop-Titelgrössen von diesen Richtwerten ab (58/44/28 px, mobil 34/23 px). Dies folgt den gewählten Bildentwürfen; genaue Werte/Abweichungen in [Design-QA](../design-qa.md). Weitere Screens separat prüfen.
- Farbrollen: Dunkelgrün `#12372f`, neutrale Arbeitsflächen, dunkleres Aktionsorange z. B. `#b83e08` mit Weiss; Status zusätzlich durch Text/Symbol. Jede tatsächlich eingesetzte Farbkombination prüfen.
- Zielnavigation: Heute, Touren, Material, Fahrräder; innerhalb einer Tour Planen → Packen → Unterwegs → Rückblick. Inbox bleibt über Schnellnotiz erreichbar.
- Mobile Abnahme bei 320 und 390 CSS-Pixeln; zusätzliche Tablet-/Desktopkontrolle bei 768 und 1366 px. Packzeilen ca. 48 px hoch; kein wichtiger Inhalt ausschliesslich per Hover.
- Zielwerte: prüfbare MTB-Tagestourliste ohne Hilfe ≤60 Sekunden; Materialerfassung ≤30 Sekunden. Zeiten sind Ziele, keine bereits gemessenen Resultate.
- Keine neue Routenplanungs- oder Trainingsplattform als Teil dieser Umsetzung. GPX/Wetter unterstützen den vorhandenen Ablauf.
- Konzeptfreigabe, Umsetzung der Entwürfe 2/3 und Veröffentlichung von PR #32 sind dokumentiert. Dies ist keine Abnahme sämtlicher AP01–AP26. Weitere Softwareänderungen sind nicht Bestandteil der Dokumentationsrunde.

## Review Focus

1. Alte oder teilweise importierte Daten: beim Öffnen nicht automatisch umdeuten oder verlieren; geprüfte Migration und Wiederherstellung. Zuständig AP01/AP09/AP22.
2. Gegenstand aus mehreren Bausteinen oder Vorlage plus Wettervorschlag: kein unbemerktes Duplikat, keine ungefragte Mengenverdopplung. Zuständig AP10/AP13/AP15.
3. Manuell bestätigte Auswahl versus spätere Kontext-/Daueränderung: Änderungsvorschau statt stiller Überschreibung oder Löschung. Zuständig AP12/AP13/AP14/AP18.
4. Fehlende Gewichte, Volumen, Wettereingaben und widersprüchliche Mengenregeln: keine falsche Genauigkeit oder erfundene Empfehlung. Zuständig AP04/AP14/AP15/AP17/AP22.
5. Navigation, Neuladen, Tastatur und schmale Ansicht: richtige Tour, Packhaken, Fokus und Hauptaktionen bleiben verfügbar. Zuständig AP07/AP19/AP21/AP22.

## Arbeitsweise und Messung

Jedes AP besitzt ein eigenständig prüfbares Ergebnis. Die Checkboxen dokumentieren Arbeitsschritte; ein vollständig abgehaktes AP gilt erst mit erfüllten Abnahmekriterien und Beleg als **verifiziert**.

Statusfolge: **Geplant → In Arbeit → In Prüfung → Verifiziert**. **Teilweise veröffentlicht** benennt ausgelieferte Teilfunktionen mit offenen Gesamtkriterien; **Veröffentlicht / Restprüfung** benennt ausgelieferte Paketimplementierung mit noch unvollständiger formaler AP-Abnahme. **Blockiert** ist ein Zusatzstatus mit Ursache, zuständigem Folgepaket und nächstem Schritt. Für spätere Veröffentlichung kommt **Veröffentlicht** hinzu. Fachliche Konzeptabnahme und technisch verifizierte Umsetzung bleiben getrennt.

Pro AP erfassen: Status, Start/Ende, verantwortliche Person, tatsächlich betroffene Dateien, Testversion/Commit, bestandene und offene Kriterien, Screenshot/Testprotokoll, Abweichungen, nächsten Schritt. Verantwortlich zunächst: Umsetzung durch den ausführenden Agenten; Nutzungstest und fachliche Abnahme mit Noah. Es wird hier kein zusätzlicher Agent gestartet.

**Fortschrittsanzeige:** verifizierte Kernpakete / 24; dazu verifizierte Meilensteine / 6 und bestandene Prüffälle / 16. Paketanzahl misst Lieferfortschritt, nicht Arbeitsaufwand. Nicht pauschal „50 % Aufwand erledigt“ behaupten, wenn die Hälfte der Pakete verifiziert ist. AP25/AP26 separat als spätere Ausbaustufe führen.

**Aktuell:** Zwei veröffentlichte Umsetzungsschritte (PR #30 und #32); AP03–AP06 ausgeliefert, weitere APs teilweise bearbeitet. Keine vollständige formale AP-/Meilensteinabnahme aus einem erfolgreichen CI-Lauf ableiten: 0/24 vollständig nach diesem Register verifiziert, 0/6 vollständig formal abgenommene Kernmeilensteine, 0/16 vollständig nach dem Gesamtplan protokollierte Prüffälle. Das sind offene Nachweise, kein Nullstand der Implementierung. Einzelne bestandene Teilkriterien sind im [Prüfregister](verification.md) belegt. 227 Unit-Tests und 12 Browser-Tests am veröffentlichten Stand bestanden; Zeitziele noch nicht gemessen.

**Messprotokoll:** Vorher/Nachher gleiche Ausgangsdaten und Aufgaben verwenden. Zeitstart beim Öffnen der jeweiligen Startaktion, Zeitende bei sichtbarer prüfbarer Liste bzw. bestätigtem Materialeintrag. Eingaben vorab festlegen; Navigation und Entscheidungen gehören zur Zeit. Physisches Einpacken ist nicht Teil der 60-Sekunden-Messung. Pro Zeitaufgabe drei Versuche dokumentieren; Median und jeden Einzelwert berichten. Die erste Nutzung separat kennzeichnen; kein statistischer Erfolgsnachweis aus drei Versuchen ableiten.

**Technische Ergänzung vor Ausführung:** AP01 dokumentiert pro späterem AP reale Create-/Modify-/Test-Pfade, bestehende Schnittstellen, Start-/Testbefehle und Zielversion. Verhaltensverträge unten sind fachlich verbindlich; Quellcode-Signaturen werden aus dem Bestand abgeleitet. Ein AP darf nicht mit erfundenen Pfaden oder unbestimmtem Testkommando gestartet werden. Für Geschäftsregeln sinnvolle automatisierte Tests; für einfache Layout-/Textänderungen gezielte Browserabnahme. Unabhängige Teiländerungen getrennt versionieren.

## Meilensteine und verbindliche Reihenfolge

| Meilenstein | Pakete | Lieferergebnis | Abschlussbedingung |
|---|---|---|---|
| M0 – Grundlage | AP01–AP02 | Reproduzierbarer Ausgangsstand, Daten-/Begriffsmodell | Datenwiederherstellung geprüft; Regeln und technische Zuordnung dokumentiert |
| M1 – Sofortige Klarheit | AP03–AP06 | Lesbarkeit, Favoriten, Gewichte und Bereitschaft verständlich | Keine falsche Vollständigkeit oder widersprüchliche Statusaussage in den Prüffällen |
| M2 – Einfache Materialpflege | AP07–AP09 | Orientierung, schnelle Pflege und sichere Kategorieänderung | Material in ≤30 s erfassen; Zuordnungen bleiben bei Änderungen erhalten |
| M3 – Tour bestimmt Auswahl | AP12–AP16 | Kontextstart, Vorschläge, Mengen, Wetter und anlassgerechte Vorbereitung | MTB-Tagestourliste in ≤60 s; alpine Regeln nachvollziehbar |
| M4 – Vollständiger Tourablauf | AP10–AP11, AP17–AP20 | Bausteine, Zuordnung, Taschen, Vorlagen, Packtag, Fahrt und Rückblick | Bikepacking und Packkontrolle ohne Verlust/ungefragte Nebenänderung durchführbar |
| M5 – Abnahme und Veröffentlichung | AP21–AP24 | Mobile Prüfung, Integrationen, Messbericht und überprüfter Release | 16 Prüffälle bestanden; keine offenen Freigabeblocker; Rückkehr zur Vorversion vorbereitet |
| M6 – Spätere Ausbaustufe | AP25–AP26 | Erklärbares Lernen; begründete Synchronisationsentscheidung | Getrennte Nachweise; nicht erforderlich für Abschluss von M0–M5 |

Ursprünglich freigegebene Ausführungsreihenfolge: AP01–AP09 → AP12–AP16 → AP10–AP11 → AP17–AP24. Die IDs bleiben für dauerhafte Referenzen unverändert. Die Tourverbesserungen verwenden zunächst bestehende Rollen, Nachtsets und Vorlagen; eine neue Bausteinverwaltung blockiert sie nicht. AP03/AP04/AP05 sind nach AP02 weitgehend unabhängig. Bei AP10/AP11 werden die bestehenden Auswahlverträge integriert und erneut geprüft. AP21 beginnt bereits mit frühen Ansichten und wird am Ende vollständig abgeschlossen. Die spätere Ausbaustufe wird nicht zur Voraussetzung für den Kernrelease gemacht.

## Abgleich, Abweichungen und nächste Lieferfolge

Die AP-IDs, fachlichen Verträge und ursprünglichen Abhängigkeiten bleiben erhalten. Noah hat zusätzlich ausdrücklich die Entwürfe 2 und 3 ausgewählt und zur Umsetzung freigegeben. Deshalb wurden Teile von AP13–AP15/AP19/AP21/AP24 vorgezogen. Das ist ein dokumentierter Teilschritt; die fehlenden Grundlagen werden nicht als erledigt umetikettiert.

- PR #30 / v0.22.0: gemeinsame Typografie/Farbrollen, ehrliche Summen, Favoriten und Bereitschaft (AP03–AP06). Seine Änderungen wurden in PR #32 erhalten.
- PR #32 / Merge `be041f14fd35fd3caf98e8e7b7284bda9dcb98f9`: Entscheidungsentwurf und ruhige Packliste, lokale Schriften, mobile Zeilen, bestehende Packkontrolle. Anzeigeversion weiterhin **0.22.0**; Commit und PR unterscheiden die beiden Lieferstände.
- PR #31 / angekündigt v0.22.1: Eventmodus, relative Fälligkeitstexte, „Weitere Dinge“ und Gear-Korrektur. **Offen und nicht live.** Beim ersten Abgleich bestanden Softwarekonflikte; inzwischen integriert Commit `05a7f841e1a8da5509eed88c27a0d9cb7fc40616` die Screens aus PR #32 samt Event-Schalter. CI-Lauf 37667778399 ist erfolgreich. Die danach entstandenen Dokumentkonflikte mit PR #34 werden in dieser Dokumentationsrunde gemeinsam nachgeführt. Zu AP04/AP06/AP16/AP21 zuordnen; fachliche Releaseabnahme und Veröffentlichung bleiben separat.
- Alte Etappen A–D/Paket-5-Planung ist historische Planung. Bereits ausgelieferte Reisearten bleiben erhalten; offene Fragen daraus sind keine zweite aktive Roadmap. Die erste echte Arbeitsweg-Tour mit Rückblick ist ein Nutzungstest innerhalb AP23 und später AP25.

| Reihenfolge ab jetzt | Konkretes Ergebnis | Erfolgskriterium / Nachweis | Abhängigkeit |
|---|---|---|---|
| 1. Abnahme der ausgelieferten Screens | Entscheidung und Packliste mit MTB/Alpin/Bikepacking prüfen | Bestätigung/Abbruch verständlich; Packkontrolle erreichbar; offene Punkte pro AP protokolliert | AP13–15/AP19; AP21/AP23 |
| 2. Grundlagen nachziehen | AP01/AP02 technisch zugeordnet, Restore-Belege und Auswahlrangfolge vollständig | IDs/Mengen/Haken nach Rundlauf erhalten; jede Prioritätsregel mit Beispiel | Grundlage für die nächsten Softwareänderungen |
| 3. Eventmodus abnehmen | Integrierten PR #31 nach Dokumentabgleich fachlich abnehmen; keine alte Pack-Ansicht zurückbringen | Kurzfahrt ohne Eventwarnlast; Eventfahrplan bleibt; vorhandene bestätigte Aufgaben sichtbar | AP06/AP12/AP16; erneute CI/Browserprüfung |
| 4. Kontextstart und Mengenregeln | Übernachtung/Dauer/Kochen vor Auswahl; nachvollziehbare Revision | PF01–PF06; Tagestour-Median ≤60 s; keine stille Mengenüberschreibung | AP12–AP16; AP08/AP09 bleiben ursprüngliche Abhängigkeiten |
| 5. Materialpflege und Gesamtabnahme | Suche/kurzer Dialog, Referenzen, danach Bausteine/Taschen/Vorlagen | Erfassung-Median ≤30 s; PF07–PF16 und vollständige Mobilprüfung | AP07–AP11/AP17–AP24 |

Dies ist eine Abnahme- und Integrationsreihenfolge. Sie hebt keine technischen Abhängigkeiten auf. Schritte 1–3 können dokumentarisch bzw. als gezielte Integration vorgezogen werden; neue Auswahlfunktionen benötigen die jeweils genannten Grundlagen.

## M0 – Grundlage

### AP01 – Code-, Daten- und Messbasis sichern

**Priorität/Aufwand:** P1 / mittel. **Abhängigkeiten:** keine. **Eingang → Ergebnis:** Live-Anwendung, Analyse und bereitgestellter Export → dokumentierter, wiederherstellbarer Ausgangsstand und technische AP-Zuordnung.

- [x] Zugehöriges Repository, tatsächlich ausgelieferte Version, Start-/Build-/Testbefehle und Datenhaltung ermitteln; keine andere Cockpit-App aus früheren Projekten als Ziel annehmen.
- [ ] Bestand exportieren/sichern; Originaldatei unverändert erhalten; isolierten Testbestand mit den fünf Alltagsszenarien aufsetzen und Wiederherstellung darin prüfen.
- [ ] Bestehende Datenfelder und Verantwortlichkeiten für Materialien, Kits, Vorlagen, Touren, Container, Pflege und Learnings dokumentieren; reale Dateipfade/Schnittstellen an spätere APs binden.
- [ ] Ausgangsmessungen für Tourstart, Materialerfassung, Suchen, unpassende Gegenstände und offene Fehler protokollieren.

**Abnahme:** Import-/Restore-Rundlauf erhält IDs, Mengen, Tourzuordnungen und Packhaken; bekannte Referenzzahlen aus dem gelieferten Export dienen als Kontrollwerte. Aktueller Browserbestand kann zusätzliche Testdaten enthalten und wird separat gezählt. Build und vorhandene relevante Tests sind reproduzierbar oder konkret als blockiert dokumentiert. Beleg: Datenvergleich und Basisprotokoll.

### AP02 – Begriffe, Zustände und Regelkonflikte verbindlich ordnen

**Priorität/Aufwand:** P1 / mittel. **Abhängigkeiten:** AP01. **Eingang → Ergebnis:** Bestandsmodell → verständliches Glossar, Auswahl-/Statusregeln und Kompatibilitätsentscheidung.

- [ ] Begriffe aus Global Constraints den vorhandenen Rollen, Nachtsets, Kits und Vorlagen zuordnen; acht importierte Kits auf tatsächlichen Inhalt prüfen.
- [ ] Zustände sowie Pflege-/Event-/Pack-Prüfbereiche definieren; owned/unclear/wishlist/gone beim Vorschlagen und Zählen eindeutig behandeln.
- [ ] Konfliktfälle festlegen: manuelle Bestätigung bleibt erhalten; strukturierte bestätigte Regel steuert Berechnung; widersprüchlicher Freitext/Learning fordert Klärung statt stillen Vorrang.
- [ ] Beispiele für Tagestour, Unterkunft, Outdoor und doppelte Bausteinherkunft durchgehen und dokumentieren.

**Abnahme:** Jeder bestehende Datenbegriff ist zugeordnet oder ausdrücklich als Legacyinformation beschrieben. Keine automatische Löschung/Umdeutung. Wunschliste und weggegebene Gegenstände erscheinen nicht als verfügbare Standardausrüstung; fehlende Ausrüstung bleibt als Bedarf sichtbar. Unklare Angaben werden gekennzeichnet. Die konkrete Rangfolge ist vor Umsetzung von AP13/AP14 ausformuliert.

## M1 – Sofortige Klarheit

### AP03 – Typografie, Farbrollen und Bedienkomponenten beruhigen

**Priorität/Aufwand:** P1 / klein–mittel. **Abhängigkeiten:** AP02. **Eingang → Ergebnis:** vorhandene Identität → konsistente lesbare Arbeitsoberfläche.

- [x] Schrift-/Farbhierarchie und Abstände als wiederverwendbare Gestaltungswerte festhalten; Logoidentität erhalten.
- [x] Primär-/Sekundäraktionen, Inputs, Hinweise und Fokusdarstellung an zwei zentralen Ansichten anwenden; starke Rahmen und Arbeitsflächenmuster reduzieren.
- [x] Kleine weisse Texte auf Orange durch geprüfte Farbpaarung ersetzen; nur aktuelle Hauptaktion stark betonen.
- [ ] Desktop, lange Namen und Schriftvergrösserung prüfen; Freigabebild festhalten.

**Abnahme:** normale Texte mindestens 4.5:1 Kontrast, erkennbare Fokuszustände, lesbare Titel und keine abgeschnittenen Aktionsbeschriftungen. Warnungen/Erfolg durch Text zusätzlich zur Farbe. Kein eigener Gesamtkonformitätsanspruch aus diesen Einzelprüfungen.

### AP04 – Packbegriffe und unvollständige Gewichte korrigieren

**Priorität/Aufwand:** P1 / klein–mittel. **Abhängigkeiten:** AP02. **Eingang → Ergebnis:** Materiallisten und Gewichtsdaten → eindeutige Statusbegriffe und ehrliche Summen.

- [x] „Not packed“ in der Planungsbibliothek in „Weitere Materialien“ bzw. entsprechende englische Beschriftung ändern.
- [x] Bekannte Gewichtssumme, fehlende Gewichte und gemessene/geschätzte Bikegewichte nebeneinander darstellen.
- [x] Front-/Heckverteilung bei unvollständigen Daten als Schätzung kennzeichnen; Prozentwerte nicht als gesicherte Präzision darstellen.
- [ ] Nullgewicht, unbekanntes Gewicht, mehrere Stücke und vollständig gewogenen Bestand vergleichen.

**Abnahme:** 86 fehlende Bestandsgewichte sind sichtbar an der bekannten Summe; unbekannte Gewichte werden nicht als null gemessen ausgewiesen. „Weitere Materialien“ und „noch einzupacken“ zählen unterschiedliche, korrekt definierte Mengen.

### AP05 – Favoriten direkt bedienen und korrekt öffnen

**Priorität/Aufwand:** P1 / klein. **Abhängigkeiten:** AP02/AP03. **Eingang → Ergebnis:** Favoritenflag und Suche → eine direkte Aktion und verlässlicher Einstieg.

- [x] Sternaktion in der Materialzeile mit verständlichem Namen und gedrücktem Zustand anbieten.
- [x] Home-Favoritenlink mit aktivem Filter öffnen; Navigieren/Zurück behält nachvollziehbaren Filterzustand.
- [x] Favoritenzahlen auf gleiche Zählbasis bringen oder verschiedene Zählbasen ausdrücklich beschriften.
- [ ] Favorisieren/Entfavorisieren, Nulltreffer und verschiedene Besitzstatus prüfen.

**Abnahme:** genau eine Aktion ändert den Favoriten; Änderung bleibt nach Navigation/Neuladen erhalten. Home-Einstieg zeigt nur passende Favoriten. Kein ungefiltertes Ergebnis unter einer Favoritenüberschrift. Bestehende Favoriten gehen nicht verloren.

### AP06 – Bereitschafts- und Pflegehinweise vereinheitlichen

**Priorität/Aufwand:** P1 / mittel. **Abhängigkeiten:** AP02/AP04. **Eingang → Ergebnis:** Pflege-, Event- und Packstatus → gleiche Aussagen in Home, Tour und Care.

- [x] Ursache der beobachteten unterschiedlichen Anzeigen im Code/Datenstand prüfen und dokumentieren.
- [x] Bikepflege, Eventvorbereitung und Packkontrolle getrennt beschriften und mit gleichem Geltungsbereich zusammenfassen.
- [x] Hinweise zum richtigen Bike, zur richtigen Tour und zur konkreten offenen Aufgabe führen.
- [ ] Scott-Spark-Fall sowie mehrere Bikes und mehrere bevorstehende Touren prüfen.

**Abnahme:** eine einschlägige überfällige Pflegeaufgabe erzeugt nicht gleichzeitig ein unqualifiziertes „alles gut“. Unterschiedliche Prüfbereiche dürfen unterschiedliche Zahlen haben, müssen aber klar benannt sein. Fehlende Wartungsinformation bedeutet nicht „geprüft in Ordnung“.

## M2 – Einfache Materialpflege

### AP07 – Navigation und Heute-Ansicht auf Touren ausrichten

**Priorität/Aufwand:** P2 / mittel. **Abhängigkeiten:** AP03/AP06. **Eingang → Ergebnis:** bestehende Wege → Heute/Touren/Material/Fahrräder mit eindeutigem Fortsetzen.

- [ ] Neue Hauptnavigation und erreichbare Unterseiten zuordnen; bestehende Links/Deep Links erhalten oder gezielt weiterleiten.
- [ ] Heute zeigt nächste Tour und genau eine dominante passende nächste Handlung; Pflege, Backup und Learnings nachgeordnet.
- [ ] Schnellnotiz/Inbox erreichbar lassen und Debrief mit Tourende verbinden.
- [ ] Leerer Bestand, mehrere Touren, Zurücknavigation und falsche-Tour-Verwechslung prüfen.

**Abnahme:** alle bestehenden Kernbereiche bleiben erreichbar; Fortsetzen öffnet die angezeigte Tour. Keine Tourauswahl geht beim Wechsel verloren. Fehlende Tour bietet einen verständlichen Start; fehlendes Bike eine direkte Erfassungsmöglichkeit.

### AP08 – Materialliste und Erfassung vereinfachen

**Priorität/Aufwand:** P2 / mittel. **Abhängigkeiten:** AP03/AP05/AP07. **Eingang → Ergebnis:** grosser Bestand → Suche/Ergebnisse zuerst, kurzer Erfassungsdialog.

- [ ] Suche, Filter und Materialzeilen vor die Gewichtsanalysen stellen; Analysen aufklappbar machen.
- [ ] Primärerfassung auf Name, Kategorie, Status und optional Gewicht begrenzen; weitere Regeln separat öffnen.
- [ ] Wiederkehrende Zeilen mit Name, Rolle/Kategorie, Gewicht/offen, Favorit und Zuordnen gestalten; bestehende Wiege- und Bestandskontrolle erhalten.
- [ ] Materialerfassung messen und Nulltreffer, lange Namen und 190+ Einträge prüfen.

**Abnahme:** ein neuer Gegenstand ist mit drei Pflichtangaben ohne Regelkonfiguration speicherbar; Gewicht darf fehlen. Median der drei Erfassungsversuche ≤30 Sekunden. Gesuchtes Material erscheint ohne vorgeschaltete Analyseflächen. Bestehende erweiterte Angaben bleiben erhalten.

### AP09 – Kategorie ändern, Referenzen erhalten

**Priorität/Aufwand:** P2 / mittel. **Abhängigkeiten:** AP01/AP02/AP08. **Eingang → Ergebnis:** bestehender Materialdialog → korrigierbare Kategorie ohne verlorene Verknüpfung.

- [ ] Bestehende Abhängigkeit zwischen Kategorie, ID, Container-/Gewichtslink und Zuordnungen ermitteln.
- [ ] Kategorieänderung über stabile Referenzen ermöglichen; nötigen Datenübergang mit Wiederherstellung planen.
- [ ] Testmaterial gleichzeitig in Tour, Vorlage, Baustein und gegebenenfalls Containerreferenz verwenden und Kategorie ändern.
- [ ] Export/Import-Rundlauf und Rückkehr zur Vorversion prüfen.

**Abnahme:** kein verlorener Gegenstand, keine verlorene Menge, kein verlorener Packhaken und keine kaputte Gewichtsreferenz nach Kategorieänderung. Legacy-IDs werden nicht allein wegen ihrer Schreibweise still ersetzt.

## M3 – Tour bestimmt Auswahl

### AP12 – Tourkontext vor der Packliste erfassen

**Priorität/Aufwand:** P1 / mittel. **Abhängigkeiten:** AP02/AP07. **Eingang → Ergebnis:** Absicht → gespeicherter Kontext vor Generierung.

- [ ] Tourart, Bike, Datum/Tage, Fahrstunden, Übernachtung und Wetter in einen verständlichen Start bringen; GPX und Zusatzdetails optional.
- [ ] Tagestour, Unterkunft und Outdoor unterscheiden; Kochen bewusst abfragen. Bei mehreren Tagen Fahrstunden je Tag klar von Gesamtdauer trennen.
- [ ] Leere/ungültige Angaben verständlich behandeln: keine negative Dauer, mindestens ein Tag, gültiges Bike; fehlendes Wetter als offen kennzeichnen.
- [ ] Kurzfahrt, alpine Tour, Unterkunft und Outdoor sowie spätere Kontextänderung prüfen.

**Abnahme:** gewählter Kontext ist vor dem Erstellen sichtbar und bleibt gespeichert. Unterkunft löst kein Zeltset aus; eine Tagestour kein automatisches Nachtset. Eine spätere Kontextänderung löscht keine manuell bestätigten Gegenstände still.

### AP13 – Kontextgerechte Auswahl mit Wirkungsvorschau

**Priorität/Aufwand:** P1 / mittel. **Abhängigkeiten:** AP02/AP08/AP09/AP12; spätere Integration AP10/AP11. **Eingang → Ergebnis:** Kontext + Material/Regeln/Vorlage → nachvollziehbare prüfbare Auswahl.

- [ ] Passende Ausgangsauswahl für Tagestour, Unterkunft und Outdoor aus vorhandenem Material erzeugen; Vorlagen als bewussten Start anbieten.
- [ ] Gründe und Herkunft an Vorschlägen zeigen; neu, bereits vorhanden, ersetzt und Menge geändert unterscheiden.
- [ ] Übernehmen/Verwerfen und Undo umsetzen; manuelle Auswahl erhalten; Wunschliste/fehlender Besitz als Bedarf kennzeichnen.
- [ ] Konflikte mit „immer dabei“, falschem Übernachtungskontext, mehreren Gruppen und veralteter Vorlage prüfen.

**Abnahme:** MTB, zwei Stunden, ein Tag, keine Übernachtung liefert eine prüfbare Tagestourliste ohne nötiges Entfernen von Nachtmaterial. Kein stilles Hinzufügen und keine Mengenverdopplung durch mehrere Herkünfte. Median der drei Zeitversuche bis zur prüfbaren Liste ≤60 Sekunden.

### AP14 – Mengen nach Dauer nachvollziehbar prüfen

**Priorität/Aufwand:** P1 / mittel. **Abhängigkeiten:** AP02/AP12/AP13. **Eingang → Ergebnis:** bestätigte Mengenregel + Stunden → Vorschlag mit Grenzen und Konflikten.

- [ ] Für bestätigte Intervallregel den fachlichen Vertrag festhalten: vorgeschlagene Stückzahl = aufgerundete Fahrstunden / Stunden je Stück; Verfügbarkeit und Maximalmenge separat darstellen.
- [ ] Bei Daueränderung alte und vorgeschlagene Menge vergleichen; manuelle Mengen bis zur Bestätigung erhalten.
- [ ] Widerspruch zwischen strukturierter Regel, Freitext und Learning anzeigen; Flaschenkapazität, Bedarf und Nachfüllplanung unterscheiden.
- [ ] Zwei/sechs Stunden, Bestandsmangel, Maximalmenge, ungültige Regel und Mehrtagestour prüfen.

**Abnahme:** Regel ein Stück je drei Stunden liefert bei zwei Stunden 1 und bei sechs Stunden 2 als nachvollziehbaren Vorschlag. Fehlender Bestand reduziert nicht unsichtbar den angezeigten Bedarf. Die vorhandene widersprüchliche Gelnotiz wird zur Klärung angezeigt. Mehrtagestour erklärt, ob Tagesmenge oder mitzuführende Gesamtmenge gemeint ist; keine automatische Flaschenverdopplung ohne passende Kapazität/Platzprüfung.

### AP15 – Wetter, Schichten und Alternativen erklären

**Priorität/Aufwand:** P2 / mittel. **Abhängigkeiten:** AP12/AP13/AP14. **Eingang → Ergebnis:** Wetter + Auswahlregeln/Learnings → begründete Schichtauswahl.

- [ ] Temperatur/Rain-Vorgaben und optionale Forecastwerte mit Quelle/Unsicherheit anzeigen.
- [ ] Alternative und zusätzliche Schicht unterscheiden; Auswirkung auf bereits getragene/gepackte Kleidung zeigen.
- [ ] Passende persönliche Learnings mit Herkunft anzeigen; widersprüchliche Erfahrungen nicht automatisch als feste Regel behandeln.
- [ ] 4–12 °C/Schauer, fehlendes Wetter, alternative Jacken und mehrere aktive Temperaturschwellen prüfen.

**Abnahme:** Add all besitzt eine verständliche Vorschau; mehrere Alternative-Jacken werden nicht als unbemerkte Doppelung übernommen. Jede Wetterempfehlung hat einen Grund; vorhandene persönliche Auswahl bleibt kontrollierbar. Bereits vorhandener Gegenstand wird nicht nochmals hinzugefügt.

### AP16 – Kurzfahrtchecks und Eventfahrplan trennen

**Priorität/Aufwand:** P1 / mittel. **Abhängigkeiten:** AP06/AP12. **Eingang → Ergebnis:** Anlass + Tourdatum + Bikepflege → passende Vorbereitung.

- [ ] Mehrwöchige Eventvorbereitung als eigenen expliziten Modus behandeln, getrennt von aktuellen Bikechecks.
- [ ] Kurzfahrt mit Abfahrtscheck und tatsächlich fälliger Pflege darstellen.
- [ ] Eventaufgaben zum Tourdatum erklären; bei kurzfristigem Anlegen Prioritäten statt pauschalem Alarm zeigen.
- [ ] MTB am Folgetag, ausdrücklich geplantes Event und fällige Dichtmilch prüfen.

**Abnahme:** zweistündige Kurzfahrt erzeugt keine automatisch überfälligen Dreiwochen-Setupaufgaben. Eventmodus behält rückwärts terminierten Fahrplan. Tatsächlich fällige Pflege bleibt bei beiden Tourarten sichtbar.

## M4 – Vollständiger Tourablauf

### AP10 – Bausteine und vorhandene Kits verständlich verwalten

**Priorität/Aufwand:** P2 / mittel–gross. **Abhängigkeiten:** AP02/AP09. **Eingang → Ergebnis:** importierte Kits/Nachtsets → sichtbare wiederverwendbare Materialgruppen.

- [ ] Bestehende Kits und Nachtsets nach AP02 abgleichen; Inhalt und Herkunft anzeigen statt gleichnamige Gruppen blind zusammenzuführen.
- [ ] Baustein erstellen/bearbeiten und zugehörige Materialien samt Mengen sichtbar machen.
- [ ] Bausteinänderung von bereits gespeicherter Tourinstanz trennen; Wirkung auf künftige Verwendung erklären.
- [ ] Leeren Baustein, fehlendes/weggegebenes Material und denselben Gegenstand in zwei Bausteinen prüfen.

**Abnahme:** Inhalt und Einsatz eines Bausteins sind ohne Kenntnis des Datenmodells verständlich. Ein Gegenstand aus zwei Gruppen wird beim späteren Übernehmen nicht unbeabsichtigt doppelt eingepackt; Herkunft bleibt nachvollziehbar. Alte Touren ändern sich nicht ungefragt.

### AP11 – Material gezielt zuordnen

**Priorität/Aufwand:** P2 / mittel. **Abhängigkeiten:** AP08/AP09/AP10. **Eingang → Ergebnis:** Gegenstand + Ziel → bestätigte wiederverwendbare Zuordnung.

- [ ] „Zuordnen“ aus Materialzeile/Dialog anbieten; Zieltyp und Wirkung nennen: Baustein, Vorlage, konkrete Tour bzw. geeigneter Fahrradsetup-Bestandteil.
- [ ] Beim Fahrradsetup Taschen und feste Anbauteile von allgemeinem Tourmaterial unterscheiden; Kategorie nicht mit Packort verwechseln.
- [ ] Neue/entfallende Zugehörigkeit bestätigen und Rückgängig ermöglichen; vorhandene Zuordnung anzeigen.
- [ ] Wiederholte Zuordnung, mehrere Herkunftsgruppen und touchfähige Bedienung prüfen.

**Abnahme:** Zuordnung verändert den angegebenen Zielbereich und keine fremde Tour. Wiederholtes Bestätigen erzeugt keine Duplikate. Packort bleibt in der konkreten Tour anpassbar. Wesentliche Bedienung benötigt kein Drag-and-drop.

### AP17 – Taschen und Packorte passend vorschlagen

**Priorität/Aufwand:** P2 / mittel. **Abhängigkeiten:** AP04/AP12/AP13. **Eingang → Ergebnis:** Bike + Materialgruppen + Taschen → bestätigbare Tourkonfiguration.

- [ ] Fahrradstandard als Ausgangspunkt erhalten; eigene Tourtaschen klar kennzeichnen.
- [ ] Bei Schlaf-/Kochmaterial geeignete verfügbare Taschenkonfiguration und Packorte vorschlagen.
- [ ] Fehlendes Volumen/Gewicht und fehlende Montageposition offen anzeigen; vorhandene Kapazität von behaupteter Passung unterscheiden.
- [ ] Zelt umpacken, Tasche wechseln, unpassende Position, unbekanntes Volumen und Undo prüfen.

**Abnahme:** Drei-Tage-Outdoor-Tour bietet Schlaf-/Kochmaterial und eine überprüfbare Taschenwahl. Änderung bleibt tourbezogen; Standardsetup anderer Touren unverändert. Bei unbekanntem Packvolumen erscheint keine unbewiesene Aussage „passt“ oder „überfüllt“.

### AP18 – Vorlagen speichern und sauber wiederverwenden

**Priorität/Aufwand:** P2 / mittel. **Abhängigkeiten:** AP13/AP17. **Eingang → Ergebnis:** bestätigte Zusammenstellung → neue Tour mit wiederverwendeter Konfiguration.

- [ ] Speicherumfang aus bestehendem Verhalten prüfen: Gegenstände, Orte, Mengen, Checkdefinitionen, Dauer/Nachtsets; kein übernommener Packhaken.
- [ ] Neuerstellung und Aktualisieren einer Vorlage unterscheiden; Wirkung und Ausschlüsse erklären.
- [ ] Neue Tour aus Vorlage erzeugen und Bike/Wetter/Datum gezielt neu erfassen oder bestätigen.
- [ ] Vorlage mit fehlendem Material, anderer Taschenkonfiguration und bereits gepackter Ursprungstour prüfen.

**Abnahme:** eine Vorlage aus einer vollständig abgehakten Testtour erzeugt eine neue Tour mit offenen Pack- und Bereitschaftschecks. Ursprungstour bleibt unverändert; Orte/Mengen der Vorlage sind nachvollziehbar übernommen. Vorschläge dürfen bestätigte Mengen nicht still ersetzen.

### AP19 – Packtag und Bereitschaft zuverlässig abschliessen

**Priorität/Aufwand:** P1 / mittel. **Abhängigkeiten:** AP04/AP06/AP17/AP18. **Eingang → Ergebnis:** konkrete Packliste → getrennt bestätigte Pack- und Bereitschaftszustände.

- [ ] Tasche-für-Tasche-Bedienung und grosse tappbare Zeilen erhalten; dominante Handlung zum nächsten Schritt anbieten.
- [ ] Gepackte Gegenstände und Bereitschaftsprüfungen getrennt zählen; Mengen/Packortänderung mit bereits bestätigtem Status nachvollziehbar behandeln.
- [ ] Speichern, Navigation, Neuladen und Wiederaufnahme prüfen; Undo auf passenden Zustand beziehen.
- [ ] Teilweise gepackte Tour, entferntes Material, neue Zusatzmenge und zwei gleichzeitig vorhandene Touren prüfen.

**Abnahme:** Haken aktualisiert den richtigen Zähler und bleibt nach Navigation/Neuladen erhalten. Bereitschaft wird nicht allein aus Packfortschritt als erledigt ausgegeben. Neue Gegenstände erscheinen offen; bei nachträglich zusätzlicher Menge fordert die App eine nachvollziehbare Bestätigung statt still alles als gepackt auszugeben.

### AP20 – Unterwegs und Rückblick an die Tour anbinden

**Priorität/Aufwand:** P2 / mittel. **Abhängigkeiten:** AP07/AP19. **Eingang → Ergebnis:** vorbereitete Tour → Wiederfinden, Notiz und kurzer Rückblick.

- [ ] „Was ist wo“ und Tagesansichten erhalten; fehlende Route/Wetter mit nutzbarem Leerzustand erklären.
- [ ] Schnellnotiz der richtigen Tour/Tagesetappe zuordnen; Inbox als Ergänzung erreichbar lassen.
- [ ] Tourende führt zum passenden Rückblick; gebraucht, gefehlt und ungenutzt unterscheiden.
- [ ] Learning mit Herkunft sichtbar machen; spätere automatisierte Anpassung nicht ungeprüft auslösen.

**Abnahme:** Notiz/Rückblick landet bei der richtigen Testtour. Lernhinweis enthält nachvollziehbare Herkunft. Abschluss einer Tour verändert keine andere Tour; bestehende 45 importierte Learnings bleiben erhalten.

## M5 – Abnahme und Veröffentlichung

### AP21 – Mobile Bedienung und grundlegende Barrierefreiheit prüfen

**Priorität/Aufwand:** P1 / mittel. **Abhängigkeiten:** AP03; abschliessend AP07–AP20. **Eingang → Ergebnis:** zentrale Ansichten → belegte responsive und tastaturfähige Abläufe.

- [x] Tourvorbereitung, Material und Packtag bei 320/390/768/1366 px prüfen; mobile Ansicht in einer tatsächlich geeigneten Testumgebung öffnen. (Abnahme 9.10.2026 (0.44.1): 11 Kernansichten in Chromium mit Touch-Emulation, kein Querscrollen, keine abgeschnittene Hauptaktion; ein echtes Handy bleibt offen.)
- [ ] Einspaltige Reihenfolge, lange Namen, Filterdialog, Tastatureinblendung und wichtige Aktionen ohne Hover prüfen; Packzeilen ca. 48 px. (Abnahme 9.10.2026 (0.44.1): Packzeilen 60 px, lange Namen ohne Querscrollen, 4 Stellen mit zu kleinen Tippflächen behoben; offen: Tastatureinblendung am echten Handy; kleine Knöpfe und Velo-Skizze in 0.45.0 auf 44 px gebracht.)
- [ ] Tastaturabläufe, sichtbaren Fokus, Dialog-Fokus/Fokusrückgabe, Beschriftungen und Statusmeldungen prüfen; zentrale Abläufe mit Screenreader stichprobenartig kontrollieren. (Abnahme 9.10.2026 (0.44.1): Tastatur-Rundgang mit 78 Tasten, Fokus sichtbar, Fokusrückgabe an 2 Stellen behoben, keine Bedienelemente ohne Namen, keine doppelten IDs; 0.45.0: Fokus auf den Namen nach „Tour erstellen“; Screenreader offen.)
- [x] Gefundene Fehler den verursachenden APs zuordnen und mit Vorher/Nachher-Belegen nachprüfen. (Abnahme 9.10.2026 (0.44.1), Browser-Test `tests/e2e/abnahme044.spec.js`.)

**Abnahme:** keine horizontale Seitenscrollleiste/abgeschnittene Hauptaktion in den Kernansichten bei 320/390 px. Bedienbare Suche, Filter, Zuordnung und Packhaken mit Tastatur und Touch. Kein „mobil verifiziert“, wenn nur Desktop oder CSS geprüft wurde. Fehlende Testmöglichkeit ist ein offener Nachweis, kein bestandenes Kriterium.

### AP22 – Ungeprüfte Funktionen und Datenübergänge absichern

**Priorität/Aufwand:** P1 / mittel. **Abhängigkeiten:** AP01/AP18/AP20. **Eingang → Ergebnis:** zuvor offene Funktionsprüfungen → Belege, verständliche Fehlzustände und Datenkontinuität.

- [x] GPX-/Wetterablauf mit synthetischer Route/öffentlichem Testort prüfen: fehlende, gültige und ungültige Datei; keine privaten Ortsdaten ungefragt teilen. (Abnahme 9.10.2026 (0.44.1): leer, kein XML, ohne Punkte, gültig; Open-Meteo gemockt und ausgefallen, der Kernablauf läuft.)
- [x] Foto-Upload, PDF/Druck und Teilen in zweiter Testsitzung prüfen; nur ausdrücklich als teilbar definierte Testdaten verwenden. (Abnahme 9.10.2026 (0.44.1): Druckansicht, Teilen-Link in zweiter Seite nur lesbar; echter Druckdialog und Teilen-Menü des Handys offen.)
- [x] Offline-/Wiederonline-Verhalten, Neuladen und Backup-/Importstatus prüfen; die beobachtete Gerätetrennung klar erklären. (Abnahme 9.10.2026 (0.44.1): mit Service Worker offline neu geladen, eine Änderung offline bleibt erhalten.)
- [x] Export/Import mit allen Kernreferenzen, falschem Dateiformat, identischen IDs und Konflikten prüfen; verständliche Vorschau/Fehler und Wiederherstellung dokumentieren. (Abnahme 9.10.2026 (0.44.1): 15 Tabellen, Abbrechen und 5 falsche Dateien ändern nichts, Zusammenführen mit gleichen IDs ohne Doppel.)

**Abnahme:** jede geprüfte Funktion besitzt einen Erfolgsbeleg oder bleibt eindeutig als begrenzt/offen gekennzeichnet. Keine Erfolgsmeldung nach fehlgeschlagener Aktion. Import zeigt Umfang und Überschreibwirkung; existierende Daten bleiben beim Abbruch unverändert. Kernablauf hängt nicht zwingend von GPX/Wetterdienst ab.

### AP23 – Fünf Alltagsszenarien messen und fachlich abnehmen

**Priorität/Aufwand:** P1 / mittel. **Abhängigkeiten:** AP13–AP22. **Eingang → Ergebnis:** Testversion → Vorher/Nachher-Protokoll mit bestandenen Prüffällen.

- [x] Prüffälle PF01–PF16 mit gleichen Ausgangsdaten durchspielen; Zeiten und tatsächliche Klick-/Entscheidungsschritte protokollieren. (Abnahme 9.10.2026 (0.44.1): automatisch auf Phone und Desktop; Maschinenzeit, nicht Personenzeit.)
- [ ] Fünf Alltagsszenarien mit Noah prüfen: zwei Stunden MTB, sechs Stunden alpin, drei Tage Bikepacking, Materialpflege, bestehende Liste anpassen. (Abnahme 9.10.2026 (0.44.1): automatisch gespielt und bestanden; mit Noah offen.)
- [x] Gegen Ziele vergleichen; nötige Nachtmaterial-Entfernungen, doppelte Vorschläge, verlorene Referenzen/Haken und widersprüchliche Statusmeldungen zählen. (Abnahme 9.10.2026 (0.44.1): alle vier Zählungen 0.)
- [x] Abweichungen in die jeweiligen APs zurückführen; nach Änderungen nur betroffene Prüffälle plus relevante Regression wiederholen. (Abnahme 9.10.2026 (0.44.1): ganze Browser-Suite wiederholt.)

**Abnahme:** alle 16 Prüffälle bestanden und belegt; Zeitziele nach dokumentierter Methode erreicht. Offene Datennachpflege darf bestehen, wenn die App sie ehrlich zeigt; Datenverlust, falsche Mengenübernahme und nicht nutzbare Hauptabläufe blockieren den Abschluss.

### AP24 – Release prüfen, veröffentlichen und Fortschritt abschliessen

**Priorität/Aufwand:** P1 / klein–mittel. **Abhängigkeiten:** AP21/AP22/AP23. **Eingang → Ergebnis:** abgenommene Testversion → nachweislich korrekte veröffentlichte Version.

- [x] Releaseumfang, tatsächliche Version, Datenübergang und Anleitung zur Rückkehr zur Vorversion festhalten; relevante Build-/Testprüfungen abschliessen. (Abnahme 9.10.2026 (0.44.1): Abnahme-Bericht mit Rückkehr-Anleitung; Datenbank-Schema unverändert.)
- [x] Konkrete Testversion mit Abnahmeprotokoll und verbleibenden Grenzen zur Veröffentlichung bereitstellen. Die aktuelle Konzeptfreigabe allein ist kein ausgeführter Release. (Abnahme 9.10.2026 (0.44.1): Testversion 0.44.1 mit Bericht.)
- [ ] Nach vorliegender Veröffentlichungsautorisation exakt diese Version ausliefern und zentrale Abläufe auf Live kontrollieren.
- [ ] Releasebelege/Änderungsprotokoll verlinken; Tracker auf tatsächlichen Stand setzen, offene spätere Pakete erhalten.

**Abnahme:** Test-/Live-Version und Änderungen sind eindeutig; Kernfunktionen nach Veröffentlichung erneut kurz geprüft. Rückkehr zur Vorversion ist konkret vorbereitet. Meilenstein M5 ist erst nach Live-Nachweis verifiziert; eine verifizierte Testversion darf vorher separat als fertig ausgewiesen werden.

## M6 – Spätere Ausbaustufe

### AP25 – Vorlagen aus Erfahrung nachvollziehbar verbessern

**Priorität/Aufwand:** P3 / mittel–gross. **Abhängigkeiten:** M5/AP20. **Eingang → Ergebnis:** mehrere echte oder eindeutig synthetische Rückblicke → begründete Änderungsvorschläge.

- [ ] Angekündigtes Verhalten „Ballast nach zwei Debriefs, Vorlagenlernen nach drei“ im Code prüfen und mit kontrollierten Testdaten verifizieren.
- [ ] Quelle, Häufigkeit und Tourkontext eines Änderungsvorschlags zeigen; ungenutzt nicht automatisch mit unnötig gleichsetzen.
- [ ] Übernehmen/Ablehnen dokumentieren; bestätigte individuelle Präferenzen bewahren.
- [ ] Nur einmal ungenutztes Notfallmaterial, wechselndes Wetter und widersprüchliche Learnings prüfen.

**Abnahme:** Änderungsvorschlag ist bis zu den zugrunde liegenden Rückblicken nachvollziehbar und wirkt erst nach Bestätigung. Historische Touren bleiben erhalten. Keine behauptete Lernqualität ohne beobachtete Prüffälle.

### AP26 – Geräteübergreifende Fortsetzung entscheiden und gegebenenfalls umsetzen

**Priorität/Aufwand:** P3 / gross. **Abhängigkeiten:** M5/AP22. **Eingang → Ergebnis:** heutiger Backuptransfer + realer Nutzungsbedarf → dokumentierte Synchronisationsentscheidung.

- [ ] Desktopplanung → Packen am Handy mit Backuptransfer messen; tatsächliche Reibung und Bedarf erfassen.
- [ ] Datenmodell, Offlineänderungen, Konflikte, Identität und Wiederherstellung vergleichen; eine begründete Empfehlung festhalten.
- [ ] Bei Entscheidung für Synchronisation einen eigenen technischen Teilplan mit Dateien, Schnittstellen, Migrations- und Konflikttests erstellen; Kernkonzept dabei bewahren.
- [ ] In späterer Umsetzung parallele Änderungen an Tour, Menge und Packhaken auf zwei Geräten sowie Ausfall/Wiederverbindung prüfen.

**Abnahme:** Entscheidung und Grenzen sind dokumentiert. Wenn umgesetzt: keine verlorenen offline gesetzten Packhaken, sichtbare Konfliktlösung und nachvollziehbarer Aktualitätsstatus auf beiden Geräten. Dieses Paket verspricht heute keinen fertigen Sync und blockiert den Kernrelease nicht.

## Verbindliche Prüffälle

Alle Prüffälle werden auf einer isolierten Testkopie ausgeführt. Negative Aktionen verwenden ausschliesslich synthetische Daten. Die angeführten Mengen sind Regeltests, keine Ernährungsempfehlungen.

| ID | Aufgabe / Testzustand | Erwartetes Ergebnis | Zuständige APs | Status |
|---|---|---|---|---|
| PF01 | MTB, 2 h, 1 Tag, keine Übernachtung, Scott Scale | Kein automatisch nötiges Nachtmaterial-Aufräumen; prüfbare Liste ≤60 s nach Messmethode | AP12/AP13/AP23 | Automatisch bestanden 9.10.2026 (Phone/Desktop, 4 Klicks, 0 Nachtteile); offen: 60-s-Messung mit Person |
| PF02 | Alpin, 6 h, 4–12 °C, Schauer, Scott Spark | Begründete Vorschläge; Ersatz/Alternative sichtbar; kein unbemerktes Kleidungsduplikat | AP13/AP15 | Bestanden 9.10.2026 (automatisch, Phone/Desktop) |
| PF03 | Bestätigte Regel 1 Stück/3 h; Dauer 2 → 6 h | Sichtbarer Vorschlag 1 → 2; manuelle Menge bis Bestätigung erhalten | AP14 | Bestanden 9.10.2026 (automatisch, Phone/Desktop) |
| PF04 | Gelregel vs. abweichende Notiz; verfügbare Menge/Maximum zu klein | Konflikt/Fehlbestand erklärt; kein stilles Überschreiben/Verbergen des Bedarfs | AP02/AP14 | Bestanden 9.10.2026 (automatisch, Phone/Desktop) |
| PF05 | Bikepacking, 3 Tage, Outdoor, Kochen | Explizite Schlaf-/Kochwahl; Taschenvorschlag, pro Tag/gesamt verständlich | AP12/AP13/AP17 | Bestanden 9.10.2026 (automatisch, Phone/Desktop) |
| PF06 | Gleiche Tour mit Unterkunft statt Outdoor | Kein automatisch übernommenes Zelt-/Schlafmatten-Set; eigene Wahl bleibt möglich | AP12/AP13 | Bestanden 9.10.2026 (automatisch, Phone/Desktop) |
| PF07 | Testmaterial Name/Kategorie/Status anlegen, Gewicht fehlt | Speichern ≤30 s nach Messmethode; Suche findet es; Gewicht als offen | AP08/AP23 | Bestanden 9.10.2026 (automatisch; Noahs Median 13 s, Ziel 30 s) |
| PF08 | Stern ändern; Home-Favoriten öffnen; Neuladen | Eine Aktion, persistente Auswahl, korrekter Filter und erklärte Zahlen | AP05 | Bestanden 9.10.2026 (automatisch, mit Neuladen) |
| PF09 | Kategorie eines mehrfach verknüpften Testmaterials ändern, Export/Import | IDs/Referenzen, Mengen und Haken erhalten | AP09/AP22 | Bestanden 9.10.2026 (automatisch, Export/Import) |
| PF10 | Gleicher Gegenstand über zwei Bausteine und Wetter vorgeschlagen | Kein stilles Duplikat/keine Mengenverdopplung; Herkunft und Zuordnung nachvollziehbar | AP10/AP11/AP13/AP15 | Bestanden 9.10.2026 (automatisch, 0 Doppel) |
| PF11 | Gel verschieben → Undo; eigenes Tour-Seatpack wählen | Passender Zustand wiederhergestellt; anderes Bike-/Tourstandardsetup unverändert | AP17/AP19 | Bestanden 9.10.2026 (automatisch, Setup-Isolation) |
| PF12 | Teilweise abhaken; Navigation/Neuladen; Vorlage speichern/kopieren | Fortschritt bleibt Ursprungstour zugeordnet; neue Tour hat offene Checks | AP18/AP19 | Bestanden 9.10.2026 (automatisch, 0 verlorene Haken) |
| PF13 | Kurzfahrt morgen vs. Event; Bikepflege fällig; Home/Pack/Care vergleichen | Keine Eventwarnlast für Kurzfahrt; tatsächliche Pflege konsistent sichtbar | AP06/AP16 | Bestanden 9.10.2026 (automatisch, 0 Widersprüche) |
| PF14 | Fehlende Gewichte/Volumen; leere Suche/kein Bike/fehlendes Wetter | Ehrliche Summen und nutzbare Leerzustände; keine erfundene Präzision | AP04/AP07/AP12/AP17 | Bestanden 9.10.2026 (automatisch) |
| PF15 | Kernabläufe bei 320/390 px, Tastatur, Screenreader-Stichprobe | Kein Seitenscrollen/Verlust wichtiger Aktionen; Fokus/Labels/Status nutzbar | AP21 | Teilweise 9.10.2026: 320/390/768/1366 px und Tastatur bestanden, Tippflächen und Fokusrückgabe behoben; Screenreader offen |
| PF16 | Fahrt-/Rückblicknotiz, GPX/Wetter, PDF/Foto/Share, Backup/Offline | Richtige Tourzuordnung; Belege oder ausdrücklich offene Grenzen; Datenrundlauf korrekt | AP20/AP22 | Teilweise 9.10.2026: GPX, Wetter, Foto, Druckansicht, Teilen-Link, Backup und Offline mit Service Worker bestanden; echter Druckdialog/PDF und Teilen-Menü am Handy offen |

PF16 besitzt mehrere Teilnachweise: jeder erhält eine eigene Zeile im Testprotokoll; PF16 gilt nur als bestanden, wenn alle für den vereinbarten Release relevanten Teilnachweise vorliegen. Keine erfolgreiche Teilprüfung verdeckt eine offene andere Funktion.

## Fortschrittsregister

Operative Meilenstein-Checkliste: [GitHub Issue #33](https://github.com/noahdolmetsch-af/packgenerator/issues/33). Dieses Register bleibt die genaue AP-Quelle.

Bei jeder Arbeitsrunde die betroffenen Zeilen aktualisieren; eine Zeile „verifiziert“ benötigt Datum und Beleg. Die Abhängigkeitsspalte verwendet AP-IDs; der Gesamtplan bleibt die verbindliche Quelle.

| ID | Arbeitspaket | Meilenstein | Abhängigkeiten | Status | Verifiziert am / Beleg |
|---|---|---|---|---|---|
| AP01 | Ausgangsstand und technische Zuordnung | M0 | – | Teilweise bearbeitet | 07.10.2026: Stack, isolierte Fixtures/CI bekannt; Rundlauf mit Noahs Export ohne Abweichung (privat); Ausgangsmessungen offen |
| AP02 | Begriffe und Regelkonflikte | M0 | AP01 | Teilweise bearbeitet | 07.10.2026: AP02-Entscheide (Tagesset, Grundset nur draussen); Begriffe seit 0.32 vereinheitlicht; vollständige Rangfolge offen |
| AP03 | Typografie, Farben, Komponenten | M1 | AP02 | Veröffentlicht / Restprüfung | 07.10.2026: PR #30/#32; QA vorhanden; Zoom/allgemeine Kontrast- und Screenprüfung offen |
| AP04 | Statusbegriffe und Gewichte | M1 | AP02 | Veröffentlicht / Restprüfung | 07.10.2026: PR #30; „Weitere Dinge“ in 0.22.1 (PR #31); vollständiges PF14 offen |
| AP05 | Favoritenaktion und Filter | M1 | AP02, AP03 | Veröffentlicht / Restprüfung | 07.10.2026: PR #30; favorites/readiness-Tests; gesamtes PF08 offen |
| AP06 | Bereitschaft/Pflege konsistent | M1 | AP02, AP04 | Veröffentlicht / Restprüfung | 07.10.2026: PR #30; Eventabgrenzung live in 0.22.1 (PR #31) |
| AP07 | Navigation und Heute | M2 | AP03, AP06 | Veröffentlicht / Restprüfung | 07.10.2026: 0.23.0 (PR #35), Zeitplan auf Heute 0.34.0 (PR #56); Personenprüfung offen |
| AP08 | Materialliste und kurzer Dialog | M2 | AP03, AP05, AP07 | Veröffentlicht / Restprüfung | 07.10.2026: 0.23.0 (PR #35); Noahs Messung neues Teil Median 13 s (Ziel 30 s); formales PF07-Protokoll offen |
| AP09 | Kategorie ohne Referenzverlust | M2 | AP01, AP02, AP08 | Veröffentlicht / Restprüfung | 07.10.2026: 0.23.0 (PR #35), Phone 0.23.1 (PR #36); Unit-/E2E-Tests |
| AP10 | Bausteine/Kits verwalten | M4 | AP02, AP09 | Veröffentlicht / Restprüfung | 08.10.2026: 0.26.0/0.26.1 (PR #40), Wörter 0.32.0 (PR #54), Daten 0.33.0 (PR #55) |
| AP11 | Material zuordnen | M4 | AP08, AP09, AP10 | Veröffentlicht / Restprüfung | 08.10.2026: 0.24.1 (PR #37), 0.26.1 (PR #40); Mehrfachauswahl für Taschen offen (tief) |
| AP12 | Kontextstart | M3 | AP02, AP07 | Veröffentlicht / Restprüfung | 07.10.2026: 0.25.0 (PR #38), Fenster „Neue Tour“ 0.30.0 (PR #49) |
| AP13 | Kontextgerechte Auswahl | M3 | AP02, AP08, AP09, AP12 | Veröffentlicht / Restprüfung | 07.10.2026: PR #32, 0.25.0 (PR #38); Herkunft pro Zeile 0.27.0 (PR #41) |
| AP14 | Mengenrevision | M3 | AP02, AP12, AP13 | Veröffentlicht / Restprüfung | 08.10.2026: PR #32, 0.25.0, 0.27.0 („Bedarf 6, du trägst 3“) |
| AP15 | Wetter und Alternativen | M3 | AP12, AP13, AP14 | Veröffentlicht / Restprüfung | 08.10.2026: PR #32, 0.25.0, Wetter mit Grund und Undo pro Zeile 0.29.0 |
| AP16 | Anlassgerechte Vorbereitung | M3 | AP06, AP12 | Veröffentlicht / Restprüfung | 07.10.2026: 0.22.1 (PR #31) Event-Häkchen; 0.25.0 keine Velopflege bei Kurzfahrt |
| AP17 | Taschen und Packorte | M4 | AP04, AP12, AP13 | Veröffentlicht / Restprüfung | 08.10.2026: Platzvorschläge 0.26.1 (PR #40), Standardtaschen 0.31.0 (PR #53) |
| AP18 | Vorlagen wiederverwenden | M4 | AP13, AP17 | Veröffentlicht / Restprüfung | 08.10.2026: 0.24.1, 0.26.1; 09.10.2026: Neugestaltung als AP28 in 0.39.0 |
| AP19 | Packtag und Bereitschaft | M4 | AP04, AP06, AP17, AP18 | Veröffentlicht / Restprüfung | 08.10.2026: 0.24.0, 0.29.0 bis 0.30.1 (zuverlässiges Packen) |
| AP20 | Unterwegs und Rückblick | M4 | AP07, AP19 | Veröffentlicht / Restprüfung | 08.10.2026: 0.26.1 (Notizen zur Tour), 0.29.0 (Jetzt-Block, Rückblick eine Seite), 0.34.0 (Abendblock) |
| AP21 | Mobile/Tastatur-Prüfung | M5 | AP03; Abschluss AP07–AP20 | Teilweise geprüft | 09.10.2026: Abnahme 0.44.1 (11 Ansichten × 4 Breiten, Tastatur-Rundgang, Tippflächen und Fokusrückgabe behoben); Screenreader und echtes Handy offen |
| AP22 | Integrationen und Datenübergang | M5 | AP01, AP18, AP20 | Geprüft (Testversion) | 09.10.2026: Abnahme 0.44.1 GPX, Wetter-Ausfall, Foto, Druck, Teilen, Offline mit Service Worker, Backup-Rundlauf; echter Druckdialog und Teilen-Menü offen |
| AP23 | Alltagsszenarien messen | M5 | AP13–AP22 | Teilweise geprüft | 09.10.2026: Abnahme 0.44.1 PF01–PF16: 13 bestanden, 3 teilweise; fünf Szenarien automatisch bestanden; Zeitmessung mit Person offen |
| AP24 | Release und Live-Nachweis | M5 | AP21, AP22, AP23 | Testversion bereit | 09.10.2026: Abnahme-Bericht 0.44.1 mit Rückkehr-Anleitung; Veröffentlichung und Live-Prüfung offen |
| AP25 | Erklärbares Vorlagenlernen | M6 | M5, AP20 | Veröffentlicht / Restprüfung | 08.10.2026: 0.28.0 (PR #42); Ballast-Regel angepasst 0.33.0 |
| AP26 | Geräteübergreifende Fortsetzung | M6 | M5, AP22 | Teilweise veröffentlicht | 08.10.2026: 0.34.0 Backup ans andere Gerät senden, Hinweis neuer/älter; Sync-Entscheid offen |
| AP29 | Entwürfe und „In Bearbeitung“ | Pflicht-Wunsch | AP07, AP19 | Veröffentlicht | 08.10.2026: 0.35.0 (PR #57) |

## Prüfergebnis-Vorlage für jede Arbeitsrunde

| Feld | Eintrag |
|---|---|
| Datum / AP / Verantwortlich | … |
| Vorher → Nachher | … |
| Testversion / Commit / betroffene Dateien | … |
| Abnahmekriterien bestanden / offen | … |
| Relevante Prüffälle und tatsächliche Resultate | … |
| Zeitmessung / Schritte / notwendige Nachkorrekturen | … |
| Screenshot / Testbericht / Datenvergleich | … |
| Nebenwirkungen / Regression | … |
| Status / Blocker / nächster Schritt | … |

## Abdeckung des gesamten abgenommenen Konzepts

| Empfehlung aus der Analyse | Umsetzung / Prüfung |
|---|---|
| Tourvorbereitungs-Assistent als Produktkern; bewusste Grenzen | Global Constraints, AP02/AP07/AP12/AP13 |
| Material, Setups, Bausteine, Vorlagen und Packlisten verständlich verbinden | AP02/AP09/AP10/AP11/AP18 |
| Tourkontext vor Standardset; Übernachtungsmethode/Kochen | AP12/AP13, PF01/PF05/PF06 |
| Stundenabhängige Mengen, Regelkonflikte, Wasser vs. Kapazität | AP14, PF03/PF04/PF05 |
| Wetter/Alternativen und persönliche Learnings | AP15/AP20/AP25, PF02/PF10 |
| Kurzfahrtchecks statt mehrwöchiger Warnlast | AP06/AP16, PF13 |
| Gewichte/Datenqualität und klare Statusbegriffe | AP04/AP06/AP19, PF12/PF13/PF14 |
| Suche zuerst; kurze Erfassung; Kategorie korrigieren | AP08/AP09, PF07/PF09 |
| Favoritenstern, gefilterter Einstieg, erklärte Zählbasis | AP05, PF08 |
| Taschen-/Packortvorschläge und tourbezogene Änderungen | AP17/AP19, PF05/PF11 |
| Navigation und zwei zentrale Gestaltungsansichten | AP03/AP07/AP08/AP12/AP13 |
| Typografie, Farben, Hierarchie und Konsistenz | AP03; Anwendung in allen UI-APs, AP21 |
| Mobile Einspaltenansicht, Touch, Tastatur, Grundbarrierefreiheit | AP21, PF15 |
| Erhalten: Packtag, Undo, Wiegen, Wunschliste, Fotos, Vorlagen, Learnings | Global Constraints, AP08/AP17/AP18/AP19/AP20/AP22 |
| GPX, Wetter, PDF, Teilen, Fotos und Offline bislang offen | AP22, PF16 |
| Backup-/Importstatus und Konflikte verständlich machen | AP01/AP22; spätere Synchronisation AP26 |
| Vorlagenlernen nach echten Rückblicken | AP25 |
| Fünf wichtigste Massnahmen mit Erfolgskriterien | AP12/AP13, AP14, AP04/AP06/AP19, AP16, AP08/AP09; AP23 |
| Fortschritt nachvollziehbar messen | Arbeitsweise, Prüffälle, Fortschrittsregister, AP23/AP24 |

## Nächster konkreter Schritt

**Stand 09.10.2026:** die Reihenfolge in [Als Nächstes (Stand 9.10.2026, nach 0.45)](#als-nächstes-stand-9102026-nach-045).

Früher (08.10.2026): v0.36.0 „Import prüfen“ fertigstellen, danach die Reihenfolge in [Stand und nächste Pakete (8.10.2026)](#stand-und-nächste-pakete-8102026). Jeder Release-PR ergänzt [Status](status.md), dieses Register (wenn ein Paket seinen Stand ändert), das [Entscheidungslog](decisions.md) und `src/lib/whatsnew.js`.

Früherer Text (7.10.2026): Ausgelieferte Screens mit den Alltagstouren abnehmen, AP01/AP02-Nachweise schliessen und den integrierten PR #31 fachlich abnehmen. Anschliessend AP07–AP09 und AP12–AP16 entlang der Abhängigkeiten abschliessen.


## Pflicht-Wünsche von Noah (08.10.2026): AP27–AP30

Noah hat diese vier Wünsche am 08.10.2026 als **zwingend umzusetzen** festgelegt. Wie und wann sie eingebaut werden, wird noch mit ihm besprochen. Bis dahin gelten sie als offene Pflicht-APs. (Nachtrag 08.10.2026: Reihenfolge festgelegt, siehe „Stand und nächste Pakete“.)

| AP | Wunsch | Was es heute schon gibt (Stand v0.30.2) | Was fehlt |
|---|---|---|---|
| AP27 | **GPX einer abgeschlossenen Aktivität hochladen und als Learning nutzen** | Rückblick → «Dein Tempo» lernt Geschwindigkeit und Höhenmeter pro Stunde aus GPX-Fahrten (`src/lib/pace.js`, `debrief/Pace.svelte`). Der Rückblick liest GPX/TCX/CSV für km und Fahrten (`src/lib/activities.js`). | Erledigt in 0.41.0: Fahrt hochladen (auch ohne Tour, auch über Android-Teilen), Pausen, geplant gegen echt, 1–3 Learnings mit einem Tippen (`src/lib/gpx.js`, `src/pages/Rides.svelte`). Wetter und Verpflegung bleiben im Rückblick. |
| AP28 (erledigt in 0.39.0) | **Seite Vorlagen grundlegend überarbeiten**, in Design und Nutzen; neue Vorlagen direkt erstellen | Vorlagen entstehen nur aus einer Tour («Als Vorlage speichern») und werden in `TemplateEdit.svelte` bearbeitet. | Neue Vorlage von Grund auf (aus Bausteinen + Extra-Teilen), klare Anzeige «Standard + Regen + 2 Extra», Nutzen sichtbar (wann zuletzt benutzt, welche Touren). Baut auf 0.32–0.33 auf (Begriffe Bausteine/Vorlagen). |
| AP29 (erledigt in 0.35.0) | **Entwürfe beim Packen**: überall sichtbar «Entwurf gespeichert», jederzeit unterbrechen und später fortsetzen; mehrere Events/Fahrten gleichzeitig planen; unter **Touren** eine Liste aller Entwürfe bzw. Packvorgänge in Bearbeitung | Alles wird sofort gespeichert; mehrere Touren können parallel existieren. | Sichtbarer Hinweis «gespeichert, du kannst jederzeit aufhören» auf jeder Tour-Seite; Liste «In Bearbeitung» unter Touren mit Stand (z. B. «Packen 12/30») und «Fortsetzen». |
| AP30 | **Material per Foto mit KI erfassen**: Foto → Gegenstand erkennen → Daten im Hintergrund recherchieren → Vorschlag ins Inventar | – | Braucht einen KI-Dienst mit Bildverständnis und einen kleinen Server für den geheimen Schlüssel (die App ist heute rein statisch). Vorschlag immer zur Bestätigung, nie still eintragen. Datenschutz: das Foto verlässt das Gerät. Aufwand: mittel bis gross (eigenes Release plus Einrichtung des Dienstes durch Noah). |

**Stand 08.10.2026:** AP29 ist mit v0.35.0 (PR #57) erledigt (Design-Variante B). Die Reihenfolge der übrigen Pflicht-Wünsche steht im nächsten Abschnitt.

## Stand und nächste Pakete (8.10.2026)

Live ist **v0.35.0**. „Ausgeliefert“ heisst: als Software veröffentlicht, mit Unit- und Browser-Tests. Die formale Abnahme mit Zeitmessung durch eine Person ist bei den meisten Paketen noch offen (siehe Fortschrittsregister).

### Was pro Meilenstein ausgeliefert ist

| Meilenstein | Ausgeliefert mit | Noch offen |
|---|---|---|
| M0 Grundlage (AP01–AP02) | Entscheide vom 7.10.; Begriffe vereinheitlicht in 0.32.0 | Ausgangsmessungen, vollständige Regel-Rangfolge |
| M1 Sofortige Klarheit (AP03–AP06) | 0.22.0 (PR #30), Entwürfe 2/3 (PR #32), 0.22.1 (PR #31, Event-Häkchen, „Weitere Dinge“) | Restprüfung Kontrast/Zoom, PF08/PF14 als Protokoll |
| M2 Einfache Materialpflege (AP07–AP09) | 0.23.0 (PR #35), 0.23.1/0.24.0 (PR #36) | 30-s-Messung als formales Protokoll |
| M3 Tour bestimmt Auswahl (AP12–AP16) | 0.24.1 (PR #37), 0.25.0 (PR #38), 0.25.1 (PR #39), 0.30.0 (PR #49) | 60-s-Messung als formales Protokoll |
| M4 Vollständiger Tourablauf (AP10–AP11, AP17–AP20) | 0.26.1 (PR #40), 0.29.0 bis 0.30.2 (PR #43–#51), 0.31.0 (PR #53), 0.32.0/0.33.0 (PR #54, #55), 0.34.0 (PR #56) | Mehrfachauswahl für Bausteine und Taschen |
| M5 Abnahme (AP21–AP24) | 0.27.0 (PR #41): Phone/Tastatur, Integrationen, automatischer Test PF01–PF16 | Screenreader, fünf Szenarien mit Person gemessen, formale Release-Abnahme |
| M6 Später (AP25–AP26) | AP25 0.28.0 (PR #42); AP26 teilweise 0.34.0 (Backup ans andere Gerät) | Entscheid über echte Synchronisation |
| Pflicht-Wünsche (AP27–AP30) | AP29 0.35.0 (PR #57); AP27 0.41.0 | AP28, AP30 |

### In Arbeit: v0.36.0 „Import prüfen“

Excel-Import Schritt 1: Noahs bereinigte Material-Excel (privat, nicht im Repo) mit Material und Learnings. Eine Prüfseite zeigt „Schon da“, „Neu“ und „Unsicher“; „Alle sicheren übernehmen“, Unsicheres einzeln. Vorher automatisches Backup, danach „Rückgängig“. Jedes Teil behält seine Excel-Nummer (`sourceId`), damit es keine Doppelten gibt. Vorhandene Teile werden nur ergänzt, nie überschrieben; App-Teile, die nicht in der Excel stehen, können archiviert werden. Learnings behalten ihr ursprüngliches Datum.

### Reihenfolge nach 0.36

0.36 Import prüfen (veröffentlicht), 0.37 Rucksäcke (erledigt), 0.37.1 Zusammenlegen (erledigt), 0.38 Heute und Menü (erledigt), 0.39 AP28 Vorlagen (erledigt), 0.40 Ruhige Nebenseiten (erledigt in 0.40.0; Design-Prüfung 9.10.: Inbox, Rückblick, Vergangene Touren, Bausteine, Was die App kann, Planen am Computer, Unterwegs), 0.41 AP27 GPX → Learning (erledigt in 0.41.0), 0.42 Excel-Import Schritt 2 (alte Touren nur als Notiz, Temperatur-Kits als Vorschlag, Aufgaben nur vor Events und Bikepacking über 4 Nächte) mit Kleiderschrank (nach Schicht, dann Zone) und Zwiebel-Check (erledigt in 0.42.0; die echte Datei erzeugt Noah selbst), 0.43 Wiege-Modus und Mehrfachauswahl (Kategorie, Tasche, Baustein, Bereich, Archivieren; erledigt in 0.43.0), 0.44 Rückblick 12 Monate (rollend statt Jahresrückblick im Dezember; erledigt in 0.44.0), danach Abnahme-Bericht AP21–24 (erstellt 9.10.2026 mit 0.44.1). 0.45.2 Problem am Velo aus dem Plus-Menü und Basischeck (erledigt in 0.45.2). 0.45 Kleiderschrank 2 (Reihenfolge warm → kalt, Lücken → Wunschliste, Outfit als Kit, Foto, Verschiebung sichtbar, „Was ziehe ich heute an?“ auf Heute, Alltag nur unter Alltag; erledigt in 0.45.0) mit den Abnahme-Nachträgen (44-px-Knöpfe auf Touch, Tippflächen der Velo-Zeichnung, Fokus nach „Tour erstellen“, Kategorie-Köpfe bei 320 px). 0.46 Startseite neu (Gruss mit Wetter und Vorschlag, kompakte Tourkarte, „Was willst du tun?“ mit 16 Funktionen, „Heute wichtig“ und „Schon probiert?“, Testtouren aufräumen, Suche als Befehlszeile, Farbwelten Gletscher/Sandstein/Klassisch hell und dunkel; erledigt in 0.46.0). AP30 Foto-KI ist gestrichen (nur noch Idee), AP26: Geräte bleiben beim Backup von Hand. Die Versionsnummern sind geplant, nicht fix.

| Nr. | Paket | Inhalt | Hinweis |
|---|---|---|---|
| 1 (0.37, erledigt) | **Rucksäcke** (erledigt in 0.37.0) | Echte getragene Taschen mit Litern und Gewicht. Am Velo gibt es zwei getragene Plätze „Rücken“ und „Hüfte“; ihr Gewicht zählt zu „Am Körper“, nicht zum Velo. Touren ohne Velo nutzen die echten Rucksäcke statt allgemeiner Namen, die App schlägt pro Reiseart passende vor. Warnung, wenn der Inhalt mehr Liter braucht, als die Tasche fasst. Eine Warnweste kann Kleidung und Tasche zugleich sein | Noah, 8.10.2026 |
| 2 (0.38, erledigt) | **Heute und Menü** (erledigt in 0.38.0) | Schnelle Knöpfe mit Rückgängig (Kette geölt, Verschleiss, geputzt, Dichtmilch, Reifendruck, km, Tagestour, Quick note), Sprünge (fällig, Totes Gewicht, Vor einem Jahr, Wochenend-Wetter, Neu in der App), Saison in Zahlen, Bereit-Ampel pro Velo; Menü Heute/Touren/Material/Velos mit + und „Mehr“, Suche findet Seiten; Wischen im Material, Taschen-Hinweis nur bei Bedarf, Velopflege als dichte Liste; ganze Update-Geschichte | Noah, 8.10.2026; Entwurf mit Bildern zuerst |
| 3 (0.39, erledigt) | **AP28 Vorlagen-Seite neu** (erledigt in 0.39.0) | Neues Design; neue Vorlage von Grund auf aus Bausteinen und einzelnen Teilen; sichtbar, wann und für welche Touren eine Vorlage benutzt wurde | Baut auf 0.32/0.33 auf |
| 3a (0.40, erledigt) | **Ruhige Nebenseiten** (erledigt in 0.40.0) | Design-Prüfung 9.10.2026: Nebenseiten als Zeilen, eine Liste vergangener Touren, Segmente, neutrale Badges, Erklärungen hinter „?“, Trip-Seiten am Computer volle Breite; Kettenverschleiss an der Grenze → Wunschliste | Noah, Antworten 1a–10a |
| 4 (0.41, erledigt) | **AP27 GPX-Aktivität → Learning** (erledigt in 0.41.0) | GPX (oder TCX) einer gefahrenen Fahrt hochladen, auch ohne geplante Tour, auch über Android-Teilen; Pausen ab 5 Minuten, geplant gegen echt (Distanz, Höhenmeter, Fahrzeit, Tempo), 1–3 Learnings mit einem Tippen, die Fahrt lernt „Dein Tempo“. Wetter und Verpflegung bleiben im Rückblick | `gpx.js`, nutzt `pace.js` und `route.js` |
| 5 (0.42) | **Excel-Import Schritt 2: Verlauf lernen** | Alte Touren und Setups als Geschichte mit „nicht gebraucht“ und „fehlte“, damit Ballast und Vorschläge sofort wirken; Temperatur-Kits als Vorschläge, der Rückblick fragt „zu kalt / ok / zu warm“; Favoriten-Kits und Bausteine aus der Excel-Liste (mit denselben Duplikat-Regeln wie in 0.36); Aufgaben; Werkstatt | Nach Schritt 1 (0.36) |
| 6 | **AP30 Foto → KI erkennt Teil** | Foto, KI erkennt das Teil, sucht Daten, schlägt einen Eintrag zur Bestätigung vor | Braucht einen kleinen Server für den geheimen API-Schlüssel, kostet pro Foto, das Foto verlässt das Gerät. Günstiger erster Schritt: Barcode |
| 7 (0.43, erledigt) | **Wiege-Modus und Mehrfachauswahl** (erledigt in 0.43.0) | Wiege-Modus: ein Teil pro Bildschirm, Velos und Taschen zuerst, dann Taschen, Schlafen, Aussen-, Mittelschicht, Rest (am meisten gebraucht zuerst), Rückgängig. Mehrfachauswahl: in Material zusätzlich Reiseart und Archivieren, Leiste mit ••• ; im Kleiderschrank Schicht und Zone; in einem Baustein viele entfernen. Offen: Auswahl in Vorlagen und Tourlisten, Tasche innerhalb einer Tour | Noah, 9.10.2026 |
| 7a (0.44, erledigt) | **Rückblick 12 Monate** (erledigt in 0.44.0) | Immer die letzten 12 Monate (rollend, nach Startdatum der Tour): Fahren, Packen, Gelernt, Velos mit Unterschied zu den 12 Monaten davor; Karte auf Heute statt „Saison in Zahlen“, eigene Seite `#/review` | Ersetzt den Jahresrückblick im Dezember (Noah 9.10.2026) |
| 8 | **Offene Abnahmen** | AP21–AP24: Phone- und Barrierefreiheits-Prüfung mit Screenreader, fünf Alltagsszenarien mit Person gemessen, formale Release-Abnahme. AP26: Entscheid über Geräte-Synchronisation (Handy und Desktop), nach dem Import mit Noah besprechen. Offen bei Noah: Testprotokoll A–Z (u. a. D10.7 Ordner-Sicherung am Desktop), Taschen und Velos wägen | Laufend, wenn Noah testet |

## Als Nächstes (Stand 9.10.2026, nach 0.45)

Diese Reihenfolge gilt ab jetzt und ersetzt die offenen Punkte der Tabelle oben (Noah, 9.10.2026).

| Nr. | Paket | Inhalt | Hinweis |
|---|---|---|---|
| 1 | **0.45.1 Gesamttest Runde 1: Fehler behoben** (dieser PR) | Doppelte Zeilen im Material-Import, feste Velo-Teile in vergangenen Touren, Wörter mitten im Wort umbrochen, Material am Computer schneller; dazu die drei Ideen: Velopflege bei kurzen Tagestouren als eine ruhige Zeile, Zusammenlegen auch am Handy, kein Tipp-Speicher im Backup | Befunde G001–G015 aus dem Gesamttest |
| 2 | **0.46 Neue Startseite** | Mischung aus Cockpit und Tagesblatt; Farbpalette «Gletscher» als Standard, «Sandstein» und «Klassisch» wählbar; dunkler Modus automatisch und im Menü; Suche als Befehlszeile | In Arbeit in einem parallelen Branch; behebt auch G003, G010, G011 |
| 2a | **0.46.1 Noahs Handytest von 0.45.2** (erledigt) | Ein Problem pro Eintrag (Komma, «und»), neueste Probleme zuoberst, Priorität in der Zeile ändern, keine Regensachen und Nachtbrille auf trockener Tagestour, Suche am Handy als Blatt, «Packlisten» im Menü «Mehr», «Touren» öffnet eine Übersicht aller Touren (`#/trips`) | Navigation als Ganzes und die volle Touren-Einstiegsseite bleiben für D3 |
| 2b | **0.46.2 «Startseite anpassen» lesbar** (erledigt) | Namen der Abschnitte nicht mehr senkrecht (Klassenname `sw` doppelt belegt) | Auswahl aus allen Funktionen als Kacheln kommt mit «Heute neu» |
| 2c | **0.46.3 «Mehr» wieder ruhig** (erledigt) | Touren-Einträge aus «Mehr» entfernt, Gruppen wie in 0.46.0 | Ganzes Menü neu: Mockup mit Fragen, Bau mit Übergänge Teil 1 |
| 2d | **0.47.0 Aufpimpen (Design-Release D1)** (erledigt) | Kleiderschrank nach Mockup, Velo mit Taschen und Gewichtskarte auf der Tour, Material-Reiter und Karten, Velopflege-Schrift vereinheitlicht, «Jetzt fällig» als Karten, Inbox und Prüfen leeren sich selbst | Antworten 12–20 und «Offen: Angleichen» (design-audit.md) folgen in 0.48 / D2–D5 |
| 2e | **0.47.1 Tagestour antippen** (erledigt) | Dauer, Datum, Wetter und Velo in der Tourkarte antippbar, keine «1 Tag · keine Übernachtung»-Doppelung, Wetter-Schnellwahl, Vorhersage ohne Rundung auf Vorgaben mit Quelle; «Mehr» mit Punkt, Inbox neueste zuerst und verlinkt, Velopflege: Probleme als eine flache Liste und neueste Arbeit zuerst; Wächter-Prüfungen | Menü als Ganzes weiter mit Übergänge Teil 1 |
| 2f | **0.47.2 Material-Ansichten** (erledigt) | Sieben Ansichten mit Zahl, «Nie gebraucht» statt «Totes Gewicht», Karten · Liste mit Punkten pro Tour, Detailspalte am Computer, Sortieren und Filtern in einem Blatt, Teil mit «Sein Jahr auf Tour» | Antworten 6a–9a; Tabelle (D4) und Sparpotenzial folgen |
| 2g | **0.47.3 Wetter-Chips und •••-Menüs** (erledigt) | «Kühl + Regen» bringt Kälte- und Regensachen (Chips setzen statt umschalten), •••-Menüs bleiben bei 320 und 390 px im Bild | |
| 2g | **0.57.0 Pflege-Übersicht + Teile pro Velo + Eingang/Notizen** (erledigt) | Pflege-Übersicht C, Teiletabelle, geführtes Ersetzen/Warten, Startwerte; eine Teilevorlage mit Datenblatt und Geometrie, Import bikeSpecs, Velos vergleichen; Eingang mit «Ablegen als …» (7 Ziele, Rechnungsbeleg → Werkstattbesuch); Werkstatt & Belege; Notizen | Offen: Texterkennung aus Belegfoto, Bedienungsanleitungen unter Werkstatt, gemeinsamer Chip-Baustein |
| 2h | **0.59.0 Tauschen (OP2a)** (erledigt) | Kleider am Körper als erste Karte «Am Körper», ein Tipp öffnet «Tauschen» mit Teilen derselben Zone und Schicht nach Wetter und letzter Wahl, ein Tipp tauscht mit «Rückgängig», Wahl wird gemerkt; Kleiderschrank mit Tourband und ausgeblendeten unpassenden Doppelten | «Outfit speichern» und Outfits lernen mit D5; Schicht dazu/weg (OP2b) |
| 2h | **0.63.0 Material-Detail ruhig** (erledigt) | Teil-Fenster und Detailspalte: oben nur Name, Gewicht mit Status und eine Zeile «Kommt mit: …», alles andere als Klappzeilen mit Kurzinhalt (eine offen, Bausteine zu); leichtere Alternativen automatisch vorgeschlagen («Vorschlag», «Passt nicht» mit Rückgängig); leeres «Nie gebraucht» erklärt die Regel und zeigt «Auf dem Weg dahin» | |
| 2h | **0.65.0 Velo-Masse** (erledigt) | Block «Masse» pro Velo immer offen oben (Sitzhöhe, Solldruck v/h, Lenkerbreite zuerst, 16 Werte), zuerst in «Velos vergleichen», Solldruck beim Reifendruck-Prüfen und im Basischeck, Import `fit` | |
| 2h | **0.66.0 Bausteine neu + Bausteine prüfen** (erledigt) | Biwak, Zelt, Hotel/Hütte; Reparatur, Laden, Licht (Dunkelheit), Rennen (Event); Verpflegung, Hygiene, Komfort; Warm als Temperaturregel; Seite «Bausteine prüfen» | Alte Schlüssel ab 0.57 entfernen |
| 2h | **0.67.0 KI-Helfer** (erledigt) | Optionaler Helfer mit Claude an fünf Orten: Neue Tour («Frag den Helfer»), Suche (nur Fragen), Rückblick («Entwurf holen»), Liste prüfen, Velopflege (in «Jetzt fällig»); Monatslimit CHF 5 in App und Server; ohne Einrichtung wie bisher | Einrichtung durch Noah (docs/ki-helfer-einrichten.md); Helfer-Karten in den Baukasten |
| 3 | **Gesamttest Runde 2** | Derselbe grosse erfundene Datensatz und dieselben Abläufe nach 0.46 | |
| 4 | **0.47 Einkaufen, Lebenslauf, Werkstatt** | Eine Einkaufsliste für alles (eigene Läden, Monatsbudget); Lebenslauf pro Teil (Preis und Laden freiwillig, Kosten pro Einsatz, Archiv); Werkstatt-Anleitungen (allgemeine Drehmomente, Notfallkarten offline) | |
| 5 | **0.48 Design und Bedienung aus der Strategierunde 2** | Umsetzung der Antworten | Wartet auf Noahs Antworten 62–119 |
| 6 | **Später** | TalkBack-Test (tiefe Priorität), Zeitmessung | |

### Im Flow (Gewohnheiten und Sport)

Ganz geplant, gebaut erst nach allem oben.

**0.51.0 «Im Flow – kleiner Start» (9.10.2026):** aus Schritt 2 die rollenden Ziele, Saisons pro Sportart und die Stoppuhr mit Klangschale; aus Schritt 4 der tägliche Check und der Erholungs-Ring. Offen aus 2: Material pro Sportart; aus 4: Rituale, Fitbit.

1. Bildentwürfe.
2. Grundlage: Sportarten, rollende Ziele «X in N Tagen», Saisons pro Sportart, Stoppuhr, Meditation mit Klangschale, Material pro Sportart.
3. Bausteine pro Sportart und Tennisstunden (Protokoll, Schülerinnen und Schüler, 20 Start-Bausteine, Abrechnung).
4. Rituale, täglicher Check, Erholung, Fitbit zuerst von Hand.
5. Lieblingstermine, Wochenplaner, Wetterfenster, `.ics`, Sporttaschen-Check.
6. Belohnungen aus der Wunschliste, Wetter-Abzeichen (auch am Material), Rekordwand, Balance-Ring, Saisonkarte auf dem Knopf.
7. Neuland: Vorschläge, Wunschliste, Gipfelbuch, Schweizer Karte, Bingo, Tour-Postkarte auf einer OSM-Karte.
8. Server auf Vercel: Strava, dann Fitbit, dann Push; TrainingPeaks-iCal und intervals.icu prüfen.
9. Personen, Ausleihen und Jahrbuch als PDF.

## Änderungshistorie dieses Plans

| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 07.10.2026 | Abgenommenes Konzept in AP01–AP26, PF01–PF16 und Meilensteine übersetzt; noch keine Umsetzung |
| 1.1 | 07.10.2026 | Mit PR #30/#32 und Live abgeglichen; vorgezogene Screens, offenen PR #31 und parallele Branchintegration, Teilnachweise und Quellen verbindlich verknüpft |
| 1.2 | 08.10.2026 | Stand v0.35.0 nachgetragen: Fortschrittsregister pro Release, AP29 erledigt, Abschnitt „Stand und nächste Pakete“ mit Reihenfolge nach 0.36 (neu 0.37 Rucksäcke) |
| 1.3 | 09.10.2026 | 0.37.1 Zusammenlegen eingeschoben (Folge aus dem Excel-Import Schritt 1) |
| 1.4 | 09.10.2026 | 0.38 „Heute und Menü“ erledigt; neue Reihenfolge 0.40 Ruhige Nebenseiten, 0.41 GPX, 0.42 Excel Schritt 2 + Kleiderschrank, 0.43 Wiege-Modus + Mehrfachauswahl; Foto-KI gestrichen |
| 1.5 | 09.10.2026 | 0.39.0 AP28 Vorlagen neu gebaut (Vorlagen verbunden mit Bausteinen) |
| 1.6 | 09.10.2026 | 0.40.0 Ruhige Nebenseiten erledigt; in Arbeit 0.41 AP27 GPX → Learning |
| 1.7 | 09.10.2026 | 0.41.0 AP27 GPX → Learning erledigt |
| 1.8 | 09.10.2026 | 0.42 „Excel Schritt 2 und Kleiderschrank“ erledigt: Kleiderschrank, Zwiebel-Check, Temperatur-Kits als Bausteine, Kleidung im Rückblick, Import Schritt 2 (Kits, Bausteine, Aufgaben, alte Touren) |
| 1.9 | 09.10.2026 | 0.43 „Wiege-Modus und Mehrfachauswahl“ erledigt |
| 2.0 | 09.10.2026 | 0.44 „Rückblick 12 Monate“ erledigt (rollend statt Jahresrückblick im Dezember) |
| 2.1 | 09.10.2026 | 0.45.1 Gesamttest Runde 1; neue Reihenfolge 0.46 Startseite, Gesamttest Runde 2, 0.47, 0.48, später; Abschnitt «Im Flow» (Schritte 1–9) |
| 2.2 | 09.10.2026 | 0.47.0 «Aufpimpen» (Design-Release D1) erledigt |
| 2.3 | 09.10.2026 | 0.51.0 «Im Flow – kleiner Start» erledigt (Ziele, Saisons, Stoppuhr, Tagescheck) |
| 2.3 | 09.10.2026 | 0.47.1 «Tagestour antippen» erledigt (Noahs Test einer Tagestour, Inbox, Velopflege) |
| 2.4 | 09.10.2026 | 0.47.2 «Material-Ansichten» erledigt |
| 2.5 | 09.10.2026 | 0.47.3 Wetter-Chips im Fenster «Neue Tour» und •••-Menüs im Bild erledigt |
| 2.6 | 09.10.2026 | 0.56.0 R1 «Rückblick ruhig» erledigt (eine Rückblick-Seite, Vergangene Touren als Tabelle, Tour-Rückblick nach drei «A»); als Nächstes R2 Tempo und Logbuch |
| 2.5 | 09.10.2026 | 0.57.0 «Pflege-Übersicht + Teile pro Velo + Eingang/Notizen» erledigt |
| 2.6 | 09.10.2026 | 0.49.0 R1 «Rückblick ruhig» erledigt (eine Rückblick-Seite, Vergangene Touren als Tabelle, Tour-Rückblick nach drei «A»); als Nächstes R2 Tempo und Logbuch |
| 2.7 | 09.10.2026 | 0.61.0 R2 «Tempo + Logbuch» erledigt (Regel in einem Satz, eigene Regel ab 5 Fahrten mit Rückweg, Logbuch als Tagebuch aller Touren, Gelernt flach); Strava und Fotos bleiben geparkt |
| 2.6 | 09.10.2026 | 0.63.0 «Material-Detail ruhig» erledigt (Klappzeilen, Alternativen-Vorschläge, «Auf dem Weg dahin») |
| 2.7 | 09.10.2026 | 0.65.0 «Velo-Masse» erledigt |
| 2.6 | 09.10.2026 | 0.66.0 «Bausteine neu + Bausteine prüfen» erledigt |
| 2.8 | 10.10.2026 | 0.67.0 «KI-Helfer» erledigt (Noahs Antworten 1a–8a) |

Die frühere gespeicherte Datei `2026-10-07-packgenerator-ablaufplan.md` wird als datierte Fassung dieses Gesamtplans weitergeführt. GitHub `docs/roadmap.md` ist die aktuelle Quelle. Historische Analysen und frühere Designs bleiben datierte Belege, keine parallelen Roadmaps.
