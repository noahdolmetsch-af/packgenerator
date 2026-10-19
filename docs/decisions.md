# Decision Log

Jede wichtige Entscheidung mit Datum, Entscheid und Grund. Neueste unten. Ältere Zeilen dokumentieren den damaligen Stand und bleiben erhalten.

## Aktuelle Geltung (Abgleich 07.10.2026, ergänzt 08.10.2026)

Nachtrag 08.10.2026: Die Navigation Heute/Touren/Material/Velos gilt seit 0.23.0 auf jeder Seite, die Sprache steht im Profilmenü. Die Eventvorbereitung ist seit 0.22.1 live an das Häkchen „Event“ gebunden. Die beiden entsprechenden Punkte unten sind damit Historie. Neue Entscheide stehen unten im Abschnitt „Seit 7.10.2026“.


- Aktive Gesamtplanung: [Roadmap AP01–AP26](roadmap.md); ältere Etappen A–D/„Paket 5“ sind historische Planung. Bereits ausgelieferte Reisearten werden erhalten.
- Produktkern: Tourvorbereitungs-Assistent. Materialpflege ist Grundlage, Bikepflege Bereitschaftskontext; kein Ausbau zu einer Routen-/Trainingsplattform als Teil des Kernplans.
- Pack-Planung: ausgewählte Entwürfe **2 und 3** ersetzen im Packbereich das Dreispalten-/Velo-Kartenlayout, dominante Gewichtsflächen und hoverabhängige Zeilenaktionen. Fotos und bestehende Funktionen bleiben erreichbar. Andere Screens werden separat bearbeitet.
- Vorschlagsauswahl ist ein lokaler Entwurf bis Bestätigung; Einzelbearbeitung der fertigen Packliste speichert direkt mit Undo. Kein allgemeines gemeinsames Speichern aller Material-/Setupänderungen geliefert.
- Schrift: Fira Sans für Inhalte, vorhandene Sofia Sans Extra Condensed fürs Logo; Aktionsorange aus dem gemeinsamen Token. Der frühere Figma-Brief mit Instrument Serif/DM Sans/grüner Primäraktion ist historisch, keine aktuelle Pack-Spezifikation.
- Zielnavigation im Packbereich Heute/Touren/Material/Fahrräder; Sprache/Inbox/Rückblick im Profilmenü. Die alte Regel „DE/EN immer sichtbar oben auf jeder Seite“ gilt im neuen Packbereich nicht mehr in dieser Form; Sprachen bleiben verfügbar.
- Eventvorbereitung ist live noch nicht an einen Eventmodus gebunden. Der beabsichtigte neue Vertrag befindet sich in **offener PR #31**. Dessen Paketversion 0.22.1 nicht als live ausweisen.
- „Veröffentlicht“ benennt ausgelieferte Software; es ersetzt keine vollständige AP-/PF-Abnahme oder Zeitmessung. Private Daten bleiben ausserhalb des öffentlichen Repositorys.


## Aus dem Projekt "Bike Cockpit" übernommen

| Datum | Entscheid | Grund |
|---|---|---|
| 3.10.2026 | Reihenfolge: Home/Packen → Gear → Debrief | Packen ist der Kernablauf |
| 3.10.2026 | Design "Trail Journal" für alle Bereiche, Desktop und Phone | Gewählt aus drei Varianten |
| 3.10.2026 | App-Sprache Englisch; nur ein Fahrer; Learnings aus Debriefs | |
| 3.10.2026 | Every-ride-Standard, Übernachtungs-Sets, Taschen-Volumen festgelegt | Siehe HANDOVER, Abschnitt 5 |
| 3.10.2026 | Fleece-Mütze unter 2 °C; lange Unterhose (KL27) unter 5 °C | |
| 4.10.2026 | Gear: Inventar, Wunschliste eigener Bereich, Phone nur nachschlagen/wägen | |
| 4.10.2026 | Gear: Ledger Hauptseite, Board zweite Seite | |
| 4.10.2026 | Debrief: nur "nicht benutzt" antippen, plus Wetter, Komfort, was fehlte, Notizen | Schnell direkt nach der Fahrt |
| 4.10.2026 | Debrief: alle drei Varianten (A, B, C) umschaltbar | |
| 4.10.2026 | Installierbare Web-App (PWA) für Desktop + Android, offline | Kein App Store, kostenlos |
| 4.10.2026 | Sync per Export/Import-Datei; App ist Hauptquelle, Excel einmal importieren | Nur ein Nutzer, keine Server-Kosten |

## Projekt "Pack Generator"

| Datum | Entscheid | Grund |
|---|---|---|
| 4.10.2026 | **Stack: Svelte 5 + Vite**, JavaScript (Typen später möglich) | Svelte-Code sieht aus wie HTML/CSS/JS, am leichtesten zu lernen; kleine, schnelle App |
| 4.10.2026 | **Öffentliches Repo + GitHub Pages**; persönliche Daten (Excel, Backups) nie im Repo | Kostenloses Hosting; Pages ist bei GitHub Free nur für öffentliche Repos gratis |
| 4.10.2026 | **Excel-Import: alles**, inkl. Learnings, Events, Wartung und Kits | Das ganze Wissen aus dem Logbuch soll in der App weiterleben |
| 4.10.2026 | **Alles auf Englisch übersetzen** (Kategorien und Teilenamen) | Einheitliche App-Sprache |
| 4.10.2026 | **Erstes Ziel: Gear und Packen zusammen** | Packen mit der App ist das Erfolgsziel, braucht aber das Inventar |
| 4.10.2026 | **Prototyp sofort als Offline-App** nutzbar machen | Schon jetzt mit der App packen, während die richtige App entsteht |
| 4.10.2026 | Prototyp **unverändert öffentlich** (inkl. Gear, Events, Learnings im Code) | Von Noah freigegeben; Ausnahme zu "Daten nie im Repo" nur für den Prototyp |
| 4.10.2026 | **Fehlende Gewichte: "To weigh"-Liste** auf dem Phone | 85 von 191 Teilen ohne Gewicht; wägen direkt mit Waage daneben |
| 4.10.2026 | **Datenmodell bereichsneutral** (Tour-Typ, Behälter statt nur Velotaschen) | Skitour, Reisen usw. später ohne Umbau |
| 4.10.2026 | **Backup: Desktop sichert automatisch in einen Ordner** (File System Access API) | Fast automatischer Sync ohne Server |
| 4.10.2026 | **Lernen: jeder PR mit Erklärung in einfachen Worten + Lern-Seite** (`docs/learn/`) | Noah will verstehen, wie der Code funktioniert |
| 4.10.2026 | **Datenbank: IndexedDB über Dexie**, ein Datenmodell für alle Bereiche (`src/lib/db.js`) | Offline, viel Platz, gut lesbare Abfragen |
| 4.10.2026 | **Ein Dateiformat für alles:** Export, Import, Ordner-Sicherung und Excel-Import nutzen dieselbe Backup-Datei | Nur ein Weg, der getestet werden muss |
| 4.10.2026 | Import fragt **"Replace all data" oder "Merge"**; schlägt etwas fehl, bleibt alles unverändert | Daten dürfen nie verloren gehen |
| 4.10.2026 | Ordner-Sicherung schreibt `pack-generator-latest.json` plus eine Datei pro Tag | Neuester Stand für das Phone, Verlauf als Sicherheit |
| 4.10.2026 | Excel-Konverter nimmt englische Texte aus dem Prototyp; der Rest kommt aus einer **privaten Übersetzungsdatei** im Projektordner | Persönliche Daten bleiben ausserhalb des öffentlichen Repos |
| 4.10.2026 | "303 Plan" wird ein geplanter Trip; Alpenbrevet-Etappen hängen am Event; Dashboard, Quellen und Anleitung werden nicht importiert | Diese drei Blätter beschreiben nur die Excel selbst |
| 4.10.2026 | Standard-Tasche pro Teil nach den Regeln des Prototyps (Packliste, sonst Bibliothek, sonst Kategorie) | In der Excel fehlt sie bei 153 von 191 Teilen |
| 4.10.2026 | Gear: **Ledger und Board aus dem Prototyp** übernehmen (Ledger zuerst) | Design schon entschieden |
| 4.10.2026 | **To weigh: ein Teil nach dem anderen** ("Waage-Modus") | Schnell an der Waage |
| 4.10.2026 | Prototyp-Daten später per Backup übernehmen; Prototyp bleibt, bis Packen in der neuen App fertig ist | Kein Datenverlust, kein harter Umstieg |
| 4.10.2026 | **Eigene Taschenliste** (nicht nur Teile der Kategorie "Bags") | Noah, Antwort 5b |
| 4.10.2026 | **Vier Velo-Setups** (Scott Hardtail, Fully, Gravel, Factor LS) | Noah, Antwort 6b |
| 4.10.2026 | **Ready-Check: feste Liste wird immer vorgeschlagen, ist aber pro Tour bearbeitbar** | Noah, Antwort 7 |
| 4.10.2026 | **Eigene Seite "Bike care"**, die zum Event-Datum an Wartung erinnert | Noah, Antwort 8b |
| 4.10.2026 | Packen zeigt zusätzlich **Systemgewicht mit Velo und Fahrer** | Noah, Antwort 9b |
| 4.10.2026 | Idee QR-Kleber an Taschen: **notiert, später entscheiden** | Noah, Antwort 10b |
| 4.10.2026 | Gear zuerst als **Ledger**; Board folgt als zweite Ansicht in einem eigenen Schritt | Kleinere, prüfbare Schritte |
| 4.10.2026 | Gewicht wird **pro Stück** gespeichert, angezeigt als Stück × Anzahl; im Waage-Modus wiegt man alle Stücke zusammen | Paare (Seitentaschen, Pouches) richtig rechnen |
| 4.10.2026 | **Gear-Gewicht ohne Essen und Wasser** (Kategorie Food & drink zählt nicht ins Total und nicht in die Top 10) | Noah, Antwort 7b; das echte Tourgewicht zeigt Packen |
| 4.10.2026 | **Brand nur noch Hersteller**, Modell/Farbe in eigenem Feld "Model"; ältere Daten werden beim Start einmal aufgeräumt | Noah, Antwort 8a |
| 4.10.2026 | **Wägen beginnt mit Teilen für jede Tour** (Worn/Standard), dann Nacht-Sets, dann Optional, dann der Rest | Noah, Antwort 9b |
| 4.10.2026 | **Kategorien auf- und zuklappbar**; am Phone starten alle zu, am Desktop offen; beim Suchen ist alles offen | Noah, Antwort 10a |
| 4.10.2026 | Taschen und Packen nach den Empfehlungen: 13 Taschen aus der Excel als Start, feste Halterungen und Standard-Taschen pro Velo, Packen-Screen wie im Prototyp, eine Velo-Zeichnung für alle, neue Tour = Kopie der letzten mit demselben Velo, Ready-Check-Änderung gilt nur für diese Tour, Velo-Gewicht pro Velo, Fahrergewicht fix in den Einstellungen, Packen bis zur 303 am 15.10. fertig, Tasche für Tasche abhaken am Phone | Noah: "weiter machen" ohne eigene Antworten zu diesen 10 Fragen |
| 4.10.2026 | **Taschenliste als eigene Tabelle** (`containers`): jede Tasche hat einen Platz am Velo, ein Volumen und holt ihr Gewicht vom verknüpften Gear-Teil | Gewicht nur an einer Stelle pflegen; Datenformat Version 2 (nur neue Tabelle, nichts geht verloren) |
| 4.10.2026 | Start-Taschen: 11 Taschen aus der Kategorie "Bags" plus Cargo cage und Mini bag aus dem Prototyp; Dry bags und Spanngurte bleiben Gear | Sie sind kein Platz am Velo |
| 4.10.2026 | Alle 4 Velos starten mit dem Standard-Setup des Prototyps (Ortlieb, Rahmentasche, Oberrohr, 2 Pouches, Tool bag); 13 kg aus dem Logbuch beim Scott | Noah passt es pro Velo an |
| 4.10.2026 | **Neue Seite "Bikes"**; Pack nutzt pro Tour eine Kopie des Velo-Setups, Änderungen gelten nur für die Tour | Velo bleibt die Vorlage |
| 4.10.2026 | Taschen, die in der Excel-Packliste als Teile standen, wandern ins Taschen-Setup der Tour | Gewicht nicht doppelt zählen |
| 4.10.2026 | Systemgewicht = Gear am Velo + am Körper + Taschen + Velo + Fahrer; Essen und Wasser zählen hier mit | Das echte Tourgewicht; ungewogene Teile zählen als 0 und werden angezeigt |
| 4.10.2026 | **Vier Velos:** Scott Scale (Excel "Hardtail"), Scott Spark (Excel "Fully"), Factor LS (Excel "Gravel" ist dasselbe Velo, zusammengeführt) und neu Canyon Lux World Cup | Noah |
| 4.10.2026 | Setups: Factor = Rahmentasche, Oberrohrtasche, 2 Flaschen; Scott Scale = Oberrohrtasche, Full-Frame-Tasche, 2 Food Pouches; Scott Spark = 2 Food Pouches, Full-Frame-Tasche; Canyon = 2 Flaschenhalter, Tool bag. Garmin- und Quad-Lock-Halterung sind fix an allen Velos und zählen zum Velogewicht | Noah, Antwort 1 |
| 4.10.2026 | Velogewicht 13 kg aus dem Logbuch nur noch als Hinweis, Velos werden neu gewogen | Noah, Antwort 2 |
| 4.10.2026 | Volumen: Hinweis "about x L of y L", bei zu voller Tasche Warnung mit Vorschlag einer grösseren Tasche für denselben Platz | Noah, Antwort 3 |
| 4.10.2026 | Nacht-Sets Warm, Sleep, Cook und neu **Light** als Schalter pro Tour; Light startet mit Front-, Rücklicht und Stirnlampe | Noah, Antwort 4 |
| 4.10.2026 | Wetter pro Tour (Min/Max °C, Regen) mit Kleider-Vorschlag wie im Prototyp | Noah, Antwort 5 |
| 4.10.2026 | Prototyp-Daten nur als Backup sichern; die 303 wird in der neuen App neu gepackt. Vorher **Inventar-Check** (Still have / Gone / Replaced) | Noah, Antwort 6 und 10 |
| 4.10.2026 | Pack zeigt "Weigh n" für ungewogene Teile der Tour, "Print list" (pro Tasche, als PDF speicherbar) und Gepäck vorne/hinten | Noah, Antworten 7, 8, 9 |
| 4.10.2026 | Teile, die weg sind, bekommen den Status "Gone" statt gelöscht zu werden | Verlauf bleibt erhalten |
| 4.10.2026 | Canyon Lux World Cup wiegt 10.1 kg. Für Scott Spark und Factor LS steht kein Gewicht im Excel | Noah |
| 4.10.2026 | Velos werden ohne Taschen gewogen, aber mit Garmin-, Quad-Lock- und Flaschenhalterungen. Flaschenhalter zählen darum nicht noch einmal als Taschengewicht | Noah, Runde C Antwort 1 |
| 4.10.2026 | **Schichten (Layers):** Every ride (Rolle worn/standard) → Daily ride (Windjacke, Midlayer, Schloss) → Training ride (1 Flasche, 1 Carb Mix, 1 Gel pro 3 h) → unter 10 °C (Beinlinge, Buff, dünne Handschuhe, warme Weste) → unter 5 °C (warmes Rapha-Baselayer, warmes Gore-Trikot, lange Handschuhe) → Regen (Regenhose, Regenjacke, Regensocken, klare Brille, Überschuhe optional). Pack schlägt sie aus Fahrtart, Stunden, Temperatur und Regen vor; die Grenzen stehen pro Teil in Gear und sind änderbar | Noah, Runde C Antwort 2. Ersetzt die fixen Temperaturbänder aus dem Prototyp |
| 4.10.2026 | Kälteschichten werden getragen, wenn es auch am wärmsten Punkt kälter ist als ihre Grenze, sonst eingepackt | Annahme von Claude |
| 4.10.2026 | Inventar-Check geht Schicht für Schicht vor, beginnend mit Every ride | Noah, Runde C Antwort 2 |
| 4.10.2026 | Ersetzte Teile: Touren, Ready-Check, verknüpfte Taschen und fixe Halterungen zeigen danach auf das neue Teil | Noah, Runde C Antwort 3 |
| 4.10.2026 | Volumen-Hinweis schon ab 80 %, damit 20 % Platz frei bleiben. Nur Hinweis, kein Blocker | Noah, Runde C Antwort 4 |
| 4.10.2026 | Achslast wird angezeigt; Hinweis, wenn hinten mehr als 60 % liegt (einstellbar auf Bikes) | Noah, Runde C Antwort 5 |
| 4.10.2026 | Wetter manuell; Druckliste mit Abhak-Kästchen; Wasser als Liter pro Flasche, im Systemgewicht enthalten | Noah, Runde C Antworten 6, 7, 8 |
| 4.10.2026 | Als Nächstes: Bike care mit Erinnerungen vor dem Event. Teilen der Packliste ist nicht nötig | Noah, Runde C Antworten 9, 10 |
| 4.10.2026 | **15 °C und trocken ist die Basis.** Unter 15 °C: Armlinge, Beinlinge, Windweste (die Windweste ist darum nicht mehr "every ride"). Unter 10 °C: Buff, dünne Handschuhe, neues Teil "Gilet Fleece kuschelig". Unter 5 °C: neues Teil "Trainerhose lang chillig", Regenhose dünn, Regenjacke | Noah, Runde D Antworten 1, 2, 4 |
| 4.10.2026 | "Handschuhe lang" sind die Thin long gloves (kein neues Teil) | Noah, Runde D Antwort 3 |
| 4.10.2026 | Kälte **tauscht** Basis-Teile, wenn sie getragen wird: warmes Rapha-Baselayer statt ärmellos, warmes Gore-Trikot statt kurzem Trikot, Trainerhose statt Shorts, dünne Handschuhe statt Halbfinger, klare Brille statt Sonnenbrille. Wird die Schicht nur eingepackt, bleibt das Basis-Teil | Noah, Runde D Antwort 7; Einpack-Regel Annahme von Claude |
| 4.10.2026 | Daily ride: grosses Schloss, pro Tour wählbar Mini cable lock oder kein Schloss | Noah, Runde D Antwort 5 |
| 4.10.2026 | Flaschen: 1 pro 3 h, höchstens 2, Rest unterwegs nachfüllen; eine Extra-Flasche von Hand mit + | Noah, Runde D Antwort 6 |
| 4.10.2026 | Bike care: Erinnerung nach 1000 km; Wartungsliste aus dem Excel-Blatt "Wartung" als Start, den Ablauf spielen wir vorher einmal komplett durch | Noah, Runde D Antworten 8, 9 |
| 4.10.2026 | Herstellergewicht der Velos nur als Hinweis neben dem gewogenen Gewicht | Noah, Runde D Antwort 10 |
| 4.10.2026 | **Bike care** als eigene Liste über alle Velos, unter "Bikes" (Setup / Care). Erinnerungen nur dort, nicht auf Home | Noah, Bike care Antworten 1, 7 |
| 4.10.2026 | Zwei Arten: Event-Vorbereitung (aus dem Excel-Blatt "Wartung", automatisch für jede Tour mit Datum, Frist = Start minus Vorlauf) und Arbeiten am Velo, getrennt angezeigt. Überfälliges rot ganz oben | Noah, Antworten 2, 3, Beispiel 1 |
| 4.10.2026 | Jedes Velo hat eine **Teileliste mit Verlauf** (Datum, km, Messwert, Aktion, Modell, wer, Notiz): Kette, Kettenblatt, Kassette, Beläge und Scheiben vorne/hinten getrennt, Gabel, Dämpfer, Sattelhöhe, Schaltung, Reifen + Dichtmilch, Schrauben, Lager | Noah, Beispiel 3, 4 |
| 4.10.2026 | Kette: Verschleiss in % mit der Kettenlehre, Warnung ab 0.4 %, ersetzen ab 0.5 %; wachsen alle 150 km; beim Ersetzen über 0.75 % Hinweis "Kassette und Kettenblatt prüfen" | Noah, Kette 1, 2, 5, 6 |
| 4.10.2026 | km-Stand pro Velo nur von Hand; km pro Teil rechnet die App seit dem Einbau | Noah, Antwort 4, Kette 3, Beispiel 9 |
| 4.10.2026 | 1000-km-Check: Bremsbeläge, Kette, Reifen + Dichtmilch, Schrauben mit Drehmoment, Schaltung, Gabel/Dämpfer-Lockout, Lager. Ein Check vor einem Event zählt auch dafür | Noah, Beispiel 7, 8 |
| 4.10.2026 | Ergebnis-Knöpfe: "OK", "Ersetzen oder Arbeit nötig", "Ersetzt oder erledigt" (bei der Kette zusätzlich "Waxed"). Ersetzen nötig setzt das Teil (mit Modell) auf die Wunschliste; Ersatz mitnehmen ist nur ein Hinweis | Noah, Beispiel 2, 5, 6, Kette 4 |
| 4.10.2026 | Wer hat es gemacht: "Me" oder "Bike shop", oben auf Bike care umschaltbar, wird mit jedem Eintrag gespeichert | Noah, Kette 8 |
| 4.10.2026 | Juni-Aufgaben aus dem Excel einmal durchgehen: Done / Still open / Work needed soon / Not needed any more | Noah, Antwort 8 |
| 4.10.2026 | Service-Fotos pro Velo und km-Stände liefert Noah später; sie bleiben privat in den Projekt-Dateien | Noah, Kette 7, 10 |
| 4.10.2026 | Bike care Runde 3: überfällige Event-Aufgaben geht Noah selbst durch; Teile ohne Eintrag bleiben grau "not recorded"; Beläge in %; Bremsscheiben-Grenze 1.5 mm, pro Velo änderbar; alle Vorbereitungsaufgaben für jede Tour mit Datum; "Work needed" bleibt offen; Arbeiten ohne Teil bleiben unter "Repairs"; neue Velos starten mit der Standard-Teileliste | Noah, Bike care Antworten 1–7, 10 |
| 4.10.2026 | Reifen: ein Eintrag "Tyres + sealant", dazu Luftdruck vorne/hinten (bar) und Dichtmilch (ml) erfassbar | Noah, Antwort 8 |
| 4.10.2026 | Pro Velo eine Übersicht "What was done when" über alle Teile und erledigten Arbeiten | Noah, Antwort 9 |
| 4.10.2026 | Full-Frame-Tasche wird unabhängig vom Velo-Update immer in der Taschenliste angelegt | Noah, Screenshot "add full frame bag to bags" |
| 4.10.2026 | Pack-Layout: drei Spalten (Not packed, Velo mit offener Tasche, Schichten/Nacht/Ready-Check) | Noah, Mockup-Antwort 1a |
| 4.10.2026 | "Not packed": Kategorien zugeklappt, Klick öffnet; Farbquadrat nur bei Kategorien; beim Suchen ist alles offen | Noah, Mockup-Antwort 2b und Dateiname Screenshot |
| 4.10.2026 | Hinweise ("Below 10 °C", "standard") als kleine Etikette in der Liste | Noah, Mockup-Antwort 3a |
| 4.10.2026 | "+" legt in die gewählte Tasche, am Desktop auch Ziehen auf eine Tasche (Zeichnung oder offene Tasche) | Noah, Mockup-Antwort 4a |
| 4.10.2026 | Teile der offenen Tasche als Kacheln mit Füllbalken (Marke bei 80 %) | Noah, Mockup-Antwort 5b |
| 4.10.2026 | Ready-Check am Desktop nur als Kurzfassung, Klick öffnet alles; Aufräumen des Ready-Checks folgt nach Rückfragen | Noah, Mockup-Antwort 6a |
| 4.10.2026 | Gewichte oben bleiben der grosse Block | Noah, Mockup-Antwort 7b |
| 4.10.2026 | Phone: fixe Leiste unten "Adding to … · Change bag" im Add-Tab | Noah, Mockup-Antwort 8a |
| 4.10.2026 | Ready-Check: keine Zeile "items not ticked off" mehr, keine Gruppen, eine kurze Liste | Noah, Ready-Check-Antworten 1 und 3 |
| 4.10.2026 | "Always with me" (AirPods, Garmin, Brustgurt, Brille, Sonnencreme) werden Teile mit "On every trip" und kommen automatisch in jede neue Tour; das Schloss bleibt bei den Layers | Noah, Antwort 2 |
| 4.10.2026 | Neue Standardliste (8 Checks, mit Rucksack), "Tick all checks" mit einem Klick, "Save as my standard" speichert die Liste für alle neuen Touren | Noah, Antworten 4 und 5 |
| 4.10.2026 | Eigene Checks pro Tour bleiben; Ready-Check immer gleich angezeigt; Phone behält den Check-Tab | Noah, Antworten 6–8 |
| 4.10.2026 | Prototyp wird nicht mehr geändert, ist nicht mehr online und liegt in `archive/cockpit/`; keine Daten-Übernahme, Neustart in der neuen App | Noah, Antworten 9a und 10b |
| 4.10.2026 | "Not packed": kleinere "+"-Knöpfe, immer nur eine Kategorie offen | Noah, Screenshot "Daily commute" |
| 4.10.2026 | "Kind of ride" als drei Knöpfe (Every, Daily, Training) mit Text, was sie hinzufügen; Hinweis, dass Layers nur Vorschläge sind | Noah: Dropdown nicht verständlich |
| 4.10.2026 | Templates: Name "Template"; speichert Taschen, Teile mit Platz und Anzahl, Ready-Check, Ride, Stunden, Night; nicht Wetter, Häkchen, Velo; Teile gehen beim neuen Velo in die passenden Taschen | Noah, Template-Antworten 1–5 |
| 4.10.2026 | "Save as template" oben in Pack; ändern über "Update template" aus einer Tour; neue Tour startet standardmässig mit der letzten Tour auf diesem Velo; Templates in "New trip" und auf eigener Seite (Pack → Templates); erstes Template "Daily commute" aus Noahs Tour | Noah, Antworten 6–10 (7 noch offen, Empfehlung a umgesetzt) |
| 4.10.2026 | Kacheln in der Tasche: keine Häkchen mehr, dafür ein "−"-Knopf zum Entfernen; "Tick all" weg | Noah: "für was brauchen wir die checkboxes" |
| 4.10.2026 | Template-Bearbeiten-Screen (Pack → Templates → Edit): Teile hinzufügen, entfernen, Anzahl, Platz; Name, Ride, Stunden, Ready-Check; speichert sofort | Noah, Template-Antwort 7b |
| 4.10.2026 | Design: kurze Platznamen in der Velo-Zeichnung (voller Taschenname als Tooltip); leere Taschen bleiben gestrichelt; kein Abhaken; Kachel auf eine Tasche ziehen verschiebt sie; Knöpfe oben in einer Reihe; Wetter klappt zu, wenn gesetzt; Farbbalken bleibt; "not weighed" grau; Gewichte in einer Zeile | Noah, Design-Antworten 1–9 |
| 4.10.2026 | Design-Durchgang Seite für Seite im Chat, dazu ein Browser-Durchgang mit Mockup als Entscheidungsgrundlage | Noah, Design-Antwort 10b |
| 4.10.2026 | Pack: grosse Taschen-Kästen auf heller Velo-Zeichnung (Anzahl, Gewicht, erste 4 Items, Liter); Body-Plätze links; leere Taschen gestrichelt; Bottle cages unten im Rahmen; offene Tasche dunkel; Klick öffnet, Ziehen verschiebt; am Phone als wischbarer Streifen | Noah, Skizze und Mockup-v3-Antworten 1–10 |
| 4.10.2026 | Pack: Kopf in einer Reihe, "Adding to" als ruhige Zeile, Kacheln flacher (4 Spalten), Layers nach Regel gruppiert (Erledigtes in einer Zeile), Ready check immer zugeklappt, "Bags for this trip" bleibt zugeklappt unten, Night zeigt "Warm" aufgeklappt, Phone: Items einspaltig mit Kategorie-Titeln, Knöpfe hinter ••• | Noah, Pack-Antworten 1a–10a und Details 4.10.2026 |
| 4.10.2026 | Gewichte ohne unnötige Nullen (64 kg statt 64.00 kg); Velo ohne Gewicht heisst überall "not weighed"; Debrief im Menü als "soon" markiert | Design-Durchgang, Fehler |
| 4.10.2026 | Ideen aus dem ChatGPT-Bild: ruhigere Farben (Orange nur für Aktionen), schmale Titel-Schrift bleibt, unter den Kästen alle Taschen als Liste mit "Move", Zweck-Name pro Tasche ("Quick access", wird mit Vorlagen gespeichert), Vorlagen als Knöpfe oben, Velo-Zeichnung jetzt (eigenes Foto später), keine Item-Bilder, Symbole in der Zahlenleiste, Undo statt Save-Knopf | Noah, Antworten 1a 2a 3a 4a 5a 6a (später b) 7a 8a 9a |
| 4.10.2026 | Design-Audit 0.12: alle Vorschläge umsetzen (Gear mit Tabs, Seitenspalte und Wiege-Fortschritt; Pack am Phone kompakter; Templates mit leerem Zustand; Bikes mit Einstellungen zugeklappt, Plätzen als Karten, Standard vs. Tour; Bike care ruhiger, ein Hauptknopf, Regeln ohne Knöpfe; Orange nur für Aktionen) | Noah: "mit allem einverstanden" |
| 4.10.2026 | Debrief nur für Touren aus der App; jedes Item zählt als benutzt, nur Ausnahmen antippen (nicht gebraucht, defekt, gefehlt); Knopf erscheint am Tag nach Tourende auf Startseite und Pack; "nicht gebraucht" bei warmem Wetter → Vorschlag "nur unter 10 °C", sonst "nicht auf jeder Tour"; passende Learnings bestätigen und neue vorschlagen; nichts ändert sich ohne Häkchen; Speichern laufend | Noah, Etappe-1-Antworten 1a–6a |
| 4.10.2026 | Startseite "Next trip": zwei Spalten, ohne Tour "Plan a new trip" + letzte Tour + Learnings, 3 wichtigste Learnings passend zur Jahreszeit, Wetter erst in Etappe 2 (bis dann "gepackt für …") | Noah, Etappe-1-Antworten 7a–10a |
| 4.10.2026 | Plan nach v0.13: zuerst Paket 1 vor der 303 (Packtag-Modus im Vollbild Tasche für Tasche, Learnings als kleiner Hinweis beim Item, Backup-Erinnerung nach 14 Tagen, Debrief fragt "km dieser Tour" und zählt sie zum Velo, "zu Hause lassen" erst nach 3× nicht gebraucht); danach Wetter (Open-Meteo, Startort von Hand, offline letzter Stand), GPX, eigenes Velo-Foto, Logbuch alter Events, Garmin/Strava als Datei-Import vorbereitet, Teilen als PDF und Link, Deutsch/Englisch-Umschalter, weitere Bereiche (Skitouren, Weekend-Trip, Weltreise) | Noah, Antworten 1b+a 2a 3a 4a 5a 6a 7a 8b 9a 10a 12b 13b 14 PDF+Link 15b |
| 4.10.2026 | Wetter von Open-Meteo (ohne Konto; offline zählt der zuletzt geladene Stand), Ort von Hand gesucht oder Start der GPX-Route; "Pack for …" übernimmt kältester Tiefstwert, wärmster Höchstwert und Regen (ab 5 mm Regen, ab 1 mm oder 50 % Schauer). GPX: Distanz, Höhenmeter (3-m-Schwelle), Fahrstunden-Schätzung 16 km/h + 1 h pro 600 Hm. Velo-Foto wird auf dem Gerät verkleinert (max. 1400 px, JPEG) und blass hinter den Taschen in Pack gezeigt. "All my favorite things" = Merkliste quer durch alle Bereiche (Paket 5) | Noah, Antworten 4a 5a 12b 13b, 15 = a |
| 4.10.2026 | Alte Events als Logbuch zum Nachlesen auf der Debrief-Seite. Garmin/Strava ohne Server: Import per Datei im Debrief (eine Fahrt als GPX/TCX oder die CSV-Liste aus Strava "Download your data" bzw. Garmin Connect), es zählen nur Velofahrten an den Tourtagen. Teilen: "Print / PDF" (Druckdialog → Als PDF sichern) und "Share link": die Liste steckt verpackt in der Adresse, nichts wird hochgeladen, nur Taschen, Item-Namen, Anzahl und Gewicht | Noah, Antworten 6 (Import vorbereiten), 9a, 14 PDF + Link |
| 4.10.2026 | **Werkstatt-Besuche als eigene Tabelle `visits`** (Datum, Werkstatt, Rechnung, Betrag, km, Arbeiten, Beleg-Fotos); ihre Arbeiten zählen als Teile-Historie, ohne die Velo-Daten zu ändern (Antworten 7a, 8a) | Ein Import kann eigene Einträge nie überschreiben; ein Besuch lässt sich allein korrigieren oder löschen |
| 4.10.2026 | **4 neue Teile:** Bremsen (Entlüften, Leitungen), Laufräder, Hinterbau (nur Fully), Cockpit (Antwort 9a, Empfehlung, weil Noah nachfragte) | Jede Zeile eines Belegs hat einen Platz |
| 4.10.2026 | Modell kommt vom Beleg, wenn keins eingetragen ist (10a); Haken auf den Belegen bedeuten nichts (11) | |
| 4.10.2026 | **Schlauch oder tubeless pro Rad** (12a); Dichtmilch nur für tubeless fällig | Scale fährt vorne mit Schlauch |
| 4.10.2026 | **Fällig nach Zeit oder km, was zuerst kommt** (13a): Gabel und Dämpfer 1× pro Jahr (14a), Dichtmilch alle 3 Monate (15a), Bremsen entlüften ohne Intervall, nur bei weichem Druckpunkt (16b) | |
| 4.10.2026 | Zeit-Fälligkeiten nur in Bike care, nicht auf der Startseite (17b) | |
| 4.10.2026 | Kosten pro Jahr und pro 1000 km (18a); fälliges Teil mit letztem Preis auf die Wunschliste (19a); neue Belege schickt Noah als Foto, Claude macht eine Import-Datei (20a) | |
| 4.10.2026 | **Setup-Fotos:** eigene Tabelle `photos`, Galerie unter Bikes, blass hinter den Taschen in Pack mit Vergrössern-Knopf, am Phone nur der Knopf, ein Foto kann einer Tour gehören (1a-4a); Fotos zugeschnitten (5a); drittes Foto = Scott Scale (6) | |
| 4.10.2026 | km-Stand der 4 Velos aus Strava (Scale 2287, Spark 1460, Factor 3689, Canyon 0) und Strava-Gewichte als Startwert bis zum Wägen (Antwort 3b); nur leere Felder werden gefüllt; gewogenes Gewicht ersetzt den Hinweis. Spark-km beim Besuch 26.06. = 1369 angenommen (1a). Scale: Kassette und Kettenblätter am 20.12.2025 beim Veloshop Vonäsch (2a), ohne Preis = "cost unknown" | Noah, Strava-Ausrüstung |
| 4.10.2026 | **Reihenfolge ab jetzt:** 0.18.0 Tagesansicht + Werkstatt-Erinnerung, dann Probefahrt 303 als Demo (0.18.1), App lernt (0.19.0), Deutsch/Englisch (0.20.0), Paket 5. Nicht bis nach der 303 warten, sondern sie fiktiv durchspielen | Noah: "nicht bis nach 303 warten" |
| 4.10.2026 | **Tagesansicht "Ride day"** (#/ride): Knopf in Pack, am Tourtag öffnet die Startseite sie einmal pro Tag von selbst (1a); Liste aller Taschen statt Suche (2b); Wetter Stunde für Stunde am Start und am Ziel (3a); km, Höhenmeter, Fahrzeit, Ankunft **und Höhenprofil** (4a+b); offline der zuletzt geladene Stand mit Alter (5a); Tag 1, Tag 2 umschaltbar (6a); Notiz für den Debrief (7a); grosse Schrift (8a) | Noah, Antworten 1a 2b 3a 4a+b 5a-8a |
| 4.10.2026 | **Werkstatt-Erinnerung vor einer Tour** in Pack und Bike care, nicht auf der Startseite (9a), ab 14 Tagen vorher (10a): was jetzt fällig ist und was unterwegs fällig wird (Zeit oder die km der Route) | Noah, 9a 10a |
| 4.10.2026 | **Nonstop-Modus:** Die 303 (Lucerne 303) ist ein Nonstop-Rennen; im Mai 2026 abgebrochen bei km 112. Ride day zeigt bei "Nonstop" eine Etappe über Nacht mit den 3-Stunden-Blöcken aus dem Logbuch-Zeitplan, Wetter pro Block | Noah, "a, ich habe dann abgebrochen" |
| 4.10.2026 | **Demo-Modus:** Demo-Touren kommen als Datei in Noahs App (b). Vorher wird alles weggelegt, "End demo" setzt exakt zurück; Backups sind während der Demo aus; "Demo day" lässt die App einen anderen Tag spielen | Noah, Antwort b |
| 4.10.2026 | **Probefahrt 303 (0.18.1):** Packtag vergleicht Vorhersage mit dem gepackten Wetter und führt zu den Layers; Debrief zeigt Ride-Notizen in Schritt 1 und 2; bei "fehlte" Vorschläge aus dem eigenen Gear (nur wenn das letzte Wort passt); Route bleibt Noahs echte GPX mit 112 km (2b); "Vor der Tour" wird eine gemeinsame Liste (3a, kommt in 0.18.2); Demo-Touren für Hope 1000 und Alpenbrevet in 0.19 (4a); keine echte 303 im Oktober (5b) | Noah, Plan-Antworten 1a 2b 3a 4a 5b |
| 4.10.2026 | **Eine Liste "Before the trip" (0.18.2):** Startseite, Pack und Bike care zeigen dieselbe Liste (Vorbereitung, Velo, Reparaturen). Was das Velo braucht, kommt ab 14 Tagen vorher dazu, Fälliges immer; damit erscheint für die nächste Tour auch Zeit-Fälliges auf der Startseite (3a geht vor 17b). In Bike care stehen die Aufgaben der Tour alle bei der Tour, "Due now" zeigt nur noch Velo-Sachen | Noah, Plan-Antwort 3a |
| 4.10.2026 | **4 Quittungen Veloshop Vonäsch** (2024-2026) als Werkstatt-Besuche: Spark = gelb-schwarz, Scale = schwarz; R-32090 ("1-Rad") als Scale angenommen; km dieser Besuche unbekannt | Noah, Quittungen 4.10.2026 |
| 4.10.2026 | **Dein Tempo (0.19.0):** Die Fahrzeit-Schätzung behält ihre Form (km / Tempo + Höhenmeter / Steigrate) und bekommt deinen Faktor aus deinen GPX-Fahrten (bewegte Zeit, ohne Stopps). Getrennt geschätzt ergaben Tempo und Steigrate unsinnige Werte (Abfahrten verdecken das Klettern). Fahrten lassen sich einzeln abwählen | Noah, Plan "App lernt" |
| 4.10.2026 | **Templates lernen ab 3 Debriefs:** "Take out", wenn ein Teil auf seinen letzten 3 Touren nie gebraucht wurde; "Put in", wenn ein eigenes Teil 2× gefehlt hat. Nichts ändert sich ohne Knopfdruck | Plan "App lernt" |
| 4.10.2026 | **Nutzen pro Seite:** Startseite behält die Kacheln (1b); Ballast-Karte in Pack (2a) und Marken statt Learning-Text (3a); Ride day pro Block Kleidung, Essen und Licht (4b); Touren-Vergleich als Grafik (5a); "Dead weight" in Gear (6a); Wunschliste mit Grund (7a); Werkstatt-Auftrag (8a); Velo-Wahl jetzt (9a); Reihenfolge: zuerst Auswerten, dann Werkstatt, dann Packen und Fahren (11). Echte 303: bleibt, als "Not riding" markierbar (10 offen, Annahme) | Noah, Antworten 1b 2a 3a 4b 5a 6a 7a 8a 9a 11 |
| 4.10.2026 | **Quick note:** runder +-Knopf unten rechts auf jeder Seite (1a), Foto optional (2a), am Samsung über langes Drücken aufs App-Icon und "Teilen" (3a), eigene Seite "Inbox" zum Einordnen (4b), alle Notizen bleiben zusätzlich als Liste (5b) | Noah, Antworten 1a 2a 3a 4b 5b |
| 4.10.2026 | **Werkstatt-Auftrag (0.19.3):** Preise = was der gleiche Job zuletzt gekostet hat (zuerst gleiches Velo, sonst ein anderes); Dichtmilch nur aus Zeilen ohne Tubeless-Umbau; Kette wachsen bleibt draussen (machst du zu Hause); offene Reparaturen ohne Preis; Nachricht an die Werkstatt auf Deutsch, App bleibt Englisch | Annahme, Noah: "Werkstatt-Auftrag, Steckbrief und Velo-Wahl" |
| 4.10.2026 | **Quick note teilen:** Android-Teilen nimmt Text und Links mit (GET); ein Foto kommt über den Foto-Knopf in der Notiz, weil Foto-Teilen einen eigenen Service-Worker-Empfang bräuchte | Annahme, Antwort 3a |
| 4.10.2026 | **Favoriten-Liste ist ab jetzt die Datengrundlage:** Lieblingsteile tragen einen ★ und gehören zur Liste "favorites-tested-bikepacking-gear" (auch als Template); das übrige Inventar bleibt. Die Liste wird als eigene Datei angewendet, die nur Stern, Liste, leere Marke und Notiz setzt und fehlende Teile ergänzt, damit Gewichte aus der App nicht überschrieben werden. Nicht übernommen: die TO DOS (Vorbereitung, nicht Gear) und Parkplatz-Zeilen mit "no" (doppelt). Ersetzt wird nichts automatisch: ältere Teile bleiben ohne Stern | Noah, Liste new-master-favitems.xlsx |
| 5.10.2026 | **Favoriten mit Parkplatz-Zeilen:** Die 4 Parkplatz-Zeilen mit "no" (Trainerhose mitteldünn, Fleece-Hose, Windjacke Nike, Regenjacke blau Haglöfs) bekommen auch einen Stern, mit der Notiz "bleibt meist zu Hause"; die Trainerhose ist neu, falls es "Trainerhose lang" noch nicht gibt | Noah: "parkplatz items miteinbeziehen" |
| 5.10.2026 | **Ballast-Karte (0.19.5):** Ballast = auf den letzten 2 oder 3 Touren, auf denen es dabei war, nie gebraucht (die letzten 3 zählen; einmal gebraucht beendet die Serie). Taschen, Velo-Teile und Essen zählen nicht. "Keep" merkt sich pro Tour, dass ein Teil bewusst mitkommt | Noah, Antwort 2a |
| 5.10.2026 | **Marken statt Learning-Text:** "3× not used", "Missed last time", "Broke last time", "Tip"; der Satz erst beim Antippen | Noah, Antwort 3a |
| 5.10.2026 | **Ride day Block für Block für alle Touren:** Tagesetappen in 3-Stunden-Blöcken, nonstop mit dem Zeitplan aus dem Logbuch. Kleidung aus den Layers mit "Below … °C" und Regen gegen das Blockwetter (ohne Stundenwetter das Tourwetter). Essen aus "1 pro N Stunden", fehlende Stücke einmal gemeldet. Trinken 0.5 L pro Fahrstunde, ab 25 °C 0.75 L (Annahme, nicht gemessen) gegen die Flaschen der Tour. Licht: Sonnenuntergang und -aufgang am Start des Tages, in der Zeitzone des Geräts | Noah, Antwort 4b; Trinkmenge Annahme |
| 5.10.2026 | **Neue Startseite (0.19.6):** Suche in der oberen Leiste (1a); Bike care und Ride day über Bikes bzw. das Tour-Band (2a); Phone mit Leiste unten und + in der Mitte (3a); der schwebende Quick-note-Knopf wird durch „New“ bzw. das + ersetzt (4a); Reihenfolge Pack, Gear, Bikes (5a); „Good to know“ mit 5 Karten (6a); Gear zeigt Favoriten und Teile (7a); eine neue Packliste fragt zuerst Template / kopieren / Standard-Set (8a). „Workshop visit“ öffnet eine Quick note mit Beleg-Foto, weil Belege weiterhin als Import-Datei kommen (20a) | Noah, Antworten 1a-8a |
| 5.10.2026 | **Deutsch/Englisch (0.20.0):** Umschalter DE \| EN in der oberen Leiste, pro Gerät gespeichert, Englisch als Standard. Gear-Teile mit deutschem Namen (nameDe) zeigen ihn auf Deutsch. Was du geschrieben hast oder was gespeichert wird (Tour-, Taschen- und Velonamen, Learnings, Notizen, Excel-Aufgaben, Logbuch, Notizen in der Historie), wird nicht übersetzt; gespeicherte Daten bleiben unabhängig von der Sprache. Schweizer Schreibweise (Velo, ss). Wörter: Gear = Ausrüstung, Trip = Tour, Bike care = Velopflege, Debrief = Rückblick, Template = Vorlage, Ready check = Startcheck. Geteilte Links und Druck nehmen die Sprache des Absenders | Annahme, Noah: "0.20.0 Deutsch/Englisch" |
| 5.10.2026 | **Tour vorzeitig beenden:** „Tour beenden und Rückblick“ auf dem Fahrtag setzt trip.finished (Datum); die Tour ist dann nicht mehr die nächste Tour und der Rückblick ist sofort offen, statt erst am Tag nach dem letzten Tag | Noah: „kann keinen Ride starten, nach dem Setup geht es nicht weiter“ |
| 5.10.2026 | **Ein grosser „Weiter“-Knopf in Pack:** Schritte Packliste → Packtag → Fahrtag → Rückblick. Packtag ist dran, bis alle Teile gepackt und alle Checks abgehakt sind; danach Fahrtag; ist die Tour vorbei oder beendet, Rückblick. Der kleine Rückblick-Knopf bleibt nur am Desktop | Noah: „einen grossen Button, der mich zum nächsten Schritt bringt“ |
| 7.10.2026 | **Plan nach Ist-Analyse:** Etappe A echt benutzen, B vereinfachen, C Paket 5, D App lernt sichtbar; B, C und D gleichzeitig gestartet. Paket 5 sofort (1b); Excel-Vorbereitung bleibt bei jeder Tour (2b), aber als eine Zeile zusammengefasst; erste echte Tour = Arbeitsweg (3a); Phone ist Hauptgerät, Desktop holt den Stand per Backup (4a); zuerst Velopflege und Packen vereinfachen (5); eine Seite "Velos" mit Tab "Pflege" (6a); Test der ganzen Runde bei jedem Pull Request (7a) | Noah, Antworten 1b 2b 3a 4a 5 6a 7a |
| 7.10.2026 | **Annahmen bis zur Antwort (Rückfragen ★):** Reisearten Skitour, Wochenende (ohne Velo), Weltreise; Taschen pro Reiseart fest (Ski 30 L Rucksack, Wochenende Reisetasche + Tagesrucksack, Weltreise 60 L Rucksack + Tagesrucksack); ein Inventar mit Reiseart pro Teil (Teile ohne Angabe = Bikepacking); Favoriten-Seite nach Reiseart; Pflege mit "Jetzt fällig" oben, Velos zugeklappt; Pack-Desktop behält drei Spalten; Gewichte System / Basis / Am Körper / Essen und Wasser (Basis ohne Taschen) | Annahme, Rückfragen 2-5, 7-9 |
| 7.10.2026 | **Ohne Velo kein Fahrtag:** Touren ohne Velo gehen Packliste → Packtag → Rückblick; "Weiter: Rückblick" beendet die Tour. Deutsches Wort für Bereich: "Reiseart" ("Bereiche" ist schon die Navigation) | Annahme |
| 7.10.2026 | **Neues Projekt „Optimierung vom Packgenerator“:** Produktkern Tourvorbereitung; Tourkontext (Tourart, Dauer, Übernachtung, Wetter) vor der Packliste; Vorschläge mit Grund, ausdrücklich übernommen, mit Undo; ehrliche Gewichte; Material mit 3 Pflichtangaben. Ablaufplan AP01–AP26, Reihenfolge AP01–09 → AP12–16 → AP10–11 → AP17–24. Das alte Projekt und seine offenen Fragen ruhen | Noah, Analyse und Ablaufplan vom 7.10.2026 |
| 7.10.2026 | **AP02:** Nacht-Grundset „Base“ (inkl. Ladegerät und Kabel) nur bei Übernachtung draussen (2b, 8a); Tagestour-Set Teil für Teil festgelegt (28 immer, 8 nach Dauer, 9 nicht; Halterungen gehören zum Velo, nicht in die Packliste); Tourarten MTB, Alpin, Bikepacking, Ultracycling, Rennvelo/Gravel, Skitour, Wochenende, Weltreise (4a); unklarer Bestand wird mit Hinweis vorgeschlagen (5a); Gel 1 pro Stunde (6b); manuelle Wahl vor bestätigter Regel, Notizen/Learnings lösen nur Rückfragen aus (7a). Excel-Vorbereitung: Frage weggelassen, bleibt vorerst bei jeder Tour | Noah, Antworten 1b 2b 4a 5a 6b 7a 8a |
| 7.10.2026 | **AP06:** zeitfällige Velo-Services erscheinen jetzt auch auf der Startseite (ersetzt 17b), weil die Bereitschaft überall gleich lauten muss; offene Reparaturen zählen zur Velopflege, Excel-Aufgaben nie | Konzept, Annahme |


## Ergänzungen aus dieser Umsetzung

| Datum | Entscheid / Status | Grund / Nachweis |
|---|---|---|
| 07.10.2026 | **Entwürfe 2 und 3 gemeinsam umsetzen**, nicht als wählbare konkurrierende Layouts: Entscheidung → ruhige Packliste → bestehende Packkontrolle | Noah: „ich möchte 2 und 3 beide umsetzen“; PR #32 |
| 07.10.2026 | Gründe, Alternativen und Mengen im Entwurf prüfen; Bestätigung speichert, Zurück verwirft | Kontrolle über Auswahl; Unit-/E2E-Nachweise |
| 07.10.2026 | Keine automatische Freitext-Konflikterkennung behaupten; Regel und Notiz gemeinsam zur manuellen Klärung zeigen | Strukturierte Konfliktlogik AP14 noch offen |
| 07.10.2026 | Einfache gemeinsame Phasennavigation und echte Regelzahl; keine künstliche Reduktion auf drei Mockup-Karten | Konsistenter Ablauf und tatsächliche Vorschläge; Design-QA |
| 07.10.2026 | Bestehenden `main` v0.22.0 in neue Screens integrieren: ehrliche Gewichte, Schätzungen, Favoriten und gemeinsame Bereitschaft erhalten | PR #30 nicht überschreiben; Feature-Head 8944024 |
| 07.10.2026 | **PR #32 durch Noah veröffentlicht**, anschliessend CI/Live-Einstiege geprüft | Merge be041f1; Actions 37663681916; Releasebeleg |
| 07.10.2026 | **Dokumente konsolidieren und mit Roadmap abgleichen**; GitHub ist verbindlicher Stand, gespeicherter Ablaufplan datierte Fassung; historische Audits erhalten | Noahs Dokumentationsauftrag; docs/README.md, roadmap.md, verification.md |
| 07.10.2026 | **PR #31 separat offen halten**: anfängliche Softwarekonflikte danach durch Branch-Commit 05a7f84 gelöst; aktuelle Dokumente abgleichen, Eventmodus vor Release fachlich abnehmen | CI 37667778399 erfolgreich; diese Runde ändert keine Eventlogik |
| 7.10.2026 | **M1-Antworten (im offenen PR #31 dokumentiert):** 1 Liste heisst „Weitere Dinge“; 2a „Leichtestes“ nur ohne fehlende Taschengewichte; 3a überfällig in Tagen/Wochen/Monaten statt Datum; 4b Excel-Eventvorbereitung schon jetzt nur bei Touren mit Häkchen „Event“ (ersetzt frühere Regel „bei jeder Tour“, nimmt AP16 teilweise vorweg) | Noahs Antworten laut PR #31; fachlicher Vertrag, noch nicht live |
| 07.10.2026 | **Parallele Fortschreibung PR #31:** Softwareintegration mit PR #32 in 05a7f84 und CI 37667778399 erfolgreich; gemeinsame Dokumentation auch in diesem Branch nachführen | Offen/nicht live bleibt der Releasezustand; Dokumentkonflikte nicht als noch ungelöste Softwareintegration ausweisen |
| 07.10.2026 | **PR #31 auf neuer Packansicht erneut geprüft** (Kommentar auf PR #31): Event-Häkchen und `isEvent` in „Vor der Tour“ von `CalmPack`, kein Dreispaltenlayout; neuer Browsertest `tests/e2e/event.spec.js` (Handy und Desktop): Kurzfahrt am Folgetag ohne Eventvorbereitung auf Start und Pack, ausdrücklich gewähltes Event mit datiertem Fahrplan und „überfällig seit …“, bleibt nach Neuladen, ältere Tour mit abgehakter Aufgabe gilt als Event und zeigt „1 von 2 erledigt“. 230 Unit- und 14 Browsertests auf dem integrierten Stand | Testdaten mit Präfix `test_data_gtp_`; beide neuen Ansichten mit Noahs Daten (privat) bei 390 px und Desktop ohne Seitenscrollen |

## Seit 7.10.2026 (Nachtrag 08.10.2026, Releases 0.23 bis 0.35 und Plan 0.36)

| Datum | Entscheid | Grund |
|---|---|---|
| 7.10.2026 | **M2 (0.23):** Navigation Heute, Touren, Material, Velos auf jeder Seite; DE/EN nur noch im Profilmenü (1b); am Phone sind Hubs und „Gut zu wissen“ zugeklappt (3b); Kategorie auch am Phone änderbar (5b). Ein neues Teil braucht nur Name, Kategorie und Status | Noah, M2-Antworten 1b 3b 5b; AP07–AP09 |
| 7.10.2026 | **Weniger Klicks (0.24):** „Alle / keine“ überall, wo man viele Häkchen setzt; neues Teil direkt aus der Suche; eintägige Touren ohne Übernachtungs-Grundset | Noahs Messung: Tagestour 60–95 s, „zu viele Klicks“ |
| 7.10.2026 | **Ruhige Packzeilen und Tagestour (0.24.1):** Zeile zeigt nur Name, Anzahl, Gewicht (1a); Tagestour „Alles gepackt, los“ (2a); Rückblick direkt von Heute (3a); Vorlage nach der ersten Tagestour anbieten (4a); Mehrfachauswahl in Gear (5a) und beim Hinzufügen (6a) | Noah, Antworten 1a–6a |
| 7.10.2026 | **M3 (0.25):** Die Tour fragt Tage, Fahrstunden, Übernachtung (keine, Unterkunft, draussen, Kochen), Wetter und Event, bevor die Liste entsteht. Spätere Änderungen wirken mit Undo und lassen von Hand gesetzte Mengen stehen | Konzept AP12–AP16, Noahs M3-Antworten |
| 7.10.2026 | **Tagestour mit einem Tipp, Wohnort einmal eingeben (0.25.1):** Wetter für Tagestour und Wochenende kommt vom Wohnort; Hubs zeigen 4 Knöpfe plus „Mehr“; Ideenliste pro Velo („Was geil wäre“) | Noah, Antworten 1b 2b 3a; Messung 60 s war zu langsam |
| 8.10.2026 | **M4 (0.26):** Name „Bausteine“ (1b) mit eigener Seite (2b); Menge pro Teil; eingebaute Bausteine umbenennbar (5b); alle Excel-Kits werden Vorlagen, das Regen-Kit ein Baustein (12a, 13a); Vorlage fragt „aktualisieren oder neu“ (16a) und speichert auch Velo, Tage, Übernachtung (17b); erhöhte Menge bleibt gepackt (18b); Notizen unterwegs gehen zur Tour und in die Inbox (19a+b); kein Volumen, solange Liter fehlen (15b) | Noah, M4-Antworten 1–20 |
| 8.10.2026 | **AP25 Vorlagenlernen (0.28):** Erste Hilfe nur bei mindestens einer Nacht; Werkzeug und Ersatzschlauch nie Ballast; Regen- und Kälteteile zählen auf trockenen oder warmen Touren nicht als ungenutzt (2a); alle Touren zählen (3b); abgelehnter Vorschlag kommt nach 3 weiteren Rückblicken wieder (4a); bei Widerspruch gilt die neuste Tour (5b); Hinweis auf Heute (6a) | Noah, AP25-Antworten |
| 8.10.2026 | **Neue Tour startet mit dem Standard-Set;** Vorlagen und „letzte Tour kopieren“ bleiben als Wahl (ersetzt „neue Tour = Kopie der letzten Tour“ vom 4.10.) | Noah, 8.10.2026 |
| 8.10.2026 | **Tour-Tabs (0.29):** ein dunkles Band mit Tabs und Status, ein oranger Knopf für den nächsten Schritt; Packen Tasche für Tasche; „Jetzt“-Block unterwegs; Rückblick eine vorausgefüllte Seite; Wetteränderungen still mit Grund und Undo in der Zeile (4b) | Noah, Tabs-Antworten 1a–3a, 4b, 5a–10a |
| 8.10.2026 | **Claude führt seine eigenen PRs selbst zusammen, sobald CI grün ist** (Build, Unit- und Browser-Tests), und meldet „0.x ist online“ erst nach grünem Deploy. Nie bei rot oder laufendem Check. „Zurück auf 0.x“ macht Claude rückgängig. Browser-Tests Phone und Desktop laufen parallel. Fragen als kurze Entscheidungskarten mit ★-Empfehlung | Noah, Antwort 1a: zu viel Zeit beim Veröffentlichen verloren |
| 8.10.2026 | **Fenster „Neue Tour“ und Tipps (0.30):** ein Fenster mit Standard-Karte, Bausteinen als Chips, Vorlagen zugeklappt; „Gut zu wissen“ mit wichtigen Datenkarten und Tipps; Seite „Was die App alles kann“ | Noahs Testfunde 0.28, Antworten 1a–11a |
| 8.10.2026 | **Rundgang-Lücken:** kleine Lücken (L2, L5, L6, L7, L9) in 0.30.2, grössere (Zeitplan, Einkaufs- und Ladeliste, Abendblock, Gerätewechsel) in 0.34 | Noah, Rundgang-Antworten 1a–11a |
| 8.10.2026 | **Fünf Design-Regeln für jede UI-Änderung:** Seltenes zugeklappt; kein Text-Lärm; klare Hierarchie und Zahlen rechtsbündig; Umschalter und kleine Badges statt roter Zeilen; Zeilenaktionen am Desktop ruhig, bei Hover und Fokus voll, am Phone immer sichtbar (angepasst, weil „nur bei Hover“ am Phone nicht geht). Nichts darf verloren gehen | Noahs Design-Vorgaben (PDF), 8.10.2026 |
| 8.10.2026 | **Velopflege und Setup (0.31):** ein Velo offen, Teile mit letzter Arbeit und Badge, „Für den Velomech“; Setup Variante A; ich/Velomech im Dialog „Arbeit eintragen“. Eintrag ohne Angabe „wer“ zählt für niemanden | Noahs Testfunde, Variantenwahl A |
| 8.10.2026 | **Bausteine in zwei Stufen:** 0.32 vereinheitlicht nur Wörter und Screens (Bausteine, Vorlagen, „Am Körper“, „Standard“), die Logik von „Getragen“ bleibt; 0.33 stellt die Daten um, alte Felder bleiben mitgeführt, damit ältere Backups lesbar bleiben | Noah, Funde-Antwort 12 (zuerst b, dann a) |
| 8.10.2026 | **Standard-Teile kommen in jede neue Tour**, auch aus Vorlage oder Kopie | Noah, Antwort 11a |
| 8.10.2026 | **Standard-Teile können Ballast sein;** nur Werkzeug und Getragenes („Am Körper“) nie (ersetzt „bei jeder Tour nie Ballast“ aus 0.28) | Noah, Antwort a |
| 8.10.2026 | **Die Ladeliste blockiert „Packen“ nicht:** nicht abgehakte Geräte halten den nächsten Schritt im Zeitplan nicht auf | Sonst stünde der Zeitplan oft still |
| 8.10.2026 | **Pflicht-Wünsche AP27–AP30** (GPX als Learning, Vorlagen neu, Entwürfe, Foto mit KI) sind zwingend. Reihenfolge nach 0.34: zuerst AP29 | Noah, 8.10.2026 |
| 8.10.2026 | **AP29 Entwürfe:** „In Bearbeitung“ mit Zahl (1a); alte offene Rückblicke bleiben, nach 7 Tagen unten (2a); Vorlagen nie in der Liste (3b); keine Entwurfs-Dialoge, sondern Tour, Teil und Notiz speichern, sobald ein Name getippt ist (4b, 5a); nur kurz „✓ Gespeichert“ (6b); fertig gepackte Touren bleiben bis zur Fahrt (7a); Menü „Nicht fahren“/„Verwerfen“ und die Liste räumt sich selbst auf (8a+b) | Noah, AP29-Antworten |
| 8.10.2026 | **AP29 Design-Variante B:** Umschalter „{n} weitere ▾“ im dunklen Tourband, am Phone von unten, am Desktop als kleines Fenster | Noah, Wahl aus zwei Varianten |
| 8.10.2026 | **„Was die App alles kann“ zeigt immer die neusten Funktionen** in einfachen Worten mit Knopf „Ausprobieren“; Heute meldet nach einem Update einmal „Neu seit deinem letzten Besuch“. Jeder Release-PR ergänzt `src/lib/whatsnew.js` (Deutsch und Englisch) | Noah testet jeden Release selbst und muss wissen, was neu ist |
| 8.10.2026 | **Excel-Import:** Noahs bereinigte Excel-Liste (privat, nicht im Repo) wird in die App übernommen. Schritt 1 (0.36) Material und Learnings, Schritt 2 der Verlauf. Alles im Besitz ausser Wunschliste; Doppelte schlägt die App vor, Noah bestätigt | Noah, Import-Antworten 10–14 |
| 8.10.2026 | **Import über eine Prüfseite „Import prüfen“**, nie direkt: Gruppen „Schon da“, „Neu“, „Unsicher“; Knopf „Alle sicheren übernehmen“, Unsicheres einzeln; vorher automatisches Backup und „Rückgängig“; jedes Teil behält seine Excel-Nummer (`sourceId`), damit ein neuer Import zusammenführt statt doppelt anlegt | Noah, Antworten 1a 2a; Angst vor Doppelten |
| 8.10.2026 | **Import überschreibt nie:** vorhandene App-Teile bleiben führend (Touren und Vorlagen zeigen auf sie) und werden nur ergänzt. App-Teile, die nicht in der Excel stehen, kommen in eine Liste; Noah entscheidet, sie werden **archiviert statt gelöscht**, damit alte Touren ganz bleiben. Learnings behalten ihr ursprüngliches Datum | Noah, Antwort 3b; Daten dürfen nie verloren gehen |
| 8.10.2026 | **Einsatzbereiche:** Velo, Bikepacking, Wandern, Reisen, Alltag, dazu bleiben Ski und Weekend. Kein eigener Bereich „Sport“, das zählt als Alltag. Listen zeigen nur passende Teile | Noah, Antworten 4a und 10a |
| 8.10.2026 | **Temperatur-Kits als Vorschlag:** der Rückblick fragt „zu kalt / ok / zu warm“; teilweise gebraucht zählt als gebraucht, mit Vorschlag für weniger Menge; alte Touren ohne Datum oder Wetter zählen voll | Noah, Antworten 4a, 13a, 14b; Umsetzung in Import Schritt 2 |
| 8.10.2026 | **Rucksäcke als echte getragene Taschen (Noah, 8.10.2026):** Geplant als 0.37. Rucksäcke und Hüfttaschen sind echte Taschen mit Litern und Gewicht. Am Velo gibt es die getragenen Plätze „Rücken“ und „Hüfte“; ihr Gewicht zählt zu „Am Körper“, nicht zum Velo. Touren ohne Velo nutzen die echten Rucksäcke statt allgemeiner Namen, die App schlägt pro Reiseart passende vor. Warnung, wenn der Inhalt mehr Liter braucht, als die Tasche fasst. Eine Warnweste kann Kleidung und Tasche zugleich sein | Noah, 8.10.2026 |
| 8.10.2026 | **Reihenfolge nach 0.36:** 0.37 Rucksäcke, 0.38 AP28 Vorlagen neu, 0.39 AP27 GPX → Learning, 0.40 Excel-Import Schritt 2 (Verlauf), dann AP30 Foto mit KI, Mehrfachauswahl für Bausteine und Taschen (tief), dann offene Abnahmen AP21–AP24 und AP26 | Abgleich Plan 8.10.2026 |
| 8.10.2026 | **Import prüfen (0.36):** zuerst eigene Prüfseite, nicht direkt ins Material; „Alle sicheren übernehmen“, Unsichere einzeln; App-Teile ohne Excel-Zeile in einer Liste, entfernen = archivieren; bestehende Teile nur ergänzen; Excel-Nummer verhindert Doppelte | Noah, Antworten 1a 2a 3b |
| 8.10.2026 | **0.38 „Heute und Menü“:** schnelle Knöpfe, Sprünge, Saison in Zahlen, Bereit-Ampel, Menü mit 4 Orten + „Mehr“; nicht: „Bestes Upgrade“, Knöpfe selbst wählen. Dazu Wischen im Material, Taschen-Hinweis nur bei Bedarf, Velopflege kompakt, ganze Update-Geschichte | Noah, 8.10.2026 23:18 |
| 8.10.2026 | **Dokumentation in jedem Release-PR:** `docs/status.md` (Stand, live, in Arbeit, Historie), `docs/decisions.md` (wenn es Entscheide gab), `src/lib/whatsnew.js` und `docs/roadmap.md` (wenn ein Arbeitspaket seinen Stand ändert). Keine privaten Daten in den Docs | Noah: „bitte sicherstellen, dass immer wieder alles gut dokumentiert wird“ |
| 8.10.2026 | **Rucksäcke (0.37), Datenmodell:** Keine neue Tabelle, kein Schema-Wechsel. Eine getragene Tasche ist ein Eintrag in der Taschenliste (`containers`) mit Platz `carry` (Rücken) oder `hip` (Hüfte); „getragen“ folgt aus dem Platz, nicht aus einem eigenen Feld. Gewicht vom verknüpften Teil (`itemId`) oder, ohne Teil, direkt an der Tasche (`weightG`); Bereiche in `domains`. Rücken und Hüfte sind keine Halterungen: jedes Velo hat sie, ohne Eintrag in `bike.slots`. Ein getragener Platz bietet alle getragenen Taschen an | Noah, Antworten 1a, 2a |
| 8.10.2026 | **Rücken behält den Schlüssel `carry`:** nur der Name wechselt („Auf dem Rücken“ → „Rücken“), alte Touren und Velos bleiben gültig, keine Datenumstellung. Inhalt und Taschen von Rücken und Hüfte zählen bei Velotouren zu „Am Körper“ (`wornG`, `onMeG`), nicht zu Basis, Taschengewicht oder Last pro Rad; die Systemsumme bleibt gleich. Beim Velowechsel bleiben die getragenen Taschen | Noah, Antwort 2a |
| 8.10.2026 | **Echte Rucksäcke auf Touren ohne Velo:** ein Rucksack der Tour (`trip.packs[]`) zeigt mit `bagId` auf eine echte Tasche; Name, Liter und Gewicht kommen dann von ihr. Ohne `bagId` (alle älteren Touren) oder wenn die Tasche gelöscht wurde, bleibt der allgemeine Rucksack. Vorschläge nach Litern und Bereichen, nie nach Namen: Wandern 12–15 L, Weekend und Reisen je 18–22 L, andere Bereiche ±5 L um den allgemeinen Rucksack; ein Vorschlag wird nur angezeigt, übernommen wird mit einem Tipp. Ultra-Rennen (Event mit mehr als einem Tag oder mindestens 10 h): Weste 12–15 L auf Rücken | Noah, Antwort 3a |
| 8.10.2026 | **Weste als Kleidung und Tasche:** ein Schalter im Teil-Dialog legt einen Taschen-Eintrag an (`itemId` = das Kleidungsstück, `alsoItem: true`, Platz Rücken). Das Teil bleibt Kleidung und packbar; steht es auch auf der Liste, zählt sein Gewicht nur einmal. Ausschalten entfernt nur den Taschen-Eintrag und leert die Plätze, die ihn nutzten; Teil und Tour-Einträge bleiben | Noah, Antwort 4a |
| 8.10.2026 | **Liter-Hinweis:** nur wenn die Tasche Liter hat und die Teile mit bekannten Litern allein schon mehr brauchen; Teile ohne Liter zählen als unbekannt, nie als null oder voll. Leise als kleines neutrales Badge „über {n} L“ und eine Zeile in der offenen Tasche | Noah, Antwort 5a |
| 9.10.2026 | **Zusammenlegen (0.37.1):** Die App schlägt das Gegenstück vor (nur importierte Teile mit Excel-Nummer; Name, gemeinsame Wörter, gleiche Kategorie gibt etwas Bonus; bis zu 3 Vorschläge), Noah bestätigt. Mehrere Ziele erlaubt (Sammelteil → mehrere Teile, jedes bekommt Platz und Menge). Ersetzt wird das alte Teil in Vorlagen, Bausteinen (Mitgliedschaft und Mengen), Taschen-Verknüpfung, Velo-Fixteilen, Verweisen anderer Teile (Alternative, ersetzt), Learnings (Ziele kommen dazu) und Touren, die noch nicht vorbei sind. Vergangene, beendete oder zurückgeblickte Touren und Rückblicke bleiben unverändert. Das Ziel behält alle eigenen Werte; nur leere Felder (Notiz, Favoriten-Notiz, übliche Tasche, Gewicht) werden gefüllt, Favorit wird ODER-verknüpft, Listen, Bereiche und Bausteine vereinigt; „Standard“ nur, wenn das Ziel nicht „zu Hause bleibt“. Das alte Teil wird archiviert (`ownership: 'gone'`, `archivedBy: 'merge'`, `mergedInto`), nie gelöscht; Rückgängig stellt die genauen Datensätze wieder her; ein zweiter Lauf ändert nichts | Noah, 9.10.2026: „bauen, die App schlägt vor, ich bestätige“ |
| 9.10.2026 | **Archivierte Teile kommen in keine neue Tour:** weder aus Vorlagen, der Kopie der letzten Tour, Standard, Bausteinen, Kontext noch Vorschlägen. Bestehende Touren behalten sie | Fehler gefunden beim Zusammenlegen: `tripFromTemplate` prüfte nur, ob es die ID gibt |
| 9.10.2026 | **0.38 „Heute und Menü“ umgesetzt (Antworten 1a–13a):** Material zeigt die Tasche nur mit „Kompakt \| Mit Tasche“ (gemerkt auf dem Gerät); nicht Gewogenes nur „–“, die Anzahl im Kategorie-Kopf. Wischen nur am Handy: rechts Favorit und Zuordnen, links Löschen mit Rückgängig; ein Teil, das schon auf einer Tour war, wird beim Wischen und im ••• archiviert (Status „Weg“), endgültig löschen nur mit dem roten Knopf im Teil. Velopflege: eine Liste, überfällig zuerst, ok-Teile als „{n} ok“ mit Namen zugeklappt, Reifen-Schalter in der geöffneten Zeile, Velomech nur mit Laden-Symbol, Filter als Umschalter. Heute: Ampel immer mit Wort, sechs Schnellknöpfe, Tagestour und Notiz eigene Zeile; „Velo geputzt“ als eigene Liste `bike.washes` (kein Teil). Menü: 4 Orte + „+“, „Mehr“ oben rechts in 4 Gruppen mit Inbox und Sprache, keine Unterreiter, jede Seite in genau einem Menü, die Suche findet Seiten und Aktionen. Nicht gebaut: „Bestes Upgrade“, selbst gewählte Knöpfe | Noah, Antworten 1a–13a zum Entwurf v037-vorschlag |
| 9.10.2026 | **Vorlagen verbunden mit Bausteinen (0.39, AP28):** Eine Vorlage hält `blocks` (Standard immer), `without` (pro Baustein weggelassene Teile), `extras` (`{itemId, qty}`), freiwillig `bikeId`/`setup`, dazu `slots`/`qty` für andere Taschen und Mengen. Gleicher Einstellungs-Schlüssel `templates`, nur zusätzliche Felder; `entries` bleibt als Kopie und wird bei jedem Speichern neu geschrieben, damit ältere Versionen und Backups gültig bleiben. Ändert eine ältere Stelle (Rückblick, Zuordnen, Zusammenlegen) `entries`, wird die Änderung in `without`/`extras` übersetzt | Noah 1a, 3a, Frage 1a; Vorschlag v0.39 |
| 9.10.2026 | **Umstellung mit identischem Inhalt:** `update.templatesLinked2026` verbindet jede ältere Vorlage einmal; ganze Bausteine werden erkannt, der Rest wird Extra oder „ohne“. Ein Test beweist: abgeleitete Teile = alte Teile | Noah, Frage 2a |
| 9.10.2026 | **Benutzt = gestartet oder gefahren:** gezählt aus `trips.templateId`, Touren mit Startdatum bis heute oder abgeschlossen; übersprungene zählen nicht. „Lange nicht benutzt“ nach 12 Monaten, „Behalten“ (`keptAt`) gibt 12 Monate Ruhe, „Archivieren“ (`archivedAt`) blendet aus, nichts wird gelöscht | Noah 6a, Fragen 6a, 7a |
| 9.10.2026 | **Baustein löschen:** zuerst wandern seine Teile in die Extra der Vorlagen, die ihn enthalten; Rückgängig stellt beides wieder her. Velo in Vorlagen freiwillig, Taschen nur mit Velo; eine Tour aus einer Vorlage übernimmt deren Bereich | Noah 5a; Technik-Teil des Vorschlags |
| 9.10.2026 | **Bedienung:** Bereich-Umschalter nur mit Bereichen, die Vorlagen haben, plus Alle; Standard beim Erstellen immer dabei; „Neue Tour“ über ••• und auf der Vorlagenseite, kein Knopf pro Zeile | Noah 4a, Fragen 4a, 5a, 8a |
| 9.10.2026 | **0.40 „Ruhige Nebenseiten“ (Design-Prüfung, Antworten 1a–10a):** Paket jetzt (1a), Trip-Seiten und die fünf Entwurfs-Seiten (2 „b und a“). Eine Liste vergangener Touren mit Rückblick-Stand; die Rückblick-Seite behält Learnings, Vergleich und Tempo (3a). Segmente statt Dropdowns mit 2–3 Möglichkeiten (4a). Inbox: Velo/Tour im •••, kleines neutrales Badge nur wenn gesetzt, ein leichter Hauptknopf pro Notiz (5a). Badges neutral grau, nur Dringendes mit kleinem farbigem Punkt (6a). Erklärsätze weg, wo nötig hinter „?“ (7a). Trip-Seiten am Computer volle Breite (8a). „Was die App kann“: ungenutzte als Zeilen, genutzte nach Bereich zugeklappt (9a). Neue Tour: Reiseart zugeklappt mit letzter Wahl, „Letzte Tour kopieren“/„Aus Vorlage“ unter dem Standard zugeklappt (10a, ersetzt N11 „sofort sichtbar“). Nichts geht verloren: Optionen nur verschoben oder zugeklappt (z. B. Status „Unklar“/„Zu kaufen“ unter „Anderer Status“) | Noah, Antworten zur Design-Prüfung 9.10.2026 |
| 9.10.2026 | **Kettenverschleiss → Wunschliste:** Ein Messwert an oder über der Ersetzen-Grenze der Kette (eigene Grenze des Velos, sonst 0.5 %) gilt als „Arbeit nötig“, egal ob über Heute oder die Velopflege erfasst, und legt einen Wunsch „Kette (Velo)“ mit Grund und letztem Preis an (`from: 'care'`, `bikeId`, `part: 'chain'`). Steht schon eine offene Kette dieses Velos auf der Wunschliste, kommt keine zweite dazu; eine gekaufte („Vorhanden“) oder weggelegte zählt nicht. Rückgängig nimmt Logbuch-Eintrag und Wunsch zusammen zurück; in der Velopflege gibt es dafür neu ein Rückgängig in der Meldung | Noah, Auftrag 0.40 |
| 9.10.2026 | **0.41 „GPX → Learning“ (AP27), Umfang:** Fahrt hochladen (GPX, TCX weil der Parser einfach ist; FIT nicht), Einstieg im Rückblick und in „+ Neu“ als „Fahrt hochladen“. Geht auch ohne geplante Tour: die Tour dieses Tages wird vorgeschlagen, sonst „Nur Fahrt“ oder „Neue vergangene Tour“. Pause = Halt ab 5 Minuten, kürzere Halte zählen zur Fahrzeit. Geplant gegen echt für Distanz, Höhenmeter, Fahrzeit, Tempo. 1–3 Learnings, jedes mit einem Tippen bestätigt, nichts ohne Tippen. Wetter und Verpflegung bleiben im Rückblick (nicht aus der GPX). Keine Strava-, Komoot- oder RWGPS-Verbindung (braucht einen Server) | Noah, Auftrag 0.41 (Punkte 1–6) |
| 9.10.2026 | **Halt-Erkennung:** Ein Halt ist, wenn man innerhalb von 30 m um den Punkt bleibt, an dem der Halt begann (GPS-Zittern zählt so nicht als Fahren); eine Lücke in der Aufzeichnung ab 5 Minuten mit fast keinem Weg (Uhr auf Auto-Pause) ist auch ein Halt. Ein Halt ganz am Anfang oder Ende wird abgeschnitten (weder Pause noch Fahrzeit). km und Höhenmeter ohne das Zittern der Pausen | Folge aus Noah 2 |
| 9.10.2026 | **Geplant = was die App damals annahm:** Beim Speichern merkt sich die Fahrt den Plan (`plan`: aus dem Zeitplan, sonst den Fahrstunden der Tour, sonst Route ÷ dein Tempo, ungerundet; bei mehreren Tagen der Anteil des Tages) und das Tempo davor (`basis`). So bleiben Vergleich und Learnings gleich, auch wenn das Tempo danach dazulernt | Vergleich soll nachvollziehbar bleiben |
| 9.10.2026 | **Fahrzeit für „Dein Tempo“:** Eine hochgeladene Fahrt geht mit ihrer Fahrzeit nach der neuen Regel (kurze Halte zählen dazu) in „Dein Tempo“; ältere GPX-Importe dort zählten jeden Halt über 60 s als Stillstand. Abwählbar pro Fahrt („Zählt für dein Tempo“) | Noah 3; eine Regel für Fahrzeit |
| 9.10.2026 | **Android-Teilen mit Datei:** `share_target` wechselt von GET auf POST/multipart (eine App kann nur ein share_target haben). Weiter `generateSW`; ein kleiner eigener Handler kommt per `workbox.importScripts` dazu und läuft vor den Workbox-Routen. Datei → Cache `pg-shared-ride` → `#/debrief/ride/shared`; Titel/Text/Link → wie bisher `?title=…&text=…&url=…` in die Inbox. Die Datei bleibt im Cache, bis sie gespeichert oder verworfen ist | Noah 5; Offline-Caching bleibt unverändert |
| 9.10.2026 | **Inbox-Zuordnung wird gespeichert:** Velo und Tour einer Notiz werden beim Wählen in der Notiz gespeichert (`bikeId`, `tripId`); die vorher nur geratene Zuordnung zeigt kein Badge mehr | Folge aus 5a: ein Badge nur, wenn wirklich gesetzt |
| 9.10.2026 | **0.42 Kleiderschrank (Noah 1):** eigene Seite `#/wardrobe`, nach Schicht (Basis, Mitte, Aussen, Zubehör), dann Zone (Oberkörper, Beine, Hände, Kopf, Füsse). Die feineren Import-Zonen werden zusammengefasst: Rumpf und Arme → Oberkörper, Augen und Hals → Kopf. Kleider = Kategorie Kleider auf/neben dem Velo, Regen & Kälte, Schuhe, oder jedes Teil mit Schicht oder Zone. Ohne Schicht oder Zone: Gruppe „Noch einordnen“ oben, Vorschlag aus dem Namen umrandet (nicht gefüllt), ein Tippen setzt einen Wert, mit Rückgängig. Filter Velo (Bikepacking und Velo) \| Alltag \| Alle, gemerkt auf dem Gerät | Noah, Bildentwurf v042, Antwort 1 |
| 9.10.2026 | **Zwiebel-Check (Noah 2, 3, 12):** eine leise Zeile im Bedingungs-Kasten unter dem Wetter, aufklappbar. Zeilen: Basis, Mitte, Aussen (Oberkörper), Beine, Hände, Kopf, Füsse; gezeigt wird, was nötig ist oder schon eingepackt ist. Nötig: Basis immer, Mitte unter 15 °C, Aussen unter 12 °C oder bei Regen, Beine unter 10 °C, Hände unter 12 °C, Kopf unter 8 °C, Füsse unter 5 °C (gefühlte Temperatur = kälteste Fahrstunde − Verschiebung). Ein Teil reicht, wenn seine Untergrenze höchstens 2 °C über der Temperatur liegt (Schichten addieren sich); ohne Bereich zählt die Klasse (warm erst ab 15 °C). Regen ab 30 % Wahrscheinlichkeit oder Schauer/Regen: Aussen braucht ein wasserdichtes Teil. Eine Lücke zeigt Text und „+ … dazu“ mit dem besten eigenen Teil (Bereich passt zuerst, dann die nächste Untergrenze, dann leichter), Toast mit Rückgängig | Noah, Antworten 2, 3, 12 |
| 9.10.2026 | **Temperatur-Kits (Noah 4, 5):** Kits sind Bausteine mit `minC`/`maxC` (null = offen: „unter 4 °C“, „über 25 °C“). Die Temperatur ist die kälteste Fahrstunde der Vorhersage (Fahrstunden ab Startzeit, Standard 08:00, für die Stunden pro Tag, Standard 6 h); ohne Stundenwerte der Tiefstwert des Wetters. Passen zwei Kits, gewinnt das kältere (kleinere Obergrenze); passt keins, das nächste. Ein Tippen fügt die fehlenden eigenen Teile des Kits ein (eine Änderung, ein Rückgängig) | Noah, Antworten 4, 5 |
| 9.10.2026 | **Kleidung im Rückblick (Noah 6):** „Zu kalt \| Passte \| Zu warm“ pro Tour als `debrief.clothing`. Die Verschiebung `clothing.offset` wird beim Speichern aus allen gespeicherten Rückblicken neu gerechnet (älteste zuerst, zu kalt +1 °C, zu warm −1 °C, passte 0, nie über ±3 °C); ein zweimal gespeicherter Rückblick zählt so nur einmal. Positiv heisst „du frierst schneller“: die Temperatur zählt kälter, die Kit-Grenzen rutschen nach oben. Leise im Kleiderschrank und beim Kit gezeigt | Noah, Antwort 6 |
| 9.10.2026 | **Import Schritt 2, Format (Noah 7–11):** Die Datei `gear-import` bekommt die freiwilligen Listen `kits` `[{ id: 'K1', name, minC, maxC, items: [sourceId…], note }]`, `blocks` `[{ id: 'F01' \| 'B01', name, items, note }]`, `tasks` `[{ id: 'A001', text, group }]`, `oldTrips` `[{ id: 'T001', name, date, note }]`. `date` ist null, ein Jahr („2025“) oder ein ISO-Datum; ein Jahr zeigt „2025“ und steht im Logbuch nach den genauen Daten dieses Jahres. Notizen dürfen Zeilenumbrüche haben. Teile werden über `sourceId`, `mergedIds` oder die App-ID gefunden; unbekannte IDs stehen leise unter „nicht gefunden“, nie als Fehler. Blöcke dürfen auch Taschen und Essen enthalten. Prüfung in `validateGearImport`: jede Liste muss eine Liste sein, jeder Eintrag braucht eine ID | Noah, Antworten 7–11; Koordinator 9.10.2026 |
| 9.10.2026 | **Import Schritt 2, Regeln:** zweiter Reiter auf „Import prüfen“, ein Knopf „Übernehmen“, Backup vorher, Rückgängig. Kits werden neue Bausteine mit Bereich. Ein Favoriten-Kit oder Excel-Baustein mit ≥ 70 % gleichen Teilen (gleiche Teile ÷ die grössere der beiden Listen) wie ein vorhandener Baustein bekommt „Zusammenlegen \| Neu \| Weglassen“ (vorgewählt Zusammenlegen); Zusammenlegen fügt die Teile hinzu und merkt die ID am Baustein (`mergedIds`). Alle anderen werden neu (Name besetzt → „Name (ID)“). Aufgaben: eine Vorbereitungsliste (`maintenance`, `list: 'prep-list'`), sie erscheint unter „Vor der Tour“ nur bei Events und Bikepacking-Touren mit mehr als 4 Nächten (Nächte = Tage − 1, ohne Übernachtung 0); die älteren Excel-Aufgaben bleiben nur für Events. Alte Touren: nur-lesbare Notizen im bestehenden Logbuch (`events`, `xl-<ID>`, `source: 'excel'`), eine Liste mit Suche. Erneuter Import ist idempotent über die IDs (K1, F01, B01, A001, T001): gleiche Einträge bleiben, geänderte Aufgabentexte und Touren werden an Ort und Stelle aktualisiert | Noah, Antworten 7–11 |
| 9.10.2026 | **Regenwahrscheinlichkeit (Noah 12):** Open-Meteo liefert jetzt auch Stundenwerte (`temperature_2m`, `precipitation_probability`); gespeichert pro Tag als `hourly` und als `forecast.rainPct` (max. % über die Fahrstunden), beim Übernehmen des Wetters auch als `wx.rainPct`. Ohne Stundenwerte zählt der Tageshöchstwert der Tourtage | Noah, Antwort 12 |
| 9.10.2026 | **0.43 Wiege-Modus (Noah):** ein Teil pro Bildschirm, nur ein Grammfeld (kein „Tasche minus leer“). Reihenfolge: Velos (ohne Gewicht oder nur geschätzt), Taschen der Taschenliste ohne eigenes Gewicht, dann Teile nach Gruppe Taschen → Schlafen → Aussenschicht (Schicht `outer`, oder Regen & Kälte ohne Schicht) → Mittelschicht → Rest; in der Gruppe nach Anzahl Touren + Vorlagen, dann Kategorie, dann Name. Taschen-Teile kommen auch mit Gewicht, solange es nicht in der App gewogen ist. Gespeichert wird `weightStatus: 'measured'` (der bestehende Wert für „in der App gewogen“; kein neuer Wert `weighed`). Velos bis 60 kg, sonst bis 30 kg | Noah: Taschen und Velos sind noch nicht gewogen; wenig Wirkung zuerst wäre Zeitverlust |
| 9.10.2026 | **0.43 Mehrfachauswahl (Noah):** Leiste mit „N ausgewählt“, die häufigsten Aktionen sichtbar (In einen Baustein; am Computer auch Standardtasche und Archivieren), der Rest unter •••. Kategorie und Reiseart im gleichen Zuweisen-Fenster wie Baustein und Tasche. Reiseart: „Auch diese Reiseart“ (Standard, nichts geht verloren) oder „Nur diese Reiseart“. Archivieren = Status „Weg“ wie bei einer Zeile. Jede Aktion eine Transaktion mit einem Rückgängig. Auch im Kleiderschrank (Schicht, Zone) und in einem Baustein (entfernen); keine neue Tabelle | Noah: soll ruhig bleiben, nicht kompliziert |
| 9.10.2026 | **0.44 Rückblick 12 Monate (Noah: „immer die letzten 12 Monate als Karte auf Heute und als eigene Seite“):** Der Zeitraum rollt: heute und die 12 Monate davor nach dem Datum des Geräts (`localday.js`), z. B. am 9.10.2026 vom 10.10.2025 bis 9.10.2026, beide Tage dabei. Eine Tour genau 12 Monate vorher (9.10.2025) gehört zu den 12 Monaten davor, damit sich die zwei Zeiträume nie überschneiden. **Eine Tour zählt nach ihrem Startdatum**: eine mehrtägige Tour, die vor dem Zeitraum beginnt, zählt ganz (Tage, Nächte, km) in den Zeitraum davor, auch wenn ihre letzten Tage hineinfallen; eine Fahrt (GPX) mit Tour geht mit der Tour, eine Fahrt ohne Tour zählt nach ihrem Datum. Eine Tour zählt, wenn sie nicht abgesagt ist und ausgewertet, als erledigt markiert oder vorbei ist (auch eine Tour aus einer Fahrt ohne Packliste). km: Rückblick-km, sonst Routen-km, sonst die verbundenen Fahrten. Nächte draussen: Tage − 1, nicht bei Unterkunft. Höhenmeter und Fahrzeit nur aus hochgeladenen Fahrten. Basisgewicht pro Tour mit den heutigen Gewichten der Teile (die App kennt keine alten Gewichte). Totes Gewicht wie überall: auf 2 oder mehr ausgewerteten Touren dabei und nie gebraucht. Unterschiede nur, wo beide Zeiträume eine Zahl über 0 haben und sie sich unterscheiden; was keine Daten hat, fehlt (keine Nullen). | Noah: Rückblick soll immer aktuell sein, nicht erst im Dezember |
| 9.10.2026 | **0.44 Karte auf Heute:** ruhig in der Spalte „Springen zu“, ohne Farbe und ohne Knopf, nur mit mindestens einer Tour oder Fahrt in den 12 Monaten. Sie **ersetzt „Saison in Zahlen“** (Kalenderjahr), damit Heute Touren und km nur einmal sagt; die Werkstattkosten stehen jetzt auf der Seite. Die Seite gehört zum Ort Touren und steht unter Mehr → Rückblick. Gekaufte Wünsche: neues Feld `boughtAt`, gesetzt, wenn ein Wunsch zu „Besitz“ wird; frühere Käufe sind nicht bekannt | „Jeden Inhalt einmal“ (L5); Antwort wartet nicht auf Dezember |
| 9.10.2026 | **0.45 Kleiderschrank 2, Entscheid 1 (Reihenfolge):** In jeder Zone von warm nach kalt: zuerst die höhere Obergrenze, dann die höhere Untergrenze; ein offener Rand zählt als ±∞; ohne Bereich zählt die Klasse (warm 15 °C und mehr, mittel 5–15 °C, kalt 5 °C und weniger); Teile ohne beides zuletzt, sonst nach Name | Noah, Entscheid 1 |
| 9.10.2026 | **Entscheid 2 (Lücken):** Der Kleiderschrank soll bis 0 °C wärmen (`COVER_TO`, gefühlt: mit der gelernten Verschiebung). Sieben Stellen: Basis, Mitte, Aussen (Oberkörper), Beine, Hände, Kopf, Füsse, je ab der Temperatur der Zwiebel (Basis ab 10 °C warm). Ein eigenes Teil (Besitz oder unklar) deckt, wenn `warmEnough` bei 0 °C ja sagt; ohne Bereich nur die Klasse „warm“ nicht (Unbekanntes löst keinen Alarm aus). Sonst eine ruhige Lücken-Zeile „Keine Handschuhe unter {n} °C“ ({n} = tiefste Untergrenze der eigenen Teile dort, ohne Teil die Starttemperatur der Stelle) mit „Auf die Wunschliste“ (Name, Schicht, Zone, Grund, Rückgängig). Ein Wunsch an dieser Stelle ersetzt den Knopf. Unter „Alltag“ keine Lücken. Regel rein in `wardrobe.js` (`wardrobeGaps`) | Noah, Entscheid 2; einfach gehalten |
| 9.10.2026 | **Entscheide 3, 4, 7 (bewusst nicht):** kein Wäsche-Status, kein Tragen-Zählen, keine Farb- oder Grössenfelder | Noah: der Kleiderschrank bleibt ruhig |
| 9.10.2026 | **Entscheid 5 (Outfit als Kit):** „Als Kit speichern …“ im Kleiderschrank: ausgewählte Teile oder „Vorschlag von heute“ (die Heute-Karte), Name und °C-Bereich (mindestens eine Grenze; „Vorschlag von heute“ setzt ±3 °C um die gefühlte Temperatur). Gespeichert genau wie die Temperatur-Kits: eigener Baustein in `settings.sets` mit `minC`/`maxC`, die Teile tragen den Schlüssel in `item.sets`; Planen schlägt es mit `chooseKit` vor. Rückgängig nimmt Baustein und Teile zurück | Noah, Entscheid 5 |
| 9.10.2026 | **Entscheid 6 (Foto):** freiwilliges Foto pro Kleidungsstück mit dem bestehenden `photo.js` (JPEG, längste Seite 1400 px), gespeichert am Teil als `item.photo` wie `bike.photo` (keine neue Tabelle, im Backup dabei); im Teil-Fenster nur bei Kleidern, klein im Kleiderschrank, entfernbar | Noah, Entscheid 6 |
| 9.10.2026 | **Entscheid 8 (Verschiebung sichtbar):** Oben im Kleiderschrank „Du frierst eher: +2 °C“ / „Du hast eher warm: −1 °C“, bei 0 nichts, mit „Zurücksetzen“ (Rückgängig). Damit ein Zurücksetzen hält, merkt der Datensatz `clothing.offset` `resetAt`; beim nächsten Rückblick zählen nur Rückblicke danach | Noah, Entscheid 8 |
| 9.10.2026 | **Entscheid 9 (Was ziehe ich heute an?):** Karte auf Heute in der Spalte „Springen zu“ für eine Tagestour am Wohnort (`homePlace`, gespeicherte Wohnort-Vorhersage): Tag wie der Tagestour-Knopf (ab 14 Uhr morgen, dann ab 8 Uhr), heute ab der laufenden Stunde (frühestens 8 Uhr), Dauer der letzten Tagestour, sonst 2 h. Kälteste Fahrstunde − Verschiebung; pro nötiger Zwiebel-Zeile (Beine immer) das beste eigene Teil, sonst „nichts warm genug“. Nur mit eingeordneten eigenen Kleidern; ohne Wohnort oder Vorhersage ein kurzer Hinweis mit Ortssuche; ein Knopf | Noah, Entscheid 9 |
| 9.10.2026 | **Entscheid 10 (Alltag):** Bisher zeigte „Alle“ jedes Kleidungsstück. Neu: Ein Teil, dessen einzige Reiseart Alltag ist, steht nur unter „Alltag“, nicht unter „Velo“ (wie bisher) und nicht mehr unter „Alle“. Ein Teil mit Alltag und einer anderen Reiseart steht überall; „Alle“ zeigt auch Ski- oder Wander-Kleider. Für Lücken, Zwiebel-Vorschlag und Heute zählen reine Alltagskleider nie | Noah, Entscheid 10 |
| 9.10.2026 | **0.45 Import prüfen (Koordinator):** Die Zeile unter dem Dateinamen sagt nach einer Übernahme „übernommen {Zeit}“ statt „noch nichts übernommen“; eine Übernahme, die nichts ergänzt (0 ergänzt, 0 neu, 0 Learnings), sagt „Nichts zu ergänzen: alle Teile waren schon vollständig.“, Rückgängig bleibt | Abnahme-Befund |
| 9.10.2026 | **0.45 Abnahme-Nachträge 3–6 (Noah):** (3) Kleine Knöpfe (`.btn.sm`, „Auswählen“ und Umschalter im Material) auf Touch 44 px statt 40 px (ersetzt die 40-px-Regel von 0.27). (4) Die Plätze der Velo-Zeichnung (16–28 px) bekommen auf Touch eine unsichtbare Tippfläche bis 44 × 44 px; wo zwei sich überschneiden würden, wird der Raum in der Mitte geteilt (`bikes/tap.js`); die Liste unter der Zeichnung bleibt. (5) Nach „Tour erstellen“ geht der Fokus auf den Namen der neuen Tour (Überschrift), damit ein Screenreader ihn ansagt. (6) Kategorie-Köpfe im Material unter 480 px: Anzahl-Zeile unter dem Namen, Gewicht rechts, zwei statt vier Zeilen | Noah, Abnahme-Nachträge |
| 9.10.2026 | **0.46 Startseite neu, Antworten (Noah):** 1a Gruss mit Wetter und Vorschlag für heute oben; 2b die Seite darf scrollen, aber am Computer (1440×900) sind Gruss, Tourkarte, „Was willst du tun?“ und „Heute wichtig“ ohne Scrollen sichtbar, am Handy (390×844) Gruss, Tourkarte und die 8 Knöpfe; 3a Testtouren (Name mit „test“) sind nie die nächste Tour, Aufräumen = archivieren mit Rückgängig, Frage auf der Seite statt `confirm()`; 4b zwei neue Farbwelten Gletscher und Sandstein, Klassisch bleibt; 5a dunkel automatisch nach System, dazu im Mehr-Menü Farbwelt und Hell/Dunkel (System/Hell/Dunkel); 6–33a wie im Entwurf (u. a. 12 Knöpfe Computer / 8 Handy, erste vier fest, Rest nach Nutzung `homeUsage`, Zahlen nur wenn etwas zu tun ist, „Heute wichtig“ höchstens 3 Zeilen mit direktem „Geölt ✓“, „Schon probiert?“ mit Stufen 0/6/11/16 genutzte Funktionen, Velos als 4 kleine Karten ohne Pillen, 12 Monate mit Serie, Meilenstein einen Tag, abends Rückblick und Akkus zuerst, „Startseite anpassen“ mit `homeLayout`, die Suche als Befehlszeile); 34b „Gut zu wissen“ und „Ausserdem zu tun“ entfallen, ihr Inhalt geht in „Heute wichtig“ und „Schon probiert?“ | Noah sieht Heute 50-mal am Tag; die alte Seite war zu gross und zu voll |
| 9.10.2026 | **0.46 Standard-Farbwelt:** Gletscher + System, als je eine Zeile `DEFAULT_PALETTE` / `DEFAULT_MODE` in `src/lib/theme.svelte.js`; gespeichert pro Gerät (`theme.palette`, `theme.mode`), gesetzt als `data-palette`/`data-theme` auf `<html>` vor dem ersten Zeichnen | Noah kann den Standard noch wechseln |
| 9.10.2026 | **0.46 Nachträge Browser-Test (Koordinator):** G010 eine laufende Tour heisst auf der Karte „Unterwegs · Tag 2 von 3“, nie „Nächste Tour“; G011 der Backup-Satz setzt die Leerzeichen selbst; G003 die neuen Heute-Teile brechen Wörter mit `overflow-wrap: break-word`, nie `anywhere` (andere Seiten macht 0.45.1) | Gesamttest Runde 1 |
| 9.10.2026 | **0.45.1 G001 Doppel in einer Import-Datei:** Eine Zeile, die gleich oder sehr ähnlich wie eine frühere Zeile derselben Datei ist (Name ≥ 0.8, gleiche Kategorie und Grösse) oder wie ein Teil, das eine frühere Übernahme dieser Datei angelegt hat, wird nie ein zweites neues Teil: sie ist «Unsicher» mit dem Grund «steht zweimal in der Datei» und der früheren Zeile als erstem Vorschlag | Befund Gesamttest; Noah entscheidet beim Prüfen selbst |
| 9.10.2026 | **0.45.1 G002 Vergangene Touren sind Geschichte:** Der Start und der Backup-Import nehmen feste Velo-Teile und Taschen nur noch aus laufenden und geplanten Touren; vorbei (Enddatum vor heute) oder abgeschlossen bleibt die Liste genau wie gepackt (nur das alte Format `container` → `slot` wird noch umgestellt) | Befund Gesamttest |
| 9.10.2026 | **0.45.1 Umbruch:** `overflow-wrap: break-word` statt `anywhere`: ein Wort bricht nur, wenn es allein nicht auf eine Zeile passt. Heute und «Gut zu wissen» bleiben bis 0.46 unverändert (paralleler Umbau). Unter 360 px rutschen Zahlen und Badges unter den Titel, statt ihn mitten im Wort zu brechen; Segment-Knöpfe sind mindestens so breit wie ihr längstes Wort und brechen sonst in eine zweite Reihe; nur wo ein einzelnes Wort seine Spalte sprengt (Taschennamen auf der Velo-Zeichnung), trennt `hyphens: auto` an einer Silbe. Auf dem Handy zeigt die Wunschliste das Schild «Wunschliste» nicht (dort doppelt), «Zu kaufen» bleibt | Befunde G004–G009 |
| 9.10.2026 | **0.45.1 G012 Material am Computer:** Eine offene Kategorie zeichnet zuerst 12 Zeilen und «Alle {n} zeigen» (erst ab 18 Teilen, damit nie nur wenige fehlen); «Springen zu», Suche und Filter zeigen alles; das Handy bleibt wie es war (zugeklappt) | 700 Zeilen auf einmal brauchten 3–6 s, jetzt rund 1.3 s im Test |
| 9.10.2026 | **0.45.1 G013a Velopflege bei kurzen Tagestouren:** Ist am Velo etwas fällig, zeigt «Vor der Tour» im Planen eine ruhige Zeile mit der Zahl und einen Link zur Velopflege des Velos, nicht die ganze Liste; ohne Fälliges bleibt es wie in 0.25 (nur der Startcheck) | Noah hat die Idee aus dem Gesamttest freigegeben |
| 9.10.2026 | **0.45.1 G014a Zusammenlegen am Handy:** «Zusammenlegen mit …» steht auch im Nur-Lesen-Teil-Fenster am Handy (44 px, ohne Hover); Zusammenlegen ist Aufräumen, kein Bearbeiten | Noah hat die Idee aus dem Gesamttest freigegeben |
| 9.10.2026 | **0.45.1 G015a Backup nur mit echten Daten:** Der Tipp-des-Tages-Speicher (`settings.tips`) ist Gedächtnis des Geräts: nicht im Backup, kein Grund für «Daten geändert» oder ein Ordner-Backup. Ein altes Backup mit `tips` lädt weiter; beim «Alle Daten ersetzen» behält das Gerät seinen eigenen. Zwei Backups ohne Änderung sind gleich | Noah hat die Idee aus dem Gesamttest freigegeben |
| 9.10.2026 | **0.45.1 Gesamttest in CI:** Die Browsertests unter `tests/e2e/gesamttest/` laufen in CI mit den anderen e2e (eigener Job, aufgeteilt); die Ladezeit-Grenze ist in CI grosszügiger, damit Last sie nicht kippt | Noah: Browsertests bleiben in CI |


## 9.10.2026: Problem am Velo (0.45.2)

- Mehrere Probleme aufs Mal aus dem Plus-Menü, einem Velo zugeordnet; eine Zeile = eine offene Reparatur (gleiche Form wie eine als „Reparatur“ eingeordnete Notiz). Foto nur beim ersten Problem. Vorgewähltes Velo: laufende Tour, sonst zuletzt gewählt (nur auf dem Gerät).
- Noah 1a 2b 3b: Die App ordnet ein (selber schnell / mit Anleitung / Werkstatt / Teil nötig), ein Tipp ändert; alles sofort gebaut ausser den Anleitungs-Links (kommen mit D2); Wiederholung ab 2× in 30 Tagen.
- Priorität ist beim Erfassen Pflicht (Noah 11:29), eine Deadline freiwillig: Keine, Vor der nächsten Fahrt oder ein Datum. Eine Priorität gilt für alle Zeilen des Formulars, danach pro Problem in der Velopflege änderbar.
- Basischeck vor jeder Fahrt (Noah: seine Liste gilt primär): Schloss, Mini-Rucksack, Flasche, Sonnenbrille, Cap, Windjacke; vom alten Check bleiben Helm/Schuhe/Handschuhe, Geräte geladen, Reifendruck, Handy/Portemonnaie/Schlüssel. Bei Tagestouren wartet er auf Unterwegs statt beim Packen abgehakt zu werden.

## 9.10.2026: Noahs Handytest von 0.45.2 (0.46.1)

- **Ein Problem = ein Eintrag:** Eine Zeile im «Problem am Velo» wird auch bei Kommas (nicht in Zahlen wie «2,5 bar») und bei « und » / « and » getrennt. Ein Stück ohne eigenes Thema mit höchstens zwei Wörtern («ersetzen», «schleift») bleibt beim Problem davor. Unter dem Feld steht vor dem Speichern «Wird als N Probleme gespeichert: …».
- **Velopflege:** Bei gleichem Rang (Arbeit nötig / überfällig bleibt oben) stehen die neuesten Probleme zuoberst (Erfassungstag, dann Nummer).
- **Priorität ändern:** Ursache am Handy: Das •••-Menü der untersten Zeile ging nach unten auf und lag hinter der unteren Leiste; die Änderung war zudem nur ein kleines graues Wort. Jetzt ist «Priorität: Mittel ▾» ein Knopf in der Zeile (Tipp, dann Hoch/Mittel/Tief, mit «✓ Priorität: Hoch»); das •••-Menü geht nach oben auf, wenn unten kein Platz ist, und hat am Handy 44-px-Knöpfe.
- **Regensachen und Nachtbrille:** Ein Teil mit «Bei Regen» (item.rain) kommt nur bei Regen mit, auch wenn es eine Kältegrenze hat (vorher: unter 5 °C auch trocken). Eine Brille für die Dunkelheit (Name mit Brille/Glasses und Nacht/klar/gelb) kommt nie wegen Kälte, sondern bei Regen (als Regenteil) oder auf der Fahrt-Seite, wenn ein Block in die Dunkelheit geht. Eine neue Tagestour übernimmt von der letzten nur die Temperaturen, nie den Regen. Noahs gespeicherte Teile bleiben unverändert. Analyse: `design/v0461/basischeck-analyse.md` (privat).
- **Suche am Handy:** offen ein ruhiges Blatt über die ganze Breite unter der oberen Leiste (Feld, darunter die Resultate), die Lupe wird zu ×.
- **Packlisten im Menü:** «Mehr» beginnt mit der Gruppe «Packlisten»: die Listen der laufenden und nächsten Touren (ein Tipp öffnet sie), «Neue Packliste», «Vorlagen für Packlisten», «Vergangene Touren». Keine Navigationsänderung sonst (die kommt mit D3).
- **«Touren» als Übersicht (Zwischenlösung bis zur vollen Touren-Einstiegsseite):** Der Ort «Touren» zeigt auf `#/trips` statt `#/pack`. Gruppen: Bald unterwegs (unterwegs oder fertig gepackt), In Planung, Rückblick offen, Gefahren (letzte 5, Rest unter Vergangene Touren). Jede Zeile hat einen Knopf nach dem nächsten Schritt («Weiter zu Planen», «Weiter zu Packen», «Unterwegs», «Rückblick», «Öffnen»). Die Zustände kommen aus derselben Regel wie die Liste «In Bearbeitung» im Tourband (`drafts.js inProgress`) und Vergangene Touren (`hubs.js pastTripList`). «Packlisten» im Menü bleibt daneben: die Listen direkt, dazu Vorlagen und Vergangene Touren. Alte Adressen `#/pack…` öffnen weiter eine Tour.

## 9.10.2026: Design-Release D1 «Aufpimpen» (0.47.0)

- **Antworten 1–11 gebaut:** 1a Zwiebel-Figur als Filter (Zone antippen, Schicht-Kacheln filtern); 2b Temperaturbalken plus kurzer Text «4–35°» pro Teil; 3b «Noch einordnen» als kompakte Liste mit einem Vorschlags-Chip pro Zeile; 4 zuerst tippen (der Chip ordnet mit einem Tipp ein, «anders …» öffnet Schicht und Zone); 5b vier schmale Schicht-Spalten am Computer (zwei ab 760 px, eine am Handy); 6a Lücke als ruhiger Hinweis in der Zone plus Markierung an der Figur; 7b Material mit schlanker Reiterleiste und kleinen Zählern; 8 a+b Velozeichnung mit Taschen und Gewicht oben auf der Tour, Setup-Foto als Umschalter, wenn eines da ist; 9a feste «Weiter»-Leiste am Handy (gab es schon); 10a «Jetzt fällig» als Karten in der Velopflege; 11a kleine runde Kategorie-Punkte.
- **12–20 später:** gehören zu D2–D5 (Einkauf, Lebenslauf, Heft, Vorschläge); nicht in 0.47.
- **Z-Antworten nicht angewendet:** Z3b, Z4b, Z11b, Z18b betreffen die Tafeln Einkauf, D5-Vorschlag und Heft, keine D1-Screens. Z10b («Was rechts steht», D5) hängt nur lose an der Gewichtskarte der Tour und wird mit D5 umgesetzt.
- **Velopflege-Schrift (Noah 16:58):** Ein Seitentitel, ein Kopfstil pro Velo und Abschnitt, eine Zeilenform (Titel normal/mittel, eine ruhige Unterzeile), ein Abzeichen (klein; warn/ok/neutral über Tokens), Zahlen rechtsbündig und gleich breit, Textlinks ruhig petrol ohne Unterstrich, keine fetten Listen. Gilt für Pflege-Reiter, Tour-Pflege, Fold-Zeilen und das Setup-Kopfband. Kein Verhalten geändert.
- **Regel «Eine Abarbeitungsliste leert sich selbst» (Noah):** eingeordnete Zeile geht (≈150 ms), die nächste rückt nach und bekommt den Fokus, Hinweis «✓ Name → Ziel · Rückgängig», leere Liste mit einer Zeile und einer Aktion. Pro Ort:
  - Kleiderschrank «Noch einordnen»: angewendet (Kern der Antwort 3b).
  - Inbox: angewendet. Eine eingeordnete Notiz ist erledigt; «Rückgängig» löscht, was sie angelegt hat (Reparatur, Teil, Learning, Rückblick-Notiz) und öffnet sie wieder.
  - Material → Prüfen («Hast du es noch?»): angewendet. Zeigte schon ein Teil nach dem anderen; neu kann jede Antwort zurückgenommen werden, der Fokus bleibt auf «Hab ich noch».
  - Nicht angewendet: Import prüfen «Unsicher» (Entscheide bleiben bis «Übernehmen» sichtbar und änderbar), Rückblick-Ausnahmen (Zustände wechseln im Kreis), Wiegen (geht schon weiter und hat Rückgängig), Velopflege «Ohne Daten» (Nachschlagen, nicht Abarbeiten), Packlisten und Materialliste (Zeilen sollen sichtbar bleiben, Abhaken ist ein Zustand).

## 9.10.2026: «Startseite anpassen» lesbar (0.46.2)

- **Fehler (Noah am Handy):** Die Namen der Abschnitte standen Buchstabe für Buchstabe senkrecht, die Liste wirkte leer. Ursache: Das Etikett in `src/lib/home/Customize.svelte` nutzte die Klasse `sw`, die `app.css` global als 10 × 10 px Farbfeld festlegt; die Breite von 10 px galt auch für das Etikett. Jetzt `tg`. Ein Browsertest prüft, dass jeder Name lesbar in seiner Zeile steht.
- **Lehre:** Ein Klassenname aus `app.css` darf in einer Komponente nicht für etwas anderes verwendet werden. Die «Wächter»-Tests (Skill packgenerator-einheitlich, kommt mit den Übergängen Teil 1) sollen das künftig automatisch finden.

## 9.10.2026: «Mehr» wieder ruhig (0.46.3)

- Noah fand die Touren-Einträge zuoberst in «Mehr» (0.46.1) unschön. Sie sind wieder weg; Vorlagen zurück unter Planen, Vergangene Touren unter Rückblick (Stand 0.46.0). Die Packlisten der Touren findet man über «Touren» (Übersicht nach Stand). Ein Mockup für das ganze Menü folgt mit Fragen.

## 9.10.2026: Im Flow – kleiner Start (0.51.0)

- **Fenster (1a):** Jedes Ziel ist ein gleitendes Fenster von N Tagen bis heute; «pro Monat» = letzte 30 Tage. Tägliche Ziele zeigen als Stand die erreichten Tage der letzten 7. «In N Tagen» auf dem Knopf steht nur, wenn ein Ziel mit Fenster über 7 Tagen in höchstens 7 Tagen ausläuft (Laufen), sonst «im Soll».
- **Saison (2a):** Pro Aktivität eine Menge Sommer-Monate (Rest = Winter), je mit eigenem Ziel; ein Halbjahr ohne Ziel = ruht («ruht bis 1. Nov.», am Handy eingeklappt, am Computer blasse Zeilen).
- **Liegestütze (3):** `perTap` = Menge eines Tipps (10); lange drücken: +10, +20 oder eigene Zahl.
- **Yoga (4a):** eine Aktivität mit Teilzielen (Yoga Studio, Zuhause); ein Tipp geht ans erste offene Teilziel, lange drücken wählt.
- **Pendeln (5a):** Jeder Tipp «Pendeln» ist ein eigener Eintrag (`via: 'commute'`) und zählt als eine Ausfahrt. Touren aus dem Pack Generator (nicht übersprungen, keine Test-/Archivtouren) zählen pro Tag, wenn «Velotour» unter «zählt auch» steht.
- **Sauna (6b):** fest Erholung, kein Nachfragen beim Abhaken.
- **Stoppuhr (7b):** Countdown auf die Zielzeit (Vorgabe = Mindestdauer der Aktivität, sonst 10 min), bei 0 Ende mit Schlussklang; «Fertig · abhaken» speichert die gelaufenen Minuten. Zeit immer aus Start, Pausen und Uhrzeit berechnet; verpasste Zwischenklänge nach der Bildschirmsperre werden still übersprungen, der Schlussklang kommt trotzdem.
- **Klangschale (8):** in `flowbowl.js` mit fünf unharmonischen Teiltönen, je zwei leicht verstimmte Sinus mit langem Ausklingen. Ton startet erst nach einem Tipp (Start, Pause). Zwischenklänge regelmässig, individuell (Minuten), zufällig (fester Seed pro Sitzung, mindestens 30 s Abstand).
- **Skala (9a):** eine Reihe à 10, unter 360 px höher (54 px) statt breiter.
- **4. Frage (10a):** Vorrat von 10 im Settings-Eintrag `flowQuestions`, reihum nach Tag (jede alle 10 Tage), im Tagescheck bearbeitbar.
- **Erreichbarkeit (11):** Karte auf Heute (Abschnitt `flow` direkt unter der Tour, auch in «Startseite anpassen») und «Mehr» → App → Im Flow; Wächter «Noch alles da?» prüft beide Wege (1 bzw. 2 Tipps). «Alle 16 Funktionen» bleibt bei 16.
- **Stoppuhr-Knopf schwebt nur auf Im Flow am Handy** (Mockup zeigte ihn auch auf Heute): auf Heute würde er dauernd Inhalte verdecken; am Computer steht er im Seitenkopf. Läuft die Uhr, schwebt die kleine Uhr auf jeder Seite.
- **Seed:** einmal, gemerkt im Settings-Eintrag `flowSeeded` (geht ins Backup). Ein Backup ohne Flow-Daten bekommt die Start-Aktivitäten wieder; wer alle löscht, bekommt keine neuen.

## 9.10.2026: Tagestour antippen (0.47.1)

- **Fakten der Tour als Chips (Noah a):** Datum, Dauer, Wetter und Velo in der obersten Karte sind antippbar und öffnen ein kleines Blatt mit nur diesem Feld (Handy von unten, Computer in der Mitte). Keine neue Speicherlogik: Datum über `change`, Stunden, Tage, Wetter und Velo über `changeContext` (wie das Tour-Fenster), also ziehen Mengen mit und «Rückgängig» gilt. Nur auf Planen (die anderen Schritte zeigen die Dauer nur an). Mehr Tage oder eine Nacht bleiben im Tour-Fenster (Link im Blatt), damit die Übernachtung nicht nebenbei falsch wird.
- **Keine Doppelungen (Noah b):** Eine Tour mit einem Tag ohne Nacht (99 % der Fahrten) zeigt kein Feld «Dauer» und «pro Tag»; mit Route steht dort nur «Route · km · Hm». Die grüne Karte «Tagestour erstellt» sagt nur noch, was gemacht wurde (Anzahl Teile), Velo, Datum, Stunden und Wetter stehen in der Karte darüber. Mehrtägige Touren unverändert.
- **Wetter-Schnellwahl (Noah c):** In «Ans Wetter angepasst» die Vorgaben aus `WX_PRESETS` plus Trocken/Regen als eine Reihe Chips; ein Tipp wendet an (Kontext-Änderung mit «Ganze Änderung rückgängig»). Die Karte steht bei Velotouren auf Planen immer da, damit die Wahl erreichbar ist.
- **10–16 statt 10–18 (Noah d), Ursache:** `forecastPreset` rundete die Wettervorhersage auf die nächste Vorgabe (Mitte 13 °C → «Mild» 10–18). Neu bleibt der Bereich der Vorhersage (ganze Grad); im Tour-Fenster erscheint er als eigener Chip «10–16° aus Vorhersage», wenn er keine Vorgabe ist. Ohne Vorhersage übernimmt eine neue Tagestour die Temperaturen der letzten Tagestour (seit 0.46.1); das wird jetzt als `wxFrom: 'last'` gespeichert und angezeigt («Wie deine letzte Tagestour»). Die Seite nennt immer die Quelle des Bereichs: Wettervorhersage, letzte Tagestour, Vorgabe oder von dir gesetzt. Ein von Hand gesetzter Bereich löscht `wxFrom`. Der Tipp «Wettervorschläge» zählt `wxFrom: 'last'` nicht als genutzt.
- **«Mehr» ohne Zahl (Noah):** Nur ein kleiner Punkt, wenn die Inbox etwas zum Einordnen hat; die Zahl bleibt im `aria-label`.
- **Inbox chronologisch (Noah):** Eine Liste für offene und eingeordnete Notizen, neueste zuoberst (nach Erfassungszeit). Das ändert die Regel «Abarbeitungsliste leert sich selbst» für die Inbox: Eine eingeordnete Notiz bleibt an ihrem Platz, ruhiger, und wird ein Link auf das, was aus ihr wurde (Reparatur → `#/bikes?tab=care&bike=…`, Wunsch → `#/gear?item=…`, Learning → `#/debrief/learnings`, Rückblick-Notiz → `#/debrief/<Tour>`); ohne Ziel (Erledigt, gelöschtes Ziel) bleibt sie eine Zeile. Fokus und «Rückgängig» wie in 0.47.0.
- **Velopflege neueste zuerst (Noah):** Teile in «Bald» und «ok» nach dem Datum der letzten Arbeit, neueste zuoberst (die ok-Gruppen nach ihrer neuesten Arbeit), bei gleichem Rang auch im Fälligen; der Verlauf eines Teils nach Datum, neueste zuerst. Das Logbuch war schon so.
- **Probleme flach (Noah):** Offene Probleme und Reparaturen aller Velos stehen als eine Liste über den Velos (`src/lib/care/ProblemList.svelte`), neueste zuoberst (Erfassungsdatum, dann Nummer), mit Chips für Velo und Lösungsweg und dem Abzeichen «Arbeit nötig», wenn fällig. Sie stehen nicht mehr im «Jetzt fällig» des einzelnen Velos (keine Doppelung); Priorität, Erledigt und ••• wie bisher. Beim Filter «Velomech» ausgeblendet (Probleme sind eigene Arbeit, wie vorher). Einen Gruppierungs-Umschalter gab es nicht.
- **Querformat:** Die Fakten-Chips sind im Querformat (Höhe unter 500 px) eine ruhige, unterstrichene Zeile mit 26 px Höhe und ohne Gewicht (steht in der Velokarte); das Band auf Planen darf dort 165 statt 150 px hoch sein (zwei kurze Zeilen Fakten). Der Hochformat-Handy-Wert bleibt 44 px.
- **Wächter:** Grundlinie nach dem Merge auf 0.47.0 neu gemessen (sie stammte von 0.46.2); 0.47.1 hebt keine Zahl, `src/App.svelte` fontsize 8 → 7.

## 9.10.2026: Material-Ansichten (0.47.2)

- **Ansichten statt Reiter (Noah 6a):** Sieben feste Ansichten mit Zahl. Die Zahlen gelten für das ganze Material (nicht für Suche und Filter), damit sie sich beim Tippen nicht verschieben. Meist genutzt = auf mindestens der Hälfte der Touren mit Rückblick *gebraucht* (Noahs Wortlaut «used on most trips»), mindestens 2 Mal. Bewährt = ab 5× dabei und mindestens 80 % gebraucht. Nie gebraucht = ab 3× dabei, nie gebraucht (so im genehmigten Mockup; der Rückblick 12 Monate zählt in seinem Fenster weiter ab 2×, weil er nur ein Jahr sieht). Kategorie und Tasche/Set bleiben Filter (Handy: Knöpfe ins Blatt, Computer: Seitenspalte). Sortieren und alle Filter in einem Blatt.
- **«Nie gebraucht» statt «Totes Gewicht» (Noah 7a):** überall im Text (Material, Neuigkeiten, Rückblick); die gespeicherten Schlüssel (`deadWeight`, `pack.dead`) bleiben. Pro Teil ein Satz: «4 Mal mitgenommen, nie gebraucht». «Zu Hause lassen» bleibt in der Ansicht. Die frühere Unterliste «Selten gebraucht» entfällt; die Punkte-Reihe zeigt es jetzt bei jedem Teil.
- **Karten · Liste (Noah 8a):** Karten sind Standard, die Liste ist die bisherige Kategorienliste (Wischen, •••, Mit Tasche). Beim Auswählen zeigt die Seite immer die Liste (die Zeilen haben die Kästchen). Die Wahl bleibt im Browser gespeichert. Die Tabelle aus D4 wird die dritte Wahl im selben Umschalter, noch nicht gebaut. Die Detailspalte rechts erst ab 1200 px; schmaler öffnet ein Tipp das Teil.
- **Nur was die Daten tragen (Noah 9a):** Punkte nur für Touren mit fertigem Rückblick der letzten 12 Monate. Leichtere Alternative nur aus «Kann statt … mitgenommen werden» (`altFor`) im eigenen Material. Gelernte Regel nur, wenn mindestens 2 Touren auf jeder Seite liegen und alle übereinstimmen (Temperatur: alle gebrauchten Touren kälter als alle nicht gebrauchten; Regen: bei jedem nassen gebraucht, bei jedem trockenen nicht). Alter nur mit Kaufdatum (`boughtAt`, entsteht beim Kauf aus der Wunschliste), Kosten pro Einsatz nur mit Preis. Kein «Zustand», kein Herstellergewicht, kein «Als Packregel»: dafür gibt es noch keine Daten bzw. keinen Ort.
- **Wiegen und Prüfen** sind keine Reiter mehr, sondern Modi (`#/gear?tab=weigh`, `?tab=check` bleiben gültig): «Wägen» im Kopf (Computer) und im •••-Menü, «Teile prüfen» im •••-Menü. Alte Adressen `?tab=wishlist`, `?tab=dead`, `?fav=1` öffnen die passende Ansicht; neu `?view=<name>`.
- **Seitentitel «Material»** wie im Menü (vorher «Ausrüstung»).

## 9.10.2026: Wetter-Chips setzen, •••-Menüs bleiben im Bild (0.47.3)

- **«Kühl + Regen» brachte nichts (Ursache):** Im Fenster «Neue Tour» schalteten die Wetter-Chips um. Hatte die Wettervorhersage schon «Kühl» und Regen gewählt, nahmen die Tipps auf «Kühl» und «+ Regen» beides wieder weg, und die Vorschau zeigte «Fürs Wetter: nichts zusätzlich». Die Logik in `layers.js`/`context.js` war richtig. Entscheid: Ein Wetter-Chip **setzt** nur (`dayride.js pickWxChip`), wie auf der Tourseite; Trocken und Regen sind zwei Chips statt eines «+ Regen»-Schalters. Damit das Wetter trotzdem immer abwählbar bleibt (Noahs Regel: Vorschläge sind nie zwingend und immer änderbar), gibt es den Chip **«Ohne Wetter»** im Fenster «Neue Tour» und auf der Tourseite («Ans Wetter angepasst» und das Wetter-Blatt der Tourkarte): Er nimmt Bereich und Regen weg, auch was die Wettervorhersage gewählt hat; ein anderer Chip setzt wieder. «Trocken» ist nur gedrückt, wenn ein Wetter gesetzt ist.
- **•••-Menüs im Bild:** Ein Menü neben seinem ••• wird verschoben (seitlich) oder nach oben geklappt (unten kein Platz), nie verkleinert (`src/lib/ui/inview.js`, Baukasten). Gilt für Packliste, Vorlagen, «In Bearbeitung» und Velopflege (deren eigenes «nach oben» aus 0.46.1 ersetzt). Ein Menü, das auch oben keinen Platz hat, bleibt unten (die Seite scrollt), damit es sein ••• nie verdeckt.
## 9.10.2026: R1 «Rückblick ruhig» (0.56.0)
## 9.10.2026: R2 «Tempo + Logbuch» (0.61.0)

- **Eigene Regel ab 5 Fahrten (Noah ★a):** `paceOf` (src/lib/pace.js) nimmt die gelernte Regel erst ab `PACE_MIN = 5` zählenden Fahrten (mind. 20 km); vorher die Standardregel und «Noch n Fahrten». Die Regel bleibt die von v0.19.0 (Faktor auf die Standardschätzung), der Satz rundet auf 0.5 km/h und 50 Hm. Alle Stellen, die `paceOf` nutzen (Packen, Unterwegs, Plan einer hochgeladenen Fahrt), wechseln damit automatisch.
- **Sichtbarer Vorschlag, nie erzwungen:** «Zurück zur Standardregel» speichert `standard: true` in der Einstellung `pace`; Fahrten hinzufügen oder entfernen behält die Wahl (`addToPace`, `dropFromPace`, Seite Tempo). Gewählte Standardregel ist kein offenes To-do mehr.
- **Logbuch = alle Touren:** die Touren und eigenständigen Fahrten des Rückblicks (`tripFacts`, ohne Test- und archivierte Touren) plus `db.events`; Notizen = Satz für nächstes Mal und Notizen unterwegs. Events zählen als Bikepacking (sie stammen aus dem Velo-Logbuch). Standard-Filter: alle Jahre (ein Tagebuch zeigt alles; der rollende 12-Monats-Zeitraum gilt für Zahlen und Diagramme).
- **Gelernt flach:** R1 hatte die Seite unverändert gelassen (zugeklappte Themen); jetzt Themen als Überschriften, alle Learnings sichtbar, Suche bleibt. Der Seitentitel heisst «Gelernt» wie die Karte im Rückblick.

## 9.10.2026: R1 «Rückblick ruhig» (0.49.0)

- **Vergangene Touren (1b):** überall eine Tabelle, auch am Handy. Am Handy bleibt die erste Spalte (Tourname) stehen (`position: sticky`), die anderen Spalten scrollen in der Tabelle; die Seite scrollt nie seitwärts (der Tabellenkasten ist `position: relative`, damit versteckter Bildschirmleser-Text die Seite nicht verbreitert). Spalten (2a): km, Hm, Zeit, Regen/trocken, Temperatur, Velo, 1 Learning oder Besonderes. Filter (3a): Zeitraum 12 Monate / Jahr / Alle, ein Knopf «Art» (Tagestour, Mehrtägig, Rennen, Ohne Velo, Mit Regen), Suche auch in Learnings.
- **Eine Seite «Rückblick» (4a-7a):** letzte Fahrt, «Letzte 12 Monate» rollend (umschaltbar Jahr = 1. Januar bis heute gegen dieselben Tage im Vorjahr, Alle ohne Vorjahr), «Touren im Vergleich» mit 7 kleinen Diagrammen + Tabelle, Basis letzte 10 Touren, «12 Monate», «Gleiche Art». Tempo, Logbuch, Gelernt eine Ebene darunter, Inhalt unverändert bis R2.
- **Umleitungen statt toter Links:** `#/review` und `#/debrief/compare` führen auf `#/debrief` (nav.js `redirectOf`, `history.replaceState`). Die Seite «Letzte 12 Monate» mit Packen- und Velo-Teil entfällt; diese Zahlen erzählen später D6 (Monatskarte, Jahresbrief).
- **Woher die Zahlen kommen:** km aus dem Rückblick, sonst den Fahrten, sonst der Route; Hm und Zeit in Bewegung aus hochgeladenen Fahrten (Hm sonst aus der Route); Regen und Temperatur aus der mit der Tour gespeicherten Prognose (1 mm oder mehr = Regen), sonst dem Packwetter; Learnings einer Tour über `source` = Tourname oder `rideId`. Unbekannt bleibt «–», nie 0.
- **Heute:** «Rückblick» führt auf die neue Seite, «Rückblicke» auf Vergangene Touren (dort ist ein offener Rückblick markiert), damit nicht zwei Knöpfe dasselbe öffnen. «Mehr › Rückblick» hat vier Zeilen statt fünf: Rückblick, Vergangene Touren, Learnings, Dein Tempo.


## 9.10.2026: Pflege-Übersicht, Teile pro Velo, Eingang und Notizen (0.57.0)

- **Eine Teileliste für alle Velos (Noah):** `care.js PARTS` ist die eine Vorlage. Jedes Teil hat einen Bereich (Rahmen & Federung, Antrieb, Bremsen, Laufräder, Cockpit, Extras, Checks). Sichtbar sind zuerst die Eckwerte, dann Kassette, Schaltwerk, Schalthebel, Kurbel, Innenlager und Kette, Bremse und Bremsscheibe vorne und hinten getrennt, Vorder- und Hinterrad, Reifen, Griffe und Sattelstütze. Unter «Mehr» stehen Rahmen, Dämpfer- und Gabel-Details, Sattelstützklemme, Akku, Steckachse, Sattel, Cockpit, Ladegerät und eigene Teile.
  - Die Reifen bleiben **ein** Teil mit Werten für vorne und hinten (`widthF`, `widthR`, `modelR`), weil Dichtmilch, Schlauch oder tubeless (`tyreSetup`) und die Wartung das ganze Paar betreffen.
  - Die alten Teile `brakes` (Bremsen entlüften) und `wheels` gelten als `legacy`. Sie verschwinden aus der Liste, sobald sie keinen Verlauf und kein Modell haben; mit Verlauf bleiben sie, damit der Lebenslauf erhalten ist.
  - Werkstattbesuche, die ein solches Teil nennen, holen es zurück (`withVisits`).
- **Datenblatt pro Teil:** Jedes Teil hat `model`, `weightG`, `material`, `notes` und typisierte `attrs` je Teil (Liste in `care.js`, Feld `attrs`). Pro Velo gibt es einen Block `geometry` mit 12 Zahlen. Leere Werte bleiben leer; die App erfindet keinen Wert.
- **Import «bikeSpecs» (Datenpanel), JSON-Form:**
  ```json
  { "kind": "bikeSpecs", "bike": "<Velo-Name>",
    "geometry": { "stack": 622, "reach": 450, "Lenkwinkel": 65.5 },
    "parts": [
      { "area": "Antrieb", "part": "Kassette", "model": "…", "weightG": 470, "material": "Stahl", "notes": "…",
        "attrs": { "Ritzel": "10-51", "Übersetzung": "520 %" } },
      { "part": "Scheibenbremse", "model": "…", "attrs": { "Kolben": 4 } },
      { "part": "Bremsscheibe vorne", "attrs": { "Durchmesser": 180 } },
      { "part": "Mein Kettenstrebenschutz", "model": "…" }
    ] }
  ```
  - Statt `bike` geht auch `"bikes": [{ "bike": …, "parts": …, "geometry": … }]`. Das Velo wird über den Namen gefunden.
  - Teil-, Attribut- und Geometrienamen dürfen die englischen Schlüssel (`cassette`, `cogs`, `stack`) oder die deutschen/englischen Namen sein.
  - Attributschlüssel:
    - Rahmen: `axle`, `clearance`.
    - Gabel: `travel`, `axle`, `stanchion`, `steerer`, `offset`.
    - Dämpfer: `travel`, `eye`.
    - Schaltwerk: `cage`.
    - Kassette: `cogs`, `range`.
    - Kurbel: `rings`, `ring`, `length`.
    - Innenlager: `standard`.
    - Bremse vorne/hinten: `pistons`.
    - Bremsscheibe vorne/hinten: `dia`.
    - Vorder-/Hinterrad: `axle`, `mount`, `inner`, `size`.
    - Reifen: `widthF`, `widthR`, `modelR`.
    - Steckachse: `axle`.
    - Cockpit: `dims`.
    - Sattelstütze: `travel`, `dia`, `length`, `insertMin`, `insertMax`.
  - **Vorne und hinten:** Ein Eintrag für beide («Scheibenbremse BR-…, 4 Kolben», «Laufräder», «Bremsscheiben») gilt für vorne **und** hinten; ein Gewicht für das Paar wird halbiert. Ein Attribut mit «vorne/hinten» (`Durchmesser vorne`) geht nur an die eine Seite. «Reifen vorne/hinten» gehen beide an das eine Reifen-Teil (`widthF`/`widthR`).
  - Unbekannte Teile werden eigene Teile (`own-<name>`, Bereich «Extras», unter «Mehr»). Unbekannte Attribute landen in `notes`.
  - **Nie überschreiben ohne Frage:** Ein gefülltes Feld mit anderem Wert wird ein Konflikt mit Häkchen im Bestätigungsdialog. Ohne Häkchen bleibt der alte Wert.
- **Velos vergleichen** (`#/bikes?tab=compare`, von Velos → Setup in 2 Tippern): eine Tabelle mit Eckwerten, Bereichen, Geometrie und «Mehr». Unterschiedliche Werte haben einen leisen Hintergrund (`--info-soft`). Ein leeres Feld zeigt «–» und lässt sich antippen. Am Handy ist die erste Spalte fix, die Tabelle scrollt in sich.
- **Startwerte (3 Schritte):** Das Kaufdatum gilt als Montagedatum. Die km beim Kauf und heute werden erfasst, dazu was seither neu ist. Daraus entstehen Einträge `{ action: 'replace', start: true }` (Wortlaut «seit Kauf»).
- **Pflege-Übersicht C:**
  - Ein Ring 0–100 pro Velo: der Anteil Teile ohne Fälliges; Bremsen und Antrieb zählen doppelt. Ohne Verlauf zeigt der Ring «–», nicht 100.
  - Höchstens 3 Karten «Jetzt fällig».
  - Probleme als eine flache Liste mit Filter «Offen/Alle» und Velo.
  - km seit Service, Velomech-Aufträge, Kosten im Jahr und ein Velo-Tagebuch mit höchstens einem Meilenstein.
  - Einziger Hauptknopf: «Arbeit eintragen».
  - Ersetzen und Warten sind geführte Abläufe (`PartFlow`). Eine Folgefrage (z. B. Kette über 0,75 %) wird ein offenes Problem.
- **Eingang statt Inbox:**
  - Neueste zuoberst, nach Tagen gruppiert. Offene und heute abgelegte Einträge stehen in einer Liste.
  - Heute Abgelegtes bleibt blass mit Ziel-Chip und «Rückgängig» bis Mitternacht, danach nur unter «Abgelegt» (Suche über Text, Laden, Velo, Betrag; Filter).
  - «Ablegen als …» hat 7 Ziele. Jedes merkt sich in `note.to.made`, was es geschrieben hat, damit «Rückgängig» es auch später zurücknimmt.
  - **Rechnungsbeleg** fragt nach Velo, Laden (aus früheren Besuchen), Datum und Betrag; die Arbeiten sind freiwillig. Daraus wird ein Werkstattbesuch mit dem Foto.
  - Ein Notiz-Eintrag mit «Einfach behalten» bekommt Status `kept` und ein Thema.
- **Werkstatt & Belege** (`#/bikes?tab=shop`, dritter Reiter unter Velos, pro Velo verlinkt in der Pflege): Velomech-Aufträge, Besuche nach Monat mit Belegfoto, Kosten im Jahr. Es gibt keine eigene Ablage-Seite.
- **Notizen** (`#/notes`, über Mehr → App):
  - 5 feste Themen plus #Tags, höchstens 3 angeheftet.
  - Schnellerfassung mit Text, Diktat (Web Speech API, nur wo der Browser es kann), Foto, Link (Titel und Adresse, nichts wird online geholt) und Checkliste.
  - «Aus Notiz wird …» legt eine Tour-Idee (eine Tour ohne Datum mit `idea: true`), einen Wunsch oder ein Problem an. Die Notiz bleibt und verlinkt dorthin.
  - Die Notizen sind im normalen Backup (Tabelle `notes`); dazu gibt es einen Markdown-Export.
  - Heute zeigt eine Zeile nur für eine angeheftete Notiz mit offener Checkliste.
- **TODO Texterkennung:** Eine Texterkennung auf dem Gerät (Betrag, Laden und Datum aus dem Belegfoto) ist im Browser nicht günstig zu haben. Tesseract.js wiegt mehrere MB und ist langsam am Handy, die Shape Detection API kann keinen Text in Chrome/Android stabil. Darum ist sie nicht gebaut; die Felder werden von Hand ausgefüllt. Wieder prüfen, wenn `TextDetector` breit verfügbar ist.
- **Bedienungsanleitungen** unter Werkstatt & Belege sind noch nicht gebaut (Roadmap).
## 09.10.2026 – 0.59.0 «Tauschen» (OP2a)

Noahs Antworten (alle a) zu den Bildern `design/optimierenPacken2/OP2-*`, nur Teil OP2a:

- **Kleider am Körper als erste Karte «Am Körper»:** Teile mit Platz «am Körper», die Kleidung sind (`isClothing`), nach Zone Kopf, Oberkörper, Beine, Hände, Füsse und darin Basis, Mitte, Aussen, Zubehör (`src/lib/swap.js` `wornClothes`). Sie stehen nur dort, nicht noch einmal in der Gruppe «Am Körper» der Taschen (die bleibt für Helmlampe, Rucksack usw. und fällt weg, wenn sie leer ist).
- **Ein Tipp auf ein Teil öffnet «Tauschen»** (`SwapSheet.svelte`), ein Tipp auf eine Alternative tauscht: zwei Tipps statt etwa sechs (herausnehmen, suchen, hinzufügen).
- **Reihenfolge:** zuerst «passt zum Wetter der Tour» (Bereich `trip.wx`, sonst die kälteste Fahrstunde; 2 °C Spielraum an beiden Grenzen wie bei `warmEnough`; Regenzeug passt weniger an einem trockenen Tag, eine Aussenschicht ohne Regenschutz weniger an einem nassen), dann öfter und zuletzt gewählt, dann der nächste Bereich. «Passt weniger» bleibt antippbar (Vorschläge sind nie erzwungen).
- **Ohne °C-Bereich** zählt die Klasse warm (ab 15 °C), mittel (5–15 °C), kalt (bis 5 °C), auch für den Balken (`tempKey`).
- **Jede Wahl wird gemerkt** in der Einstellung `swap.memory` ({ Teil: { n, at, c } }); «Rückgängig» nimmt den Tausch und die gemerkte Wahl zurück. Kein Feld an der Tour; der Eintrag merkt sich nur `swappedFrom` für «statt …».
- **Kleiderschrank mit Tourband** (`#/wardrobe/trip/<id>`): Bereich der Tour, Trocken/Regen/Egal (nur Ansicht, das Wetter der Tour bleibt), «Passt zu …» blendet ein unpassendes Teil nur aus, wenn am selben Platz (Zone und Schicht) ein passendes da ist; sonst bleibt alles sichtbar.
- **Nicht in 0.59.0:** «Outfit speichern» und Outfits lernen (D5).
- **Selbst entschieden (Schnellmodus):** Basis/Mitte/Aussen-Reiter im Tauschen-Blatt weggelassen (getauscht wird nur in derselben Schicht; Schicht dazu kommt mit OP2b); Teile, die schon auf der Tour sind, werden nicht angeboten; «Lieber einpacken in» im Blatt ersetzt «Verschieben nach» der alten Zeile; Zeilen am Körper zeigen ihren Grund («Unter 10 °C»); Kleiderschrank-Zeilen mit Tour zeigen «auf der Tour», ohne Tausch-Knöpfe pro Zeile (Tauschen bleibt in der Packliste).


## 9.10.2026: Material-Detail ruhig (0.63.0, Noahs Antworten 1a 2a 3a)

- **Teil-Fenster kurz (1a):** Oben stehen nur Name, Gewicht pro Stück mit Status (gewogen, aus einer Liste, nicht gewogen; bei Nicht-Besitz der Status dazu) und eine Zeile «Kommt mit: Standard · unter 10 °C · Satteltasche» (`src/lib/gear/detail.js` `comesLine`). Alles andere ist eine Klappzeile mit Kurzinhalt: Wo es hinkommt, Bausteine, Für Wetter und Fahrzeit, Name/Marke/Notiz (mit Kategorie, Status, Bereichen, Foto), In Vorlagen, Lebenslauf. Nur eine Zeile ist offen; die zuletzt geöffnete bleibt für die Sitzung offen (`sessionStorage pack.itemFold.item`). Bausteine starten zu. Kein Feld fällt weg. Die Detailspalte am Computer zeigt die Zahlen, die «Kommt mit»-Zeile und die Teile von «Lebenslauf» ebenfalls als Klappzeilen (eigene Merkung `pack.itemFold.panel`). Höhe des Teil-Fensters (Regenjacke, Testdaten): Handy 390 2241 → 704 px, Computer 1440 2377 → 689 px (alle Zeilen zu).
- **Leichtere Alternative (2a):** Zuerst die selbst verknüpften («von dir verknüpft»), dann höchstens 2 Vorschläge: vorhanden, gewogen, gleiche Kategorie (Kleidung: gleiche Zone und, wenn beide eine haben, gleiche Schicht; Kleidung ohne Zone bekommt keinen Vorschlag), leichter, aber mindestens 40 % seines Gewichts (sonst ist es meist etwas anderes, z. B. ein Kabel statt eines Velocomputers), die gewichtsnächsten zuerst. «Passt nicht» blendet einen Vorschlag für dieses Teil aus (Einstellung `altDismissed` {itemId: [ids]}) und ist rückgängig zu machen. Ein Vorschlag wählt nie etwas aus. Die Karte zeigt weiterhin nur die verknüpfte Alternative.
- **Leeres «Nie gebraucht» (3a):** Ein Satz zur Regel (ab 3× dabei, nie gebraucht), ohne Auswertungen der Hinweis, dass sich die Ansicht nach den ersten Tour-Auswertungen füllt, sonst wie viele Touren ausgewertet sind. Darunter «Auf dem Weg dahin»: 1–2× dabei und nie gebraucht, mit Zahl (`material.js` `onTheWay`).
- Der Bausteine-Katalog selbst blieb unberührt (paralleler Umbau); die Chips lesen die Bausteine wie bisher aus `allSets()`.
## 9.10.2026: Velo-Masse (0.65.0)

Noah: «wichtig ist mir zudem, dass zwingend die Sitzhöhe, der gewünschte Reifendruck, die Lenkerbreite … sowie weitere angezeigt werden».
- Jedes Velo hat einen Block **Masse** (EN «Fit and setup», `bike.fit`), auf der Velo-Seite oben, immer offen, nie unter «Mehr». Sitzhöhe, Solldruck vorne/hinten und Lenkerbreite stehen immer zuerst.
- Die Sitzhöhe wandert aus der Geometrie in die Masse; ein altes `geometry.seatHeight` wird weiter gelesen und von `updates.js fitMove2026` einmal verschoben (idempotent, ein schon getippter Wert in `fit` gewinnt).
- Solldruck = der gewünschte Druck (bar), nicht der gemessene. Der gemessene bleibt im Verlauf des Reifens. Beim «Druck geprüft» steht «Soll» neben «Zuletzt gemessen», die Felder sind mit dem Soll vorausgefüllt; der Basischeck nennt den Soll pro Velo.
- Selbst entschieden (Schnellmodus): zusätzliche Felder Rahmengrösse, Sattelversatz, Sattelüberhöhung, Vorbaulänge/-winkel, Kurbellänge, Reifenbreite v/h, Gabeldruck/-Sag, Dämpferdruck/-Sag; Federung in psi, Sag in %; Kurbellänge und Reifenbreiten leben weiter am Teil (Kurbel, Reifen) und werden nur gezeigt (ein Wert, ein Ort); Gabel- bzw. Dämpferzeilen nur bei Velos mit dieser Federung oder mit einem Wert; am Handy 2 Spalten, ab 900 px 4.
- Import `bikeSpecs`: `fit: {…}` (auch `masse`) mit englischen Schlüsseln oder deutschen Namen; unbekannte Schlüssel werden genannt und ausgelassen; ein anderer vorhandener Wert nur mit Häkchen.
## 9.10.2026: Bausteine neu und Bausteine prüfen (0.66.0)

- **Neue Schlüssel, alte bleiben (5a–8a):** `bivy`, `tent`, `hotel`, `repair`, `charge`, `lights`, `race`, `food`, `hygiene`, `comfort`. Die alten Schlüssel (`base`, `warm`, `sleep`, `light`, `lodging`, `gear.js OLD_SETS`) bleiben auf den Sachen, die App liest sie nicht mehr; ältere Versionen und Backups bleiben lesbar. Entfernen frühestens mit 0.57.
- **Abbildung im Update:** Basis/Schlafen → Biwak (Basis-Sachen als «vorgeschlagen» zum Prüfen); ein Zelt, Heringe, Footprint (nach Name) → Zelt; Licht → Licht; Unterkunft → Zelt (nach Name) oder Hotel/Hütte, was nicht eindeutig Hotel ist, bleibt vorläufig in Hotel/Hütte und steht unter «Noch zuordnen»; Warm → Temperaturregel (bestehende bleibt, sonst 10 °C) und zuerst in «Bausteine prüfen». Ein Backup von vor 0.55 (Ersetzen) läuft das Update erneut.
- **Fahrt-Bausteine (7a, 9a):** Reparatur und Laden kommen auf jede Fahrt, Licht nur in die Dunkelheit (ohne Ort zählt nur eine Nonstop-Fahrt als dunkel), Rennen nur mit Event. Abwählen pro Tour speichert `trip.sets[k] = false`. Komfort nie vorausgewählt, nur als einzelne Vorschläge im Fenster «Neue Tour». Erste Hilfe unverändert nur mit Nächten (10b).
- **Neue Tour mit Nächten:** «Biwak + Zelt» ist vorgewählt (wie früher «Draussen»). Eine ältere Tour oder Vorlage «Draussen» ohne Zelt-Angabe gilt als «Biwak + Zelt» (sie brachte das Zelt mit); nur `tent: false` ist Biwak allein.
- **Ältere Touren:** Eine spätere Änderung (Wetter, Stunden) bringt nur die Fahrt-Bausteine, die sie neu einschaltet (Licht in die Dunkelheit, Rennen mit Event); Reparatur und Laden kommen nicht ungefragt in eine Tour, die vor 0.55 erstellt wurde.

## 9.10.2026: Übergänge Teil 1 (0.67.0, Noahs Antworten Ü1–Ü12 alle a, U21–U26)

- **Ü1a Releases:** drei kleine Releases. Teil 1 (dieser): Baukasten, Wächter, Zwischenseiten, Zurück-Taste, Weitermachen auf Heute. «Was ist neu» und die Touren-Übersicht kommen mit Teil 2; Menü und Stilwelten gehen in D3 (Noah 10.10.2026 «Zusammenlegen»); Heute neu ist E1.
- **Ü2a Mitziehen:** nur was ein Release anfasst, kommt in den Baukasten. Die Wächter sind streng (Grundlinie 0) für den Baukasten, die neuen und die angefassten Tourseiten; alles andere steht als Liste «noch umbauen».
- **Ü3a Adressen:** jede Zwischenseite hat eine eigene Adresse `#/trip/<id>/packed | ended | debriefed`; Neuladen, Zurück und ein Link von Heute landen richtig.
- **Ü4a Wiederöffnen:** die App zeigt eine Zwischenseite nur direkt nach dem Schritt. Danach zeigt die Tour ihren Wartezustand: Unterwegs mit Countdown, Hauptknopf «Zur Startseite». Ob «Packen abschliessen» schon getippt wurde, merkt sich die Tour (`trip.packedAt`).
- **Ü5a Tagestouren:** nur «Tour beendet» mit Kurz-Rückblick («Alles gut» oder ausführlich), kein «Gepackt» und kein «Rückblick fertig».
- **Ü6a Vorabend:** nur in der App, ab 18 Uhr am Vorabend zuoberst auf Heute, wenn die Erinnerung der Tour an ist (`trip.remindEve`, Standard an).
- **Ü7a Zurück-Taste:** schliesst zuerst Dialog oder Blatt, die Eingaben bleiben (ein Verlaufseintrag pro offenem Fenster, `ui/backclose.js`). Velo bearbeiten speichert dabei, was getippt ist.
- **Ü8a–Ü12a** (Noch alles da?, Was ist neu, Abkürzungen in «Mehr», Stil pro Gerät, Velocomputer/Tageslicht): gehören zu Teil 2 und D3, hier nur festgehalten.
- **U21a:** nach dem Packen «Zur Startseite» als Hauptknopf, die Erinnerung am Vorabend als Schalter darunter (an).
- **U22 a+b:** «Tour beendet» erscheint nach «Letzten Tag abschliessen» und von selbst am Abend des letzten Tages (einmal, ab 18 Uhr). Das Öffnen beendet die Tour nicht.
- **U23a:** was in die nächste Packliste kommt, schlägt der Rückblick vor (wie bisher); «Rückblick fertig» zeigt, was gelernt ist.
- **U24b:** «Weitermachen» zeigt immer die nächste Tour, auch wenn gerade nichts zu tun ist; ohne nächste Tour die, deren Rückblick offen ist.
- **U25a:** in der Rückfrage «Tour jetzt beenden?» steht «Weiterfahren» oben (stark), «Tour beenden» rot darunter.
- **U26b:** der Hauptknopf auf «Gepackt» heisst «Zur Startseite».
- **Hauptknopf nach Phase (Befunde U001–U004, U008, U009, U013, U014):** der orange Knopf jeder Tourseite folgt dem Datum (vor / während / nach), nicht dem nächsten Tab. Eine leere Liste sagt nie «Alles gepackt, los». Regeln in `src/lib/phase.js` (`mainStep`), getestet in `tests/phase.test.js`.
- **Starttag:** bis «Packen abschliessen» getippt ist, bleibt Packen der Schritt (eine Tagestour, am Morgen erstellt). Gepackt führt eine Velotour am Starttag zu Unterwegs; auf Heute ist «Unterwegs» dann der Hauptknopf, ein offener Startcheck die Nebenzeile (U009). «Gute Fahrt!» erst ab dem Starttag (U001).
- **Tour beenden fragt** vor dem letzten Tag, und am letzten Tag, solange die geplante Fahrt noch vor einem liegt (Start der Etappe oder 08:00 plus Fahrzeit; ohne Angabe bis 14 Uhr). Am Abend fragt «Letzten Tag abschliessen» nicht (U22a).
- **Von selbst am letzten Abend** öffnet sich «Tour beendet» nicht für eine Tour, die heute erstellt wurde (wie der Fahrtag, Noah 6a); dort bleibt «Heute zurückblicken» auf Heute.
- **Zurück-Taste und Links:** schliesst ein Fenster mit einem Link oder öffnet es gleich das nächste («Neu» → «Tour planen»), bleibt die Adresse des Links und das nächste Fenster übernimmt den Verlaufseintrag.

## Arbeitsweise (9.10.2026, 23:26)

- **Entscheid:** nur ein Paket (höchstens zwei) gleichzeitig; vor jedem Release Mockups, Noahs Prüfung und a/b-Fragen, gebaut wird erst danach. Ersetzt den Schnellmodus. Details und verbindliche Anweisung: [Arbeitsweise](arbeitsweise.md).
- **Grund:** Drei Pakete parallel brachten Umnummerierungen und Funktionen ohne Design-Prüfung.

## Kurs-Check, Mockups nur hell, Gesamttest vor dem PR (10.10.2026)

- **Entscheid:** [Geplante Vorhaben](vorhaben.md) ist der Massstab, ob wir auf dem richtigen Weg sind; vor jedem Paket wird es geprüft, in jedem Release nachgeführt. Mockups gibt es nur noch hell. Vor jedem PR läuft der komplette Gesamttest lokal.
- **Grund:** Noah möchte die Übersicht als Basis behalten und den Kurs regelmässig prüfen; dunkle Mockups verdoppelten die Bilder; mehrere PRs wurden erst in CI rot.

## Fünf Orte statt Basecamp (10.10.2026)

- **Entscheid:** Die Seitenaufteilung wird neu: fünf Orte in der Leiste (Heute, Touren, Material, Velos, Aktiv) mit höchstens 4 Reitern pro Ort. «Ich» oben rechts ersetzt das Mehr, «+ Neu» ist ein runder Knopf unten rechts, am Computer gibt es eine Seitenleiste. Rückblick ist ein Reiter in Touren, Favoriten ein Filter in Material, Inbox im Ich und als Modul auf Heute. Fünf Orte kommt in zwei Releases (Navigation, dann Reiter mit Übergänge Teil 2). Details: [Geplante Vorhaben](vorhaben.md), Abschnitt D3.
- **Grund:** Das Mehr-Menü von D3 «Basecamp» war am Handy rund 2 200 Pixel lang, weil die täglichen Orte ins Mehr gerutscht waren.

## Testen vor dem Weiterbauen (10.10.2026)

- **Entscheid:**
  - Noah testet 0.67.0 am Handy und packt eine echte Tour mit der App, bevor weitergebaut wird. Fehler daraus kommen in ein kleines Fix-Release vor Fünf Orte.
  - Fragen zu einem Paket werden kurz vor dem Paket gestellt; gebaut wird erst nach den Antworten.
  - Der KI-Helfer bleibt bis nach E2–E4 geparkt.
- **Grund:** Prüffrage 5 im Kurs-Check: Die letzten grösseren Versionen wurden noch nicht auf einer echten Tour benutzt.

## Neu planen: Reihenfolge, Fragen pro Paket, Velo-Blätter (10.10.2026, 0.67.1)

- **Entscheid:** Fünf Orte kommt in zwei Releases (1 Navigation, 2 Tabs pro Ort samt Übergänge 2); Übergänge 2 ist kein eigener Release mehr. Vor Fünf Orte packt Noah eine echte Tour mit der App; eine Tagestour genügt, die Lücken kommen als einfache Liste. Davor kommen zwei kleine Pakete: 0.68 Q1 «Jeder km zählt» und 0.69 Velo-Blätter. D6 bleibt nach D2. Der KI-Helfer bleibt bis nach E2–E4 geparkt.
- **Entscheid:** Keine grosse Fragen-Runde mehr für alle Pakete. Pro Paket kommen kurz vor dem Bau höchstens 7 a/b-Fragen; das Aussehen folgt den ★-Vorschlägen, Noah prüft in der Vorschau. Ersetzt den Wunsch «alle Fragen in einer Runde» vom selben Morgen.
- **Entscheid:** Datumsfelder zeigen das Datum im Format der App mit Wochentag («Sa., 10. Okt. 2026»). Funde aus dem Handytest kommen als Kommentar auf die Trello-Karte des Releases und gehen in den nächsten Fix-Release.
- **Entscheid (Q1 «Jeder km zählt», Qualitätsmerkmal):** Jeder km jedes Velos ist nachvollziehbar: Fahrten-Buch pro Velo mit Quelle und Sicherheit, Strava-CSV mit Velo-Spalte bis E3, FIT-Import mit Sensor als Fingerabdruck, ein eigener Sensor und ein Garmin-Profil pro Velo, das Strava-Velo gilt mit Prüfung, unklare Fahrten zählen erst nach Bestätigung, Wochen-Karte auf Heute und Monatsbericht. Teile-km über mehrere Velos nur, wenn es einfach geht.
- **Entscheid (Velo-Blätter):** Aus der Abhol-Checkliste für den Bikemech werden Blätter, die sich aus den Daten der App füllen: eine Mappe pro Velo, Auftrag und Abhol-Check zusätzlich beim Werkstatt-Termin. Zuerst Velo-Pass, Service-Plan, Werkstatt-Auftrag und Abhol-Check; ansehen, als PDF teilen, Text kopieren. Häkchen im Abhol-Check bleiben gespeichert und werden zum Pflege-Eintrag. Noahs echte Werte kommen nur über eine private Import-Datei.
- **Entscheid:** Nach den Velo-Blättern folgt ein vollständiger UI-Test: alle Abläufe einmal komplett durchspielen, Fehler dokumentieren und selbst beheben; bei grösseren Entscheiden fragt Claude.
- **Grund:** Noah hatte bei 84 offenen Fragen den Überblick verloren. Er holt heute ein neues Velo ab und will dessen km und Werte von Anfang an sauber in der App.

## 10.10.2026: Q1 «Jeder km zählt» (0.68.0, Noahs Antworten 1–9 a, Q1.1–Q1.7 a)

- **Entscheid:** Die km eines Velos sind die Summe seiner Einträge im Fahrten-Buch (Fahrt, Startwert, Ablesung, Korrektur), je mit Quelle (FIT, Strava-CSV, von Hand, Strava, Zähler) und Sicherheit (sicher, wahrscheinlich, unklar, von dir). `bike.km` bleibt als Kopie der Summe, damit alle bisherigen Stellen weiterlaufen. Ersetzt den einzelnen km-Zähler.
- **Entscheid:** Zuordnung in dieser Reihenfolge: Sensor (sicher) › Strava-Velo (wahrscheinlich) › eine Profil-Regel (wahrscheinlich) › du. Widerspruch, ein Profil für mehrere Velos oder kein Hinweis heisst «unklar»; unklare Fahrten zählen erst nach deiner Wahl. Die Sportart entscheidet nie über das Velo (zwei Mountainbikes sind gleich «MTB»), sie filtert nur Läufe und Ähnliches aus.
- **Entscheid:** Ein unbekannter Sensor wird beim ersten FIT-Import einmal gefragt («Zu welchem Velo gehört der Sensor …?»); die Antwort wird eine Regel (Sensor → Velo), die im Import änderbar ist und danach von selbst gilt. Gleich für ein unbekanntes Strava-Velo.
- **Entscheid:** Doppelte (gleiche Strava-ID oder gleicher Tag, km innerhalb 3 % bzw. 1 km, Start innerhalb 30 Minuten) werden zusammengeführt; was schon im Buch steht oder vor dem Startwert liegt, wird nicht nochmals gezählt. Jeder Import lässt sich als Ganzes rückgängig machen.
- **Entscheid:** Q1 ist pro Velo an, sobald es Fahrten im Buch hat (Antwort 6a), und lässt sich pro Velo ausblenden. Startpunkte für Teile sind ein Vorschlag, nie Pflicht; ein Teil von einem anderen Velo bringt «km schon am Teil» mit (Schritt 3 in einfacher Form, ohne automatisches Umziehen).
- **Grund:** Noah holt ein neues Velo ab und will dessen km von Anfang an lückenlos und nachvollziehbar; die Strava-Werte weichen heute ohne Erklärung ab.

## 10.10.2026: Velo-Blätter Teil 2 (0.70.0, Noahs Antworten W1–W7 a)

- **Entscheid (W1 a):** Der Einfahr-Plan erscheint von selbst bei einem neuen Velo (unter 500 km), vorne in der Mappe; nach dem ersten Service geht er weg. Über «Blätter wählen» bleibt er erreichbar und ausblendbar.
- **Entscheid (W2 a):** Häkchen im Einfahr-Plan bleiben auf dem Velo gespeichert (mit Datum und km); «Abgehakte in die Pflege übernehmen» macht daraus Pflege-Einträge «von mir», mit Rückgängig.
- **Entscheid (W3 a):** Ein fälliger Einfahr-Schritt (km oder Datum, was zuerst kommt) erinnert auf Heute; «später» und im Blatt abschaltbar.
- **Entscheid (W4 a):** Das Repair-Kit ist pro Art der Fahrt umschaltbar (Feierabend-Runde, Tagestour, Mehrtägig).
- **Entscheid (W5 a):** «Auf die Packliste …» nimmt die fehlenden Teile auf die nächste Tour mit diesem Velo, jedes abwählbar.
- **Entscheid (W6 a):** Garantie: Erinnerung 30 Tage vor dem Ablauf auf Heute; Kalender nur, wenn eingeschaltet.
- **Entscheid (W7 a):** Die Rahmennummer steht im PDF und im kopierten Text (für Polizei und Versicherung) und bleibt sonst nur auf dem Gerät.
- **Entscheid (selbst):** Alles in `bike.sheets` (keine neue Tabelle); das Kaufdatum ist das bestehende `bike.bought`; Garantie-Jahre sind Vorschläge (Rahmen 5, sonst 2 Jahre); ein mit «hinzufügen» erfasstes Teil kommt als vorhanden und «noch zu wiegen» ins Material; Diebstahl-Fotos landen bei den Fotos des Velos (nie als Hauptfoto); «später» wartet eine Woche. Der Schritt «In der App als gestohlen markieren» aus dem Mockup ist ersetzt durch «Velo-Läden in der Nähe informieren» (es gibt keinen Gestohlen-Zustand in der App).
- **Grund:** Das neue Fully kommt nächste Woche: sauber einfahren, unterwegs das richtige Werkzeug, Garantie und Belege nicht verpassen, bei Diebstahl sofort bereit (Ziel 2 «Das Velo im Griff haben»).

## 10.10.2026: Regel «Fahrt-Typ» im Import (0.69.1, Noahs Entscheid zur Datenbasis 10.10.2026)

- **Entscheid:** Jedes Velo hat bei Noah einen eigenen Garmin-Fahrt-Typ (Gravel → Gravel Ride, MTB → Mountain Bike Ride, E-MTB → E-Mountain Bike Ride, Arbeitsweg → Ride). Der Import kennt darum eine vierte Regel-Art «Fahrt-Typ» (Fahrt-Typ → Velo). Reihenfolge jetzt: Sensor (sicher) › Strava-Velo › Profil-Regel › Fahrt-Typ-Regel (je wahrscheinlich) › du. Ersetzt den Satz «der Aktivitätstyp entscheidet nie» aus 0.68.0.
- **Entscheid:** Eine Fahrt-Typ-Regel zählt nur, wenn Noah sie selbst angelegt hat (nichts vorbefüllt, keine Namen im Repo) und nur für genau ein Velo. Sagt der Sensor, Strava oder das Profil ein anderes Velo, kommt die Fahrt zu «Prüfen». Bei einem Profil für mehrere Velos entscheidet eine Fahrt-Typ-Regel, die eines davon nennt.
- **Entscheid (selbst):** FIT-Dateien liefern den Fahrt-Typ in Strava-Wörtern (Sport/Unter-Sport → «Gravel Ride», «Mountain Bike Ride», «E-Mountain Bike Ride», «E-Bike Ride», «Ride»), damit eine Regel für beide Quellen gilt. Der Typ wird am Eintrag gespeichert.
- **Grund:** Bei Noah ist der Fahrt-Typ pro Velo eindeutig; ohne diese Regel landeten Fahrten ohne Strava-Velo und ohne Sensor immer in «Prüfen».

## 10.10.2026: Velo-Blätter (0.69.0, Noahs Antworten V1–V7 a)

- **Entscheid:** Jedes Velo hat eine Mappe mit Blättern (Vorschlag A): unter Velos › Setup unter dem Kopfband, im offenen Velo der Pflege als eine Zeile mit Links. Werkstatt-Auftrag und Abhol-Check stehen zusätzlich dort, wo die Werkstatt lebt (Pflege «Für den Velomech», Werkstatt & Belege); einen eigenen Termin-Datensatz gibt es noch nicht.
- **Entscheid:** Zuerst vier Blätter: Velo-Pass, Service-Plan, Werkstatt-Auftrag, Abhol-Check. Repair-Kit, Garantie & Belege, Diebstahl-Blatt und Einfahr-Plan folgen später. Jedes Blatt lässt sich ausblenden («Blätter wählen»).
- **Entscheid:** Ein Blatt lässt sich ansehen, als PDF teilen (Druckdialog des Geräts, nur das Blatt druckt, kein neues Paket) und als Text kopieren. Der Auftrag als Text ist deutsch (für den Velomech), mit km, Wünschen und «Bitte so lassen».
- **Entscheid:** Die Werte kommen aus den vorhandenen Daten (Masse, Teile-Angaben, Pflege, Fahrten-Buch); ein fehlender Wert ist eine leere Zeile «eintragen» mit Link dorthin, wo er bearbeitet wird. Drehmomente, Zugstufe und Sensoren hat die App noch nicht als Feld; sie stehen darum noch nicht im Velo-Pass.
- **Entscheid:** Die Häkchen des Abhol-Checks werden auf dem Velo gespeichert (`bike.sheets.pickup`, mit dem ersten Häkchen samt den Arbeiten des Auftrags). «In die Pflege übernehmen» schreibt pro abgehakter Arbeit einen Eintrag «Velomech», heute, bei den aktuellen km; ein ersetztes Teil hat damit seinen Startpunkt (Q1), der 1000-km-Check zählt für seine Prüfpunkte, eine Reparatur wird erledigt. Rückgängig ist möglich.
- **Grund:** Noahs Abhol-Dokument für den Bikemech soll sich aus der App füllen statt von Hand gepflegt zu werden (Ziel 2 «Das Velo im Griff haben»).

## 10.10.2026: Nächste Pakete, Fünf Orte, Velo-Blätter Teil 2, Inspiration (Noahs Antworten am Mittag)

- **Entscheid (Datenbasis):** Die Velo-Namen in der App heissen genau wie die Garmin-Aktivitätsprofile und die Strava-Velos. Jedes Velo hat einen eigenen Garmin-Fahrt-Typ. Die echten Namen liegen nur im privaten Ordner, nie im Repo. Darauf baut die Regel «Fahrt-Typ» in 0.69.1.
- **Entscheid (N1–N3 a):** Als Nächstes: Mockups für Velo-Blätter Teil 2; 0.69.1 bringt den UI-Test, den Fahrt-Typ als Hinweis und die Funde vom Handy; die Fragen zu Fünf Orte werden jetzt geklärt.
- **Entscheid (O1.1–O1.5 a, O2.1–O2.6 a):** Fünf Orte wie im Mockup: Tabs am Computer oben und in der Seitenleiste, Inbox als schmale Zeile auf Heute, «+ Neu» schlägt das Passende vor, grosser Titel am Handy, Material in Ocker; fehlende Tabs ausblenden, letzten Tab merken, Wischen am Handy, alte Links mit Hinweis.
- **Entscheid:** Fünf Orte wird gebaut, ohne vorher eine echte Tour zu fahren (Noah, 11:54). Was eine Tour später zeigt, kommt als Fix-Paket. Fünf Orte startet direkt nach dem Merge von 0.69.1, in einem neuen Thread.
- **Entscheid (W1–W7 a):** Velo-Blätter Teil 2 (Einfahr-Plan, Repair-Kit, Garantie & Belege, Diebstahl-Blatt) wie im Mockup, als 0.70.0.
- **Entscheid (Inspiration I1 b, I2 b mit Teilen von a, I3–I7 a):** Inspiration bekommt einen eigenen Platz in der Leiste. Die Ideenkarten und die Link-Sammlung kommen am Schluss zusammen mit Neuland; die vier Start-Packlisten und die Taschen-Tipps kommen mit D5. Nur Links und eigene Eckdaten, keine fremden Texte oder Fotos, keine Liste «Neu auf bikepacking.com».
- **Entscheid (Brainstorm der fünf Ideen, 12:08):** Im Flow beginnt mit beidem: Tagescheck mit Wochenzielen und Tennis-Seite mit Sporttaschen (IF1 a und b). Neuland ist Rückblick und Ideen-Motor zugleich (NL1 a und b); Neues erkennt die App aus den Strava-Routen (braucht den Server), von Hand eintragen geht auch (NL2 b und a). Die App ist ab jetzt die Hauptliste, die Excel braucht es nur noch für die alten Touren (XI1 a). Mehrfachauswahl kommt überall hin (Material, Vorlagen, Tour-Listen, Pflege) und mit dem Material-Paket D2 (MA1 b, MA2 a). Reihenfolge nach Paket 12: zuerst Neuland, dann Im Flow und Fotoalbum (R1 b). Für das Fotoalbum auf Heute zeichnet Claude neue Vorschläge (FA1).
- **Grund:** Noah will die nächsten Pakete klar geordnet und das neue Velo von Anfang an sauber in der App.

## 10.10.2026: Ruhige Startseite + Fotoband (0.73.0, Noahs Antworten «Heute ruhiger» 1–5 a, «Foto auf Heute» 1–4 a)

- **Entscheid:** Vorschlag A «Ruhige Karte»: Gruss in einer Zeile, Tourkarte direkt danach, Foto scharf (keine Deckkraft unter 1 auf Fotos in Heute), am Computer 300 px rechts in der Karte.
- **Entscheid:** «Vorschlag für morgen» ist mit einer Tour heute eine schmale Zeile unter der Tourkarte mit hellem Knopf; ohne Tour heute bleibt er gross neben dem Gruss.
- **Entscheid:** «Weitermachen» erscheint nicht, wenn die Tourkarte dieselbe Tour zeigt; für eine andere Tour und die Abend-Hinweise bleibt es. Ersetzt die Regel U24b aus 0.67.0 («immer die nächste Tour»).
- **Entscheid:** Fotoband am Handy (Vorschlag A aus «Fotoalbum neu»): 140 px mit Ort und Monat und «Album ›», die Karte liegt über seinem unteren Rand; ein anderes Foto erst beim nächsten Öffnen der App, kein Knopf «Anderes Foto». Ohne Foto kein Band.
- **Entscheid (selbst):** Am Handy kommt «Im Flow» nach den 8 Knöpfen, wenn es direkt davor steht (Regel 0.46: Gruss, Tourkarte und Knöpfe ohne Scrollen); am Computer bleibt Im Flow unter der Karte (0.51). Eine andere eigene Reihenfolge aus «Startseite anpassen» bleibt.
- **Entscheid (selbst):** Ein eigenes Album gibt es noch nicht; «Album ›» öffnet Velos › Setup des Velos mit aufgeklappten «Fotos». Ort = Name des Fotos (ein Kamera-Name wie «IMG_1234» → Velo-Name), Monat = Datum, an dem das Foto hinzugefügt wurde.
- **Grund:** Noah: Das blasse Foto aus 0.46/0.69 gefiel ihm nicht, und der grosse Vorschlag drängte die Tourkarte nach unten.
## 10.10.2026: Fünf Orte Teil 1, die Navigation (0.76.0)

- **Entscheid:** Die Leiste hat fünf Orte: Heute, Touren, Material, Velos, Aktiv. Aktiv öffnet Im Flow. «Mehr» ist weg; seine Seiten stehen unter ihrem Ort (Vorlagen, Rückblick, Vergangene Touren, Gelernt, Tempo unter Touren; Favoriten, Bausteine, Bausteine prüfen, Kleiderschrank unter Material) oder in «Ich» (Inbox, Notizen, Daten und Backup, Was die App kann). Die Suche findet sie alle und nennt den Ort.
- **Entscheid:** «Ich» ist eine eigene Seite (`#/me`), erreichbar über den runden Knopf oben rechts (am Computer neben der Suche). Ein Punkt zeigt offene Notizen in der Inbox, die Zahl steht im Namen des Knopfs.
- **Entscheid:** Am Handy und in schmalen Fenstern (unter 900 px oder quer gehalten) stehen die Orte unten, «+ Neu» ist ein runder Knopf unten rechts. Auf den Tourseiten mit eigenem Hauptknopf unten (Packen, Unterwegs, Zwischenseiten, ein Rückblick) fehlt der runde Knopf, damit nichts den Hauptknopf verdeckt.
- **Entscheid:** Am Computer ab 900 px eine Seitenleiste mit Logo, Suche, Ich, «+ Neu» und den Orten samt ihren schon gebauten Seiten. Was noch nicht gebaut ist (Neuland, Heft, Aktivität, Einkauf), bleibt ausgeblendet (O2.1a).
- **Entscheid:** Jeder Ort hat eine leichte Farbe (Heute türkis, Touren orange, Material ocker, Velos blau, Aktiv violett); sie tönt den Hintergrund ganz leicht und färbt den gewählten Ort in Leiste und Seitenleiste.
- **Selbst entschieden:** «Ich» zeigt ein Personen-Symbol statt eines Buchstabens (die App kennt keinen Namen). Velos › Masse führt in Teil 1 zu «Velos vergleichen», das die Masse aller Velos zeigt; Velos › Werkstatt zu «Werkstatt & Belege». Der Helfer erscheint in Ich erst, wenn er eingeschaltet ist. Tastenkürzel nur für das, was schon geht; Tabs 1–4 kommen mit Teil 2.
- **Entscheid (Noah, Karte «Weicht aus», 10.10.2026 16:25):** Auf Heute am Handy verdeckte der runde +-Knopf den achten Knopf von «Was willst du tun?». Der + tritt dort zur Seite, solange die 8 Knöpfe zu sehen sind, und kommt beim Scrollen zurück. Auf allen anderen Seiten bleibt er wie im Mockup.
- **Grund:** Das Mehr-Menü war am Handy zu lang, und die täglichen Orte gehören in die Leiste (Fünf Orte statt Basecamp, siehe oben).

## 10.10.2026: Feinschliff (0.75.0, Noahs Antworten D1–D4 a, Material-Detail 1–5 a, Umbenennen 1–5 a)

- **Entscheid (D1 a):** Bringt ein Import einen neuen Fahrt-Typ ohne Regel, fragt die App einmal, welches Velo dazu gehört, und merkt die Antwort als Regel. «+ Regel» bleibt. Der Vorschlag kommt nur aus dem Velo, das Sensor, Strava-Velo oder Profil schon bestimmt haben, nie aus dem Typ selbst.
- **Entscheid (D2 a):** Die 1'000-km-Prüfung bleibt, wie sie ist.
- **Entscheid (D3 a):** Alle kleinen Knöpfe haben am Handy eine Tippfläche von 44 px (unsichtbar vergrössert, `src/lib/ui/touch.css`).
- **Entscheid (D4 a):** Die stille Regel «Profil heisst wie ein Velo» steht als ruhige Zeile in der Regel-Liste.
- **Entscheid (Material-Detail 1–5 a):** Eine Zusammenfassung in einer Zeile im Teile-Fenster, Zeile «Gewicht» zuerst mit leichteren Alternativen («Als Alternative merken», «Passt nicht»), leere Ansicht «Nie gebraucht» mit «Auf dem Weg dahin», Übersicht in «Bausteine prüfen», Erste Hilfe auf jeder Tour (Tagestour: kleines Set, mit Nacht: volles Set, in Packen umschaltbar und abwählbar).
- **Entscheid (Umbenennen 1–5 a):** Ein Umbenennen-Blatt überall (Velo, Tasche, Material, Baustein, Aktivität, Foto): Stift öffnet es, Speichern über der Tastatur, Taste «Fertig», danach «Rückgängig» 10 Sekunden. Die Zurück-Taste von Android speichert in allen Bearbeiten-Fenstern (über `cancel`). Material lässt sich auch am Handy umbenennen. Setup bleibt beim umbenannten Velo. Das Tour-Band bleibt und bekommt nur das gleiche Rückgängig.
- **Entscheid (selbst):** Fenster für Aktionen (Ablegen, Vorlage, Startwerte, Teil) speichern bei Zurück nichts; nur Bearbeiten-Fenster behalten. Namensvergleich im Import zählt Leerzeichen im Namen einmal («Mtb  Fully Spark» = «mtb fully spark»).
- **Grund:** Noah: Namen ändern war je nach Ort anders, und am Handy ging Getipptes mit der Zurück-Taste verloren.

## 10.10.2026: Mockups immer auf einer Seite zeigen (Noah, Priorität 1)

- **Entscheid:** Jede Mockup-Runde kommt auf die eine Seite «Offene Mockups» (https://claude.ai/artifact/1EtKR7y8fYJheMwCeyWQyv), mit einem eigenen Abschnitt pro Runde. Computer und Handy stehen nebeneinander, mit einer Zeile «★ ist …» und einem Link zur Fragen-Karte auf Trello. Die Trello-Karte und die Antwort im Thread verlinken auf diesen Abschnitt. Ein Ordnerpfad allein reicht nie.
- **Grund:** Noah fand die Bilder im Projektordner nicht; es gibt keinen Web-Link zum Ordner, und die Anhänge im Thread sind begrenzt. Ohne sichtbare Mockups kann er sie nicht freigeben (Prinzip Nr. 1, Schritt 4).

## 10.10.2026: Claude veröffentlicht Releases selbst (Noah, 13:52; ersetzt um 14:16, siehe unten)

- Noah: «Ich erteile hier die Freigabe zum Veröffentlichen auf GitHub und Vercel für alle folgenden Releases.»
- Claude merged fertige Release-Pull-Requests selbst, sobald der Gesamttest lokal und alle Prüfungen auf dem letzten Commit grün sind. Ein rotes Vercel-Tageslimit hält nicht auf.
- Nie bei roten oder laufenden Prüfungen, nie Entwürfe oder geparkte Pull Requests (KI-Helfer #89). Ein Pull Request nach dem anderen.
- Danach wandert die Trello-Karte nach «Zu testen», und Noah bekommt eine kurze Zeile, was online neu ist.
- Die Mockups gibt weiterhin Noah frei (Prinzip Nr. 1).

## 10.10.2026: Noah merged wieder selbst, Mockup-Prüfung vor jedem Release (Noah, 14:16)

- Noah auf Trello: «ab sofort immer wieder selber mergen. und eine prüfung, dass ich die mockups für das geplante gesehen und kommentiert habe. vor jedem release … ab sofort und überall.»
- Das ersetzt den Entscheid von 13:52: Claude merged nicht mehr selbst. Claude bereitet den Pull Request bis grün vor und schickt Noah Link und Klicks.
- Vor jedem Release-PR prüft Claude, dass Noah die Mockups des Pakets gesehen und kommentiert hat, und nennt den Kommentar im Pull Request unter «Mockup-Prüfung».

## 10.10.2026: Kurs-Check 0.68 bis 0.73 (Noahs Antworten «1b 2b 3b 4a»)

- Reihenfolge nach Fünf Orte und Feinschliff: E1 Startseite, dann D5 Start-Packlisten, dann Neuland + Inspiration (1b).
- Kein fester Plan für eine echte Tour; Funde aus dem Alltag kommen nebenbei (2b).
- Der KI-Helfer (Wartungsvorschläge) wird direkt nach E1 eingeschaltet. Dafür setzt Noah den Anthropic-Schlüssel in Vercel (3b).
- Höchstens 2 Bauten gleichzeitig (4a).

## 10.10.2026: KI-Helfer früher, Hobby-Unterseiten vor D5 (Noahs Antworten «1b 2b 3», 14:33)

- Der KI-Helfer wird schon nach Fünf Orte Teil 2 eingeschaltet, also vor E1 (2b). Das ersetzt 3b aus dem Kurs-Check von 14:16.
- Die Hobby-Unterseiten im Ort «Aktiv» kommen gleich nach dem KI-Helfer, also vor E1 und vor D5 (1b). Sie brauchen zuerst Mockups und eine Fragerunde.
- Die ersten Unterseiten: Meditation, Velo, Yoga, Gym, Tennis und Liegestütze (3).
- Reihenfolge: Fünf Orte 1 + Feinschliff → Fünf Orte 2 → KI-Helfer → Hobby-Unterseiten → E1 Startseite → D5 → Neuland + Inspiration.

## 10.10.2026: Neue Reisearten (Noahs Antworten «1 plus Hochtour, Rennen/Event 2a», 14:40)

- Es gibt neun Reisearten: Weekend Sport Trip (2 Nächte), ein paar Tage Berge oder Stadt, Backpacking ab 10 Tagen, ein paar Monate auf dem Bike, Skitouren, Hüttenwanderung, Trail Running, Hochtour, Rennen/Event.
- Eigene Reisearten lassen sich als Vorlage anlegen (2a).
- Das ist ein Paket-Kandidat neben D5 Start-Packlisten. Zuerst kommen Mockups. Der Platz in der Reihenfolge ist noch offen.

## 11.10.2026: Schneller von der Idee zur Umsetzung (Noah, «1-5 a», 00:32)

- **1a:** ein kleines Release «Tests stabil» behebt die wackligen Tests, danach keine Reparatur-Runden mehr.
- **2a:** lokal laufen nur die eigenen Tests und die betroffenen Seiten; der volle Gesamttest läuft auf GitHub (ersetzt «kompletter Gesamttest lokal vor jedem PR»).
- **3a:** kleine Releases mit einer sichtbaren Sache statt grosser Pakete.
- **4a:** eine Mockup-Runde pro Paket mit höchstens 5 Fragen, gebaut wird direkt nach der Antwort.
- **5a:** zwei Bauten gleichzeitig nur, wenn sie verschiedene Bereiche ändern.
- Mockups bleiben immer, Noah merged weiterhin selbst.

## 11.10.2026: «Velo kurz» (0.95.0, App einfach «5a», Mockup D)

- **Anlass:** im Durchspielen war die Velo-Seite nach dem ersten Velo 3,9 Handy-Bildschirme lang (Mappe, 12 leere Masse, Zeichnung, Taschen, 7 Zeilen); Noah fand am 11.10.2026 den Strava-Import nicht (er lag unter Velos › Pflege › Velo öffnen). Noah «1a 2a 3b 4a 5a» (Trello bGBkdWXp), Mockup D.
- **Gebaut:** Velos › Übersicht zeigt unter dem Band nur drei Zeilen (Velopflege mit dem, was fällig ist; Taschen klappt Zeichnung und Standardtaschen auf; Ausstattung → Masse und Teile), den Knopf **Fahrten importieren** (Strava, Garmin) und die Zeile **Mehr** (Mappe mit den Blättern, Masse, Zeichnung, Wer schraubt, Vergleichen, Velodetails, Profil, Fotos, Ideen, Einstellungen, Taschen-Liste). Nichts ist weg. Ausstattung: fehlendes Gewicht oder fehlender Preis grau statt orange.
- **Selbst entschieden:** Der dunkle Knopf heisst «Fahrten importieren» statt «+ km eintragen» (Mockup), weil Noah den Import nicht fand; «km eintragen» bleibt in der Velopflege. Pflege selbst ist (noch) nicht gekürzt: eigenes kleines Paket, wenn Noah es will. Links, die in «Mehr» führen («Album ›» und «Idee gespeichert › Öffnen» von Heute, «Mappe», «eintragen» und «Werte ändern» in einem Blatt), öffnen «Mehr» gleich mit.

## 11.10.2026: «Kachel-Wand» (0.94.0, Noah «1-5 a» auf Trello nLi5yNmS, Mockups A–D `#startseite-kacheln`, «ok a» für einen grossen Release)

- **Anlass:** Noah lehnte «Startseite dicht» (PR #111, Entwurf) ab und wünschte eine Startseite aus kleinen Kacheln, die er selbst zusammenstellt. Antwort «1-5 a» am 11.10.2026 14:52 auf die Mockups A (fertige Wand), B (Anpassen), C (+ Kachel), D (Serie und Meilensteine); dazu die Ideen 1 («Neu»-Punkt), 6 (Ruhetag und Feier) und 8 (Wand im Backup). «ok a» 14:55: K1–K5 als **ein** grosser Release (Ausnahme von den kleinen Releases, gilt nur für Heute). K6 (Tipp der Woche, App-Symbol lange drücken) und K7 (Tageszeit, mehrere Wände, Kachel-Vorschlag) kommen später mit eigenen Mockups.
- **1a Vier Grössen:** klein (1 × 1), breit (2 × 1), gross, ganze Zeile. Computer 8 Spalten, Handy 4.
- **2a Anpassen:** Knopf «Startseite anpassen», am Handy auch lange drücken. Verschieben mit Griff oder ‹ ›, Grösse wählen, × nimmt weg, «Zurücksetzen» bringt die fertige Wand zurück. Die Kacheln selbst ruhen solange.
- **3a Fertige Auswahl** wie Mockup A; «+» am Ende öffnet den Katalog nach Bereichen mit Suche, ein Tipp fügt hinzu, ✓ nimmt wieder weg.
- **4a Eine Serie über alles:** Wochen am Stück mit einer Fahrt, einem Tourtag oder irgendeiner Aktivität von Aktiv; Stufen 2, 4, 8, 12, 26, 52, 104 Wochen, gefeiert in «Heute wichtig». Alle Meilensteine auf einer Seite (`#/flow/milestones`, oben Serie sowie Touren und Velos).
- **5a Deine Daten nach Ich › Daten und Backup;** die Backup-Erinnerung bleibt in «Heute wichtig».
- **Ideen:** «Neu»-Punkt zwei Wochen nach der Version einer Kachel; die Wand (`homeWall`) ist ein Einstellungs-Datensatz und reist mit jedem Backup; Ruhewoche hält die Serie, ohne zu zählen.
- **Selbst entschieden:** am Computer ist «gross» halbe Breite × 2 Zeilen und «ganze Zeile» die volle Breite; «Schon probiert?» bleibt als grosse Kachel; Ruhe**woche** statt Ruhetag (die Serie zählt Wochen); die Zeile «Letzte 12 Monate» zeigt dieselbe Serie über alles; das automatische Ordner-Backup startet beim App-Start (nicht mehr mit «Deine Daten» auf Heute); die Reihe «Was willst du tun?» mit «Alle 16» und das alte Anpassen-Fenster sind weg, die 16 Funktionen sind kleine Kacheln in fester Reihenfolge (keine Sortierung nach Tipps mehr, die Wand ordnet der Nutzer); Meditation in «Im Flow» öffnet das Startblatt; der Ruhewoche-Knopf steht auf der grossen Serien-Kachel und auf der Meilenstein-Seite; der runde «+» weicht auf Heute nicht mehr aus.

## 11.10.2026: «Meditation Wünsche» (0.93.0, Noah «1-5 a» auf Trello ZWyY4F4r, Mockups F–H)

- **Anlass:** Noahs Wünsche nach «Meditation einfach»: mehr Dauern, eigene Klänge einfacher, Vorlage aus einer neuen Sitzung, mehrere Uhren. Antwort «1-5 a» am 11.10.2026 auf die Mockups F (Neue Sitzung), G (Sanduhr), H (Vier Uhren).
- **Dauer:** 10 · 15 · 20 · 30 · 45 · 60 und ein Feld «oder frei» (1–600 Minuten), im Startblatt und in «Neue Sitzung»; «andere»/«…» fällt weg.
- **Klänge dazwischen:** keine · zufällig · eigene; «eigene» = «alle N Minuten» (1–60) oder «an Minute …». Alte Vorlagen mit «alle 5», «alle 10» oder «alle 7» werden «eigene · alle N» (gespeichert bleibt `mode: 'every'`).
- **Vorlage:** eine neue Sitzung fragt «Als Vorlage speichern?» mit einem Namensvorschlag aus Art, Dauer und Klängen; «nicht jetzt» blendet die Karte für diesen Besuch aus. Bestehende Vorlagen behalten Speichern und Löschen.
- **Sterne zuerst (Noahs Zusatz):** «Neue Sitzung» zeigt oben den nächsten Stern und die erreichten; die Zeile «Nächster Stern» der Meditations-Seite bleibt.
- **Vier Uhren:** Ring (wie bisher), Sanduhr, Mond, Zahl; die App merkt sich die Wahl (`flow.medClock`). In der Sanduhr kann die Zeit ausgeblendet werden (Noah).
- **Selbst entschieden:** am Handy keine Uhr auf «Neue Sitzung» (wie Mockup F), Marken setzt dort «an Minute»; eigener Klang pro Marke (langes Drücken) bleibt am Computer und Tablet. Titel «Neue Sitzung» statt «Intervalle» (bei einer Vorlage ihr Name), Zurück-Link «‹ Meditation» wie im Mockup. «nächster Gong in» heisst «nächster Klang in» (Mockup G/H). Der Fuss der Uhr bleibt «Bildschirm sperren ist ok · Einstellungen» statt «Die App merkt sich deine Uhr». Die Abzeichen zeigen die drei zuletzt erreichten Sterne. Der Hauptknopf bleibt `btn hi` (orange) wie überall, nicht das Grün der Mockups. Der Name einer eigenen Vorlage mit Marken endet auf «{n} eigene Klänge».

## 11.10.2026: «Rückblick antippen» (0.92.0, App einfach «4a», Mockup C)

- **Anlass:** im Durchspielen stand «nicht gebraucht», das Versprechen der App, zuletzt hinter «3 Teile gebraucht ›». Noah «1a 2a 3b 4a 5a» (Trello bGBkdWXp): **4a** = «nicht gebraucht» als antippbare Chips oben, «Was hat gefehlt?» und «Wie war's?» unter «Mehr», dann «Fertig».
- **Gebaut:** Karte «Was hast du nicht gebraucht?» mit einem Chip pro gepacktem Teil (Reihenfolge der Tour); Tipp = nicht gebraucht (durchgestrichen), nochmal = gebraucht. Darunter «{n} nicht gebraucht · {Gewicht} weniger beim nächsten Mal?». Rechts (Handy darunter) Zeilen: Was hat gefehlt? (am Computer offen), Wie war's? (Wetter, Kleidung, Essen, Taschen, km, Fahrt, Notizen unterwegs, ein Satz), Fürs nächste Mal (Vorschläge), alle Teile nach Tasche (auch «kaputt»). Der Haupt-Knopf heisst «Fertig».
- **Selbst entschieden:** «Fertig» bleibt am Ort des Haupt-Knopfs im Tour-Band (Computer oben rechts, Handy unten über der Leiste), wie auf allen Tour-Seiten. Der Hinweis «ZUERST» aus dem Mockup entfällt. «Kaputt» geht über die Zeile mit allen Teilen; ein kaputtes Teil zeigt sich im Chip rot. Die Vorschläge («Fürs nächste Mal») sind eine eigene Zeile statt einer offenen Karte, angehakte gelten wie bisher beim Speichern.
## 11.10.2026: «Import: alte Fahrten» (0.91.0, Noah «Fix bauen» 14:01)

- **Anlass:** Noahs erster echter Strava-Export (1319 Fahrten): 1000 alte Fahrten ohne Velo landeten unter «Prüfen». Strava setzt das Standard-Velo nur für neue Fahrten, und die Strava-Datei enthält kein Garmin-Profil. Ihre km stecken schon in den Startwerten der Velos; von Hand zugeordnet hätten sie doppelt gezählt.
- **Entscheid (Karte im Thread, «Fix bauen» ★):** Fahrten ohne Velo vor dem Startwert jedes Velos liegen als «schon in den km» zur Seite; ein von Hand gewähltes Velo prüft seinen Startwert auch. Als dritter Bau zugelassen, weil er nur den Import ändert.
- **Selbst entschieden:** Liegt eine Fahrt nur im Startwert eines Teils der Velos, bleibt sie unter «Prüfen» (sie kann zu einem Velo gehören, dessen Buch später beginnt). Velos ohne Startwert zählen für die Regel nicht. Zur Seite gelegte Fahrten fragen nicht nach einer Fahrt-Typ-Regel, damit «Welches Velo fährst du bei Ride?» nicht aus 1000 alten Fahrten gefragt wird.

## 11.10.2026: «Aufräumen und Ausprobieren» (0.88.0, App einfach «1a 2a 3b 4a 5a», Mockups F–H «0.88 alle a»)

- **Anlass:** Noahs Auftrag vom 11.10.2026 («für mich als Nutzer ist alles noch viel zu kompliziert»). Das Durchspielen mit seinem Backup zeigte: 21 von 27 Touren sind Tests, die App lernt daraus, und eine echte Tour verschwand von Heute, weil ein Test-Rückblick sie vor ihrem Datum beendet hatte.
- **App einfach 1a 2a 3b 4a 5a:** zuerst Aufräumen (0.88), dann Rückblick antippen (0.89), Velo kurz (0.90), Material Liste zuerst (0.91). **3b:** Neue Tour und Planen bleiben, wie sie sind.
- **0.88 1a:** gefunden wird alles mit «test» im Namen, mit Vorschau zum Abwählen. **2a:** archivieren statt löschen, die App lernt nicht mehr daraus, «Rückgängig» jederzeit. **3a:** Spielwiese mit erfundener Wochenend-Tour und «Tag spielen»; beim Beenden ist alles wie vorher. **4a:** ein Rückblick für eine Tour, die noch kommt, fragt zuerst; «Trotzdem» bleibt möglich. **5a:** «Wieder planen» für eine beendete Tour, deren Datum noch kommt.
- **Selbst entschieden:** Bausteine und Pflege-Einträge sind (anders als im Mockup F) nicht dabei: Bausteine haben kein Archiv, und bei der Pflege heissen echte Aufgaben oft «Testfahrt» oder «Test Spot Tracker». Material und Vorlagen zählen nur mit «test» am Wortanfang («Contest» nicht). Die Rückblicke gehen mit ihren Touren (eine Zeile statt einer eigenen Gruppe).

## 11.10.2026: «Meditation einfach» (0.86.0, Noah «1-5 a» 08:22, Mockups A–E «Ok» 09:35)

- **Anlass:** Noah 08:03 nach dem Durchspielen: «viel zu kompliziert». Antwort «1-5 a» auf die fünf Fragen, Mockups A–E am 11.10.2026 09:35 mit «Ok» freigegeben.
- **1a Startblatt:** ein Tipp auf Meditation in «Heute abhaken» öffnet ein kleines Blatt statt sofort abzuhaken: «Jetzt {n} Min», Dauer-Chips, «Nur abhaken», «Zur Meditations-Seite». Nur Meditation; die anderen Aktivitäten und das lange Drücken bleiben. Heute (Startseite) kann dasselbe Blatt später nutzen.
- **2a Seite kurz:** oben Start und Vorlagen, darunter drei Zeilen (Diese Woche, Protokoll, Nächster Stern), alles andere unter «Mehr» (`#/flow/act/meditation/mehr`), zugeklappt, nichts gestrichen.
- **3a Nach dem Gong:** sichtbar nur Satz, Tiefe und «Fertig»; Stimmung, was half, Art und «Als Nächstes» hinter «mehr erfassen». «Fertig» speichert; ohne Eingabe schliesst es nur. «Ohne Notiz schliessen», «Wo du stehst», Zitat, Vergleich und Fitbit-Zeile fallen weg.
- **4a Weniger Meta:** «Diese Seite kann», graue «geplant»-Zeilen (Fitbit, Strava, Kalender, Medien) und der Hinweis «wischen für den nächsten Tab» verschwinden auf Aktiv und allen Hobby-Seiten; das Wischen selbst bleibt.
- **5a Protokoll und Sitzung** bleiben wie sie sind, nur ohne «Diese Seite kann» und «geplant».
- **Uhr ruhig (Mockup D):** Restzeit einmal, «nächster Gong in m:ss», keine Legende, kein «0:01 von 20:00», am Handy kein «Beenden» oben; Einstellungen hinter «Einstellungen ›».

## 11.10.2026: Hobby-Seiten Teil 3 «Nach dem Gong» (0.84.0, umnummeriert von 0.82.0, H11a, H23a, H24a)

- **Auswertung (H11a):** öffnet nach jeder gespeicherten Sitzung als eigene Seite; «Ohne Notiz schliessen» führt zurück. Unter einer Minute bleibt es bei der kurzen Zeile.
- **Notiz (H23a):** Satz, Tiefe 1–5, Stimmung und «Was hat geholfen?», alles freiwillig und später änderbar (B5 «Bearbeiten»).
- **Als Nächstes (H24a):** ein Vorschlag: morgen zur gleichen Uhrzeit; nach einer langen Sitzung die kürzeste Vorlage. Kalender-Datei (.ics) in Zürcher Zeit; «keine Vorschläge» schaltet ihn ab (`flow.medNext`).
- **Protokoll:** Filter wirken auf Liste, Kalender und Grafik; Serien, Wärmebild, Tageszeit und Monatsvergleich zählen alle Sitzungen. Ein Filterwechsel ändert die Adresse ohne Sprung nach oben.

## 11.10.2026: Hobby-Seiten Teil 2 «Kissenzeit» (0.81.0, H1–H29 a)

- **Seite:** Meditation hat als erste Aktivität eine eigene Seite `#/flow/act/meditation`; die übrigen Kacheln öffnen bis Teil 3 weiter den Editor (H29a).
- **Sitzung:** läuft im ganzen Bildschirm (B7), am Handy ohne Navigation, nur «Beenden» oben (H26a). «Beenden» speichert ohne Nachfrage, was gelaufen ist (ab 1 Minute); bei Zeit um speichert die Sitzung sich selbst. Bis die Auswertung (B3) kommt, gibt es nur eine kurze Zeile.
- **Ton:** sieben Klänge ohne Datei (WebAudio), im Audio-Takt vorgeplant; Ende-Gong als Mitteilung nur, wo der Browser es kann und erlaubt hat, sonst ein ruhiger Hinweis (H27a).
- **Zitate:** nur gemeinfreie Texte in eigener Übersetzung (zitate.md, H28a); eigene Zitate und Links bleiben auf dem Gerät, keine Links voreingestellt.

## 10.10.2026: Hobby-Seiten Teil 1 (0.79.0, Noahs Antworten H1–H29 a)

- **Reihenfolge (H9a):** zuerst Aktivität-Übersicht und Meilensteine (0.79.0), dann Meditation B1–B7 (Teil 2), dann Liegestütze und Tennis, dann Yoga, Gym, Velo.
- **Tab:** «Aktivität» ist der dritte Tab von Aktiv (Heute · Ziele · Aktivität); «Heft» kommt erst, wenn es gebaut ist. Ein Editor, der von einer Kachel aus geöffnet wird (`?from=activity`), lässt «Aktivität» leuchten.
- **Meilensteine:** Stufen Anfang bis Weg, nur der nächste Stern sichtbar, ein erreichter Stern bleibt auch nach Änderungen an den Zahlen. Alles ist ein Vorschlag: Zahlen änderbar, Meilensteine ausblendbar.
- **H26a–H29a (Runde 4, 10.10.2026):** am Handy während einer Sitzung nur «Beenden» oben (Teil 2); Ende-Gong als Mitteilung auf gesperrtem iPhone (Teil 2); Zitate wie in B8 (eigene Übersetzung gemeinfreier Texte); Kacheln ohne eigene Seite öffnen den Aktivitäts-Editor.
- **Daten:** neue Tabellen nur dazu (Dexie v8), keine bestehende Tabelle umgebaut; Namen von Personen bleiben nur auf dem Gerät.

## 10.10.2026: Fünf Orte Teil 2 in einem Release (Noah, Karte 21:07)

- **Entscheid:** Teil 2 kommt als **ein** Release 0.78.0 (Tabs, Wischen, letzter Tab, alte Adressen, Was ist neu, Touren-Kacheln, Rückblick, Einkauf), nicht in zwei (Empfehlung war zwei).
- **O2.2a letzter Tab:** pro Ort in `localStorage` (`nav.tab.<ort>`); ein Tipp auf den Ort, auf dem man ist, führt zum ersten Tab.
- **O2.3a Wischen:** nur am Handy, waagrecht mindestens 60 px und doppelt so weit wie senkrecht, nicht auf Feldern, Dialogen und Streifen, die selbst seitwärts scrollen. Der Hinweis verschwindet nach dem ersten Wischen.
- **O2.5a Einkauf:** der Tab zeigt heute die Wunschliste (`#/gear?view=wish`); selbst eintragen, Verschleiss und Verbrauchtes kommen mit D2.
- **O2.6a alte Adressen:** `#/care` → Velos › Pflege (das gewählte Velo bleibt), `#/review` und `#/debrief/compare` → Rückblick, jeweils mit Hinweis zum Schliessen.
- **Ü9a Was ist neu:** als Blatt nur nach einem echten Update (eine frühere Version war gespeichert); ohne gespeicherte Version (erster Besuch mit Daten, Backup) bleibt die leise Zeile auf Heute.
- **Touren-Einstieg (T1–T20 a, U1–U5 a):** Bestwerte und Schnitt nur aus hochgeladenen Fahrten (GPX) und der GPX-Route einer Tour, nichts geschätzt; «diese Saison» heisst ab 1. Januar.
## 10.10.2026: KI-Helfer (0.77.0, Noahs Antworten 1a–8a)

- **1a Neue Tour:** Feld «Frag den Helfer» oben im Fenster «Neue Tour». Der Vorschlag ist eine Karte oben: verstandene Bedingungen als änderbare Chips (Tipp ändert oder lässt weg), die Bausteine, die er einschaltet, 4–6 zusätzliche Sachen aus dem **eigenen** Material mit Grund und ×, «Übernehmen» und «Verwerfen», grau «Vorschlag, du kannst alles ändern.» Übernommene Sachen stehen im Fenster als «Vom Helfer» mit × und kommen mit `src: 'helper'` auf die Liste; was die Bausteine ohnehin bringen, wird nicht doppelt.
- **2a Suche:** Der Helfer antwortet nur auf eine Frage (Text endet mit «?», kurz nach der letzten Taste, oder Enter auf einem Text, der wie eine Frage beginnt), nie bei jeder Taste. Die Antwort steht über den normalen Treffern; «Als Packliste vorschlagen» öffnet «Neue Tour» mit der Frage im Feld und holt den Vorschlag sofort.
- **3a Rückblick:** «Entwurf holen» im Bereich «Was war anders?» unter den Notizen unterwegs. Bis 3 Learnings aus den Notizen, je «Übernehmen» (gespeichert wie die eigenen Learnings, die Notiz gilt als beantwortet) und ×; eine Zusammenfassung in 2–3 Sätzen mit «Übernehmen»/«Bearbeiten» (sie wird der Satz «Für nächstes Mal»); grau «Entwurf, du entscheidest, was bleibt.»
- **4a Liste prüfen:** erster Eintrag im •••-Menü der Packliste und ein Knopf neben «Weiter: Packen». Drei Gruppen: Fehlt vielleicht (eigene Sachen zuerst, sonst ein allgemeiner Name, der die Suche öffnet) mit «Hinzufügen»; Doppelt mit «Entfernen»; Schwer mit «Entfernen», der Grund nennt eine leichtere eigene Alternative. Jede Zeile hat «Ignorieren».
- **5a Wartung:** Die Vorschläge stehen **in** «Jetzt fällig» unter Velos › Pflege (keine eigene Karte), mit Funkeln, einer Grundzeile, Status (bald fällig / prüfen; «ok» nie), «Als Aufgabe merken», «Erledigt», ×; grau «Vorschlag aus deinen km und Notizen, keine Werkstatt-Diagnose.» Ist ein Teil ohnehin fällig, steht die Zeile des Helfers in seiner Karte. Grundlage: km seit Ersatz/Service, Notizen und offene Probleme, nasse km, Höhenmeter, Teiltyp und Intervalle; konkrete Prüfungen (Kettenlehre 0,5/0,75, Beläge unter 1 mm, Mindestdicke der Scheibe, Reifenprofil/Schnitte, Alter der Dichtmilch).
- **6a Neu rechnen:** nach neuen km oder einer neuen Fahrt, höchstens einmal pro Tag und Velo. Zwischenspeicher auf dem Gerät (`meta` «helper.care»), Schlüssel Velo plus Prüfsumme seiner Daten.
- **7a Monatslimit:** in den Einstellungen, Standard CHF 5. Erreicht: Pause bis zum nächsten Monat mit einem ruhigen Satz. Der Server setzt es ebenfalls durch (429 `monthly_cap`, Zähler `helper:spend:JJJJ-MM`, Ausgaben in jeder Antwort).
- **8a Nicht eingerichtet:** alles wie bisher. Der Hinweis «Der Helfer ist noch nicht eingerichtet» mit «Einrichten» und «Was geht an Claude?» nur in «Neue Tour» und in den Einstellungen; sonst ist der Helfer unsichtbar.
- **Server:** `api/helper.js` (Vercel-Funktion ohne Framework, `fetch` an die Messages API, `anthropic-version: 2023-06-01`), gemeinsame Teile in `api/_lib/core.js` (aus dem geparkten Strava-Server). Zugang per Helfer-Code (Bearer, Vergleich in konstanter Zeit). Kosten aus `usage` mit Preistabelle und festem Kurs USD→CHF 0.9. Fünf Aufgaben mit je eigenem Prompt und striktem Tool-Schema; die Antwort wird geprüft, erfundene IDs fallen weg. Keine Anfragen im Log, gespeichert nur der Monatszähler. Keine `vercel.json`.
- **Datenschutz:** Pro Aufgabe nur die nötigen Felder (Allowlist, unit-getestet); nie Fotos, Belege, Geldbeträge, Werkstattnamen, Dokumente, Gesundheitsdaten, Namen von Personen oder den Helfer-Code im Inhalt. Der Server lehnt solche Felder zusätzlich ab (400 `forbidden_field`).
- **Selbst entschieden:** `tool_choice` «auto» mit Anweisung statt erzwungenem Tool (das Modell lehnt erzwungene Tools ab), fehlende Antwort = Fehler; keine Ersatzmodelle bei einer Ablehnung; Einstellungsseite `#/helper` unter Mehr › App; alle Helfer-Einstellungen nur auf dem Gerät (nicht im Backup); «Verbindung prüfen» als eigene Aufgabe ohne Kosten; Zusammenfassung → «Für nächstes Mal»; Sachen für Touren ohne Velo in die erste Tasche; Helfer-Code als Passwortfeld mit Zeigen/Verbergen.

## 10.10.2026: KI-Helfer in Fünf Orte (0.77.0, Noahs Antworten K1–K3 a)

- **Entscheid (K1 a):** Die Einstellungen des Helfers sind eine eigene Zeile **Ich › Helfer** (`#/helper`), immer sichtbar mit dem Zustand (nicht eingerichtet, eingerichtet, ausgeschaltet, Pause). Ersetzt «Einstellungsseite unter Mehr › App» (1a–8a) und «Der Helfer erscheint in Ich erst, wenn er eingeschaltet ist» (0.76.0, selbst entschieden): ohne Zeile fände man das Einrichten nicht.
- **Entscheid (K2 a):** «Frag den Helfer» steht oben in «Neue Tour» als eigene Karte über den Angaben zur Tour.
- **Entscheid (K3 a):** «Liste prüfen» am Handy als Funkel-Knopf links in der Weiter-Leiste neben «Weiter zu Packen»; am Computer «Liste prüfen» mit Text links neben dem Hauptknopf im Tour-Band. Dazu bleibt es der erste Eintrag im •••-Menü der Packliste (4a).
- **Selbst entschieden:** «Neue Tour» ist auf main noch ein Fenster (die Seite kommt mit Übergänge 2 / Fünf Orte Teil 2); die Helfer-Karte steht dort zuoberst und zieht mit, wenn das Fenster zur Seite wird. Das blasse Formular bis «Übernehmen» und «Daraus wird» aus dem Mockup kommen mit dieser Seite.
- **Selbst entschieden:** Am Handy bleibt «Material ergänzen» (+) in der Weiter-Leiste; der Funkel-Knopf steht ganz links davor. Der Knopf erscheint nur, solange der Hauptknopf «Weiter zu Packen» ist (vor dem Packen), wie im Mockup.
- **Selbst entschieden:** «Neue Tour» öffnet der Gesamttest und der Helfer-Test über Touren › «+ Neue Tour» statt über das •••-Menü. Die Kommentare im Code heissen jetzt «v0.77.0» statt «v0.67.0»; die Test-Daten-Datei heisst `tests/e2e/v0770-fixture.js`.
- **Grund:** Die Bilder von 1a–8a stammten aus der alten Navigation; K1–K3 legen fest, wo der Helfer in Fünf Orte sitzt (Mockups `design/ki-helfer/neu`).

## 10.10.2026: «Reisearten neu» ans Ende (Noah, Entscheidungskarte 16:38)

- **Entscheid:** «Reisearten neu» ist ein eigenes Paket am **Ende** der Reihenfolge, nach Neuland + Inspiration. Noahs Antworten 1–10 a (Trello-Karte 54fP2GQe), Mockups `design/reisearten`.
- **Grund:** Die Reihenfolge davor (Fünf Orte Teil 2, KI-Helfer, Hobby-Unterseiten, E1, D5, Neuland + Inspiration) bleibt; die neuen Reisearten bauen auf D5 Start-Packlisten auf.

## 11.10.2026: «Tests stabil» (Noah, «1-5 a», 00:32, Frage 1a)

- **Entscheid:** Ein kleiner Release 0.80.0 macht die automatischen Browser-Tests stabil, bevor das nächste Paket kommt. Die Tests warten auf ein Zeichen der App (`data-ready` nach dem Aufräumen der Daten, `data-today` nach Heutes Entscheid über Unterwegs) statt auf eine feste Zeit; ein gemeinsamer Helfer `tests/e2e/settle.js` ersetzt die kopierte Öffnen-Schleife für «Deine Daten».
- **Grund:** In den CI-Läufen vom 10.10.2026 schlugen Tests zufällig fehl und liefen erst im zweiten Versuch durch. Die Ursache war immer dieselbe: «Import fertig» hiess im Test nicht «App fertig». Stabile Tests machen jeden weiteren Release schneller.

## 11.10.2026: «Ausstattung» wie bei Canyon (0.83.0, Noahs Antworten A1–A5 «1-5a», 06:56)

- **Entscheid (A1a):** Der Velos-Tab «Masse» heisst «Ausstattung»: oben die Masse, darunter die Teile.
- **Entscheid (A2a):** Teile ohne Angaben sind pro Gruppe als eine Zeile «+ n ohne Angaben» eingeklappt.
- **Entscheid (A3a):** Jedes Teil hat einen Preis (CHF) mit Summe pro Gruppe und «Kaufwert» oben; fehlt er, steht «Preis +».
- **Entscheid (A4a):** Rechts «Gewicht pro Bereich» und «Teuerste Teile», am Handy darunter.
- **Entscheid (A5a):** «Velos vergleichen» zeigt nur Zeilen mit mindestens einem Wert, «alle zeigen» als Link; am Handy zuerst zwei Velos nebeneinander.
- **Selbst entschieden:** Die Gruppen tragen die bestehenden Bereichsnamen der App (Rahmen statt «Rahmenset»), damit Pflege, Vergleich und Ausstattung gleich heissen. Die Geometrie bleibt im Vergleich (nicht auf der Ausstattung). Kein Knopf «Datenblatt importieren» im Kopfband (der Import bleibt unter «Deine Daten»). Die Adresse `#/bikes?tab=compare` bleibt (alte Links landen auf der Ausstattung), der Vergleich ist `&view=all`. Der Link «Velos vergleichen» steht auf der Ausstattung einmal oben, nicht zusätzlich im Masse-Block.
- **Grund:** Noah (11.10.2026, nach dem Import seiner Velo-Daten): die Masse-Seite war eine lange Tabelle mit fast nur «–» und für ihn unübersichtlich; Vorbild ist Canyons Liste «Alle Komponenten».

## 11.10.2026: Bereiche sauber trennen (Noah «1-5 a», Trello YINDLpHj)

Vorschlag: https://claude.ai/artifact/8DQ6CKj1n9vJuBEwsj7msN. Noch kein Bau; vor B2 bis B5 kommt je eine Mockup-Runde.

- **Entscheid (1a) Grundmodell:** Ein Inventar. Jedes Teil hat genau eine Heimat (Bereich) und darf «auch für» andere Bereiche sein. Baut auf `item.domains` auf; ein Teil ohne Bereich bleibt Velo/Bikepacking. Gewicht und Pflege gibt es nur einmal.
- **Entscheid (2a) Überall:** Neuer Bereich «Überall» für Dinge, die zu keinem Sport gehören (Stirnlampe, Powerbank, Erste Hilfe, Ausweis, Every-Day-Carry). Die App schlägt den Umzug aus Velo vor, Noah bestätigt, mit Rückgängig.
- **Entscheid (3a) Anzeige:** Material bekommt oben einen Bereichs-Umschalter, Standard Velo, gemerkt auf dem Gerät. Ein neuer Bereich erscheint erst, wenn er Teile hat. Velo-Seiten (Velos, Pflege, Kleiderschrank mit Velo-Filter) zeigen nie Teile anderer Bereiche.
- **Entscheid (4a) Verbrauch:** Eigener Typ «Verbrauch» mit Bestand, Ziel, Ablaufdatum und Nachkaufen (fehlt etwas, steht es auf der Einkaufsliste). «Vorrat» ist eine Ansicht über diese Teile, kein Bereich.
- **Entscheid (5a) Reihenfolge:** B1 «Velo geschützt» gleich nach «App einfach»; B2 Umschalter + Überall zusammen mit «Material Liste zuerst»; B3 Import mit Vorschau und B4 Vorrat vor «Reisearten neu»; B5 erster neuer Bereich (Vorschlag Skitouren, mit Geräte-Pflege nach Tagen/Stunden) zusammen mit «Reisearten neu».
- **Modell (Vorschlag, mit 1a angenommen):** vier Etiketten pro Teil: Bereich (Heimat + auch für), Art (Kategorie, sport-neutral benannt, neu z. B. Sportgerät und Schutz), Typ (Gerät, Teil, Kleid, Verbrauch), freie Etiketten (z. B. «Import Eishockey 12.2026»). Bausteine bekommen einen optionalen Bereich. Bereiche: Velo, Überall, Berg & Schnee, Halle & Platz, Reisen, Alltag.
- **Import neuer Bereiche (B3):** Bereich wählen → Vorschau mit Abwählen und Erkennen schon vorhandener Teile (bekommen nur «auch für») → automatisches Etikett pro Import → «Ganzen Import entfernen» unter Ich › Daten; Velo-Teile bleiben dabei unberührt. Vorher automatische Sicherung.
- **Grund:** Noah (11.10.2026): Angst, dass sich die saubere Velo-Datengrundlage mit künftigen Bereichen (Eishockey, Tennis, Skitouren, Alltag, Verbrauch, Essen) vermischt.

## 11.10.2026: Alles finden + Kalender (Noah «1a 2a und b, wobei die to dos im vordergrund stehen 3a 4b 5a», Trello vOUX40b3)

Vorschlag: https://claude.ai/artifact/TuvocwdUios23adoGp6e5D. Inventar von 0.92.0: 110 Funktionen, 39 sichtbar, 31 eine Ebene tief, 40 versteckt. Noch kein Bau; vor jedem Baustein kommt eine Runde mit Mockups.

- **Entscheid (1a) Ort:** «Kalender» wird ein eigener Ort mit den Tabs Agenda · Merken · Ablage · Eingang. Notizen und Eingang ziehen von «Ich» dorthin. Am Handy bleiben 5 Plätze in der Leiste; welche, wählt Noah.
- **Entscheid (2a+b) Agenda:** Die eigenen To-dos stehen vorne und gross. Was die App schon weiss (Touren, Schritte vor der Tour, Event-Vorbereitung, Velo-Fristen, Service nach Zeit, Einfahr-Plan, Garantie, Aktiv-Termine, Backup) steht kleiner darunter, pro Quelle abwählbar.
- **Entscheid (3a) Verknüpfen:** in Stufen. Zuerst .ics-Dateien raus (pro Termin und als Sammeldatei) und rein (nur lesen). Dann der Abo-Link eines Google- oder iCloud-Kalenders nur zum Lesen, über eine kleine Vercel-Funktion ohne Speicher; der Link bleibt auf dem Gerät. Beide Richtungen erst mit dem Server-Paket S3.
- **Entscheid (4b) Ablage:** vorerst nur Links. Dateien kommen später in einem eigenen Baustein.
- **Entscheid (5a) Reihenfolge:** zuerst F1 «Alles finden» (Funktions-Übersicht nach Anwendungsfall, «Hinbringen» und «Ausprobieren», Suche zeigt ihre Befehle; liefert die Kacheln für die Startseite des Threads «UI-Analyse»). Danach die Kalender-Bausteine im zweiten Bauplatz neben D5. Jeder Baustein bekommt vorher eine eigene Runde mit Mockups.
- **Selbst entschieden:** Weil die To-dos vorne stehen, kommen Merken und Agenda zusammen in den ersten Kalender-Baustein Kal1. Die Pakete heissen Kal1–Kal5 (K1–K5 sind die Schritte der Kachel-Wand). «Was die App kann» behält oben die Karte des neusten Releases aus dem Thread «Neu planen»; F1 baut keine zweite Neuheiten-Liste.
- **Grund:** Noah (11.10.2026): viele Funktionen sind in Schritten versteckt, wo man nie hinkommt; dazu ein Ort, an dem nichts Wichtiges vergessen geht.

## 11.10.2026: F1 «Alles finden» freigegeben (Noah «1-5 a», Trello vaSqiSQb, 0.96.0)

Mockups A und B (`design/alles-finden-f1`, Galerie #alles-finden-f1). Noah im Thread «Funktionen sichtbar machen und Kalender», ca. 15:55: «1-5 a».

- **(1a)** «Was die App kann» nach Situation: Vor der Tour · Packen und unterwegs · Nach der Tour · Velo · Aktiv · Daten und App.
- **(2a)** In jeder Gruppe zuerst, was noch nie benutzt wurde; Benutztes grau mit ✓.
- **(3a)** Jede Zeile hat «Hinbringen» (öffnet die Stelle oder startet die Aktion) und, wo es passt, «Ausprobieren» in der Spielwiese.
- **(4a)** Die Suche zeigt beim Öffnen 3 Befehle zum Ausprobieren, die letzten Suchen und «Alle Funktionen ansehen»; sie findet auch Funktionen.
- **(5a)** Eine Kachel «Alles finden» auf der Kachel-Wand: die Kachel «Was die App kann» der Kachel-Wand (PR #111, `home/tiles.js` id `features`) zeigt schon auf `#/features`; der Thread «UI-Analyse» benennt sie um, F1 fasst Heute nicht an.
- **Selbst entschieden:** 84 Funktionen im Katalog `src/lib/features.js` (die 28 Tipps plus 56 aus dem Inventar), nicht 110: kleine Varianten sind zusammengelegt. «Benutzt» heisst: in den Daten gesehen, einmal «Hinbringen» getippt oder «Kenne ich». Pro Gruppe 3 Zeilen, dann «Alle n» (später 4, siehe unten). Velo-Blätter öffnen beim ersten Velo. «Ausprobieren» nur bei Funktionen rund um eine Tour, nur solange sie nie benutzt wurden und keine Spielwiese läuft; es öffnet das Spielwiesen-Blatt am passenden Tag, gestartet wird erst dort. Die Neuheiten bleiben als eine zugeklappte Zeile (am Computer rechts), bis der Thread «Neu planen» die Release-Karte baut. Am Handy kein «So liest du die Liste».

## 11.10.2026: F1 an Noahs Trello-Antwort angepasst und ausdrücklich freigegeben (0.96.0)

Noahs eigene Antwort auf Trello vaSqiSQb (14:34 UTC) war beim Bau übersehen worden: «1 a und b beides umstellbar», «2 mit 4 zeilen», «3a … als Baustein ‹Buttons und User Journey›». Neue Mockups auf «Offene Mockups» #alles-finden-f1 («Neu zur Freigabe»). Noah im Thread «Freigaben prüfen», 16:10 UTC: «1-2 freigeben» (Punkt 2 = diese Mockups).

- **(1 a und b)** Oben ein Umschalter «Nach Situation · Nach Seite». «Nach Seite» ordnet dieselben Funktionen nach Touren, Material, Velos, Aktiv, Ich (`PAGE_GROUPS`, `pageOf()` in `src/lib/features.js`).
- **(2)** Pro Gruppe 4 Zeilen, dann «Alle n».
- **(3)** «Buttons und User Journey» wird ein eigener Baustein mit eigener Mockup-Runde, nicht Teil von F1.
- Am Handy brechen die Knöpfe oben in Zeilen um statt seitlich zu wischen (Gesamttest: sonst abgeschnitten); im freigegebenen Mockup so gezeigt.
- **Selbst entschieden:** Wohin eine Funktion führt, bestimmt ihre Seite; eine Tour-Funktion, die ein Velo öffnet (Eventvorbereitung), bleibt bei den Touren; der Rest steht unter Ich.

## 11.10.2026: Antworten zu den späteren Kalender-Fragen (Noah, gleiche Nachricht)

Für die Spezifikation von Kal1–Kal5, noch nichts gebaut.

- Agenda reicht 6 Monate voraus. Erledigte To-dos wandern nach «Erledigt».
- Wiederholen nach Zeit (jeden Sonntag) **und** nach km (alle 300 km).
- Verknüpft wird nur Google privat. Verknüpfte Termine blockieren keine Touren-Vorschläge.
- Ablage: die App schlägt Themen vor, eigene mit #Tags dazu.
- Material- und Velo-Belege bleiben in der Velopflege, keine gemeinsame Ablage.
- Erinnerung am Handy: wenn möglich Push. Das braucht einen kleinen Push-Dienst und kommt später; bis dahin «Heute» und .ics mit Alarm im Google-Kalender.
- **Selbst entschieden:** Agenda startet am Computer mit dem Monat, am Handy mit der Liste (Frage offen gelassen, änderbar).
- **Neue Ideen (Claude, im Thread erklärt):** «Vor der Abfahrt»-Blatt (eine Seite für den Tourtag, offline: Ticket, Karte, Unterkunft, Notfallnummern), Nach-Tour-Merker, Saisonwechsel, Einkauf als To-do. Stehen als «Idee» auf «Mein Überblick».

## 13.10.2026: Training TR1–TR4 (0.138.0)

- **Noah 13.10.2026 18:06 UTC «1-5a»:** 1 Training als eigener Reiter in Aktiv; 2 alle Strava-Aktivitäten, nur Velofahrten zählen für die Velos; 3 Pulszonen aus Strava, änderbar; 4 Woche planen mit Dauer und Zone pro Tag, gefahrene kommen aus Strava; 5 die bestehende Strava-Kachel wird «Letzte Aktivität».
- **Leistung (Noah 13.10.2026 18:41/18:42 UTC «a», Thread «Mockup-Durchgang»):** Zeit in Pulszonen, Höchstpuls, Ø Leistung, max Leistung und beste 20 Minuten überall: auf der Aktivität (TR3) jetzt; Tour-Rückblick und Tempo baut Design-Refresh mit denselben Feldern (`wAvg`, `wMax`, `wDevice`, `w20` in `activities`).
- **Mockup-Freigabe: TR1–TR4 «tr1-4 ok» Noah 13.10.2026 18:07 UTC im Thread «Strava-Ausrüstung prüfen»; Antworten «1-5a» 18:06 UTC; Offene Mockups 2 #training.**
- **Noah 13.10.2026 21:15 UTC «1a 2a 3a 4a»:** 1 Rückblick auf der Ansicht «Woche» neben dem Plan, kein eigener Reiter; 2 Training öffnet mit «Woche»; 3 alles in einem Paket; 4 Wetter bei einer Aktivität später nachbauen.
- **Selbst entschieden:** Feste Termine und Erholung aus Aktiv › Woche (AK1/AK2) kommen mit «Aktiv ausweiten». Plan und Ziel in den Einstellungen (`training.plan`, `training.goal`, im Backup), geplante Einheiten älter als 120 Tage fallen weg. Eine geplante Einheit gilt als gemacht, wenn am Tag eine Aktivität derselben Art kommt. Der Server schickt den Puls als Sekunden pro Schlag, so braucht eine geänderte Zone keinen neuen Abruf; nie Strecke oder Karte. Von selbst nur die neusten 8 Aktivitäten mit Puls der letzten 90 Tage (Strava erlaubt 100 Abrufe pro 15 Minuten, die App teilt sich den Zugang), ältere beim Öffnen. Ohne Strava-Zonen: Standard aus Maximalpuls 190 (60/70/80/90 %). «Gleiche Strecke» = gleicher Name und gleiche Art, Distanz ±10 %. Die Notiz bleibt in der App, nicht in Strava. Wetter und Kalorien: Kalorien aus Strava, Wetter noch nicht. Eigene Farben für die Zonen als Tokens `--z1` bis `--z5`. Trennen mit «Fahrten löschen» löscht auch die Aktivitäten.
## 14.10.2026: 0.136.0 «Inhalte Flow» + «Wusstest du»

- Mockup-Freigabe: IF1–IF3 «IF1–IF3 freigegeben» Noah 14.10.2026 04:32 UTC, WD1–WD3 «wd1-wd3 freigegeben» 18:34 UTC, Antworten «1b 2a 3a 4a» 02:03 UTC und «1a 2a» 18:34 UTC; Bilder https://claude.ai/artifact/4YCMMdTbFGvpEZuGjeBTLW.
- **Entscheide Noah:** 1b «Das kann die App hier» als Zeile zum Aufklappen (bewusste Ausnahme zu «Weniger Meta»), 2a Tipp-Zeile, 3a Kacheln «Weiter», 4a englische Seiten mit «EN» über Google Übersetzer (kommt mit den Sportarten), Flow zuerst; WD 1a Wissen zuerst an, 2a Erde/Everest immer für den gewählten Zeitraum.
- **Selbst entschieden:** Untertitel der Kacheln fest statt mit Live-Zahlen; × blendet den Tipp für heute aus; eigene Links pro Seite (höchstens 8) neben höchstens 7 eigenen Kacheln; die ausgeblendete Zeile kommt über «Alle Tipps» zurück; «Tipps für diese Seite ›» unter den Kacheln, wenn keine Tipp-Zeile da ist; Föhn = trocken (unter 1 mm), Wind vor allem aus Süden (140–230°) und Böen ab 45 km/h aus Open-Meteo (keine Föhnmeldung von MeteoSchweiz frei verfügbar); Erde/Everest gehören zu «Wissen und Witziges» und verschwinden mit «Nur nützliche Tipps»; ohne Zeitschätzung «bei deinem Tempo» (der Zeitraum ist wählbar); IF2 Meditation wartet auf die neue Meditationsseite (anderer Thread).

## 14.10.2026: 0.135.0 «Meditation und Timer»

(Mockup-Freigabe: ME1–ME3 und Z1–Z5 «ME1-ME3 und Z1-Z5 freigeben» Noah 13.10.2026 16:02 UTC; Antworten «1a 2a 3a 4b 5b» und Timer «1-5a» 13.10.2026; Reihenfolge «vor Bündel B» 14.10.2026 04:25 UTC)

- Heute bleibt wie HN0 (Noah 14.10.2026 21:00 UTC «HN0 so freigeben», «gilt ab sofort als gesichert»): ME1 (Meditationskarte zuoberst) und Z1 (Timer-Kachel) sind gebaut, kommen aber erst nach Noahs Prüfung gegen HN0.
- Meditation ist ein eigener Reiter in Aktiv (ME2). Noah 15.10.2026 «1a» (Paket Aktiv): Aktiv öffnet wieder mit Heute, Meditation ist der zweite Reiter.
- Name «Meditation» überall; der Spitzname «Kissenzeit» geht mit einer einmaligen Datenänderung, ein eigener Name bleibt.
- Timer: «Timer» zählt hoch, Ziffernblatt Digital zuerst, Klangschale am Ende, das Log füllt sich selbst, Notiz freiwillig (Z «1-5a»).
- «Was dir hilft» im Rückblick ist nur Beobachtung, nie ein Rat.
- ME4 Yoga ist nicht dabei; es kommt als eigener Teil (freigegeben 14.10.2026 «ME4 freigabe»).
- Regel A (Noah 14.10.2026 20:15 UTC «a a»: nichts springt von selbst): Nach dem End-Gong öffnet sich die Auswertung nicht mehr von selbst; unten steht «Fertig · 20 Min gespeichert» mit dem Link «Wie war's? ›», bis man tippt oder schliesst. «Beenden» (ein Tipp) öffnet die Auswertung weiter direkt.
- **Selbst entschieden:** die Zeile «Uhr» auf der Meditationsseite führt zu den Ziffernblättern; die Timer-Arten sind ein Tabstopp, die Pfeiltasten wählen.

## 14.10.2026: 0.133.0 «Design-Refresh» (Bündel A)

- (Mockup-Freigabe: SN4g «freigabe» 13.10.2026 22:24 UTC; SN6 22:59/23:12 UTC mit Antworten; SN1–SN7 23:04 UTC; AB1–AB6 «freigabe» 14.10.2026 00:06 UTC, Antworten «1a 2a 3b 4a und b» 00:52 UTC; HG1 «HG1 freigegeben» 01:02 UTC, Antworten «1a 2b 3 …» 00:55 UTC und «1a 2a» 01:01 UTC; FE1 ohne Bilder «b» 13.10. 23:52 UTC, FE13/FE14/FE16 «a» 23:56 UTC; Name «Wi gaht's?» 01:34 UTC; Übernahme der alten Tagescheck-Karte «a) ja, alle drei übernehmen» 01:52 UTC und «ok. freigabe» 02:58 UTC)
- **«Wi gaht's?» ersetzt den Tages-Check:** ein Satz Fragen statt Tagescheck und Wochengewicht. Antworten in `abAnswers` (Dexie v9); Schlaf, Energie, Stimmung zusätzlich in die Tageszeile `flowChecks` (Ringe, Rückblick, 7-Tage-Werte lesen weiter dort), Gewicht auch als Körpergewicht. Alte Tageschecks bleiben und stehen im Verlauf.
- **Feste Runden (WG):** Einstellung `abfragen.rounds` (an, 07:00, 20:30). Eine Fragezeit vor 12:00 fragt zur Morgenzeit, ab 18:00 zur Abendzeit, dazwischen bleibt die eigene Zeit. Abschaltbar unter Ich › «Wi gaht's?» › Feste Runden.
- **Balance-Ring:** liest zusätzlich die Antworten der 7 Tage (Bereich → Kategorie; Körper und Werte nicht im Ring); Schlaf, Energie, Stimmung zählen nur einmal.
- **Begrüssung:** immer Mundart (feste Texte in `home/hallo.js`, nicht über t()), ab 22 Uhr «Guät Nacht, Nachtülä»; die Antworten beim Antippen landen im Verlauf von «Wi gaht's?».
- **Selbst entschieden:**
  - Alte Adressen `#/check/morning`, `#/check/evening`, `#/check/questions` leiten still auf «Wi gaht's?» um; Kacheln «Tagescheck» und «Deine 15 Fragen» verschwinden auch aus gespeicherten Wänden.
  - Bestehende Nutzer: Runden sind sofort an (Fragen um 08:00 und 20:00 wandern auf 07:00 und 20:30).
  - Ein Tag mit Antworten aus «Wi gaht's?» zählt die alte Regel «Morgen ohne Ziel = Ziele 0» nicht.
  - Zwei neue Funktionen im Katalog: «Wi gaht's?» (`f.abfragen`) und «Tour aus komoot» (`f.komoot`), je mit drei Schritten und Handbuch-Eintrag; drei Schritte auch für die Funktionen aus 0.132.0.
  - Die Regeln des alten Checks in `flowcheck.js` bleiben (alte Zeilen lesbar); Aufräumen später in einem kleinen Release.
- **KT «Kacheln antippbar»** (Mockup-Freigabe: KT1–KT4, Antworten «1 a und b 2a 3a 4a» und «KT freigegeben» Noah 14.10.2026 10:31 UTC; Bilder `design/kachel-tipp/`): «Öffnen ›» auf jeder kleinen Kachel, › im Kopf von «Im Flow», ••• auf jeder Aktivität (wie langes Drücken) mit Hilfezeile auf Heute, kurze Einführung in drei Schritten (`homeIntroKT`), Anheben am Computer.
  - Selbst entschieden: Die Einführung kommt nach einem Update (bestehende Nutzer) oder über Ich › «Einführung der Startseite nochmals zeigen», nicht bei einer ganz neuen Installation; ihr Ende schliesst auch den alten Tipp zum langen Drücken. Der › im Kopf von «Im Flow» ist für Bildschirmleser verborgen, der Link «Im Flow ›» unten bleibt.
- **Auch:** Doppeltipp-Schutz auf den Vorschlag-Kacheln in Aktiv › Aktivität und Meditation › Mehr (wie Heute in 0.131.1); die Zeile «Tagescheck» von 0.132.0 in «Was ist neu» führt zu «Wi gaht's?»; Favoriten-Kopf bricht am schmalen Handy um statt ein Wort zu trennen.

## 18.10.2026: 0.147.0 Teil GM «Mail in der App» (in Paket B)

- Noah 15.10.2026 12:04 «emails versenden in der app, email eingang, kalendereinträge + zugehörige emails»; 12:16 «4a»: lesen und senden in einem Paket; 12:17 «vorerst ohne mockup»; 18.10.2026 21:52: ohne Mockup, Testlink pro Paket.
- **Server:** `api/google` bekommt `mail-list` (Posteingang oder Gmail-Suche, 20 pro Seite), `mail-get` (Text und Namen der Anhänge) und `mail-send` (an, cc, Betreff, Text; Antwort mit In-Reply-To und im gleichen Gmail-Verlauf); Hilfen in `api/_lib/googlemail.js`. Scopes `gmail.readonly` + `gmail.send`, zusätzlich angefragt (`services: ['mail']`). Der Server speichert keine Mail.
- **App:** Seite «Mail» unter Ich; nichts ausser Einstellungen (verbunden, Signatur) wird gespeichert. «Mails dazu» unter einem Termin sucht nach den Titelwörtern, 30 Tage vor bis 2 Tage nach dem Termin.
- **Selbst entschieden:** Seite unter Ich, nicht auf Heute (Regel 13). Eine Mail geht erst nach «Senden» raus. Nur Text, keine Anhänge beim Senden (kommt mit DF). HTML-Mails werden als Text gezeigt (sicher, keine fremden Bilder). «In Gmail öffnen» für alles Weitere.
- **Nicht in diesem Teil:** Anhänge senden und öffnen (DF), Auswertungen (GX).

## 14.10.2026: 0.132.2 «Velo draussen ohne falschen Haken»

- (Fehler von Noah 14.10.2026 18:46 UTC gemeldet; gleiches Aussehen, darum ohne Mockup)
- **Ursache:** «Velo draussen» zählt auch «Velotour» (`counts: ['trip']`); `tripDays` nahm jeden Tour-Tag bis und mit heute, auch von nur geplanten Touren. Der Tour-Tag liess sich nicht antippen (ein Tipp setzt oder nimmt nur das eigene Häkchen), darum blieb der Haken stehen.
- **Selbst entschieden:** Der heutige Tour-Tag zählt erst, wenn die Tour beendet ist (`finished`, `status: 'done'` oder aus einer Fahrt); vergangene Tage zählen wie bisher. Touren ohne Velo zählen nicht als Velotour: Wandern, Skitour, Wochenende und Reisen tragen ihre Rucksäcke als `packs` an der Tour, Velotouren (Bikepacking, Tagestour) nie, ihre Taschen hängen am Velo, wie im Editor «Velotour» heisst.

## 14.10.2026: 0.132.1 «Langer Name passt»

- Fehler von Noah 14.10.2026 18:41 UTC gemeldet, «BUG auf live version dringend»; gleiches Aussehen, darum ohne Mockup
- **Ursache:** `.tally` in `Between.svelte` ist ein zentriertes Grid (max. 340 px); sein `<small>` hat `min-width: auto` und wird nie schmaler als das längste Wort. `overflow-wrap: break-word` allein senkt diese Mindestbreite nicht.
- **Selbst entschieden:** eigenes kleines Update statt im Tipps-Paket, damit der Fix sofort live gehen kann (Koordination: Mein Überblick).

## 14.10.2026: 0.131.1 «Abhaken wieder abwählbar»

- (Fehler von Noah 14.10.2026 05:19 UTC gemeldet; gleiches Aussehen, darum ohne Mockup; GitHub-Freigabe nur für diesen Fix: «freigabe» 05:54 UTC)
- **Ursache:** `tapAct` entschied aus `state.todayDone` (liveQuery, hinkt nach); ein zweiter Tipp vor dem Nachladen hakte nochmals ab, Abwählen nahm nur den letzten Eintrag zurück.
- **Selbst entschieden:** Abwählen nimmt alle eigenen Häkchen des Tages zurück (räumt alte Doppel-Häkchen auf); Pendeln bleibt über die Pendel-Zeile zurücknehmbar; der gleiche Doppeltipp-Schutz bei Challenges auf den Aktiv-Seiten (MedMore, Activity) folgt mit 0.133.0 oder später.

## 13.10.2026: 0.125.0 «Tagespaket 13.10.», ein Release aus vier Paketen

- **Entscheid:** Tages-Check Schritt 1+2 (#151), Aktiv ausweiten AK1–AK3 Woche/Sporttasche/Erholung (#150), Feinschliff A-J1 Werkstattbesuch, TZ-1 drei Tour-Zustände, A-U1/A-U2/A-U5 (#152), Werte überall WU1–WU4 + Strava verbinden SV1 (#153) gehen als ein Release 0.125.0. Die Versionen 0.126.0, 0.127.0 und 0.130.0 der Einzel-Branches entfallen; «Was ist neu» hat einen Eintrag 0.125.0, die Funktionen «Tour-Zustand» und «Jahresziele» und die drei neuen Kacheln haben «seit 0.125.0».

## 13.10.2026: Tages-Check Schritt 1, Morgen-Check und Abend-Rückblick (0.125.0 Tagespaket)

- (Mockup-Freigabe: T1–T4 «ich gebe hiermit alle mockups frei» Noah 13.10.2026 16:17 UTC; gebaut T1–T2, T3–T4 folgen in Schritt 2, Offene Mockups #tages-check-4). Vor Fitbit/Google gebaut (Noah). Morgen-Check #/check/morning (Fragen 1–4, 6, 7 und «Gestern Abend»; daneben «Vorschlag für heute», «Heute im Blick», «Deine Nacht» als gestrichelter Platzhalter) und Abend-Rückblick #/check/evening (Fragen 8–14; daneben «Tag in Zahlen», «Morgen → Abend», «Woche bisher»). Alles freiwillig, jede Frage überspringbar, jede Antwort speichert sofort in der Tageszeile `flowChecks` (neue Felder, kein neues Schema). Heute (Im Flow-Karte, Kachel «Tagescheck») und Aktiv öffnen die Seite, ab 20:30 den Abend-Rückblick. Das alte Check-Fenster ist weg.
- **Selbst entschieden:** Frage 4 bleibt die wechselnde Frage aus dem bearbeitbaren Pool (jeden Tag die nächste; «Wechselnde Fragen bearbeiten» jetzt auf der Seite). Die Aufteilung in 4/5 (Körper/Kopf) und 12–14 aus dem Pool kommt mit dem Fragen-Katalog (T4, Schritt 2), damit eigene Pool-Fragen nicht verloren gehen. Ziel-Vorschläge: «Velo nach der Arbeit», «20 Min meditieren», «Früh schlafen» + eigener Satz. Der Vorschlag ist eine einfache Regel (müde → leicht; Ruhe → Meditation/Sauna; trocken + Natur/Sport → Velo; nass → drinnen; Freunde → abmachen), mit «Nicht heute» und wieder zeigen; «Als Challenge» aus dem Mockup kommt später. Frage 11 wird aus den heutigen Fahrten (Dateien und gezählte Strava-Fahrten) vorgefüllt: Fahrzeit der Datei, sonst km/18 km/h geschätzt; bei «Fertig» bleibt die vorgefüllte Antwort gespeichert. Frage 12 und 13 wechseln nach Kalendertag. Frage 14 entfällt, wenn heute eine Meditation im Protokoll ist (grüne Zeile, gespeichert als `auto`). «Sprechen» nur, wo der Browser Spracherkennung hat. «Morgen → Abend» vergleicht ehrlich Stimmung am Morgen mit Zufriedenheit am Abend (zwei verschiedene Fragen), weil es abends keine Stimmungsfrage gibt. «Aktiv-Ziele» zählt die gerade erreichten Ziele (laufende Fenster) statt «diese Woche». «Heute im Blick» zeigt nur, was es gibt: Wetter aus der gespeicherten Vorhersage, Meditation (heute/gestern, Serie), nächste Tour; feste Termine gibt es noch nicht. Der Strich unter einer Zahl zeigt gestern (wie im Mockup gezeichnet; der Text sagt «Strich»). Version 0.127.0 (im Tagespaket jetzt 0.125.0), weil 0.123.0 (Trophäen-Vitrine) vorher.

## 13.10.2026: Tages-Check Schritt 2, Balance-Ring, Fragen-Katalog und Frage 15 (0.125.0 Tagespaket)

- (Mockup-Freigabe: T1–T4 «ich gebe hiermit alle mockups frei» Noah 13.10.2026 16:17 UTC und «T1–T4 freigegeben»; Bilder `design/tages-check-4/` T3/T4, Offene Mockups 2 #tages-check-4). Gleiche Version 0.127.0 wie Schritt 1 (noch nicht live).
- **T3 Heute:** drei neue Kacheln in der Kachel-Wand (`tiles.js`, Bereich Aktiv, «neu» für 14 Tage, verschieb-, grössen- und abwählbar wie alle): «Deine Balance» (gross oder ganze Zeile), «Morgen-Check» (breit oder gross) und «Deine 15 Fragen» (ganze Zeile). Eine gespeicherte Wand von vorher (v 3) bekommt sie einmal direkt nach «Im Flow»; weggenommen bleiben sie weg (Wand jetzt v 4).
- **Balance-Ring (`src/lib/balance.js`):** 9 Kategorien, Wert 0–100 aus den letzten 7 Tagen (heute mit). Jede Antwort ist ein Signal 0–1 (Skala 1–10 = (v−1)/9, Auswahl nach Stufe, Coolstes-Chip = 1), der Wert ist der Schnitt × 100. Von selbst: Meditation und andere Aktiv-Häkchen nach ihrem Ring (Bewegen → Sport, Achtsam → Achtsamkeit, Erholung → Erholung) und Fahrten (Sport, Natur) zählen einmal pro Woche als Anteil einer ruhigen Woche (Fahrten an 3 Tagen, Achtsamkeit an 5, Sport an 3, Erholung an 2). Ohne Daten bleibt eine Kategorie leer («–»), nie 0 erfunden. Fitbit/Google bleibt Platzhalter.
- **Fragen-Katalog** `#/check/questions` (T4): Tabelle der 15 Fragen nach Morgen/Abend/Sonntag mit Wie oft, Antwort, Kategorie und Schalter; am Handy ohne Wie oft/Antwort. Ausgeschaltete Fragen stehen in `settings.checkQuestionsOff` (reist im Backup mit) und kommen auf den Check-Seiten nicht mehr.
- **Frage 15** am Sonntag (Kalendertag Europe/Zurich) im Abend-Rückblick: 1–10 und 1 Satz (`vision`, `visionNote` in der Tageszeile).
- **Tipp und langes Drücken:** Hinweis auf Heute, bis er geschlossen wird (`settings.homeHintLongPress`). Langes Drücken (500 ms, Finger, Stift und Maus) auf eine Kachel öffnet «Startseite anpassen» mit den Grössen dieser Kachel; mehr als 10 px Bewegung (Scrollen) oder früher loslassen bleibt ein normaler Tipp.
- **Selbst entschieden:**
  - Fragen 4 und 5 sind die wechselnde Morgenfrage: Schalter 4 nimmt «Körper» (`body`), Schalter 5 «Ruhe» (`calm`) aus dem Pool; die anderen Pool-Fragen wechseln weiter. Die Nummer zeigt 5, wenn «Ruhe» dran ist.
  - Ist Frage 12 oder 13 aus, kommt die andere jeden Abend; beide aus → keine.
  - Frage 10 kommt nur mit einem Ziel vom Morgen; Frage 14 aus → auch die automatische Meditation wird nicht als Antwort gespeichert (zählt im Ring trotzdem über das Protokoll).
  - Ziele: ein Morgen mit Antworten ohne Ziel zählt 0, mit Ziel 1. «Am wenigsten» erst ab 3 Kategorien mit Wert. Vorschläge sind sanfte Fragen pro Kategorie, z. B. «Sa Velo mit Freunden?».
  - Untertitel «letzte 7 Tage» statt «diese Woche» (der Ring rechnet rollend 7 Tage); in der Mitte «7 Tage».
  - Der Tipp nennt den echten Knopf «Startseite anpassen» statt «Heute anpassen».
  - «Morgen · n Tipps» rechnet die eingeschalteten Fragen (4/5 und 12/13 je ein Tipp); «7:00» aus dem Mockup fehlt, weil es keine Morgen-Erinnerung gibt.
  - «Morgen-Check»-Kachel zeigt die Uhrzeit der ersten Morgenantwort (`mAt`), sonst «erledigt heute»; ab 20:30 führt sie zum Abend-Rückblick.
  - Die drei kleinen Im-Flow-Ringe bleiben vorerst (Noah «ring gross auf Heute» = ersetzen?), Frage an Noah.

## 13.10.2026: Woche (0.125.0 Tagespaket, Aktiv ausweiten AK1)

- (Mockup-Freigabe: AK1 «ich gebe hiermit alle mockups frei» Noah 13.10.2026 16:17 UTC im Projekt-Chat, Antworten «1-5a» 16:02 UTC im Thread «Mein Überblick», Offene Mockups 2 #aktiv-ausweiten). AK1: Seite «Woche» (#/flow/week) Montag bis Sonntag: Erledigtes, feste Termine, Eingeplantes und Vorschläge nach offenen Zielen und Wohnort-Wetter; antippen = einplanen, × blendet aus. Rechts «Ziele diese Woche» (rollend), «Feste Termine» (einmal eintragen, jede Woche), Tipp «bestes Wetter der Woche», Kalenderdatei (.ics). Einstieg: Karten «Mehr in Aktiv» auf Aktiv › Heute (Frage 1a).
- **Selbst entschieden:** die drei Seiten kommen als drei kleine Releases (Woche, dann Sporttasche, dann Erholung); die Karten «Mehr in Aktiv» zeigen nur, was schon gebaut ist. Höchstens 2 Vorschläge pro Tag, damit die Woche lesbar bleibt. Die Tabs bleiben wie heute (Meditation als erster Tab gehört zum Paket «Meditation zentral»). Termin ohne «möglich»-Markierung und ohne «2 h frei» (kein Kalenderzugriff); eingeplante Vorschläge gehen als ganztägige Termine in die .ics-Datei. Am Handy zuerst die Ziele, dann die Tage (wie im Mockup). Version 0.130.0 (im Tagespaket jetzt 0.125.0), weil 0.124.0 (#146) und 0.125.0–0.127.0+ (Design-Refresh, Tages-Check) schon vergeben sind.
- **Sporttasche (AK3, im selben Paket)** (Mockup-Freigabe: AK3 «ich gebe hiermit alle mockups frei» Noah 13.10.2026 16:17 UTC im Projekt-Chat, Antworten «1-5a» 16:02 UTC im Thread «Mein Überblick», Offene Mockups 2 #aktiv-ausweiten): Seite «Sporttasche» (#/flow/bags) mit einer Tasche pro Sport (5 erfundene Start-Taschen: Yoga, Tennis, Gym + Sauna, Eishockey, Velo Pendeln), daneben die offene Tasche zum Abhaken, «Alles drin», «+ Teil», «nicht gebraucht? antippen». Erinnerung am Vorabend eines festen Termins ab 17:00 auf Heute (4a), abschaltbar.
- **Selbst entschieden (Sporttasche):** «oft vergessen» ab 2×: ein Teil zählt als vergessen, wenn die Tasche für einen Tag teilweise gepackt war und es draussen blieb (eine unberührte Tasche zählt nichts). Die Erinnerung beginnt um 17:00 statt fix 20:00 (wie «Morgen geht's los» auf Heute). Taschen nur mit festem Termin aus «Woche» erinnern; ohne Termin packt man für heute.
- **Erholung (AK2, im selben Paket)** (Mockup-Freigabe: AK2 «ich gebe hiermit alle mockups frei» Noah 13.10.2026 16:17 UTC im Projekt-Chat, Antworten «1-5a» 16:02 UTC im Thread «Mein Überblick», Offene Mockups 2 #aktiv-ausweiten): Seite «Erholung» (#/flow/rest) mit dem Erholungs-Ring der Woche (derselbe wie auf Aktiv), Tipp nach 3 aktiven Tagen in Folge (antippen = abhaken, «Heute nicht» blendet für heute aus), Erholung abhaken (zweites Tippen nimmt zurück), Ideen hinzufügen, die letzten 14 Tage als Punkte.
- **Selbst entschieden (Erholung):** Schlaf, Ruhepuls und HRV und der 14-Nächte-Schlaf aus dem Mockup kommen mit der Fitbit-Verbindung (Antwort 3a); bis dahin ein Hinweis statt erfundener Werte, und statt des Schlaf-Diagramms die Erholungs- und Aktiv-Tage der letzten 14 Tage. Höchstens 4 Ideen auf einmal, «Früh schlafen» als neue Idee zuerst. Kein eigenes Wochenziel: der Ring nutzt die Ziele der Erholungs-Aktivitäten.
## 13.10.2026: Formulare, Leer/Laden/Fehler, Update-Banner, A-U5 + A-U2 + A-U1 (0.125.0 Tagespaket)

Gesamtprüfung 13.10.2026, Vorschläge A-U5, A-U2, A-U1 (`design/audit-2026-10-13/`). **Mockup-Freigabe: A-U1–A-U5 «A-D1–A-D5 und A-U1–A-U5 freigeben» 13.10.2026 16:04 UTC (Mein Überblick, cmsg_018WAR7H251KvEyztXFE5y9QSrnbx2M9TfQHMNXXx7fa2K)**; Antworten 2a (vorbelegte Felder grün mit «aus …», änderbar) und 3a (Update-Hinweis als ruhiges Banner auf Heute statt Fenster).

- **A-U5 Formulare nutzen vorhandene Daten (Regel für alle Formulare):** Was die App schon weiss, steht vorbelegt auf grünem Feld (`.inp.pre`) mit Herkunftszeile (`.prefrom`, «aus …»/«wie …»), immer änderbar; Prüfungen stehen am Feld vor dem Speichern (`.fieldmsg`). Zentral in `app.css` und `lib/formprefill.js`; das Werkstatt-Fenster von A-J1 nutzt dieselbe Regel. Neue Tour: Fahrstunden pro Tag aus den letzten 3 Velotouren mit gleich vielen Tagen (Mittelwert der Mitte, auf halbe Stunden), Start = Heimat, Velo mit Herkunftszeile; ein Tourname, den es schon gibt, steht rot am Feld mit einem freien Namen zum Antippen. Werkstatt: km aus dem km-Buch und letzte Werkstatt als Chip kamen schon mit A-J1.
- **A-U2 Leer, Laden, Fehler:** `<svelte:boundary>` um den Seiteninhalt in App.svelte; ein Fehler zeigt `ui/ErrorPage.svelte` («Hier ist etwas schiefgelaufen», Zu Heute, Neu laden, Problem melden) statt einer weissen Seite; die Daten bleiben unverändert. `ui/Empty.svelte` ist der eine Leer-Baustein (jetzt mit zweitem Knopf, Zusatzzeile und Überschrift-Stufe), in 22 weiteren Dateien eingesetzt (29 insgesamt). `ui/Skeleton.svelte` zeigt beim Laden ruhige Platzhalter auf Heute, Touren, Rückblick, Logbuch, Unterwegs, Tour-Rückblick, Fahrt, Bausteine prüfen und Übergängen.
- **A-U1 Update-Hinweis als Banner:** Nach einem Update kein Fenster mehr (W1 von 0.118.0 ersetzt, `know/NewsSheet.svelte` entfernt), sondern `know/NewsBanner.svelte` oben auf Heute: «Neu in 0.127», die Titel der neuen Versionen, «Ansehen» (öffnet Ich › Was ist neu) und ×. Weg nach × oder «Ansehen» (bis zum nächsten Update) oder nach 7 Kalendertagen. Der Schalter unter Ich › Was ist neu schaltet das Banner wieder ein. «Später» gibt es nicht mehr.
- **Selbst entschieden:**
  - «Ansehen» schliesst das Banner ebenfalls (wer die Neuigkeiten gesehen hat, braucht es nicht mehr).
  - **Noah 13.10.2026 17:22 UTC (Entscheidungskarte «Nur das Banner ★»):** höchstens ein «Neu» auf Heute; solange das Banner steht, wartet die Kachel «Neu» (bleibt gespeichert, nach × oder «Ansehen» steht sie wieder zuoberst).
  - Banner zeigt höchstens 3 Versionstitel, mehr mit «…».
  - Schalter unter Ich: wieder eingeschaltet nach Ablauf der 7 Tage, zählen die 7 Tage ab heute neu.
  - Fahrstunden: Median der letzten 3 gleich langen Velotouren (Vorlage oder Beispiel überschreiben den Vorschlag; Tippen auch).
  - Velo-Herkunft als Zeile unter den Chips («das Velo der offenen Tour» bzw. «deiner letzten Tour»), die Chips selbst bleiben ohne Grün.
  - Ein automatisch gebildeter Tourname ist immer frei («… (2)», wie bei der Tagestour); der Vorschlag beim doppelten Namen nutzt dieselbe Schreibweise «Jura (2)» statt «Jura 2» aus dem Mockup.
  - Doppelter Name blockiert das Speichern nicht (alles bleibt Vorschlag); die Meldung steht auch beim Bearbeiten einer Tour.
  - Fehlerseite: «Problem melden» öffnet eine Notiz im Eingang mit Seite, Version und Fehlertext (nichts verlässt das Gerät); Seitenname = Ort › Tab.
  - Leer-Baustein: der erste Knopf ist der Hauptknopf (grün), wie im Mockup; leere Kleiderschrank-Seite mit «Teil hinzufügen» ohne «Beispiele» (gibt es dort nicht).
  - Klasse `.prefrom` statt `.from` (die Teile-Tabelle nutzt `small.from` schon anders).
- **Nicht gebaut:** Reihenfolge der Felder im Neue-Tour-Fenster wie im Mockup (Tage, Stunden, Start, Velo, Name); das Fenster behält seinen Aufbau von 0.114.0. Die Kachel «Neu» auf Heute (I11e, 14 Tage oben) bleibt; zusammen mit dem Banner sind es zwei «neu»-Markierungen (Frage an Noah).

## 13.10.2026: Drei Tour-Zustände, TZ-1 «Zustand sichtbar» (0.125.0 Tagespaket)

Auftrag Noah 13.10.2026 14:52 («unterscheiden zwischen einer abgeschlossenen Aktivität … und einer Aktivität, die wir in der App planen … und ob wir eine Tour bewertet haben»). Mockups TZ0–TZ3 (`design/tour-zustaende/`). **Mockup-Freigabe: TZ1–TZ3 «TZ1–TZ3 freigegeben» 13.10.2026 15:38 UTC, Antworten «1-5 a» 15:37 UTC.**

- **Namen (1a):** Geplant · Abgeschlossen · Bewertet, überall gleich.
- **Farben (2a):** Blau (Stift) · Grau (Fahne) · Grün (gefüllter Stern); Orange bleibt für «fällig». Eigene Tokens `--st-*`, unabhängig von der Farbwelt.
- **Hochgeladene Fahrt ohne Packliste (3a):** eine Tour im Zustand Abgeschlossen (Zusatz «GPX» bzw. «Strava»); «Kurz bewerten» kommt mit TZ-3.
- **Strava-Fahrten ohne Tour (4a):** bleiben im Fahrtenbuch, nicht unter Touren (TZ-3).
- **Wieder öffnen (5a):** mit einer Rückfrage; kommt mit TZ-2.
- **Eine Regel:** `tripState()` in `src/lib/tripstate.js` (Reihenfolge der Spezifikation, Abschnitt 2). Keine Migration. `tripEnd` lebt jetzt dort (debrief.js gibt es weiter), `endedTooEarly` ebenfalls (tripsoverview.js gibt es weiter). Ersetzt in diesem Paket: die Gruppen der Touren-Übersicht (`tripsoverview.js`, vorher In Planung / Rückblick offen / Gefahren / Beendet, bevor sie begann), `tripDone` (`yearreview.js`, Verhalten gleich, Test über alle 480 Kombinationen) und `endedTooEarly`. Noch nicht ersetzt, weil sich das Verhalten ändern würde (kommt mit TZ-2/TZ-3): `isOver` (debrief.js), `pastTrips` (hubs.js), `tripRow` (drafts.js), `finishedTrips` (know.js), `templateUse` (templates.js).
- **Selbst entschieden:**
  - Eine Tour, deren Datum vorbei ist, die aber nie beendet wurde, zeigt «Abgeschlossen · Datum vorbei» (Mockup: «gefahren?» mit «Ja / Nicht gefahren»): die Frage mit den zwei Knöpfen kommt erst mit TZ-2, bis dahin keine Frage ohne Antwortmöglichkeit.
  - Heute: die Zeile «Rückblick noch offen» behält Text und Knöpfe («Alles gut», «Rückblick öffnen») und bekommt die Pille Abgeschlossen; die Frage «Bist du gefahren?» kommt mit TZ-2.
  - Touren-Übersicht: Abgeschlossen zeigt alle mit offenem Rückblick und dazu die 5 neuesten ohne Rückblick, Bewertet die 5 neuesten; je «Alle n …» führt zu Vergangene Touren. Ein zweiter Tipp auf einen gewählten Chip zeigt wieder alle.
  - Zusatz der Pille: Geplant «Heute / Morgen / in n Tagen / unterwegs»; Abgeschlossen «Datum vorbei», «GPX», im Tour-Kopf auch «Rückblick angefangen» bzw. «Rückblick fehlt» (auf der Kachel sagt das schon der Knopf «Rückblick»; die Pille bleibt kurz, nur der Zusatz wird auf schmalen Kacheln mit «…» gekürzt); Bewertet im Tour-Kopf das Datum des Rückblicks.
  - Die Gruppenüberschrift heisst nur «Abgeschlossen» (Mockup «Abgeschlossen · Rückblick fehlt»), weil dort auch hochgeladene Fahrten ohne Rückblick stehen.
  - Linienfarben dunkel (nicht in der Spezifikation): `#6a9fd6`, `#8e9aa6`, `#5fb185`.

## 13.10.2026: Ein Weg zum Erfassen, A-J1 (0.125.0 Tagespaket)

Gesamtprüfung 13.10.2026, Vorschlag A-J1 (`design/audit-2026-10-13/`). **Mockup-Freigabe: A-J1 «aj-aj5 ok» 13.10.2026 17:19 Zurich (Projekt-Chat)**; Antwort 1a: «+ › Werkstattbesuch» öffnet den echten Besuch, keine Notiz mehr.

- **Neu › Werkstattbesuch** öffnet das Fenster «Werkstattbesuch erfassen» (dasselbe wie unter Heute und Werkstatt & Belege) statt einer Notiz «Werkstatt-Quittung:» im Eingang. Nach dem Speichern: Werkstatt & Belege des Velos mit «Werkstattbesuch gespeichert.» und Rückgängig.
- **Vorausgefüllt (A-U5-Look, nur in diesem Fenster):** km des Tages aus dem km-Buch (ohne Eintrag: Zähler des Velos, nur für heute) und die Werkstatt des letzten Besuchs dieses Velos (sonst irgendeines Velos), grün hinterlegt mit «aus …». Wer tippt, überschreibt; dann ist das Feld nicht mehr grün.
- **Problem melden** nur noch in Neu und am Velo (Velos › Pflege); der Eintrag unter Ich ist weg, dort steht 30 Tage ab dem ersten Ansehen ein ruhiger Hinweis mit Link.
- **Selbst entschieden:**
  - Bekannte Werkstätten als Chips unter dem Feld (die vorgeschlagene mit «(zuletzt)»), nur wenn es mehr als eine gibt; «+ neu» braucht es nicht, das Feld bleibt frei beschreibbar.
  - «Was wurde gemacht?» (optional) mit denselben Chips wie «Ablegen als … Beleg» (`VISIT_JOBS` in inbox.js, geteilt); die Arbeiten landen als Teile des Besuchs.
  - Velo bleibt eine Auswahlliste ohne Grün (Vorschlag wie bei Problem melden: zuletzt gewähltes Velo).
  - Werkstattbesuch steht in Neu › Velos jetzt zuoberst (dann Problem, dann km) und nur, wenn es ein Velo gibt.
  - Die Meldung mit Rückgängig nutzt den Toast von «Umbenennen» (`offerDone` in ui/rename.svelte.js).
  - Nach dem Speichern Werkstatt & Belege statt Pflege: In der Pflege steht zuoberst das km-Buch, der neue Besuch wäre nicht zu sehen; unter Werkstatt & Belege steht er gleich oben.
  - Der Satz in «Was ist neu» nennt «Velomech» statt «Werkstattbesuch», weil das lange Wort auf der Heute-Kachel am Handy umbricht (Wächter-Test).
- **Nicht gebaut (Mockup zeigt es, A-J1 verlangt es nicht):** neue Gruppen im Neu-Blatt («Neu / Am Velo / Sonst», Schild «neu»), neues Problem-Formular und Pflege-Ansicht nach dem Speichern. Die Zeile «Problem melden» unter den Velo-Karten auf Heute bleibt (Frage an Noah).
## 13.10.2026: Werte überall + Strava verbinden (0.125.0 Tagespaket)

- **Noah 13.10.2026 «1-5a»:** 1 Höhenmeter und Puls zuerst, Aktivzonenminuten mit Fitbit; 2 ein Jahresziel pro Wert, jedes abwählbar; 3 Puls als Wochen-Durchschnitt, ohne Bewertung; 4 «Diese Woche» zeigt km · Hm · Minuten in einer Zeile; 5 zuerst Hm, Fussabdruck und Velopflege.
- **Mockup-Freigabe: WU1–WU4 und SV1 «ich gebe alle bild mockups frei» Noah 13.10.2026 17:18 UTC im Projekt-Chat; Antworten «1-5a» 16:31 UTC; Offene Mockups 2 #werte-ueberall und #strava-verbinden.** SV1 nach Noahs Hinweis 17:06 UTC (Strava-Knopf nicht gefunden) und «a» 17:07 UTC.
- **Selbst entschieden:** SV1 als Karte über der Kachel-Wand statt als Kachel (keine Umstellung gespeicherter Wände nötig); zurück über die Kachel «Strava» oder Velo › Pflege › Strava. Startwerte der Jahresziele 5 000 km, 50 000 Hm, 7 800 Min (150 pro Woche). Fussabdruck zählt alle Fahrten mit 0,15 kg CO₂ pro Auto-km. Höhenmeter je Teil nur aus Strava-Fahrten (hochgeladene GPX-Fahrten haben kein Velo). Farbe der Strava-Karte aus Tokens (`--warn-soft`), nicht Strava-Orange. Am Handy ist die Karte eine schmale Zeile (Titel, «Verbinden», «Später»), damit die Tour-Karte im ersten Bild bleibt (Noah 2b).

## 13.10.2026: Neue Tour Teil 2 (0.124.0)

Mockups B4 und B5 (`design/rahmenbedingungen/`, Galerie «Offene Mockups 2» #rahmenbedingungen). **Mockup-Freigabe: B4/B5 «b2 b4 b5 ok» 12.10.2026 22:55 Zurich; B5 Standard a ★** («Ja, schlank dabei», 13.10.2026 00:00 Zurich). Antworten der Runde: 1a (Bausteine nur beim Packen), 6a (schlanke Reparatur ≤ 8).

- **B4 Bausteine beim Packen:** oben in Packen eine Karte «Bausteine · n dabei · m zur Wahl». «Dabei» grün mit Haken, «Dazunehmen» weiss mit +, ein Vorschlag gestrichelt mit kleinem Schild. Ein Tipp schaltet den ganzen Baustein (wie die bisherigen Schalter, mit Rückgängig). Maus darüber oder lange drücken zeigt den Inhalt (die Erklär-Blase von 0.117.0).
- **B5 Reparatur unterwegs:** hat «Reparatur» mehr als 8 Teile, ist sie in Packen ein gestrichelter Vorschlag; der Tipp öffnet ein Fenster mit höchstens 8 vorgeschlagenen Teilen als Auswahl-Knöpfe, «Später» und «8 Teile übernehmen». Übernehmen: die übrigen Teile verlassen den Baustein (bleiben im Material, Rückgängig unter Material › Bausteine › Reparatur oder sofort mit «Rückgängig»), die 8 kommen auf die Tour.
- **Standard B5 (a ★):** eine schlanke Reparatur (≤ 8 Teile) kommt mit jeder neuen Tour wieder von selbst, als abwählbarer Vorschlag. Eine Reparatur mit mehr als 8 Teilen bleibt bei neuen Touren aus (wie 0.114.0), bis sie schlank ist. Laden bleibt aus.
- **Gemeinsamer Knopf:** `ui/OptionButton.svelte` (klein: die Vorlagen-Knöpfe der neuen Tour, vorher `.obtn` in TripDialog; gross: B4/B5).
- **Nicht gebaut:** «Neues Teil direkt beim Packen» (NP1), noch nicht freigegeben.
- **Selbst entschieden:**
  - «Extra warm» ist kein Knopf: Warm ist seit 0.66.0 (Noah 6a) kein Baustein mehr, die warmen Schichten kommen mit dem Wetter («An das Wetter angepasst» in Planen).
  - Welche Bausteine Knöpfe sind: die bisherigen Schalter (Erste Hilfe, Licht, Reparatur, Laden, Rennen, Kochen), dazu Verpflegung, Hygiene und eigene Bausteine; nur mit Teilen; ohne Temperatur-Kits und Komfort (wird Stück für Stück angeboten). Nur bei Velotouren, die nicht vorbei sind.
  - Vorschlag «Regen»: ein eigener Baustein mit «Regen/Rain» im Namen, wenn die Tour Schauer/Regen hat oder die Regenwahrscheinlichkeit ab 30 % ist; das Schild nennt die Prozent, ohne Wochentag.
  - Die 8 Vorschläge: Schlauch, Pumpe, Multitool, Reifenheber, Kettenschloss, Flickzeug, Tubeless, Kabelbinder (dann Klebeband, Ventil, Schaltauge, Speiche); Werkstatt-Werkzeug (Standpumpe, Montageständer, Drehmoment, Kassette, Nieter, «gross») und Unbenanntes über 400 g nie. Ein 9. Teil wird mit einer Zeile abgelehnt.
  - Im Fenster zeigt «Bleibt in der Werkstatt» 6 Teile, «… und n weitere» zeigt alle. Am Handy ist das Fenster bildschirmfüllend mit den zwei Knöpfen unten.
  - Hat eine Tour schon die volle Reparatur «Dabei», steht unter den Knöpfen ein Link «Reparatur hat n Teile: 8 für unterwegs wählen».
  - Schnellstart (0.119.0) bleibt unverändert (bringt Reparatur und Laden wie bisher); eine Frage für die nächste Runde.

## 13.10.2026: Trophäen-Vitrine (0.123.0)

- (Mockup-Freigabe: TV1–TV2 «tv1-tv2 freigeben» Noah 13.10.2026 15:57 UTC im Thread «Mein Überblick», Antworten «1-5a» 15:50 UTC). TV1: eigene Seite «Trophäen-Vitrine» (#/flow/trophies) mit allen erreichten Sternen nach Bereich (Über alle, dann jede Aktivität) und Jahr, Filter oben, rechts «Nach Jahr» und «Als Nächstes erreichbar». TV2: Link «Alle Trophäen ansehen ›» unter dem Trophäen-Regal (Meilensteine und Meditations-Protokoll).
- **Selbst entschieden:** nur die Sterne, die es heute gibt (flowms.js); Velo/Strava- und Gesundheitssterne kommen mit Bündel B, Tages-Check-Sterne mit D, je im eigenen Paket. Bereiche ohne Stern stehen als eine Zeile «Noch ohne Stern: …» statt als leere Karten. Pro Meilenstein ein Abzeichen mit dem höchsten Stern (Stufe und Monat); der nächste Stern pro Bereich gestrichelt. Der Link im Meditations-Protokoll öffnet die Vitrine gefiltert auf Meditation. Version 0.123.0, weil 0.122.0 (Dateneingabe) vorher.

## 13.10.2026: Dateneingabe D1–D4 (0.122.0)

- (Mockup-Freigabe: D1–D4 «D1–D4 freigegeben» 13.10.2026, Antworten «1a 2a 3b 4b 5a», D1 als Variante D1a ★ Wert-Karten). D1: direkt im Blatt tippen; D2: eigene Seite «Werte erfassen» mit «Weiter» ins nächste Feld; D3 (3b): «Felder wählen» gilt für alle Velos; D4 (4b): ausgeblendet nur auf «Werte erfassen»; 5a: eigene Felder mit Name und Einheit.
- **Selbst entschieden:** Werte im Abhol-Check haben kein Kästchen mehr, eine gespeicherte Karte gilt als erledigt; «Wie vorher» übernimmt den alten Wert mit einem Tipp; eigene Felder lassen sich umbenennen und löschen, ihre Werte bleiben am Velo und kommen beim Wiederanlegen zurück; − und + in Schritten von 0,1 bar bzw. 1; Version 0.122.0, weil 0.121.0 (Strava-Fahrten zählen mit) vorher live ging; Noah wählte D1a ausdrücklich («D1a D1–D4 freigegeben», 15:26 UTC).

## 13.10.2026: Schnellstart (0.119.0)

Mockups Q1–Q3 (`design/schnellstart/`). **Mockup-Freigabe: Q1–Q3 «Q1–Q3 freigegeben» 13.10.2026 00:05 Zurich**, Antworten **«1-5a»**:

- **Q1 Schnellstart ersetzt die Tagestour auf Heute:** der Knopf im Vorschlag (und die Kachel «Tagestour») heisst «Schnellstart». Ein Klick, kein Fenster: immer heute und sofort (die Regel «ab 14 Uhr morgen» gilt hier nicht mehr), 2,5 Std., das zuletzt gefahrene Velo (bzw. das, das der Vorschlag zeigt), nur die Standardteile (keine Kopie der letzten Tagestour, keine Vorlage), Wetter aus der Wohnort-Vorhersage für heute, offline kein Wetter.
- **Name:** lokaler Zeitstempel JJJJMMTTHHmm (z. B. 202610130000); ein zweiter in derselben Minute bekommt « (2)» (`freeTitle`).
- **Q2a Auf Heute bleiben:** kein Sprung zu Packen; grüne Karte «Tour geplant: <Name>» mit «Heute · 2,5 Std. · <Wetter> · steht unter Touren › Geplant», «Öffnen» und «Rückgängig» (löscht die Tour). Auf Touren steht die Tour unter «Bald unterwegs» (so lassen).
- **Q3 Tourname markiert:** jedes Feld für den Tournamen markiert beim Fokus (Tippen, Klick, Tastatur) den ganzen Namen, Tippen überschreibt; ein Klick ins schon aktive Feld setzt den Cursor normal.
- **Selbst entschieden:**
  - Die Karte hat zusätzlich ein «×» (Schliessen, 44 px), damit sie ohne Öffnen oder Rückgängig weggeht; sie schwebt unten über der Seite wie im Mockup.
  - «Öffnen» führt in den Schritt, in dem die Tour gerade ist (wie «Tour öffnen» auf Heute, U007): für eine Tour von heute ist das «Packen».
  - Mit einer Tour heute zeigt Heute keinen Vorschlag mehr (früher: «Vorschlag für morgen» als schmale Zeile), weil der Schnellstart immer für heute ist.
  - Die Stunden schreiben sich im Deutschen «2,5» wie im Mockup.
  - «Tagestour jetzt» im Neu-Menü, in der Suche («tagestour») und unter «Kennst du schon?» bleibt der bisherige Weg (macht die Tour in Packen mit «Ändern»); das ist eine Frage für die nächste Runde.
  - Der Funktions-Schlüssel der Kachel bleibt `dayride` (damit Zählung und Anordnung der Kacheln bleiben); im Katalog von Was ist neu kommt die neue Funktion `f.quickstart` (seit 0.119.0) dazu, die Kachel zählt für sie.
  - Version 0.119.0: 0.118.0 ist ein anderes Release, das vorher gemergt wird.

## 13.10.2026: Was ist neu 2 und KI-Helfer ausblenden (0.118.0)

**Mockup-Freigabe:** W1–W3 Noah 13.10.2026 00:02 Zürich «w1-w3 freigeben», Antworten «1a 2a 3a 4a 5a» (12.10.2026 20:58). K1–K4 Noah 12.10.2026 21:50 «k1-k4 ok» (Antwort a ★), Q4 1a: zusammen mit Was ist neu ausliefern.

- **1a Ton:** locker mit Augenzwinkern, höchstens ein Emoji pro Version.
- **2a Kleinkram:** in den Kästchen Neu, Schöner, Repariert, Schneller.
- **3a «Looos»:** nur im Fenster nach einem Update.
- **4a Liste:** alle Versionen offen, nach Monat gruppiert.
- **5a Reihenfolge:** nach #131.
- **Noahs Wunsch:** im Fenster ist jede Neuigkeit offen, jede Zeile antippbar (›), kein «n weitere». Alle Versionstexte einmal neu, Englisch und Deutsch; Versionen, Daten, Adressen und Testschritte bleiben.
- **KI-Helfer (a ★):** von Anfang an ganz aus; ein Schalter unter Ich › KI-Helfer «KI-Helfer in der App zeigen» schaltet alle Stellen auf einmal ein. Schlüssel und Einstellungen bleiben gespeichert.
- **Selbst entschieden:**
  - W2: «Alle Funktionen» ist eine Zeile; die Funktionsliste steht unverändert unter `#/me/news?all`. Die Seitenteile «Nie ausprobiert», «So testest du» und «Geplant» bleiben.
  - Schalter «Meldung nach Updates zeigen»: neue Beschriftung, die Erklärung darunter bleibt.
  - Alle bisherigen Versionen sind im Oktober 2026, darum gibt es heute eine einzige Monatsgruppe.
  - Das Bild einer Zeile kommt aus ihrer Adresse (`iconOf`), keine Liste pro Punkt.
  - Kein neuer Eintrag im Funktionskatalog (`SINCE`); «Was ist neu» und der Helfer sind schon dort.
  - K4 «So steht es unter Ich»: als Zeile auf Ich umgesetzt («aus · einschalten unter Ich › KI-Helfer», «an · nicht eingerichtet», «pausiert bis nächsten Monat», «an»), nicht als Vorschau auf der Seite.
  - Neue Tour: der Text der Stelle beschreibt, was die App heute tut (eine Frage aus der Suche).
  - Den Schlüssel speichern schaltet den Helfer nicht ein; der Schalter allein entscheidet. Das alte Feld `on` wird nicht mehr gelesen, bleibt aber gespeichert.
  - Die Heute-Kachel «KI-Helfer» ist versteckt, solange der Helfer aus ist (auch im Kachel-Katalog), und bleibt an ihrem Platz in der Wand gespeichert.
  - Menüeintrag heisst jetzt «KI-Helfer» (vorher «Helfer»).
  - Titel 0.118.0 «Was neu ist, neu erzählt», damit die Heute-Kachel am Handy nicht mitten im Wort umbricht.
  - Kein Ausblenden am Rand der Scrollfläche im Fenster.

## 12.10.2026: Knöpfe neu (0.117.0)

Mockups N1–N4 (`design/knoepfe-neu/`, Noahs Wunsch 12.10.2026 22:31: Knöpfe erklären ihre Aktion, lange Texte verschieben nichts, Knöpfe rechtsbündig). **Freigabe Noah 12.10.2026 22:47 «n1-n4 freigeben»**, Antworten **«1a 2a 3a 4a 5b»**:

- **1a Lage:** Handy: die Knöpfe einer Zeile stehen unter dem Text, der Hauptknopf so breit wie die Karte, «…» (44 px) daneben. Computer: rechtsbündig, alle Zeilen enden am selben Rand, Hauptknopf mindestens 128 px.
- **2a Erklärung:** Computer: Blase beim Darüberfahren und bei Tastatur-Fokus (Titel und Kontextzeile). Handy: langes Drücken (~450 ms) zeigt dieselbe Blase, der Knopf löst dabei nicht aus. Nach einem Tipp, der Daten ändert, eine kurze Bestätigung mit «Rückgängig», wo die App ein Rückgängig hat.
- **3a Mehr:** ein Hauptknopf pro Zeile, alles andere hinter «…»; jeder Eintrag mit Titel und einer Erklärzeile; am Handy als Blatt von unten.
- **4a Text:** Knopftext höchstens 2 Wörter, bricht nie um; der lange Teil steht in der Erklärung.
- **5b Umfang:** alle Seiten auf einmal, als eigenes Paket.
- **N3-Regeln:** drei Arten (Haupt grün, höchstens einer pro Zeile oder Ansicht; Normal weiss mit feinem Rand; Leise unterstrichen), eine Höhe 44 px, «…» für den Rest, Nur-Symbol-Knöpfe immer mit Erklärung.
- **Selbst entschieden:**
  - Ein Listener für die ganze App (`ui/explain.js`, in `main.js` gestartet) statt Code pro Seite: Knöpfe mit `data-explain` (und `data-explain-sub`) zeigen ihre Erklärung, Knöpfe nur mit Symbol ihren Namen (aria-label). Ein Knopf mit eigenem `title` behält am Computer den Tooltip des Browsers; am Handy zeigt langes Drücken diesen Titel. Die Blase steht am Handy 4 s und verschwindet beim nächsten Tippen.
  - Gemeinsame Bausteine mit klarer Schnittstelle für andere Pakete (z. B. «Neue Tour überarbeiten»): `ui/Btn.svelte` (kind hi/normal/quiet, icon, label, explain, sub, href), `ui/MoreActions.svelte` (title, label, actions mit name, explain, icon, run, current), `.rowacts` in `app.css`. Neue Klassennamen `.xtip`, `.btn.dots`, `.rowacts`, weil `.xb` und `.more` in Seiten schon vorkommen.
  - Im «…» steht die Hauptaktion der Zeile als erster, hinterlegter Eintrag (wie N2). Die Einträge «Für den Velomech» und «Nicht mehr nötig» aus N2 fehlen in «Jetzt fällig»: die App kann eine fällige Wartung heute weder auf den Auftrag setzen noch wegnehmen, und neue Funktionen gehören nicht in dieses Paket. Neu im «…» ist «Velo öffnen» (die Seite gab es schon).
  - «Jetzt fällig» zeigt weiter höchstens 3 Zeilen (N1 zeigte 5); keine Änderung am Verhalten.
  - «Erledigt» und «Alle ok» in der Velopflege nutzen das bestehende Rückgängig eines gespeicherten Teil-Ablaufs (die Teile wie vorher). Der Text der Bestätigung bleibt «Gespeichert: …» (statt «… als erledigt markiert»), Aussehen wie N2: dunkle Leiste, Häkchen, unterstrichenes «Rückgängig».
  - Das alte •••-Menü (`care/MoreMenu.svelte`) nutzt jetzt `ui/MoreActions` (gleiche Schnittstelle). Es schliesst bei einer Wahl, mit Escape, wenn der Fokus es verlässt (ein Klick daneben), am Handy auch beim Tipp auf den dunklen Hintergrund und mit der Zurück-Taste. Beim Zusammenführen mit dem Menü-Fix (0.115.0) bleibt `MoreMenu.svelte` die Hülle um `ui/MoreActions`.
  - Velopflege-Texte nach N4: «Erfassen …» → «Eintragen …», «Werkstattauftrag senden» → «Senden», «Abhol-Check» → «Abholen», «Check ansehen» → «Ansehen», «Alles geprüft, OK» → «Alle ok», «Auf die Wunschliste» → «Wunschliste»; «Als Aufgabe merken» → «Merken» (bei den Helfer-Karten im «…», Hauptknopf dort «Erledigt»). In der Übersicht ist «Erledigt» jetzt grün (N1); der Test v048 folgt.
  - 50 Knöpfe auf 25 Seiten und Fenstern (Material, Packen, Touren, Vorlagen, Velo-Blätter, Eingang, Heute, Kleiderschrank, Import, Meditation …) haben höchstens 2 Wörter; ihr bisheriger langer Text ist die Erklärung. Bewusst länger bleiben: Knöpfe mit Daten im Text (Tourname, Suchwort, °C, CHF, Minuten, Kit-Bereich), «Alle Daten ersetzen» (eine Bestätigung, die nicht rückgängig geht, nennt, was sie tut), die zwei Antworten im Teil-Fenster («Ersetzen oder Arbeit nötig», «Ersetzt oder erledigt»), «Sortieren und filtern», «Was ist neu» (Name einer Seite) und «So testest du es» (frisch freigegebenes Mockup). `TripDialog.svelte` ist nicht angefasst («Neue Tour überarbeiten»).
  - Neue Funktion «Knöpfe erklären sich» im Katalog von Was ist neu, seit 0.117.0.
  - Version 0.117.0: main ist 0.116.0 (0.114.0 «Rahmenbedingungen», 0.115.0 «Menü-Fix», 0.116.0 «Strava-Verbindung»). Nach dem Menü-Fix nutzt auch `ui/MoreActions` (und damit das alte •••-Menü der Velopflege) `ui/away.js`: ein Tipp daneben schliesst die Liste am Computer.
## 12.10.2026: Menü-Fix (0.115.0)

Noah 12.10.2026 22:22: «erst bei zweitem Klick geht Menü wieder weg», dringend. Vorher/Nachher freigegeben 23:02 «menü fix freigeben».

- Jedes •••-Menü schliesst mit einem Tipp daneben, überall gleich (`ui/away.js`, wie schon `tpl/Menu.svelte`). Der Tipp daneben wird nicht verschluckt: Er tut auch, was er trifft.
- **Selbst entschieden:** nur Verhalten, kein neues Aussehen; Material und Kleiderschrank (eigene Lösung mit Klick daneben) bleiben, wie sie sind.

## 13.10.2026: Bugfix Dateneingabe 0.116.2

Noah 13.10.2026 11:15 Zürich: beim Velo-Abholen liessen sich die Werte in der App nicht eintragen, man landete immer auf anderen Seiten. Ziel: alle Werte am Handy bequem eingeben und bearbeiten, einzelne Felder ein- und ausblenden.

- **Selbst entschieden (keine Oberfläche):** «eintragen» öffnet genau den einen Wert dieses Velos zum Tippen (im bestehenden Eingabefenster von «Velos vergleichen») und führt nach Speichern oder Abbrechen zurück aufs Blatt. «Werte ändern» auf Velo-Pass und Abhol-Check öffnet die Ausstattung des Velos.
- **Offen, als Mockup-Runde:** Eingabe direkt im Blatt (ohne Seitenwechsel) und Felder ein-/ausblenden. Gebaut wird erst nach Noahs ausdrücklicher Freigabe.

## 13.10.2026: UI-Prüfung der Live-App und Fehler-Fix 0.116.1

Claude hat 0.110.0 und 0.111.0 aus Nutzersicht durchgeklickt (alle Seiten, Computer und Handy, rund 700 Knöpfe, erfundene Testdaten). Bericht mit 15 Befunden: https://claude.ai/artifact/ABifxRDhYYkvEaAyFCDgM4. Noah 13.10.2026 00:13/00:14 Zürich «1a 2a» und «3a4a 5a»:

- **1a:** Der Absturz A1 (alte Rückblicke ohne Teileliste öffnen eine leere Seite) kommt sofort als kleiner Fix ohne sichtbare Änderung: 0.116.1.
- **2a:** «Zahlen stimmen» (gleiche Zahl, gleicher Wert auf allen Seiten) als kleiner Release in Bündel A, mit Mockup vorher/nachher (Thread «Design-Refresh»).
- **3a:** Die Unterwegs-Ansicht (Heute und Packen zeigen während der Tour den Tag statt Pack-Aufgaben) und die zwei Leisten unten am Handy kommen mit Skitour-Erlebnis (Bündel C).
- **4a:** Heute aufräumen (doppelte Kacheln, abgeschnittene Knöpfe der Kachel «Neu» am Handy) kommt mit «Was ist neu 2» (W1–W3) im Design-Refresh.
- **5a:** Der Kleinkram (Texte, Silbentrennung im Kleiderschrank, Tabelle am Handy, «Nicht gebraucht»-Häkchen, Backup-Satz, «Problem melden») fährt in Bündel A mit, ein Mockup-Blatt vorher/nachher.

## 12.10.2026: Bausteine bearbeiten, Teil 1: Vorabend- und Schluss-Check (0.111.0)

Nach den Mockups A–F «Bausteine bearbeiten» (Offene Mockups #bausteine-bearbeiten, Trello «Bausteine bearbeiten»), Noah im Thread 12.10.2026 «freigabe 1-5a: bausteine bearbeiten und ansehen». Das sind Antworten auf die a/b-Fragen, noch keine Freigabe der Bilder: Die Mockups A und B brauchen Noahs ausdrückliche Freigabe, bevor der PR bereit ist (gefragt 12.10.2026). Noah 12.10.2026 16:18 «4b»: der Thread «Design-Refresh alle Seiten» übernimmt den PR, neu als 0.111.0 nach dem Design-Refresh.

- **1a:** Checks bearbeitet man direkt in der Tour (wie den Start-Check) und speichert sie als Standard pro Reiseart.
- **2a:** «Meist vergessen» zählt automatisch aus allen Rückblicken der Reiseart; anheften, ändern, aus der Liste nehmen; Top 3 oben beim Packen (kommt als eigener Release).
- **3a:** Der Schluss-Check steht auf «Tour beendet», vor dem Rückblick.
- **4a:** Learnings werden wirklich gelöscht, mit Rückgängig (kommt mit D/E).
- **5a:** Der Regel-Editor startet mit den 10 Regeln aus dem Content-Doc, Zahlen änderbar, eigene Regeln dazu; Regeln schlagen nur vor (Release 2).
- **Wer baut was (Noah 12.10.2026 «1a»):** «Bausteine bearbeiten» A–F wird im Thread «Bausteine bearbeiten» fertig gebaut, für alle Reisearten. Der Skitour-Fahrplan (Thread «Neu planen») baut A–F nicht selbst, sondern zeigt dieselben Listen (`src/lib/checks.js`, `src/lib/trip/TripCheck.svelte`) in seinen Schritten 3 Packen und 5 Heimkommen.
- **Neue Mockup-Ablage (Noah 12.10.2026 «bitte ab sofort einen neuen Ort zur Ablage für Mockups verwenden»):** Die Seite «Offene Mockups» hat die Grenze von 512 Dateien erreicht. Neue Runden kommen auf «Offene Mockups 2» (https://claude.ai/artifact/3j2eefXk4fHn6txJsp4i36); die erste Seite verweist oben darauf, ihre offenen Runden bleiben dort.
- **Selbst entschieden (Übernahme 0.111.0):** Seit P5 und P6 haben «Gepackt» und «Tour beendet» das neue Aussehen. Der Vorabend-Check steht jetzt unter «Bis zum Start», der Schluss-Check direkt unter der Karte «Tour beendet», vor «Unterwegs notiert». Neue Funktion «Checks davor und danach» im Katalog von Was ist neu (jetzt 86), seit 0.111.0.
- **Selbst entschieden:** Kleine Releases (Regel «eine sichtbare Sache»): 0.111.0 nur A+B. Die Tour speichert ihre Liste erst bei der ersten Änderung; bis dahin zeigt sie den Standard bzw. Vorschlag (spätere Standard-Änderungen wirken so auch auf geplante, unberührte Touren). Der Vorabend-Check steht auf «Gepackt» bis zum Starttag, die Abend-Erinnerung auf Heute führt dorthin (statt zum Packtag). Die Vorschläge kommen aus dem Content-Doc (Skitour, Wandern) und sind für Bikepacking, Weekend und Weltreise kurz gehalten.

### 12.10.2026 abends: Vorabend- und Schluss-Check nach den Mockups V1–V6 (0.111.0)

Noah 12.10.2026 18:22 zur ersten Fassung: «passt nicht ins design … jede art soll eigene vorabend checks haben». Neue Mockups V1–V6 (`design/vorabend-check-3/`, Offene Mockups 2). Freigaben: **V1–V4 12.10.2026 22:34 «v1-v4 ok»**, **V5–V6 12.10.2026 22:39 «v5-6 ok»**; beide im selben PR #131 als 0.111.0 gebaut. Ersetzt die Karte `TripCheck` (Mockups A und B).

- **V1/V5:** Der Check ist eine Zeile auf «Gepackt» («Bis zum Start») bzw. «Tour beendet» («Bevor du auspackst») und öffnet ein Fenster wie die Ladeliste (T8).
- **V2/V6:** Fenster mit Chips, Fortschritt, Zeilen mit Link und rundem Häkchen; «Liste anpassen», «Später», «Fertig» bzw. «Fertig, zum Rückblick».
- **V3:** Liste anpassen mit Sortieren, Entfernen, eigenem Punkt, Vorschlägen und «Gilt für: Nur diese Tour / Alle {Reiseart}» (vorgewählt «Alle», wie im Mockup).
- **V4:** Ich › Checks pro Reiseart; jede Reiseart hat eigene Vorschläge (Texte aus V4 und V6).
- **Selbst entschieden (nur zeigen, wofür die App Daten hat):** «Dein Morgen», «Verhältnisse», «Plan und echt», «Dein Material» und «Aktivität von der Uhr» aus den Mockups fehlen: die App hat dafür keine Daten (keine Zeiten, keine Lawinenstufe, keine Uhr-Anbindung). Chips und Zeilen zeigen nur Wetter, Route, Ladeliste, Notizen und «Rückblick wartet». Links nur, wo eine Seite existiert (SLF, MeteoSchweiz, Ladeliste); «3×3 Öffnen», «Teilen», «Senden» und «Einkaufsliste» folgen, wenn es die Funktionen gibt. «Eigene Reiseart» (V4) gibt es noch nicht. Die Lernzeile kommt aus «Was hat gefehlt?» früherer Rückblicke derselben Reiseart. Die Statistik «in X von Y Touren erledigt» zählt nur Touren, die schon begonnen haben. Zeilen auf Ich › Checks pro Reiseart haben keinen Pfeil: «Anpassen» öffnet die Liste. Regeln wie «Tee ab −5° 1 L» und Erinnerungszeiten (V4 rechts) kommen mit dem Regel-Editor (F). Der Hinweis «neu» (gestrichelter Rahmen) gehört nur zum Mockup. Sortieren auch mit Pfeiltasten auf dem Griff. «Vorschlag wiederherstellen» auf Ich › Checks löscht den eigenen Standard der Reiseart.

## 12.10.2026: «Rahmenbedingungen» statt «Neue Tour» (0.114.0)

Nach Noahs Wunsch (12.10.2026 19:42, Prio hoch) und den Mockups B1–B5 (Galerie «Offene Mockups 2» #rahmenbedingungen, Trello FONIq38q): B1 «b1 ok» 20:42, B3 «b3 ok» 20:43, B2/B4/B5 «b2 b4 b5 ok» 20:55. Antworten «1a 2a 3b 4b 5b», «6a», 7a.

- **Fehler «Letzte Tour»:** seit 0.104.0 stand die neueste Tour mit dem Velo (auch Test- und künftige Touren) als Start in der Galerie. Neu startet eine Tour nie mehr aus einer vergangenen Tour in diesem Fenster; nur Standard, eigene Vorlagen und Beispiele. Daten waren nicht betroffen.
- **«92 Teile»:** Reparatur (36 Werkzeuge) und Laden kamen seit 0.66.0 bei jeder Fahrt von selbst. Neu kommen sie bei einer neuen Tour nicht mehr von selbst (gespeichert als `sets.repair/charge: false`), beim Packen sind sie einen Schalter entfernt. Die schlanke «Reparatur unterwegs» (6a, B5) kommt mit Release 2.
- **1a:** Vorlagen zugeklappt im Fenster, Bausteine nur beim Packen (Release 2: B4).
- **2a:** «Sportart» Fahrrad · Skitour · Wandern, «+ Andere» öffnet Wochenende und Weltreise. Standard bei neuer Tour: Fahrrad (vorher: die zuletzt gewählte).
- **3b:** je zwei Beispiel-Vorlagen pro Sportart (Fahrrad: Tagestour, Wochenende; Skitour: Tagestour, Hüttentour; Wandern: Tageswanderung, Hüttenwanderung). Ein Beispiel setzt Tage, Fahrstunden und Übernachtung und startet aus Standard. «Beispiele ausblenden» (Einstellung `tplExamplesHidden`).
- **4b:** die ganze Packliste im Fenster, in vier Gruppen: Kleider (Kategorien am Velo, neben dem Velo, Schuhe, Regen & Kälte), Elektronik (Elektronik, Licht), Extra warm (Kälteschichten, die das Wetter bringt), Ausrüstung (alles andere). Bild = Symbol der Kategorie.
- **5b:** Event = Hinweis und Baustein «Rennen», keine Folgeschritte.
- **7a:** der Knopf «Tour erstellen · n Teile» zählt nur Teile für die Taschen; Teile am Körper stehen als eigener Satz.
- **Wetter (Noah: «mit PLZ, kostenlos»):** Start-PLZ oder Ort, vorbelegt mit dem Wohnort, Suche über Open-Meteo (kostenlos, ohne Schlüssel). Ein eigener Ort wird als `trip.place` gespeichert und gilt auch fürs Dunkelwerden.
- **KI-Helfer:** aus dem Fenster raus (auch die Einrichtungs-Notiz). Nur wenn die Suche «Als Packliste vorschlagen» mit einer Frage öffnet, erscheint «Frag den Helfer» noch, damit dieser Weg nicht ins Leere führt. Das Ausblenden an den anderen Orten (K1–K4) macht der Thread «Design-Refresh».
- **Selbst entschieden:** Übernachtung bleibt als Knöpfe (wie bisher) statt Feld; Optionsknöpfe der Vorlagen lokal im Fenster gebaut, die gemeinsame Knopf-Komponente (N1–N4) baut der Thread «Design-Refresh»; Knopftext bleibt «Tour erstellen».

## 12.10.2026: Design-Refresh P10 «Was ist neu» (0.110.0)

Nach den Mockups I11 (v2), I11b (v2), I11c, I11d und I11e (Noah 12.10.2026 03:50 «Runde 20 freigegeben»; Antworten 03:45 «1 beides, 2b, 3 beides, 4a, 5b»).

- **Meldung nach einem Update (2b):** kommt bei jedem Start nach einem Update, bis «Nicht mehr anzeigen» angekreuzt ist; das gilt bis zum nächsten Update und lässt sich unter Ich › Was ist neu wieder einschalten. «Später», ✕, «Alle Neuigkeiten» und «Ausprobieren» schliessen nur für diesen Start. Ersetzt «einmal pro Update» (0.78.0).
- **Deine Top 10 und Wichtigste 10 (1 beides):** gezählt wird nur auf diesem Gerät (localStorage), nie im Backup, nicht auf der Spielwiese. Es zählen «Hinbringen» bei einer Funktion, die Knöpfe auf Heute und die Such-Befehle. Wichtigste 10 ist eine feste Auswahl.
- **Kachel «Neu» (5b):** nach einem Update 14 Kalendertage oben auf der Kachel-Wand als ganze Zeile; danach zurück an ihren Platz (oder weg, wenn sie vorher nicht da war), ausser sie wurde von Hand verschoben, vergrössert oder weggenommen. Die Kachel kann jetzt auch «Ganze Zeile» sein.
- **Selbst entschieden (P10):** neue Adresse `#/me/news` (Zeile in Ich › Die App); `#/features?news` bleibt wie es war. Neue Funktion «Was ist neu» im Katalog (jetzt 85). «Seit» jeder Funktion aus der Liste der Neuigkeiten abgeleitet. Ältere Versionen haben keinen Namen: die Versionsliste zeigt den ersten Punkt. Die Seite zeigt 10 Funktionen, «Alle 85 Funktionen ›» öffnet die ganze Liste; im neuesten Monat 6 Versionen, der Rest mit «Alle n Updates». Der Knopf auf «Was ist neu» heisst «Loslegen» / englisch «Go» (Noah 12.10.2026 «3 loslegen / eng. go»; Mockup: «Hinführen»); «Was die App kann» behält «Hinbringen». Die Häkchen von «So testest du» bleiben auf dem Gerät. «Als Nächstes geplant»: Skitour als Fahrplan, Merken und Agenda, Reisearten neu.

## 12.10.2026: Design-Refresh P6 «Rückblick, Auswerten, Fahrten» (0.109.0)

Nach den Mockups T14–T18 (Noah 12.10.2026 01:00 «T13–T18»), T19 (01:42 «t19 ok») und T20–T23 (01:51 «T20–T23 freigegeben») und «10 Pakete» (P6 = R12+R13+R14). Nur das Aussehen ist neu.

- **Selbst entschieden (P6):** Die Titel «Tour beendet» und «Fahrt hochladen» bleiben. Hauptknöpfe bleiben in der Weiter-Leiste wie in P5. «Weitere Vorschläge» unter «Was hat gefehlt?» bleiben sichtbar statt zugeklappt, damit man sieht, was mit «Fertig» übernommen wird. Vergangene Touren behalten alle 9 Spalten; «In diesem Zeitraum» als 5 Kacheln darüber. Im gespeicherten Rückblick steht im Band «Antworten ändern» (wie T16), zurück geht es über den Pfad oben. Strava bleibt Datei-Import (Noah «4a»). Nicht gebaut, weil neu oder ohne Daten: Stimmungs-Skala, «Deine schönsten Touren», Fotostreifen, Band-Profil, Vergleich zweier Touren, Wisch-Karte bei Gelernt, Tempo-Regeln mit/ohne Gepäck, eigene Logbuch-Kacheln und Diagramm, «Alte Tour nachtragen», «Was war anders als letztes Mal?», Monats-Kacheln bei Fahrten, Karte, Puls und Leistung einer Fahrt.

## 12.10.2026: Design-Refresh P9 «Ich» (0.108.0)

Nach den Mockups I1–I3 (Noah 12.10.2026 03:06), I4–I6, I8, I9 (03:20), I7 neu, I10, I12, I13 (03:50 «Runde 20 freigegeben») und den Bausteinen 20 «Status-Ampel» und 35 «QR-Code» (11.10.2026). I11 «Was ist neu» kommt mit P10.

- **Selbst entschieden (P9):** «Daten und Backup» ist eine eigene Seite `#/me/data`, «Aufs Handy» eine eigene Seite `#/me/phone` mit QR-Code (nur die Adresse der App; Daten reisen weiter per Backup-Datei). Für den QR-Code kommt die kleine, freie Bibliothek `qrcode-generator` dazu (läuft auf dem Gerät, kein Dienst). Drei Lichter: Backup, Ordner, Speicher; ein ausgeschaltetes Ordner-Backup ist grau, weil es nur ein Vorschlag ist. Namen bleiben «Helfer» und «Heimat», die Sprache bleibt ein Schalter in der Zeile. «Problem melden» erscheint nur mit Velos. Nicht gebaut, weil neu: Lichter für Strava, Wetter und Handy-Abgleich, Abgleich über den QR-Code, Felder «Art» und «Wer macht es», Abhaken direkt in der Notizen-Liste, ein Umschalter beim Import-Check.

## 12.10.2026: Design-Refresh P8 «Aktiv» (0.107.0)

Nach den Mockups A1–A2, A4–A6 (Noah 12.10.2026 02:40 «a1-a6 freigeben»), A7–A8 (02:47 «A7 - A9 freigabe»), A13 (03:06), A14 und A14c «Muster» (03:15 «freigabe für a14 und a14c»); A3 und A9–A12 bleiben wie heute (Noah 02:44, 02:47, 02:51). Challenge-Regel nach D1b/D5 («d1-d5 freigeben» 03:59).

- **Selbst entschieden (P8):** Der Seitentitel heisst «Aktiv» (vorher «Im Flow»). Stoppuhr als Zeile unter «Mehr». Die Erholungs-Karte fällt weg (die Ringe zeigen sie). Tagescheck bleibt 1–10, Abhaken 15/30/45/60 Min. Der Ziel-Weg nutzt den nächsten Meilenstein (es gibt kein Saison- oder Jahresziel). Aktivität: Antippen öffnet die Kachel, Umbenennen unter «Kacheln ändern», die Meilensteine ziehen auf die Seite Meilensteine. Vorschläge mit `SuggestTile`/`ChallengeSheet` auf Aktivität («Vorschlag für heute») und Meditation «Mehr» («Heute vielleicht»). Logbuch: Kalender als 13 Wochen; alte Links mit view=cal/chart öffnen die Übersicht. Muster: Rekorde über alle Sitzungen, Kurven über 13 Wochen; kein wertender Satz. Nicht gebaut, weil ohne Daten oder neu: Jahreskreis (B34), Saison- und Jahresziele, «Pendeln zählt», Teilen als Bild, Ziel- und Trendlinie, «Als Tipp vor dem Start zeigen».

## 12.10.2026: Design-Refresh P5 «Packen und Unterwegs» (0.106.0)

Nach den Mockups T6–T13 (Noah 12.10.2026, alle Seiten «Runde 20 freigegeben») und «10 Pakete» (P5 = R10+R11). Nur das Aussehen ist neu.

- **Selbst entschieden (P5):** Packen zeigt «Taschen» als eine Liste, die offene Tasche darunter; der Ring bleibt nur in der Handy-Leiste. Unterwegs: Basischeck links, «Was ist wo» zählt Taschen, das Wetter Stunde für Stunde bleibt offen, «Heute Abend laden» als eigene Liste. **Tour beenden:** «Tour beenden» ist jetzt der grüne Hauptknopf (wie im Mockup T13), «Weiterfahren» bleibt zuerst; das ersetzt «rot darunter» aus U25a. Die Gründe bleiben Wetter, Panne, Müde, Plan geändert. Nicht gebaut, weil neu: «Ziel unter 12 kg», Ausgelegt-Bild, Erinnerung am Vorabend, ein gemeinsames Fakten-Blatt, Licht-Bogen, «Doch heute starten», Unterwegs-Modus mit grossen Knöpfen, Regen-Hinweis, Namen der Herkunfts-Touren bei Learnings.

## 12.10.2026: Design-Refresh P7 «Velo» (0.105.0)

Nach den Mockups V1–V14 (Noah 12.10.2026 «v1-v4 freigabe», 02:30 «v5-v10 freigabe», 02:36 «v11-v14 freigegeben») und «10 Pakete» (P7 = R18+R19). Nur das Aussehen ist neu.

- **Selbst entschieden (P7):** Ein gewähltes Velo in der Pflege öffnet sich als eigene Seite (Weg «Pflege» zurück zur Übersicht), auch aus Setup; dort nur die Touren mit diesem Velo. Die Übersicht zeigt die Velos als Zeilen statt der Liste «Jedes Velo». Die Pflege eines Velos bleibt das bisherige Akkordeon mit neuem Kopf (keine eigenen Karten «Verschleiss», «Lückenlose km», «Werkstatt»). «Arbeit eintragen» ist eine Zeile unter «Mehr». Im Fenster «Teil» bleiben die drei Knöpfe, «Gemacht von» als Chips. Nicht gebaut, weil neu oder ohne Daten: Teil-Punkte in der Zeichnung, Kosten «pro 1000 km», «Teile mit Garantie», Seitenkarte «Auf einen Blick» und Schalter bei Ausstattung.

## 12.10.2026: Design-Refresh P4 «Touren» (0.104.0)

Nach den Mockups T1–T5 und T24 (Noah 12.10.2026, alle Seiten «Runde 20 freigegeben»), den Bausteinen 2 «Karte mit Strecke» und 26 «Etappen-Teiler» (11.10.2026 «Bausteine 1–35 freigegeben») und «10 Pakete» (P4 = R7+R8+R9).

- **Selbst entschieden (P4):** Eigene kleine Karte (OpenStreetMap-Kacheln unter einer Linie) statt einer Karten-Bibliothek; Kacheln nur online, offline nur die Linie. Etappen als neues freiwilliges Feld `trip.stages` (kein neues Schema, mit Rückgängig); Unterwegs nimmt dieselben Tage. Wetter an den Zeltplätzen nur online und nur bis 16 Tage voraus (Open-Meteo, nur Kartenpunkte, keine Namen). «Bis zum Start» zeigt Tage (Touren haben keine Startzeit). Learnings auf «Planen» nur zum Lesen. Touren ohne die vier Schritte und ohne Vorlagen-Kasten, «Neue Tour» als gestrichelte Kachel. Nicht gebaut, weil neu: «Ziel unter 12 kg», «Mit wem», «Andere Tourarten», «Hinzufügen» in den Wetterkarten.

## 12.10.2026: Design-Refresh P3 «Material» (0.103.0)

Nach den Mockups M1–M6 (Runde 9, Noah 12.10.2026 «M1-M6 freigegeben», alle Seiten nochmals «Runde 20 freigegeben») und «10 Pakete»: nur das Aussehen ist neu, keine neuen Funktionen.

- **Selbst entschieden (P3):** Die Liste ist die erste Ansicht (Noah «5a»), Karten bleiben wählbar und werden gemerkt. Eine Zeile am Computer öffnet das Teil weiter direkt und wird zugleich rechts als gewähltes Teil gezeigt. Die linke Filterspalte und die Handy-Kürzel «Kategorie»/«Tasche» sind in «Sortieren und filtern» (Knopf mit Zeichen, wenn ein Filter aktiv ist). «Wägen» ist im ••• und in der Zeile «n ohne Gewicht · wiegen». «Ansichten» behält die 7 bestehenden Ansichten. Im Fenster «Teil» liegen Umbenennen, Zusammenlegen und Löschen unter «Mehr». Nicht gebaut, weil neu: Filter «Im Baustein», «Wohin?»-Reiter beim Zuordnen, Gründe bei Vorschlägen, Tabelle «Alle Teile» und «Auch wiegen» beim Wiegen.

## 12.10.2026: Vorschlag und Challenge (0.102.0)

Nach den Mockups D1b und D5 (Thread «Mein Überblick», freigegeben 12.10.2026 03:59 UTC «d1-d5 freigeben») und Noahs Regel für alle Bereiche (12.10.2026, Prio hoch): Vorschläge immer zeigen, wählbar, als Challenge setzbar, nie Pflicht.

- **Selbst entschieden (Challenge):** Eine wiederverwendbare Vorschlags-Kachel (`ui/SuggestTile.svelte`) und ein Blatt «Als Challenge setzen» (`ui/ChallengeSheet.svelte`), zuerst auf Heute als «Heute baden oder Sauna?» mit Baden, Sauna, Spaziergang am See und eigenen Vorschlägen. Gezählt wird, was auf der Kachel abgehakt ist (zweites Tippen nimmt es zurück); Wasser- und Lufttemperatur aus D1 kommen mit der Daten-Zentrale. Standard: 10× bis Monatsende, beides änderbar, jederzeit beendbar. Geschafft wird sie am Tag des Abhakens zum Meilenstein (zwei Tage unter «Heute wichtig» und auf der Kachel). Gespeichert in den Einstellungen `suggest.today` und `challenges` (gehen ins Backup, keine neue Tabelle). Die Kachel kommt einmal hinter «Im Flow» in gespeicherte Startseiten. Aktiv bekommt dieselbe Kachel mit seinem Paket (P8).

## 12.10.2026: Design-Refresh P2 «Heute» (0.101.0)

Nach den Mockups H1–H9 (freigegeben 12.10.2026 00:10 «h1-h6 freigeben» und 00:22 «h7-h9 freigegeben») und Noahs Wahl «10 Pakete» (P2 = Heute, früher R5+R6). «Foto weg von Heute» (Noah 11.10.2026 «bild wieder vom homescreen weg») kommt mit.

- **Selbst entschieden (P2):** Die neuen Bausteine kommen als Kacheln dazu (H1): Diese Woche, Velo im Monat, Nächster Meilenstein, Vor einem Jahr. Eine gespeicherte Startseite bekommt sie einmal hinter «Im Flow»; wer eine wegnimmt, bekommt sie nicht wieder (Startseite neu als Version 2 gespeichert). Die Tour-Karte zeigt Stunden (und Tage, wenn mehr als 0) bis zum Start und die offenen Schritte als Zahlenfelder, darunter den Packbalken mit den nächsten drei Teilen; die Schritt-Linie bleibt, weil sie zeigt, wofür der Hauptknopf steht. Höhenprofil, Strecke und Höhenmeter nur, wenn die Tour eine Route hat. «Startseite anpassen» steht am Computer oben rechts, am Handy bleibt es unten. «Offen» zählt die offenen Schritte der Tour. Die Suche öffnet ihre Treffer über den Kacheln (Seitenleiste liegt jetzt darüber). Die Kachel «Inspiration» kommt später (braucht Inhalte von aussen); «Als Challenge setzen» (D1b/D5) folgt gleich als 0.102.0.

## 12.10.2026: Design-Refresh P1 «Zurück, Schritte, Weiter-Leiste» (0.100.0)

Nach Stilblatt G7 «Zurück und Schritte» (freigegeben 11.10.2026 23:10 «Runde 1 alles ★ und G1–G12 freigegeben») und Noahs Wahl «10 Pakete» vom 12.10.2026 (die übrigen 21 Releases in 10 Pakete gebündelt, eines pro Bereich; P1 = das frühere R4).

- **Selbst entschieden (P1):** Der Tour-Kopf ist hell (kein farbiges Band mehr) mit «‹ Touren › Name» oben; am Handy steht nur «‹ Touren», weil der Name gleich darunter gross steht. Die Schritte zeigen am Computer nummerierte Kreise (erledigt mit Haken), am Handy nur die dünne Linie mit dem Namen, damit «Unterwegs» bei 320 px nicht bricht. Die Weiter-Leiste liegt am Computer fest unten rechts neben der Seitenleiste mit «Schritt n von m · Hinweis», «Zurück zu Touren» und dem Hauptknopf; zwischen 720 und 899 px verhält sie sich wie am Handy (über der unteren Leiste). Die Zahlen der Schritte kommen aus einem CSS-Zähler, damit der Linktext gleich bleibt (Tests und Vorlesen).

## 12.10.2026: Design-Refresh R3 «Bausatz» (0.99.0)

Nach dem Stilblatt G2 «Bausteine» und G3 «Zustände» (freigegeben 11.10.2026 23:10 «Runde 1 alles ★ und G1–G12 freigegeben») und der Antwort 3b vom 12.10.2026 (Feier-Moment mit Konfetti).

- **Selbst entschieden (R3):** Knöpfe überall 44 px hoch mit weicher Ecke (10 px) und dünnem Rahmen, kleine Knöpfe bleiben am Computer kompakt. Der leise dritte Knopf heisst `btn-link` (unterstrichenes Wort), weil `plain`/`tx` schon in Seiten vergeben sind. Konfetti nur beim grossen Feier-Moment (Zwischenseiten wie «Gepackt», «Tour beendet»), 28 Stücke in den Farben der Farbwelt, etwa 1,5 s, immer gleich (kein Zufall), fängt keine Tipps und macht die Seite nie breiter; mit «Bewegung reduzieren» bleibt nur der Haken. Der Text der Meditations-Meilensteine («kein Konfetti») bleibt, weil dort nichts gefeiert wird. Hinweise mit «Rückgängig» bekommen einen Haken vorne und «Rückgängig» als helles Wort mit Pfeil (gemeinsamer Hinweis, Umbenennen, Tour beendet); die übrigen Seiten-Hinweise folgen mit ihren Seiten. Zeilen 56 px und Filter-Chips kommen mit den Seiten, die sie brauchen (R5 ff.).

## 12.10.2026: Design-Refresh R2 «Heller Kopf» (0.98.0)

Nach Mockup G4/G5 A★ (freigegeben 11.10.2026 23:10 mit dem Stilblatt). Heller Kopf und helle Seitenleiste, «Neu» oben neben der Suche statt rundem Knopf über der Seite.

- **Selbst entschieden (R2):** Die Seitenleiste zeigt nur die Unterseiten des gewählten Orts (wie im Mockup); die anderen Orte öffnen ihre Unterseiten beim Antippen. «Ich» in der Seitenleiste ist eine Karte unten mit einem ruhigen Gesichts-Symbol statt eines Buchstabens (die App kennt keinen Namen) und behält den Punkt für den Eingang, ohne Zahl (Regel v0.47.1). Die Symbole der Orte sind schlicht, ohne farbiges Kästchen; der Seitengrund bleibt pro Ort leicht getönt, auch hinter dem Kopf. Der Timer (Mockups Z1–Z5) ist auf Noahs Wunsch vom 12.10.2026 geparkt.

## 12.10.2026: Design-Refresh bauen, R1 «Darstellung» (0.97.0)

Alle Seiten freigegeben (Stilblatt G1–G12 am 11.10.2026 23:10 «Runde 1 alles ★ und G1–G12 freigegeben», alle Seiten am 12.10.2026 03:50 «Runde 20 freigegeben»). Noah 12.10.2026 03:56: «allem anderen vorziehen … rasche Umsetzung mit Prio high». Bauplan mit 24 Releases (Projektordner `design/refresh-2026-10/bauplan.md`), Antworten «1a 2a 3b 4a 5a»:

- **(1a)** Der Dunkelmodus bleibt wählbar; jede neue Farbwelt bekommt eine dunkle Version.
- **(2a)** Gletscher, Sandstein und Klassisch bleiben unter Ich › Darstellung wählbar; Salbei ist der neue Standard.
- **(3b)** Der Feier-Moment kommt mit Konfetti (ersetzt die alte Regel «kein Konfetti»; gebaut mit dem Release der Zustände).
- **(4a)** «Alle Fahrten aus Strava» bleibt ein Datei-Import; eine echte Strava-Verbindung kommt später als eigenes Paket.
- **(5a)** Alle anderen Bauten pausieren, bis Welle 1 (R1–R4) und Heute live sind.
- **Selbst entschieden (R1):** Die dunklen Versionen von Salbei, Fels, Sand und Gletscher sanft sind aus den hellen abgeleitet und auf Kontrast geprüft. Wer den alten Standard Gletscher gespeichert hat, bekommt einmal Salbei (Gletscher bleibt wählbar und bleibt dann). Die schmale Titelschrift fällt weg, Titel nehmen die gewählte Schrift. Grössen: Klein 15 px, Normal 16 px, Gross 18 px Grundschrift, die anderen Stufen ziehen mit. Die Vorschau zeigt sich erst ab 1100 px Breite, am Handy ändert sich die ganze App sofort. Die Farbwelten zeigen nur ihren Namen und vier Punkte wie im Mockup.

## 12.10.2026: E3 «Strava-Verbindung» bauen (0.116.0)

Mockups S1–S5 (`design/e3-strava/`, Offene Mockups #e3-strava) freigegeben von Noah am 12.10.2026 13:39 «s1-s5 freigegeben»; die Fassung v2 aus der gebauten App (Offene Mockups 2 #strava-v2, mit Bild 4 nach «4b») am 12.10.2026 21:05 «S1–S5 v2 freigegeben». Antworten 11:30 UTC «1 a und b möglich 2 a und b möglich 3b 4b wobei der hinweis im frontend ersichtlich sein muss für den nutzer, sonst a 5a»; Server-Fragen 18:27 «1a 2a 3a 4a 5b». Ersetzt den Entscheid (4a) vom 12.10.2026 «Alle Fahrten aus Strava bleibt ein Datei-Import»: die echte Verbindung ist jetzt da, der Datei-Import bleibt als Reserve.

- **(1 a und b)** Fahrten holen: beides wählbar. Standard «Automatisch beim Öffnen» (höchstens alle 15 Minuten, wenn die App aufgeht oder wieder sichtbar wird); «Nur per Knopf». «Jetzt holen» geht immer.
- **(2 a und b)** Fahrt ohne Velo in Strava: Standard «Zum Prüfen mit Vorschlag» (ein Tipp «Passt», «Anderes Velo», «Zählt nicht»); oder «App ordnet selbst nach Fahrtart zu» (Fahrt-Typ-Regel, sonst das Velo mit den meisten Fahrten dieses Typs; ohne Vorschlag trotzdem zum Prüfen).
- **(3b)** Das erste Verbinden holt alle alten Fahrten. Schon im Fahrten-Buch (gleiche Strava-ID oder dieselbe Fahrt aus dem CSV) zählt nicht doppelt; vor dem Start-Wert eines Velos bleibt aussen vor («schon im km-Stand», Logik von 0.91.0).
- **(4b)** Velo in Strava geändert: die App fragt mit gut sichtbarem Hinweis oben auf Heute und auf der Pflege-Seite des Velos, «Übernehmen» oder «Behalten»; der Hinweis bleibt, bis gewählt ist.
- **(5a)** Der Datei-Import bleibt unter «Mehr › Datei importieren (Reserve)».
- **Server (1a 2a 3a 4a 5b):** Trennen lässt Google verbunden; ein zweites Gerät (Handy) verbindet sich mit einem neuen Strava-Login; jedes Holen prüft die letzten 30 Tage nochmals auf ein geändertes Velo (Strava meldet das nicht von selbst); private Fahrten werden auch geholt (read_all); Google in Produktion.
- **Selbst entschieden:** Der Geräte-Schlüssel liegt nur in localStorage (`pg.strava.key`), nie in IndexedDB und nie im Backup; Einstellungen, Fragen und das letzte Holen liegen in `db.settings` (`strava`, `strava.changes`, `strava.last`) und reisen im Backup mit. Fahrten zum Prüfen sind offene Einträge (Quelle Strava), stehen aber nur in «Zum Prüfen», nicht im Fahrten-Buch und nicht in der Wochenkarte (Noah «4b»). Eine eigene Zuordnung «Velo in Strava ↔ Velo in der App» ist eine Strava-Velo-Regel des Imports (gilt auch für Dateien); «Zählt nicht» merkt sich die Strava-Velo-ID. Eine Fahrt, die auf «Zum Prüfen» wartet und in Strava ein Velo bekommt, zählt ohne Frage für dieses Velo. «Behalten» merkt sich den neuen Strava-Namen, damit dieselbe Frage nicht wiederkommt. Die Kachel «Strava» kommt einmal oben auf Heute, wenn ein Gerät sich verbindet (wegnehmbar, Noah «3a»). Statt «Standard für «Gravel Ride»» (Strava liefert das nicht) zeigt die Zuordnung «Hauptvelo in Strava» und die km in Strava (Noah «1 ok»). Trennen fragt: «Fahrten behalten» (★) oder «geholte Fahrten entfernen» (Noah «2 ok»). «Alle Vorschläge übernehmen» bleibt (Noah «5a»). Antworten zu den Abweichungen: 12.10.2026 18:32 «Strava: 1 ok 2ok» und 18:38 «3a 4b 5a». Bike-Gesamt-km aus Strava setzen den Wochenabgleich nicht (Strava rundet pro Velo auf ganze km).
- **Puls pro Fahrt (P1–P6, Offene Mockups 2 #puls-pro-fahrt):** freigegeben «P1–P6 freigegeben 1a, veröffentlichen» (12.10.2026 22:07 UTC). Antworten «1b 2a und b» (in #137, an allen Orten) und «1a 2a 3a 4a 5a» (sechs Orte: Fahrtenbuch des Velos, Rückblick letzte Tour, Touren-Tabelle, Aktiv diese Woche, Fahrt-Seite, «Diese Woche» auf Heute). Später, eigene Pakete: Puls auf gleicher Strecke vergleichen, Skitouren mit Puls im Tourenbuch (Skitour), Puls neben dem Ruhepuls im Tages-Check (Google-Teil).
- **Q1 = a:** Strava-Fahrten zählen bald auch in «Diese Woche» und «Velo in diesem Monat»; das kommt als kleines eigenes Release nach 0.116.0.
- **Selbst entschieden:** Eine hochgeladene GPX-Fahrt bekommt den Puls der Strava-Fahrt nur, wenn genau eine passt (gleicher Tag, km höchstens 10 % oder 2 km daneben, Start höchstens 45 Minuten daneben). Der Wochen- und Tour-Puls ist ein km-gewichteter Schnitt der Fahrten, max der höchste Wert.

## 13.10.2026: Strava-Fahrten zählen mit (0.121.0)

- **Q1 = a (12.10.2026), Mockups SZ1–SZ2 freigegeben (Noah 13.10.2026 14:57 UTC «sz1-sz2 freigeben»):** Bestätigte Strava-Fahrten zählen in Heute «Diese Woche», Heute «Velo im {Monat}» und Aktiv «Velo in diesem Monat».
- **Selbst entschieden:** Eine Fahrt, die als Datei und als Strava-Eintrag da ist, zählt einmal als Datei (gleiche Regel wie beim Puls: gleicher Tag, km höchstens 10 % oder 2 km daneben, Start höchstens 45 Minuten daneben). Offene Fahrten in «Zum Prüfen» zählen erst nach «Passt». Der Aktiv-Untertitel heisst jetzt «aus deinen Fahrten und Strava».
- **Bewusst nicht:** keine sichtbare Unterscheidung «geplant / abgeschlossen / bewertet» in diesem Release; das kommt nach Spezifikation und Mockups aus dem Design-Refresh (Noah 13.10.2026).


## 14.10.2026: Velo-Setup neu (0.132.0)

- **UC3 «1-5a» (Noah 14.10.2026 00:34 UTC):** Mein Setup oben, eine Seite pro Velo, Rennrig-Links als grosse Galerie, «Dein Velo im Vergleich» bleibt, «Deine Rennen» bleibt auf dieser Seite. Ausbau «1 ja 2 ja 3ja» (00:35 UTC): Taschen-Plan, Setup-Logbuch, Gesamtgewicht. Mockup-Freigabe: UC3-1–UC3-3 «UC3-1-UC3-3 freigeben» Noah 14.10.2026 00:42 UTC.
- **Selbst entschieden:** Reiter heisst «Setup» (5. Reiter unter Velos). Daten ohne neue Datenbank-Version: Links in `settings.rigLinks`, Logbuch und Vergleich am Velo (`setupLog`, `rigCompare`, `logSkipped`). «In Packen öffnen» statt «Für Packen übernehmen», weil «Verschieben» sofort speichert. «Verpflegung und Wasser» statt «Essen und Wasser». Kein «Standard»-Schild an den Velo-Chips, bis VS1–VS4 freigegeben sind. Zeitraum für Werkstatt-Angebote 180 Tage; «Zurück?» nach 3 schlechten Touren.

## 14.10.2026: Bezahlfunktion vorbereiten (unsichtbar, Testmodus)

- **Noah 01:12–01:16 UTC:** «1a und b 2 a (einmal oder als abo) 3 a und b möglich 4 beides vorbereiten 5 kosten 0, mit testmodus starten», «für den nutzer bleibt es im Front End vorerst unsichtbar», «6 a und b», «7 beides vorbereiten». Details: [Bezahlen](bezahlen.md).
- **Selbst entschieden:** Stripe (keine Grundgebühr, gratis Testmodus, Connect für andere Verkäufer); Lizenz als signierte Notiz statt Konto-Pflicht; Live-Schlüssel werden vom Server abgelehnt, bis Noah live gehen will; Preise und Artikel sind Platzhalter.
- **Bewusst nicht:** nichts Sichtbares (Mockups zuerst), kein echtes Geld.
- **Erklär-Seite (Noah 01:25 «doku … unter ich einsehbar», Mockups BZ1 + BZ2b, 01:31 «1a 2b», «bz freigeben»):** Zeile «Bezahlen» unter Ich › Die App, Seite `#/me/pay` mit Ideen als Karten zuoberst. Pro = Strava, Fitbit, Garmin (01:27 «1a»); Vorlagen-Verkauf vorbereitet (01:27 «2a»).

## Kleine Apps und Benutzerhandbuch (14.10.2026)

- **Noah 14.10.2026 01:36 UTC «eigene kleinere Apps, zum Beispiel Meditation, Packliste oder Velo-Pflege», 01:46 UTC «verstehe. bitte freigegeben. bitte umsetzen»** (auf die Beschreibung: zweites Symbol, öffnet direkt den Bereich, unten nur dessen Tabs, gleiche Daten, grosse App bleibt): drei kleine Apps Meditation, Packliste, Velopflege unter `apps/<key>/`, je mit eigenem Manifest und Symbol, gleiche Datenbank. Details [kleine-apps.md](kleine-apps.md).
- **Gleiche Nachricht:** ein kurzes Benutzerhandbuch für jede Funktion (aufschalten, nutzen, Beispiel), im Repo und später in der App. Eine Quelle `src/lib/handbook.js` (ein Eintrag pro Funktion aus `features.js`, ein Test hält sie vollständig), daraus `docs/handbuch.md` (`node tools/handbuch.mjs`). Die Anzeige in der App («Was die App kann») kommt erst nach Mockup und Noahs Freigabe.
- **Selbst entschieden:** Bezahlfunktion bleibt getrennt (Thread «Bezahlfunktion», `docs/bezahlen.md`); kleine Apps kosten nichts. Weitere kleine Apps nur mit eigener Freigabe.

## 14.10.2026: Tagespaket 0.132.0 (ein Release mit 0.125.0 in PR #151)

- **Ein Release:** Velo-Setup (#155), Kluge Suche (#154), App-Wartung BF4/BF7/BF8, Bedienung FE2–FE18, Bezahlen vorbereiten (#156), Kleine Apps + Handbuch (#157) und die Doku «Links nach aussen» (DG-X1–X16, nur Spezifikation) kommen als 0.132.0 auf PR #151 (zuerst 0.126.0; nach dem Merge von 0.131.0 «Daten einmal bereinigen» neu nummeriert) (0.125.0 ging nie live und steckt im Eintrag 0.132.0).
- **Selbst entschieden (Bedienung):** FE11/FE18 «App öffnen bei» hat **Heute** als Standard (★); «Wo ich zuletzt war» öffnet nie ein Fenster wieder, ein Link auf eine Seite gewinnt immer. FE2 «Hoher Kontrast (draussen)» ist aus als Standard und ein eigener Block am Ende von `app.css` (eigener Commit, kann einzeln zurückgehalten werden). Alle Hilfen sind Schalter in Ich › Darstellung › Bedienung, nur auf diesem Gerät.
- **Selbst entschieden (App-Wartung):** Kopie vor jedem Update in einer eigenen IndexedDB (`pack-generator-snapshots`), nie im Export oder Backup, die letzten 3 bleiben; Zurückgehen behält zuerst den Stand jetzt. Monats-Check alle 30 Tage (Strava, Schlüssel mit Enddatum, Links über `api/linkcheck.js` mit fester Liste); offline heisst es «nicht geprüft», nie Fehler. Auf Heute höchstens eine ruhige Zeile ab 80 % Strava-Grenze oder bei einem Befund; sie wartet hinter «Strava verbinden», der Lang-drücken-Tipp wartet hinter ihr und in der Nachtruhe.
- **Selbst entschieden (Suche):** Die Aktionen der Suche (FE17) bleiben zuoberst und Enter macht die erste; der Hinweis der Kluge Suche und «Claude fragen» stehen darunter, vor den Treffern. Die Treffer kommen aus `smartSearch` (ähnliche Wörter, Tippfehler, Filter), `searchAll` bleibt unverändert darunter.
- **Selbst entschieden (Zusammenführen):** Der Setup-Reiter zeigt «Noch keine Velos» mit dem Leer-Baustein wie die übrigen Velo-Reiter (A-U2). Das Benutzerhandbuch hat Einträge für Setup, Taschen-Plan, Setup-Logbuch, Tour-Zustände und Jahresziele. Keine neue Datenbank-Version.
- **Selbst entschieden (0.125.0 im Release 0.132.0, 14.10.2026):** 0.125.0 ging nie live; sein Inhalt kommt mit 0.132.0. «Was ist neu» hat einen Eintrag 0.132.0 «Viel Neues auf einmal» (3 Punkte: Tagescheck, Aktiv-Woche, Velo-Setup; Kluge Suche, kleine Apps, Tour-Zustand, Jahresziele, Werkstattbesuch, Backup und Bedienung als kleine Dinge, weil der Test höchstens 3 Punkte und 3 kleine Dinge erlaubt). Tour-Zustand, Jahresziele und die drei Kacheln Balance, Morgen-Check und 15 Fragen haben «seit 0.132.0», damit sie für alle auf 0.131.0 als neu erscheinen.

## 14.10.2026: Daten einmal bereinigen (0.131.0)

- **Persönliches raus aus dem Code (Noah 1a):** Echte Velos, km, Gewichte, Taschen und Gegenstände von Noah stehen nicht mehr im öffentlichen Code. Die einmaligen Umzüge dafür waren auf seinen Daten schon gelaufen und sind entfernt; eine Sicherung liegt privat. Der Import aus Noahs Excel bleibt als Werkzeug für genau diese Datei.
- **Nur unsichtbar aufräumen (2a):** Das neutrale Standard-Paket baut der Thread «Persönlich und Standard-Profil».
- **Alte Felder umziehen und löschen, mit Sicherung (3a):** `cleanup.js` macht vor der ersten Änderung eine Kopie aller Daten in `meta`; Kits und Gewichts-Prüfungen sind danach leer (die Tabellen bleiben im Schema, damit alte Backups aufgehen), `role` kennt nur noch «worn», `always` gibt es nicht mehr.
- **Bereiche jetzt vereinheitlichen (4a):** Alles pro Bereich steht in `domains.js` (`DOMAINS`); «Sportarten neu» ergänzt dort später Einträge.
- **Aufräumen zuerst (5a):** Die anderen Threads haben pausiert, bis dieser PR steht.
- **Selbst entschieden:** Die Gewichts-Prüfungen aus der Excel werden eine Notiz (keine Seite zeigte sie); die Velo-Reihenfolge ist das Feld `bike.order` (gleiche Reihenfolge wie vorher); die Tabellen `kits` und `weightChecks` bleiben leer im Schema statt gelöscht zu werden (keine neue Datenbank-Version, kein Konflikt mit Version 9 aus «Wi gaht's?» und Strava Training).

## 14.10.2026: Rechnungen ohne Gebühren (0.139.0)

- **Gratis-Weg statt Stripe** (Noah 14.10.2026 02:36 «1 a und b 2 a und b», 03:39 «1a 2a und b 3a oder b möglich», 03:43 «1a mit auswahlmöglichkeit für andere», 03:52 «alle A-D als mockup», 04:00 «a»): QR-Rechnung aus dem eigenen Konto und hochladbar aus dem E-Banking; bezahlt von Hand und über den Kontoauszug; Rechnungen unter Ich › Bezahlen › Rechnungen; zwei Knöpfe «Bezahlt» und «Bezahlt + Mail»; ohne Referenz schlägt die App vor und bietet «Selbst wählen»; TWINT standardmässig an, pro Rechnung abwählbar; Wege A–D (Kunde meldet, TWINT-Screenshot, Geld erhalten, Sonntags-Erinnerung).
- **«Zu zahlen»** (Noah 05:02 «a», 05:10 «1-4a» und «a»): Tab neben Rechnungen, Erinnerung 3 Tage vorher (änderbar), Foto bleibt als Beleg, ohne Fälligkeit 30 Tage.
- **Selbst entschieden:** PDF-Upload wird nicht gelesen (nur Bilder mit QR-Code); Mail am Computer öffnet ohne Anhang (PDF separat teilen); Bestätigungsmail ohne Freischalt-Code; Rechnungen und Erinnerung in der `settings`-Tabelle (keine Schema-Änderung, kommen mit dem Backup mit); Konto und TWINT-Nummer nur in `localStorage`; der Zahl-Link trägt die Rechnungsdaten im Teil nach `#`, der Server speichert nur Rechnungsnummer und Zahlweg (`api/_lib/report.js`, Redis, 60 Tage); der Text-Leser für TWINT-Screenshots (Tesseract.js) lädt erst beim ersten Gebrauch vom CDN (etwa 5 MB), das Bild bleibt auf dem Gerät; die Karten auf Heute (Sonntag, fällige Rechnung) und der Teilen-Weg für Bilder kommen in einem eigenen kleinen Release, sobald Design-Refresh und «Inspiration» auf main sind.
## 14.10.2026: Persönlich und Standard, Standard-Paket und «Listen und Typen» (0.134.0)

- **Änderungen im Standard kommen als Vorschlag (Noah 1a):** Ändert sich der Standard, sieht die Person «Neu im Standard: übernehmen?»; nie automatisch. Grundlage: `standardChanges` in `src/lib/standard.js`.
- **Standard enthält beides (2):** die Grundlisten und erfundenes Beispiel-Material, Beispiel-Touren und Vorlagen.
- **Reihenfolge (3a):** zuerst Listen in der App änderbar («Listen und Typen», Mockups LI1–LI3), dann der Profil-Wechsel.
- **Umschalten (4a):** ein Schalter unter Ich › Die App.
- **Neuer Nutzer (5, «passt»):** Die Grundlisten sind immer da; beim ersten Start fragt die App einmal «Mit Beispielen starten» oder «Leer starten»; Beispiele lassen sich später entfernen.
- **Selbst entschieden:** Das Verzeichnis kopiert keine Liste, es liest jede von ihrem Ort (`docs/daten.md` Regel 2). Eigene Änderungen liegen getrennt als Einstellung `listOverrides` (reist im Backup mit); ausgeblendete Einträge bleiben in der Liste markiert, damit nichts, was sie nutzt, bricht. Die Start-Aktivitäten «Im Flow» und die Ideen bleiben vorerst, wie sie sind; neutrale Beispiele kommen mit «Mit Beispielen starten» (eigene Mockups).
- **«Listen und Typen» (Mockups LI1–LI4, Noah «LI1–LI4 freigegeben»):** Standard-Einträge dürfen auch gelöscht werden (1b); Reihenfolge mit Pfeilen hoch und runter (2b); zusätzlich «Liste bearbeiten» dort, wo die Liste vorkommt (3b). **Kategorien zuerst (Noah «a»):** jede weitere Liste kommt später als eigenes kleines Release.
- **Selbst entschieden («Listen und Typen»):** Auf dem Handy ist das Auge nicht in der Zeile (Platz für den Namen bei 320 px); Ausblenden geht dort im Fenster des Eintrags. «Gilt für» (Sportarten-Chips in LI3) ist noch nicht gebaut: Kategorien haben heute keinen Bezug zu Sportarten; Frage an Noah. Die Übersicht zeigt nur Listen, die schon änderbar sind (Kategorien, Checks pro Reiseart). «Liste bearbeiten» steht in Material › Sortieren und filtern, wo die Kategorien gewählt werden.

## 14.10.2026: Kamera-Knopf bei Belegen (0.131.3)

- **Bei Belegen immer die Kamera** (Noah 14.10.2026 «bei belegen immer», Mockups K1–K4 «freigegeben»): Überall, wo ein Beleg dazukommt, steht auf dem Handy «Beleg fotografieren» (öffnet die Kamera direkt) und «Galerie». Am Computer (keine grobe Zeigereingabe) bleibt ein Knopf «Foto wählen», weil der Browser dort ohnehin den Dateidialog zeigt.
- **Gebaut wie im Mockup:** Die vier Zusatzfragen (Knopf-Look, auch andere Fotostellen, Kamera von selbst, «Weitere Seite») hat Noah offen gelassen; gebaut ist genau, was K1–K4 zeigen. Die Fragen bleiben für später offen.
- **Selbst entschieden:** Eine Notiz ohne Foto bekommt beim Ablegen als Rechnungsbeleg die Zeile «Foto der Quittung», damit der Beleg nie ohne Foto bleibt. Die Liste «Zu zahlen» (Bezahlfunktion) übernimmt die Komponente `PhotoPick` selbst.

## 14.10.2026: Velo-Reihenfolge (0.131.2)

- **Reihenfolge der Velos (Noah 13.10.2026 «1a», Thread «Velo-Standard»):** zuerst das neue MTB, dann das Gravelbike, das Hardtail, das Fully. 0.131.0 hatte `bike.order` noch in der alten Reihenfolge aus dem Code geschrieben (Hardtail zuerst).
- **Selbst entschieden:** `cleanup.js` setzt die neue Reihenfolge einmal bei jedem Velo, das noch genau den Wert aus 0.131.0 trägt; ein anderer Wert bleibt. Ein zweiter Lauf ändert nichts. Standard-Velo, Reihenfolge ändern und die Fragen dazu kommen erst nach der Freigabe von VS1–VS4.

## 14.10.2026: Eine Zahl pro Sache (0.137.0, Durchklick DK1–DK3)

- **Fällig (Noah 14.10.2026 «1-5 freigeben», Antwort 1a):** fällig ist ein Service, der fällig ist, oder ein Problem, das vor der nächsten Fahrt behoben sein muss (Status «braucht Arbeit», «Vor der nächsten Fahrt» oder Datum heute oder früher). Velopflege, Velos, Heute und die Zahl im Menü zählen dieselben Punkte.
- **Selbst entschieden:** Die Zahl im Menü zählt jetzt Punkte statt Velos (wie im Mockup DK1). Probleme ohne «vor der nächsten Fahrt» und ohne Datum bleiben unter Probleme, zählen aber nicht als fällig. Der Text auf Heute «{n} Punkte fällig» wird «{n} fällig», sobald 0.133.0 auf main ist (Home.svelte wartet bis dann).
- **Tour-Gewicht (Noah 14.10.2026, Antwort 2a):** eine Tour hat ein Gewicht: alles gepackt und getragen, mit Essen und Wasser und getragenen Taschen (`packG`). Kopf, Gewichtskarte und Heute zeigen es; nicht getragene Taschen, Velo und Fahrer bleiben im Systemgewicht.
- **Selbst entschieden (DK2):** Material zählt Essen im Kopf mit, damit Kopf, Kachel und «Ungewogen» gleich sind. Die Zeile «… ohne Gewicht · wiegen» zählt nur Teile wie die Ansicht; Velos und Taschen ohne Gewicht bleiben in der Wiege-Reihe und im Menü-Zähler «Gewichte erfassen». Sind nur sie offen, heisst die Zeile «Velos und Taschen wiegen». Auf der Gewichtskarte heisst die Zeile «Verpflegung und Wasser» (bestehender Text) statt «Essen und Wasser» wie im Mockup.
- **Wartet auf 0.133.0:** Heute zeigt das Tour-Gewicht erst nach dem Merge von 0.133.0 als `packG` (Home.svelte wird bis dann nicht angefasst); bis dahin zeigt Heute noch das Gewicht ohne Getragenes.
## 14.10.2026: Release-Analyse «Was wurde verdrängt?»

Noah 14.10.2026 00:41 UTC: zu jedem Release die neuen Features, was wichtig war, und ob spätere Releases Früheres verdrängt, überschrieben oder unsichtbar gemacht haben. Geprüft wurden alle 137 Versionen (0.1.0 bis 0.124.0) am gebauten main mit erfundenen Daten. Ergebnis: rund 160 von 180 Funktionen sind wie vorher da; 16 Funde (F1–F16), meist «tiefer gerutscht». Häufigste Ursache: Nebenwirkungen unter «Selbst entschieden» im Design-Refresh 0.103–0.109; dazu Ersetzen ohne Frage (0.114 «wie letzte Tour», 0.119 Schnellstart) und neue Kacheln, die Altes nach unten schieben.

Antworten Noah 14.10.2026 04:25 UTC «1a 2a 3a 4a»:
- **(1a)** Alle wichtigen und mittleren Funde bekommen Mockups als ein Paket «Wieder sichtbar» (WS1–WS7). Meditation (F1) und Stoppuhr am Computer (F8) laufen über das schon freigegebene Meditations-Paket.
- **(2a)** Nur noch Schnellstart: die alte «Tagestour jetzt» verschwindet aus dem Neu-Menü, der Suche und den Tipps.
- **(3a)** Jeder Release-PR hat ab jetzt einen Abschnitt **«Was fällt weg oder rutscht tiefer»**: was nicht mehr da ist, was hinter «Mehr», in eine Falte oder weiter nach unten wandert, oder «nichts». Noah sieht es vor dem Merge.
- **(4a)** Das Meditations-Paket (ME1–ME3, Z1–Z5) kommt vor Bündel B.
- **Noah 14.10.2026 18:27 UTC «1b 2b», «hb freigeben» (Mockup HB2):** Handbuch als eigene Seite Ich › Handbuch; «Kleine Apps» als Zeile und Seite unter Ich › Die App. «Was die App alles kann» bleibt wie es ist. Kommt als eigene Version 0.133.1 (PR #166; Noah 14.10.2026 19:39 UTC «2b»: jeder PR einzeln).

## 14.10.2026: Start-Taschen in der leeren App, Wander-Rucksack 15 L

- **Leere App ohne Mini Bag und Cargo Bag (Noah 14.10.2026):** die Start-Taschen aus `bikes.js` entstehen nur, wenn eine Tasche der ersten Excel in den Daten ist.
- **Wander-Rucksack 15 L (Noah 14.10.2026 «b»):** eine neue Wandertour startet mit «Rucksack 15 L» statt 30 L, passend zu den Vorschlägen von 12–15 L. Skitour bleibt bei 30 L; alte Touren behalten ihren gespeicherten Rucksack.

## 14.10.2026: Inspiration sammeln (UC2-1, UC2-2, UC2-4), 0.133.3 (Arbeitsnummer)

- **Freigabe:** Mockups UC2-1 «Inspiration», UC2-2 «Aus der Notiz wird …», UC2-4 «Link erkannt» (13.10.2026), Noah «3b» + «a» (nur eigene Links, keine Liste der App), 4a (Packregel, Wunschliste oder Notiz), 5a (Hinweis beim Packen). Lokal gebaut, noch kein PR (GitHub pausiert); Version, «Was ist neu» und Funktionskatalog sind ergänzt (0.133.3).
- **Seite `#/inspiration`:** am Computer ein Eintrag unter den fünf Orten (mit «neu», bis er einmal offen war), am Handy Ich › Inspiration (Daten, unter Notizen), nicht in der unteren Leiste; Suche findet sie (`menu.js`).
- **Art aus der Adresse (`inspiration.js` detectType):** Video, Hör-Tipp, Route, Rig, Packliste, Rennen, Produkt, Anleitung; erkennt die App nichts, wählst du die Art. Nichts wird geladen, kein fremder Text, kein Foto; Titel nur als Vorschlag aus der Adresse, Zahlen und Stichworte sind deine eigenen.
- **Speicher ohne neue Tabelle und ohne Datenbank-Version:** Rigs und Rennen bleiben in `settings.rigLinks` (gleiche Liste wie Velos › Setup, nie doppelt), alle anderen Arten in `settings.inspoLinks`. Wechselt die Art, zieht der Link um. Beide sind im Backup (Test in `tests/inspiration.test.js`).
- **Aus der Notiz wird …:** Packregel = ein Eintrag in `learnings` mit `inspo` (Quelle, Link) und `packHint`; er erscheint beim Packen als ruhiger Hinweis unter «Aus früheren Touren» (höchstens 2, neueste zuerst, «✕» blendet aus, die Regel bleibt unter «Was die App gelernt hat») und zählt nicht bei «Aus früheren Touren». Wunschliste = Gegenstand mit `ownership: 'wishlist'` (Produkt mit Gewicht und Preis in der Notiz). Notiz = gemerkte Notiz mit Link. Jede Übernahme steht am Link (`taken`) für «Zuletzt übernommen».
- **Selbst entschieden:**
  - Route → «Tourentwurf» legt eine Tour-Idee an wie «Aus Notiz wird …» auf der Notizen-Seite (Titel der Route, Tage aus deinen Zahlen, erstes Velo); ohne Velo ein Hinweis. Rennen → «Kalender» speichert eine Kalenderdatei (.ics, ganztägig über die Renntage); einen Kalender in der App gibt es nicht. «Rigs dieses Rennens: n» führt zu Velos › Setup.
  - Geteilter Link (Android «Teilen» › Pack Generator): ein Link öffnet «Link hinzufügen» auf Inspiration, mit «Lieber in den Eingang» als Ausweg; Text ohne Link geht wie bisher in den Eingang. Der bestehende Share-Target reicht, keine Änderung am Manifest.
  - Vorschau «So sieht es beim Packen aus» zeigt den echten Hinweis über angedeuteten Zeilen statt einer erfundenen Packliste.
  - Hör-Tipp: der Schalter «Im Bereit-Check vor der Fahrt zeigen» aus dem Mockup ist nicht gebaut (braucht den Bereit-Check, eigenes Paket); ein Hör-Tipp hat «Das übernehme ich» mit → Packregel und → Notiz. Typ «Anleitung» hat einen eigenen Filter-Chip «Anleitungen».
  - Velos › Setup behält beim Ändern eines Rig-Links, was Inspiration ergänzt hat (Notiz, Zahlen, Übernahmen).
  - Funktionskatalog: `f.inspiration` in der Gruppe «Vor der Tour», seit 0.133.3, drei Schritte (`howto.js`) und Handbuch-Eintrag; `docs/handbuch.md` neu erzeugt (bringt auch die fehlenden Einträge «Tour aus komoot» und «Wi gaht's?» mit).
  - Kachel «Neu» auf Heute: in einer schmalen Kachel (halbe Breite am Handy) rutscht der Text unter das Symbol statt daneben, damit ein langes Wort im Titel («Inspiration») nicht mitten im Wort bricht (Wächter, Heute @390).
  - Release auf 0.133.0 «Design-Refresh» (PR #168) aufgebaut, per Merge-Commit; Version 0.133.3 ist eine Arbeitsnummer und wird vor dem Link an Noah auf «höher als main» gesetzt.

## 15.10.2026: Paket 1 «Doku und Ich» als ein Release 0.134.0

- **Ein Release statt sechs (Thread «Mein Überblick» bündelt):** #165 Doku «Zwischenstand», #160 Doku «Release-Analyse / Was fällt weg», #166 Ich › Handbuch + Ich › Kleine Apps, #161 leere App ohne Start-Taschen + Wandern 15 L, «Inspiration sammeln» und #159 «Listen und Typen» (mit Standard-Paket) kommen zusammen als 0.134.0, je per echtem Merge-Commit. Die Arbeitsnummern 0.133.1, 0.133.2 und 0.133.3 fallen weg; «Was ist neu» hat einen einzigen Eintrag 0.134.0 «Deine App, deine Ordnung» (Datum 15.10.2026).
- **Selbst entschieden:**
  - Reihenfolge unter Ich › Die App: Was die App alles kann, Handbuch, Kleine Apps, Listen und Typen, Was ist neu (die zwei HB2-Zeilen wie im Mockup direkt nach «Was die App alles kann», «Listen und Typen» danach).
  - «Was ist neu» 0.134.0: drei Hauptpunkte (Inspiration, Kategorien selber ändern, Handbuch + Kleine Apps), drei kleine Dinge (Neu: «Liste bearbeiten» im Material; Schöner: Wandern mit 15 L; Repariert: leere App ohne Taschen). Die deutschen Texte der Teile sind wiederverwendet, wo sie passen; die alten Schlüssel bleiben in `de/whatsnew.js`.
  - `f.inspiration` und `f.lists` sind «seit 0.134.0»; `f.abfragen` bleibt bei 0.133.0 (Test fest auf 0.133.0 statt auf die neueste Version). Die Liste «neueste zuerst» beginnt mit Inspiration und Listen und Typen.
  - `docs/handbuch.md`: Eintrag «Deine eigenen Kategorien» nachgetragen (99 Funktionen).

## 15.10.2026: Paket 2 «Ruhe, Training und Rechnungen» als ein Release 0.135.0

- **Ein Release statt fünf (Thread «Mein Überblick» bündelt, Reihenfolge von Noah):** Meditation und Timer (ME2, ME3, Z2–Z5), #173 Inhalte Flow + Wusstest du, #170 Eine Zahl pro Sache (DK1–DK3, dazu Heute H1/H2 aus dem lokalen Zweig), #167 Training (TR1–TR4) und #169 Rechnungen ohne Gebühren (QR1–QR9). Je ein echter Merge-Commit pro Teil; die Arbeitsnummern 0.136.0–0.139.0 fallen weg. Die Entscheide der Teile stehen in ihren Abschnitten oben.
- **Selbst entschieden:**
  - Aktiv hat fünf Reiter: Heute, Meditation (der zweite, Noah 15.10.2026 «1a»), Training, Ziele, Aktivität. Der Test «höchstens 4 Reiter pro Ort» erlaubt bei Aktiv wie bei Velos 5.
  - Datenbank: Version 9 `abAnswers`, 10 `activities` (Training), 11 `timerLog` (Timer), aufsteigend; `SCHEMA_VERSION` 11. `actdata.js` liest die Tabelle `activities` jetzt (vorher «noch keine Tabelle»).
  - Am Ende von Aktiv › Heute stehen beide: «Das kann die App hier» mit den Kacheln «Weiter» (#173) und darunter die Kachelreihe der Seite (SK, 0.133.0). Zusammenlegen ist eine offene Frage an Noah.
  - «So geht's» bekommt drei Schritte für `f.pagetips`, `f.training`, `f.invoices` und `f.bills` (die PRs kamen vor «So geht's»).
  - «Was ist neu» 0.135.0: drei Hauptpunkte (Meditation + Timer, Training, QR-Rechnung), drei kleine Dinge (Tipp des Tages, Zu zahlen, eine Zahl pro Sache); die Texte der Teile sind wiederverwendet, wo sie passen.
  - Service Worker: `maximumFileSizeToCacheInBytes` von 4 auf 6 MiB, weil das App-Bündel 4,4 MB hat; sonst startet die App offline nicht.

## 15.10.2026: Paket 2b «Sortieren, wie du willst» als Release 0.136.0

- **Inhalt:** Pfeile und Ziehen in allen sortierbaren Listen (Noah «2a und b»), LI3 «Gilt für» (Noah «2b»), Inspiration-Korrekturen (Noah «1-3a»), eine Kachelreihe am Ende von Aktiv › Heute (beantwortet die offene Frage aus 0.135.0: die Kacheln «Weiter» gehen, die SK-Kacheln bleiben) und neun Anzeigefehler aus den Bildern von 0.135.0.
- **Selbst entschieden:**
  - «Velo in diesem Monat» / «Velo im Oktober» (auch «Diese Woche», Jahresziele, Balance): eine Strava-Fahrt ohne Eintrag im Kilometerbuch zählt aus `db.activities` (Training). Das sind Fahrten, die im Start-Kilometerstand eines Velos stecken; das Velo zählt sie nicht doppelt, gefahren sind sie trotzdem. Eine Fahrt mit Eintrag folgt dem Eintrag: offen erst nach «Passt» (Regel 0.121.0 bleibt), entfernt nie; Indoor ohne Velo zählt nicht (wie `toRides`); eine hochgeladene Datei-Fahrt zählt einmal. Wartende Fahrten des Monats stehen als Zeile mit Link zu «Zum Prüfen». Der Untertitel «aus deinen Fahrten und Strava» stimmt damit wieder.
  - Svelte schneidet das Leerzeichen am Anfang eines `{#if}`-Blocks ab («29 % gepackt· Sa.»): an 41 Stellen steht der Trenner jetzt als `{' · '}`.
  - Deutsch heisst die Minute überall «Min» (20 Übersetzungen und 4 feste Texte angepasst).
  - «Diese Woche»: pro Tag eine Zeile pro Sache mit «…» statt Trennung im Wort (Silbentrennung kennt nicht jeder Browser).
- **Noah 15.10.2026 «1 weiter auf andere geeignete seite integrieren 1a 2b»:**
  - 1a: die zweite Reihe «Weiter» auf Aktiv › Heute fällt weg. Was nur dort stand, lebt in den Seiten-Kacheln weiter (unter «Kacheln anpassen» › Dazunehmen): auf Aktiv Erholung, Woche, Trophäen-Vitrine und hepa.ch «Bewegung empfohlen»; auf Rückblick Trophäen-Vitrine und Meilensteine. Eigene Links gehen wie bisher mit «+» › Eigener Link. Ziele, Meilensteine, Fahrten-Buch und Strava standen schon in den Kacheln.
  - 2b: Fahrten auf einem Strava-Velo mit «Ignorieren» zählen nicht in Monat, Woche, Jahresziel und Balance (`notIgnored` in `kmbook.js`).
## 15.10.2026: 0.140.0 «Regeln der App»

- (Regeln freigegeben: «a a, b a, c b, freigabe» 14.10.2026; Mockups C1 C2 A1 «C1 C2 A1 freigegeben» 14.10.2026 20:29 UTC; App-Start 1b aus «1b 2b 3b 4a 5a» 19:59 UTC). Grundlage: `notes/navigation-analyse/regeln-der-app.md` im Projektordner (alle Regeln pro Seite mit Datei:Zeile).
- **A a, nichts springt von selbst:** Nach einer Aktion bleibt die Seite; wo es weitergeht, steht eine Meldung mit Link. Hier: Tagestour ohne Velo nach dem Packen. Die Sprünge auf Heute am Tourtag und am letzten Abend folgen mit 0.140.1 (Karten ST1/ST2).
- **C b, ein Tipp öffnet zum Ändern:** Teil am Handy direkt bearbeitbar; der Velo-Stift öffnet die Velodetails. Das eigene Blatt «Velo umbenennen» mit Rückgängig fällt dafür weg (der Name steht in den Velodetails).
- **App-Start 1b:** Ein Tab mit einer alten Seite startet nach einer Pause (30 Min ohne die App) auf der Startseite; nur Neuladen (F5) und ein Link kurz nach der Benutzung bleiben. Geteilte Listen, geteilte Texte und die Strava-Rückkehr gewinnen immer.
- **B a (ein Wort pro Sache)** baut der Thread «Durchklick».
- **Selbst entschieden:** Pause = 30 Minuten; die Meldung «Alles gepackt» bleibt 8 s; «n weitere fällig» öffnet das Velo der nächsten fälligen Zeile; kleine Apps merken sich nicht als «letzter Ort» der ganzen App.

## 15.10.2026: 0.140.1 «Start-Karten»

- (Mockups ST1–ST2 freigegeben: «1a 2a 3b ST1–ST2 freigegeben» 14.10.2026 21:18 UTC; Platz bei der Tourkarte nach HN4 «1a 2a 3a 4b HN4 freigegeben» 21:51 UTC).
- **1a:** eigene Karte am Tourtag statt des Sprungs zu Unterwegs. **2a:** Karte am letzten Abend mit «Tour abschliessen». **3b:** die Tourtag-Karte bleibt, bis Unterwegs an diesem Tag einmal offen war.
- **Platz:** die Karte gehört zur Tourkarte und wandert mit ihr (HN4); Reihenfolge oben auf Heute: Meditation, Tageskarte, dann Tourkarte mit Start-Karte.
- **Selbst entschieden:** am letzten Abend gewinnt die Abend-Karte; die Karte fehlt für eine heute erstellte Tour (wie bisher der Sprung, Noah 6a).

## 14.10.2026: Regeln einheitlich (0.144.0)

- **Eine Regen-Grenze** (Noah «1a 2a», Mockup-Freigabe: RE1–RE3 «RE1–RE3 freigegeben» Noah 14.10.2026 20:37 UTC, Antworten «1a 2a 3a 4a 5a»; die fünf Regeln «1-5 a» 20:20/20:22 UTC): Die Grenze des Bausteins Regen (Material › Bausteine › Regen, Standard 30 %) gilt für die ganze App: Regen-Baustein, Regenkleidung, Was anziehen, Packwetter aus der Prognose («Schauer» ab 1 mm oder ab der Grenze), Wetter-Satz und Vorschlag des Tages auf Heute, Plan unterwegs und Fahrt-Seite, Wochenvorschläge in Aktiv. Ersetzt die festen 50 % (Heute, Plan unterwegs, Packwetter) und 60 % (Woche). Millimeter-Grenzen bleiben. Über der Grenze kommt die Regenkleidung von selbst auf die Liste (abwählbar), der Baustein Regen bleibt ein Vorschlag.
- **«Nie gebraucht» ab 3 Touren** (Noah «2a» der Regel-Runde): eine Zahl (`NEVER_USED_MIN`) für Material, Jahresrückblick («Ballast», vorher ab 2), Ballast-Karte und Abzeichen in Packen (vorher 2× in Folge) und Rückblick («zuhause lassen»).
- **Rückblick: nichts vorangekreuzt** (Noah «3a»): Die Vorschläge nach dem Rückblick starten ohne Häkchen; der eine Knopf heisst «Fertig · N von M übernehmen» (ohne Häkchen «Fertig · nichts übernehmen»). «Ja, merken» oben bleibt wie bisher.
- **Eine Tagesuhr** (Noah «4a» der Regel-Runde): Morgen 06–11, Tag 11–18, Abend 18–22, Nacht 22–06. Der Gruss wechselt neu um 06:00 (vorher 05:00) auf «Guete Morge»; die festen Runden von «Wi gaht's?» ordnen Fragen vor 11:00 dem Morgen zu (vorher 12:00). Die Abendrunde 20:30 bleibt.
- **Pflege pro Velo** (Noah «4a 5a»): eigene Karte «Pflege für …» über der Teile-Liste; pro Pflege an/aus, Abstand in km und/oder Tagen (was zuerst kommt, gilt), Warn- und Ersetzen-Grenze, Notiz. Die heutigen Zahlen bleiben der Standard. Gespeichert auf den Teilen des Velos (`everyKm`, `everyDays`, `warnAt`, `limit`; fehlt = Standard, null = aus), der km-Check als `bike.checkKm`, Notizen als `bike.careNotes`; alte Daten bleiben gültig, keine Migration.
- **Bleibt bewusst im Code** (Noah 14.10.2026 20:23 UTC «Diesen Code explizit lassen»): R88 `orderFunctions`, R107 `flowcheck` Vorschlag/`checkHref`, R75 `learnedRule`.
- **Selbst entschieden:** Die Erinnerung an die Sporttasche kommt ab 18:00 (Abend der Tagesuhr, vorher 17:00). «Für morgen ab 14:00» bei Tagestour und Was anziehen ist keine Tageszeit und bleibt. Gabel und Dämpfer erscheinen in «Pflege für …» nur an Velos mit Federung (wie die Fälligkeiten). Der km-Check hat nur km. Ein Pflege-Blatt pro Pflege (die Kette hat zwei Zeilen: Wachsen und Messen). Die Zeile in der Packliste ist ein Knopf, darum steht «Regel ändern» im Hinweis bei den Bausteinen, nicht in der Zeile. Die Kopie der letzten Tour nimmt die zuletzt benutzte Tour (gleiche Regel wie die Velo-Vorauswahl, `tripUsedAt`).

## 18.10.2026: Paket B Server (0.147.0)

- **Ein Release aus neun Teilen** (Reihenfolge Noah 18.10.2026 19:37 «1a 2b 3b 4a»: P3 → A → B → D → E → C → F), je ein echter Merge auf Paket A (0.146.0, #184): (1) Fitbit a495282, (2) Training TR5–TR7 68cc377 und «Mehr Inhalt» T1–T5 + Wochenrückblick W1–W6 b5d0da1b, (3) Dokument als PDF (DP) 02eab37, (4) Google Kalender und Aufgaben (GA) 8d66bc8, (5) KI-Deckel CHF 2 + Modellwahl, Assistent und «KI-Guthaben leer» fbffa509, (6) Termine buchen BU1–BU5 c6bf8f5, (7) Shop ohne Gebühren bfcac8d, (8) automatischer Abgleich 72a18b8 + 9d4dda8, (9) Selbstwartung + Web-Push c9d7037d (mit ed7da057).
- **Freigaben der Teile:** Fitbit G1–G2 «g1-g2 freigeben» 13.10.2026, «1-5a»; TR5–TR7 «TR5–TR7 freigegeben» 14.10.2026, Mehr Inhalt «1-5 a» 15.10.2026; DP «1b 2a … 3 beides 4a 5a», «1a 2a» 15.10.2026 (vorerst ohne Mockup); GA «3b» und «vorerst ohne mockup» 15.10.2026; KI-Deckel «1b», «2a», Assistent «1 beides 2a und b 3 a und b» 15.10.2026, KI-Guthaben leer «1a» 18.10.2026; BU1–BU5 «BU1–BU5 freigegeben» 14.10.2026; Shop «1 a und b 2 a und b», «2a und b 3a 4b 5a» 14.10.2026; Abgleich «1b und a möglich 2b 3b», Fenster «1a 2a 3a» 18.10.2026; Selbstwartung «1a 2 immer sofort ohne bilder und ohne mein ok 3a und b 4a 5a» 18.10.2026.
- **Dexie:** A 12 `docs`, Fitbit 13 `healthDays`, GA 15 `gEvents`/`gTasks`. 14 bleibt eine Lücke: DP braucht keine eigene Version, weil A die Tabelle `docs` mit demselben Index schon hat. Der Abgleich hat keine Version (Merker in `meta`). `healthDays` bleibt in `DATA_TABLES` und `KEY_OF` (Backup).
- **Selbst entschieden:**
  - «Gruppen überall»: der Standard-Baustein und das Import-Thema «Open question» (offene Fragen aus dem Import, `debrief.js` liest es) bleiben fest. Ich › Dokumente löscht eine Gruppe mit demselben Fenster wie alle anderen Orte (`GroupDeleteSheet`, erste Wahl «Zurück nach «Importierte PDF» oder «Importierte Fotos»», sonst eine andere eigene Gruppe) und steht in `GROUP_PLACES`; der Wächter `tests/groups.test.js` nimmt `GroupActions` als Weg zum Umbenennen an. Die Drive-Kopien wandern beim Umbenennen, Löschen und Rückgängig in den Ordner ihrer Gruppe mit.
  - Pulszonen eins (tr-zonen): Training-Grenze = erster Schlag der nächsten Zone, Rückblick › Tempo zeigt die Obergrenze (ein Schlag tiefer).
  - Ich › Dokumente ist eine Seite für A und DP: A's Seite (Gruppen, «gültig bis», Erinnerungen, Packliste, ein Dokument unter `#/me/docs/<id>`) bleibt; DP bringt «Dokument fotografieren» (`#/me/docs/scan`) als Hauptknopf, Suche, die vier Sortierungen, «Wo deine Dokumente liegen» mit Google Drive und den Galerie-Hinweis. «PDF hinzufügen» bleibt als zweiter Knopf. Nach «Als PDF speichern» öffnet sich das neue Dokument (wie bei «PDF hinzufügen»), damit Gruppe, «gültig bis» und Packliste gleich folgen. Name und Gruppe ändern gehen über `renameDoc`/`moveDoc`, damit Drive mitkommt; eine ersetzte Datei geht neu nach Drive (die alte Kopie bleibt dort). Der Satz «nie ins Internet» steht nur, solange Drive aus ist.
  - DP ist die Funktion `f.docscan` («Dokumente als PDF»); `f.docs` von A bleibt «seit 0.146.0».
  - **Noah 19.10 «1b»:** Die Fitbit-Tage (`healthDays`) und die Fitbit- und Kalender-Verbindung (Einstellungen `health`, `agenda`) gleicht der automatische Abgleich mit ab. Damit kein tägliches Fenster «Auf beiden Geräten geändert» kommt, entscheidet die App bei diesen Kopien von Google selbst (`sync/engine.js autoPick`): unterscheiden sie sich nur in den Abholmarken (`at`/`src`, `lastSync`/`until`), ist es dasselbe; sonst gilt die später geholte Kopie, ohne Frage. Eigene Änderungen an allem anderen fragen wie bisher. Die Google-Anmeldung selbst liegt auf dem Server nur einmal (`google:tokens` in Redis, nicht pro Gerät); abgeglichen werden also die Einstellungen und der Zustand «verbunden».
  - Termine buchen: Home.svelte behält seine 2 Zeilen; eine neue Buchung ist eine Zeile mehr in der bestehenden Liste «Heute wichtig» (`booking/notice.js`, 9a), das Layout von Heute bleibt.
  - Shop bekommt den Eintrag `f.webshop` in «Was die App alles kann», Handbuch und «So geht's».
  - main.js ist nach dem Bündeln 3,88 MiB (unter 4 MiB und der Precache-Grenze 6 MiB); kein Teilen in Lazy-Chunks nötig. pdf-lib und tesseract.js laden erst beim Fotografieren.
  - Alle SINCE-Platzhalter (0.136.0, 0.144.0, 0.148.0, 0.157.0, 0.166.0, 0.167.0) sind 0.147.0; docs/handbuch.md zählt 120 Funktionen.
- **Gruppen umbenennen und löschen (Teil a-gruppen, in 0.147.0)** (Noah 18.10.2026 «1a»; App-Regel «Jede Gruppe lässt sich umbenennen und löschen»): Ich › Dokumente hat an jedem Gruppenkopf «…» mit «Umbenennen» und «Löschen», gebaut als wiederverwendbares `src/lib/ui/GroupActions.svelte` (Rückgängig 4 s macht die Seite). Selbst entschieden: die zwei Standardgruppen «Importierte PDF/Fotos» haben nur «Umbenennen» (eigener Name in den Einstellungen `docs.names`, der Code-Schlüssel '' bleibt, leer = zurück zum Standardnamen); eine gelöschte Gruppe schickt ihre Dokumente je nach Art zurück in die Standardgruppe, kein Dokument wird gelöscht; keine neue Dexie-Version; «Ausweise» umbenennen beendet die gemeinsame Packlisten-Zeile «ID und Cash dabei?» (sie hängt am Namen `IDs`), dann bekommt jedes Dokument seine eigene Zeile; die Gruppen-Idee «Travel» zeigt jetzt «Reisen» (vorher fälschlich «Federweg» der Velo-Seiten) und selbst getippte Gruppennamen gehen nicht mehr durch die Übersetzung.
- **Gruppen überall (Teil, in 0.147.0; 18.10., «gruppen umbenennen und löschen soll grundsätzlich überall auf der app möglich sein»):** Jede Gruppe lässt sich umbenennen und löschen. Das gilt für Material-Kategorien, Bausteine (neu auch die eingebauten), Notiz-Themen (neu in «Listen und Typen»), die Gruppen der Velo-Werte (neu in «Listen und Typen»), die Themen bei «Gelernt» und die Dokumente (Paket A). Beim Löschen fragt die App, wohin der Inhalt kommt; vorgewählt ist «Ohne Gruppe». Danach gibt es kurz «Rückgängig». Selbst entschieden: Der Standard-Baustein und das Import-Thema «Open question» bleiben fest, weil die Packliste und der Rückblick daran hängen. Gelöschte eingebaute Bausteine lassen sich zurückholen; sie kommen leer zurück.
- **Was fällt weg oder rutscht tiefer:**
  - Ist das KI-Guthaben leer, sagt die App es einmal; danach verschwinden die KI-Felder überall (Neue-Tour-Karte, Antworten in der Suche, Assistent mit Claude, Liste prüfen, Rückblick-Entwurf, Wartung), bis es wieder geht. Sie kommen von selbst zurück.
  - Ich › Dokumente: «PDF hinzufügen» ist nicht mehr der Hauptknopf, «Dokument fotografieren» kommt zuerst; Suche und Sortierung stehen über den Gruppen; «Wo deine Dokumente liegen» und «Fotos aus der Galerie» kommen in die Seitenspalte unter «Erinnerungen» und «Für die nächste Reise».
  - Ich › Daten und Backup › Handy und Computer: der Weg mit der Datei bleibt ganz, steht aber unter «Oder mit einer Backup-Datei», unter «Automatisch abgleichen».
  - Training: auf einer Aktivität kommen die Analysen unter die bisherigen Werte; Trainingsplan bekommt 3 Analysen am Ende; Aktiv › Woche eine Link-Zeile «Wochenrückblick ›»; Ich bekommt die Zeile «Gewicht» nach «Inspiration».
  - Ich bekommt neue Zeilen: Termine und Aufgaben, Angebote (vor Bezahlen), Erinnerungen aufs Handy; im Neu-Menü rutschen die Einträge unter «Notiz + Foto» eine Zeile tiefer («Dokument fotografieren»).
  - Server: `GET /api/push?a=keys` fällt weg (der Server hält seine Schlüssel selbst).
  - Gruppen überall: nichts fällt weg. Eingebaute Bausteine zeigen neu «Löschen» (mit Zurückholen); eine Kategorie löschen fragt eine Frage mehr (wohin die Teile kommen); auf Ich › Dokumente fragt beim Löschen einer Gruppe das Fenster statt der kurzen Rückfrage.

## 18.10.2026: Paket A Daten sicher und Bedienung (0.146.0)

- **Ein Release aus drei Teilen** (Noah bündelt 18.10.2026 19:37 neu), je ein echter Merge auf Paket 3 (0.145.0, #182): (1) P3b «Daten sicher» fdd9904 + 6e1086d, (2) P3c «Bedienregeln» und «Kamera überall» cd792d2 + 99590b0 + 859d457 (Branch `claude/project-thread-2ay0i3`; 72a18b8 «Automatischer Abgleich» gehört zu Paket B und ist nicht dabei), (3) «Mehr Inhalt in der App» und Hinweistexte HT1–HT2 (Branch `content-app`, a8be22a8).
- **Freigaben:** P3b/P3c Noah 15.10.2026 «1a», Regeln «3a», «4a», «5a»; Dokumente D3/D4 «d1-d5 freigeben» 12.10.2026; Inhalt «5a» und «a» (1a 2a 3a 4a 5a) 15.10.2026; HT1–HT2 «HT1–HT2 freigegeben», «1a 2b 3a» 14.10.2026.
- **Noah 18.10.2026 «1b»: eine neue Tour bringt immer das Standard-Velo** (P3c-Commit 859d457). Das zuletzt gewählte Velo (`pg.lastBike`, P3c 4a) entscheidet im Fenster «Neue Tour» nie; `dayride.js lastBikeId` ist wieder wie auf main (nur die Touren). Heute und Schnellstart nehmen so weiter das Velo der letzten Tour; Velos-Tabs, Problem melden und Schnellerfassung behalten 4a. Die Einstellung von Standard-Velo («das zuletzt gefahrene») bleibt.
- **Selbst entschieden:**
  - P3b: Leeres Gerät: keine zweite Frage (nichts zu verlieren). Die Kopie vor dem Import ist ein Schnappschuss auf dem Gerät («Vor Updates», die letzten 3), keine heruntergeladene Datei. Dokumente liegen unter Ich › Dokumente.
  - P3c: T3a war schon seit 0.125.0 live (Heute: «Datum vorbei. Bist du gefahren?»), nichts geändert. A1a (Meditation-Kachel) kommt mit Paket Aktiv. Meditation-Seiten behalten ihr «‹ zurück»; TripBand am Handy bleibt kurz «‹ Touren». Langes Drücken im Rückblick schaltet direkt auf «Kaputt» (nochmals lang = wieder gebraucht); Rechtsklick am Computer gleich.
  - Inhalt: Beispiel-Vorlagen für Touren gibt es schon (domains.js); Beispiel-Teile für Bausteine gehören zu «Bausteine mehr» (#176). Die Beispiele erscheinen nur, solange «Tipps auf allen Seiten» an ist. Handbuch f.pagetips angepasst. Heute unverändert (HN4).
  - HT: keine Zahlen in den Sprung-Chips; Bausteine, Vorlagen, Setup, Ausstattung, Fahrten-Buch und Inspiration bekommen die Karte später (14 statt etwa 20 Orte). Material: Sprung-Chips zu Ansichten, Wunschliste, Auswertung.
  - Merge: Fenster mit beiden Regeln tragen `use:backClose` (Paket 3: Zurück schliesst zuerst das Fenster) und `use:keepTyped` (3a); TickSheet und TimerSheet behalten ihre eigene Regel für den Tipp daneben (`data-backdrop="own"`).
  - Merge: Velodetails (seit Paket 3 hinter dem Velo-Stift): ✕ behält das Getippte wie Escape und Zurück, nur «Verwerfen» lässt den Namen, wie er war.
  - Merge: Heute zeigt die Start-Karten von Paket 3 (kein automatischer Sprung zu «Tour beendet»); Demo-Touren zählen dabei wie echte (P3c H2b).
  - Merge: Material zeigt «Nach oben» (Paket 3) und darunter «Das kann die App hier» (Inhalt).
  - Das Blatt «Pflege für …» (RE 0.144.0, kam nach der P3b-Basis) behält das Getippte auch (`use:keepTyped`); sein «Abbrechen» bleibt (umbenannt sind nur die fünf Fenster mit eigener Behalten-Logik).
  - Der Gesamttest-Helfer `importBackup` beantwortet die zweite Frage von 5a, wenn sie kommt.
  - `f.docs`, `f.sync`, `f.camera` sind «seit 0.146.0»; docs/handbuch.md zählt 109 Funktionen.
- **Was fällt weg oder rutscht tiefer:**
  - «Abbrechen» in den Fenstern Velo, Tasche, Umbenennen, Material und Tour heisst jetzt «Verwerfen». ✕ schliesst weiter, behält aber das Getippte (vorher: weg).
  - «Alle Daten ersetzen» braucht auf einem Gerät mit Daten einen zweiten Tipp («Ja, alles ersetzen»).
  - Langes Wischen in Material löscht/archiviert nicht mehr sofort, sondern fragt zuerst.
  - Bei «Ich» steht statt eines Punkts eine Zahl.
  - Rückgängig-Hinweise verschwinden nach 4 s statt 8–10 s.
  - Der Werkstattbesuch zeigt den Beleg zuerst (oben), Datum und km danach.
  - Die Karte «Was hier steht» und die Tipp-Zeile kommen neu unter den Titel; der Inhalt darunter rutscht nach unten (mit × wird die Karte eine Zeile).

## 15.10.2026: Paket 3 als Release 0.145.0

- **Ein Release statt fünf (Thread «Mein Überblick» bündelt, Reihenfolge vom Koordinator):** Navigation «Regeln der App» 0.140.0 + Start-Karten ST1–ST2 0.140.1, Standard-Velo VS1–VS4 (0.145.0), Scrollen und Listen SL1–SL4 (0.141.0), WS2, WS5, WS6, Regeln einheitlich RE (#175, 0.144.0; zuerst Kopf 689993bb, dann der neue Kopf 4fec4e9 mit main 0.136.0), WS3 «Wie letzte Tour» (0.143.0) und vier Fehler aus den Bildern von 0.136.0. Je ein echter Merge-Commit pro Teil; RE ist inzwischen selbst als 0.144.0 auf main (#175, Merge von origin/main 2aba540d); die Arbeitsnummern 0.140.0–0.143.0 fallen weg; «Was ist neu» hat einen Eintrag 0.145.0 «Klare Regeln, dein Standard-Velo». Die Entscheide der Teile stehen in ihren Abschnitten oben.
- **Selbst entschieden:**
  - Velopflege «Jetzt fällig»: DK1 (eine fällige Reparatur ist eine Karte) bleibt; dazu Navigations `next` («n weitere fällig» öffnet das Velo der nächsten Karte).
  - «Letzte Tour»: `lastTripOn` von RE (die zuletzt benutzte Tour, `tripUsedAt`) bleibt die eine Regel. WS3 filtert davor mit `riddenTrips` (nur wirklich gefahrene Touren: vor heute oder heute beendet, nicht «Fahre nicht», keine Idee, mit Liste). So zeigt «Wie letzte Tour» nie eine geplante Tour, und die Reihenfolge ist dieselbe wie bei der Velo-Vorwahl.
  - WS3 auf Touren: die Zeile «Schnell starten» sitzt im SN4g-Layout direkt unter dem Kopf «Geplant», neben «Neue Tour» (das alte Layout mit Filter-Chips und Gruppen gibt es nicht mehr).
  - Velo-Kopf (SetupBand): beide Props, `cost` (WS5) und `onorder` (Standard-Velo); der Stift öffnet die Velodetails (Navigation, kein Umbenennen-Fenster mehr).
  - Hinweistexte HT1–HT2 (0.142.0) sind nicht dabei: der HT-Thread baut sie selbst, sie kommen in ein späteres Paket (Koordinator 15.10.2026).
  - Fehler 1: die Kachel «Fahrten-Buch» zählt den Monat wie «Velo in diesem Monat» (hochgeladene Fahrten, gezählte Strava-Fahrten, Strava-Fahrten aus «Training» ohne Eintrag); eine Fahrt «Zum Prüfen» zählt erst nach «Passt».
  - Fehler 5 (kein Augen-Knopf auf den Handy-Kategorien) bleibt: das ist seit «Pfeile und Ziehen» (0.136.0) so gewollt, Ausblenden steht im Fenster des Eintrags, und die Seite sagt das.
  - Nummer 0.145.0 statt 0.137.0: Regeln einheitlich (#175) kam vorher selbst als 0.144.0 auf main; Paket 3 enthält RE nur als Grundlage, sein «Was ist neu»-Eintrag 0.144.0 bleibt wie auf main, und Paket 3 nennt die Regen-Grenze nicht noch einmal.
  - `f.standardbike` ist «seit 0.145.0»; docs/handbuch.md zählt 106 Funktionen.
  - Material: ein neu erfasster Artikel klappt seine Kategorie auf und bleibt im Blick (U8, wie im Patch von Paket aktiv), weil die Kategorien seit SL zugeklappt starten.
- **Was fällt weg oder rutscht tiefer:**
  - Das Fenster «Velo umbenennen» (mit Rückgängig) fällt weg. Neu: der Stift neben dem Namen öffnet «Velodetails» (Name, Typ, Einsatz, Foto in einem Fenster).
  - Kein Sprung mehr nach «Fertig gepackt» und keine automatischen Sprünge zu Unterwegs oder «Tour beendet». Neu: eine Meldung mit Link bzw. die Karten «Heute unterwegs» und «Letzter Abend» auf Heute.
  - Ein alter Tab nach einer Pause (30 Min) öffnet die Startseite statt der alten Seite; Neuladen bleibt auf der Seite.
  - Material: die Kategorien starten zugeklappt, «Alle zeigen» fällt weg. Neu: fünf Zeilen pro Kategorie und die Sprungleiste.
  - Fahrten-Buch: «Alle zeigen» fällt weg. Neu: nach Monaten gruppiert. «Was ist neu» ist nicht mehr «alle offen», sondern nach Tagen.
  - Eine neue Tour nimmt das Standard-Velo statt automatisch das zuletzt gefahrene (Heute und Schnellstart behalten das zuletzt gefahrene, Noah «1b»; bei der ersten Tour fragt die App einmal).

## 15.10. bis 18.10.2026: Pakete, Bedienregeln, neue Bündelung

Zusammengefasst aus Noahs Antworten im Projekt (ohne private Inhalte). Der heutige Gesamtstand steht im [Projektstand](projektstand.md).

- **Pakete statt Einzel-PRs (15.10., «1a»):** fertige Teile werden zu Paketen gebündelt; ein Thread («Mein Überblick») fügt sie zusammen. Ersetzt «jeder PR bekommt sofort einen eigenen Link» vom 14.10.
- **Paketplan P3 bis P13 (15.10., abends):** Datensicherheit gleich nach P3 (P3b), Bedienregeln als P3c, Server-Teile in einem Server-Paket (Vercel-Schritte nur einmal), ab P4 kleinere Pakete mit zwei bis drei Teilen. Am 18.10. ersetzt (siehe unten).
- **Datenbank-Stufen (15.10., «1a»):** 12 = Dokumente (Paket A), 13 = Fitbit, 14 = Dokument als PDF, 15 = Google Aufgaben und Kalender (alle Paket B). Grund: die Stufen bauen aufeinander auf, darum kommt A vor B.
- **Bedienregeln für die ganze App (15.10., sechs Fragerunden):**
  - Ein Fenster schliessen (✕, Zurück, Escape) schliesst zuerst das Fenster; das Getippte bleibt, nur «Verwerfen» löscht.
  - Zuletzt gewählte Tour und zuletzt gewähltes Velo bleiben überall gewählt.
  - «Alle Daten ersetzen» fragt zweimal und macht vorher selbst ein Backup.
  - Am Handy kommen alle Fenster von unten. «Rückgängig» bleibt überall 4 Sekunden, beim Packen bis zum Tourwechsel.
  - Langes Wischen in Material fragt zuerst; langes Drücken auf ein Teil bietet «Kaputt» an.
  - Eine neue Tour ohne Namen wird gespeichert, sobald etwas gewählt ist. Liegt das Datum einer Tour zurück, fragt Heute «Bist du gefahren?».
  - Die Tourkachel zeigt am Starttag «Packen», bis fertig gepackt ist. Nur der Schalter «Testtour» versteckt eine Tour. In «Heute wichtig» steht Rot zuoberst. Demo-Touren zählen wie echte.
  - Ein Weg «Fahrt hochladen» für GPX, TCX und CSV. Der Zurück-Weg ist überall ein Pfad («Ich › …»). Suche und Filter in Material sind bei jedem Öffnen leer.
  - Ein Tipp auf die Meditations-Kachel hakt ab, langes Drücken startet.
  - Kamera-Knopf grün mit Galerie, bei allen Fotos; Werkstattbesuch öffnet die Kamera sofort; «Weitere Seite» für mehrseitige Belege.
- **Rechnungs-Erinnerungen (15.10., «4b»):** nur unter Ich › Bezahlen, nicht auf Heute.
- **Ausrüstung (15.10.):** eigener Ort in der Navigation; am Handy teilen sich Velos und Ausrüstung einen Platz mit Umschalter. Fällige Pflege der Ausrüstung steht als Zeile auf Heute.
- **Woche planen (15.10.):** eigener Ort «Woche», am Handy statt «Material» in der Leiste; Sonntags-Planung Schritt für Schritt; Google Kalender gleich dabei; Ferien schlagen Folgen vor, alles abwählbar.
- **Ideen 1 bis 3 bauen (15.10., abends):** Planungs-Notizen im Tour-Entwurf, Routine «Das tut mir gut», Erinnerungen aufs Handy; dazu Geburtstage und Pflanzen sowie «Mehr selbst einstellen».
- **Veröffentlichen (15.10., am 18.10. mit «1b» bestätigt):** Claude führt ein Paket für Noah zusammen, aber nur, wenn Noah die Bilder dieses Pakets gesehen und dafür «ok» geschrieben hat, die Prüfungen auf dem letzten Commit grün sind und `main` sich nicht bewegt hat. Eine blosse «Freigabe» ohne Paketnamen zählt nicht. Ersetzt «Noah merged jeden PR selbst» vom 10.10.
- **Neue Tour nimmt immer das Standard-Velo (18.10., «1b»):** gilt nur für neue Touren; sonst bleibt die Regel «zuletzt gewählt bleibt gewählt».
- **Automatischer Abgleich Handy–Computer (18.10., «1b und a möglich 2b 3b»):** über eine Gratis-Datenbank auf Vercel, Google Drive als Ersatz; bei einem Konflikt fragt die App. Kommt mit dem Server-Paket.
- **Erinnerungen aufs Handy (18.10., «2b»):** ein Gratis-Wecker (cron-job.org) stösst den Server jede Minute an. Die Inhalte der Ideen 1 bis 3 sind so freigegeben, wie sie gebaut sind («1a»).
- **Tages-Check (18.10.):** Morgen-Check und Abend-Rückblick werden wieder eigene Seiten (auch erreichbar aus «Wi gaht's?»); Kachel «Deine 15 Fragen» mit eigener Seite; ein grosser Balance-Ring mit 9 Bereichen ersetzt auf Heute die drei Im-Flow-Ringe.
- **Neu bündeln in sechs Pakete (18.10., 19:37 UTC, «1a 2b 3b 4a»):** P3 → A Daten sicher und Bedienung → B Server → D Touren und Unterwegs → E Material, Velos, Merken → C Heute und Aktiv → F Woche. Neue Arbeit darf parallel weiterlaufen; Skitour bleibt in E. Versionen: P3 0.145.0, A 0.146.0, danach ein Schritt pro Paket. Ersetzt den Paketplan P3 bis P13.
- **Doku (18.10.):** neuer Einstieg [projektstand.md](projektstand.md) und [geschichte.md](geschichte.md); der Projektstand wird bei jedem Paket nachgeführt.

## 18.10.2026: Testlink statt Mockups, Anleitung für Claude

- **Testlink statt Mockups (Noah, 21:52 UTC, «ab sofort … überall»):** gebaut wird ohne Mockups und ohne Bilder vor dem Merge. Zu jedem Paket bekommt Noah den Testlink (Vercel-Vorschau des Paket-PRs) mit «eigener Speicher, Backup hochladen zum Testen mit deinen Daten». Zusammengeführt wird erst nach seinem «ok» für dieses Paket. Updates von Abhängigkeiten werden sofort zusammengeführt. Ersetzt «zuerst bauen, dann Bilder» vom 14.10.2026.
- **CLAUDE.md nachgeführt (Noah, 21:53 UTC, «bitte anweisung in claude ebenfalls integrieren und speichern»):** die Anleitung für Claude nennt jetzt die heutigen Regeln (Testlink, Pakete, Zusammenführen nach «ok», Fragen ohne ★, kein Trello). Ersetzt das «b» von 18.10.2026, 19:56 UTC.

## 18.10.2026: Einfache Wörter und lange Namen (Durchklick DK6/DK7, Baustein ohne Version)

- **Wörter (DK6, Noah 14.10.2026 «1-5 freigeben», Antwort 5a; Noah 14.10.2026 20:15 «a a, b a, c b»):** auf Deutsch «Erkenntnisse» statt «Learnings», «Eingang» statt «Inbox», «Vorhaben» statt «Challenge», «Grundgewicht» statt «Basis», «Neue Tour» statt «Rahmenbedingungen»; überall «Material» (nicht «Ausrüstung»), «Favoriten» und «Aktiv» (nicht «Im Flow»). «später · S1» heisst nur «später».
- **Kleine Fehler (DK7):** lange Tournamen ohne Leerzeichen brechen auf Touren um (geplante Karten, Packmodus-Band, Liste, In Zahlen, Kacheln) statt die Seite zu verbreitern; ein Import auf einem Gerät ohne Touren und Material sagt «Neu hier» statt «Älter»; «Alles in Ordnung?» zählt alle Zeilen. Test `tests/e2e/durchklick.spec.js`.
- **Selbst entschieden:** die 0-Linie im km-Diagramm des Rückblicks (DK7b) fällt weg, weil der Rückblick seit 0.137.0 neu gebaut ist und die alte Position nicht mehr passt; ältere Was-ist-neu-Einträge nutzen die neuen Wörter auch.

## 19.10.2026: Paket D Touren und Unterwegs (0.148.0)

- **Ein Release aus allen D-Teilen** auf Paket B (0.147.0): AT1 Touren-Seite, Höhenprofil HP1–HP5, GPX-Weg R3a, Planungs-Notizen, Handy kurz, Bugfixes 0.132.2 + H3a, W1 «Deine Fahrten», Wörter DK6/DK7, Bewegung und Einheitliche Formulare (Pilot in «Aus Notiz wird …»). Die Chronik ist noch nicht gebaut und kommt später.
- **Handy kurz, Noah 18.10.2026 «1b»:** «Geplant» zeigt am Handy 3 Karten; «Schnell starten» ist am Handy ein Knopf im Kopf von «Geplant». Der Computer bleibt gleich.
- **Handy kurz gegen «Was hier steht», Noah 19.10.2026 «1a»:** zwei freigegebene Regeln standen gegeneinander (HT1–HT2: die Karte ist beim ersten Besuch offen; Handy kurz: höchstens 3 Bildschirme). Am Handy startet die Karte auf den Handy-kurz-Seiten zu, als leise Zeile «Was hier steht ›»; auf Touren steht sie im Kopf neben «Fahrt hochladen». Der Tipp des Tages steht am Handy hinter «In Zahlen · Weiter». Der Test misst weiter dasselbe (höchstens 3 × 844 px). Favoriten und Was ist neu haben keine solche Karte. Am Computer bleibt alles wie in A.
- **Rückmeldungen beim Speichern (Noah 19.10.2026 05:41 «1a 2a 3a 4b»):** Löschen fragt überall im App-eigenen Fenster; ein Teil, das noch gebraucht wird, bietet zuerst Archivieren an, danach 4 Sekunden Rückgängig. Teil-, Velo- und Tour-Fenster sagen nach Speichern, ✕ und Verwerfen, was passiert ist; Verwerfen hat Rückgängig. Neu fragt auch «Löschen» im ••• einer Material-Zeile. Bei Bausteinen bleibt das Löschfenster von «Gruppen überall» (0.147.0), es fragt schon, wohin die Teile gehen.
- **Abgleich nach dem Koppeln (Noah 19.10.2026 06:29):** beim ersten Abgleich nach dem Koppeln fragt die App nur einmal, welches Gerät den richtigen Stand hat; die Antwort gilt für alle verschiedenen Einträge, «Einzeln entscheiden» bleibt möglich. Selbst entschieden: die eine Frage kommt nur nach dem Koppeln und steht im Abschnitt «Handy und Computer», nicht in einem eigenen Fenster.
- **Einheitliche Formulare:** freiwillige Felder sagen «freiwillig», Fehler stehen direkt am Feld, Speichern lässt sich immer drücken; ein zweites Drücken während des Speicherns zählt nicht (statt den Knopf grau zu machen). Zuerst in «Aus Notiz wird …» und «Teil bearbeiten»; weitere Formulare folgen.
- **Selbst entschieden:** die Zeile «Was hier steht ›» auf Touren am Handy zeigt nur die Worte, ohne den ersten Satz der Karte (eine Zeile statt drei); `preparation.spec` liest das DK6-Wort «(gewogen)» statt «bekannt:».

## 19.10.2026: Paket E Material, Velos, Merken (0.149.0)

- **Ein Release aus allen E-Teilen** auf Paket D (0.148.0): P4 + P5, Geburtstage + Pflanzen, Eigene Werte, Skitour, Sportart SA1–SA3, Eigene Listen, UI-Regeln Teil 1 + 2, Impeccable Runde 1, «Was hier steht» auf 5 weiteren Seiten, Bezahl-Erinnerung, TWINT-Bildschirmfoto (QR6), Garmin Edge 850. Impeccable Runde 2 gehört zu Paket C.
- **Garmin Edge 850 statt 540** (Noah 18.10.2026 22:31 «ersetzt 540»): die Grenze von 6 Feldern fällt weg; gespeicherte 540-Einstellungen gehen aufs 850.
- **Eigene Funktions-ID `f.skiequipment`** für Velos › Ausrüstung; `f.equipment` bleibt das Datenblatt der Velo-Teile.
- **«Erkenntnisse»** auch auf den Ski-Seiten (statt «Learnings»), wie im Rückblick (DK6).
- **Noah 19.10.2026 «1a 2b»:** (1a) das SA3-Band am Handy bleibt einzeilig. (2b) Ein geteiltes Foto oder PDF geht immer zu Dokumente (share target «doc»); «pay» ist kein Bild-Ziel mehr (ein altes «pay» vom Handy geht auch zu Dokumente). Das TWINT-Bildschirmfoto wählt man in Rechnungen unter «Zahlungen erkennen» («TWINT-Bildschirmfoto wählen»).
- **CI-Fix:** in der Wunschliste am Computer fällt das Schild «Wunschliste» bei Wunsch-Zeilen weg (wie am Handy, G007), damit der Name neben «Gekauft» und dem Teil-Fenster genug Platz hat; der Gesamttest öffnet am Handy «Alle Kennzahlen» erst mit einem Tipp (UI-Regeln «a»).
- **CI-Fix e2e:** «Ja, erinnern» auf der Karte «Soll ich dich erinnern?» ist ein normaler Knopf; der Hauptknopf der Seite darunter bleibt der einzige orange. Der «…»-Knopf im Logbuch ist am Handy 44 px gross.
- **CI-Fix e2e Runde 2:** Ich › Daten stürzte ab, sobald das Licht «Automatischer Abgleich» oder «Fitbit» gelb war (die Impeccable-Kopfzeile kannte nur Backup, Ordner, Speicher, Behalten); jetzt sagt ein solches Licht seinen Namen und seine Zeile. Handy quer: die Kernzeile mit den Sprungmarken auf Planen ist ausgeblendet (wie Pfad und Kicker), aufrecht und am Computer bleibt sie. Touren am Handy: die graue Zeile von «In Zahlen · Weiter» bleibt einzeilig, das SA3-Band ist 44 px hoch.
- **CI-Fix e2e Runde 3:** Material öffnet für jedes Teil ein frisches Fenster (`{#key}`), damit ein Teil, das sich öffnet, bevor das Schliessen des letzten fertig ist, nicht dessen Entwurf zeigt.
- **Ich › Erinnerungen** zeigt unter «Wo sie erscheinen» den Weg zu «Erinnerungen aufs Handy» (#/me/push); Ich zeigt beide Zeilen untereinander.
- **Selbst entschieden:** die zugeklappte Bausteine-Karte hat unten 16 statt 24 px Abstand (Packen 1: die erste Tasche bleibt am Handy auf dem ersten Bildschirm, auch mit «Was hier steht» darüber); die Saison-Pflege-Aufgaben haben eigene Schlüssel (`|season`); in «Teil bearbeiten» bleibt D's `Field`-Form mit dem «kalt»-Beispiel aus Eigene Werte; Ich › Daten zeigt bei «Backup» den Knopf «Backup machen» (Impeccable), bei Fitbit D's «Jetzt».
## 19.10.2026: Alles selbst bearbeiten

- **Regel (Noah, 06:48 UTC, «alle daten können vom nutzer selber hinzugefügt, umbenannt oder gelöscht werden … für gesamtes projekt»):** jede Datenart lässt sich im Frontend hinzufügen, umbenennen und löschen. Löschen fragt im App-Fenster und bietet «Rückgängig»; nichts ist gesperrt, weil es noch gebraucht wird.
- **Velos:** «Velo löschen» geht immer. Das Fenster fragt, welches Velo seine Touren bekommen («Ohne Velo» zuerst). km-Buch, Werkstatt-Besuche, Fotos und Pflege-Aufgaben gehen mit dem Velo; «Rückgängig» holt alles zurück. Ein neuer Name zeigt den Hinweis, dass Garmin-Profil und Strava-Velo gleich heissen müssen. Der Stift heisst jetzt sichtbar «Bearbeiten».
- **Neu bearbeitbar:** Probleme (umbenennen, löschen), Learnings (hinzufügen, ändern, löschen), hochgeladene Fahrten (umbenennen), Velo-Ideen (umbenennen), alte Logbuch-Einträge (umbenennen, löschen).
- **Listen und Typen:** Sportarten (umbenennen, eigene, ausblenden, Reihenfolge, löschen; eine Standard-Sportart bleibt bei alten Touren erhalten, eine eigene gibt ihre Touren an eine andere Sportart), Plätze am Velo und Pflege-Teile (nur umbenennen, die App braucht jeden davon).
- **Selbst entschieden:** km-Buch und Werkstatt gehen mit dem gelöschten Velo, statt an ein anderes Velo (sonst stimmen dessen km nicht). Vorlagen, die ein gelöschtes Velo nennen, bieten einfach keines an.

## 19.10.2026: Paket R «Andere Menschen und Geld»

- **Noah 13:44 «1b 2a oder b 3a und b vorbereiten 4a 5 keine inhalte von anderen»:** (1b) die App ist für alle offen. (2) Abgleich wahlweise «Mit Google anmelden» oder ohne Konto mit Code/Einladungs-Link; ohne beides bleibt alles lokal. (3) Alles gratis; Pro 29 CHF bleibt vorbereitet und aus (`PLANS.app_once`, `PAY_MODE` off, `LOCKED` false). (4a) Velomech/Guide nur als eigene Liste mit Anfrage per Mail, Link oder Telefon, kein Geld über die App. (5) Keine Inhalte von anderen: keine Follower, Kommentare, geteilten Listen.
- **Tagesgrenze:** jeder Server-Aufruf zählt pro Schweizer Tag (`api/_lib/daycap.js`, in `route()`); über der Grenze antwortet der Server 429 «daily_cap», die App sagt «morgen wieder». Der Wächter meldet einen Tag mit erreichter Grenze (Check «tagesgrenze»).
- **Selbst entschieden:** die Google-Anmeldung fragt nur «openid email» und nutzt die schon eingetragene Rückkehr-Adresse `/api/google/callback` (Zustand «account»). Der Server behält keine Mail-Adresse; der Code des Kontos liegt mit `ACCOUNT_SECRET` versiegelt in Redis. Strava, Fitbit, Kalender, Mail und KI bleiben Verbindungen des Server-Besitzers. Neue Seiten Ich › «Datenschutz und Nutzung» (#/me/privacy) und Ich › «Velomech und Guide» (#/me/pros, Einstellung `pros`). Kontakt auf der Datenschutz-Seite: GitHub-Issues, kein echter Name.
