# App-Stand: was die App kann, wo es steht, wie es zusammenhängt

**Regel für jeden Thread und jede Claude-Sitzung (Noah, 03.11.2026):** Diese Datei **vor jeder Abfrage lesen** und alles Weitere, was das Projekt betrifft, darauf aufbauen. Nichts neu analysieren, was hier steht. Weicht der Code ab, gilt der Code, und der PR korrigiert diese Datei (Fertig-Regel, Punkt 6 in `CLAUDE.md`).

Hauptdatei ist diese Datei auf GitHub (`docs/app-stand.md`). Die Kopie im Projektordner (`/mnt/project-files/app-stand/app-stand.md`) aktualisiert der Merge-Bündler nach jedem Merge, der sie ändert.

Quelle der Funktionsübersicht (Abschnitt 3): Noahs Dokument «Was die App kann» vom 03.11.2026, abgeglichen mit `src/lib/features.js` und einem Durchlauf der echten Seite. Zeilen mit † hat der Screenshot verdeckt; ihr Text stammt aus `features.js`. Hier steht **keine Versionsnummer und keine Zählung** (Regel 13, sonst ändert jeder PR dieselbe Zeile). Die aktuelle Nummer zeigt `node scripts/news.mjs`; jede einzelne Funktion mit Schritten steht im Funktionskatalog (`#/features`, Quelle `src/lib/features.js`) und im Handbuch (`src/lib/handbook.js`).

## 1. Die App in einem Absatz

Persönliches Aktivitäts-, Touren- und Alltags-Cockpit: Tourenplanung, Packlisten, Navigation, Velopflege, Training und persönliche Organisation. Svelte 5 + Vite, Daten nur auf dem Gerät (Dexie/IndexedDB), läuft offline als PWA (Desktop und Samsung-Handy). GitHub Pages liefert die App; der Vercel-Server «packgen» (`api/`) wird nur für Verbindungen gebraucht (Strava, Fitbit, Google, KI-Helfer, Push, Abgleich).

## 2. Orte der App und wo sie im Code liegen

| Ort | Wofür | Code |
|---|---|---|
| Heute | Was jetzt wichtig ist; «Dein Moment», Entdecken | `src/pages/Home.svelte`, `src/lib/home` |
| Planen | Woche, Termine, Aufgaben, Listen | Seiten `Woche*`, `Calendar` |
| Touren | Tour planen, packen, unterwegs, Rückblick | `Pack.svelte`, `Tour.svelte`, `Live.svelte`, `Debrief.svelte` |
| Aktiv | Training, Ziele, Wohlbefinden, Auswerten | `Flow`, `Aktiv`, `Analyse` |
| Velos und Material | Velos, Pflege, Werkstatt, Material, Kleider | `Bikes.svelte`, `Gear.svelte` |
| Ich | Daten, Verbindungen, Einstellungen, Alltag | `Me.svelte` |

Seiten laden erst bei Bedarf (`PAGES` in `src/App.svelte`). Alle Funktionen sind zusätzlich nach Ort in «Karte der App» (`#/me/karte`) zu finden; sie wird aus `features.js` gebaut und ist nie veraltet.

## 3. Funktionsübersicht (11 Bereiche)

Jede Zeile: Name, echter Link in der App (`#/…`, aus dem Durchlauf der Seite) und was man damit tun kann. `<id>` steht für das gewählte Velo oder die gewählte Tour.


### 1. Startseite und Bedienung

| Funktion | Link | Was man damit tun kann |
|---|---|---|
| Heute | `#/` | Persönliche Übersicht mit nächsten Vorhaben, Wetter, fälligen Aufgaben, Körperdaten und Vorschlägen. Kacheln hinzufügen, ausblenden und sortieren. «Aktiv heute» zeigt nicht nochmals, was oben als Gewohnheit steht (eine Zeile nennt es). «Diese Woche» zeigt im Block «Heute laut Plan» nur Offenes und schreibt die Aktivitäten der Tage in ganzen Zeilen unter die Tage; «Velo im Monat» nennt den Vergleich («Gleiche Tage im Oktober: 38 km»). «Jetzt dran» zählt und zeigt nur Dringendes (rot, gelb, blau); ruhige Hinweise stehen eingeklappt darunter als «Gut zu wissen»; jede ruhige Zeile hat «Später» (eine Woche weg), und «Zeilen wählen» (`src/lib/home/RowsSheet.svelte`) schaltet ganze Zeilenarten aus. «Jetzt dran» zählt und zeigt nur Dringendes (rot, gelb, blau); ruhige Hinweise stehen eingeklappt darunter als «Gut zu wissen». «Schnell öffnen» zeigt die Quick-Links-Kürzel und schlägt eine Seite zum Anpinnen vor, die du an drei Tagen in zwei Wochen geöffnet hast («Nein, danke» hält 30 Tage zurück). Oben der Gruss «Guete Morge, wi gaht's?»: ein Tipp öffnet die Stimmung (fünf Gesichter, «Mehr» mit Energie und Gefühlen, beliebig viele) und den Plan; jeder Tipp wird sofort im Verlauf von «Wi gaht's?» gespeichert, gestern ist markiert, die letzten 7 Tage stehen als Punkte darunter (nur Beobachtung), und «Mehr» hat auch «Wetter im Kopf». «Woran liegt's?» (freiwillig, nur gezählt) steht darunter; ab 18 Uhr fragt der Gruss «Wie war's?» statt nach dem Plan. «Knöpfe anpassen»: Gesichter, Gefühle (mit Emoji), Gruppen und Pläne hinzufügen, umbenennen, ausblenden, löschen und ordnen; derselbe Editor auf «Wi gaht's?» (Ich › Deine Fragen). Die Kachel «Spruch» (`src/lib/home/SpruchTile.svelte`, Sätze und Regeln in `src/lib/home/spruch.js`) steht im Bereich «Jetzt dran» (nach Dein Moment, Tourkarte, Gewichtsfrage und Entdecken): ein kurzer Satz auf Berndeutsch aus deinen Zahlen (Wetter und abziehender Nebel, Zonenminuten, Schlaf und Ruhepuls, Schritte, Wochen in Folge, Velo-Kilometer des Jahres, nächste Tour, Tour vor einem Jahr; Daten aus `src/lib/home/spruch-data.js`), jeder Satz in zwei Formulierungen; alle paar Sätze ein Zitat aus der Kissenzeit auf Hochdeutsch (`lang="de"`), auch wenn sonst nichts passt; «Warum?» zeigt den Wert dahinter, «Neuer Spruch» den nächsten; die letzten 30 kommen nicht wieder, bei auffälligem Schlaf oder Ruhepuls keine Herausforderung. «Nicht mehr solche» schaltet den Satz aus (mit Rückgängig); «Alle Sprüche» (`src/lib/home/SprucheSheet.svelte`) wählt den Ton (Mix oder einer) und schaltet Quellen und einzelne Sätze ein oder aus; dort schreibst du auch eigene Sprüche (bis 40, mit Ton, ändern und löschen mit Rückgängig; Einstellung `home.spruch.own`, im Backup). Auf den Karten «Entdecken» und «Gewicht diese Woche?» gibt es genau einen gefüllten Knopf, «Später» und «Nicht für mich» sind leise Wörter. «Dein Körper heute» zeigt für einen fehlenden Wert den letzten der letzten 7 Tage mit «von gestern» oder dem Datum, dazu «Jetzt holen»; Ziehen ganz oben holt auch Fitbit. Die Reihe «Letzte 12 Monate» ist antippbar (Monat im Fenster, mit Weg zum Rückblick, «Als Tabelle»). |
| Traum der Woche | `#/trips/dreams` | Kachel auf Heute, die nur erscheint, solange ein Traum passt: ein Traum mit festem Datum zählt herunter (ab 90 Tagen vorher) und zeigt das Wetter für genau seine Tage, sobald sie in der 16-Tage-Vorhersage liegen; ein Traum ohne Datum erscheint, wenn der Monat passt und die nötigen Tage trocken sind. «Fährt durch die Nacht» verlangt zusätzlich Nacht über 5 °C und wenig Wind. Datum und Nacht stellt man im Traum ein (Touren › Träume). |
| Bild oben auf Heute | `#/` | Gezeichnete Landschaft mit der nächsten Tour und dem Countdown; der Himmel folgt Tageszeit und Wetter. Ein Tipp öffnet die Tour; ausschaltbar unter Ich › Darstellung › Bedienung. |
| Suche und Assistent | `#/assistent` | Fragen zu eigenen Daten stellen, Funktionen finden und eine Tour durch kurze Fragen vorbereiten. Das leere Suchfeld oben zeigt zuerst «Zuletzt geöffnet»: die letzten fünf Seiten dieses Geräts (dieselbe Liste wie in Quick Links; «Liste vergessen» mit Rückgängig), dann Befehle zum Ausprobieren und die letzten Suchwörter. |
| Quick Links | `#/quick` | Häufig verwendete Seiten und Kacheln anpinnen und in eigenen Gruppen ordnen. |
| Funktionskatalog | `#/features` | Funktionen nach Situation, Seite oder Moment entdecken und suchen. |
| Handbuch | `#/me/handbook` | Voraussetzungen, kurze Anleitungen und Beispiele zu den Funktionen lesen; Rundgänge starten. |

