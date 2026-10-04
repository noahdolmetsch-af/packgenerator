# Decision Log

Jede wichtige Entscheidung mit Datum, Entscheid und Grund. Neueste unten.

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
