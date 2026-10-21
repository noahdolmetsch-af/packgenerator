# Projektstand und Plan

Stand: **19. Oktober 2026, abends**. Live ist **Version 0.152.0** («Tempo», seit 19.10.2026). Mit diesem PR kommt **0.154.0** (Paket 2); 0.153.0 (Paket 1, PR #200) ist davor online gegangen.

### Kurzstand 19.10.2026, abends (Roadmap)

Seit 19.10.2026 gibt es keine Testlinks mehr: Ein Paket geht online, sobald die Tests auf GitHub grün sind (build, e2e desktop, e2e phone). Bei Paketen, die Daten umbauen, wird vorher mit einer Kopie einer Sicherung geprüft, dass nichts verloren geht. «zurück» heisst: sofort rückgängig machen. Reihenfolge nach Noahs «1b» (19.10.2026):

| Schritt | Paket | Version | Inhalt | Stand |
| --- | --- | --- | --- | --- |
| ✓ | E, C, F, Tempo | 0.149.0–0.152.0 | Material, Velos, Woche, Seiten laden beim Öffnen | live |
| 1 | Paket 1 | 0.153.0 | G Daten von selbst, L Werkzeugkasten, P Was mir gut tut, N Pläne und Träume, Q App klarer, H Packen leichter, J Berg, Schnee und Notfall | PR #200 |
| 2 | Paket 2 | 0.154.0 | K Haus und Alltag, M Tour-Tagebuch, S Reise-Spur, O/I Teile pro Velo und Inspektion, L2 Packliste vom Foto, R App für alle, Trello, Strava-Fahrten auf Touren | PR #201 |
| 3 | Paket 3+4 | 0.155.0 | Freie Zeit, Daten in der App, V Alltag (Einkauf, Verträge, Menschen, Ausland, Flug), Haus-Check, Wohnungs-Hüter, «Bereit für morgen?», Strombudget, Reise-Links, Anleitungen überall, Diktat und KI | PR #202; Paket 3 und 4 verbunden (Noah 19.10.2026) |
| 4 | Paket 5 | 0.156.0 | Mail in die App, Grösse (Schieber 80–130 %, Kompakt), Abgleich-Hinweis unter Ich | live mit 0.157.0 (PR #203) |
| 5 | Paket 6 | 0.157.0 | Velo-FAQ (48 Fragen), Trainingspläne mit gefühlter Anstrengung, ganze Zeile bei abgeschlossenen Touren | live |
| 6 | Reparatur | 0.158.0 | Heute stabil: lädt nach Update oder Abgleich immer | PR #204 |
| 7 | Paket 7 | 0.159.0 | U Rennen: Strategie-Rechner, Muster-Rennen, Renn-Karte mit feinem zoombarem Höhenprofil, Anstiege, Karte offline, Live-Karte für jede Fahrt (Vollbild, Orte suchen, Wetter-Zeitleiste, GPX öffnen, SOS im «⋯»-Menü) | dieser PR; Ton-Aufnahmen gestrichen |
| 8 | Paket 8 Verpflegung | 0.160.0 | Touren › Verpflegung: Kohlenhydrate und Wasser pro Abschnitt zwischen Läden, Warnungen, eigene Werte und Produkte; mit Läden, Öffnungszeiten und Orten aus der Ortssuche von Paket 7 ; Trainingsplan an Rennen gekoppelt; Kachel «Das tut mir gut» (Kreis, Wochenpunkte, «Hat gut getan?») | Bündler |
| 10 | Paket 9 | 0.161.0 | Tour-Seite: jede abgeschlossene Tour antippbar, mit Karte, Profil, Werten, Tagebuch; Fahrten verbinden | live (PR #208) |
| 11 | Gesamttest-Korrekturen | 0.162.0 | Zehn kleine Korrekturen aus dem Rundgang vom 20.10.2026: fehlende Leerzeichen, Unterwegs ohne Tour, Heute ohne «Geplant» bei laufender Tour, Strava «Zum Prüfen» 20 auf einmal, Daten und Gepäck auf Deutsch | live (PR #209, #210) |
| 12 | Gesamttest Runde 2 | 0.163.0 | Strava gleicher Velo-Name selbst zugeordnet, Reiter «Fahrten» in Touren, Hilfe als eine Zeile, «Gut gemacht» auf Heute, Velopflege ohne Doppelungen | live (PR #211) |
| 13 | Tests automatisieren | 0.164.0 | Nacht-Rundgang über alle Seiten, Live-Prüfung nach jedem Update inkl. offline, Zeitkapsel-Test der Datenversionen, KI-Gesundheitsprüfung, Bibliotheken aktuell | live (PR #212) |
| 14 | Heute neu A «Ein Blick» | 0.165.0 | Heute auf einen Blick: ein Satz, «Jetzt dran» (Morgen-Check, Meditation, Velo-Idee, Fälliges, höchstens 4), Tour, «Du heute», Woche, Velos, 8 Abkürzungen, «Alle Bereiche»; Morgen-Check mit 3 Fragen und «Fragen einblenden»; Tipp der Woche unter Ich | live (PR #214) |
| 15 | Neueste Version laden | 0.166.0 | Fehlerseite: «Neueste Version laden» holt die App frisch aus dem Internet (Service Worker und App-Dateien weg, Daten bleiben); Fehlerseite sucht zuerst selbst nach Update; zwei Test-Wettläufe behoben (Listen, Abend-Check) | live (PR #216) |
| 16 | Heute am Handy | 0.166.1 | «Jetzt dran» rutschte am Handy unter die Tourkarte, wenn Glückwünsche darüber standen; Glückwünsche nur noch eine Zeile | live (PR #217) |
| 17 | Balken «Jetzt laden» | 0.167.0 | Jeder Build schreibt version.json; hängt ein Gerät 15 Minuten hinter der Online-Version, zeigt die App oben «Jetzt laden» und «Später» | live (PR #217) |
| 18 | Tour-Seite Gepäck und Gestaltung | 0.168.0 | Gepäck nachträglich zu einer Fahrt (wird Packmodus-Tour), Markierung pro Stück mit Notiz (wird Erfahrung), Essen und Trinken, Wetter des Tages, Gewicht; Landschaft oben, persönlicher Satz, gleiche Strecke als Balken, 4 grosse Werte, zwei Spalten, HF-Zonen mit Satz, Tagebuch «Was von dieser Tour bleibt»; Packen zeigt Kleidung bei ähnlichem Wetter | PR #218 |
| 19 | Aktiv «Sport-Kacheln» | 0.168.0 | Kacheln unter «Heute abhaken»: Bearbeiten ›, Löschen im App-Fenster mit «Verlauf behalten» und Rückgängig, «Kachel ausblenden»; Reiter «Ziele» heisst «Aktivitäten»; «Wie geht's? Starten» öffnet den Morgen-Check | PR #218 |
| 20 | Tour planen mit GPX | 0.168.0 | Planen › Strecke: feines, zoombares Profil nach Steigung gefärbt, Liste «Anstiege» mit Mindesthöhe, Steigung pro 100 m und Notiz pro Anstieg | PR #218 |
| 21 | KI-Schlüssel-Hinweis | 0.168.0 | Kein falscher Hinweis «KI-Helfer-Schlüssel läuft ab» mehr auf Heute und in «Wartet auf dich»; Schlüssel-Hinweise nur unter Ich › App-Wartung | PR #218 |
| 22 | Aktiv neu | 0.168.0 | «Deine Woche in Zahlen» (Schlaf, Ruhepuls, Aktivzonen-Minuten) statt «Velo diesen Monat», Verlauf als Tagebuch mit Fitbit, Puls und Watt, Kacheln abhaken kleiner, Auswertung zeigt Messwerte | PR #218 |
| 23 | Kartengrund wählen | 0.168.0 | Ein Kartengrund für alle Karten (Rennen, Live, Tour, Spur, Messen, Standbilder), neu «Velokarte» (CyclOSM); Google Maps und OsmAnd gehen bei 0 Kosten nicht | PR #218 |
| 24 | Strava «Zum Prüfen» und Chronik | 0.168.0 | Ältere Fahrten im Startwert des Velos oder mit gezähltem Zwilling gehen als «nicht gezählt» zum Velo (mit Rückgängig) statt in «Zum Prüfen»; Chronik zeigt in vollen Monaten 7 Tage, dann «n weitere Tage zeigen» | PR #218 |
| 25 | N1 Neue Leiste | 0.169.0 | Leiste Heute · Planen · Touren · Auswerten · Velos (Brainstorming 20.10.2026, Noah «1a 2a»): Planen = Woche, Woche planen, Ferien, Termine, Notizen; Auswerten = Aktiv mit Fahrten und Erkenntnissen; Material und Ausrüstung teilen am Handy den Platz von Velos (Umschalter Velos · Ausrüstung · Material); alle Adressen bleiben. Dazu UI-Ziele #6 (Ich nur Daten, Einstellungen, Hilfe; Eingang, Mail, Kompass, Alltag, Freie Zeit unter Planen; Wi gaht's?, Was mir gut tut, Gewicht unter Auswerten), Handy kürzer (Noch einplanen, Jetzt fällig, Werkstatt-Besuche: 5 Zeilen, dann «Noch n zeigen») und #7 Längenbudget (src/lib/laenge.js, Test handy-laenge.spec.js) | live |
| 26 | Heute neu N2 | 0.169.0 | Noah «5a»: oben «Dein Körper heute» (Ruhepuls, Schlaf, Schlaf-Score, Aktivzonen-Minuten neben gestern) mit Morgen- bzw. Abend-Check, daneben/darunter «Aktiv heute» zum Antippen; dann Woche, Balance-Ring, Tour, «Jetzt dran» (nur wenn etwas dran ist), Velos, 8 Abkürzungen | live |
| 27 | UI-Grundlagen | 0.169.0 | Wärmere Farben (Salbei statt Farbe pro Ort), eine Schrift, runde Knöpfe, ruhigere Karten; Packtag mit «Schon gepackt», Velopflege Offenes zuerst; Tipp des Tages unter dem Inhalt (9 Seiten), Velopflege am Handy 5 Teile dann «Noch n zeigen», Touren-Kopf ein Knopf und «Rennen ›», Material-Kopf ein Satz mit Kacheln | live |
| 28 | Live-Karte ohne Absturz | 0.168.0 | Kein automatisches Neuladen während einer Aufzeichnung; nach einem Neuladen läuft die Fahrt weiter (höchstens 20 Min.); OpenStreetMap-Abfragen nacheinander | PR #218 |
| 29 | Tour-Auswertung mit Garmin-Werten | 0.170.0 | Tour-Seite › Werte: Stopps, NP, Bestwerte 1/2/5/10/20 Min für Leistung und Puls, Ruhepuls (Fitbit) am Tour-Tag mit «deinem Normal», Punktbild Ruhepuls gegen NP; feinere Kartenlinie; Profile wie komoot; Teil «Analyse» wie Strava und Garmin Connect | live |
| 30 | Check-Fragen selbst bearbeiten | 0.170.0 | Fragen und Bereiche ändern, löschen, sortieren, hinzufügen; 50 Musterfragen (aus, Tag «Muster»); «Was mir gut tut», «Wi gaht's? · 15 Fragen» | live |
| 31 | Tagebuch | 0.170.0 | #/tagebuch wie Day One: Einträge mit Fotos, Diktat, Frage des Tages, Tags als Gruppen, Code-Sperre, Erinnerung | live |
| 32 | Erster Start mit Beispielen | 0.170.0 | Neue leere App fragt einmal «Mit Beispielen» oder «Leer»; Beispiele entfernen/holen unter Ich › Daten; Rundgang; Noahs Daten bleiben unberührt | live |
| 33 | Heatmap | 0.170.0 | Touren › Rückblick › Heatmap: alle Fahrten auf einer Karte, Wolken oder Linien, Filter nach Jahr, Sportart, Velo, Tour/Alltag | live |
| 34 | Zürisee und Sauna | 0.170.0 | Kaltbade-Skala mit änderbaren Grenzen, «Sauna und See heute?», Tagesmittel, Server-Fix Zürisee-Daten | live |
| 35 | Form und Erholung | 0.170.0 | Bereitschaft 0–100 oben auf Aktiv, Seite «Form und Erholung» (12 Wochen, Tour-Bereitschaft), Übersicht wie Garmin, Seiten pro Sportart und Puls | live |
| 36 | Live-Karte Teile 1–3 | 0.170.0 | Pause und Auto-Pause, Bluetooth-Sensoren, Datenseiten, Abbiegehinweise, Runden, «Gegen deine letzte Fahrt», mehr Orte, ÖV, Ride with GPS, SchweizMobil, Teilen-Bild, Abgleich ohne Strava-Fragen | live |
| 37 | Umweg neu planen | 0.170.0 | Live-Karte «Neu planen zu …» und langes Drücken: Umweg und Rückweg über BRouter, GPX für Garmin | live |
| 38 | Von der Haustür bis zurück | 0.170.0 | Gut angekommen, Plan B, Check-in, Velo geparkt; Unterwegs mit 2 Knöpfen mehr | live |
| 39 | Abgleich bleibt ruhig | 0.170.1 | interne Werte gleichen sich selbst ab, «Später» = 1 Stunde Ruhe | live |
| 40 | Verschleiss pro Teil | 0.171.0 | Seite «Verschleiss», Werkstattbesuch pro Teil, Kette auf einen Blick, Handy-Erinnerung «Teile abgenutzt» | online 21.10. |
| 41 | Bilder in der App | 0.171.0 | Setup-Zeitleiste, mehrere Fotos pro Problem mit Zuschneiden und PDF, Tour-Foto | online 21.10. |
| 42 | Wetter-Kern | 0.171.0 | bester Start, Landi-Radar, Webcams, Wind, Energie, «Zeit zu essen», GPX mit Stopps, Zürisee-Chip | online 21.10. |
| 43 | Körperwerte und Fitbit überall | 0.171.0 | 25 Werte in 5 Gruppen, Blutdruck und Wasser selbst, Fitbit im Check, auf Heute und in Erholung | online 21.10. |
| 44 | KI im Gerät | 0.171.0 | Sprachmodell auf dem Handy für offline, online weiter der KI-Helfer | online 21.10. |
| 45 | Aus jeder Tour lernen, Schneller packen, Schlafplätze | 0.171.0 | Pakete Z, SP und U4; Tagebuch unter Planen; See-Prognose robuster | online 21.10. |
| 46 | Velo im Griff | 0.172.0 | Kette nach Regen (Handy), Verschleiss-Fotos, Inserat, Velobox, Ersatzteile, km pro Marke, Frühlings-To-do, Kettenrotation; Heute-Fenster wartet auf Noahs OK | PR #224 |
| 47 | Notizen wie Evernote | 0.172.0 | zeichnen, formatieren, Dateien, Scannen, Webseite offline, Texterkennung, Erinnerung, Papierkorb, frühere Fassungen | PR #224 |
| 48 | Suche mit Sprache und Antworten | 0.173.0 | Befehle sprechen («Kette geölt», «Gewicht 72») mit Rückgängig, Fragen aus den eigenen Daten, Geräte-KI hinter eigenem Schalter, «Wetter Chur», Einstellungen unter Ich › Suche | live |
| 49 | Webcams auf der Live-Karte, Glätte-Push | 0.173.0 | Webcam mit Ort als Punkt auf der Live-Karte, «Glätte am Morgen» (Okt–Apr), Eis-Warnung im Wetter am Tourtag | live |
| 50 | Eigene Werte und alle Daten anpassbar | 0.173.0 | Ich › Eigene Werte: Werte umbenennen, löschen (Standard gilt wieder, «Gelöschte Werte» holt sie zurück), sortieren, eigene Erinnerungen «alle N km oder N Tage» in Velos › Pflege; eigene Körperwerte aus eigenen Fragen mit Zahl unter Körperwerte › Eigene; Listen und Typen neu mit Kartenpunkt-Arten, Velo-Arten, Abwesenheiten, Tagebuch-Fragen und -Stimmungen, Stimmungen nach dem Meditieren; die letzten Browser-Fragen (confirm) im App-Fenster | live |
| 51 | Klarer und einheitlich (Impeccable) | 0.174.0 | Handy höchstens vier Reiter, Rest unter «Mehr»; Computer Seitenleiste statt Reiter; ein Wort pro Sache (Teile, Backup speichern, Rückblick, Tourart); kürzere Seiten, zwei Spalten am Computer; Woche mit Rückgängig | #226, online 21.10. |
| 52 | Auswertung wie Training (Fahrt-Analyse 1+2) | 0.174.0 | Aktiv › Ziele › Auswerten: Haken und Check-Antworten wie eine Fahrt ausgewertet (Kacheln, Wochen, Wochentage, Tageszeit, Verlauf, Bestwerte, Monate) | #226, online 21.10. |
| 53 | App selbst gestalten («Anpassen») | 0.175.0 | Jede Seite: «Diese Seite anpassen» am Ende (Teile zeigen, verstecken, sortieren, umbenennen; Start-Reiter); Menü sortieren und verstecken; «Wie am Anfang»; nur auf diesem Gerät | #227, online 21.10. |
| 54 | Heute: Körperwerte und Countdown | 0.175.0 | Kachel «Körperwerte» (Ruhepuls, HRV, Schlaf, Schritte, Aktivzonen-Minuten, Kalorien) und erster Chip mit den Tagen bis zur nächsten Tour (Noah 21.10. 06:49) | #227, online 21.10. |
| 55 | Zeichnen auf allen Fotos | 0.175.0 | Knopf «Zeichnen» auch auf Setup-, Problem-, Pack-, Verschleiss- und Tagebuch-Fotos; das oberste von drei Fenstern schliesst nur sich selbst | #227, online 21.10. |
| 56 | Eine Tour, eine Seite | 0.176.0 | Fünf Reiter auf jeder Tour: Planen · Packen · Unterwegs · Rückblick · Auswertung; «Fehlt noch» in Planen; Countdown-Chip und Satz mit Zahl; nur vorhandene Werte; «Fahrt verbinden»; Lernschleife nach der Tour; Fahrt-Analysen aus dem Training in der Tour-Analyse | #231, online 21.10. |
| 57 | Reste | 0.176.0 | Bikepark-Tage als Baustein; alle Taschen nebeneinander ab 1100 px (aus); Tour- und Rechnungsformular mit Fehler am Feld; Notizen zeigen .odt/.odp/.ods/.rtf | #231, online 21.10. |
| 58 | Wie Strava (Tour-Auswertung 1+2) | 0.177.0 | Rückblick und Analyse wie auf Strava (Übersicht, Peak Power, Karte, Zonenfarben), Fahrtzeit «2:58 h» bzw. dd:hh:mm:ss, eigene FTP, NP aus den Wattdaten; Zeitleiste aus Strava (Pausen, Bestzeiten, Anstiege, Fotos), lesbarer Tourname statt Dateiname, Vorlage und Erinnern unter «…», Ausrüstung nur Ausnahmen, Wetter beim Start jeder Fahrt | dieser PR |
| 59 | Tages-Check mit Datum und Uhrzeit | 0.177.0 | Jeder Check zeigt Datum und Uhrzeit; kein Mittagsfenster; ✕ = «Heute nicht» | dieser PR |
| 60 | Gesamttest 21.10. (C1–C9) | 0.177.0 | Kürzere Seiten am Handy, lange Vorlagen gefaltet, englische Namen und Strava-Namen auf Deutsch, «Fertig gepackt» | dieser PR |
| 61 | Packliste aufräumen, Ess-Erinnerung | 0.177.0 | Bausteine › Aufräumen (Immer dabei, Tagestour-Knopf, Licht, Kälte-Stufen); Ess-Erinnerung wählbar auf der Fahrt-Karte | online 21.10. |
| 63 | Packen und Strom (Mockup-Paket P1) | 0.179.0 | Packen › Material ergänzen: Knopf «Neues Teil erfassen und einpacken» (NP1); Teil › Strom: Akku, Leucht- und Ladezeit mit Quelle (Hersteller, Test, gemessen, gerechnet, Annahme), halb und viertel gerechnet, Leuchtstufen, Ladezeit mit Stoppuhr (L1, L4); Grundwert mAh beim Erfassen als «Annahme» (L2); Flickzeug mit «Batterie» im Inhalt ist kein Gerät mehr | nach 0.178 |
| 62 | Skitour (Mockup-Paket P2) | 0.178.0 | Skitouren › Tour planen: Gefahrenstufe 1–5 mit Unterstufe und Satz, «Dein Morgen», Verhältnisse, Plan in Zahlen; «Gipfel erreicht» unterwegs; Nach der Tour «Plan und Wirklichkeit» und dein Material; Skitouren › Saison: Ziel, Wunschtouren, Skitage 8 Wochen, LVS-Übungen, Kurse mit «Auffrischen», Höhenmeter pro Ski, letzte Saison; Vorabend-Check zeigt Stufe, Temperatur, Wind, letzten Zug | dieser PR |

«Frontend aufpeppen» ist pausiert (Noah 19.10.2026). Die Abschnitte unten sind der Stand vom 18.10.2026.

Diese Seite ist der Einstieg: was die App ist, was heute online ist, was fertig gebaut auf die Veröffentlichung wartet, in welcher Reihenfolge es kommt und was danach geplant ist. Wie das Projekt bis hierhin gewachsen ist, steht in der [Geschichte](geschichte.md). Einzelheiten stehen in den Dokumenten, die unten verlinkt sind.

Grundlage: `main` auf GitHub, die offenen Pull Requests und die Paket-Notizen der Claude-Sitzungen (Stand 18.10.2026, 19:45 UTC). Was dort nur geplant ist, ist hier als «geplant» oder «gebaut, nicht live» markiert. Versionsnummern noch nicht veröffentlichter Pakete sind vorläufig.

## 1. Worum es geht

Der Pack Generator ist Noahs persönliche Web-App (PWA). Sie läuft im Browser am Computer und am Handy, auch offline. Alle Daten liegen nur auf dem Gerät (IndexedDB), es gibt kein Konto.

**Leitsatz (seit 13.10.2026):** «Eine App, die mich im Alltag unterstützt.»

Angefangen hat sie als Packliste für Bikepacking-Touren. Heute deckt sie den ganzen Ablauf einer Tour ab (planen, packen, unterwegs, Rückblick), dazu Velopflege und Training, Aktivitäten und Meditation, Rechnungen und Notizen.

**Die fünf Ziele** (aus [vorhaben.md](vorhaben.md); «Alltag» kam am 19.10.2026 dazu, alle Vorhaben stehen in der [Liste](vorhaben-liste.md)):

1. **Schneller packen:** Vorschläge statt leerer Listen.
2. **Das Velo im Griff haben:** km, Verschleiss und Pflege pro Velo.
3. **Von der Haustür bis zurück:** eine Startseite, die zur Phase der Tour passt.
4. **Aus jeder Tour lernen:** Rückblick und Learnings, die beim nächsten Packen wieder auftauchen.
5. **Alltag:** Woche, Termine, Bewegung und Erholung, Dokumente und Geld, Menschen und Zuhause.

**Grundsätze, die immer gelten:** Alles ist ein Vorschlag, nie Pflicht, immer änderbar. Private Daten bleiben auf dem Gerät und nie im öffentlichen Repository. Es entstehen keine Kosten (nur Gratis-Dienste). Wo eine eigene, schlanke Lösung reicht, kommt kein fremder Dienst dazu.

## 2. Was heute online ist (0.144.0)

Die App hat **fünf Orte**. Am Computer stehen sie in der Seitenleiste, am Handy in der Leiste unten. Oben rechts ist «Ich».

| Ort | Was dort ist |
|---|---|
| **Heute** | Gruss, «Wi gaht's?», Tour-Karte nach Phase (planen, packen, unterwegs, Rückblick), Kachel-Wand zum Anpassen, «Diese Woche», fällige Velopflege, Schnellstart für eine Tour heute, «Was ist neu» |
| **Touren** | Übersicht mit Zuständen (geplant, abgeschlossen, bewertet), neue Tour mit Rahmenbedingungen (Sportart, Wetter, Vorlage), Planen mit Karte, Packen Tasche für Tasche, Unterwegs, Rückblick mit Learnings, Tempo und Logbuch, Vorlagen |
| **Material** | Liste aller Teile mit Gewicht, Kleiderschrank nach Schichten, Bausteine (z. B. Biwak, Kochen, Regen), Einkauf |
| **Velos** | Übersicht pro Velo, Pflege mit «Jetzt fällig», Fahrten-Buch (Strava-Verbindung und Datei-Import), Velo-Blätter (Velo-Pass, Service-Plan, Werkstatt-Auftrag), Werkstatt und Belege, Ausstattung, Setup |
| **Aktiv** | Aktiv heute mit Woche, Erholung und Sporttasche, Meditation mit Timer, Training aus Strava, Ziele, Aktivitäten, Meilensteine und Trophäen |
| **Ich** | Daten und Backup, Darstellung (Schriften, Farbwelten, hell/dunkel), Was ist neu, Handbuch, Kleine Apps, Listen und Typen, Bezahlen (QR-Rechnung, «Zu zahlen»), KI-Helfer (ab Werk aus), Inspiration, Notizen und Eingang, Ausprobieren (Spielwiese) |

Die zuletzt veröffentlichten Versionen (alle am 14. und 15.10.2026):

| Version | Inhalt |
|---|---|
| 0.144.0 | **Regeln einheitlich:** eine Regen-Grenze für die ganze App, «nie gebraucht» ab 3 Touren, Rückblick ohne Vorab-Häkchen, eine Tagesuhr, Pflege pro Velo |
| 0.136.0 | **Paket 2b «Sortieren, wie du willst»:** Pfeile und Ziehen in allen sortierbaren Listen, «Gilt für» bei Kategorien, eine Kachelreihe auf Aktiv › Heute |
| 0.135.0 | **Paket 2 «Ruhe, Training und Rechnungen»:** Meditation und Timer, Tipp des Tages, eine Zahl pro Sache, Training mit Pulszonen, QR-Rechnung mit TWINT |
| 0.134.0 | **Paket 1 «Doku und Ich»:** Handbuch und Kleine Apps unter Ich, Inspiration sammeln, Listen und Typen, leere App ohne Start-Taschen |
| 0.133.0 | **Design-Refresh:** Begrüssung, «Wi gaht's?», ruhigere Seiten, Kacheln antippbar |
| 0.131.0 bis 0.132.2 | Daten einmal bereinigt, Tagespaket 14.10. (Velo-Setup, Kluge Suche, App-Wartung, Bezahlen vorbereitet), Kamera-Knopf, drei kleine Fehlerbehebungen |

Die vollständige Liste aller Versionen steht in `src/lib/whatsnew.js` (in der App unter Ich › Was ist neu) und kurz in der [Geschichte](geschichte.md).

**Technik:** Svelte 5, Vite, Dexie (Datenbank-Stufe 11 auf `main`). Die App liegt auf GitHub Pages. Ein kleiner Server auf Vercel (Ordner `api/`, Vercel-Projekt «packgen») holt Strava-Daten, prüft Links, betreibt den KI-Helfer und bereitet das Bezahlen vor. Jeder Pull Request bekommt eine Vorschau auf Vercel (Projekt «packgenerator»). Daten zwischen Handy und Computer gehen heute über eine Sicherungsdatei.

## 3. Fertig gebaut, noch nicht online

Vom 15. bis 18.10.2026 wurde viel gebaut, aber wenig veröffentlicht. Am 18.10.2026 (19:37 UTC, Noah «1a 2b 3b 4a») wurde alles neu gebündelt: **statt 13 kleiner Pakete gibt es jetzt sechs grosse**, jedes mit einer eigenen Version. Ein Thread («Mein Überblick») fügt die Teile zusammen und veröffentlicht sie der Reihe nach.

| Reihenfolge | Paket | Version (vorläufig) | Inhalt | Stand 18.10. |
|---|---|---|---|---|
| 1 | **P3 Navigation und Standard-Velo** | 0.145.0 | Navigation ohne Springen, Standard-Velo mit ★ und Reihenfolge, lange Listen klappen zu, Schnellstart und «Wie letzte Tour» wieder da, vier Anzeigefehler | live seit 18.10.2026 (PR #182) |
| 2 | **A Daten sicher und Bedienung** | 0.146.0 | Browser behält die Daten fest, Abgleich Handy–Computer über eine Sicherung, «Alle Daten ersetzen» fragt zweimal und macht vorher ein Backup, neuer Ort «Dokumente» (Pass, Versicherung als PDF, Datenbank-Stufe 12); einheitliche Bedienregeln (siehe Abschnitt 5); Kamera-Knopf überall; Hinweistexte und mehr Inhalt in der App | gebaut, wird gebündelt |
| 3 | **B Server** | 0.147.0 | Training mit Leistung und Wochenrückblick, Fitbit verbinden (Stufe 13), Dokument fotografieren als PDF (Stufe 14), Google Kalender und Aufgaben lesen (Stufe 15), KI-Helfer mit Monatsdeckel und Assistent «Frag die App», Termine buchen, Shop, automatischer Abgleich Handy–Computer, Erinnerungen aufs Handy (Web-Push) | gebündelt am 18.10.2026 (alle neun Teile); Dokument als PDF ohne eigene Stufe (Stufe 12 von A), Google Stufe 15 |
| 4 | **D Touren und Unterwegs** | 0.148.0 | Strava-Fahrten auf der Touren-Seite, Höhenprofil, ein Weg «Fahrt hochladen» (GPX, TCX, CSV), Planungs-Notizen im Tour-Entwurf, kürzere Handy-Seiten, Fehlerbehebungen, «Deine Fahrten», einfache Wörter, Bewegung, einheitliche Formulare, Rückmeldungen beim Speichern (Löschfrage mit Rückgängig) | gebündelt am 19.10.2026; die Chronik ist noch nicht gebaut und kommt später |
| 5 | **E Material, Velos, Merken** | 0.149.0 | Dateneingabe W1–W6 (Kette messen, Reifendruck), mehr Bausteine, Bezahl-Erinnerung nur unter Ich › Bezahlen, Garmin-Seiten pro Velo, Taschen-Setups, To-dos mit Erinnerung, Geburtstage und Pflanzen, Sportarten, eigene Listen, Ort «Ausrüstung», Skitour-Saisonstart, Gipfelbuch; dazu Eigene Werte, Garmin Edge 850, Impeccable Runde 1, «Was hier steht» auf 5 weiteren Seiten, TWINT-Bildschirmfoto in Rechnungen | gebündelt am 19.10.2026 als 0.149.0, PR nach D |
| 6 | **C Heute und Aktiv** | 0.150.0 | Heute neu geordnet (HN4, PR #177; Bausteine mehr, PR #176), Tages-Check als eigenes Fenster mit Morgen-Check und Abend-Rückblick, grosser Balance-Ring mit 9 Bereichen statt der drei Im-Flow-Ringe, «Deine 15 Fragen», Routine «Das tut mir gut», Impeccable Runde 2 | gebündelt auf E (19.10.2026); Paket Aktiv und Paket Heute fehlen noch (Übertragung nötig) |
| 7 | **F Woche** | 0.151.0 | eigener Ort «Woche» (am Handy statt «Material» in der Leiste), Sonntags-Planung, Ferien mit Folgen, Google Kalender und Aufgaben in der Woche, Rundgang für den Einstieg, eine Karte «Was hier steht» pro Seite | gebündelt auf C (19.10.2026), Noah «ok f» + «1b»; PR nach C |
| 7b | **Tempo: Seiten später laden** | 0.152.0 | Alle Seiten ausser Heute laden beim ersten Öffnen, grosse Werkzeuge bei Bedarf, Build-Wächter 3 MB pro Datei; grösste JS-Datei 5,2 MB → rund 1 MB | eigenes Release direkt nach F (Noah «1a» 19.10.2026), vor G |
| später | **N Pläne und Träume** | nach F, G, L, P | Touren › Träume (Traumtouren, Jahresband mit Saison, Rennen aus Inspiration und Google Kalender als Event-Tour mit Anmeldeschluss, Tourarten als Gruppe), Ich › Mein Kompass (Ziele in Schritten, «Wie läuft's?» auch im Wochenrückblick, Ablagen Vorsätze/Träume/Nicht vergessen/Ideen, KI-Schritte ausschaltbar), Notizen verknüpfen und «Auf einen Blick», neue Notiz-Formate (Fotos, Links, Ort, Skizze, QR, Vorlagen, Formatierung, Teilen, Keep-Import, als Artikel lesen), Träume mit Foto und Karte, Push vor Anmeldeschluss, Kompass-Schritt auf Heute, Träume in Woche planen, Ich › Was kommt | gebaut auf Branch `claude/project-thread-mt00nk`, ohne Version, beim Bündler |

**Abhängigkeiten:** A kommt vor B, weil die Datenbank-Stufen aufeinander aufbauen (12 Dokumente → 13 Fitbit → 14 Dokument-PDF → 15 Google). C braucht B (Aktiv nutzt Fitbit und Training). D und E hängen nicht an B. Neue Arbeit darf parallel weiterlaufen.

**Offene Pull Requests (18.10.2026, abends):** #176 und #177 (Teile von C, eingefroren bis C dran ist), #181 (nur Tests, optional, derselbe Fix steckt in #176/#177).

## 4. Danach geplant oder nur als Idee

Diese Ideen sind besprochen, aber in keinem der sechs Pakete:

- **Neuland:** nach jeder Tour «Was war neu?», Kantonskarte, Bingo. Noah nannte es «das eigentliche Ziel».
- **Mehr selbst einstellen:** Grenzen wie «Packen ab 2 Tagen», «Backup alle 14 Tage», «Velo-Check alle 1000 km», «kalt ab 10 °C» änderbar machen. Gebaut, aber noch keinem Paket zugeteilt.
- **Links nach aussen** (komoot, SBB, MeteoSchweiz und weitere): beschrieben in [links-nach-aussen.md](links-nach-aussen.md), noch nicht gebaut.
- **Kleinere Vorschläge** zu jedem Paket (je bis zu drei), zum Beispiel Sicherung mit Passwort, Packliste als PDF, Wetter-Warnung am Tourtag, «Dein Jahr» als Rückblick im Dezember, Pflege-Zähler für Schuhe und Felle, Privat-Zone beim Teilen einer GPX. Sie sind Vorschläge und brauchen Noahs Ja.
- **Weitere Ideen** ohne Paket: Packliste vorlesen, Querformat am Lenker, kleine Experimente «Was tut dir gut», Wiedereinstieg nach langer Pause, Werkzeugkasten unterwegs.

**Bewusst nicht** (von Noah abgelehnt oder geparkt): keine native App, keine Konten für andere, keine fremden Einbettungen und Werkzeuge, keine Foto-KI für Material, kein Umzug der App auf Vercel, keine Mails an eine App-Adresse, kein Excel als Hauptliste. Fotoalbum und die Design-Pakete D2/D4 bleiben geparkt.

## 5. Wichtige Entscheide seit dem 15.10.2026

Ausführlich mit Datum im [Entscheidungslog](decisions.md#1510-bis-18102026-pakete-bedienregeln-neue-bündelung).

- **Pakete statt Einzel-PRs:** fertige Teile werden zu Paketen gebündelt, jedes Paket ist ein Release.
- **Sechs grosse Pakete** in der Reihenfolge P3 → A → B → D → E → C → F (18.10.).
- **Bedienregeln für die ganze App** (15.10., sechs Fragerunden): ein Fenster schliessen behält das Getippte, nur «Verwerfen» löscht · die zuletzt gewählte Tour und das zuletzt gewählte Velo bleiben überall gewählt (eine neue Tour nimmt aber immer das Standard-Velo, 18.10.) · am Handy kommen Fenster von unten · «Rückgängig» überall 4 Sekunden · langes Wischen fragt zuerst · eine Tour mit vergangenem Datum: Heute fragt «Bist du gefahren?» · nur der Schalter «Testtour» versteckt eine Tour · Rot steht in «Heute wichtig» zuoberst · ein Weg «Fahrt hochladen» · Zurück-Weg als Pfad «Ich › …».
- **Orte:** «Woche» wird ein eigener Ort und ersetzt am Handy «Material» in der Leiste; Velos und Ausrüstung teilen sich am Handy einen Platz mit Umschalter.
- **Rechnungs-Erinnerungen** stehen nur unter Ich › Bezahlen, nicht auf Heute.
- **Automatischer Abgleich Handy–Computer** mit einer Gratis-Datenbank auf Vercel (Google Drive als Ersatz); bei einem Konflikt fragt die App. Kommt mit dem Server-Paket.
- **Erinnerungen aufs Handy** (Web-Push) mit einem Gratis-Wecker (cron-job.org).
- **Tages-Check:** Morgen-Check und Abend-Rückblick wieder als eigene Seiten, Kachel «Deine 15 Fragen», grosser Balance-Ring auf Heute.
- **Testlink statt Mockups (18.10., 21:52 UTC, «ab sofort, überall»):** gebaut wird ohne Mockups. Zu jedem Paket bekommt Noah einen Testlink (Vercel-Vorschau) mit dem Satz «eigener Speicher, Backup hochladen zum Testen mit deinen Daten». Claude führt ein Paket erst nach Noahs «ok» für dieses Paket zusammen, mit grünen Tests und unverändertem `main`. Updates von Abhängigkeiten werden sofort zusammengeführt.

## 6. Was Noah noch tun muss

Mit Klick-Anleitung, wenn es so weit ist:

- **Vor und nach dem Server-Paket (B):** die Anleitung «Server einrichten» Teil 1–3 vor dem Merge (packgen baut danach von selbst über den Ignored Build Step, nie mehr trennen; `HELPER_MONTHLY_CHF=2`), Teil 4–8 danach.
- **Google vor dem Livegang:** Anmeldung testen, das Client-Secret erneuern, die Testanmeldung löschen, eine Datenschutzseite anlegen; Kalender und Aufgaben in der Google Cloud Console einschalten.
- **KI-Helfer:** der Schlüssel läuft am 10.11.2026 ab (eine Erinnerung ist eingerichtet).
- **Echte Nutzung:** eine echte Tour mit der App packen und die Lücken melden (Prüffrage 5 im Kurs-Check).

## 7. Wie wir arbeiten (Stand 18.10.2026)

Kurzfassung. Ausführlich in [arbeitsweise.md](arbeitsweise.md#stand-18102026-regeln-die-heute-gelten).

- Claude baut **ohne Mockups** und schickt zu jedem Paket einen **Testlink** (Vercel-Vorschau): «eigener Speicher, Backup hochladen zum Testen mit deinen Daten». Zusammengeführt wird nach Noahs «ok» für dieses Paket (seit 18.10.2026).
- Fragen an Noah: höchstens 5 pro Runde, a/b ausgeschrieben, **ohne ★-Vorauswahl**. Claude fragt und wartet.
- Jeder Release-PR hat den Abschnitt **«Was fällt weg oder rutscht tiefer»**.
- Alles wird im Projekt besprochen, **nicht mehr in Trello**.
- **Null Kosten** und **privat**: das Repository ist öffentlich, private Daten bleiben ausserhalb.
- Heute folgt dem freigegebenen Aufbau **HN4**; andere Änderungen an Heute brauchen Noahs ausdrückliches Ja.
- Sortieren geht überall mit Pfeilen **und** Ziehen. Wo man sich verlieren könnte, erklärt ein kurzer Text die Seite.

## 8. Wo was steht

| Frage | Dokument |
|---|---|
| Wie ist das Projekt gewachsen? | [Geschichte](geschichte.md) |
| Was ist geplant und warum, sind wir auf Kurs? | [Geplante Vorhaben](vorhaben.md) |
| Was kam in welcher Version? | [Projektstand im Detail](status.md) und `src/lib/whatsnew.js` |
| Was wurde wann entschieden? | [Entscheidungslog](decisions.md) |
| Wie arbeiten wir zusammen? | [Arbeitsweise](arbeitsweise.md) |
| Schnappschuss vom 14.10.2026 für Aussenstehende | [Zwischenstand](zwischenstand/README.md) |
| Wie nutze ich jede Funktion? | [Benutzerhandbuch](handbuch.md) |
| Alle Dokumente | [Projektdokumentation](README.md) |

**Pflege:** Diese Seite wird bei jedem Paket nachgeführt (Abschnitte 2, 3 und 5). Was hier steht, gilt vor älteren Angaben in anderen Dokumenten.
