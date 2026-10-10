# Arbeitspakete aus der Strategie (Runden 1 und 2)

Stand 9.10.2026. Noah hat alle 119 Fragen im Strategie-Dokument «Pack Generator: Strategie, Design und Nutzen» beantwortet (Runde 2: alle a). Daraus folgen die Pakete unten. Die Fragenummern stehen jeweils in Klammern.

Reihenfolge laut Strategie (57): **Design, dann Im Flow (Aktiv), dann Strava und Server, dann Neuland.** Vor jedem Paket kommt ein Design-Audit mit Mockups ([Regel](design-audit.md)); die Korrekturen erscheinen zuerst als Design-Release. Das Tempo bleibt wie bisher (56b). Echte Nutzung ist der Taktgeber: Eine grössere Version kommt erst, wenn die letzte einmal im Alltag oder auf einer Tour benutzt wurde (58).

## Bereits in Arbeit

| Version | Paket | Inhalt |
|---|---|---|
| 0.45.1 | Gesamttest Runde 1 behoben | Fehler G001–G015 |
| 0.46 | Startseite neu | Gruss mit Wetter (47, 114–116), Tourkarte, «Was willst du tun?», Heute wichtig, Dunkelmodus, Farbwelt Gletscher |

## Design (zuerst)

| Paket | Inhalt | Fragen |
|---|---|---|
| **D1 Design-Release 1 «Aufpimpen»** | Audit Runde 1: Kleiderschrank, Material, Tour, Velos neu in Gletscher; Dunkelmodus auf allen Seiten und Dialogen; einfarbige Symbole; Karten statt Tabellen am Handy; grosse Zahlen; sanfte Bewegung; Stilblatt | 16–22, 66, 67, 71 |
| **D2 Einkaufszettel, Lebenslauf, Werkstatt** | wie geplant (Im Flow Runde 5), mit eigenem Mockup vorher | — |
| **D3 Navigation «Basecamp»** | Name Basecamp für das Ganze, «Pack Generator» heisst die Welt Unterwegs (119); untere Leiste Heute · Unterwegs · Aktiv · Neuland · Mehr; Akzentfarbe pro Welt; ein Plus je Welt; Suche in der aktuellen Welt; am Computer linke Seitenleiste; Tastenkürzel mit Hilfe-Seite | 6–10, 62, 64, 119 |
| **D4 Computer als Werkzeug** | Material als Tabelle mit wählbaren Spalten, Sortierung und Vorschau-Seitenleiste; Teil-Formular neben der Liste; Packen mit Liste, Skizze und Gewichtsverteilung nebeneinander plus Vergleich mit der letzten Tour; Pflege-Verlauf mit Kosten pro 1000 km und Lebensdauer-Diagramm; Rückblick mit Diagrammen und Export | 53, 63, 72, P1–P7 |
| **D5 Packen: vorschlagen und bestätigen** | Neue Tour startet mit fertiger Liste aus ähnlichen Touren, Wetter und Kits, selbst zusammenstellen bleibt; Ansichten nach Tasche, Art, Temperatur, Kits, Vorlagen; Velo-Skizze zuerst; eine Gewichtszahl; Packtag gross mit «Bereit für …»; Foto der Taschen; «Wie letztes Mal» überall; Wischen überall gleich | 26, 28, 29–34, 109 |
| **D6 Lernen sichtbar und Kennzahlen** | Seite «Was die App gelernt hat» mit «stimmt nicht»; «warum» bei Vorschlägen; vorher/nachher; Learnings zur richtigen Zeit; ein Satz nach dem Rückblick; «Heute vor einem Jahr» oder ein Rennen oder Neuland; Monatskarte mit Kennzahlen und 3 freiwilligen Rückblick-Fragen; Jahres-Brief im Dezember | 35–39, 48, 108, 110, 117, 118 |

## Im Flow (Aktiv)

Die Stufen 1–9 sind im Aktiv-Dokument geplant. Aus der Strategie kommen dazu:

