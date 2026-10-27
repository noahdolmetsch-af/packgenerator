# Pack Generator – Ablauf- und Umsetzungsplan

> **Stand 18.10.2026:** Diese Roadmap ist der ursprüngliche Plan vom 7.10.2026 (AP01–AP30) mit Prüffällen und Fortschrittsregister. Die heutige Reihenfolge (sechs Pakete P3 → A → B → D → E → C → F) und was gebaut ist, stehen im [Projektstand](projektstand.md). Wie es von hier dorthin kam: [Geschichte](geschichte.md).

> Umsetzung in einzeln prüfbaren Arbeitspaketen. Checkboxen bezeichnen vollständig erledigte Schritte; Teilumsetzungen werden im Fortschrittsregister beschrieben. Keine Delegation allein aufgrund dieses Dokuments.

**Goal:** Aus der vorhandenen Anwendung einen verständlichen Tourvorbereitungs-Assistenten entwickeln: Tourkontext → nachvollziehbare Vorschläge → Packliste → Packkontrolle → Unterwegs → Rückblick.

**Architecture:** Material, Fahrradsetup, Bausteine und Vorlagen bilden die wiederverwendbare Grundlage; die konkrete Tour besitzt eigene Mengen, Packorte und Kontrollzustände. Empfehlungen zeigen ihren Grund und werden ausdrücklich übernommen. Bestehende Daten und bewährte Funktionen werden erhalten; Umsetzung in prüfbaren Teiländerungen.

**Tech Stack:** Svelte 5, Vite 8, JavaScript, Dexie/IndexedDB (Schema 4), Vitest mit fake-indexeddb, Playwright/Chromium, GitHub Actions/Pages, vite-plugin-pwa. Reale Verantwortlichkeiten und Pfade: [Architektur](architecture.md); Testbefehle und Grenzen: [Prüfregister](verification.md).

**Spec:** Von Noah abgenommenes Konzept aus der Produkt-/UX-Analyse `packgenerator-analyse.html` vom 07.10.2026 (historischer Ausgangsstand v0.20.2, privat gespeichert). Verbindliche aktuelle Produktentscheidungen: [Entscheidungslog](decisions.md). Zielanwendung: https://noahdolmetsch-af.github.io/packgenerator/#/.

**Stand:** Version 1.1 · 07.10.2026 · mit `main` nach PR #32 abgeglichen. PR #30 liefert AP03–AP06; PR #32 veröffentlicht die ausgewählten Entwürfe 2 und 3. Der Gesamtplan ist damit teilweise umgesetzt. [Releasebeleg](releases/2026-10-07-calm-preparation.md) und [Prüfregister](verification.md) unterscheiden Implementierung, Prüfung und fachliche Abnahme.

**Nachtrag 18.10.2026 (v0.147.0, in Paket B):** «Mail in der App» (Noah 15.10.2026 12:04 «emails versenden in der app, email eingang, kalendereinträge + zugehörige emails»; 12:16 «4a»: lesen und senden in einem Paket; 12:17 «vorerst ohne mockup»; 18.10.2026 21:52: ohne Mockup, Testlink pro Paket): Google Teil 3 (GM). Danach DF (Dateiarten inkl. .pkpass), GX (Auswertungen).

