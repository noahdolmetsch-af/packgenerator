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
| Heute | `#/` | Persönliche Übersicht mit nächsten Vorhaben, Wetter, fälligen Aufgaben, Körperdaten und Vorschlägen. Kacheln hinzufügen, ausblenden und sortieren. |
| Suche und Assistent | `#/assistent` | Fragen zu eigenen Daten stellen, Funktionen finden und eine Tour durch kurze Fragen vorbereiten. |
| Quick Links | `#/quick` | Häufig verwendete Seiten und Kacheln anpinnen und in eigenen Gruppen ordnen. |
| Funktionskatalog | `#/features` | Funktionen nach Situation, Seite oder Moment entdecken und suchen. |
| Handbuch | `#/me/handbook` | Voraussetzungen, kurze Anleitungen und Beispiele zu den Funktionen lesen; Rundgänge starten. |

### 2. Touren planen und vorbereiten

| Funktion | Link | Was man damit tun kann |
|---|---|---|
| Tourenübersicht | `#/trips` | Geplante, abgeschlossene und bewertete Touren verwalten; neue Touren und spontane Ausfahrten beginnen. |
| Tour planen | `#/pack` | Sportart, Datum, Dauer, Startort, Velo und Bedingungen festlegen und daraus eine Packliste vorbereiten. |
| Routen und GPX | `#/pack` | GPX hinzufügen, Distanz, Höhenmeter, Fahrzeit, Höhenprofil und Anstiege ansehen; offene Stellen entlang der Route notieren. |
| Tourvorlagen | `#/pack/templates` | Bewährte Touren als Vorlage speichern und erneut verwenden. Rückblicke liefern Vorschläge zur Verbesserung. |
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
| Packliste | `#/pack` | Material auswählen, Mengen festlegen, Taschen zuordnen und Gesamtgewicht kontrollieren; auch nach Bedürfnissen wie Schlafen, Kochen oder Regenschutz packen. |
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
| Live-Karte | `#/live` | Position und Route verfolgen, Abbiegehinweise und Datenseiten nutzen sowie Pausen, Runden und Umwege bearbeiten. |
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
| Detaillierter Rennen-Check | `#/racecheck` | Packliste, Zielsetup pro Tasche, Basisliste und Schlafvarianten vorbereiten und eine Nacht gedanklich durchspielen. |
| Muster-Rennen | `#/race?sample` | Ein erfundenes 1000-km-Rennen als Lern- und Testbeispiel öffnen. |
| Schlafstrategie | `#/race` | Schlafplätze voraus suchen, eigene Listen importieren und geplante Nächte mit Wetter vergleichen. |
| Hotels für heute Nacht | `#/race` | Hotels bei der erwarteten Abendposition mit Kontaktinformationen prüfen; Anfragen und Antworten festhalten. |
| Powernap | `#/race` | Kurze Schlafpausen mit Timer vorbereiten. Der App-Alarm benötigt laut Handbuch eine geöffnete App. |

### 6. Velos, Pflege und Werkstatt

| Funktion | Link | Was man damit tun kann |
|---|---|---|
| Veloverwaltung | `#/bikes` | Mehrere Velos mit Stammdaten, Fotos und Kilometerstand verwalten; Standardvelo und Reihenfolge festlegen. |
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
| Aktiv | `#/flow` | Bewegung, Achtsamkeit und Erholung abhaken, Zeiten erfassen und den eigenen Rhythmus verfolgen. |
| Meine Sportarten | `#/flow/sports` | Eigene Sportarten mit Zielen, Messwerten, Ausrüstung, Verlauf und Zusatzbausteinen anlegen. |
| Training | `#/flow/training` | Einheiten mit Dauer und Zone planen; Aktivitäten, Pulszonen und subjektive Anstrengung auswerten. |
| Leistungsanalysen | `#/flow/training?view=list` | Einzelne Aktivitäten mit Leistung, Herzfrequenz, Runden, Splits und weiteren verfügbaren Messwerten öffnen. |
| Trainingspläne | `#/flow/plans` | Beispielpläne für Ultracycling an Wochenstunden und Zieldatum anpassen und in die Woche übernehmen. |
| Form und Erholung | `#/flow/form` | Belastung, Form und Bereitschaft anhand vorhandener Aktivitäten, Körperdaten und Tageschecks betrachten. |
| Wochenrückblick | `#/flow/review` | Sportumfang, Körperdaten, Zonen, Velokilometer und Höhenpunkte vergleichen; eigene Notiz und nächstes Ziel ergänzen. |
| Meilensteine | `#/flow/milestones` | Fortschritte, Herausforderungen, Sterne und erreichte Bestwerte sammeln. |
| Gipfelbuch | `#/flow/gipfelbuch` | Erreichte Pässe, Gipfel und weitere Sportorte festhalten. |
| Meditation | `#/flow/act/meditation` | Sitzungen mit Timer, Klängen und Vorlagen starten; auch Yogastunden und Studiolinks organisieren. |
| Meditationsprotokoll | `#/flow/act/meditation/log` | Sitzungen, Regelmässigkeit, Tageszeiten und Notizen ansehen. |
| Tennis | `#/flow/sport/act%3Atennis` | Spiele und erteilte Lektionen dokumentieren, geplante Termine und Platzbuchungslinks verwalten. |
| Morgen-Check | `#/check/morning` | † Den eigenen Zustand am Morgen kurz erfassen (Schlaf, Stimmung, Sorgen). |
| Erkenntnisse | `#/me/insights` | Zusammenhänge zwischen Schlaf, Stimmung, Bewegung, Meditation, Wetter und weiteren eigenen Daten erkunden. |
| Was mir gut tut | `#/me/wohl` | Muster guter Tage sammeln, gewünschte Lebensbereiche vergleichen und kleine Experimente durchführen. |
| Routinen | `#/routine` | Persönliche Gewohnheiten mit kurzen täglichen Checklisten verfolgen; Teil von Aktiv › Erholung, Kachel auf Heute. |
| Timer | `#/timer` | Stoppuhr, Countdown, Intervalle und Pomodoro mit Zweck und Protokoll verwenden. |