- **Stufe 1:** Tageskreis als Startseite, Meditation im Vollbild mit Gong, 10 Sekunden Stille mit Zitat (40, 41, 111).
- **Stufe 5:** Kalender über alle Welten mit Filter, Woche am Handy, Monat am Computer, Jahresraster (45, 104); Wochenzeile auf Heute (44); Karte «Deine Woche» mit Foto (113).
- **Stufe 6:** **Stufen-Heft** über alle Welten. Es hat Pfade mit 7 Stufen; jede Stufe gibt einen Stempel mit Datum, Satz und Foto. Ein Heft pro Jahr, eigene Meilensteine mit Regel, alle Pack-Pfade (Leichter Packer, Nichts vergessen, Pfleger, Lernender, Allwetter, Mehrtages, Ultra), «Nächster Stempel» auf Heute, Stempel-Moment mit leisem Klang (43, 95–99, 112).

## Server und Anbindungen (Vercel)

| Paket | Inhalt | Fragen |
|---|---|---|
| **S1 Grundlage, Strava und Abgleich** | Vercel-Server; Strava automatisch (Garmin kommt mit); Abgleich Handy und Computer ohne Backup-Datei; automatisches Backup; «Am Computer weitermachen» | 51, 65, 75, 80, 85 |
| **S2 Erinnerungen** | Push mit Ein-Tap-Antwort; Unwetter-, Hitze- und Nullgrad-Warnungen; Zitat des Tages | 25, 78, 86, 94 |
| **S3 Fitbit und Kalender** | Fitbit/Google Health: Ruhepuls, HRV, Schlaf, nur als Beobachtung; Google Kalender in beide Richtungen; freie Wochenenden als Vorschlag | 76, 77, 105 |
| **S4 KI-Helfer** | «Pack mir eine 3-Tage-Tour für 5 °C», Learnings aus Notizen, Rückblick schreiben | 87 |
| **S5 Kleine Anbindungen** | Teilen-Seite, Spotify/YouTube-Knöpfe, Wikipedia/OSM-Kurztexte, Sonnen- und Mondkalender, Veloladen-Bestellung, E-Mail an die App, Preis-Wächter, Komoot/Ride with GPS, SBB, Drive-Backup | 79, 81–84, 89–93 |

### Anreise und Karten: zuerst einfach, dann mehr (Noah, 9.10.2026)

Noah: «zuerst einfach, dann mehr integrieren, ungefähr mit der Strava-Integrierung».

- **Stufe 1 «Links» (eigenes kleines Paket, ohne Server, kostenlos):** Knöpfe mit vorausgefülltem Ziel und Datum, die die andere App öffnen. SBB.ch (Verbindung), Google Maps (Anreise mit dem Auto), swisstopo bzw. OpenStreetMap (Startort auf der Karte), Kalender-Datei (.ics) für die Tour.
- **Stufe 2 «Mehr» (zusammen mit S1 Strava und Server):** Verbindungen direkt in der App (offene Fahrplan-Daten, z. B. transport.opendata.ch); GPX-Route auf einer Karte (swisstopo- oder OSM-Kacheln); Import von Google-My-Maps-Exporten (KML/KMZ); Komoot/Ride with GPS.
- Kein Google-Maps-Einbau mit API-Schlüssel (braucht ein Abrechnungskonto); Google Maps nur als Link.
- Wie jedes Paket: zuerst Mockups und a/b-Fragen ([Arbeitsweise](arbeitsweise.md)).
- Reihenfolge (Noah, 9.10.2026): zuerst der KI-Helfer (aus S4, jetzt mit Mockups planen), danach Stufe 1 «Links».

## Neuland

**N1 Neuland mit Rennen.** Enthält:
- Schweiz-Karte mit «weissen Flecken»;
- Pässe und Gipfel in Velodistanz, die noch in keiner GPX-Fahrt vorkommen;
- eine Liste nach Aufwand;
- eine Bucket-List zum Teilen, vorgemerkt;
- einen Rennkalender mit Fokus Europa, mit Merken und Anmeldeschluss-Hinweis;
- «Aus Rennen planen» als Event-Tour;
- das Stufen-Heft «Ultra».

Fragen 42, 88, 100–103, 106–108.

## Bewusst nicht

- Native App: die Web-App bleibt (54).
- Konten für andere: Teilen bleibt einseitig, Freunde vielleicht später (59).
