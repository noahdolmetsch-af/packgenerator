# Verlauf und Entscheide: was gemacht wurde und warum

Für Noah, in einfachem Deutsch. Schnappschuss vom **5. November 2026**. Diese Datei fasst zusammen, wie die App seit dem 4. Oktober 2026 gewachsen ist, wie sich die Arbeitsweise geändert hat, welche Entscheide mit welchem Grund gefallen sind und was bewusst **nicht** gebaut wird. Die Einzelheiten stehen weiter hinten in den langen Dateien (siehe Teil 7). Was heute geplant ist: [Stand und Plan](stand-und-plan.md). Was die App heute kann: [App-Stand](app-stand.md).

**Wörter:** *PR* = eine Änderung auf GitHub (Pull Request). *Merge* = die Änderung wird in die Hauptversion übernommen. *Online* = auf der echten Seite. *Bündler* = die Claude-Sitzung, die freigegebene PRs nacheinander zusammenführt.

---

## 1. Zeitleiste in einer Tabelle

Versionsnummern gab es bis zum 26.10.2026 von Hand; seitdem entstehen sie beim Merge (siehe Teil 2, 27.10.). Die genaue Liste aller Versionen steht in der App unter Ich › Was ist neu.

| Zeit | Phase | Kern |
|---|---|---|
| 4.10.2026 | Grundlage | Material, Velos, Taschen, Pflege, Vorlagen, Packen, erster Rückblick |
| 5.10. | Ganzer Tourablauf | Unterwegs, Startseite, Deutsch und Englisch |
| 7.10. bis 8.10. | Analyse und Roadmap | Ausgangsprüfung, Roadmap AP01 bis AP30, eine Navigation, neue Tour fragt zuerst |
| 8.10. bis 9.10. | Alltag und Abnahme | Rucksäcke, Heute und Menü, GPX, Kleiderschrank, Startseite neu, Im Flow |
| 10.10. | Prinzip Nr. 1 und Fünf Orte | Übergänge, jeder km zählt, Velo-Blätter, fünf Orte, KI-Helfer |
| 11.10. | Aktiv und «App einfach» | Meditation, Meilensteine, Kachel-Wand, Alles finden |
| 12.10. | Design-Refresh | neues Aussehen für alle Seiten, Strava-Verbindung |
| 13.10. bis 14.10. | Viele kleine Bauten | Knöpfe, Schnellstart, Dateneingabe, Tages-Check, Daten bereinigt |
| 15.10. bis 18.10. | Pakete | sechs grosse Pakete, Regeln einheitlich, Server-Paket (Abgleich, Wächter) |
| 19.10. bis 20.10. | Ohne Testlink online | alle Pakete live, Tempo («Seiten laden erst beim Öffnen»), Rennen und Live-Karte, neue Leiste |
| 21.10. bis 22.10. | Grosse Bündel | Tour-Auswertung wie Strava, Tagebuch, Velo im Griff, Notizen, Suche mit Sprache, «Eine Tour, eine Seite» |
| 22.10. bis 24.10. | Klick-Rundgang | keine Sackgassen, Mockup-Pakete P1 bis P8, Abgleich ohne Fragen, Aktiv neu |
| 25.10. | 996 Ideen | Werkstatt, Ehrlicher Stand, Ruhig und persönlich, Mit Freunden, Kleine Helfer |
| 26.10. bis 27.10. | Neue Regeln, Live Navigation | kleine PRs, Live Navigation PR 1 bis 5, Neuer Schwung, «Weg von gebaut zu online» |
| 28.10. bis 1.11. | Heute als Begleiter, Kochen, Mini-Tools | Heute ruhiger, 104 Rezepte, Kochmodus, Termin finden, Wegweiser statt Katalog |
| 2.11. bis 5.11. | Aufräumen und Feinschliff | Wegweiser, Tempo, Wetterseite neu, Nebelgrenze, Tagescheck als Fragebogen, Geheimmenü, Tennis-Angebote, Durchklicken Etappe 1 und 2 (Teil 5) |