**Nachtrag 15.10.2026 (v0.135.0 «Paket 2 – Ruhe, Training und Rechnungen»):** ein Release aus fünf Teilen: Meditation und Timer (ME2, ME3, Z2–Z5), Inhalte Flow + Wusstest du (#173), Eine Zahl pro Sache mit Heute H1/H2 (#170), Training TR1–TR4 (#167), Rechnungen ohne Gebühren QR1–QR9 (#169). Die Nachträge unten zu 0.136.0 bis 0.139.0 beschreiben die Teile; ihre eigenen Nummern fallen weg. Als Nächstes: Paket 2b (Pfeile + Ziehen, LI3 «Gilt für», Inspiration-Korrekturen).

**Nachtrag 14.10.2026 (v0.136.0, jetzt Teil von 0.135.0):** «Inhalte Flow» + «Wusstest du» (Mockup-Freigabe: IF1–IF3 «IF1–IF3 freigegeben» Noah 14.10.2026 04:32 UTC, WD1–WD3 «wd1-wd3 freigegeben» 18:34 UTC, Antworten «1b 2a 3a 4a» 02:03 UTC und «1a 2a» 18:34 UTC; Bilder https://claude.ai/artifact/4YCMMdTbFGvpEZuGjeBTLW): Tipp des Tages, «Das kann die App hier», Kacheln «Weiter», «Passt zu heute», Erde/Everest. Als Nächstes: IF2 Meditation, Hinweistexte HT (wartet auf Freigabe), Texte der Sportarten.

**Nachtrag 15.10.2026 (v0.134.0 «Paket 1 – Doku und Ich»):** ein Release aus sechs Teilen: Doku «Zwischenstand» (#165), Doku «Release-Analyse» (#160), Ich › Handbuch + Kleine Apps (#166), leere App ohne Start-Taschen + Wandern 15 L (#161), Inspiration sammeln, Listen und Typen mit Standard-Paket (#159). Die Nachträge unten zu 0.133.1, 0.133.3 und 0.134.0 beschreiben die Teile; ihre eigenen Versionsnummern fallen weg.

**Nachtrag 14.10.2026 (v0.133.3 «Inspiration sammeln», jetzt Teil von 0.134.0) (Mockup-Freigabe: UC2-1 «Inspiration», UC2-2 «Aus der Notiz wird …», UC2-4 «Link erkannt» vom 13.10.2026, Noah «3b» + «a», 4a, 5a):** Inspiration-Seite mit eigenen Links, Art aus der Adresse, «Aus der Notiz wird …» (Packregel, Wunschliste, Notiz), Rennen → .ics, Route → Tourentwurf. Offen: Hör-Tipp im Bereit-Check (braucht den Bereit-Check, eigenes Paket).

**Nachtrag 14.10.2026 (v0.133.1 «Handbuch und Kleine Apps», jetzt Teil von 0.134.0) (Mockup-Freigabe: HB2, Antworten «1b 2b» und «hb freigeben» Noah 14.10.2026 18:27 UTC):** Handbuch und Kleine Apps als eigene Seiten unter Ich › Die App.

**Nachtrag 14.10.2026 (v0.132.1):** «Langer Name passt» (Fehler von Noah 14.10.2026 18:41 UTC gemeldet, «BUG auf live version dringend»; gleiches Aussehen, darum ohne Mockup): ein langer Tourname bleibt bei «Tour beendet» in der grauen Box.
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

**Nachtrag 19.10.2026 (v0.152.0 «Tempo – Seiten später laden»):** Seiten laden beim ersten Öffnen, Build-Wächter 3 MB pro Datei, damit die App offline speicherbar bleibt. Kommt direkt nach F, vor G.
**Nachtrag 19.10.2026 (v0.151.0 «Paket F – Woche»):** Ort Woche mit «Woche planen» und Ferien, Google Kalender und Aufgaben in der Woche, Rundgang und Einstieg, eine Karte pro Seite (Noah «2a»), als ein Release auf C. Offen danach: Chronik, Paket Aktiv, Paket Heute.

**Nachtrag 19.10.2026 (v0.150.0 «Paket C – Heute und Aktiv»):** Heute neu geordnet (HN4 + HN4b), Bausteine mehr (SN3h–SN3j), Tages-Check als eigenes Fenster mit grossem Balance-Ring und «Deine 15 Fragen», Routine «Das tut mir gut», Impeccable Runde 2. Paket Aktiv und Paket Heute folgen nach einer Übertragung auf den heutigen Stand.

**Nachtrag 19.10.2026 (v0.149.0 «Paket E – Material, Velos, Merken»):** P4 + P5 (Werte messen, Bausteine, Bezahl-Erinnerung, Garmin mit Edge 850, Taschen-Setups, Erinnerungen, Merken), Geburtstage + Pflanzen, Eigene Werte, Skitour (Ausrüstung, Gipfelbuch, Saisonstart, Skitouren), Sportart, Eigene Listen, UI-Regeln, Impeccable Runde 1, «Was hier steht» auf 5 weiteren Seiten und TWINT per «Teilen» als ein Release auf Paket D. Offen danach: C Heute und Aktiv (mit Impeccable Runde 2), F Woche, Chronik.

**Nachtrag 19.10.2026 (v0.148.0 «Paket D – Touren und Unterwegs»):** AT1 Touren-Seite, Höhenprofil HP1–HP5, GPX-Weg R3a, Planungs-Notizen, Handy kurz (Noah «1b» 18.10., «1a» 19.10.), Bugfixes 0.132.2 + H3a, W1 «Deine Fahrten», Wörter DK6/DK7, Bewegung, Einheitliche Formulare (Notiz und Teil) und Rückmeldungen beim Speichern als ein Release auf Paket B. Offen danach: Chronik, E Material/Velos/Merken, C Heute und Aktiv, F Woche; weitere Formulare auf Form/Field.

**Nachtrag 18.10.2026 (v0.147.0 «Paket B – Server»):** Training TR5–TR7 + Mehr Inhalt + Wochenrückblick, Fitbit (Dexie 13), Dokument als PDF (auf A's Dokumente, ohne eigene Version), Google Kalender und Aufgaben (Dexie 15), KI-Deckel + Assistent + «KI-Guthaben leer», Termine buchen, Shop, automatischer Abgleich, Selbstwartung (Wächter, Dependabot) und Web-Push als ein Release auf Paket A. Offen danach: D Touren und Unterwegs, E Material/Velos/Merken, C Heute und Aktiv (braucht Fitbit und Training aus B), F Woche (liest Google aus B).

**Nachtrag 18.10.2026 (v0.146.0 «Paket A – Daten sicher und Bedienung»):** P3b (Speicher behalten, Abgleich Handy–Computer, Kopie vor jedem Import, Ich › Dokumente, Regeln 3a/5a), P3c (Bedienregeln, Kamera überall) und «Mehr Inhalt» mit Hinweistexten HT1–HT2 als ein Release auf Paket 3 (0.145.0). Offen danach: Dokumente-PDF DP (Kamera, Texterkennung, Drive; baut auf der Dokumente-Seite auf, Dexie 14), Fitbit (Dexie 13), Hinweis-Karte auf weiteren Orten (Bausteine, Vorlagen, Setup …), WS1/WS4/WS7, Bündel P4/P5 (#176, #177).

**Nachtrag 15.10.2026 (v0.145.0 «Paket 3 – Klare Regeln, dein Standard-Velo»):** Navigation + Start-Karten, Standard-Velo, Scrollen und Listen, Wieder sichtbar (WS2, WS3, WS5, WS6) und vier Anzeigefehler als ein Release, auf Regeln einheitlich 0.144.0 (#175) aufgebaut. Offen danach: Hinweistexte HT1–HT2 (eigener Thread, späteres Paket), WS1/WS4/WS7, Bündel P4/P5 (#176, #177).

**Nachtrag 15.10.2026 (v0.136.0 «Paket 2b – Sortieren, wie du willst»):** Pfeile + Ziehen überall, LI3 «Gilt für», Inspiration-Korrekturen, eine Kachelreihe auf Aktiv › Heute und neun Anzeigefehler aus 0.135.0. Als Nächstes: nach Noahs Reihenfolge in [vorhaben.md](vorhaben.md).

## Abgleich, Abweichungen und nächste Lieferfolge

**24.10.2026, v0.188.0 «Die Reste, erledigt»:** Paket «Alles fertig» mit allen kleinen Resten der alten Threads (Gute Nacht, nächster Laden, Strom-Zeile, Rennen oben, Verkaufsinserat, Heute leer und ohne Wohnort, Logbuch- und Meditations-Einträge, Tote Knöpfe 8–11). Offen danach: UI-Ziel #14 (zwei Spalten am Computer) nach dem Aktiv-Neubau.

**21.10.2026, v0.172.0 «Velo und Notizen»:** Velo im Griff (Kette nach Regen, Fotos, Inserat, Velobox, Ersatzteile, Kettenrotation) und Notizen wie Evernote (zeichnen, formatieren, Dateien, Erinnerung, Papierkorb).

**21.10.2026, v0.180.0 «Heute ergänzt»:** Mockup-Paket P6 Heute ergänzen: Meditation oben, Gewicht einmal pro Woche, letzte Aktivität nach dem Ring, fällige Check-Bereiche, «Neu» nach einem Update oben. Als Nächstes P3 Regeln.

**21.10.2026, v0.179.0 «Gepackt und geladen»:** Mockup-Paket P1 Packen und Strom: neues Teil beim Packen, Strom-Werte mit Quelle, Leuchtstufen, Ladezeit messen, Flickzeug-Fehler. Als Nächstes P6 Heute ergänzen.

**22.10.2026, v0.187.0 «Hier machen, dort anschauen»:** Aktiv neu: Aktiv zum Machen (Heute, Meine Sportarten, Training, Erholung), Auswerten zum Anschauen; jede Sportart mit Seite (Ziel, Verlauf, Meilensteine, Sporttasche). Als Nächstes: Meilensteine-Karte pro Sportart (Thread «Meilensteine als Belohnung») in den Platz der Sportseite.

**22.10.2026, v0.185.0 «Alle deine Fotos in einem Album»:** Mockup-Paket P8 Fotoalbum. Geparkt bis zur Freigabe. Damit sind alle 8 freigegebenen Mockup-Pakete gebaut (P6 Heute beim Thema Heute).

**22.10.2026, v0.184.0 «Das ganze Projekt auf einer Seite»:** Mockup-Paket P7 Projekt-Ablage. Geparkt bis zur Freigabe. Als Nächstes P8 Fotoalbum.

**22.10.2026, v0.183.0 «Eingang leer in drei Minuten»:** Mockup-Paket P5 Eingang: Ablegen-Runde (A-J4). Geparkt bis zur Freigabe. Als Nächstes P7 Projekt-Ablage.

**21.10.2026, v0.182.0 «Tennis, Yoga und gute Tage»:** Mockup-Paket P4 Aktiv: Tennis-Seite oben (Titelbild, gespielt, geplant, Gespielt?), Yoga-Karte auf Meditation, «Diesen Tag merken», «Gewünscht und erlebt». Als Nächstes P5 Eingang.

**21.10.2026, v0.181.0 «Warum, und nach welcher Regel»:** Mockup-Paket P3 Warum? und Regeln: «Warum?» in Planen, Seite «So entscheidet die App», «Meist vergessen» in Packen. Als Nächstes P4 Aktiv.

**24.10.2026, v0.186.1 «Abgleich ohne Fragen»:** Der Abgleich Handy–Computer löst Konflikte selbst (neuere Änderung gilt, die andere Version bleibt 30 Tage zum Zurückholen); keine Meldung mehr im Frontend.

**22.10.2026, v0.181.1 «Alltag ohne Sackgassen»:** Reparaturen aus dem Klick-Rundgang für Mein Tag, Meine Woche, Velo pflegen, mit Durchspiel-Test. Als Nächstes «Aktiv fertig bauen», dann «Packen fertig bauen», dann «Tote Knöpfe».

**21.10.2026, v0.178.0 «Skitouren, gut geplant»:** Mockup-Paket P2 Skitour: Tour planen mit Gefahrenstufe und «Dein Morgen», Saison-Seite, «Gipfel erreicht», Plan und Wirklichkeit. Später (nicht in P2): Saison-Karte mit allen Gipfeln (braucht Koordinaten), Skitour-Spielwiese, Nachfüll-Extras. Als Nächstes P1 Packen und Strom.

**21.10.2026, v0.177.0 «Wie Strava, nur ruhiger»:** Ein Paket für alles nach 0.176: Fahrten wie auf Strava mit Zeitleiste, Tages-Check mit Datum und Uhrzeit, Gesamttest-Korrekturen, Packliste aufräumen, Ess-Erinnerung. Danach die Mockup-Pakete P2 → P1 → P6 → P3 → P4 → P5 → P7 → P8.

**21.10.2026, v0.176.0 «Eine Tour, eine Seite»:** Fünf Reiter pro Tour bis zur Auswertung, «Fehlt noch», Lernschleife; dazu Bikepark-Tage, Taschen nebeneinander, Formulare, Notiz-Dateien.

**21.10.2026, v0.175.0 «Mach sie zu deiner»:** Jede Seite und das Menü in der App selbst anpassen (pro Gerät), Heute mit Körperwerten und Countdown, Zeichnen auf allen Fotos.

**21.10.2026, v0.174.0 «Klarer und einheitlich»:** Impeccable-Bericht umgesetzt (weniger Reiter, ein Wort pro Sache, kürzere Seiten) und Auswertung wie Training für Haken und Check-Antworten.
**21.10.2026, v0.173.0 «Suche mit Sprache»:** Sprechen oder Tippen in die Suche: Befehle laufen sofort mit Rückgängig, Fragen beantwortet die App; Ich › Suche. Webcams auf der Live-Karte, Glätte-Push.
**21.10.2026, v0.173.0 «Eigene Werte» (im Bündel 0.173):** Eigene Werte und Erinnerungen selbst anlegen, umbenennen, löschen; eigene Körperwerte; sechs neue Listen; App-Fenster statt Browser-Fragen.
**21.10.2026, v0.171.0 «Velo, Wetter und Körper»:** Verschleiss pro Teil, Bilder, Wetter-Kern mit Radar und Webcams, Körperwerte, Fitbit überall, KI im Gerät, Aus jeder Tour lernen, Schneller packen, Schlafplätze im Rennen, Tagebuch unter Planen.
**21.10.2026, v0.170.1 «Abgleich bleibt ruhig»:** keine Abgleich-Fragen mehr zu internen Werten; «Später» gibt eine Stunde Ruhe.
**20.10.2026, v0.170.0 «Live-Karte, Tagebuch, Form»:** Live-Karte mit Pause, Sensoren, Abbiegehinweisen und Umweg; Tagebuch; Form und Erholung; Heatmap; Tour-Werte wie Garmin; Check-Fragen; Zürisee; Erster Start; Haustür bis zurück.
**20.10.2026, v0.169.0 «Neue Leiste und Heute neu»:** Leiste Heute · Planen · Touren · Auswerten · Velos (gleiche Adressen; Ich nur Daten, Einstellungen, Hilfe; Handy kürzer), Heute neu mit «Dein Körper heute» und «Aktiv heute», wärmere Farben und runde Knöpfe.
**20.10.2026, v0.168.0 «Tour-Seite und Aktiv»:** Gepäck zu einer Fahrt nachtragen, Tour-Seite persönlicher, Aktiv-Kacheln selbst ändern, beim Planen jeder Anstieg der GPX-Strecke, Kartengrund auf allen Karten, kein falscher KI-Schlüssel-Hinweis.
**20.10.2026, v0.167.0 «Balken Jetzt laden»:** hängt ein Gerät an einer alten Version, bietet ein Balken oben «Jetzt laden».
**20.10.2026, v0.166.1 «Heute am Handy»:** «Jetzt dran» nicht mehr unter der Tourkarte.

**20.10.2026, v0.168.0 «Heute neu N2»:** Heute nach Noahs Brainstorming-Entscheid 5a: Körper und Check oben, Aktiv-Kacheln, Woche, Ring, Velos, 8 Kacheln. Nächste Pakete: Inhalte A Tour-Auswertung und B GPX-Höhenprofil.

**20.10.2026, v0.166.0 «Neueste Version laden»:** Fehlerseite holt die App frisch aus dem Internet, Daten bleiben.
**20.10.2026, v0.165.0 «Heute neu A»:** Heute auf einen Blick (ein Satz, Jetzt dran, Tour, Du heute, Woche, Velos, 8 Abkürzungen), Morgen-Check mit 3 Fragen.
**20.10.2026, v0.164.0 «Tests automatisieren»:** die App prüft sich selbst: jede Nacht alle Seiten, nach jedem Deploy die echte App, Zeitkapsel-Test für alle Datenversionen.

**20.10.2026, v0.163.0 «Gesamttest Runde 2»:** alle B-, C- und Design-Befunde der zweiten Runde: Strava gleicher Velo-Name, Reiter «Fahrten», kürzere Hilfe, «Gut gemacht» auf Heute.

**20.10.2026, v0.162.0 «Gesamttest-Korrekturen»:** zehn kleine Korrekturen aus dem Rundgang durch die ganze App (Leerzeichen an 88 Stellen mit Wächter-Test, Unterwegs ohne Tour, Strava «Zum Prüfen» in Zwanzigerschritten). Das neue Heute baut darauf auf.

**19.10.2026, v0.161.0 «Paket 9»:** Tour-Seite für abgeschlossene Touren (Noah «1a 2 beides 3b 4 beides 5a»).

**19.10.2026, «Verpflegung» (0.160.0, Paket 8):** neue Seite Touren › Verpflegung (Noah «1a 2a 3a und b 4a 5a»); nutzt die Ortssuche von Paket 7 mit Öffnungszeiten.
**19.10.2026, v0.159.0 «Paket 7»:** U «Rennen» mit Renn-Karte, feinem Höhenprofil, Anstiegen, Karte offline und der Live-Karte für jede Fahrt (Orte suchen, Wetter-Zeitleiste, GPX). Ton-Aufnahmen gestrichen (Noah). Danach: Trainingsplan-Kopplung (Rennen › Vorbereiten verlinkt schon auf Trainingspläne).

**19.10.2026, v0.158.0 «Heute stabil»:** Reparatur für den Mac (Heute blieb grau). Danach 0.159.0 U «Rennen», 0.160.0 Paket 8 (Verpflegung, Training zum Rennen, Kachel «Das tut mir gut»), 0.161.0 Paket 9 Tour-Seite.

**19.10.2026, v0.157.0 «Paket 6»:** Velo-FAQ (Noah «bitte velo faq in neues paket 6 tun») und die ganze Zeile bei abgeschlossenen Touren. Danach 0.158.0 U «Rennen».

**19.10.2026, v0.156.0 «Paket 5»:** Mail in die App, Grösse und der Abgleich-Hinweis. U «Rennen» wächst weiter (Noah sagt ja zu mehr Karten-Teilen) und kommt als Paket 7 (0.158.0); die Velo-FAQ als Paket 6 (0.157.0). So geht Fertiges schneller online (Noah «am besten und am schnellsten»).

**19.10.2026, v0.155.0 «Paket 3+4»:** Paket 3 und Paket 4 sind ein Release 0.155.0 (Noah «paket 3 und 4 verbinden», «mach wie es am besten und am schnellsten geht»): Freie Zeit, Daten, V Alltag, Haus-Check, Wohnungs-Hüter, «Bereit für morgen?», Strombudget, Reise-Links, Anleitungen überall, Diktat und KI. Danach 0.156.0 «Paket 5» mit U (Rennen, Renn-Karte, Live-Karte) und Mail in die App; U3 Karte offline später. Ton-Aufnahmen bleiben gestrichen.

**19.10.2026, v0.155.0 «Paket 3»:** Freie Zeit (acht Seiten, Impulse) und Daten in den Erkenntnissen, als ein Release nach Paket 2.

**19.10.2026, v0.154.0 «Paket 2»:** K, M, S, O/I mit Velo-Inspektion, L2, R, Trello und Strava-Fahrten als ein Release (Noah 15:14 «1a»). Danach 0.155.0 «Paket 3» mit Freie Zeit und Daten.

**19.10.2026, v0.153.0 «Paket 1»:** G, L, P, N, Q, H, J als ein Release auf Tempo (Noah 15:14 «1a»): Daten kommen von selbst, Werkzeugkasten und Links, Was mir gut tut, Träume und Kompass, App klarer, Packen leichter, Berg und Notfall.
**19.10.2026, v0.152.0 «Tempo»:** Seiten später laden; grösste JS-Datei 5,2 MB → rund 1 MB.
**19.10.2026, v0.151.0 «Paket F»:** Woche als ein Release auf C: Ort Woche, Woche planen, Ferien, Google in der Woche, Rundgang und Einstieg, eine Karte pro Seite.
**19.10.2026, v0.150.0 «Paket C»:** Heute und Aktiv als ein Release auf E: Heute neu geordnet (HN4 + HN4b), Bausteine mehr (SN3h–SN3j), Tages-Check als eigenes Fenster mit grossem Balance-Ring und «Deine 15 Fragen», Routine «Das tut mir gut», Impeccable Runde 2.
**19.10.2026, v0.149.0 «Paket E»:** Material, Velos, Merken als ein Release: Werte messen, Garmin (1040 + 850), Taschen-Setups, Erinnerungen und Merken, Geburtstage und Pflanzen, Eigene Werte, Skitour, Sportart, Eigene Listen, UI-Regeln, Impeccable Runde 1.
**19.10.2026, v0.148.0 «Paket D»:** Touren und Unterwegs als ein Release: Strava-Fahrten auf Touren, Höhenprofil, ein Weg «Fahrt hochladen», Planungs-Notizen, Handy kurz, Fehlerbehebungen, «Deine Fahrten», einfache Wörter, Bewegung, Formulare-Pilot.
**18.10.2026, v0.147.0 «Paket B»:** alle Server-Teile (Training, Fitbit, PDF, Google, KI, Assistent, Termine, Shop, Abgleich, Selbstwartung, Push) als ein Release. Dazu Pulszonen eins (eine Zonenquelle für Tempo, Vergangene Touren und Training, «Kommentar laden»), Mail in der App und «Gruppen überall» (jede Gruppe umbenennen und löschen, auch Ich › Dokumente).
**18.10.2026, v0.146.0 «Paket A»:** P3b Daten sicher, P3c Bedienregeln und Kamera, Mehr Inhalt und Hinweistexte HT1–HT2 als ein Release.
**15.10.2026, v0.145.0 «Paket 3»:** Regeln der App, Start-Karten, Standard-Velo, Scrollen und Listen, Wieder sichtbar als ein Release; die Einträge zu 0.140.0–0.143.0 und 0.145.0 (Standard-Velo) sind Teile davon; Regeln einheitlich ist 0.144.0 für sich (#175).
**15.10.2026, v0.136.0 «Paket 2b»:** Sortieren mit Pfeilen und Ziehen, «Gilt für», Inspiration, Anzeigefehler.
**15.10.2026, v0.135.0 «Paket 2»:** Meditation und Timer, Inhalte Flow + Wusstest du, Eine Zahl pro Sache, Training und Rechnungen als ein Release; die Einträge zu 0.136.0–0.139.0 darunter sind Teile davon.
**14.10.2026, v0.139.0 «Rechnungen ohne Gebühren»:** QR-Rechnung mit TWINT, Rechnungsliste, Geld erhalten, Kontoauszug, Zahl-Link «Ich habe bezahlt», TWINT-Screenshot lesen und «Zu zahlen» (Mockups QR1–QR9). Danach: Heute-Karten und Teilen-Weg, dann Shop (SHOP1–SHOP4b).
**14.10.2026, v0.137.0 «Eine Zahl pro Sache»:** erstes Paket aus dem Durchklick (DK1–DK3): Velopflege, Velos, Heute und Menü zählen dasselbe als fällig; Material und Tour zeigen je ein Gewicht. Danach Wörter und kleine Fehler (DK6/DK7), dann Testdaten-Hinweis (DK4) und Heute kürzer (DK5) nach 0.133.0.
**14.10.2026, v0.134.0 «Standard-Paket» und «Listen und Typen»:** Schritt S4 aus «Daten einmal bereinigen» und die Kategorien änderbar (LI1–LI4 freigegeben). Danach (Noah «a»): jede weitere Liste als eigenes kleines Release (Sportarten, Taschenplätze, Fragen …), dann der Profil-Schalter unter Ich › Die App (4a), dann Menü und Seiten selber gestalten (M1–M3, noch ohne Fragen).
**14.10.2026, v0.131.3 «Kamera-Knopf»:** Belegfoto mit einem Tipp: «Beleg fotografieren» öffnet die Handy-Kamera direkt, überall wo ein Beleg dazukommt (Mockups K1–K4).
**14.10.2026, v0.131.2 «Velo-Reihenfolge»:** kleine Korrektur nach 0.131.0; Standard-Velo (VS1–VS4) folgt nach Noahs Freigabe.

**14.10.2026, v0.131.0 «Daten einmal bereinigen»:** Grundlage für das Profil «Standard»/«Noah» (Thread «Persönlich und Standard-Profil»): Daten und Listen aufgeräumt, Regeln in [daten.md](daten.md). Danach geht der Profil-Thread mit seinen Fragen weiter.

Die AP-IDs, fachlichen Verträge und ursprünglichen Abhängigkeiten bleiben erhalten. Noah hat zusätzlich ausdrücklich die Entwürfe 2 und 3 ausgewählt und zur Umsetzung freigegeben. Deshalb wurden Teile von AP13–AP15/AP19/AP21/AP24 vorgezogen. Das ist ein dokumentierter Teilschritt; die fehlenden Grundlagen werden nicht als erledigt umetikettiert.

- PR #30 / v0.22.0: gemeinsame Typografie/Farbrollen, ehrliche Summen, Favoriten und Bereitschaft (AP03–AP06). Seine Änderungen wurden in PR #32 erhalten.
- PR #32 / Merge `be041f14fd35fd3caf98e8e7b7284bda9dcb98f9`: Entscheidungsentwurf und ruhige Packliste, lokale Schriften, mobile Zeilen, bestehende Packkontrolle. Anzeigeversion weiterhin **0.22.0**; Commit und PR unterscheiden die beiden Lieferstände.
- PR #31 / angekündigt v0.22.1: Eventmodus, relative Fälligkeitstexte, „Weitere Dinge“ und Gear-Korrektur. **Offen und nicht live.** Beim ersten Abgleich bestanden Softwarekonflikte; inzwischen integriert Commit `05a7f841e1a8da5509eed88c27a0d9cb7fc40616` die Screens aus PR #32 samt Event-Schalter. CI-Lauf 37667778399 ist erfolgreich. Die danach entstandenen Dokumentkonflikte mit PR #34 werden in dieser Dokumentationsrunde gemeinsam nachgeführt. Zu AP04/AP06/AP16/AP21 zuordnen; fachliche Releaseabnahme und Veröffentlichung bleiben separat.
- Alte Etappen A–D/Paket-5-Planung ist historische Planung. Bereits ausgelieferte Reisearten bleiben erhalten; offene Fragen daraus sind keine zweite aktive Roadmap. Die erste echte Arbeitsweg-Tour mit Rückblick ist ein Nutzungstest innerhalb AP23 und später AP25.

| Reihenfolge ab jetzt | Konkretes Ergebnis | Erfolgskriterium / Nachweis | Abhängigkeit |
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
| AP27 | **GPX einer abgeschlossenen Aktivität hochladen und als Learning nutzen** | Rückblick → «Dein Tempo» lernt Geschwindigkeit und Höhenmeter pro Stunde aus GPX-Fahrten (`src/lib/pace.js`, `debrief/Pace.svelte`). Der Rückblick liest GPX/TCX/CSV für km und Fahrten (`src/lib/activities.js`). | Erledigt in 0.41.0: Fahrt hochladen (auch ohne Tour, auch über Android-Teilen), Pausen, geplant gegen echt, 1–3 Learnings mit einem Tippen (`src/lib/gpx.js`, `src/pages/Rides.svelte`). Wetter und Verpflegung bleiben im Rückblick. |
| AP28 (erledigt in 0.39.0) | **Seite Vorlagen grundlegend überarbeiten**, in Design und Nutzen; neue Vorlagen direkt erstellen | Vorlagen entstehen nur aus einer Tour («Als Vorlage speichern») und werden in `TemplateEdit.svelte` bearbeitet. | Neue Vorlage von Grund auf (aus Bausteinen + Extra-Teilen), klare Anzeige «Standard + Regen + 2 Extra», Nutzen sichtbar (wann zuletzt benutzt, welche Touren). Baut auf 0.32–0.33 auf (Begriffe Bausteine/Vorlagen). |
| AP29 (erledigt in 0.35.0) | **Entwürfe beim Packen**: überall sichtbar «Entwurf gespeichert», jederzeit unterbrechen und später fortsetzen; mehrere Events/Fahrten gleichzeitig planen; unter **Touren** eine Liste aller Entwürfe bzw. Packvorgänge in Bearbeitung | Alles wird sofort gespeichert; mehrere Touren können parallel existieren. | Sichtbarer Hinweis «gespeichert, du kannst jederzeit aufhören» auf jeder Tour-Seite; Liste «In Bearbeitung» unter Touren mit Stand (z. B. «Packen 12/30») und «Fortsetzen». |
| AP30 | **Material per Foto mit KI erfassen**: Foto → Gegenstand erkennen → Daten im Hintergrund recherchieren → Vorschlag ins Inventar | – | Braucht einen KI-Dienst mit Bildverständnis und einen kleinen Server für den geheimen Schlüssel (die App ist heute rein statisch). Vorschlag immer zur Bestätigung, nie still eintragen. Datenschutz: das Foto verlässt das Gerät. Aufwand: mittel bis gross (eigenes Release plus Einrichtung des Dienstes durch Noah). |

**Stand 08.10.2026:** AP29 ist mit v0.35.0 (PR #57) erledigt (Design-Variante B). Die Reihenfolge der übrigen Pflicht-Wünsche steht im nächsten Abschnitt.

## Stand und nächste Pakete (8.10.2026)

**Nachtrag 15.10.2026 (v0.155.0 «Heute neu geordnet», HN4 + HN4b) (Mockup-Freigabe: HN4 «1a 2a 3a 4b HN4 freigegeben» Noah 14.10.2026 21:51, Thread cmsg_018WAR7H251KvEyztXFE5y9Q6xUXvUCqyKZov5xuzzXKZP; HN4b «3a» 22:12 und «HN4b freigegeben» 22:13, Thread cmsg_018WAR7H251KvEyztXFE5y9Q9VEbuzJpjHgYuQkNdpEk6E):** Heute in neuer Reihenfolge mit Meditation-Karte, Tageskarte nach Tagesteil, «Heute wichtig» als Zeile, Balance kompakt neben Im Flow, Tourkarte am Vortag oben (4b), Aktiv als ganze Zeile, «Strava verbinden» unten; zehn Kacheln weg von Heute. Baut auf 0.154.0 auf. Nächste Schritte aus «Heute neu»: Buchungs-Zeilen in «Heute wichtig», «Mehr Ideen» (0.158.0).

**Nachtrag 14.10.2026 (v0.154.0 «Bausteine mehr», SN3h–SN3j) (Mockup-Freigabe: SN3h–SN3j «SN3h–SN3j freigegeben» Noah 14.10.2026 21:31:37 UTC, Antworten «1a 2a 3a 4b 5a»):** neun neue Bausteine mit Beispiel-Teilen, neue Teile in bestehenden Bausteinen mit «+N neu» und Rückgängig, Kälte und andere Erweiterungen als Stufen (je ein Vorschlag), Gruppen nach der Gesamtliste mit neuer Gruppe Baden, Baden von Hand in Planen. Baut auf 0.144.0 «Regeln einheitlich» auf.
**Nachtrag 13.10.2026 (v0.138.0):** «Training» TR1–TR4 (Mockup-Freigabe: TR1–TR4 «tr1-4 ok» Noah 13.10.2026 18:07 UTC im Thread «Strava-Ausrüstung prüfen»; Antworten «1-5a» 18:06 UTC; Offene Mockups 2 #training): Kachel «Letzte Aktivität», Aktiv › Training mit allen Strava-Aktivitäten und Pulszonen, eine Aktivität im Detail, Woche planen mit Ziel und Rückblick. Feste Termine aus AK1 Woche kommen mit «Aktiv ausweiten». Ziel «Eine App, die mich im Alltag unterstützt».

**Nachtrag 14.10.2026 (v0.135.0 «Meditation und Timer») (Mockup-Freigabe: ME1–ME3 und Z1–Z5 «ME1-ME3 und Z1-Z5 freigeben» Noah 13.10.2026 16:02 UTC; Antworten «1a 2a 3a 4b 5b» und Timer «1-5a» 13.10.2026; Reihenfolge «vor Bündel B» 14.10.2026 04:25 UTC):** Meditation als eigener Reiter in Aktiv, zweiter nach Heute (ME2, Noah 15.10.2026 «1a»), Rückblick nach Woche/Monat/Jahr (ME3); Timer mit Seite, Ziffernblättern, schwebendem Timer und Log (Z2–Z5). Als Nächstes: ME4 Yoga (freigegeben 14.10.2026 «ME4 freigabe»); ME1/Z1 auf Heute nach Noahs Prüfung gegen HN0.

**Nachtrag 15.10.2026 (v0.140.1 «Start-Karten») (Mockups ST1–ST2 freigegeben: «1a 2a 3b ST1–ST2 freigegeben» 14.10.2026 21:18 UTC; Platz bei der Tourkarte nach HN4 «1a 2a 3a 4b HN4 freigegeben» 21:51 UTC):** Karten «Heute unterwegs» und «Letzter Abend» bei der Tourkarte statt der Sprünge auf Heute.
**Nachtrag 15.10.2026 (v0.140.0 «Regeln der App») (Regeln freigegeben: «a a, b a, c b, freigabe» 14.10.2026; Mockups C1 C2 A1 «C1 C2 A1 freigegeben» 14.10.2026 20:29 UTC; App-Start 1b aus «1b 2b 3b 4a 5a» 19:59 UTC):** Regeln pro Seite statt Einzelfälle: nichts springt von selbst (A a), ein Tipp öffnet zum Ändern (C b), Start nach Pause auf der Startseite (1b), Zurück schliesst überall zuerst das Fenster. Als Nächstes 0.140.1: Karten «Heute unterwegs» und «Letzter Abend» statt der Sprünge auf Heute (ST1/ST2, «1a 2a 3b»).
**Nachtrag 14.10.2026 (v0.144.0 «Regeln einheitlich», RE) (Mockup-Freigabe: RE1–RE3 «RE1–RE3 freigegeben» Noah 14.10.2026 20:37 UTC, Antworten «1a 2a 3a 4a 5a»; die fünf Regeln «1-5 a» 20:20/20:22 UTC):** eine Regen-Grenze für die ganze App (Baustein Regen, 30 %), «nie gebraucht» ab 3 Touren, Rückblick ohne Vorab-Häkchen, eine Tagesuhr, Pflege pro Velo («Pflege für …»); Fix Kopie der letzten Tour.
**Nachtrag 14.10.2026 (v0.133.0 «Design-Refresh», Bündel A) (Mockup-Freigabe: SN4g «freigabe» 13.10.2026 22:24 UTC; SN6 22:59/23:12 UTC mit Antworten; SN1–SN7 23:04 UTC; AB1–AB6 «freigabe» 14.10.2026 00:06 UTC, Antworten «1a 2a 3b 4a und b» 00:52 UTC; HG1 «HG1 freigegeben» 01:02 UTC, Antworten «1a 2b 3 …» 00:55 UTC und «1a 2a» 01:01 UTC; FE1 ohne Bilder «b» 13.10. 23:52 UTC, FE13/FE14/FE16 «a» 23:56 UTC; Name «Wi gaht's?» 01:34 UTC; Übernahme der alten Tagescheck-Karte «a) ja, alle drei übernehmen» 01:52 UTC und «ok. freigabe» 02:58 UTC):** Begrüssung HG1, «Wi gaht's?» AB1–AB6 mit Übernahme der alten Tagescheck-Karte (Balance-Ring, Runden 07:00/20:30, 7-Tage-Werte), Tour aus komoot, Touren-Seite SN4g, SN5 plus, SN6 plus, Bedienung FE1/FE13/FE14/FE16. Dazu KT «Kacheln antippbar» (Mockup-Freigabe: KT1–KT4, Antworten «1 a und b 2a 3a 4a» und «KT freigegeben» Noah 14.10.2026 10:31 UTC): «Öffnen ›» auf jeder Kachel, ••• auf jeder Aktivität mit Hilfezeile, kurze Einführung einmal nach dem Update (wieder abspielbar unter Ich), Anheben am Computer.
**Nachtrag 14.10.2026 (v0.132.2):** «Velo draussen ohne falschen Haken» (Fehler von Noah 14.10.2026 18:46 UTC gemeldet; gleiches Aussehen, darum ohne Mockup): eine Tour für heute hakt «Velo draussen» erst nach dem Beenden ab.
**Nachtrag 14.10.2026 (v0.132.0 «Tagespaket 14.10.»):** ein Release zusammen mit 0.125.0 in PR #151: Velo-Setup UC3-1–UC3-3 (#155), Kluge Suche (#154), App-Wartung BF4/BF7/BF8, Bedienung FE2/FE6/FE7/FE8/FE9/FE10/FE11/FE17/FE18, Bezahlen vorbereiten mit Erklär-Seite Ich › Bezahlen BZ1/BZ2b (#156), Kleine Apps Meditation/Packliste/Velopflege + Benutzerhandbuch (#157), Doku «Links nach aussen» DG-X1–X16 (nur Spezifikation). Velo-Setup steht als Teil darunter. Als Nächstes: Noah merged #151 (0.125.0 + 0.132.0), dann Links nach aussen (DG-X) über Design-Refresh.
**Nachtrag 14.10.2026 (v0.132.0, Branch):** «Velo-Setup» nach UC3-1–UC3-3 (Mockup-Freigabe: UC3-1–UC3-3 «UC3-1-UC3-3 freigeben» Noah 14.10.2026 00:42 UTC, Antworten «1-5a» 00:34 UTC, Ausbau «1 ja 2 ja 3ja» 00:35 UTC): neuer Reiter Velos › Setup mit Mein Setup, Gesamtgewicht, Taschen-Plan pro Tour (`view=bags`), Setup-Logbuch (`view=log`), «Dein Velo im Vergleich», «Deine Rennen» und Galerie «Ideen von anderen». Ersetzt den Entwurf UC2-3.
**Nachtrag 14.10.2026 (v0.131.1):** «Abhaken wieder abwählbar» (Fehler von Noah 14.10.2026 05:19 UTC gemeldet; gleiches Aussehen, darum ohne Mockup; GitHub-Freigabe nur für diesen Fix: «freigabe» 05:54 UTC): Häkchen auf Heute lassen sich wieder abwählen, «Rückgängig» wirkt, Pendeln lässt sich zurücknehmen.
**Nachtrag 13.10.2026 (v0.125.0 «Tagespaket 13.10.»):** ein Release aus vier Paketen: Tages-Check Schritt 1+2 (#151), Aktiv ausweiten AK1–AK3 Woche/Sporttasche/Erholung (#150), Feinschliff A-J1 Werkstattbesuch, TZ-1 drei Tour-Zustände, A-U1/A-U2/A-U5 (#152), Werte überall WU1–WU4 + Strava verbinden SV1 (#153).
**Nachtrag 13.10.2026 (v0.125.0 Tagespaket):** «Tages-Check» Schritt 1 (Mockup-Freigabe: T1–T4 «ich gebe hiermit alle mockups frei» Noah 13.10.2026 16:17 UTC; gebaut T1–T2, T3–T4 folgen in Schritt 2): Morgen-Check und Abend-Rückblick als eigene Seiten unter Heute, Antworten in `flowChecks`, Meditation und Fahrten zählen von selbst. Schritt 2: Ring auf Heute (T3) und Fragen-Katalog (T4). Ziel «Eine App, die mich im Alltag unterstützt».
**Nachtrag 13.10.2026 (v0.125.0 Tagespaket, Schritt 2):** «Tages-Check» Schritt 2 nach T3/T4 (Mockup-Freigabe: «T1–T4 freigegeben» Noah 13.10.2026): Balance-Ring der 9 Kategorien, Morgen-Check-Kachel und «Deine 15 Fragen» auf Heute, Fragen-Katalog mit Schaltern, Frage 15 am Sonntag, Tipp und langes Drücken für Kachelgrössen. Offen: Im-Flow-Ringe durch den grossen Ring ersetzen? (Frage an Noah), Beobachtungen nach 2 Wochen, Fitbit/Google.
**Nachtrag 13.10.2026 (v0.125.0 Tagespaket):** «Woche» (Mockup-Freigabe: AK1 «ich gebe hiermit alle mockups frei» Noah 13.10.2026 16:17 UTC im Projekt-Chat, Antworten «1-5a» 16:02 UTC im Thread «Mein Überblick», Offene Mockups 2 #aktiv-ausweiten): Aktiv › Heute › «Woche» mit festen Terminen, Vorschlägen nach Zielen und Wetter, .ics. Im selben Paket «Erholung» (AK2, Fitbit-Werte mit Bündel B) und «Sporttasche» (AK3) mit Erinnerung am Vorabend auf Heute. Damit ist «Aktiv ausweiten» gebaut. Ziel «Eine App, die mich im Alltag unterstützt».
**Nachtrag 13.10.2026 (v0.125.0 Tagespaket):** A-U5 «Formulare nutzen vorhandene Daten», A-U2 «Leer, Laden, Fehler: überall gleich» und A-U1 «Update-Hinweis als Banner» aus der Gesamtprüfung als ein Release (Mockup-Freigabe: A-U1–A-U5 «A-D1–A-D5 und A-U1–A-U5 freigeben» 13.10.2026 16:04 UTC (Mein Überblick, cmsg_018WAR7H251KvEyztXFE5y9QSrnbx2M9TfQHMNXXx7fa2K); Antworten 2a, 3a): neue Tour mit Fahrstunden ähnlicher Touren und Heimat als Start (grün, änderbar), Namensprüfung am Feld; Fehlerseite statt weisser Seite, ein Leer-Baustein, Platzhalter beim Laden; Banner auf Heute statt Fenster nach Updates. Als Nächstes laut Reihenfolge 5a: A-D3, A-D4 (mit Heute aufräumen), A-J2, A-U3, A-U4. Ziele 1 «Schneller packen» und 3.
**Nachtrag 13.10.2026 (v0.125.0 Tagespaket):** TZ-1 «Zustand sichtbar» nach den Mockups TZ1–TZ2 (Mockup-Freigabe: TZ1–TZ3 «TZ1–TZ3 freigegeben» 13.10.2026 15:38 UTC, Antworten «1-5 a» 15:37 UTC): eine Regel `tripState()` für Geplant / Abgeschlossen / Bewertet, Pille `ui/TripState.svelte`, Tokens `--st-*`; Touren-Übersicht nach Zuständen mit Filter-Chips und Legende, Tour-Kopf und Heute mit Pille. Als Nächstes TZ-2 «Fest nach der Fahrt» (Liste fest, «Wieder öffnen», «Bist du gefahren?»), dann TZ-3 «Kurz bewerten». Ziel 4 «Aus jeder Tour lernen» und Ziel 3 (Phase vor, während, nach der Tour).
**Nachtrag 13.10.2026 (v0.125.0 Tagespaket):** A-J1 «Ein Weg zum Erfassen» aus der Gesamtprüfung (Mockup-Freigabe: A-J1 «aj-aj5 ok» 13.10.2026 17:19 Zurich (Projekt-Chat)): Werkstattbesuch aus Neu ist ein echter Besuch mit km und letzter Werkstatt vorausgefüllt; Problem melden nur in Neu und am Velo. Als Nächstes laut Reihenfolge 5a: A-U5, A-U2 (+A-U1 mit W1–W3). Ziel 2 «Velo im Griff».
**Nachtrag 13.10.2026 (v0.125.0 Tagespaket):** «Werte überall» + «Strava verbinden» (Mockup-Freigabe: WU1–WU4 und SV1 «ich gebe alle bild mockups frei» Noah 13.10.2026 17:18 UTC im Projekt-Chat; Antworten «1-5a» 16:31 UTC; Offene Mockups 2 #werte-ueberall und #strava-verbinden): Höhenmeter und Puls auf Heute, Aktiv und als Jahresziel, Fussabdruck, Höhenmeter je Teil, Karte «Strava verbinden». Aktivzonenminuten folgen mit Fitbit (Bündel B). Ziel «Eine App, die mich im Alltag unterstützt».

**Nachtrag 13.10.2026 (v0.124.0, Branch):** «Neue Tour Teil 2» nach den Mockups B4/B5 (Mockup-Freigabe: B4/B5 «b2 b4 b5 ok» 12.10.2026 22:55 Zurich; B5 Standard a ★): Bausteine als grosse Knöpfe in Packen, «Reparatur unterwegs» mit höchstens 8 Teilen, schlanke Reparatur wieder Standard bei neuen Touren. Offen: «Neues Teil direkt beim Packen» (NP1, Mockup wartet auf Freigabe). Ziel 1 «Schneller packen».

**Nachtrag 13.10.2026 (v0.123.0):** «Trophäen-Vitrine» (Mockup-Freigabe: TV1–TV2 «tv1-tv2 freigeben» Noah 13.10.2026 15:57 UTC im Thread «Mein Überblick», Antworten «1-5a» 15:50 UTC): alle Sterne an einem Ort nach Bereich und Jahr, Link «Alle Trophäen ansehen» im Regal. Strava-, Fitbit- und Tages-Check-Sterne folgen mit Bündel B und D. Ziel «Eine App, die mich im Alltag unterstützt».
**Nachtrag 13.10.2026 (v0.122.0, Branch):** «Dateneingabe D1–D4» (Mockup-Freigabe: D1–D4 «D1–D4 freigegeben» 13.10.2026, Antworten «1a 2a 3b 4b 5a», D1 als Variante D1a ★ Wert-Karten): Werte im Abhol-Check als Karten zum direkt Tippen, Seite «Werte erfassen» mit Weiter-Sprung, «Felder wählen» für alle Velos, eigene Felder. Ziel «Eine App, die mich im Alltag unterstützt».
**Nachtrag 13.10.2026 (v0.121.0):** «Strava-Fahrten zählen mit» nach SZ1–SZ2 (Noah «1a», «sz1-sz2 freigeben»): bestätigte Strava-Fahrten zählen in Heute «Diese Woche» und «Velo im Monat» und in Aktiv «Velo in diesem Monat», eine auch hochgeladene Fahrt einmal. Danach im Paket B: der Google-Teil (Schlaf, Ruhepuls, AZM) nach D7.

**Nachtrag 13.10.2026 (v0.119.0, Branch):** «Schnellstart» nach den Mockups Q1–Q3 (Mockup-Freigabe: Q1–Q3 «Q1–Q3 freigegeben» 13.10.2026 00:05 Zurich, «1-5a»): ein Klick auf Heute plant eine Tour für heute (2,5 Std., letztes Velo, Standardteile, Wetter aus der Vorhersage), Name = Zeitstempel, man bleibt auf Heute mit grüner Karte «Öffnen»/«Rückgängig»; Tournamen-Felder markieren beim Fokus den ganzen Namen. Ziel 1 «Schneller packen» und Ziel 3.

**Nachtrag 13.10.2026 (v0.118.0, live, #143):** «Was ist neu 2» nach W1–W3 (Noah «w1-w3 freigeben», «1a 2a 3a 4a 5a»): alle Versionen neu erzählt (Titel, Satz, Hauptpunkte mit ›, Kleinkram in Kästchen), Fenster nach Update mit «Looos», Ich › Was ist neu nach Monat. Dazu «KI-Helfer ausblenden» nach K1–K4 (Noah «k1-k4 ok»): Helfer von Anfang an aus, ein Schalter für alle Stellen.

**Nachtrag 12.10.2026 (v0.117.0, PR offen):** «Knöpfe neu» nach den Mockups N1–N4 (Noah «n1-n4 freigeben», «1a 2a 3a 4a 5b»): jeder Knopf erklärt sich (Maus, Tastatur, langes Drücken), ein Hauptknopf plus «…» pro Zeile, Knöpfe rechtsbündig bzw. am Handy unter dem Text, Knopftext höchstens 2 Wörter auf allen Seiten; «Erledigt» in der Velopflege mit «Rückgängig». Bausteine `ui/Btn`, `ui/MoreActions`, `ui/explain.js` für die nächsten Pakete.
**Nachtrag 13.10.2026 (v0.116.2, PR offen):** «Bugfix Dateneingabe»: «eintragen» auf den Velo-Blättern öffnet genau diesen Wert und führt zurück aufs Blatt. Felder ein-/ausblenden und Eingabe direkt im Blatt folgen nach Mockup-Freigabe.

**Nachtrag 13.10.2026 (v0.116.1, PR #140):** Fehler-Fix aus der UI-Prüfung: alte Rückblicke ohne Teileliste öffnen wieder. Die übrigen Befunde fahren in Bündel A (Zahlen, Heute, Kleinkram) und C (Unterwegs) mit (Noah «1a 2a 3a 4a 5a»).

**Nachtrag 12.10.2026 (v0.116.0, PR offen):** E3 «Strava-Verbindung» (S1–S5): Velo › Pflege › Strava verbinden, erstes Holen aller Fahrten mit Zusammenfassung, Einstellungen (automatisch / per Knopf, Fahrt ohne Velo zum Prüfen / selbst nach Fahrtart), Zuordnung Strava-Velo ↔ App-Velo, «Velo in Strava geändert» auf Heute und beim Velo, Kachel «Strava», «Zum Prüfen». Q1 «Jeder km zählt» bekommt damit die automatische Quelle; Kontrolle App-km = Strava-km einen Monat nach E3. Dazu Puls pro Fahrt aus Strava an sechs Orten (P1–P6). Als Nächstes: Strava-Fahrten zählen in «Diese Woche» und «Velo in diesem Monat» (Q1 = a), danach der Google-Teil mit Schlaf und Aktivzonen-Minuten.

**Nachtrag 12.10.2026 (v0.115.0, live):** Menü-Fix: jedes •••-Menü schliesst mit einem Tipp daneben (Velopflege › Probleme, Velo-Check, Packliste, laufende Touren).

**Nachtrag 12.10.2026 (v0.114.0, live):** «Rahmenbedingungen» (B1–B3): neues Fenster für eine neue Tour mit Sportart, Wetter aus der PLZ, Event-Hinweis, Vorlagen als Knöpfe ohne «Letzte Tour» und der Packliste in vier Gruppen; Reparatur und Laden nicht mehr von selbst. Als Nächstes Release 2 (B4 Bausteine beim Packen, B5 «Reparatur unterwegs») nach #131.

**Nachtrag 12.10.2026 (v0.111.0, PR offen):** «Bausteine bearbeiten» Teil 1 nach den Mockups V1–V6 (Noah «v1-v4 ok», «v5-6 ok»): Vorabend-Check als Zeile auf «Gepackt» mit Fenster, Schluss-Check unter «Bevor du auspackst», «Liste anpassen» für diese Tour oder alle der Reiseart, neue Seite Ich › Checks pro Reiseart. Danach C «Meist vergessen», D+E Temperaturbereich und Learnings, F Regel-Editor (Release 2).

**Nachtrag 12.10.2026 (v0.110.0, live):** Design-Refresh P10 «Was ist neu» (I11, I11b–I11e): Ich › Was ist neu mit neuester Version, allen Funktionen (sortierbar, Deine Top 10, Wichtigste 10, Suche) und allen Versionen nach Monat; Meldung nach Update mit «Nicht mehr anzeigen»; Kachel «Neu» 14 Tage oben auf Heute. Damit sind alle 10 Pakete des Design-Refresh gebaut.

**Nachtrag 12.10.2026 (v0.109.0, live):** Design-Refresh P6 «Rückblick, Auswerten, Fahrten» (T14–T23): Tour beendet, Rückblick ausfüllen und gespeichert, Rückblick-Übersicht, Gelernt, Dein Tempo, Logbuch, Vergangene Touren, Fahrten und eine Fahrt im neuen Stil. Danach P10 Was ist neu.

**Nachtrag 12.10.2026 (v0.108.0, live):** Design-Refresh P9 «Ich» (I1–I10, I12, I13): Ich in vier Gruppen, Daten und Backup als eigene Seite mit Status-Lichtern, Aufs Handy mit QR-Code, Eingang, Ablegen, Notizen, Helfer, Problem melden, Wohnort, Tastenkürzel, Spielwiese. Danach P6 Rückblick und P10 Was ist neu.

**Nachtrag 12.10.2026 (v0.107.0, live):** Design-Refresh P8 «Aktiv» (A1–A8, A13, A14, A14c): Aktiv heute, Ziele, Aktivität, Meilensteine, Meditation «Mehr», Logbuch und neue Seite «Muster»; Vorschläge als Challenge.

**Nachtrag 12.10.2026 (v0.106.0, live):** Design-Refresh P5 «Packen und Unterwegs» (T6–T13): Taschen als eine Liste, helle Fenster für Tauschen, Laden, Entscheiden, Fakten und Tour beenden, Unterwegs mit dem Tag in Blöcken und Stunden-Wetter.

**Nachtrag 12.10.2026 (v0.105.0, live):** Design-Refresh P7 «Velo» (V1–V14): Velo-Seite, Fenster, Mappe, Pflege-Übersicht und ein Velo als eigene Seite, Import, Werkstatt und Belege, Ausstattung, Vergleich.

**Nachtrag 12.10.2026 (v0.104.0, live):** Design-Refresh P4 «Touren» (T1–T5, T24, Karte und Etappen): Übersicht, Neue Tour, Vorlagen, Planen mit Karte, Höhenprofil, Gewicht nach Ort, Etappen und Wetter an den Zeltplätzen.

**Nachtrag 12.10.2026 (v0.103.0, live):** Design-Refresh P3 «Material» (M1–M6): Liste zuerst, eine Werkzeugzeile, Ansichten rechts, Fenster und Blätter im neuen Stil. Danach P3b Material M7–M14, P4 Touren, P7 Velo.

**Nachtrag 12.10.2026 (v0.102.0, live):** «Vorschlag und Challenge» (D1b/D5): Kachel «Heute baden oder Sauna?» mit Alternativen und «Als Challenge setzen», zählt von selbst, geschafft = Meilenstein. Dieselbe Kachel kommt mit P8 nach Aktiv; Wasser/Luft-Werte mit der Daten-Zentrale.

**Nachtrag 12.10.2026 (v0.101.0, live):** Design-Refresh P2 «Heute» (H1–H9): heller Kopf, Tour-Karte mit Zahlen und Packbalken ohne Foto, helle Kacheln, vier neue Kacheln, «Neu» nach Bereichen, helle Suche. Danach als kleine Schritte: «Als Challenge setzen» (D1b/D5) und «Inspiration». Parallel P3 Material.

**Nachtrag 12.10.2026 (v0.100.0, PR offen):** Design-Refresh P1 «Zurück, Schritte, Weiter-Leiste» (G7): heller Tour-Kopf mit «‹ Touren › Name», nummerierte Schritte, Weiter-Leiste unten mit «Schritt n von m». Noah hat am 12.10.2026 «10 Pakete» gewählt: Als Nächstes P2 Heute ∥ P3 Material, dann P4 Touren ∥ P8 Aktiv, P5 Packen/Unterwegs ∥ P7 Velo, P6 Rückblick ∥ P9 Ich+Teilen, am Ende P10 «Was ist neu».

**Nachtrag 12.10.2026 (v0.99.0, live):** Design-Refresh R3 «Bausatz» (G2/G3, Noah 3b): Knöpfe, Felder und Abzeichen einheitlich mit weicher Ecke und 44 px, leere Seiten als ruhige Karte, Konfetti beim grossen Feier-Moment, Hinweise mit Haken und «Rückgängig». Als Nächstes R4 Zurück, Schritte und Weiter-Leiste.

**Nachtrag 12.10.2026 (v0.98.0, live):** Design-Refresh R2 «Heller Kopf» (G4/G5 A★): heller Kopf und helle Seitenleiste, «Neu» oben neben der Suche, kein runder Knopf mehr über der Seite, «Ich» als Karte unten in der Seitenleiste. Als Nächstes R3 Knöpfe, Karten, Zeilen und Zustände (mit Konfetti), dann R4 Zurück und Schritte.

**Nachtrag 12.10.2026 (v0.97.0, live):** Design-Refresh R1 «Darstellung» (G1 neu, Noah «1a 2a 3b 4a 5a»): Salbei und Inter als Standard, Ich › Darstellung mit Schrift, Farbwelt, Grösse und hell/dunkel. Danach R2 heller Kopf und Seitenleiste, R3 Bausteine, R4 Zurück und Schritte; alle anderen Bauten pausieren bis Welle 1 und Heute live sind.
**Nachtrag 11.10.2026 (v0.96.0, PR offen):** F1 «Alles finden» (Noah «1-5 a», Mockups A/B): «Was die App kann» zeigt alle 84 Funktionen nach Situation, nie Benutztes zuerst, mit «Hinbringen» und «Ausprobieren»; die Suche zeigt Befehle zum Ausprobieren und findet Funktionen. Danach die Kalender-Bausteine Kal1–Kal5 neben D5 (je eine Mockup-Runde).
**Nachtrag 11.10.2026 (v0.95.0, PR offen):** «Velo kurz» (App einfach D, Noah 5a): Velos › Übersicht mit drei Zeilen, «Fahrten importieren» als Knopf und «Mehr»; Ausstattung ohne orange Hinweise. Danach E «Material Liste zuerst» zusammen mit «Bereiche trennen» B2 (zuerst Mockups).

**Nachtrag 11.10.2026 (v0.94.0, live, PR #111):** «Kachel-Wand» nach Noahs «1-5 a» und «ok a» (Mockups A–D): Heute ist eine Wand aus Kacheln in vier Grössen, anpassbar (auch lange drücken), «+» mit Katalog, «Neu»-Punkt, eine Serie über alles mit Ruhewoche und Feier, alle Meilensteine auf einer Seite, Daten und Backup unter Ich, die Wand im Backup. Ersetzt den Entwurf «Startseite dicht» (E1 Teil 1). Später: K6 Tipp der Woche und App-Symbol-Kürzel, K7 Tageszeit, mehrere Wände, Kachel-Vorschlag (je mit Mockups).

**Nachtrag 11.10.2026 (v0.93.0, PR offen):** «Meditation Wünsche» nach Noahs «1-5 a» (Mockups F–H): Neue Sitzung mit Sternen zuerst, Dauer 10–60 oder frei, Klänge keine · zufällig · eigene (alle N oder an Minute), «Als Vorlage speichern?» mit Namensvorschlag; vier Uhren Ring · Sanduhr · Mond · Zahl, gemerkt, Sanduhr mit ausblendbarer Zeit. Heute (Startseite) bleibt beim Faden «UI-Analyse».
**Nachtrag 11.10.2026 (v0.92.0, PR offen):** «Rückblick antippen» (App einfach C, Noah 4a): der Rückblick beginnt mit den Chips «Was hast du nicht gebraucht?», der Rest sind Zeilen darunter, der Knopf heisst «Fertig». Danach Velo kurz (D) und Material Liste zuerst (E).
**Nachtrag 11.10.2026 (v0.91.0, PR offen):** Fix im Fahrten-Import (Q1 «Jeder km zählt», Noah «Fix bauen»): alte Strava-Fahrten ohne Velo, die schon in den Startwerten stecken, liegen zur Seite statt unter «Prüfen»; ein von Hand gewähltes Velo prüft seinen Startwert. «Material Liste zuerst» bekommt die nächste freie Nummer.

**Nachtrag 11.10.2026 (v0.88.0, PR offen):** «Aufräumen und Ausprobieren», der erste Schritt der App-einfach-Reihe (Noah «1a 2a 3b 4a 5a», Mockups F–H «0.88 alle a»): Ich › Testdaten aufräumen mit Rückgängig, Ich › Ausprobieren als Spielwiese, «Wieder planen» für eine zu früh beendete Tour. Danach 0.89 Rückblick antippen, 0.90 Velo kurz (mit Pflege und Ausstattung ohne rote Hinweise), 0.91 Material Liste zuerst. Neue Tour und Planen bleiben (3b).

**Nachtrag 11.10.2026 (v0.86.0, PR offen):** «Meditation einfach» nach Noahs «1-5 a» (Mockups A–E): Startblatt aus «Heute abhaken», kurze Meditations-Seite mit «Mehr», nach dem Gong nur Satz, Tiefe und «Fertig», ruhige Uhr; «Diese Seite kann», «geplant»-Zeilen und Wisch-Hinweis weg (Im Flow, Ziel-Check: Vorhaben 6). Das Startblatt ist bereit für Heute (anderer Faden). Danach weiter mit Liegestütze und Tennis (H9a).
**Nachtrag 11.10.2026 (v0.84.0, PR offen):** Hobby-Seiten Teil 3 «Nach dem Gong» gebaut (B3–B6): Auswertung nach dem Gong mit Notiz, Tiefe, Stimmung, «Was hat geholfen», Serie, Vergleich und «Als Nächstes» (.ics); Protokoll mit Filtern, Serien-Wärmebild, Tageszeit, Monatsvergleich, Kalender und Grafik; Sitzung im Detail mit «Wieder so starten» und «Als Vorlage speichern» (Im Flow, Ziel-Check: Vorhaben 6). Damit ist Meditation B1–B8 komplett. Als Nächstes Liegestütze und Tennis (H9a).
**Nachtrag 11.10.2026 (v0.83.0, live, PR #109):** «Ausstattung» nach Noahs Wunsch (Canyon-Vorbild, A1–A5 a): Velos › Ausstattung mit Masse-Kacheln, Teilen in Gruppen mit Gewicht und Preis, Gewicht pro Bereich und teuersten Teilen; Vergleich nur mit gefüllten Zeilen. Kleiner Release neben Hobby Teil 3 (anderer Bereich, Regel 5).

**Nachtrag 11.10.2026 (v0.81.0, PR offen):** Hobby-Seiten Teil 2 «Kissenzeit» gebaut (B1, B2, B7, B8): Meditations-Seite mit Vorlagen, Wie letztes Mal, Arten, Herausforderung, Meilensteinen, Klängen, Zitaten, Links, Orten; Intervalle mit Marken auf der Uhr; Sitzung im ganzen Bildschirm, gespeichert in flowSessions (Im Flow, Ziel-Check: Vorhaben 6). Als Nächstes Teil 3 «Nach dem Gong» (B3–B6), dann E1, D5.

**Nachtrag 11.10.2026 (v0.80.0, PR offen):** «Tests stabil» (Noah «1-5 a», Frage 1a): die wackligen Browser-Tests behoben (App-Zeichen `data-ready`/`data-today`, gemeinsamer Helfer `tests/e2e/settle.js`), keine sichtbare Änderung. Die Reihenfolge danach bleibt.

**Nachtrag 11.10.2026 (v0.79.0, gemergt, PR #106):** Hobby-Seiten Teil 1 gebaut: Aktiv › Aktivität mit sechs Kacheln, Ringen, Vorschlägen und Ideen, dazu Meilensteine über alle Aktivitäten mit Stufen, Sternen, eigenen Zahlen und Belohnung (Im Flow, Ziel 3). Als Nächstes Hobby-Seiten Teil 2 (Meditation), dann E1, D5.

**Nachtrag 10.10.2026 (v0.78.0, gemergt, PR #105):** Fünf Orte Teil 2 ist gebaut: Tabs oben pro Ort, Wischen am Handy, letzter Tab gemerkt, Hinweis bei alten Adressen, Was ist neu als Blatt, Touren-Einstieg mit Kacheln und Bestwerten, Rückblick mit offenen Rückblicken zuerst, Material › Einkauf. Als Nächstes nach der Reihenfolge vom 10.10. 14:33: Hobby-Unterseiten (Mockups zuerst), E1, D5.

**Nachtrag 10.10.2026 (v0.77.0, gemergt, PR #104):** KI-Helfer (PR #89) auf Fünf Orte gebracht (K1–K3 a): Ich › Helfer, «Frag den Helfer» oben in Neue Tour, Antwort in der Suche, «Liste prüfen» neben «Weiter zu Packen», Rückblick-Entwurf, Wartungsvorschläge in «Jetzt fällig» (AP-Bezug S4 KI-Helfer, Ziele 1, 2 und 4). Danach Fünf Orte Teil 2. «Reisearten neu» ist ein eigenes Paket ganz am Ende, nach Neuland + Inspiration (Noah, 16:38).

**Nachtrag 10.10.2026 (v0.76.0, live):** Fünf Orte Teil 1 ist gebaut: fünf Orte (Aktiv neu), «Ich» statt «Mehr», runder +-Knopf am Handy, Seitenleiste am Computer, Tastenkürzel (AP-Bezug AP07 Navigation). Als Nächstes Fünf Orte Teil 2 (Tabs pro Ort, Wischen, alte Adressen, Übergänge 2).

**Nachtrag 10.10.2026 (v0.75.0, live, PR #101):** «Feinschliff» gebaut (D1–D4 a, Material-Detail 1–5 a, Umbenennen 1–5 a): ein Umbenennen-Blatt überall mit Rückgängig, Zurück-Taste speichert, Import fragt neue Fahrt-Typen einmal, Teile-Fenster mit Zusammenfassung und leichteren Alternativen, Erste Hilfe auf jeder Tour, 44-px-Tippflächen (AP-Bezug Feinschliff, Ziele 1 und 2).

**Nachtrag 10.10.2026 (v0.73.0, live, PR #99):** «Ruhige Startseite + Fotoband» gebaut (Mockups heute-ruhig A und fotoalbum-neu A freigegeben): Gruss in einer Zeile, scharfes Foto, Fotoband am Handy, Vorschlag als schmale Zeile, kein doppeltes «Weitermachen» (AP-Bezug Startseite, Ziel 1).

**Nachtrag 10.10.2026 (v0.70.0, live, PR #98):** Velo-Blätter Teil 2 gebaut (Noah W1–W7 a): Einfahr-Plan (von selbst bei neuem Velo, Häkchen in die Pflege, Erinnerung auf Heute), Repair-Kit pro Art der Fahrt mit «Auf die Packliste …», Garantie & Belege mit Erinnerung und Kalender-Datei, Diebstahl-Blatt (AP-Bezug Velo-Pflege, Ziel 2). 0.69.1 ist live (PR #96).

**Nachtrag 10.10.2026 (v0.69.1, live, PR #96):** Vollständiger UI-Test (Gesamttest-Runde) gemacht, Befunde A–C behoben, D als Fragen an Noah; dazu die Regel «Fahrt-Typ» im Import (AP-Bezug Ziel 2, Q1). Schritt 4 der Reihenfolge in vorhaben.md ist damit als PR offen.

**Nachtrag 10.10.2026 (v0.69.0, PR offen):** Velo-Blätter sind gebaut: Mappe pro Velo mit Velo-Pass, Service-Plan, Werkstatt-Auftrag und Abhol-Check, als PDF teilen und Text kopieren, Abhol-Check schreibt Pflege-Einträge mit Startpunkt (AP-Bezug Velo-Pflege). Als Nächstes der vollständige UI-Test mit Fix-Release.

**Nachtrag 10.10.2026 (v0.68.0, PR offen):** Q1 «Jeder km zählt» ist gebaut: Fahrten-Buch pro Velo, Strava-CSV- und FIT-Import mit Regeln, Wochen-Abgleich auf Heute, Startpunkte für Teile (AP-Bezug Velo-Pflege). Als Nächstes 0.69 Velo-Blätter.

**Nachtrag 10.10.2026 (v0.67.1):** Live ist v0.67.1. Die aktuelle Reihenfolge steht in [Geplante Vorhaben](vorhaben.md) und im [Projektstand](status.md#in-arbeit): 0.68 Q1 «Jeder km zählt» (AP-Bezug Velo-Pflege), 0.69 Velo-Blätter, echte Tour, Fünf Orte 1 und 2, danach E1, D5, D2, D4/D6, E2–E4, KI-Helfer. Die Tabellen unten bleiben der Stand vom 8.10.2026.

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
| 3 | **Gesamttest Runde 2** | Derselbe grosse erfundene Datensatz und dieselben Abläufe nach 0.46 | |
| 4 | **0.47 Einkaufen, Lebenslauf, Werkstatt** | Eine Einkaufsliste für alles (eigene Läden, Monatsbudget); Lebenslauf pro Teil (Preis und Laden freiwillig, Kosten pro Einsatz, Archiv); Werkstatt-Anleitungen (allgemeine Drehmomente, Notfallkarten offline) | |
| 5 | **0.48 Design und Bedienung aus der Strategierunde 2** | Umsetzung der Antworten | Wartet auf Noahs Antworten 62–119 |
| 6 | **Später** | TalkBack-Test (tiefe Priorität), Zeitmessung | |
| 3a | **0.67.0 Übergänge Teil 1** (PR offen) | Baukasten, Hauptknopf nach Phase, Zwischenseiten Gepackt / Tour beendet / Rückblick fertig, Tour beenden mit Rückfrage und Rückgängig, Weitermachen und Vorabend auf Heute, Zurück-Taste schliesst Fenster zuerst; Wächter streng für Angefasstes | Teil 2: Touren-Übersicht, Was ist neu; D3: Menü und Stilwelten; E1: Heute neu |

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
| 2.8 | 14.10.2026 | 0.132.0 «Velo-Setup» (UC3-1–UC3-3) gebaut, Nachtrag oben |
| 3.0 | 14.10.2026 | 0.139.0 «Rechnungen ohne Gebühren» (QR1–QR9) gebaut, Nachtrag oben |
| 3.1 | 24.10.2026 | 996 Ideen eingeplant: Pakete B (Touren ohne Überraschung) → A (Ehrlicher Stand im Alltag) → C (Ruhig und persönlich) → D (Mit Freunden), nach der 332-Arbeit; B Teil 1 gebaut (0.189.0) |
| 2.9 | 14.10.2026 | 0.132.0 «Tagespaket 14.10.»: Setup, Kluge Suche, App-Wartung, Bedienung, Bezahlen vorbereiten, Kleine Apps + Handbuch in PR #151 |
| 3.0 | 14.10.2026 | 0.137.0 «Eine Zahl pro Sache» (Durchklick DK1–DK3) |
| 2.6 | 09.10.2026 | 0.66.0 «Bausteine neu + Bausteine prüfen» erledigt |

Die frühere gespeicherte Datei `2026-10-07-packgenerator-ablaufplan.md` wird als datierte Fassung dieses Gesamtplans weitergeführt. GitHub `docs/roadmap.md` ist die aktuelle Quelle. Historische Analysen und frühere Designs bleiben datierte Belege, keine parallelen Roadmaps.

**24.10.2026, v0.190.0 «Alltag im Blick»:** Sichtbar-Wächter (jede Funktion hat ihre Heimseite) und Alltag sichtbar: Heute fällig, Planen › Merken, Knöpfe in Velo-Setup und Material. Nächstes: P2 «Touren sichtbar» baut die Lücken ab. Dazu P2 «Touren sichtbar» (jtmsou 7c6b14bb: Sprung-Chips im Rückblick, Helfer direkt unter «Jetzt», Tourbild = Postkarte + Bild zum Teilen, Katalognamen wie die Knöpfe) und «Touren ohne Überraschung» Teil 2 (6ruzpm eb6e8b60: «Vorher ansehen, was sich ändert», «Nach Bedürfnis packen»; neue optionale Tour-Felder people/needs/needVariant, kein Schema-Wechsel).

**25.10.2026, v0.191.0 «Die Werkstatt, klar»:** Paket B Teil 3: Kostendach und «vorher anrufen» im Werkstattauftrag, Rückerstattung am Besuch, Übergabe nach dem Verkauf, ähnliches früheres Problem, letzter Blick an der Tür, Wohnung nach Länge der Abwesenheit, früher beendet. Nächstes: weitere Einzelideen aus Paket B, dann Paket A «Ehrlicher Stand im Alltag». Dazu «332 Use Cases» P4 «Live-Karte, Rennen und Packen sichtbar» (jtmsou 283c91e4): Sprunglinks auf Rennseite, Live-Karte vor dem Start und Packen; Wächter-Lücken 234 → 217.

**25.10.2026, v0.192.0 «Ehrlicher Stand»:** Paket A: Warten im Merken, Listen und Ziele beenden, Kündigung in Schritten, angebrochene Packungen, Kette später ölen, Zeit um einen Termin, dazu Einzelideen im Alltag und im Material. Nächstes: Paket C «Ruhig und persönlich» und Paket D «Mit Freunden» (eigene Fäden), weitere Einzelideen aus B.

**25.10.2026, v0.193.0 «Ruhig und persönlich» (996 Ideen Paket C):** neue Seite Ich › Ruhig und persönlich: weniger App wenn du willst (Arbeitsraum, Ruhige Ansicht, Erinnerungs-Budget, Nicht für mich), Experimente mit Ende, Herkunft der Werte, Briefe ans spätere Ich und Klangbriefe, Bedeutung neben Zahlen, Fähigkeiten-Karte, Teilen mit Vorschau, klare Zahlen, Assistent mit Belegen. Nächstes: Paket D «Mit Freunden».

**25.10.2026, v0.194.0 «Zusammen mit Freunden»:** Paket D Teil 1: Ich › Mit Freunden mit Freunde fragen, Leihregal und Vorlage teilen. Teil 2 (Briefkasten mit Anmeldung) wartet auf Noah.

**25.10.2026, v0.195.0 «Kleine Helfer für Tour und Velo»:** weitere Einzelideen aus Paket B: Velo abgestellt mit Schlüssel und abgenommenen Teilen, «Melden bis» pro Nacht, Hotelanfragen im Rennmodus, «Optionen vergleichen» bei den Reise-Links, Vorgeschmack einer Traumtour, Garantiefall-Entwurf.

**26.10.2026, v0.208.1 «Ganze Wörter am kleinen Handy» (war #257 als 0.200.1):** Gesamttest-Runde mit erfundenen Daten (326 Prüfungen) und Noahs echtem Backup (274 Seiten-Prüfungen, privat): acht Anzeige-Korrekturen am schmalen Handy; der Gesamttest-Helfer lädt in unter 1 s.

**25.10.2026, v0.195.1 «Einkaufsliste am Stück»:** Korrektur: am Computer behält die Zeile einer Einkaufsliste 420 px, die Knöpfe rutschen sonst unter den Namen (der Gesamttest auf main war rot, darum ging 0.191–0.195 erst damit online).

**25.10.2026, v0.199.0 «Flicken, ausprobieren, abmachen»:** letzte Einzelideen aus Paket A: Kleider reparieren statt aussortieren, Wunsch zuerst ausleihen, Ideen für ein Treffen, Geburtstag mit kleinen Schritten, Webcams mit Zweck und Aufräumrunde.

**26.10.2026, v0.220.0 «Velo-Ergänzungen»:** Velo-Ideen 1, 3, 6, 7, 8 und 12 gebaut (Kettenlehre-Prognose, Jahresrückblick, Pflege-Serie, Kalender-Wechsel, Geräusche, Saison-Checklisten).

**26.10.2026, v0.212.1 «Die heutige Tour sagt eins»:** UI-Test T1: die heutige Tour zeigt vor der Fahrt überall «Packen», nicht «Letzter Abend», «Abgeschlossen» oder «Alles wurde gebraucht».

**26.10.2026, v0.212.2 «Eine Startzeit»:** UI-Test T2: Unterwegs, «Vor der Abfahrt» und die Live-Karte nennen dieselbe Startzeit; vor dem Start nur «Losfahren».

**26.10.2026, v0.208.0 «Mehr Platz am Computer»:** UI-Ziel #14 erledigt: Touren mit mitlaufender rechter Spalte, Auswerten mit «Letzte 7 Tage» rechts, Velos mit dem Velo zuerst, Inhalt höchstens 1120 px.
**26.10.2026, v0.219.0 «Heute ruhiger» Teil 1:** keine leeren Kästen mehr auf Heute, kleine Knöpfe als Liste «Schnell öffnen», Velo-Arbeiten als runde Knöpfe. Teil 2 und 3 folgen.
**26.10.2026, v0.222.0 «Heute ruhiger» Teil 2:** doppelte Kacheln einmal von Heute weg, sie bleiben im Katalog.
**25.10.2026, v0.200.0 «Zusammen auf einer Karte»:** Gruppen-Live-Karte: Freunde per Link auf einer Karte, freiwillig teilen, Ende mit der Fahrt, spätestens nach 24 Stunden.
**25.10.2026, v0.198.0 «Kette vorausschauend»:** Idee «Kette messen mit Verlauf und Prognose» (Das Velo im Griff) gebaut: nächste Schritte der Kette auf Verschleiss, Prognose aus den eigenen Messungen, Tour-Check, Handy-Erinnerung «Kette messen».

**26.10.2026, v0.205.0 «Material, das weiss warum» (live, #259):** eigene Ansichten im Material, Grund für Favoriten, Wunsch löst Ärger, Zwiebel-Check, Inhalt getrennt vom Leergewicht, Suche fragt nach; Gruppenfahrt «Ich warte hier» und Stopps; «Namen überall» (versteckte Funktionen 142 → 111).

**26.10.2026, v0.206.0 «Fitbit-Werte mit Tag» (offen):** Heute zeigt den letzten Fitbit-Wert mit Tag, bis der von heute da ist.

**26.10.2026, v0.207.0 «Touren mit Plan B» (offen):** Strecke prüfen, Stillstehen im Zwiebel-Check, «Was hat gefehlt?» aus dem Weggelassenen, Plan B mit Auslöser, Offline-Karte mit Reserve.

**26.10.2026, v0.203.0 «Kleine Helfer unter Ich» (offen):** Einzelideen Ich 27–36: letzte Ergebnisse, Hinweis vor der Google-Anmeldung, eigene Verpflegungs-Zahlen pro Reise, «Ausgeblendet und aus», «Was davon abhängt», Backup-Ordner-Meldungen, Rundgang weiter, Kürzel-Tipps, Vorschläge nach Art, «Erledigt» auf allen Geräten.

**26.10.2026, v0.204.0 «Eine kleine Überraschung» (offen):** sieben Einzelideen aus «996 Ideen» (Bereich Heute): Überraschungsrunde, Wetter am eigenen Platz, Bewertung aufteilen, Regen bündeln, Check nach der Standzeit, Beispiele nach Interesse, «Hat sich etwas geändert?».

**26.10.2026, v0.202.0 «Planen im Zusammenhang» (vorläufig):** Einzelideen Planen 12 «Notiz-Verbindungen mit Bedeutung», 13 «Erinnerung nach einem Ereignis», 14 «Wiederherstellen mit Anhängen» gebaut. Offen als Mockup: 10 Pflanzenpass, 11 Doppelten Eingang erkennen, 15 Erinnerungskarte, 16 Mail als Vorgang. Dazu 10 «Pflanzenpass», 11 «Doppelten Eingang erkennen», 15 «Erinnerungskarte», 16 «Mail als Vorgang» (Noah 26.10. «1a 2a 3a 4a 5a»). Titel jetzt «Planen im Zusammenhang».

**26.10.2026, v0.201.0 «Sprechen, anhängen, mit Vorlage starten»:** Eingaben überall: eine gemeinsame Leiste «Hinzufügen» (Sprachnotiz, Foto, Datei, Ort, Schlagwort, Vorlagen, Schreibanreize, KI-Helfer) auf zehn Seiten, Bildkarte im Tagebuch, Tagebuch in der App-Suche (abschaltbar).

**26.10.2026, v0.209.0 «Tagelang zusammen fahren» und v0.210.0 «Deine Liste in Sicht»:** Gruppenfahrt für Events mit eigener Seite und Kontaktkarte; Noahs Wunschliste sichtbar (111 → 77 versteckte Funktionen). Im Sammel-PR mit 0.208.1.

**26.10.2026, v0.211.0 «Zwei Touren, ein Blick»:** Touren-Ideen 44, 45, 47, 49 gebaut (Touren nebeneinander, Sportart pro Tag, unklare Stellen, Grenze). Von Touren a fehlt nichts mehr.

**26.10.2026, v0.212.0 «Touren, die mitdenken»:** Touren-Ideen 50–58 gebaut (Absicht, Regel mit Ende, Geschichten, Panne-Check, Später prüfen, Ort-Notiz, Tag zum Hören, Ess-Stopps, Verbrauch).

**27.10.2026, v0.217.0 «Nichts versteckt sich mehr»:** die 20 tief versteckten Funktionen stehen auf ihrer Seite; 77 → 57 versteckt.

**27.10.2026, v0.218.0 «Platz in jeder Tasche»:** leere Taschen bleiben in «Alle Taschen nebeneinander» als Spalte zum Hineinziehen.
