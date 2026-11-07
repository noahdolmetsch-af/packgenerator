# Stand und Plan: was heute geplant und offen ist

Schnappschuss vom **5. November 2026, abends**. Für Noah, in einfachem Deutsch. Der Schnappschuss ist dafür da, dass nichts verloren geht, wenn ein Thread endet. Was die App **heute kann**, steht in [App-Stand](app-stand.md). Wie sie gebaut ist: [Aufbau](aufbau.md) und [Technik-Handbuch](technik-handbuch.md). Was früher geschah und warum: [Verlauf und Entscheide](verlauf-und-entscheide.md). Was du selbst wissen und tun musst: [Noah-Wissen](noah-wissen.md).

**Wie aktuell ist diese Datei?** Sie ist ein Schnappschuss und wird beim Sonntags-Brief nachgeführt (siehe unten, «So bleibt sie aktuell»). Die echte, immer frische Liste der offenen Änderungen steht auf GitHub unter [Pull requests](https://github.com/noahdolmetsch-af/packgenerator/pulls). Wo hier etwas anders steht als dort, gilt GitHub. Eine Versionsnummer steht hier absichtlich nicht (Regel 13): die aktuelle zeigt die App unter Ich › Was ist neu.

**Wörter:** *PR* = eine Änderung, die auf GitHub wartet (Pull Request). *Label «ok»* = du hast freigegeben, der Merge-Bündler führt die Änderung zusammen, sobald die Tests grün sind. *online* = auf der echten Seite. *Etappe* = ein Teil des grossen Durchklickens.

---

## 1. Offene Änderungen (PRs) am Abend des 5.11.2026

### Du hast freigegeben, es wartet nur noch auf den Merge (Label «ok»)

| PR | Was | Hinweis |
|---|---|---|
| #924 | Temperaturen nach Höhe auf der Wetterseite (1000, 2000, 3000 m, Orte und Gipfel wählbar) | Zuerst mergen. Baut auf der Nebelgrenze (#921, online) auf |
| #929 | Heute: ruhige Zeile «Temperaturen nach Höhe» | Nach #924 |
| #931 | «Skitour planen»: Temperaturen von 500 bis 4000 m | Nach #929 |
| #933 | Nebel auf der Tour-Route: Zeile im Tourwetter und Nebelband im Höhenprofil | Unabhängig |
| #937 | Nebelgrenze am Morgen: Push um 07:00 (Oktober bis Februar) | Ändert `api/`: nach dem Merge den Server «packgen» auf READY prüfen |
| #912 | Gruss «Wi gahts?» A: mehr Knöpfe, sofort speichern, gestern markiert | Erster von vier Teilen des Gruss-Ausbaus |
| #911 | Jetzt dran: Backup-Ordner-Zeile kurz, Tipp hinter «Mehr» | |
| #908 | Keine leeren Notizen mehr («Werkstatt-Quittung:» ohne Text) | |
| #895 | Tagescheck: ein Tippen liest weniger neu (schneller) | Ersetzt den geschlossenen #889 |
| #875 | Heute: «Aktiv heute» zeigt nicht nochmals, was oben als Gewohnheit steht | |
| #783 | Bild oben auf Heute: gezeichnete Landschaft mit nächster Tour und Countdown | Seit 03.11. offen; wegen Konflikten wohl neu aufzusetzen |

### Wartet auf dein «ok NNN»

| PR | Was |
|---|---|
| #932 | Live: Kleidungs-Tipp pro Stunde in «Nächste 3 Stunden» |
| #934 | «Zug hin, Velo heim» (Träume und Neuland N7) |
| #936 | Fester Termin für Stammkunden, Heute schlägt die freie Zeit vor |
| #935 | Nur Doku: «Neuer Schwung 2», Ideen A bis G in der Vorhaben-Liste gespeichert |

### Alt und zu klären (nur auf dein «schliessen NNN»)

- **#757** (Heute: «Unterwegs und Velos» über «Deine Woche»): du hast am 03.11. «verwerfen» geschrieben; der PR ist noch offen.
- **#824** (Start-Grenze auf 5,0 MB): wohl überholt. Der Start wurde inzwischen durch #864, #869 und #882 kleiner gemacht (etwa 3,4 MB, rund 73 % der Grenze von 5,0 MB).

Was **seit dem 2.11.** neu online ging, steht im [Verlauf](verlauf-und-entscheide.md#5-seit-dem-2-november-2026).

---

## 2. Alles, was geplant ist (nach Thema)

Jeder Punkt hat einen Stand: **online** (auf der echten Seite), **offen** (PR wartet), **beschlossen** (du hast ja gesagt, noch nicht gebaut), **Idee** (gesammelt, nicht entschieden). Quelle der Beschlüsse sind deine Antworten («1a 2b …») in den Threads; die Ordner `notes/…` im Projektordner enthalten die Einzelheiten.

### 2.1 Wetter: Nebelgrenze, Temperaturen nach Höhe

- **Nebelgrenze** auf Heute und Wetterseite, immer sichtbar (auch «kein Nebel»): **online** (#921). Rechnung in `src/lib/wetter/profil.js` (eine gemeinsame Abfrage der Luftschichten, 3 Stunden zwischengespeichert) und `nebelgrenze.js`.
- **Nebel auf der Tour-Route** (#933) und **Morgen-Push mit Fahrt über dem Nebel** (#937): **offen**.
- **Temperaturen nach Höhe** als Stapel: Wetterseite (#924), Heute (#929), Skitour planen (#931): **offen, freigegeben**, Reihenfolge wie in der Tabelle.
- **Nach dem Merge selbst prüfen** (die Entwicklungsumgebung erreicht die Wetterquelle nicht, die Rechnung ist nur mit erfundenen Luftschichten getestet): Nullgradgrenze der Karte gegen die Wetterzeile vergleichen; an einem Nebeltag Nebelgrenze gegen eine Webcam vergleichen; Gipfel- und Ortsliste von Hand ansehen. Schwellen stehen in `nebelgrenze.js` und lassen sich dort anpassen.
- **Wetterseite neu** (Landi-Regenradar im Fenster, Regenstreifen, SRF-Webcams, Licht für die Fahrt, Gewitter mit Uhrzeit, Reiter): **online**. Offen nur deine Prüfung, ob Landi und SRF im Fenster erscheinen (das sieht man nur auf der echten Seite).
- **Idee, nicht gewählt:** Wind-Vorschau.

### 2.2 Routing und Navigation (Kette)

Ziel: Routen zuverlässiger, einfacher und intelligenter. Gemessen gegen brouter.de, zweiter und dritter Router getestet. Deine Antworten vom 05.11.: «1b evtl c, 2a und b, 3a, 4a, 5b».

1. **Sicherheitsnetz** (Zeitlimit 15 s, ein zweiter Versuch nur bei schnellem Fehler, 10 Minuten Zwischenspeicher, klare Meldungen, Hinweis zum Standort): **online** (#928).
2. **Reserve-Kette:** brouter.de → Valhalla → OpenStreetMap-Router (OSRM), je einmal pro Fehler, mit Hinweis «Reserve-Router»: **beschlossen**, als nächster kleiner PR.
3. **Profile «Wie fährst du?»** (Auswahl statt der zwei festen Profile): **beschlossen**.
4. **Intelligenz zuerst beim Belag** (Strassenart und Untergrund aus den Weg-Angaben von BRouter, die die App heute nicht liest): **beschlossen**, danach weitere Ideen (I2, I3).
5. **Funkloch:** Notausstiege vorberechnen, evtl. BRouter-Android-App, die offline rechnet (erst ein kleiner Test): **beschlossen als Richtung**, noch nicht gebaut.
- **Tourenvorschläge** (eigener Thread, keine eigene Routing-Schicht): Seite mit fünf Pilot-Mountainbike-Touren aus SchweizMobil **online** (#926). Entscheide: offene Daten, Standardfilter «mittel und schwer», kein Rennrad, erst Zürich und Graubünden, Veloland nach dem Pilot, später das ganze offizielle Netz offline nach Region. Offen: Antworten zur grauen Gruppe, zur Dauer aus «Eigenes Tempo» und zum Umfang des nächsten PR.

### 2.3 Live-Navigation unterwegs

- **Online:** Fahrt speichern, Orte in der Nähe, Strecke folgt jeder Kurve, «Was brauchst du?», zurück auf die Strecke, Karte frei, Licht-Karte (#826), Kälte und Regen der nächsten 3 Stunden (#925), Router-Sicherheitsnetz (#928).
- **Offen:** Kleidungs-Tipp pro Stunde (#932).
- **Beschlossen:**
  - «Bereit für unterwegs?» (Offline-Check); das Design hast du am 05.11. mit «ok bereit-unterwegs» freigegeben, der PR folgt.
  - **Pausen-Planer** (drei Vorschläge zur Auswahl, auch Läden mit Essen, nur auf Knopfdruck «Rast suchen»).
  - **Ankunfts-Bericht** (in der Nachbereitung und in der Live-Karte nach der Ankunft: Zeiten, Stopps, Pausenlänge gegen Plan, Akku- und Licht-Verbrauch, möglichst alle Daten, die die App sonst auswertet).
  - Lampenstufen mit Verbrauch und Leuchtdauer; Handy-Akku mit Restlaufzeit.
- **Gewünscht aus dem Ultra-Rennen** (Vorhaben 6, alle noch nicht gebaut): Rennen-Grundliste, Soll-Setup, Velo-Countdown, Werkzeug passend zum Velo, Strom und Licht, Schlafstrategie, laufende Auswertung der letzten 3, 6 und 9 Stunden, Wetter für 2 bis 8 Stunden entlang der Route, drei Ziel-Stufen, Nacht-Blatt, letzter offener Laden vor der Nacht, Schlafplatz unterwegs.

### 2.4 Heute, Tagescheck und «Jetzt dran»

- **Tagescheck als ein Fragebogen:** Teile 1 bis 4 **online** (eine Frage pro Thema, Morgen- und Abend-Seite, «Deine 15 Fragen» ist aufgegangen in «Deine Fragen»). **Beschlossen, noch offen:** Gruss und Stimmungsknöpfe (Teil A #912 **offen**, dann B Anpassen, C Wetter und Wochenstreifen, D «Woran liegt's?» und Abend), Nachtträume, Wechsel-Varianten, Verbindungen (Ziele, To-dos, Freunde, Meilensteine, Aktivitäten), monatlich Visionen und Lebensträume. Frage 6 «Worauf freust du dich?» ist am Start aus («6 an» sagen).
- **Jetzt dran:** nur Dringendes (#913 online), «Später» und «Zeilen wählen» (#915 online); Backup-Zeile kurz (#911 offen); leere Notizen (#908 offen); ausgemusterte Velos nicht mehr auf Heute (#902 online). Offen laut Thread: ob Ruhiges und Dringendes weiter getrennt wird.
- **Bild oben auf Heute** (#783, offen) und **«pro Karte ein starker Knopf»** (nur auf Heute, nach dem Bild): **beschlossen**.
- **Heute ausmisten:** doppelte Gewohnheiten (#875 offen).

### 2.5 Aktiv, Auswerten, Lernen

- **Aktiv und Auswerten** (Entscheid 03.11. «1a bis 5a»): «Alles hier» ganz oben auf Aktiv, Auswerten in drei Fragegruppen, Heatmap, Neuland, Gelernt und Jahr unter Auswerten, «Gehört zu» wo «Alles hier» steht entfällt, Timer-Block auf jeder Sportseite plus «Zuletzt genutzt», Sonntags-Faden, «Das fällt auf»-Karte. **Stand in den Threads prüfen**: das Gedächtnis hält den Beschluss, aber nicht, welche Teile schon online sind.
- **Analyse** (13 Schritte): Schritte 1 bis 5 online, «Was hängt zusammen?» und «Vergleichen» offen oder online je nach Merge. Prüfen mit `docs/app-stand.md` und der Seite `#/analyse`.
- **Persönliches Lernen** (Ideen 1 bis 6): alle **online** (#849, #855, #865, #872, #885, #892) und das Folge-Paket «Experimente: einfacheres Formular, Fahrt gegen Fahrt» (#905, online).
- **Fragen aus deinen Daten, Stufe 2** (Wetter, Zufallsfrage, Vermutungen testen): online (#879, #896, #903).
- **Sieben Cockpit-Ideen** (03.11., «werden alle gebaut»): Signale zuerst (Idee 3, dann 5 zusammen mit Aktiv/Auswerten), Fragen (7) und Versuche (6), Ghost (4), Belastung (1, 2). Grenzen: das Wetter gibt es nur als Tageswert am Wohnort, es werden keine Rohdaten-Ströme gespeichert (also kein Live-Ghost), Ruhepuls, HRV und Schlaf sind nicht vorhersagbar.

### 2.6 Entdecken, Sammeln, Träume, Neuland

- **Träume und Neuland:** N6 «Feierabend-Biwak» online (#920), N8 «Passt jetzt: Ideen pro Monat» online (#900), **N7 «Zug hin, Velo heim»** offen (#934). Die Kette geht bis N19 (Biwak, Aussichtstürme und Wasserfälle aus OpenStreetMap, Fundliste); der genaue Stand je Schritt steht in `docs/releases/` und in der Seite «Neu seit gestern».
- **Entdecken und Sammeln** (sechs Ideen, 04.11.): Entdeckerkarte, Sammlungen mit Charakter, verschiedene Wege zum selben Ziel, Touren als Geschichten, Challenges nach Gelegenheit, nachvollziehbare Anerkennung. Befund: Pässe werden an fünf Orten gezählt (Neuland, Pässe sammeln, Gipfelbuch, Tourenpass, Sterne). Empfohlene Reihenfolge: erst «Warum zählt das?», dann **eine** Pass-Regel, dann Wege, Sammlungen, Challenges, Geschichten, Karte. Stand: Fragerunde 1, wartet auf deine Antworten.
- **Idee für später:** Pass-Sprint (kleines Spiel, H5 im Geheimmenü).

### 2.7 Bewegung, Schmunzeln, Geheimmenü (die 30 Ideen vom 03.11.)

- **Paket A** Seitenwechsel (Ideen 1 bis 5, alle als «b»), **Paket B** Packen fühlt sich echt an (nur 6 Vibrieren und 11 Rollverschluss; 7 und 8 später), **Paket C** Velo lebt (22, 21, 16, 12, 17), **Paket D** Laden, leere Seiten, Wetter (10, 14, 19, 15, 20: **online** am 04.11.), **Paket E** Touren als Sammlung (23 online; 13, 24, 25, 18 gewählt), **Paket F** Schmunzel-Ideen (29 bis 28: Velo im Logo online; Jahreszeit, Nussgipfel-Rechner, Mundart-Wetter, Murmeltier gewählt bzw. online), **Paket G** Heute (Landschaftsbild #783, danach der starke Knopf). Dein Satz: «Je Paket ein Bau-Thread, je Idee ein kleiner PR.» Den Stand je Idee zeigt `docs/vorhaben-liste.md`.
- **Geheimmenü hinter fünfmal «PG»:** H1 Kuhglocken (Ton nur mit Schalter), H2 Murmeltier, H6 Velo-Weisheit, H7 Alpenpanorama, H8 Platten, H9 Logo-Wetter: alle **online**. H3, H4, H10, H11 nicht gewählt. H5 Pass-Sprint nur Idee.
- **Neuer Schwung 2** (05.11., Ideen A bis G, nicht zu verwechseln mit den Paketen A bis G oben): A Tempo-Runde, B Beschlossenes ausliefern, F Sammel-Wand und G Rückwärts-Plan zum grossen Ziel laufen in Bau-Threads (F und G zuerst als Mockup); **C** Nutzungs-Spiegel und «Zuletzt», **D** Winter-Seite, **E** Jahresrückblick zum Teilen sind **Ideen für später**. Gespeichert in #935 (wartet auf «ok 935»).
- **Neuer Schwung 1** (26.10., Stil «Kacheln mit Tiefe», Bewegung überall sanft): Schritte 1 und 2 gebaut; die Schritte 3 bis 11 (Aufklappen am Handy, Stil auf Heute, Packen, Startklar, Touren, Velo, Aktiv, leere Seiten, übrige Bausteine) stehen in `docs/vorhaben-liste.md`.

### 2.8 Tennis und Angebote (Tennislehrer-Journey)

- **Online:** Anfrage, Rechnung zur Buchung, Sammelrechnung, Kundenliste, späte Absage, Barzahlung, Stundenkarte, Abo (fester Monatspreis), Warteliste mit Heute-Hinweis (#919), Gruppenstunden (#906).
- **Offen:** Fester Termin für Stammkunden (#936).
- **Beschlossen, in dieser Reihenfolge:** Regen-Absage mit Ersatzzeiten, Erinnerungen, Zahlarten (TWINT, Überweisung, bar), Gutscheine, Probestunde, automatische Erinnerungs-Mail (nur vorbereitet).
- **Flyer** (05.11.): Bereich «Tennis» (A), Flyer auf Deutsch 16:9 (B), A4, Quadrat und Englisch (C), Stufen und Art, Flyer pro Stufe (D), Anmeldeseite mit QR-Code (E), Bestätigungs-Mail (F), Teilnehmerliste mit Anmeldeschluss und Warteliste (G). Das Mockup hast du freigegeben; jeder Teil bekommt sein eigenes «ok». Vorlagen und Fotos bleiben privat.
- **Hinweis:** Wenn `api/` sich ändert, den Server «packgen» von Hand neu bereitstellen und auf READY prüfen.

### 2.9 Wegweiser, Alles hier, Auffindbarkeit

- **Versteckte Funktionen:** alle neun Schritte **online** (Wächter für die Tipp-Zahl, «Alles hier» in Velos, Material, Touren, Planen, Ich schlank).
- **Wegweiser statt Katalog** (26 PRs): Teil A (Absprünge), Teil B (Inhalte pro Bereich), Teil C. Den Stand zeigt `docs/vorhaben.md` Nr. 17.

### 2.10 Das grosse Durchklicken (Etappen)

Beschlossen am 05.11. («1b 2b 3a»): sechs Etappen nacheinander plus Schlussbericht. Fehler mit gleicher Ursache werden ein PR, höchstens fünf offen. Der Prompt liegt unter `prompts/frontend-durchklick/` im Projektordner, geändert wird nur die Zeile `ETAPPE = N`.

| Etappe | Bereich | Stand |
|---|---|---|
| 1 | Heute und Ich | **fertig**, Fehler behoben (#891, #897, #898, #899), Wächter «jeder Text hat Deutsch» (#907) |
| 2 | Touren und Packen, Material | **fertig**, Bericht liegt; #904, #917, #918, #922, #927 online oder freigegeben, #930 online |
| 3 | Unterwegs und Wetter | **wartet** auf dein «ok Bericht 2» |
| 4 | Velos und Alltag | folgt |
| 5 | Aktiv und Auswerten | folgt |
| 6 | Querschnitt (320 px, hell und dunkel, Deutsch und Englisch, lange Handy-Seiten messen) | folgt |
| 7 | Schlussbericht: verbessern, Stärken, Design-Vorschläge | folgt |

Verworfen (du am 05.11.): ein Wächter gegen doppelte Klassennamen und eine Meldung bei «1,5» im Gewichtsfeld. Offene Fragen aus Etappe 2: Hinweiskästen auf dem Handy zu, doppelte Brotkrumen, Suche im Zusammenlegen-Fenster, Vorrat-Auswahl mit Suche, Ladeplatzhalter. Befunde mit echten Daten bleiben im privaten Ordner.

### 2.11 Tempo, Start-Grösse, Tests

- **Start-JavaScript:** Grenze 5,0 MB (Warnung bei 90 %), heute etwa 3,4 MB. Das «Was ist neu» und das Handbuch laden erst beim Öffnen (#882, #869). Die Kern-Grenze von 3 MB für eine einzelne Datei gilt weiter.
- **Eingaben und Tabs flüssig:** Material-Suche online (#886), Tagescheck (#895 offen), «Meine Sportarten» (#910 online). Schwere Reiter (Träume etwa 0,8 s, Pflege etwa 1,2 s) sind vor allem Browser-Aufbau, keine eigenen PRs.
- **Tests und CI** (Test-Tempo): Nacht-Prüfung, «Ausprobieren» nur für neue Zeilen, Handy-Tests erst nach dem Label «ok», Mittagsprüfung. Offen: die Nacht-Sammlung und die Mittagsprüfung. Ablauf im [Technik-Handbuch](technik-handbuch.md#6-tests-und-ci).

### 2.12 Weitere Vorhaben mit Stand «beschlossen» oder «Idee»

Die vollständige Liste mit Ziel, Grösse und Nutzen steht in [Alle Vorhaben](vorhaben-liste.md) (nach den sechs Zielen geordnet) und in [Geplante Vorhaben](vorhaben.md) (mit Warum und Beispiel). Beide gelten für Einzelheiten; **diese Datei ist der aktuelle Überblick**.

### 2.13 Bewusst nicht

Foto-KI für Material, Live-Sync über Drive, fremde Einbettungen (nur Links), Privat-Zone beim Teilen, Inhalte anderer Nutzer, native App, Cloudflare, Google-Maps-Kacheln, Sturzerkennung, App verkaufen, Vercel-Kommentarleiste. Rennrad-Profil bei den Tourenvorschlägen. Mehr dazu und die Gründe: [Verlauf und Entscheide](verlauf-und-entscheide.md#6-abgelehnte-und-gestrichene-ideen).

---

## 3. Was auf dich wartet (höchstens die wichtigsten)

1. **«ok NNN»** für #932, #934, #936, #935 (siehe oben).
2. **«ok Bericht 2»**, damit Etappe 3 starten kann.
3. Nach den Wetter-Merges: **auf der echten Seite prüfen** (Landi und SRF im Fenster, Nullgradgrenze, Nebel gegen Webcam).

Alles Weitere: [Noah-Wissen](noah-wissen.md).

## 4. So bleibt sie aktuell

- Jeder PR schreibt **nur seine eigene Release-Datei** (`docs/releases/<name>.md`) und, wenn eine neue Funktion dazukommt, seine Zeile in `docs/app-stand.md`. So ändern zwei PRs nie dieselbe Zeile.
- **Diese Datei** führt der Sonntags-Brief nach (offene PRs von GitHub, Beschlüsse aus den Threads). Er ändert nur, was sich geändert hat, und löscht Erledigtes.
- Wer sie anfasst, prüft zuerst auf GitHub, ob ein Punkt noch offen ist, und schreibt keine Versionsnummer und keine privaten Daten hinein.