### 2. Touren planen und vorbereiten

| Funktion | Link | Was man damit tun kann |
|---|---|---|
| Tourenübersicht | `#/trips` | Geplante, abgeschlossene und bewertete Touren verwalten; neue Touren und spontane Ausfahrten beginnen. Jede Tour mit Route zeigt ihre Streckenform als kleines Zeichen. Jede geplante Tour hat unter der Karte Wege nach ihrer Phase (Packen, Wetter dieser Tour, Form; nach der Tour Rückblick); «n warten auf deinen Rückblick» unter dem Titel zeigt genau diese Touren. |
| Tour planen | `#/pack` | Sportart, Datum, Dauer, Startort, Velo und Bedingungen festlegen und daraus eine Packliste vorbereiten. «Wetter für diese Tour» sagt bei einem Start in den nächsten 3 Tagen auch, ob die Route im Nebel startet und ab welchem km sie darüber ist; das Höhenprofil zeigt den Nebel als Band. |
| Wie anstrengend wird es? | `#/pack` | Bei einer Velotour vor der Abfahrt von 1 bis 10 schätzen; nach der Fahrt stellt die Tour-Seite Schätzung und Erleben nebeneinander und sagt ab drei Touren, ob die Schätzungen eher in eine Richtung gehen. |
| Gründe für eine andere Tour | `#/me/lists` | Wird eine Tour auf «Nicht fahren» gesetzt oder weicht die gefahrene Strecke stark ab, nennt ein Tipp den Grund (Liste in Ich › Listen und Typen); ab drei Antworten zählt eine Zeile, was am häufigsten vorkam. |
| Routen und GPX | `#/pack` | GPX hinzufügen, Distanz, Höhenmeter, Fahrzeit, Höhenprofil und Anstiege ansehen (ein Punkt fährt das Profil auf Wunsch einmal ab); offene Stellen entlang der Route notieren. |
| Tourvorlagen | `#/pack/templates` | Bewährte Touren als Vorlage speichern und erneut verwenden. Rückblicke liefern Vorschläge zur Verbesserung. |
| Erfolgsrezepte | `#/pack/templates` | Nach einer gelungenen Tour festhalten, was geklappt hat (Frühstück, Startzeit, Verpflegung, Tempo); die Rezepte stehen unter Vorlagen und lassen sich in Planen neben eine nächste Velotour legen. |
| Touren nebeneinander | `#/trips/compare` | Zwei Touren auf Terminüberschneidungen, gemeinsam benötigtes Material und offene Aufgaben vergleichen. |
| Verpflegungsplan | `#/trips/fuel` | Kohlenhydrate und Wasser pro Abschnitt planen, Flaschen und Vorräte berücksichtigen sowie Versorgungslücken erkennen. Stopps als GPX-Wegpunkte exportieren. |
| Reise-Links | `#/travel` | Unterkunft, Flüge und Anreise recherchieren; Optionen mit Kosten, Stornierung und Entscheidungsgrund festhalten. |
| Checks pro Tourart | `#/me/checks` | Eigene Checklisten für Vorabend, Start und Rückkehr je Reise- oder Sportart erstellen. |
| Vor der Abfahrt | `#/ride/abfahrt` | † Ein Blatt für den Tourtag: Route, Start, Tickets, Notfallnummern und Kontakte, der Heimweg; offline und als PDF. |
| Quiz | `#/quiz` | Vor einer Tour Fragen zu Route und Ausrüstung beantworten und eigene Fragen ergänzen. |

### 3. Packen, Material und Ausrüstung

| Funktion | Link | Was man damit tun kann |
|---|---|---|
| Materialinventar | `#/gear` | Gegenstände mit Gewicht, Preis, Marke, Eigenschaften und Notizen verwalten; filtern, mehrere gleichzeitig bearbeiten und Dubletten zusammenführen. |
| Material importieren | `#/gear/import` | Eine bestehende Materialliste einlesen und die vorgeschlagenen Übernahmen prüfen. |
| Packliste | `#/pack` | Material auswählen, Mengen festlegen, Taschen zuordnen und Gesamtgewicht kontrollieren; auch nach Bedürfnissen wie Schlafen, Kochen oder Regenschutz packen. Bei einer geplanten Tour steht unter dem Tourkopf die Karte «Bereit zur Abfahrt?» (zu: ein Zeichen pro Punkt; aufgeklappt vier Zeilen: Gepackt, Wetter, Velo, Geräte) mit Tipp zu dem, was offen ist. Unter der Packliste liegt «Mehr zu dieser Tour» mit fünf geschlossenen Gruppen: Wetter und Warnungen (Plan B), Vorher und am Abend (Velopflege, Laden, Papiere, Generalprobe, Check-in, Wäsche, Morgenliste, Unklare Stellen, Grenzübertritt, Einkaufsliste), Mit anderen (Packen zu zweit), Packen leichter machen (Startliste je Sportart) und Daraus lernen (Ballast, frühere Touren, Packzeit). Eine Gruppe öffnet sich von selbst, wenn ein Link in sie führt (Einkaufsliste, Velopflege); Code `src/lib/pack/PackMore.svelte`. |
| Tasche für Tasche packen | `#/pack?day` | Gegenstände beim Einpacken abhaken, zwischen Taschen verschieben und auf grossen Bildschirmen Taschen nebeneinander sehen. |
| Packliste teilen | `#/pack?print` | Liste als Link teilen, drucken oder als PDF ausgeben; beim Packen zu zweit Verantwortlichkeiten und Gewichte verteilen. |
| Bausteine | `#/blocks` | Wiederverwendbare Sets wie Reparatur, Regen oder Schlafen erstellen; eigene Wenn-dann-Regeln für Vorschläge hinterlegen. |
| Bausteine prüfen | `#/blocks/check` | Gegenstände einzeln überprüfen: behalten, entfernen oder einem anderen Baustein zuordnen. |
| Packliste aufräumen | `#/blocks/aufraeumen` | Automatisch mitkommende Gegenstände reduzieren und die Grundausstattung übersichtlicher machen. |
| Kleider und Kits | `#/wardrobe` | † Kleidung nach Körperschicht und Körperzone erfassen, Outfits als Kit speichern; Lücken landen auf der Wunschliste. |
| Favoriten | `#/favorites` | Bewährte Gegenstände markieren und festhalten, weshalb sie sich bewährt haben. |
| Wiegen und Wunschliste | `#/gear?tab=wishlist` | Tatsächliche Gewichte erfassen, leichtere eigene Alternativen vergleichen und Anschaffungen nach Nutzen, Preis und Gewichtsersparnis beurteilen. |
| Einkaufs- und Ladeliste | `#/pack?shop` | Vor der Abfahrt Einkäufe und zu ladende Geräte abhaken; letzte Gegenstände für den Abfahrtsmorgen merken. |
| Vorrat | `#/gear/supplies` | Lebensmittel und Verbrauchsmaterial mit Bestand und Ablaufdatum verwalten; Nachkäufe vorbereiten. |
| Strombudget | `#/gear/power` | Geräteverbrauch, Akkulaufzeit, Powerbank und Ladegerät gegen die Tourdauer rechnen. |
| Leihliste | `#/gear/lend` | Festhalten, wer welches Material hat; Rückgabe erinnern und Leihlisten teilen. |
| Hauptausrüstung | `#/equipment` | Grössere Sportausrüstung wie Ski, Felle oder LVS mit Einsätzen und Pflegebedarf verwalten. |

### 4. Unterwegs, Navigation und Gruppenfahrt