### 8. Auswerten, Erinnerungen und neue Abenteuer

| Funktion | Link | Was man damit tun kann |
|---|---|---|
| Auswerten | `#/auswerten` | Einstieg in Aktivitäts-, Körper- und Verlaufsanalysen. |
| Übergreifende Analyse | `#/auswerten/analyse` | Daten verschiedener Bereiche gemeinsam betrachten und vergleichen. |
| Tour-Rückblick | `#/debrief` | Erfahrungen bewerten, ungenutztes und fehlendes Material markieren, Pannen dokumentieren und Verbrauch buchen. |
| Fahrt hochladen | `#/debrief/ride` | Fahrdateien auswerten, Planung und Realität vergleichen sowie Erkenntnisse festhalten. |
| Vergangene Touren | `#/pack/past` | Frühere Touren mit Distanz, Höhenmetern, Zeit und Erfahrungen durchsuchen. |
| Logbuch | `#/debrief/logbook` | Auch ältere Touren nachtragen und nach Jahr oder Art filtern. |
| Tourenpass | `#/debrief/tourenpass` | Nach dem Rückblick einen Stempel auf den Tourenpass setzen; Stempel selbst hinzufügen, ändern, entfernen und ablehnen. |
| Gesammelte Erkenntnisse | `#/debrief/learnings` | Erfahrungen thematisch sammeln und für spätere Touren wiederfinden. |
| Eigenes Tempo | `#/debrief/pace` | Aus gefahrenen Touren eine persönliche Fahrzeitschätzung ableiten. |
| Pässe sammeln | `#/debrief/paesse` | Alpenpässe, über die eine gespeicherte Tour führt, als Pass-Schild sammeln; vom Standort der Route erkannt, jederzeit änderbar. |
| Reise-Spur und Reisebuch | `#/debrief` | † Tourtage mit Route, Orten, Fotos und Notizen betrachten; Familienlink oder Reisebuch daraus erstellen. |
| Gelernt | `#/gelernt` | Monatskarte und Jahresbrief mit Erkenntnissen und Entwicklungen ansehen. |
| Jahr als Bildgeschichte | `#/jahr` | Touren und Erinnerungen eines Jahres als Bildgeschichte ansehen. |
| Heatmap | `#/heatmap` | Gefahrene Strecken auf einer Karte betrachten und nach Jahr, Sport, Velo oder Tour filtern. |
| Neuland | `#/neuland` | Neu besuchte Gemeinden, Länder, Pässe, Seen und weitere Orte entdecken; neue Kilometer und Sammlungen verfolgen. |
| Traumtouren | `#/trips/dreams` | Wunschabenteuer nach Saison sammeln, auf der Karte vergleichen und in konkrete Touren verwandeln; passende Wetterfenster und neue Ziele in der Nähe finden. |
| Inspiration | `#/inspiration` | Links zu Routen, Videos, Ausrüstung und Rennen sammeln und daraus Ideen oder Packregeln ableiten. |

### 9. Wetter, Berg und Skitouren