Ausführlich bis 26.10.: [Geschichte](geschichte.md). Ausführlich bis 2.11.: [Projektstand](projektstand.md), Abschnitt «Stand 02.11.2026».

---

## 2. Wie sich die Arbeitsweise geändert hat

Die Regeln wurden mehrmals von Noah neu gesetzt; **immer gilt die neueste**. Die heute verbindliche Fassung steht in [CLAUDE.md](../CLAUDE.md), Abschnitt «Current rules».

| Datum | Was sich änderte | Warum |
|---|---|---|
| 9.10. | Arbeitsanweisung: ein Paket, Mockup, a/b-Fragen mit ★ | Ordnung statt vieler paralleler Ideen |
| 10.10. | **Prinzip Nr. 1:** zuerst Überblick, Plan, Mockups, dann Noahs Freigabe, dann Bauen; Noah merged selbst | Nichts bauen, das Noah nicht gesehen hat |
| 14.10. | Statt Mockup vor dem Bau zeigt Claude die **fertige App**; neuer Abschnitt «Was fällt weg oder rutscht tiefer» in jedem PR | Mockups führten zu doppelter Arbeit; Verluste sollen nie überraschen |
| 15.10. bis 18.10. | Viele kleine PRs werden zu **Paketen** gebündelt | Offene PRs veralteten, wenn `main` sich bewegte |
| 18.10. | Testlink statt Mockups, `projektstand.md` als Einstieg | Schneller sehen, was los ist |
| 19.10. | «Ohne testen, direkt online»: ein Paket geht online, sobald GitHub grün zeigt | Tempo |
| 20.10. | Bündler-Thread, Auto-Merge | Weniger Wartezeit |
| 24.10. | «freigabe für alle» für Geparktes; Testlink ja, «ok» nein | Noah wollte mehr Schwung |
| 26.10. morgens | Noah merged jeden PR selbst, kein Auto-Merge | Kontrolle zurück |
| **26.10. abends** | **Die heutigen Regeln:** kleine PRs für alles, keine Bündel; Bilder und Prüfschritte, Noah gibt frei, dann merged Claude; Mockups nur für ganz Grosses; höchstens 5 Fragen mit ★; keine Seitenlängen-Vorgaben; «Was fällt weg» und «Was ist neu» in jedem PR; Doku zu jedem Release; kostenlos und privat | «Eine App, die mich im Alltag unterstützt.» Weniger Last, mehr Tempo, trotzdem Kontrolle |
| 27.10. | **Versionsnummer entsteht beim Merge** (`scripts/news.mjs`); jeder PR bringt eigene Dateien `docs/releases/<name>.md` und `src/lib/news/<name>.js` | Offene PRs geraten nicht mehr wegen der Version in Konflikt |
| 27.10. | «Weg von gebaut zu online»: Schnellspur (nach dem Merge sofort online, ca. 5 Minuten), pro PR nur Handy-Tests plus Wächter | Der Stau machte Merges stundenlang unsichtbar |
| 28.10. | Handy-Tests erst nach der Freigabe (**Label `ok`**); Wächter alle 3 Stunden | Testrechner schonen; cron-job.org hatte sich selbst abgeschaltet |
| 31.10. | **Pauschal-Freigabe** für kleine sichere PRs (nur Text oder Ansicht, grün, nichts mit Daten, Backup, Abgleich, `api/`) | Weniger Einzelfragen |
| 1.11. | **Fertig-Regel** (Wegweiser): eine neue Funktion hat Seite, Absprung, Inhalt, Leer-Zustand, nächsten Schritt, Zeile im App-Stand | Funktionen sollen auffindbar und erklärt sein |
| 2.11. | Wächter gegen private Daten im Repo (`private-data.test.js`) | Das Repo ist öffentlich |
| 3.11. | **App-Stand:** `docs/app-stand.md` wird vor jeder Abfrage gelesen; Volle Prüfung nur nachts; «Ausprobieren» pro PR nur eigene Zeilen | Nicht neu analysieren; CI-Stau |
| 4.11. | Start-Grenze 5,0 MB mit Warnung bei 90 % | Der Start lag bei 98 % der alten Grenze |