| Funktion | Link | Was man damit tun kann |
|---|---|---|
| Unterwegs-Übersicht | `#/ride` | Nächste Etappe, Wetter, Verpflegung, Material und Tagesablauf ansehen; Basischeck und Abendvorbereitung erledigen. |
| Live-Karte | `#/live` | Position und Route verfolgen, Abbiegehinweise und Datenseiten nutzen sowie Pausen, Runden und Umwege bearbeiten. Mit der Option «Gewitter- und Starkregen-Warnung» sagt die Karte, wenn in den nächsten 2 Stunden ein Gewitter oder Starkregen kommt, und nennt das nächste Dach mit «Dorthin planen». Nach der Fahrt lassen sich Stücke mit Daumen hoch oder runter markieren («Gemerkte Wege» in den Optionen, umbenennen, ändern, löschen); schlechte Stücke meidet «Neu planen zu …», gute zeigt die Karte als Zeichen. Vor dem Start steht die Karte «Bereit für unterwegs?» (Karte entlang der Strecke auf dem Handy, Sprache an oder aus, mit «Karte speichern» und «Sprache einschalten»; die Fahrt startet auch ohne). In «Nächste 3 Stunden» zeigt jede Stunde Sonne oder Mond und bei Regen, Kälte, Kühle oder Wind einen kurzen Kleidungs-Tipp. Im Fenster «Neu planen zu …» fragt «Wie fährst du?» nach der Art (ruhige Strassen, kurz und asphaltiert, Gravel, Pfade) und schlägt die zum Velo passende vor; jeder Weg zeigt «Belag: 85 % befestigt, 15 % unbefestigt» und warnt nur dort, wo es für diese Art zählt (zum Beispiel Treppen: «Vielleicht musst du das Velo tragen»). Antwortet brouter.de nicht, fragt die App einmal Valhalla und dann OSRM; eine Zeile sagt, dass eine Reserve geplant hat. |
| Sensoren und Fahrdaten | `#/live` | Unterstützte Bluetooth-Sensoren anbinden und Fahrwerte anzeigen. Die Verfügbarkeit hängt vom Browser und Gerät ab. |
| Strecke aufzeichnen | `#/ride` | † Die eigene Strecke aufzeichnen. Laut Handbuch geht das nur bei eingeschaltetem Bildschirm beziehungsweise geöffneter App. |
| Gruppenfahrt | `#/live` | Mitfahrende über einen Browserlink einladen und freigegebene Positionen auf einer Karte sehen; Treffpunkte, Bereitschaft und gemeinsame Ausrüstung koordinieren. |
| Event-Gruppenfahrt | `#/live` | Gruppenorganisation mit Checkpoints, Nachtpause, Hilfesignal, Kontakten und Kostenaufteilung nutzen. |
| Unterwegs-Erinnerungen | `#/ride` | Essen erinnern lassen, zeitliche Tagesblöcke ansehen und Dinge für später notieren. |
| Ortsbezogene Notizen | `#/notes` | Eine Erinnerung an einen bestimmten Kilometerpunkt der Route knüpfen. |
| Heimreise und ÖV | `#/ride` | Haltestellen und nächste Abfahrten ansehen; aus der Unterwegs-Ansicht die Heimreise vorbereiten. |
| Orte und Erlebnisse festhalten | `#/ride` | Standort mit Foto oder Notiz speichern; den Parkplatz des Velos mit Foto, Schloss und Kartenposition merken. |
| Ankunft und Übernachtung mitteilen | `#/me/ruhig/teilen` | Vorbereitete Nachrichten für «angekommen», «gute Nacht» oder «fahre weiter» über die Teilen-Funktion des Handys versenden. |
| Routen für andere Geräte | `#/ride` | GPX für andere Anwendungen beziehungsweise Geräte als FIT oder KML aufbereiten. |

### 5. Rennen, Ultra und Bikepacking

| Funktion | Link | Was man damit tun kann |
|---|---|---|
| Rennen planen | `#/race` | Ein Rennen mit Tagesetappen, Schlafstrategie, Stopps und eigenen Annahmen durchspielen; Rennmodus und Bericht nutzen. |
| Detaillierter Rennen-Check | `#/racecheck` | Packliste, Zielsetup pro Tasche, Basisliste und Schlafvarianten vorbereiten und eine Nacht gedanklich durchspielen. Der Check ist auch die Grundlage der Schrittart «Rennplanung» für «Weg zum Ziel» (`src/lib/weg/types/rennplanung.js`): vier Schritte (Schlaf entscheiden, Basisliste prüfen, Zielsetup packen, Tag vorher durchgehen), die auf den Check zeigen und sich abhaken, sobald das Blatt ausgefüllt ist; sichtbar mit der Seite «Weg zum Ziel». |
| Muster-Rennen | `#/race?sample` | Ein erfundenes 1000-km-Rennen als Lern- und Testbeispiel öffnen. |
| Schlafstrategie | `#/race` | Schlafplätze voraus suchen, eigene Listen importieren und geplante Nächte mit Wetter vergleichen. |
| Hotels für heute Nacht | `#/race` | Hotels bei der erwarteten Abendposition mit Kontaktinformationen prüfen; Anfragen und Antworten festhalten. |
| Powernap | `#/race` | Kurze Schlafpausen mit Timer vorbereiten. Der App-Alarm benötigt laut Handbuch eine geöffnete App. |

### 6. Velos, Pflege und Werkstatt

| Funktion | Link | Was man damit tun kann |
|---|---|---|
| Veloverwaltung | `#/bikes` | Mehrere Velos mit Stammdaten, Fotos und Kilometerstand verwalten; Standardvelo und Reihenfolge festlegen. Die Zahlen führen weiter: Kilometer zur Analyse (Teil «Velos»), Kosten zur Jahresbilanz des Velos, «n fällig» zur Pflege, «Nächste Tour» zur Packliste dieser Tour. |
| Teile und Velovergleich | `#/bikes?tab=compare` | Komponenten mit Eigenschaften, Gewicht und Preis erfassen und Velos nebeneinander vergleichen. |
| Mein Setup | `#/bikes?tab=rig` | Setupfotos, Taschenvarianten und Gesamtgewicht verwalten; Vorbilder und Änderungen dokumentieren. |
| Taschenplan | `#/bikes?tab=rig&view=bags` | Taschenpositionen und Gewichtsverteilung vorne, mittig und hinten prüfen. |
| Setup-Logbuch | `#/bikes?tab=rig&view=log` | Umbauen und Einstellungen mit Kilometerstand und anschliessenden Erfahrungen festhalten. |
| Velopflege | `#/bikes?tab=care` | Wartungen nach Kilometern, Fahrstunden oder Zeit planen und erledigte Arbeiten dokumentieren. Im November, Dezember und Februar schlägt die Karte «Passt jetzt» (auch auf Heute) Einwintern, Jahresrückblick und Frühling vor. |
| Veloinspektion | `#/bikes?tab=care&view=inspect` | Schnellcheck, Monatscheck oder vollständige Inspektion Punkt für Punkt mit Werkzeugen und Arbeitsschritten durchführen. |
| Verschleiss | `#/bikes?tab=care&view=wear` | † Laufleistung, Restlaufzeit und frühere Lebensdauer von Ketten, Reifen und Belägen verfolgen; Kosten kommender Wechsel abschätzen. |
| Werte erfassen | `#/bikes?tab=compare&view=enter` | † Messwerte wie Reifendruck und Kettenmessungen dokumentieren. |
| Werkstattbesuche und Belege | `#/bikes?tab=shop` | Reparaturen, Kosten und Belegfotos sammeln; Werkstattauftrag mit Kostenlimit und Rückfragewunsch vorbereiten. |
| Werkstatt-Spick | `#/bikes?tab=care&view=spick` | Drehmomente und schrittweise Pannenhilfe nachschlagen; eigene Werte ergänzen. |
| Werkstatt-Runden | `#/bikes?tab=care&view=rounds` | Wiederkehrende Arbeiten zu einer Routine mit Werkzeugen und Material zusammenstellen. |
| Ersatzteilvorrat | `#/bikes?tab=care&view=stock` | Ersatzteile zählen, bei einem Wechsel abbuchen und fehlende Teile zum Einkauf vormerken. |
| Verschleissfotos | `#/bikes?tab=care&view=photos` | Zustand mit Datum und Kilometerstand fotografieren und vorher/nachher vergleichen. |
| Saisoncheck | `#/bikes?tab=care&view=season` | Velo einwintern oder für den Frühling vorbereiten. |
| Jahresbilanz pro Velo | `#/bikes?tab=care&view=year` | Kilometer, Fahrten, Service, Teilewechsel und Kosten eines Jahres ansehen. |
| Velo verkaufen | `#/bikes?tab=care&view=sell` | Aus den vorhandenen Daten einen Inseratstext und eine Übergabeliste vorbereiten. |
| Velo transportieren | `#/bikes?tab=care&view=bikepack` | Verpackungscheckliste für Zug oder Flug mit eigenen Punkten und Fotos nutzen. |
| Velo-FAQ | `#/bikes?tab=care&view=faq` | Fragen zu Pflege, Geräuschen, Pannen und Verschleiss nachschlagen. |
| Strava verbinden | `#/bikes?tab=care&view=strava` | Strava-Velos zuordnen und Fahrten beziehungsweise Kilometer für die Velopflege übernehmen. |
| Fahrten importieren | `#/bikes?tab=care&view=import` | Fahrtdaten aus Exportdateien einlesen und dem passenden Velo zuweisen. |
| Velo-Mappe | `#/bikes?bike=<id>&sheet=all` | † Zusätzlich im Velobereich: die Mappe mit allem zu einem Velo auf einen Blick. |
| Einfahrplan | `#/bikes?bike=<id>&sheet=breakin` | † Zusätzlich im Velobereich: Plan für die ersten Fahrten mit einem neuen Velo. |
| Reparaturset | `#/bikes?bike=<id>&sheet=kit` | † Zusätzlich im Velobereich: passendes Reparaturset zum Velo. |