| Funktion | Link | Was man damit tun kann |
|---|---|---|
| Wetter | `#/wetter` | Orte, Tage und Startzeiten vergleichen; Regen, Wind, Kälte, Hitze und Warnungen für die Planung berücksichtigen. |
| Hinweise und News | `#/me/hinweise` | Regionale Hinweise, winterliche Lawineninformationen und eigene Nachrichtenquellen bündeln. |
| Skitouren | `#/ski` | Nächste Tour mit Wetter, Nullgradgrenze und Neuschnee vorbereiten. |
| Skitour planen | `#/ski/plan` | Bulletinangaben, Bedingungen, Zeitplan und Umkehrzeit dokumentieren. |
| Rucksack-Check | `#/ski/check` | Skitourenausrüstung in Gruppen abhaken. |
| Start-Check | `#/ski/start` | Die letzten Kontrollen am Ausgangspunkt durchführen. |
| Standort im Notfall | `#/mountain/sos` | Eigene Koordinaten gross anzeigen und Notrufaktionen aufrufen. |
| Notfallkarte | `#/mountain/qr` | Persönliche Notfallinformationen als QR-Karte vorbereiten. |
| Schwierigkeitsskalen | `#/mountain/scales` | Schweizer Wegweiser und SAC-Skalen nachschlagen. |

### 10. Was man ausserhalb des Velofahrens tun kann

| Funktion | Link | Was man damit tun kann |
|---|---|---|
| Woche planen | `#/week` | Sport, Termine, Aufgaben, Ferien und Service in einer Woche zusammenbringen; freie Zeit mit gutem Wetter finden. |
| Merken und Listen | `#/calendar` | Aufgaben und eigene Listen verwalten; Abhängigkeiten und wartende Aufgaben festhalten. |
| Notizen | `#/notes` | Texte, Checklisten, Fotos, Sprachnotizen, Skizzen, Dateien und Links sammeln; formatieren, verknüpfen, erinnern und frühere Fassungen wiederherstellen. |
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
| Mini-Tools für Gruppen | `#/me/mini` | Terminfindung, Umfrage, Anmeldeliste mit Warteliste, spontane Einladung und Essensabfrage per Browserlink erstellen. |
| Fair auslosen | `#/me/mini/los` | Aufgaben oder Rollen innerhalb einer Gruppe verteilen. |
| Gemeinsam ankommen | `#/me/mini/abfahrt` | Abfahrtszeiten von unterschiedlichen Startorten für einen gemeinsamen Treffpunkt berechnen. |
| Ruhig und persönlich | `#/me/ruhig` | App vereinfachen, Erinnerungen begrenzen, Briefe ans zukünftige Ich schreiben und persönliche Experimente oder gute Entscheidungen sammeln. |

### 11. Dateien, Werkzeuge, Verbindungen und Datensicherung

| Funktion | Link | Was man damit tun kann |
|---|---|---|
| Dokumente | `#/me/docs` | † Dokumente (Verträge, Belege, Ausweise) in der App aufbewahren. |
| Dokument scannen | `#/me/docs` | Papierdokumente fotografieren und als Dokument aufbereiten. |
| Externe Werkzeuge und Links | `#/me/links` | Eigene Links und passende externe Anwendungen organisieren. |
| KI-Projekte | `#/me/ki-projekte` | Links zu eigenen KI-Projekten, Chats und Threads sammeln. |
| KI-Helfer | `#/helper` | Optionale KI-Unterstützung konfigurieren; Vorschläge prüfen und gezielt übernehmen. |
| Sprachsuche | `#/me/suche` | Sprachbefehle und die Beantwortung von Fragen einstellen. |
| Verbindungen | `#/me/connections` | Strava, Fitbit und Google-Verbindungen verwalten und sehen, welche Funktionen davon abhängen. |
| Termine und Aufgaben | `#/me/agenda` | Die angebotene Google-Anbindung für Termine und Aufgaben verwenden. |
| Mail | `#/me/mail` | Die angebotene Gmail-Anbindung nutzen und Nachrichten weiter organisieren. |
| Daten und Backup | `#/me/data` | Daten exportieren und importieren, Sicherungen einrichten, optional verschlüsseln und Geräteabgleich konfigurieren. |
| Aufs Handy | `#/me/phone` | Nutzung auf einem weiteren Gerät beziehungsweise auf dem Handy vorbereiten. |
| Kleine Apps | `#/me/apps` | Einzelne Appbereiche als eigene Verknüpfung auf den Startbildschirm legen. |
| Push-Erinnerungen | `#/me/push` | Hinweise zu Touren, Wetter, Licht, Verschleiss und Fristen einstellen. |
| Eigene Werte | `#/me/werte` | Grenzwerte, Standardannahmen und Erinnerungsabstände anpassen. |
| Listen und Typen | `#/me/lists` | Kategorien und andere Auswahllisten selbst ergänzen, umbenennen und ordnen; auch die Sprüche, die das «PG»-Logo nach fünf Tipps sagen kann. |
| Entscheidungsregeln | `#/me/regeln` | Nachvollziehen, weshalb die App etwas vorschlägt und wo sich die zugrunde liegenden Werte ändern lassen. |
| Neuigkeiten | `#/me/news` | Änderungen und neue Funktionen nach Version nachlesen. |

