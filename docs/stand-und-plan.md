# Stand und Plan: was heute geplant und offen ist

Schnappschuss vom **7. November 2026, abends**. Für Noah, in einfachem Deutsch. Der Schnappschuss ist dafür da, dass nichts verloren geht, wenn ein Thread endet. Was die App **heute kann**, steht in [App-Stand](app-stand.md). Wie sie gebaut ist: [Aufbau](aufbau.md) und [Technik-Handbuch](technik-handbuch.md). Was früher geschah und warum: [Verlauf und Entscheide](verlauf-und-entscheide.md). Was du selbst wissen und tun musst: [Noah-Wissen](noah-wissen.md).

**Wie aktuell ist diese Datei?** Sie ist ein Schnappschuss und wird beim Sonntags-Brief nachgeführt (siehe unten, «So bleibt sie aktuell»). Die echte, immer frische Liste der offenen Änderungen steht auf GitHub unter [Pull requests](https://github.com/noahdolmetsch-af/packgenerator/pulls). Wo hier etwas anders steht als dort, gilt GitHub. Eine Versionsnummer steht hier absichtlich nicht (Regel 13): die aktuelle zeigt die App unter Ich › Was ist neu.

**Wörter:** *PR* = eine Änderung, die auf GitHub wartet (Pull Request). *Label «ok»* = du hast freigegeben, der Merge-Bündler führt die Änderung zusammen, sobald die Tests grün sind. *online* = auf der echten Seite (auf `main` gemergt). *Etappe* = ein Teil des grossen Durchklickens.

---

## 1. Offene Änderungen (PRs) am Abend des 7.11.2026

Seit dem Schnappschuss vom 5.11. sind über 150 Änderungen gemergt worden. Alles, was am 5.11. noch offen war (Wetter-Stapel #924 bis #937, Gruss «Wi gahts?» A, «Jetzt dran», Tagescheck #895, «Aktiv heute» #875, Bild oben auf Heute #783, Kleidungs-Tipp #932, Zug hin #934, Fester Termin #936, Doku #935), ist **online**. Zwei alte PRs wurden **geschlossen, nicht gemergt**: #757 («Unterwegs und Velos» über «Deine Woche», du hast «verwerfen» gesagt) und #824 (Start-Grenze 5 MB, überholt). Die Liste unten hat 28 offene PRs.

### Du hast freigegeben (Label «ok»), es wartet auf grüne Tests und den Merge

| PR | Was | Hinweis |
|---|---|---|
| #1120 bis #1124 | Cardio-Belastung A, B, C, D, F: Touren des Zeitraums als Liste, Wochenbalken ab 3 Monaten, üblicher Bereich als graues Band, «Wie wird gerechnet?» mit einem echten Tag, «Am Tag davor» zählt auch Fitbit-Trainings | Reihe, nacheinander |
| #1116 | Analyse: Quelle und Touren der Zeit als Wege unter dem Titel eines Werts (A2) | |
| #1114 | Analyse: Aktivzonen pro Tag als Tagesschnitt, Velo-Kachel mit Zeitraum | |
| #1129 | Analyse: Filter-Karte nur auf Reitern, wo sie wirkt, am Handy eine Zeile | |
| #1128 | Training: Karte «Nächste Woche» mit Grund und Zielen, ab Freitag (Schritt 8) | Test e2e-part 3 hat einmal geflackert (Neustart erlaubt) |
| #1125, #1126 | Touren: vier Wege auf der Tourkarte (Packen, Wetter, Form, Rückblick); Wetter: Karte «Für deine Tour» | |
| #1131 | Packen: zuerst die Liste, der Rest in fünf Gruppen unter «Mehr zu dieser Tour» | |
| #1110 | Auswerten: Link-Karten weg, Gipfelbuch als Reiter | **Rot**, der bauende Thread arbeitet am Fix |
| #1106 | Test «Aktiv heute»: nur Kacheln mit Aktivität messen (Flake-Fix) | Nichts Sichtbares |
| #1102 | Live-Karte: Schlafplatz finden, Schritt 1 (Dächer in der Nähe, eigene Plätze) | |
| #1095, #1094, #1093 | Ausflugstipps ab 90 Minuten; Neuland-Sammlungen mit Bild, Farbton und Vorlagen; Untergrund der Anfahrt aus OpenStreetMap nachschlagen | |
| #1043 | Nebelmeer-Tage: Regal auf der Sammel-Wand mit Foto und leiser Winterzahl, «Heute merken» | |
| #1038 | Heute: «Heute laut Plan» zeigt nur, was noch offen ist | |
| #976, #973, #938 | Merken: Doppeltipp auf «Speichern» (E4-003); Planen 2b: Wochen-Abschluss am Sonntag; Tourenvorschläge: Art-Filter, Start-Filter, Zeilen wählen | Seit dem 5.11. offen |

### Wartet auf dein «ok NNN»

| PR | Was |
|---|---|
| #1132 | Auswerten: Wochenzahlen und Kalorien führen in die Analyse, neue Werte Zeit, Distanz, Höhenmeter (A1) |
| #1130 | Analyse: «Zurück zu Heute» merkt sich, woher man kam (4a) |
| #1091 | Traum der Woche: Kachel auf Heute mit Countdown und Wetter für die Tage |
| #1133 | Nichts Sichtbares: Baustein «Weiter von hier» für einen Block statt zwei Wegweiser-Reihen (Q1 vorbereitet) |
| #1134 | Nichts Sichtbares: Regel «Leere Kachel nennt die fehlende Quelle» (A3/I1 vorbereitet), noch auf keiner Seite benutzt |

Was **seit dem 2.11.** neu online ging, steht im [Verlauf](verlauf-und-entscheide.md#5-seit-dem-2-november-2026) und je PR in `docs/releases/`.

---

## 2. Alles, was geplant ist (nach Thema)

Jeder Punkt hat einen Stand: **online** (auf der echten Seite), **offen** (PR wartet), **beschlossen** (du hast ja gesagt, noch nicht gebaut), **Idee** (gesammelt, nicht entschieden). Quelle der Beschlüsse sind deine Antworten («1a 2b …») in den Threads; die Ordner `notes/…` im Projektordner enthalten die Einzelheiten.

### 2.1 Wetter: Nebelgrenze, Temperaturen nach Höhe, Nacht

- **Nebelgrenze** auf Heute und Wetterseite (#921), **Nebel auf der Tour-Route** (#933), **Morgen-Push um 07:00** mit Fahrt über dem Nebel (#937, Oktober bis Februar) und **Sonnen-Ausfahrt** (Heute schlägt bei Nebel mit Sonne darüber eine Fahrt über dem Nebel vor, #1015, mit leiser Wochenzeile #1040): alle **online**.
- **Temperaturen nach Höhe** (1000, 2000, 3000 m) auf der Wetterseite (#924), ruhige Zeile auf Heute (#929) und in «Skitour planen» (500 bis 4000 m, #931): **online**.
- **Nachttemperatur:** Karte auf der Wetterseite (#999), ruhige Zeile auf Heute (#1013) und Push um 19:00 mit Frost-Hinweis (#1026): **online**.
- **Wetter-Ausweichen:** Starkregen-Warnung und nächstes Dach auf der Live-Karte (#1045): **online**.
- **Selbst prüfen** (die Entwicklungsumgebung erreicht die Wetterquelle nicht, die Rechnung ist nur mit erfundenen Luftschichten getestet): Nullgradgrenze der Karte gegen die Wetterzeile vergleichen; an einem Nebeltag Nebelgrenze gegen eine Webcam vergleichen; Gipfel- und Ortsliste von Hand ansehen; ob Landi-Regenradar und SRF-Webcams im Fenster erscheinen. Schwellen stehen in `nebelgrenze.js`.
- **Idee, nicht gewählt:** Wind-Vorschau.

### 2.2 Routing und Navigation (Kette)

Ziel: Routen zuverlässiger, einfacher und intelligenter. Deine Antworten vom 05.11.: «1b evtl c, 2a und b, 3a, 4a, 5b».

1. **Sicherheitsnetz** (Zeitlimit 15 s, ein zweiter Versuch bei schnellem Fehler, 10 Minuten Zwischenspeicher, klare Meldungen): **online** (#928).
2. **Reserve-Kette** brouter.de → Valhalla → OSRM, je einmal pro Fehler, mit Hinweis «Reserve-Router»: **online** (#943).
3. **«Wie fährst du?»** (vier Arten zu fahren beim Neu-Planen, passend zum Velo vorgeschlagen): **online** (#1005).
4. **Belag und Schwierigkeit** (Anteil befestigt und unbefestigt, Warnung nach Art zu fahren): **online** (#1033). Weitere Ideen daraus (I2, I3) sind **beschlossen, noch nicht gebaut**.
5. **Funkloch:** die Karte «Bereit für unterwegs?» (Karte entlang der Strecke und Sprache vor dem Start) ist **online** (#1027). Notausstiege vorberechnen und evtl. eine BRouter-Android-App, die offline rechnet: **beschlossen als Richtung**, noch nicht gebaut.
- **Wege-Gedächtnis** (Stücke nach der Fahrt bewerten, schlechte beim Planen meiden): **online** (#1054).
- **Tourenvorschläge:** Seite mit fünf Pilot-Mountainbike-Touren aus SchweizMobil **online** (#926). Art-Filter, Start-Filter und «Zeilen wählen» (#938) **offen, freigegeben**. Entscheide: offene Daten, Standardfilter «mittel und schwer», kein Rennrad, erst Zürich und Graubünden, Veloland nach dem Pilot, später das ganze offizielle Netz offline nach Region.

### 2.3 Live-Navigation unterwegs

- **Online:** Fahrt speichern, Orte in der Nähe, Strecke folgt jeder Kurve, «Was brauchst du?», zurück auf die Strecke, Karte frei, Licht-Karte (#826), Kälte und Regen der nächsten 3 Stunden (#925), Router-Sicherheitsnetz (#928), Kleidungs-Tipp pro Stunde (#932), Sonne oder Mond pro Stunde (#971), «Bereit für unterwegs?» (#1027), Wetter-Ausweichen (#1045), Wege-Gedächtnis (#1054).
- **Offen:** Schlafplatz finden, Schritt 1 (#1102, freigegeben). Weitere Schritte dazu: **Extra-Runde** mit dir, noch nicht geklärt.
- **Beschlossen, noch nicht gebaut:**
  - **Pausen-Planer** (drei Vorschläge zur Auswahl, auch Läden mit Essen, nur auf Knopfdruck «Rast suchen»).
  - **Ankunfts-Bericht** (in der Nachbereitung und in der Live-Karte nach der Ankunft: Zeiten, Stopps, Pausenlänge gegen Plan, Akku- und Licht-Verbrauch).
  - Lampenstufen mit Verbrauch und Leuchtdauer; Handy-Akku mit Restlaufzeit.
- **Gewünscht aus dem Ultra-Rennen** (Vorhaben 6): Teile davon liegen jetzt als Schrittarten in «Weg zum Ziel» (Rennplanung, Nachtplan, GPS-Tracker, Velo bereit, Packen testen, Verpflegung testen, Trainingsfortschritt, alle **online**). Noch nicht gebaut: Soll-Setup, Werkzeug passend zum Velo, laufende Auswertung der letzten 3, 6 und 9 Stunden, Wetter für 2 bis 8 Stunden entlang der Route, drei Ziel-Stufen, Nacht-Blatt, letzter offener Laden vor der Nacht.

### 2.4 Heute, Tagescheck und «Jetzt dran»

- **Gruss «Wi gahts?»:** alle vier Teile **online**: A mehr Knöpfe und sofort speichern (#912), B Knöpfe anpassen (#1047), C Wetter im Kopf und «Letzte 7 Tage» (#1049), D «Woran liegt's?» und «Wie war's?» am Abend (#1055). **Beschlossen, noch offen:** Nachtträume, Wechsel-Varianten, Verbindungen (Ziele, To-dos, Freunde, Meilensteine, Aktivitäten), monatlich Visionen und Lebensträume. Frage 6 «Worauf freust du dich?» ist am Start aus («6 an» sagen).
- **Tagescheck als ein Fragebogen:** Teile 1 bis 4 **online**; Tippen liest weniger neu (#895, online).
- **Jetzt dran:** nur Dringendes (#913), «Später» und «Zeilen wählen» (#915), Backup-Zeile kurz (#911), keine leeren Notizen (#908): alle **online**. «Heute laut Plan» zeigt nur, was noch offen ist (#1038): **offen, freigegeben**.
- **Bild oben auf Heute** (#783) und **ein starker Knopf pro Karte** (#1090): **online**. «Aktiv heute» ohne doppelte Gewohnheiten (#875): **online**.
- **Neu auf Heute (online):** Kachel «Spruch» (#1060, mehr Quellen und Zitate #1105), Körperwerte mit letztem Wert und «Jetzt holen» (#1061), «Schnell öffnen» schlägt eine Seite zum Anpinnen vor (#980), Letzte 12 Monate zum Antippen (#1100), Fester Termin für Stammkunden (#936).
- **Beschlossen, nicht gebaut:** Spruch PR 3 (wartet auf dein «bau spruch pr3»). **Offen:** Traum der Woche (#1091, wartet auf «ok 1091»).

### 2.5 Aktiv, Auswerten, Analyse, Training, Lernen

- **Aktiv:** eigene Wochenziele mit Balken (#977), Ruhetag-Hinweis nach drei harten Tagen (#965), Rückblick Meditation und Training zum Antippen (#1083), «Meine Sportarten» heisst «Meine Aktivitäten» (#993): **online**.
- **Auswerten:** ein Zeitraum-Schalter für alle Gruppen (#941), «Im Fokus» ohne leere Sportarten (#1104): **online**. Link-Karten weg und Gipfelbuch als Reiter (#1110): **offen, rot**. Wochenzahlen führen in die Analyse (#1132): wartet auf «ok 1132». Deine Antworten «3 ja, 6 ja» zu den Analyse-Punkten sind aufgenommen.
- **Analyse:** schneller geöffnet (#948). **Offen:** Wege unter dem Titel eines Werts (#1116), Aktivzonen als Tagesschnitt (#1114), Filter-Karte nur wo sie wirkt (#1129), «Zurück zu Heute» (#1130, wartet auf «ok 1130»). **Cardio-Belastung** A bis F: Wochentag-Balken, Tour-Namen und lesbare Karten sind **online** (#1127), A bis D und F (#1120 bis #1124) **offen, freigegeben**.
- **Zahlen mit Weg:** Bausteine für antippbare Zahlen und die Quelle-Zeile (#1109), Velo-Zahlen führen weiter (#1118), Rückblick-Tempo zum Antippen (#1119), Eigene Messwerte zum Antippen (#1044): **online**. Die Regel «Leere Kachel nennt die fehlende Quelle» (#1134) und «Weiter von hier» (#1133) sind Vorbereitungen ohne sichtbare Änderung (warten auf dein «ok»).
- **Training** (Wochenpläne, 8 Schritte): Heute passt (#1088), Verpasst? Verschieben (#1096), Wochenlast-Wächter und Entlastungswoche (#1099), Einheiten-Bibliothek (#1113): **online**. Schritt 8 «Nächste Woche» (#1128): **offen, freigegeben**.
- **Persönliches Lernen:** alle sechs Ideen **online**. **Fragen aus deinen Daten:** Stufe 2 und Stufe 3 (To-Dos #956, Eigene Regeln #1011) **online**.
- **Sieben Cockpit-Ideen** (03.11., «werden alle gebaut»): Signale zuerst (Idee 3, dann 5 zusammen mit Aktiv/Auswerten), Fragen (7) und Versuche (6), Ghost (4), Belastung (1, 2). Grenzen: das Wetter gibt es nur als Tageswert am Wohnort, es werden keine Rohdaten-Ströme gespeichert (also kein Live-Ghost), Ruhepuls, HRV und Schlaf sind nicht vorhersagbar. **Stand je Idee in den Threads prüfen.**

### 2.6 Entdecken, Sammeln, Träume, Neuland

- **Träume und Neuland online:** N6 Feierabend-Biwak (#920), N7 Zug hin, Velo heim (#934), N8 Passt jetzt (#900), N9 Sonnenaufgang auf dem Hügel (#994), N10 Eine Fundliste (#1048), N12 Ein Abenteuer im Monat (#1042), N18 Türme, Brücken, Wasserfälle aus OpenStreetMap (#1046), N19 Abenteuer-Würfel (#1034); dazu Reise-Wünsche mit Jahreszeit (#974), Kompass-Träume und Reise-Wünsche an einem Ort (#1080), «Wege hierher» in Neuland (#1087). **Offen:** Untergrund der Anfahrt (#1093), Sammlungen mit Bild und Farbton (#1094). Den genauen Stand je Schritt zeigt `docs/releases/` und die Seite «Neu seit gestern».
- **Sammlungen:** als Seite teilen, drucken, mit einer Tour verknüpfen (#962) und eine geteilte Sammlung mit einem Tippen übernehmen (#1103): **online**.
- **Entdecken und Sammeln** (sechs Ideen, 04.11.): Die **Sammel-Wand** (Stempel, Pässe, Gipfel, Neuland, Sterne auf einer Seite, #940) ist **online**; das Nebelmeer-Regal dazu ist **offen** (#1043). Übrig sind Wege zum selben Ziel, Challenges nach Gelegenheit, Touren als Geschichten und die Entdeckerkarte; die Reihenfolge war: erst «Warum zählt das?», dann **eine** Pass-Regel. Stand: **in der Fragerunde**, Antworten von dir ausstehend.
- **Idee für später:** Pass-Sprint (kleines Spiel, H5 im Geheimmenü).

### 2.7 Bewegung, Schmunzeln, Geheimmenü (die 30 Ideen vom 03.11.)

- **Paket A** Seitenwechsel, **Paket B** Packen fühlt sich echt an, **Paket C** Velo lebt, **Paket D** Laden, leere Seiten, Wetter (**online** am 04.11.), **Paket E** Touren als Sammlung und **Paket G** Heute (Landschaftsbild #783, danach der starke Knopf #1090): laut der Doku-Änderung #1107 **gebaut**; **Paket F** Schmunzel-Ideen (Velo im Logo online; Jahreszeit, Nussgipfel-Rechner, Mundart-Wetter, Murmeltier gewählt bzw. online). Dein Satz: «Je Paket ein Bau-Thread, je Idee ein kleiner PR.» Den Stand je Idee zeigt `docs/vorhaben-liste.md`.
- **Geheimmenü hinter fünfmal «PG»:** H1 Kuhglocken (Ton nur mit Schalter), H2 Murmeltier, H6 Velo-Weisheit, H7 Alpenpanorama, H8 Platten, H9 Logo-Wetter: alle **online**. H3, H4, H10, H11 nicht gewählt. H5 Pass-Sprint nur Idee.
- **Neuer Schwung 2** (05.11., Ideen A bis G, nicht zu verwechseln mit den Paketen A bis G oben): als Liste in der Vorhaben-Liste gespeichert (#935, online). A Tempo-Runde und B Beschlossenes ausliefern laufen (Tempo-Runde 4 und 5 sind online: #961, #955, #950, #948, #1009); F Sammel-Wand ist online (siehe 2.6), G Rückwärts-Plan ist «Weg zum Ziel» (siehe 2.9). **C** Nutzungs-Spiegel und «Zuletzt» (Teil davon: «Zuletzt geöffnet» in der Suche, #975, online), **D** Winter-Seite, **E** Jahresrückblick zum Teilen sind **Ideen für später**.
- **Neuer Schwung 1** (26.10., Stil «Kacheln mit Tiefe», Bewegung überall sanft): Schritte 1 und 2 gebaut; die Schritte 3 bis 11 stehen in `docs/vorhaben-liste.md`.

### 2.8 Tennis und Angebote (Tennislehrer-Journey)

- **Online:** Anfrage, Rechnung zur Buchung, Sammelrechnung, Kundenliste, späte Absage, Barzahlung, Regen-Absage mit Ersatzzeiten, Stundenkarte, Abo (fester Monatspreis), Warteliste mit Heute-Hinweis (#919), Gruppenstunden (#906), **Fester Termin für Stammkunden** (#936), **Gutscheine** (#1004), **ein Ort «Tennis»** mit den Tabs Angebote und Kunden (`#/me/tennis`, #1086).
- **Beschlossen, in dieser Reihenfolge:** Erinnerungen, Probestunde, automatische Erinnerungs-Mail (nur vorbereitet). Die Zahlart Überweisung neben TWINT, Bank-QR und Bar: Stand im Thread prüfen.
- **Flyer** (05.11.): Bereich «Tennis» (A) ist mit `#/me/tennis` **online**. Beschlossen: Flyer auf Deutsch 16:9 (B), A4, Quadrat und Englisch (C), Stufen und Art, Flyer pro Stufe (D), Anmeldeseite mit QR-Code (E), Bestätigungs-Mail (F), Teilnehmerliste mit Anmeldeschluss und Warteliste (G). Das Mockup hast du freigegeben; jeder Teil bekommt sein eigenes «ok». Vorlagen und Fotos bleiben privat.
- **Spielerplus-Kalender:** Team-Termine aus dem Kalender-Link in Woche, Heute und auf der Sportseite (#1002, **online**). Der Link enthält einen geheimen Schlüssel und steht nie im Repo oder Chat.
- **Hinweis:** Wenn `api/` sich ändert, den Server «packgen» von Hand neu bereitstellen und auf READY prüfen.

### 2.9 Wegweiser, Alles hier, Auffindbarkeit, Weg zum Ziel

- **Versteckte Funktionen:** alle neun Schritte **online**. **Wegweiser statt Katalog** (26 PRs): Teil A (Absprünge), Teil B (Inhalte pro Bereich), Teil C. Den Stand zeigt `docs/vorhaben.md` Nr. 17.
- **Verlust-Wächter** (#1111, **online**): ein Test auf jedem PR wird rot, wenn beim Vereinfachen eine Funktion verloren geht oder nicht mehr auffindbar ist. Geplante Folgearbeit aus dem Vereinfachen: «Weiter von hier» (#1133) und «Leere Kachel nennt die fehlende Quelle» (#1134), beides vorbereitet, wartet auf dein «ok».
- **Weg zum Ziel** (`#/trips/weg`, Rückwärts-Plan zum grossen Ziel): Gerüst (#1050), die Seite unter Touren (#1070), die Seite als eine Linie mit Punkten, Bearbeiten hinter «…» (#1117, Entwurf G1) und Schrittarten, die sich selbst anmelden (#1098): **online**. Schrittarten online: Rennplanung, Organisation, Probefahrten 50, 100, 200 km, Erholung, Velo bereit, Trainingsfortschritt, Verpflegung testen, Nachtplan, Packen testen, GPS-Tracker.
- **Umsetzungs-Prüfung** (du hast «a» gesagt am 07.11.): eine Plan-Datei `docs/plan-ganze-app.md` mit Wächter-Test (rot, wenn ein «online»-Schritt seinen Weg verliert), nach jedem Merge eine Zeile «Plan: X von Y online» und ein Abnahme-Bericht pro Schritt. **Noch nicht auf GitHub** (kein offener PR dazu gefunden); der PR ist im Thread «Tour A–Z / Datencenter» angekündigt.
- **Schritt 0 und danach** (du hast am 07.11. entschieden): «Tour-Stand» und «Meine Datenquellen» als zwei PRs; danach Pfad-Baustein auf der Linie von «Weg zum Ziel», «Meine Tour» auf Heute, Ort-Vorlage Velos (mit den 5 Gruppen wie in Packen, #1131) und der Datencenter-Reiter «Fragen». Je ein Bau-Thread, sobald der Vorgänger online ist. Alles **beschlossen, noch nicht gebaut**.

### 2.10 Das grosse Durchklicken (Etappen)

Beschlossen am 05.11. («1b 2b 3a»): sechs Etappen nacheinander plus Schlussbericht. Fehler mit gleicher Ursache werden ein PR, höchstens fünf offen. Der Prompt liegt unter `prompts/frontend-durchklick/` im Projektordner, geändert wird nur die Zeile `ETAPPE = N`.

| Etappe | Bereich | Stand |
|---|---|---|
| 1 | Heute und Ich | **fertig**, Fehler behoben, Wächter «jeder Text hat Deutsch» (#907) |
| 2 | Touren und Packen, Material | **fertig**, Fehler behoben (zuletzt Fragen 1a bis 5a: #944, #947, #949, #953, #959, #1001) |
| 3 | Unterwegs und Wetter | **Stand im Thread prüfen** (am 05.11. wartete sie auf dein «ok Bericht 2»; ein Fix «Unterwegs ohne Tour» ist online, #1012) |
| 4 | Velos und Alltag | Fehler-PRs **online** (E4-001, -002, -004, -005, Doppeltipp-Schutz #1017, «Velos zuerst» #1018, Velokarte #1016); #976 (E4-003, Merken) **offen** |
| 5 | Aktiv und Auswerten | Fehler-PRs **online** (E5-001 bis E5-005, Fragen 1a bis 3a: #1021, #1023, #1024) |
| 6 | Querschnitt (320 px, hell und dunkel, Deutsch und Englisch, lange Wörter) | Fehler-PRs **online** (zum Beispiel E6-001 bis E6-010 und E6-012, «Zum Inhalt springen» #1010, Notizen behalten Text #1019) |
| 7 | Schlussbericht: verbessern, Stärken, Design-Vorschläge | **Stand im Thread prüfen** |

Verworfen (du am 05.11.): ein Wächter gegen doppelte Klassennamen und eine Meldung bei «1,5» im Gewichtsfeld. Befunde mit echten Daten bleiben im privaten Ordner.

### 2.11 Tempo, Start-Grösse, Tests

- **Start-JavaScript:** Grenze 5,0 MB (Warnung bei 90 %); am 05.11. etwa 3,4 MB. Die Kern-Grenze von 3 MB für eine einzelne Datei gilt weiter.
- **Tempo-Runden:** Material-Suche (#886), Tagescheck (#895), «Meine Sportarten» (#910), Analyse (#948), Neuland (#950), Meilensteine (#955), Bausteine (#961), Wächter Seitengrösse (#1009): alle **online**. Schwere Reiter (Träume etwa 0,8 s, Pflege etwa 1,2 s) sind vor allem Browser-Aufbau, keine eigenen PRs.
- **Tests und CI:** Handy-Tests laufen erst nach dem Label «ok», nur für die Seiten, die der PR berührt (#979), Schlangen-Ampel (#992). Der Handy-Teil darf 50 statt 35 Minuten laufen (#1058). Bekannte Flakes: Analyse-Test Zeile 58 (Fix #1106 offen), PF12, mailin, minitools, Tagebuch-Erinnerung, e2e-part 3. Ein Neustart pro PR bei einem Flake ist erlaubt; neuer Push bricht einen laufenden Lauf ab; ein Lauf dauert 40 bis 60 Minuten, der Deploy 4 bis 10. Nacht-Roboter «Langes Wort» (#1031) prüft jede Nacht die Seitenbreite. Ablauf im [Technik-Handbuch](technik-handbuch.md#6-tests-und-ci).

### 2.12 Weitere Vorhaben mit Stand «beschlossen» oder «Idee»

Die vollständige Liste mit Ziel, Grösse und Nutzen steht in [Alle Vorhaben](vorhaben-liste.md) (nach den sechs Zielen geordnet) und in [Geplante Vorhaben](vorhaben.md) (mit Warum und Beispiel). Beide gelten für Einzelheiten; **diese Datei ist der aktuelle Überblick**.

### 2.13 Bewusst nicht

Foto-KI für Material, Live-Sync über Drive, fremde Einbettungen (nur Links), Privat-Zone beim Teilen, Inhalte anderer Nutzer, native App, Cloudflare, Google-Maps-Kacheln, Sturzerkennung, App verkaufen, Vercel-Kommentarleiste. Rennrad-Profil bei den Tourenvorschlägen. Mehr dazu und die Gründe: [Verlauf und Entscheide](verlauf-und-entscheide.md#6-abgelehnte-und-gestrichene-ideen).

---

## 3. Was auf dich wartet (höchstens die wichtigsten)

1. **«ok 1132» und «ok 1130»** (Analyse A1 und «Zurück zu Heute»), danach bei Bedarf «ok 1091», «ok 1133», «ok 1134».
2. **Antworten auf offene Fragen:** Schlafplatz «Extra-Runde» (Live-Karte), «bau spruch pr3» (Spruch PR 3), Entdecken und Sammeln (Fragerunde).
3. Nach den Wetter-Merges: **auf der echten Seite prüfen** (Landi und SRF im Fenster, Nullgradgrenze, Nebel gegen Webcam).

Alles Weitere: [Noah-Wissen](noah-wissen.md).

## 4. So bleibt sie aktuell

- Jeder PR schreibt **nur seine eigene Release-Datei** (`docs/releases/<name>.md`) und, wenn eine neue Funktion dazukommt, seine Zeile in `docs/app-stand.md`. So ändern zwei PRs nie dieselbe Zeile.
- **Diese Datei** führt der Sonntags-Brief nach (offene PRs von GitHub, Beschlüsse aus den Threads). Er ändert nur, was sich geändert hat, und löscht Erledigtes.
- Wer sie anfasst, prüft zuerst auf GitHub, ob ein Punkt noch offen ist, und schreibt keine Versionsnummer und keine privaten Daten hinein.
