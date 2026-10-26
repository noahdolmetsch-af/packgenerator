# Geschichte des Pack Generators

Stand: 26. Oktober 2026. Wie das Projekt vom 4.10.2026 bis heute gewachsen ist, in Abschnitten. Jede Version steht mit ihrem Titel in `src/lib/whatsnew.js` (in der App unter Ich › Was ist neu). Die Gründe für einzelne Entscheide stehen im [Entscheidungslog](decisions.md), der heutige Stand im [Projektstand](projektstand.md).

Versionsnummern haben Lücken: bis zum 15.10.2026 bekam jede Arbeit beim Start eine Nummer, und nicht jede Nummer wurde einzeln veröffentlicht.

## Überblick

| Zeit | Versionen | Abschnitt | Kern |
|---|---|---|---|
| 4.10.2026 | 0.1.0 bis 0.17.1 | Grundlage | Material, Velos, Taschen, Pflege, Vorlagen, Packen, erster Rückblick |
| 5.10.2026 | 0.18.0 bis 0.20.2 | Ganzer Tourablauf | Unterwegs, Startseite, Deutsch und Englisch |
| 7.10. bis 8.10.2026 | 0.21.0 bis 0.36.0 | Analyse und Roadmap | Ausgangsprüfung, Roadmap AP01–AP26, eine Navigation, neue Tour fragt zuerst |
| 8.10. bis 9.10.2026 | 0.37.0 bis 0.66.0 | Alltag und Abnahme | Rucksäcke, Heute und Menü, GPX, Kleiderschrank, Abnahme AP21–AP24, Startseite neu, Im Flow |
| 10.10.2026 | 0.67.0 bis 0.78.0 | Prinzip Nr. 1 und Fünf Orte | Übergänge, jeder km zählt, Velo-Blätter, fünf Orte, KI-Helfer |
| 11.10.2026 | 0.79.0 bis 0.96.0 | Aktiv und «App einfach» | Meditation, Meilensteine, Kachel-Wand, Alles finden |
| 12.10.2026 | 0.97.0 bis 0.116.0 | Design-Refresh | neues Aussehen für alle Seiten, Strava-Verbindung |
| 13.10. bis 14.10.2026 | 0.116.1 bis 0.132.2 | Viele kleine Bauten | Knöpfe, Schnellstart, Dateneingabe, Tages-Check, Daten bereinigt, Tagespakete |
| 15.10.2026 | 0.133.0 bis 0.144.0 | Pakete | Design-Refresh, Paket 1, 2, 2b, Regeln einheitlich |
| 15.10. bis 18.10.2026 | (nicht veröffentlicht) | Bauen und neu bündeln | sechs grosse Pakete, siehe [Projektstand](projektstand.md#3-fertig-gebaut-noch-nicht-online) |
| 19.10. bis 20.10.2026 | 0.145.0 bis 0.169.0 | Ohne Testlink online | alle Pakete live, Tempo, Rennen und Live-Karte, neue Leiste, Heute N2, wärmere Farben |
| 21.10. bis 22.10.2026 | 0.170.0 bis 0.181.0 | Grosse Bündel | Tour-Auswertung wie Strava, Tagebuch, Velo im Griff, Notizen, Suche mit Sprache, App selbst gestalten, eine Tour eine Seite |
| 22.10. bis 24.10.2026 | 0.181.1 bis 0.190.0 | Klick-Rundgang und «freigabe für alle» | keine Sackgassen, Mockup-Pakete P4–P8, Abgleich ohne Fragen, Aktiv neu, Meilensteine, Alltag im Blick |
| 25.10.2026 | 0.191.0 bis 0.198.0 | 996 Ideen | Werkstatt, Ehrlicher Stand, Ruhig und persönlich, Mit Freunden, Kleine Helfer, Kette vorausschauend |

## 4.10.2026: Grundlage (0.1.0 bis 0.17.1)

Die App entstand aus Noahs Excel-Liste für Bikepacking und einem früheren Entwurf «Bike Cockpit». An einem Tag kamen dazu: Material mit Gewicht (0.3), Velos und Taschen (0.5), Wetter (0.6), Velopflege mit Reifendruck und Dichtmilch (0.7), ein Start-Check (0.9), Vorlagen (0.10), Ziehen auf Taschen (0.11), Taschen am Velo (0.12), der erste Rückblick (0.13), ein Packtag im ganzen Bildschirm (0.14), Route und Wetter (0.15), Logbuch (0.16) und Werkstattbesuche (0.17). Von Anfang an galt: **die Daten bleiben auf dem Gerät** (0.2).

## 5.10.2026: Ganzer Tourablauf (0.18.0 bis 0.20.2)

Unterwegs-Ansicht (0.18), eigenes Tempo (0.19), Favoriten, «nie gebraucht», «Ballast weg», eine neue Startseite (0.19.6), Deutsch und Englisch (0.20.0) und eine Tour von Anfang bis Ende (0.20.1).

## 7.10. bis 8.10.2026: Analyse und Roadmap (0.21.0 bis 0.36.0)

Am 7.10. prüfte eine **Ausgangsanalyse** die Version 0.20.2 mit fünf Alltagsszenarien. Daraus entstand die [Roadmap](roadmap.md) mit den Arbeitspaketen AP01–AP26, später AP27–AP30. Wichtige Schritte:

- Skitour, Wochenende und Weltreise als Reisearten (0.21), ehrliche Gewichte (0.22).
- **Eine Navigation** Heute, Touren, Material, Velos auf jeder Seite (0.23).
- «Von 65 Klicks auf 8» (0.24.1): eine neue Tour fragt zuerst nach dem Rahmen (0.25).
- Eigene Bausteine (0.26), Vorschläge mit Quelle (0.28), Tour planen (0.30), gleiche Wörter überall (0.32), die Tage vor der Tour (0.34), Import prüfen (0.36).
- Seit 8.10. gilt die **Dokumentationsregel**: jeder Release führt Status, Entscheide und Roadmap nach.

## 8.10. bis 9.10.2026: Alltag und Abnahme (0.37.0 bis 0.66.0)

- Echte Rucksäcke (0.37), Bereit-Ampel pro Velo und Schnellknöpfe auf Heute (0.38), Vorlagen neu (0.39), ruhige Nebenseiten (0.40).
- Eine gefahrene Fahrt als GPX wird zum Learning (0.41), Kleiderschrank nach dem Zwiebelprinzip (0.42, 0.45, 0.47), Wiege-Modus (0.43), letzte 12 Monate (0.44).
- **Abnahme AP21–AP24** (0.44.1): 16 Prüffälle im Browser, 13 bestanden, 3 teilweise (Zeitmessung mit Person, Screenreader, echter Druckdialog). Siehe [Prüfregister](verification.md).
- Startseite neu (0.46), «Problem am Velo» (0.45.2), Im Flow als kleiner Start für Gewohnheiten (0.51), ein Rückblick statt fünf (0.56), Pflege-Übersicht (0.57), «Am Körper» beim Packen (0.59), Tempo in einem Satz (0.61), Velo-Masse (0.65), Bausteine neu (0.66).
- Am 9.10. abends kam die **Arbeitsweise**: vor jedem Release Mockups, Noahs Prüfung und a/b-Fragen.

## 10.10.2026: Prinzip Nr. 1 und Fünf Orte (0.67.0 bis 0.78.0)

- **Prinzip Nr. 1** (Noah, 10.10.): Überblick zuerst, Plan, Mockups für jedes Paket, Freigabe durch Noah, Noah merged, nach jedem Schritt dokumentieren. Dazu entstand [vorhaben.md](vorhaben.md) als Massstab für den Kurs-Check.
- Übergänge Teil 1 (0.67): immer ein nächster Schritt zwischen Planen, Packen, Unterwegs und Rückblick.
- «Jeder km zählt» (0.68): Fahrten-Buch pro Velo mit Strava-CSV und Garmin-FIT. Velo-Blätter (0.69, 0.70).
- Ruhige Startseite mit Fotoband (0.73), ein Umbenennen-Blatt überall (0.75).
- **Fünf Orte** (0.76, 0.78): Heute, Touren, Material, Velos, Aktiv; «Ich» oben rechts. **KI-Helfer** eingeschaltet (0.77), mit einem Monatsdeckel.

## 11.10.2026: Aktiv und «App einfach» (0.79.0 bis 0.96.0)

- Aktiv mit Aktivitäten und Meilensteinen (0.79), Meditation in drei Teilen (0.81, 0.84, 0.86, 0.93).
- «App einfach»: Spielwiese und Testdaten aufräumen (0.88), Rückblick antippen (0.92), Velo kurz (0.95), Import ohne Doppelzählung (0.91).
- Kachel-Wand auf Heute (0.94), «Was die App kann» mit Suche (0.96).
- Noah bekam eine Übersichtsseite «Mein Überblick» mit allen Ideen und ihrem Stand (ausserhalb des Repos).

## 12.10.2026: Design-Refresh (0.97.0 bis 0.116.0)

In einem Tag bekam jede Seite ein neues Aussehen: Farbwelt Salbei und Schrift Inter (0.97), heller Kopf und Seitenleiste (0.98), weiche Ecken und 44-px-Tippflächen (0.99), Schritte und Weiter-Leiste (0.100), danach Heute, Material, Touren, Velos, Packen, Aktiv, Ich und Rückblick (0.101 bis 0.109). Dazu «Was ist neu» (0.110), Vorabend-Check (0.111), Rahmenbedingungen einer neuen Tour (0.114) und die **Strava-Verbindung** über den eigenen Server (0.116).

## 13.10. bis 14.10.2026: Viele kleine Bauten (0.116.1 bis 0.132.2)

- Knöpfe, die sich erklären (0.117), «Was ist neu» neu erzählt und KI-Helfer ab Werk aus (0.118), Tour mit einem Klick (0.119), Strava-Fahrten zählen mit (0.121), Werte in einem Gang (0.122), Trophäen-Vitrine (0.123), Bausteine als Knöpfe (0.124).
- Am 13.10. wurden alle offenen Mockups freigegeben und der **Leitsatz** festgelegt: «Eine App, die mich im Alltag unterstützt.» Trello wurde aufgegeben, alles läuft im Projekt.
- **Daten einmal bereinigt** (0.131): Persönliches aus dem Code, Listen an einem Ort ([daten.md](daten.md)).
- **Tagespaket 14.10.** (0.132): Tages-Check Schritt 1 und 2, Aktiv mit Woche, Erholung und Sporttasche, drei Tour-Zustände, Velo-Setup, Kluge Suche, Bezahlen vorbereitet, Kleine Apps, Handbuch.
- Kamera-Knopf (0.131.3) und drei schnelle Fehlerbehebungen (0.131.1, 0.132.1, 0.132.2).
- Neue Regeln am 13. und 14.10.: keine ★-Vorauswahl mehr bei Fragen, null Kosten, jeder PR hat «Was fällt weg oder rutscht tiefer», und ab 14.10. abends **zuerst bauen, dann Bilder der fertigen App** statt Mockups vorher. Ein Schnappschuss für Aussenstehende steht im [Zwischenstand](zwischenstand/README.md).

## 15.10.2026: Pakete (0.133.0 bis 0.144.0)

Statt vieler einzelner Pull Requests wurden fertige Teile zu Paketen gebündelt, jedes Paket ein Release:

- 0.133.0 Design-Refresh: Begrüssung, «Wi gaht's?», ruhigere Seiten.
- 0.134.0 Paket 1 «Doku und Ich»: Zwischenstand, Release-Analyse, Handbuch und Kleine Apps, Inspiration, Listen und Typen.
- 0.135.0 Paket 2 «Ruhe, Training und Rechnungen»: Meditation und Timer, Inhalte Flow, eine Zahl pro Sache, Training, QR-Rechnung.
- 0.136.0 Paket 2b «Sortieren, wie du willst».
- 0.144.0 «Regeln einheitlich».

Am Abend beantwortete Noah sechs Fragerunden zu Bedienregeln und legte den Paketplan P3 bis P13 fest. Seither gilt auch: Claude führt ein Paket zusammen, sobald Noah die Bilder gesehen und «ok» geschrieben hat.

## 15.10. bis 18.10.2026: Bauen und neu bündeln

Vom 15. bis 18.10. stand die Arbeit wegen des Nutzungslimits zeitweise still. Gebaut wurden in dieser Zeit fast alle Teile von P3 bis P13. Am 18.10.2026 legte Noah die neue Bündelung in **sechs grosse Pakete** fest (P3 → A → B → D → E → C → F). Was sie enthalten, steht im [Projektstand](projektstand.md#3-fertig-gebaut-noch-nicht-online).

## 19.10. bis 20.10.2026: Ohne Testlink online (0.145.0 bis 0.169.0)

Am 19.10.2026 entschied Noah «ohne testen, direkt online stellen»: ein Paket geht online, sobald die Prüfungen auf GitHub grün sind. Die sechs Pakete und alle Zusatzpakete kamen so in zwei Tagen online, dazu «Tempo» (Seiten laden erst beim Öffnen). Bis zum 20.10.2026 kamen Rennen und Live-Karte (0.159.0), Verpflegung (0.160.0), Tour-Seiten (0.161.0), zwei Gesamttest-Runden, automatische Tests in der Nacht und die neue Leiste Heute · Planen · Touren · Auswerten · Velos (0.169.0). Heute bekam den Aufbau N2 mit «Dein Körper heute» oben.

## 21.10. bis 22.10.2026: Grosse Bündel (0.170.0 bis 0.181.0)

Noah fragte am 20.10.2026 abends: «denkst du nicht, dass wir Pakete schnüren können?» Seither fasst ein Bündler-Thread alles Fertige in wenige PRs mit einem Testlauf. So kamen Tour-Auswertung wie Strava, Check-Fragen selbst bearbeiten, Tagebuch, Heatmap, Form und Erholung, Verschleiss pro Teil, Notizen wie Evernote, Suche mit Sprache, «Diese Seite anpassen» und «Eine Tour, eine Seite» online. Die offenen Mockups wurden als Pakete P1 bis P8 gebaut (Packen und Strom, Skitour, Heute ergänzen, Warum? und Regeln).

## 22.10. bis 24.10.2026: Klick-Rundgang und «freigabe für alle» (0.181.1 bis 0.190.0)

Ein Klick-Rundgang durch die ganze App fand Sackgassen, tote Knöpfe und versteckte Funktionen. Daraus wurden «Alltag ohne Sackgassen», «Aktiv ohne Sackgassen» und «Alles finden». Am 24.10.2026 gab Noah alles Geparkte frei («freigabe für alle») und entschied eine halbe Stunde später, dass nichts mehr seine Freigabe braucht: Testlink ja, «ok» nein, möglichst wenige Pakete. Am selben Tag kamen der Abgleich ohne Fragen (0.186.1), Aktiv neu mit eigenem Platz für Auswerten (0.187.0), Meilensteine als Belohnung und die ersten Ideen aus der Sammlung «996 Ideen» (Generalprobe, Gut ankommen). Mit «332 Use Cases» bekam jede Funktion eine Heimseite, die ein Test bewacht (Sichtbar-Wächter, 0.190.0).

## 25.10.2026: 996 Ideen (0.191.0 bis 0.198.0)

Die «996 Ideen» kamen in der Reihenfolge B → A → C → D: Die Werkstatt, klar (0.191.0), Ehrlicher Stand (0.192.0), Ruhig und persönlich (0.193.0), Zusammen mit Freunden ohne Konto (0.194.0), Kleine Helfer für Tour und Velo (0.195.0). Die Veröffentlichung blieb einen Tag rot, weil Heute am Sonntag in den Tests von selbst den Wochenrückblick öffnete; PR #252 machte die Tests unabhängig von der Uhrzeit. Am Abend kam «Kette vorausschauend» (0.198.0). Noah wählte 63 der 76 übrigen Einzelideen zum Bauen, und die Gruppen-Live-Karte ist gebaut (PR #253).

## Was wir dabei gelernt haben

- **Viele kleine PRs stauen sich.** Ein offener PR nach dem anderen veraltet, wenn `main` sich bewegt. Darum zuerst Tagespakete, dann Pakete, jetzt sechs grosse Pakete mit klarer Reihenfolge.
- **Doku hinkt hinterher, wenn sie nicht im PR mitkommt.** Darum gilt seit 8.10. die Dokumentationsregel, und seit 18.10. gibt es mit dem [Projektstand](projektstand.md) einen Einstieg, der bei jedem Paket nachgeführt wird.
- **Bilder der fertigen App sparen Runden.** Mockups vor dem Bau führten zu doppelter Arbeit; seit 14.10. zeigt Claude die fertige App.
- **Gleiche Regeln überall** (Fenster, Rückgängig, Auswahl merken) machen die App ruhiger als jede einzelne neue Funktion.
- **Tests dürfen nicht von der Uhrzeit abhängen.** Ein Fenster, das nur sonntags erscheint, hat am 25.10.2026 einen ganzen Tag Veröffentlichungen blockiert.
- **Wenige grosse Bündel statt vieler PRs.** Ein Bündler und Auto-Merge bringen fertige Arbeit schneller online als einzelne Freigaben.
- **Echte Nutzung bleibt der Taktgeber.** Prüffrage 5 im Kurs-Check («wurde die letzte grössere Version schon echt benutzt?») ist noch offen.
