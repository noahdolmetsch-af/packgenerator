# Decision Log

Jede wichtige Entscheidung mit Datum, Entscheid und Grund. Neueste unten. Ältere Zeilen dokumentieren den damaligen Stand und bleiben erhalten.

## Aktuelle Geltung (Abgleich 07.10.2026)

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
| 07.10.2026 | **PR #31 separat offen halten**: Konflikte und Eventmodus vor Merge mit neuer Packansicht abstimmen | GitHub meldet mergeable=false; diese Runde dokumentiert und implementiert keine neue Eventlogik |