---

## 3. Wichtige Entscheide mit Grund

Quelle ist jeweils Noahs Antwort («1a 2b …») im Thread; der Wortlaut steht in [Entscheidungslog](decisions.md) (nach Datum) und in `docs/releases/`.

| Entscheid | Datum | Grund |
|---|---|---|
| Daten bleiben nur auf dem Gerät (Dexie im Browser), kein Konto-Zwang | von Anfang an | Privat, kostenlos, läuft offline |
| Die App läuft als Web-App (PWA), keine native App | Okt. | Ein Code für Handy und Computer, gratis auf GitHub Pages |
| Die App zieht nicht auf Vercel um, nur der Server «packgen» | Okt. | Sonst blieben die Daten im Browser zurück |
| Alles ist ein Vorschlag, änderbar, wählbar und mit Rückgängig | 19.10. | Nichts ist Pflicht; nichts geht unwiderruflich verloren |
| Alle Daten selbst hinzufügen, umbenennen, löschen | 19.10. | Nichts darf blockiert sein, weil es noch benutzt wird; das Löschfenster fragt, wohin Abhängiges geht |
| Gruppen überall (umbenennen, löschen, «Ohne Gruppe») | 18.10. | Einheitliche Bedienung |
| Seiten laden erst beim Öffnen (Tempo) | 19.10. | Schneller Start |
| Automatischer Abgleich Handy und Computer über eine Gratis-Datenbank (Upstash), ohne Fragen: die neuere Änderung gewinnt, die ältere bleibt 30 Tage | 18.10., 24.10. | Kein Datenverlust, nie eine Meldung im Frontend |
| Strava und Fitbit: die App liest nur | 12.10. | Datenschutz und Strava-Regeln |
| KI-Schlüssel nur in Vercel, Monats-Deckel | 10.10. | Kosten und Sicherheit |
| Gesundheitsdaten nur beobachten, keine Diagnosen; keine Namen von Personen oder Studios | 26.10. | Datenschutz im öffentlichen Repo |
| Teilen bleibt einseitig; später «Paket R»: App frei für andere, Google-Anmeldung oder Einladungslink nur für den Abgleich | 19.10. | Inhalte anderer bleiben nein |
| Kein Auto-Merge von Claude-PRs; Dependabot-PRs mergen grün von selbst | 26.10. | Kontrolle bei Funktionen, wenig Arbeit bei Bibliotheken |
| Version entsteht beim Merge | 27.10. | Keine Versionskonflikte offener PRs |
| Volle Prüfung nur nachts | 3.11. | Sie belegte 9 von 20 Rechnern nach jedem Merge, PRs warteten bis zu 47 Minuten |
| «Ausprobieren» pro PR nur eigene Zeilen | 3.11. | Der Test brauchte 10 Minuten und wuchs mit jedem PR |
| Start-Grenze 5,0 MB; Handbuch und «Was ist neu» laden erst beim Öffnen | 4.11., 5.11. | Der Start lag bei 98 %; so wurde er rund 1,2 MB kleiner |
| Wegweiser statt Katalog: jede Funktion braucht einen Absprung dort, wo der Bedarf entsteht | 1.11. | Von 150 Funktionen waren 77 am Handy nur über 4 oder mehr Tipps erreichbar |
| «Alles hier»-Feld je Bereich, höchstens 2 bis 3 Tipps | 3.11. | Versteckte Funktionen finden |
| Ich schlank: Dokumente, Fotoalbum, Freunde, Mini-Tools nur noch in Planen | 4.11. | Ich bleibt für Daten, Einstellungen, Hilfe |
| Wetter: **ein** Wetter-Kern und **eine** Luftschichten-Abfrage für die ganze App | 20.10., 5.11. | Nichts doppelt abfragen, Wetter-Quellen schonen |
| Router: eine Tür (`askRouter`) mit Zeitlimit, Zwischenspeicher, klaren Meldungen; Reserve-Kette beschlossen | 5.11. | brouter.de kann ausfallen; die App soll ehrlich sagen, was los ist |
| Tourenvorschläge: offene Daten (SchweizMobil, OpenStreetMap), kein Komoot und kein Strava als Quelle | 5.11. | Rechtliches: Komoot- und Strava-Daten dürfen nicht so verwendet werden |
| Tennis-Angebote: Anfrage vor Rechnung, Rechnung nur als Entwurf nach der Stunde, Kundenliste nur auf dem Gerät | 3.11. | Nichts geht ohne Noahs Blick raus; Kundendaten bleiben privat |
| Tagescheck: **ein** Fragebogen, eine Frage je Thema | 4.11. | Doppelte Fragen auf Heute und im Check verwirrten |
| Bewegung überall sanft, aus bei «Bewegung reduzieren» | 26.10. | Lebendig, aber barrierefrei |
| Das grosse Durchklicken in sechs Etappen plus Schlussbericht; gleiche Ursache = ein PR; höchstens 5 offen | 5.11. | Fehler gründlich finden, ohne CI zu verstopfen |
| Echte Daten nur privat (`/mnt/project-files/private/`), nie im Repo | 26.10. | Das Repo ist öffentlich |