### 7. Aktiv, Training und Wohlbefinden

| Funktion | Link | Was man damit tun kann |
|---|---|---|
| Aktiv | `#/flow` | Bewegung, Achtsamkeit und Erholung abhaken, Zeiten erfassen und den eigenen Rhythmus verfolgen; ganz oben das Feld «Alles hier» mit zehn Kacheln zu allen Funktionen von Aktiv; nach dem Abhaken führt «Als Nächstes» zu Verlauf und Meilensteinen. Nach drei harten Tagen in Folge (hart = für dich im oberen Viertel der letzten sechs Wochen, aus Strava) steht über «Heute abhaken» eine ruhige Zeile «Heute locker?» (`src/lib/flow/RuhetagHint.svelte`); nur ein Hinweis, «Heute nicht» blendet sie für den Tag aus, Ich › Aussehen › Vorschläge › Leistungstipps schaltet sie ab. |
| Meine Wochenziele | `#/flow` | Auf Aktiv, neben «Diese Woche»: ein paar eigene Ziele für die Kalenderwoche Montag bis Sonntag (zum Beispiel 2× Meditation, 150 km Velo), je mit einem Balken. Mit einem Tipp hinzufügen oder eigenes wählen, Zahl ändern, mit Pfeilen und Ziehen ordnen, löschen mit Rückgängig (`src/lib/flow/WeekGoals.svelte`, Regeln `weekgoals.js`). Die Ringe zählen weiter die letzten 7 Tage gegen die Ziele der Sportarten. |
| Meine Aktivitäten | `#/flow/sports` | Eigene Aktivitäten (Sportarten, Yoga, Meditation …) mit Zielen, Messwerten, Ausrüstung, Verlauf, Timer und Zusatzbausteinen anlegen; oben stehen die zuletzt genutzten. Auch die Sportarten der Touren (Fahrrad, Gravel, Cross Country, Downhill, Bikepacking, Skitouren, Wandern) lassen sich über «⋯» umbenennen, ausblenden und löschen; der neue Name gilt überall. |
| Training | `#/flow/training` | Einheiten mit Dauer und Zone planen; Aktivitäten, Pulszonen und subjektive Anstrengung auswerten. Die Einheiten-Bibliothek startet mit sechs Vorlagen (Lockere Fahrt, Intervalle, Langer Tag, Lauf, Wanderung, Kraft), lässt sich in eigene Gruppen ordnen, umbenennen und löschen (mit Rückgängig), und die meistgenutzten stehen oben; «Einheit behalten» speichert auch eine bestehende. Dazu vier ruhige Angebote, nie ein Alarm: «Heute passt eine leichtere» (bei tiefer Bereitschaft kürzere Einheit mit «Leichter» oder «Behalten»), «Verpasst? Verschieben» (eine verpasste Einheit dieser Woche auf einen anderen Tag oder «Loslassen»), «Diese Woche ist deutlich mehr als deine letzten» (mehr als 30 % über dem Schnitt der drei Wochen davor) und «Eine leichtere Woche würde passen» (Entlastungswoche, «Woche kürzen» kürzt nur, was noch kommt). |
| Leistungsanalysen | `#/flow/training?view=list` | Einzelne Aktivitäten mit Leistung, Herzfrequenz, Runden, Splits und weiteren verfügbaren Messwerten öffnen. Die sechs Diagramme einer Fahrt (Leistungskurve, Trittfrequenz, Leistungsbereiche, Ähnliche Fahrten, Ausdauer-Check, Hausrunde) lassen sich antippen und zeigen genaue Zahlen. |
| Schlag deinen Geist | `#/flow/training?view=list` | Auf einer Velofahrt mit Puls die Analyse-Karte «Schlag deinen Geist»: diese Fahrt gegen eine frühere eigene Fahrt, mit Angabe, wie ähnlich die beiden sind. «Ausprobieren» in «Was ist neu» führt dorthin. |
| Trainingspläne | `#/flow/plans` | Beispielpläne für Ultracycling an Wochenstunden und Zieldatum anpassen und in die Woche übernehmen. |
| Form und Erholung | `#/flow/form` | Belastung, Form und Bereitschaft anhand vorhandener Aktivitäten, Körperdaten und Tageschecks betrachten. |
| Wochenrückblick | `#/flow/review` | Sportumfang, Körperdaten, Zonen, Velokilometer und Höhenpunkte vergleichen; eigene Notiz und nächstes Ziel ergänzen. |
| Meilensteine | `#/flow/milestones` | Fortschritte, Herausforderungen, Sterne und erreichte Bestwerte sammeln. |
| Gipfelbuch | `#/flow/gipfelbuch` | Erreichte Pässe, Gipfel und weitere Sportorte festhalten. Ein Reiter in Auswerten (neben Neuland). Ein Besuch an einem Ort mit Koordinaten zählt auch in Neuland und in der «Fundliste». |
| Meditation | `#/flow/act/meditation` | Sitzungen mit Timer, Klängen und Vorlagen starten; auch Yogastunden und Studiolinks organisieren. |
| Meditationsprotokoll | `#/flow/act/meditation/log` | Sitzungen, Regelmässigkeit, Tageszeiten und Notizen ansehen. |
| Tennis | `#/flow/sport/act%3Atennis` | Spiele und erteilte Lektionen dokumentieren, geplante Termine und Platzbuchungslinks verwalten. |
| Wi gaht's? am Morgen | `#/check/morning` | † Den eigenen Zustand am Morgen kurz erfassen (Schlaf, Stimmung, Sorgen). Die Fragen oben sind die der Morgenrunde aus «Deine Fragen», dieselben wie im Fenster; eine Antwort gilt für beide. |
| Fragen aus deinen Daten | `#/me/abfragen` | Fällt ein Wert auf (Ruhepuls, kurze Nacht, gedrückte Stimmung, langer Tag, Trainingspause, Tennis, Wetter, ein überfälliges To-Do, eine Vermutung aus «Was zusammenpasst») oder kommt die Zufallsfrage, stellt der Check eine offene Frage und sagt warum; jede Regel mit Schalter, Schwelle und eigenen Worten, nie zwei aus einer Gruppe am Tag; eigene Regeln («Wenn Wert über/unter Zahl, frage …», bis zu zwei Bedingungen) erstellen, ändern, umbenennen, sortieren, löschen (auch die der App, mit Rückgängig). |
| Erkenntnisse | `#/me/insights` | Zusammenhänge zwischen Schlaf, Stimmung, Bewegung, Meditation, Wetter und weiteren eigenen Daten erkunden. |
| Was mir gut tut | `#/me/wohl` | Muster guter Tage sammeln, gewünschte Lebensbereiche vergleichen und kleine Experimente durchführen. |
| Routinen | `#/routine` | Persönliche Gewohnheiten mit kurzen täglichen Checklisten verfolgen; Teil von Aktiv › Erholung, Kachel auf Heute. |
| Timer | `#/timer` | Stoppuhr, Countdown, Intervalle und Pomodoro mit Zweck und Protokoll verwenden. |

### 8. Auswerten, Erinnerungen und neue Abenteuer