### 12. Beim Abgleich ergänzt: in Noahs Dokument nicht einzeln genannt

Diese Funktionen gibt es in der App (`features.js`), sie fehlten im Dokument. Der Abgleich hat sie hier angefügt; Texte aus `features.js`.

| Funktion | Link | Was man damit tun kann |
|---|---|---|
| Ich (Einstieg) | `#/me` | Einstieg zu Daten, Verbindungen, Einstellungen, Aufräumen von Testdaten und Tastenkürzeln. |
| Aussehen und Bedienung | `#/me/look` | Farbwelt, Grösse und Licht, Handschuh-Modus, eine Seite anpassen, Vorschläge an oder aus, KI auf diesem Gerät. |
| Werkzeugkasten | `#/me/tools` | Kleine Werkzeuge: Karte messen, Barcode, Packliste per Foto, Währungen, Lupe und Licht, Zeitzonen, Kompass, Redewendungen, Reisekosten, Übersetzungen der Gänge, Wasserwaage, Sitzposition, PDF, Fotos, Bildformat, Video verkleinern, QR-Code, Etiketten, Rechner, Einheiten, Werkzeugketten. |
| Freie Zeit | `#/me/frei` | Erste Nacht, Für nächstes Mal, Mein Abend, Was mir wichtig ist, Reisewünsche, Wonach ist mir?, Meine Sammlungen. |
| Gewicht | `#/me/weight` | Freiwillig und nur auf diesem Gerät: das eigene Gewicht mit Kurve, für Watt pro Kilo. |
| Deine Fragen | `#/me/abfragen` | Spielerische Fragen mit eigenem Rhythmus, Morgen- und Abendrunde, Verlauf und Auswertung; Fragen und Bereiche ändern, löschen, ergänzen und sortieren. |
| Abend-Check | `#/check/evening` | Am Tourtag abends bewerten, wie die Tour war (1 bis 10); landet im Rückblick und im Tagebuch. |
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

## 4. Wo die Daten liegen

Nur im Browser des Geräts (IndexedDB über Dexie, `src/lib/db.js`; die Tabellenliste der Sicherung steht in `DATA_TABLES`). Sichern per Backup-Datei oder Ordner-Sicherung (`src/lib/backup.js`), optional verschlüsselt, plus Geräteabgleich (Ich › Daten und Backup). Das Repo ist öffentlich: nichts Persönliches darin (siehe `CLAUDE.md`, «Privacy»).

## 5. Verbindungen nach aussen

Strava (nur lesen), Fitbit/Gesundheit, Google (Termine, Aufgaben, Mail), KI-Helfer (Schlüssel nur in Vercel), Push, Abgleich, Buchung und Bezahlen (Testmodus). Server-Code: `api/*.js` und `api/_lib/`. Alles nur über Ich › Verbindungen aufschaltbar und abwählbar.

## 6. Regeln, Pläne, offene Baustellen: nur Verweise

Regeln: `CLAUDE.md` (gelten über allem). Pläne und Ziele: `docs/vorhaben.md`, `docs/roadmap.md`. Entscheide: `docs/decisions.md`. Offene PRs und Prüfungen: GitHub. Verlauf: `docs/projektstand.md`, `docs/status.md`, `docs/releases/`. Hier steht keine Kopie davon, damit nichts doppelt veraltet.

## 7. Offene Abweichungen beim Abgleich

| Punkt | Stand |
|---|---|
| Handy-Erreichbarkeit | 77 von 150 Funktionen sind auf dem Handy nur über 4 oder mehr Tipps oder weit unten erreichbar, 4 nur über die Suche (Durchlauf 03.11.2026). Wird über «Wegweiser» und «Alles hier» verbessert. |
| Funktionen ohne eigenen Link | Schnellaktionen (Notiz, Beleg, Kilometer, Problem, Backup, Sprache, Demo, Installieren, Spielwiese, Suche) haben keinen eigenen Ort; sie hängen an «Passt hier» oder am Plus-Knopf. |

Wird eine Zeile hier erledigt, wird sie im PR gestrichen.