---

## 4. Was wir gelernt haben

- **Viele kleine PRs stauen sich**, wenn `main` sich bewegt. Lösung wurde mehrmals gesucht: Tagespakete, Pakete, Bündel, jetzt kleine PRs mit eigenen Dateien (keine geteilten Zeilen mehr).
- **Doku, die nicht im PR mitkommt, ist am nächsten Tag veraltet.** Darum eigene Datei pro PR, der feste App-Stand und der Sonntags-Brief.
- **Fertige App als Bild schlägt Mockup**, ausser bei ganz neuen Seiten.
- **Tests dürfen nicht von der Uhrzeit abhängen.** Ein Fenster, das nur sonntags erscheint, blockierte am 25.10.2026 einen Tag lang die Veröffentlichung. Heute gilt eine feste Test-Uhr und `localDay()`.
- **Echte Nutzung ist der Taktgeber.** Es wurde viel gebaut; was auf dem Handy wirklich nützt, zeigt erst der Alltag.
- **Ein Test, der oft rot ist, hilft niemandem.** Darum eine Liste bekannter wackliger Tests ([Technik-Handbuch](technik-handbuch.md#10-häufige-stolpersteine-stand-5112026)) und die Regel: nie lockern, Ursache beheben.
- **Nie `git merge origin/main` in einen PR-Branch.** Es macht die Versions-Tests rot; stattdessen rebase.
- **Abhängigkeiten von aussen fallen aus** (cron-job.org schaltete sich am 27.10. selbst ab; Landi und SRF erlauben das Einblenden vielleicht nicht). Darum der Wächter alle 3 Stunden und ehrliche Meldungen in der App.
- **Die Entwicklungsumgebung sieht nicht alles.** Wetterquellen sind nicht erreichbar: die echte Gegenprobe macht Noah.

---

## 5. Seit dem 2. November 2026

Rund 50 PRs auf `main` seit dem 2.11. morgens (die Nummern etwa #741 bis #930), hier nach Thema. Was davon auf Noah wartet: [Stand und Plan](stand-und-plan.md).

- **Wegweiser und Auffindbarkeit:** «Alles hier» in Velos, Material, Touren und Planen (#806, #832, #847, #854), Ich schlank (#867), Wächter für die Tipp-Zahl (#739), versteckte Funktionen ohne Platz (#733), Karten «Was du hier tun kannst» mit Einklappen und «n neu» (#878, #881).
- **Velos und Pflege:** Inserat beim Ausmustern (#737), Velo verpacken (#744), Foto beim Kette messen (#746), «Im Vorrat» (#749), «Passt jetzt» (#752), ausgemusterte Velos nicht mehr auf Heute (#902).
- **Wetter:** Wetterseite neu in vier PRs (#839, #857, #876, #887: Landi-Regenradar im Fenster, Regenstreifen 24 h, SRF-Webcams, Licht für die Fahrt, Gewitter mit Uhrzeit, Reiter), Nebelgrenze auf Heute und Wetterseite (#921).
- **Live-Navigation:** Licht-Karte (#826), Kälte und Regen der nächsten 3 Stunden (#925), Router-Sicherheitsnetz (#928).
- **Tagescheck:** ein Fragebogen (#852), Morgen- und Abend-Seite (#866, #884), «Deine 15 Fragen» geht auf (#894); Fragen aus deinen Daten, Stufe 2 (#879, #896, #903).
- **Lernen und Auswerten:** Persönliches Lernen Ideen 1 bis 6 (#849, #855, #865, #872, #885, #892), Experimente mit Fahrt gegen Fahrt (#905), Erfolgsrezepte (#885), Fahrtechnik-Tagebuch (#872).
- **Heute und Jetzt dran:** nur Dringendes (#913), «Später» und «Zeilen wählen» (#915), Backup-Zeile und leere Notizen (am 5.11. noch offen), kleine Karte füllt die Zeile (#891), Abkürzungen brechen keine Wörter (#899).
- **Träume und Neuland:** Passt jetzt, Ideen pro Monat (#900), Feierabend-Biwak (#920).
- **Geheimmenü hinter «PG»:** Velo (#759), Velo-Weisheit (#775), Platten (#812), Murmeltier (#845), Logo-Wetter (#856), Alpenpanorama (#863), Kuhglocken (#874).
- **Tennis und Angebote:** Anfrage (#706), Rechnung zur Buchung (#732), Sammelrechnung (#745), Kundenliste (#778), späte Absage (#850), Barzahlung (#862), Stundenkarte (#871, #883), Abo (#893), Warteliste (#919), Gruppenstunden (#906).
- **Tempo und Start:** Start rund 1,2 MB kleiner (Handbuch #869, «Was ist neu» #882), Material-Suche (#886), «Meine Sportarten» (#910), Tempo-Messer.
- **Durchklicken Etappe 1 und 2:** acht gefundene und behobene Fehler (#891, #897, #898, #899, #904, #917, #918, #922, #927, #930), Wächter «jeder Text hat Deutsch» (#907).
- **Dokumentation:** App-Stand und sein Test (#742), Aufbau der App erklärt (#901).
- **Tourenvorschläge:** Pilot-Seite mit fünf Mountainbike-Touren (#926).
- **Sportarten umbenennen** gilt jetzt auch für Fahrrad, Gravel, Cross Country und Downhill (Ursache: fehlender Listeneintrag).

---

## 6. Abgelehnte und gestrichene Ideen

Alles, was Noah ausdrücklich nicht will oder aufgegeben hat, mit dem Grund, soweit er festgehalten ist (sonst steht «Grund nicht festgehalten»; erfunden wird keiner). Steht eine Idee hier, wird sie **nicht wieder vorgeschlagen**, ausser Noah ändert seinen Entscheid.

| Idee | Wann | Grund |
|---|---|---|
| Native App (App Store) | Okt. | Die Web-App reicht und ist gratis; sie bleibt |
| Konten für andere / Inhalte anderer Nutzer | 19.10. | Teilen bleibt einseitig; später nur Anmeldung für den Abgleich |
| Fremde Einbettungen (Windy, komoot-Karten), Todoist, n8n, Paperless, Dify, Algolia | Okt. | Aufgaben, Suche, Belege und Assistent sind in der App; nur Links nach aussen |
| Foto-KI für Material | Okt. | Von Noah gestrichen; ein Grund ist nicht festgehalten |
| Live-Sync über Google Drive | Okt. | Überholt: der Abgleich läuft über die Gratis-Datenbank |
| Privat-Zone beim Teilen rund um das Zuhause | Okt. | Unter «Bewusst nicht» (Grund nicht festgehalten) |
| «Aus einem Satz wird ein Eintrag» (KI), KI-Wochenrückblick am Sonntag | Okt. | Unter «Bewusst nicht» (Grund nicht festgehalten) |
| Einkauf, Lebenslauf, Werkstatt (D2), Computer als Werkzeug (D4) | Okt. | Unter «Bewusst nicht» in der Vorhaben-Liste (Grund nicht festgehalten) |
| Rückkehr-Melder für Notfall-Person | Okt. | Unter «Bewusst nicht» (Grund nicht festgehalten) |
| Aussortieren und weitergeben | Okt. | Unter «Bewusst nicht» (Grund nicht festgehalten) |
| Leiste mit 7 Orten | Okt. | Unter «Bewusst nicht»; die Leiste hat fünf Orte |
| Cloudflare (Test-Links) | Okt. | Gedroppt; seit 27.10. gibt es keine Test-Links mehr, Noah prüft auf der echten Seite nach dem Merge |
| Google-Maps-Kacheln | Okt. | Gedroppt; die App nutzt OpenStreetMap-Karten (Grund nicht festgehalten) |
| Sturzerkennung | Okt. | Gedroppt (Grund nicht festgehalten) |
| «App verkaufen» | Okt. | Gedroppt; das Ziel bleibt eine persönliche App (siehe Regel 10: kostenlos und privat) |
| «Frontend aufpeppen» als eigenes Vorhaben | Nov. | Gedroppt; die Arbeit läuft über Neuer Schwung und das Durchklicken |
| Vercel-Kommentarleiste | Nov. | Gedroppt (Grund nicht festgehalten) |
| Rennrad-Profil und -Chip bei den Tourenvorschlägen | 5.11. | Noah «Rennrad gar nicht» (Grund nicht festgehalten) |
| Komoot und Strava als Tourenquelle | 5.11. | Rechtlich nicht erlaubt |
| Wind-Vorschau auf der Wetterseite | 4.11. | Nicht gewählt |
| Idee 9 «Löschen sieht man» (Bewegung) | 3.11. | Nicht gewählt |
| Geheimmenü H3, H4, H10, H11 | 3.11. | Nicht gewählt; H5 Pass-Sprint bleibt Idee für später |
| Wächter gegen doppelte Klassennamen; Meldung bei «1,5» im Gewichtsfeld | 5.11. | «beide ideen verwerfen» (Etappe 2) |
| Heute: «Unterwegs und Velos» über «Deine Woche» (PR #757) | 3.11. | «verwerfen 757» |
| Tippflächen grösser als 44 px | 5.11. | «2b»: bleiben, wie sie sind |

Quelle der meisten Zeilen: [Alle Vorhaben](vorhaben-liste.md), Abschnitt «Bewusst nicht», [Geplante Vorhaben](vorhaben.md), Abschnitt «Bewusst nicht und offene Punkte», und Noahs Antworten in den Threads vom 3. bis 5. November.

---

## 7. Wo die Einzelheiten stehen

| Frage | Datei |
|---|---|
| Alles bis 26.10. in Abschnitten | [Geschichte](geschichte.md) |
| Alle Versionen mit Datum | App: Ich › Was ist neu; GitHub: Releases |
| Jeder PR seit 27.10. (was ist neu, was fällt weg, selbst entschieden, Prüfschritte) | `docs/releases/<name>.md` |
| Entscheide im Wortlaut | [Entscheidungslog](decisions.md) |
| Frühere Stände und Fortschrittsregister | [Projektstand](projektstand.md), [Status](status.md), [Roadmap](roadmap.md) |
| Ziele und Vorhaben mit Warum | [Geplante Vorhaben](vorhaben.md), [Alle Vorhaben](vorhaben-liste.md) |
| Verbindliche Regeln | [CLAUDE.md](../CLAUDE.md), [Arbeitsweise](arbeitsweise.md) |

**Hinweis zu den alten Grossdateien:** `status.md`, `decisions.md`, `roadmap.md` und `handbuch.md` bleiben unverändert als Verlauf. Wo sie dem Code oder [Stand und Plan](stand-und-plan.md) widersprechen, gilt der Code, dann diese Übersichten.