| Funktion | Link | Was man damit tun kann |
|---|---|---|
| Auswerten | `#/auswerten` | Einstieg in Aktivitäts-, Körper- und Verlaufsanalysen; oben ein Schalter «Zeitraum» (Woche, Monat, Jahr, Alles, eigener Zeitraum), dem die Liste der Sportarten und der Mittelwert bei «Wi gaht's?» folgen. «Im Fokus» zeigt nur Sportarten der letzten 7 Tage, die Kacheln der Übersicht nennen ihren Tag oder Zeitraum. Rechts stehen keine Link-Karten mehr: alle Seiten stehen in der Leiste oben. Die Erklärung unter «Deine Fragen» ist eine eingeklappte Zeile. |
| Übergreifende Analyse | `#/auswerten/analyse` | Daten verschiedener Bereiche gemeinsam betrachten und vergleichen. Die Karte «Daten aus / Zeitraum» über den Reitern zeigt nur, was der Reiter braucht (Überblick: Quellen und Zeitraum; Rekorde und Velos: Zeitraum; Alle Werte: alles; Diagramm und Vergleiche haben eigene Zeiträume und zeigen eine Zeile statt der Karte); am Handy ist sie eine Zeile wie «30 Tage · 5 Quellen», die sich mit einem Tipp öffnet. |
| Meine Datenquellen | `#/auswerten/quellen` | Sehen, woher die Zahlen kommen: Fitbit, Strava, Tagescheck «Wi gaht's?», Touren mit Rückblicken und Velos mit je Menge, letztem Stand und Lücken (Tage ohne Wert, lange keine neuen Daten); Wetter (nur Tageswerte am Wohnort) und Kosten (noch nicht erfasst) nennen ihre Grenze. Nur Anzeige; Verbinden bleibt unter Ich › Verbindungen, von dort führt ein Link hierher. |
| Tour-Rückblick | `#/debrief` | Erfahrungen bewerten, ungenutztes und fehlendes Material markieren, Pannen dokumentieren und Verbrauch buchen. Die Antworten bei «Wie war es?» (Wetter, Essen und Trinken, Taschen) lassen sich in Ich › Listen und Typen umbenennen. Ganz oben steht «Rückblick in 30 Sekunden»: drei Fragen mit Gesichtern (Fahrt, Gepäck, Fehlendes) und «Kurzfassung speichern» für müde Abende; die lange Version bleibt darunter. |
| Was hat es gut gemacht? | `#/debrief/freude` | Im Rückblick vier freiwillige Skalen von 1 bis 5 (Fahrspass, Natur, Flow, Gesellschaft); die Seite zeigt Mittelwerte und jede Tour, ab drei Touren sagt der Rückblick, was im Schnitt am höchsten war. |
| Fahrtechnik-Tagebuch | `#/debrief/technik` | Im Rückblick Fahrtechniken abhaken (Spitzkehren, Bremsdosierung …) und sagen, wie es ging; die Seite zeigt Anzahl und letztes Mal und nimmt Wunsch und Übungsort auf. Techniken als Liste in Ich › Listen und Typen. |
| Fahrt hochladen | `#/debrief/ride` | Fahrdateien auswerten, Planung und Realität vergleichen sowie Erkenntnisse festhalten. |
| Vergangene Touren | `#/pack/past` | Frühere Touren mit Distanz, Höhenmetern, Zeit und Erfahrungen durchsuchen; die Höhenmeter werden mit Schweizer Bergen verglichen. |
| Logbuch | `#/debrief/logbook` | Auch ältere Touren nachtragen und nach Jahr oder Art filtern. |
| Tourenpass | `#/debrief/tourenpass` | Nach dem Rückblick einen Stempel auf den Tourenpass setzen; Stempel selbst hinzufügen, ändern, entfernen und ablehnen. |
| Gesammelte Erkenntnisse | `#/debrief/learnings` | Erfahrungen thematisch sammeln und für spätere Touren wiederfinden. |
| Eigenes Tempo | `#/debrief/pace` | Aus gefahrenen Touren eine persönliche Fahrzeitschätzung ableiten; das Tempo über die Monate lässt sich antippen. |
| Pässe sammeln | `#/debrief/paesse` | Alpenpässe, über die eine gespeicherte Tour führt, als Pass-Schild sammeln; vom Standort der Route erkannt, jederzeit änderbar. Eine Regel wie in Neuland: bis 600 m von der Passhöhe sicher, bis 1,2 km «bitte bestätigen». |
| Sammel-Wand | `#/debrief/sammlung` | Stempel, Pässe, Gipfelbuch-Orte, Neuland und Sterne auf einer Seite zum Anschauen: oben die Zahlen, «Zuletzt dazugekommen» und je ein Regal mit «Alle» zur ganzen Liste. Ohne Ziel und ohne Zahl für Fehlendes; geändert wird dort, wo die Dinge zu Hause sind. Touren › Rückblick führt hin. |
| Reise-Spur und Reisebuch | `#/debrief` | † Tourtage mit Route, Orten, Fotos und Notizen betrachten; Familienlink oder Reisebuch daraus erstellen. |
| Gelernt | `#/gelernt` | Monatskarte und Jahresbrief mit Erkenntnissen und Entwicklungen ansehen. Steht im Ort Auswerten; Touren › Rückblick führt hin. |
| Jahr als Bildgeschichte | `#/jahr` | Touren und Erinnerungen eines Jahres als Bildgeschichte ansehen. Steht im Ort Auswerten; Touren › Rückblick führt hin. |
| Heatmap | `#/heatmap` | Gefahrene Strecken auf einer Karte betrachten und nach Jahr, Sport, Velo oder Tour filtern. Steht im Ort Auswerten; Touren › Rückblick führt hin. |
| Neuland | `#/neuland` | Neu besuchte Gemeinden, Länder, Pässe, Seen und weitere Orte entdecken; neue Kilometer und Sammlungen verfolgen. Zu jedem gefundenen Ort zeigt «Warum zählt das?» die Linie, den Abstand und eine kleine Karte. «Wege hierher» sagt, von welcher Seite du kamst und mit welcher Sportart. Steht im Ort Auswerten; Touren › Rückblick führt hin. «Aussichtstürme», «Hängebrücken» und «Wasserfälle» sind drei Sammlungen aus OpenStreetMap: die App lädt die Orte einmal pro Woche von selbst (oder auf Tipp «Neu laden»), speichert sie nur auf dem Gerät und hakt sie auf Fahrten ab. Oben steht die «Fundliste»: alles, was du zum ersten Mal erreicht hast (dieses Jahr oder alle Jahre) in einer Liste, aus Neuland, dem Gipfelbuch und deinen eigenen Einträgen; dieselbe Liste ist das «Neuland des Jahres» im Jahresheft und unter Ich › Was mir gut tut. Ein Ort im Gipfelbuch mit Koordinaten hakt Neuland mit ab und steht nur einmal in der Liste. |
| Traumtouren | `#/trips/dreams` | Wunschabenteuer nach Saison sammeln, auf der Karte vergleichen und in konkrete Touren verwandeln; passende Wetterfenster und neue Ziele in der Nähe finden. «Ein Abenteuer im Monat» schlägt einmal im Monat ein kleines Abenteuer vor (Feierabend-Biwak, Zug hin und Velo heim, Runde durch Neuland oder eine eigene Idee, die Arten wechseln sich ab); eine ruhige Zeile auf Heute nennt es, «Diesen Monat nicht» schliesst sie, Arten lassen sich ausblenden, ergänzen und löschen. |
| Tourenvorschläge | `#/trips/vorschlaege` | Mountainbike-Touren aus dem offiziellen SchweizMobil-Netz (Pilot: fünf Touren in Zürich und Graubünden) mit Filtern für Region, Schwierigkeit und Zeit, «Warum dieser Vorschlag?», Höhenprofil mit Untergrund, Merken als Traum, GPX und «Nicht für mich». |
| Weg zum Ziel | `#/trips/weg` | Ein grosses Ziel mit Starttag (zum Beispiel ein Rennen im Mai) nennen; die App zählt rückwärts und legt die Schritte auf einer Linie mit Punkten aus (eine Marke «Heute» zeigt, wo man steht; Tag verschieben, Umbenennen und Löschen liegen hinter dem «…» eines Schritts). Jeder Schritt lässt sich abhaken, auf einen anderen Tag verschieben, umbenennen und löschen (mit Rückgängig); eigene Schritte sind möglich. Die Schrittart «Organisation» (`src/lib/weg/types/orga.js`) schlägt Anmeldung, Urlaub, Unterkunft, Zug und Notfallperson vor; ein Streifen «Organisation: 3 von 5 geregelt» mit der nächsten Frist steht über der Zeitlinie. Die Schrittart «Probefahrten» (`src/lib/weg/types/proben.js`) schlägt Fahrten über 50, 100 und 200 km vor; drei Kreise zeigen den Stand, eine Strava-Fahrt von dieser Länge hakt von selbst ab. Die Schrittart «Erholung» (`src/lib/weg/types/erholung.js`) legt vier Schritte in die letzte Woche vor dem Start (früh ins Bett, Dehnen, Vorräte, Velo-Check) und führt zu Aktiv › Erholung und den Velos. Eine Woche vor dem Start zeigt die Karte «Wetterfenster zum Start» die Regenchance der Tage rund um den Starttag, aus der Vorhersage, die die Tour gespeichert hat (`src/lib/weg/wetter.js`, Schrittart `wetter.js`). Weitere Schrittarten in `src/lib/weg/types/`: «Velo bereit» (Velo prüfen, Pflege, Kette und Reifen, Werkzeug, Kurzcheck; hakt Inspektion und Pflege von selbst), «Trainingsfortschritt» (Checks 8, 4 und 2 Wochen vor dem Start gegen Wochenplan, Wochenziel und längste Fahrt), «Verpflegung testen» (Plan, Test auf einer Fahrt von mindestens 3 Stunden, festhalten), «Nachtplan» (Schlafplätze für jede Nacht, bei freien Zielen eine eigene Liste von Nächten), «Packen testen» (eine Nacht draussen, packen und wägen, Generalprobe) und «GPS-Tracker» (Abo klären, laden, Testfahrt, Tracking-Link für die Familie, Akku; alles von Hand abzuhaken, der Zugang wird nie gespeichert). Die Ablage liegt in den Einstellungen und damit im Backup. Jede Schrittart ist eine eigene Datei in `src/lib/weg/types/`, die sich von selbst anmeldet (neue Art = neue Datei, `docs/technik-handbuch.md`). |
| Inspiration | `#/inspiration` | Links zu Routen, Videos, Ausrüstung und Rennen sammeln und daraus Ideen oder Packregeln ableiten. |

### 9. Wetter, Berg und Skitouren

| Funktion | Link | Was man damit tun kann |
|---|---|---|
| Wetter | `#/wetter` | Ganz oben im Teil «Jetzt» steht die Karte «Für deine Tour»: die nächste geplante Tour mit ihrem Tag, dem Wetter dieses Tages (Regen ab …, Temperatur, Wind), dem Stand des Regenzeugs auf der Packliste («2 von 3 gepackt») und den Wegen Packliste, «Was ziehe ich an?» und «Beste Zeit für eine Fahrt»; ohne Wetterdienst steht ein Satz dazu und die Wege bleiben. Orte, Tage und Startzeiten vergleichen; Regen, Wind, Kälte, Hitze, Schneefallgrenze und Warnungen für die Planung berücksichtigen; Regenstreifen für 24 Stunden sowie Landi-Regenradar und SRF-Webcams in Fenstern. Die Schneefallgrenze (m ü. M.) steht auch als ruhige Zeile auf Heute und lässt sich dort ausschalten. Die Nebelgrenze (Obergrenze des Hochnebels, m ü. M., geschätzt) steht daneben mit «darüber Sonne», deinem Ort im oder über dem Nebel, Auflösungszeit, Temperatur oben/unten und Sichtweite; auch sie hat eine ruhige Zeile auf Heute. Bei Nebel mit Sonne darüber schlägt Heute dazu eine deiner gespeicherten Fahrten vor, die über den Nebel führt (spätester Start, ab welchem km Sonne, Webcam-Knopf; «Heute nicht», ausschaltbar unter «Nebelgrenze einstellen»); mit Fitbit-Werten steht dort leise der Stand der aktiven Zonenminuten der Woche, und nach einer deutlich kürzeren Nacht daneben die kürzeste Fahrt über dem Nebel (ohne Rat; ausschaltbar mit «Leistungstipps», `src/lib/wetter/sonnenrest.js`). Die Nachttemperatur (Tiefstwert 18 bis 8 Uhr) zeigt «Heute früh» und «Morgen früh» mit Vergleich zu gestern und zur Vorwoche, 14 Säulen, Prognose-Trend, «Wieder 5 Plus in X Tagen» und Frost-Hinweis; sie hat eine ruhige Zeile auf Heute, die sich ausschalten lässt. Neben der Zürisee-Temperatur zeigt «Temperaturen nach Höhe» die Lufttemperatur auf 1000, 2000 und 3000 m (jetzt, 6, 12, 18 Uhr und die nächsten zwei Tage), über wählbaren Orten, eigenen Orten oder auf Schweizer Gipfeln; für den Wohnort steht sie auch als ruhige Zeile auf Heute (ausschaltbar). |
| Hinweise und News | `#/me/hinweise` | Regionale Hinweise, winterliche Lawineninformationen und eigene Nachrichtenquellen bündeln. |
| Skitouren | `#/ski` | Nächste Tour mit Wetter, Nullgradgrenze und Neuschnee vorbereiten. |
| Skitour planen | `#/ski/plan` | Bulletinangaben, Bedingungen, Zeitplan und Umkehrzeit dokumentieren. Die Lufttemperatur auf 500 bis 4000 m am Tag der Tour (über dem Ort der Tour) mit Start- und Gipfelhöhe, «Temperatur am Start» zum Übernehmen und Hinweisen (Nullgradgrenze, kalter oder warmer Gipfel). |
| Rucksack-Check | `#/ski/check` | Skitourenausrüstung in Gruppen abhaken. |
| Start-Check | `#/ski/start` | Die letzten Kontrollen am Ausgangspunkt durchführen. |
| Standort im Notfall | `#/mountain/sos` | Eigene Koordinaten gross anzeigen und Notrufaktionen aufrufen. |
| Notfallkarte | `#/mountain/qr` | Persönliche Notfallinformationen als QR-Karte vorbereiten. |
| Schwierigkeitsskalen | `#/mountain/scales` | Schweizer Wegweiser und SAC-Skalen nachschlagen. |

### 10. Was man ausserhalb des Velofahrens tun kann

| Funktion | Link | Was man damit tun kann |
|---|---|---|
| Woche planen | `#/week` | Sport, Termine, Aufgaben, Ferien und Service in einer Woche zusammenbringen. Das beste freie, trockene Fenster der gezeigten Woche steht oben und ist an seinem Tag markiert («Hier passt eine 3-Stunden-Runde», sonst 2 Stunden); «Fahrt einplanen» setzt es als Termin in die Woche. Es zählen dein Google-Kalender (wenn an) und deine eigenen Termine. Am Sonntag (sonst mit «Wochen-Abschluss zeigen») drei Zeilen: erledigt, noch offen, rutscht in die nächste Woche; «Auf Montag verschieben» setzt die angehakten eigenen Aufgaben auf den nächsten Montag (mit Rückgängig). |
| Merken und Listen | `#/calendar` | Aufgaben und eigene Listen verwalten; Abhängigkeiten und wartende Aufgaben festhalten. Eine Zeile oben nimmt «Kette ölen morgen 18 Uhr, jeden Sonntag» und erkennt Datum, Uhrzeit und Wiederholung; Aufgaben haben Schritte und gehören zu einer Tour, einem Velo oder einer Notiz (dort stehen sie auch); wischen (erledigt, morgen), sortieren und eine Suche über Aufgaben und Notizen. |
| Notizen | `#/notes` | Texte, Checklisten, Fotos, Sprachnotizen, Skizzen, Dateien und Links sammeln; formatieren, verknüpfen, erinnern und frühere Fassungen wiederherstellen. Am grossen Bildschirm öffnet sich eine Notiz neben der Liste; die Suche findet auch Aufgaben. |
| Eingang | `#/inbox` | Unsortierte Informationen sammeln und später als Notiz, Beleg, Aufgabe oder anderen Eintrag ablegen. |
| Vorgänge | `#/inbox/vorgaenge` | Zusammengehörige Mails, Fotos, Rechnungen und Notizen zu einer Sache bündeln. |
| Tagebuch | `#/tagebuch` | Persönliche Einträge mit Fotos, Ort, Wetter und Schlagwörtern schreiben oder sprechen. |
| Fotoalbum | `#/me/album` | Fotos aus verschiedenen Appbereichen nach Monat oder Ort betrachten. |
| Mein Kompass | `#/me/compass` | Persönliche Ziele in Schritte und Termine übersetzen und ihren Verlauf reflektieren. |
| Einkaufsliste | `#/me/alltag/einkauf` | Alltagskäufe, Rezeptzutaten und Tourverpflegung zusammenführen. |
| Kochen | `#/me/alltag/kochen` | Einfache Rezepte mit Portionen und Schritten nutzen; eigene Rezepte ergänzen und Zutaten zum Einkauf übernehmen. |
| Verträge und Abos | `#/me/alltag/abos` | Laufende Kosten, Kündigungsfristen, Erinnerungen und Nutzung festhalten. |
| Menschen | `#/me/alltag/menschen` | Merken, wen man wieder einmal sehen möchte, und gemeinsame Ideen sammeln. |
| Geburtstage und Erinnerungen | `#/me/reminders` | Geburtstage, Geschenke, Pflanzenpflege und andere wiederkehrende Anliegen organisieren. |
| Pflanzenpass | `#/calendar/pflanzen` | Pflanzen mit Standort, Sonnen- und Windbeobachtungen, Fotos und Veränderungen dokumentieren. |
| Mit Freunden | `#/me/freunde` | Beiträge zu Vorhaben sammeln, Material zum Verleihen anbieten und Vorlagen teilen. |
| Tennis (Angebote und Kunden) | `#/me/tennis` | Freie Zeiten anbieten, Link teilen, Anfragen beantworten und die Kundenliste führen, in einem Ort mit drei Tabs. Zu einer Stunde gehören Rechnungsentwurf (mehrere Stunden auf einer Sammelrechnung, TWINT, Bank-QR oder Bargeld), «Hat stattgefunden», «Spät abgesagt» (halber Preis) oder «Nicht erschienen» und bei einer Absage bis zu drei freie Ersatzzeiten in der vorbereiteten Nachricht. Beim Kunden: eigener Preis, Abo (fester Monatspreis), Stundenkarte, Gutscheine (Betrag oder Stunden, mit Code, im Rechnungsentwurf abgezogen) und ein fester Termin (Wochentag und Uhrzeit; ist die Zeit in den nächsten 7 Tagen frei, schlägt Heute sie vor). Eine volle Zeit hat eine Warteliste (wird ein Platz frei, steht auf Heute «Platz frei … wartet»), bei Gruppenstunden steht der Preis pro Person und eine E-Mail an alle Teilnehmenden (Bcc). Nachrichten bereitet die App vor, gesendet wird von Hand. |
| Tennis › Flyer | `#/me/tennis/flyer` | Flyer für Stunden aus einem Angebot: Teile ein- und ausschalten und verschieben, Texte überschreiben, Stufen, eigenes Foto (bleibt auf dem Gerät), 16:9, A4 und Quadrat, Deutsch und Englisch, QR-Code zur Anmeldeseite, speichern, teilen oder vorbereitete E-Mail mit Kunden in Bcc, Vorlagen. |
| Mini-Tools für Gruppen | `#/me/mini` | Terminfindung, Umfrage, Anmeldeliste mit Warteliste, spontane Einladung und Essensabfrage per Browserlink erstellen. |
| Fair auslosen | `#/me/mini/los` | Aufgaben oder Rollen innerhalb einer Gruppe verteilen. |
| Gemeinsam ankommen | `#/me/mini/abfahrt` | Abfahrtszeiten von unterschiedlichen Startorten für einen gemeinsamen Treffpunkt berechnen. |
| Ruhig und persönlich | `#/me/ruhig` | App vereinfachen, Erinnerungen begrenzen, Briefe ans zukünftige Ich schreiben und persönliche Experimente (auch mit Fahrt-Werten wie Kadenz oder gefühlter Anstrengung) oder gute Entscheidungen sammeln. |

### 11. Dateien, Werkzeuge, Verbindungen und Datensicherung

| Funktion | Link | Was man damit tun kann |
|---|---|---|
| Dokumente | `#/me/docs` | † Dokumente (Verträge, Belege, Ausweise) in der App aufbewahren. |
| Dokument scannen | `#/me/docs` | Papierdokumente fotografieren und als Dokument aufbereiten. |
| Externe Werkzeuge und Links | `#/me/links` | Eigene Links und passende externe Anwendungen organisieren. |
| KI-Projekte | `#/me/ki-projekte` | Links zu eigenen KI-Projekten, Chats und Threads sammeln. |
| KI-Helfer | `#/helper` | Optionale KI-Unterstützung konfigurieren; Vorschläge prüfen und gezielt übernehmen. |
| Sprachsuche | `#/me/suche` | Sprachbefehle und die Beantwortung von Fragen einstellen; ein Satz wie «Erstelle eine To-do-Liste: A, B, C» legt eine Liste mit Punkten in Merken und Listen an (mit Rückgängig). Was die Regeln nicht kennen, kann Gemini (gratis, braucht den Helfer-Code) in Aktionen übersetzen: erst «Ich würde das tun», geschrieben wird nach «OK». |
| Verbindungen | `#/me/connections` | Strava, Fitbit, Google, Trello und die Spielerplus-Kalender der Teams (Link einfügen; Termine nur lesen in Woche, Heute und auf der Sportseite, mit Knopf zur Anmeldung in Spielerplus) verwalten, bei jeder den Stand sehen (läuft seit, Fehler mit Grund, zuletzt erfolgreich) und welche Funktionen davon abhängen. |
| Termine und Aufgaben | `#/me/agenda` | Die angebotene Google-Anbindung für Termine und Aufgaben verwenden. |
| Mail | `#/me/mail` | Die angebotene Gmail-Anbindung nutzen und Nachrichten weiter organisieren. |
| Daten und Backup | `#/me/data` | Daten exportieren und importieren, Sicherungen einrichten, optional verschlüsseln und Geräteabgleich konfigurieren. |
| Aufs Handy | `#/me/phone` | Nutzung auf einem weiteren Gerät beziehungsweise auf dem Handy vorbereiten. |
| Kleine Apps | `#/me/apps` | Einzelne Appbereiche als eigene Verknüpfung auf den Startbildschirm legen. |
| Push-Erinnerungen | `#/me/push` | Hinweise zu Touren, Wetter, Licht, Verschleiss und Fristen einstellen. Von Oktober bis Februar meldet «Nebelgrenze am Morgen» um 07:00, wie hoch der Hochnebel reicht und ab wo die Sonne scheint (oder «kein Nebel»), und nennt eine eigene Fahrt über dem Nebel. Wer «Nachttemperatur am Abend» einschaltet, bekommt jeden Abend um 19:00, wie tief es heute Nacht geht (mit einem Wort zu Frost oder zur Veränderung gegenüber letzter Nacht). |
| Eigene Werte | `#/me/werte` | Grenzwerte, Standardannahmen und Erinnerungsabstände anpassen. |
| Listen und Typen | `#/me/lists` | Kategorien und andere Auswahllisten selbst ergänzen, umbenennen und ordnen (auch die Velo-Sportarten der Touren: Name und Ausblenden); auch die Sprüche, die das «PG»-Logo nach fünf Tipps sagen kann. |
| Entscheidungsregeln | `#/me/regeln` | Nachvollziehen, weshalb die App etwas vorschlägt und wo sich die zugrunde liegenden Werte ändern lassen. |
| Neuigkeiten | `#/me/news` | Änderungen und neue Funktionen nach Version nachlesen. |
| Neueste Version laden | `#/me` | In Ich zeigt die Zeile «Version … auf diesem Gerät» auch die Version, die online ist, und «Neueste laden» holt sie frisch aus dem Internet (Daten bleiben). Ist die Version online schon länger als zwei Minuten neuer, erscheint oben ein dunkler Balken mit «Jetzt laden». Klappt das Laden nicht (die Seite ist nach acht Sekunden noch da, oder nach dem Laden ist die alte Version noch da), sagt der Balken es ehrlich und nennt den Weg: App ganz schliessen und neu öffnen; «Nochmal versuchen» probiert es erneut. |

### 12. Beim Abgleich ergänzt: in Noahs Dokument nicht einzeln genannt

Diese Funktionen gibt es in der App (`features.js`), sie fehlten im Dokument. Der Abgleich hat sie hier angefügt; Texte aus `features.js`.

| Funktion | Link | Was man damit tun kann |
|---|---|---|
| Ich (Einstieg) | `#/me` | Einstieg zu Daten, Verbindungen, Einstellungen, Aufräumen von Testdaten und Tastenkürzeln. |
| Aussehen und Bedienung | `#/me/look` | Farbwelt, Grösse und Licht, Handschuh-Modus, eine Seite anpassen, Vorschläge an oder aus, eingeklappte Karten «Was du hier tun kannst» wieder aufklappen, KI auf diesem Gerät. |
| Werkzeugkasten | `#/me/tools` | Kleine Werkzeuge: Karte messen, Barcode, Packliste per Foto, Währungen, Lupe und Licht, Zeitzonen, Kompass, Redewendungen, Reisekosten, Übersetzungen der Gänge, Wasserwaage, Sitzposition, PDF, Fotos, Bildformat, Video verkleinern, QR-Code, Etiketten, Rechner, Einheiten, Werkzeugketten. |
| Freie Zeit | `#/me/frei` | Impulse (Ideen zum Antippen; eigene ergänzen, «Heute nicht» lässt eine Idee 30 Tage ruhen), Erste Nacht (nach der Nacht drei Fragen und Übernahme in die Packliste), Für nächstes Mal (Notizen mit einem Tippen auf die Packliste der nächsten Tour setzen), Mein Abend (mit Zeit ohne Handy: Timer 10 bis 45 Min. und «Hat gut getan»), Was mir wichtig ist (alle drei Monate eine Erinnerung auf Heute, «Damals und heute» vergleicht neue und frühere Einträge), Reisewünsche (ein Wunsch wird mit einem Tippen zur Traumtour, die passende Jahreszeit steht dabei), Wonach ist mir? (berücksichtigt Wetter der nächsten Stunden und freie Zeit bis zum nächsten Termin; «Noch eine» würfelt eine weitere Idee), Meine Sammlungen (eine Sammlung als Seite teilen: Link `#/share/sammlung/…`, nur Text; wer den Link öffnet, kann sie mit «In meine Sammlungen übernehmen» als eigene Sammlung behalten; drucken; mit einer Tour verknüpfen). |
| Gewicht | `#/me/weight` | Freiwillig und nur auf diesem Gerät: das eigene Gewicht mit Kurve, für Watt pro Kilo. |
| Wi gaht's? | `#/me/abfragen` | Spielerische Fragen mit eigenem Rhythmus, Morgen- und Abendrunde, Verlauf und Auswertung; Fragen und Bereiche ändern, löschen, ergänzen und sortieren. Pro Thema nur eine Frage von selbst; Zusammengelegte stehen aus in der Liste. |
| Wi gaht's? am Abend | `#/check/evening` | Am Tourtag abends bewerten, wie die Tour war (1 bis 10); landet im Rückblick und im Tagebuch. Die Fragen oben sind die der Abendrunde aus «Deine Fragen», dieselben wie im Fenster; eine Fahrt und eine Meditation von heute tragen sich selbst ein. |
| Chronik | `#/chronik` | Alles auf einer Zeitlinie, eine Seite pro Monat: Touren, Fahrten, Pflege, Meditation, Notizen; «Früher um diese Zeit». |
| Stopps in der Nähe | `#/stopps` | Wasser, Tankstellen, Essen, Läden, WC, Bargeld, Apotheke, Pumpe, Velowerkstätten, Bahnhöfe und Betten um dich oder entlang der Route. |
| Karte mit steilen Hängen | `#/mountain/map` | Swisstopo-Karte mit Hangneigung über 30°, Skitourenrouten und Wanderwegen als Ebenen. |
| Fitbit-Verbindung | `#/me/fitbit` | Schlaf, Ruhepuls, HRV, Schritte und aktive Zonenminuten von der Uhr abrufen; nur beobachten. |
| Fachleute | `#/me/pros` | Eigene Liste von Velowerkstätten und Guides; Anfrage per Mail mit Velo und Wunschtagen oder deren Buchungsseite. |
| Projektregal | `#/me/next` | Alles zur App auf einer Seite: wie viele Ideen live sind, was wartet, der Weg der Releases und die Ideentafel. |
| Karte der App | `#/me/karte` | Jeden Ort der App mit seinen Funktionen und dem Pfad dorthin finden; wird aus `features.js` gebaut. |
| App verstehen | `#/me/verstehen` | Sieben kurze Lektionen mit Übung, um die App ohne Helfer weiterzuführen. |
| Datenschutz und Bedingungen | `#/me/privacy` | Was auf dem Gerät bleibt, was der Server behält, was es kostet (nichts) und das Tageslimit. |

Nicht einzeln aufgeführt, aber vorhanden: die kleinen Teilfunktionen (Katalog und Handbuch führen sie einzeln), Schnellaktionen ohne eigene Seite (Notiz, Beleg, Kilometer, Problem melden, Backup, Sprache, Demo) und Verknüpfungen: eine Panne unterwegs wird im Rückblick festgehalten und erzeugt eine Pflegeaufgabe samt Ersatzteil für die nächste Tour; eine abgeschlossene Tour zeigt Ungenutztes und Fehlendes und verbessert die nächste Packliste und Vorlage; eine Strava-Fahrt aktualisiert Aktivität, Training, Velokilometer und Verschleiss; ein freies Zeitfenster lässt sich mit Wetter und Ziel zu einer Ausfahrt verbinden.

Bausteine, die überall gelten: Diagramme zum Antippen (Achse mit runden Stufen, genaue Zahl beim Zeigen oder mit Pfeiltasten, Tippen öffnet ein Fenster, «Als Tabelle»; auf Heute, Aktiv, Training, Rückblick und bei eigenen Messwerten); Zahlen mit Weg und «Quelle»-Zeile (`NumLink`, `SourceLine`: ein Tipp auf eine Zahl führt zu ihrer Analyse oder Quelle); der Doppeltipp-Schutz (ein zweiter Tipp auf «Speichern» innerhalb von 0,45 Sekunden tut nichts); der Knopf «Zum Inhalt springen» als erster Tab-Halt; lange Wörter brechen auf jeder Seite um; das Zurück der Handy-Taste schliesst offene Fenster auf Heute, in Material und die grosse Kontaktkarte. Der Test `tests/verlust.test.js` wird rot, wenn eine Funktion beim Vereinfachen verloren geht.

## 4. Wo die Daten liegen

Nur im Browser des Geräts (IndexedDB über Dexie, `src/lib/db.js`; die Tabellenliste der Sicherung steht in `DATA_TABLES`). Sichern per Backup-Datei oder Ordner-Sicherung (`src/lib/backup.js`), optional verschlüsselt, plus Geräteabgleich (Ich › Daten und Backup). Das Repo ist öffentlich: nichts Persönliches darin (siehe `CLAUDE.md`, «Privacy»).

## 5. Verbindungen nach aussen

Routenberechnung (brouter.de; fällt der Dienst aus, einmal Valhalla und dann OSRM als Reserve, beide freie OpenStreetMap-Dienste), Strava (nur lesen), Fitbit/Gesundheit, Google (Termine, Aufgaben, Mail), Spielerplus-Kalender (privater Link, nur lesen, Server `api/linkcheck.js` erlaubt nur spielerplus.de), KI-Helfer (Schlüssel nur in Vercel), Push, Abgleich, Buchung und Bezahlen (Testmodus). Server-Code: `api/*.js` und `api/_lib/`. Alles nur über Ich › Verbindungen aufschaltbar und abwählbar.

## 6. Regeln, Pläne, offene Baustellen: nur Verweise

Aufbau, Wege durch die App, Zusammenhänge, Daten, Regeln und Designregeln in einfachen Worten, mit Wörterbuch: `docs/aufbau.md`. Regeln: `CLAUDE.md` (gelten über allem). Pläne und Ziele: `docs/vorhaben.md`, `docs/roadmap.md`. Entscheide: `docs/decisions.md`. Offene PRs und Prüfungen: GitHub. Aktueller Stand und Plan: `docs/stand-und-plan.md`. Technik: `docs/technik-handbuch.md`. Verlauf und Entscheide mit Grund: `docs/verlauf-und-entscheide.md`. Was Noah wissen und tun muss: `docs/noah-wissen.md`. Älterer Verlauf: `docs/projektstand.md`, `docs/status.md`, `docs/releases/`. Hier steht keine Kopie davon, damit nichts doppelt veraltet.

## 7. Offene Abweichungen beim Abgleich

| Punkt | Stand |
|---|---|
| Handy-Erreichbarkeit | 77 von 150 Funktionen sind auf dem Handy nur über 4 oder mehr Tipps oder weit unten erreichbar, 4 nur über die Suche (Durchlauf 03.11.2026). Wird über «Wegweiser» und «Alles hier» verbessert. |
| Funktionen ohne eigenen Link | Schnellaktionen (Notiz, Beleg, Kilometer, Problem, Backup, Sprache, Demo, Installieren, Spielwiese, Suche) haben keinen eigenen Ort; sie hängen an «Passt hier» oder am Plus-Knopf. |

Wird eine Zeile hier erledigt, wird sie im PR gestrichen.
