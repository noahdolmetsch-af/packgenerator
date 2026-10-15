# 4. Entscheidungen seit 0.96

Stand 14.10.2026. Zurück zur [Übersicht](README.md).

Zusammenfassung der Entscheide, die Noah seit dem 11.10.2026 getroffen hat. Die Einzelheiten pro Release stehen in [decisions.md](../decisions.md). Uhrzeiten sind UTC, wenn nicht anders vermerkt.

## A. Ziel und Richtung

| Datum | Entscheid | Warum |
|---|---|---|
| 13.10. | **Neuer Leitsatz:** «Eine App, die mich im Alltag unterstützt.» Packen und Touren bleiben wichtig. | Die App wird zum täglichen Begleiter, nicht nur vor Touren. |
| bisher, gilt weiter | **Vier Ziele:** schneller packen; das Velo im Griff; von der Haustür bis zurück; aus jeder Tour lernen. | Massstab für jedes neue Paket ([vorhaben.md](../vorhaben.md)). |
| 11.10. | **Null Kosten:** GitHub, Vercel und KI dürfen nichts kosten, notfalls fällt eine Funktion weg. | Hobby-Projekt. |
| 11.10. | **Alles bleibt ein Vorschlag:** nie zwingend, immer abwählbar. 12.10. ergänzt: jeder Vorschlag wählbar, mit Alternativen und auf Wunsch als Challenge. | Die App soll helfen, nicht bevormunden. |
| 13.10. | **Drei Tour-Zustände überall:** Geplant, Abgeschlossen (importiert), Bewertet, klar unterscheidbar. | Man sieht sofort, was noch fehlt. |
| 13.10. | **Reihenfolge der Ideenbündel:** 1 «Wi gaht's?» und Daten (danach Fitbit), 3 «Klar und ruhig» (Regeln sichtbar, Listen, Touren-Seite), 2 Sportarten (mit Skitour), 4 Links nach aussen. | Abends am 13.10. von Noah festgelegt. |
| 14.10. | **Meditation vor dem Bündel Gesundheitsdaten** (Antwort 4a der Release-Analyse). | Meditation war seit 0.107 versteckt und ist Noah wichtig. |

## B. Arbeitsweise (wie Claude und Noah zusammenarbeiten)

Die Regeln wurden in diesen Tagen mehrmals angepasst. **Gültig ist der Stand ganz unten in jeder Zeile.**

| Thema | Verlauf | Gilt heute |
|---|---|---|
| Bilder zuerst | 10.10. Prinzip Nr. 1: Mockups für jedes Paket. 11.10. verschärft: jedes einzelne Bild braucht Noahs ausdrückliche Freigabe vor jedem PR. 13.10. 17:18: Noah gibt alle bis dahin gezeigten Bilder auf einmal frei. | Jede sichtbare Änderung: Bilder (Computer 1440 px, Handy 390 px, nur hell), Freigabe mit «… freigegeben», erst dann bauen. Ausnahme nur, wenn Noah «ohne Bilder» sagt. Unsichtbare Fehlerbehebungen brauchen keine Bilder. |
| Wer merged | 10.10. 13:52 Claude darf selbst; 14:16 zurück: Noah merged. 12.10. abends kurz wieder Claude. 13.10. 16:24: «ich veröffentliche alles selber». | **Noah merged jeden PR selbst.** Claude merged nie. |
| Wie oft ein Release | 11.10. «schneller werden»: kleine Releases. 13.10. ca. 17:13: **ein Paket pro Tag.** | Grüne PRs gehen an die Koordination; der Thread «Mein Überblick» bündelt sie gegen 20 Uhr (Zürich) zu einem Tagespaket mit einem Link und einer Vorschau. Ausnahme: PRs, die Noah einzeln freigibt. |
| Fragen an Noah | Früher mit ★-Empfehlung, Claude durfte bei Schweigen ★ annehmen. 13.10. 18:36: **keine ★-Annahmen mehr.** | Höchstens 5 Fragen pro Runde, a/b ausgeschrieben, ohne Vorauswahl. Fragen und warten, nie für ihn entscheiden. |
| Was wegfällt | 14.10. 04:25 (Release-Analyse, Antwort 3a) | **Jeder PR hat den Abschnitt «Was fällt weg oder rutscht tiefer»** («Nichts» ist erlaubt). |
| Stopp | 11.10. 18:05 «bitte sofort stoppen», 22:08 aufgehoben. 14.10. 02:13 alles stoppt ausser Datenbereinigung, 02:54 aufgehoben. 14.10. 05:38 GitHub-Stopp für alle Projekte, 09:59 aufgehoben. | Noah kann jederzeit alles oder nur GitHub stoppen; nur er hebt den Stopp auf. Dann pausiert auch die abendliche Tagespaket-Routine. |
| Wo alles steht | 09.10. Trello als Ablage. 13.10.: **alles im Projekt, kein Trello mehr.** | Eine Übersichtsseite «Mein Überblick» mit allen Ideen und ihrem Stand. Bilder auf Mockup-Seiten bei Claude. |
| Ruhig bleiben | 13.10. | Claude meldet sich nur mit Ergebnis, Blocker oder Frage, kurz und auf Deutsch. Fragt Noah «was ist offen», höchstens 3 Punkte. |
| Ideen | 11.10. «Idee:» wird eine Zeile in der Sammlung. 13.10. | Jeder Release bringt höchstens 3 Ideen-Vorschläge mit; keine Idee darf verloren gehen. |
| Tests | 11.10. «1-5 a» | Lokal nur eigene und betroffene Tests, der ganze Gesamttest läuft auf GitHub. Wackelnde Tests bekommen einen eigenen kleinen Release. Nie einen Test abschwächen. |
| Gleichzeitige Arbeit | 14.10. | Jeder Thread schickt vor dem Hochladen seine Dateiliste an die Koordination, damit sich Pakete nicht überschreiben. |

## C. Produktentscheide (Auswahl)

### Alles finden und Kalender (11.10., Grundlage für spätere Pakete)
- «Kalender» wird ein eigener Ort mit Agenda, Merken, Ablage, Eingang. Eigene To-dos stehen vorne; was die App schon weiss (Touren, Velo-Fristen, Backup), kleiner darunter.
- Termine zuerst als .ics-Dateien hinein und hinaus; Google privat lesend später.
- Wiederholen nach Zeit **und** nach Kilometern (zum Beispiel alle 300 km).
- 14.10.: Merken bekommt seinen Platz unter Kalender › Merken (Antwort 1a, Plus-Menü-Runde).

### Design-Refresh (12.10.)
- Allem anderen vorgezogen; Dunkelmodus bleibt; die alten Farbwelten bleiben wählbar, «Salbei» ist Standard.
- Konfetti beim Fertigpacken (ersetzt die frühere Regel «kein Konfetti»).
- Strava bleibt zusätzlich als Datei-Import.

### Touren
- «Rahmenbedingungen» statt «Neue Tour» (12.10., B1–B3).
- Bausteine nur beim Packen wählen; Reparatur unterwegs höchstens 8 Teile (12./13.10., B4/B5).
- Schnellstart ersetzt «Tagestour jetzt» (13.10., Q1–Q3; am 14.10. bestätigt: die alte Tagestour geht ganz).
- Neue Reiseart «Velo» für normale Fahrten wird Standard; Bikepacking nur mit Übernachtung und Gepäck (13.10.; Bilder TA1–TA3 pausiert, weil die Sportarten neu gedacht werden).
- «Für nächstes Mal»-Hinweise erscheinen nur, wenn sie zur neuen Tour passen (zum Beispiel «Handschuhe zu dünn» nur bei Kälte).

### Velo
- Feste Reihenfolge der Velos mit dem Haupt-Velo zuerst (13./14.10.).
- Ein Standard-Velo **pro Art** (Gravel, MTB). Bei der allerersten Tour fragt die App einmal: immer das Standard-Velo oder das zuletzt gefahrene (13.10., VS1–VS4 freigegeben am 14.10.).
- Velo-Messwerte gehören nur in private Dateien, nie ins Repository.
- Neuer Velo-Reiter «Setup» mit eigenen Fotos (nur auf dem Gerät), Taschen-Plan und Setup-Logbuch (14.10., UC3).

### Aktiv, Gesundheit, Alltag
- Meditation prominent: Karte auf Heute, erster Reiter in Aktiv, überall «Meditation» statt «Kissenzeit», Timer zählt hoch, Klangschale (13.10.).
- Statt fester Tagesfragen: **«Deine Abfragen»**, eigene Fragen mit eigenem Takt, ein Verlauf, eine Auswertung. Die Seite heisst **«Wi gaht's?»** und ersetzt den alten Tages-Check samt «Deine Balance» und festen Runden 07:00 und 20:30 (13./14.10.).
- Wöchentliche Gewichtsfrage kommt als Teil von «Deine Abfragen», abschaltbar (13.10.).
- Gesundheitsdaten sind nur zum Anschauen (Beobachtung), nie Bewertung.
- Begrüssung auf Heute in Mundart je nach Tageszeit (14.10., HG1).

### KI
- Der KI-Helfer (kostet Geld) ist ab Werk aus (13.10., 0.118.0).
- Bezahlte Claude-Funktionen in der App: **vorerst nicht** (13.10. 22:53). Stattdessen gratis Wege in dieser Reihenfolge: 1 «Für Claude kopieren» (Text in die Claude-App einfügen), 2 regelbasierte Versionen ohne KI, 3 Chrome-eigene KI am Computer.
- Kluge Suche ohne KI-Kosten, gebaut ohne Bilder (14.10.).

### Daten
- Einmalige Datenbereinigung **vor** Profilen (14.10., Antworten 1a, 2–5a): persönliche Daten raus aus dem Code, eine Liste an einem Ort, Altlasten mit Backup migrieren und löschen, Sportarten jetzt vereinheitlichen.
- Standard-Profil: Grundlisten immer da; beim ersten Start fragt die App einmal «Mit Beispielen starten» oder «Leer starten»; Änderungen am Standard kommen als Vorschlag «übernehmen?»; zuerst Listen änderbar, dann Profil-Umschalter unter Ich › Die App (14.10.).
- Ein tägliches automatisches Backup um Mitternacht ist in einer Web-App nicht möglich; die Ordner-Sicherung am Computer bleibt (13.10.).

### Bezahlen und Angebote (14.10.)
- Alles vorbereiten, im Testmodus, ohne Kosten. Pro-Funktionen wären Strava/Fitbit/Garmin; Vorlagen-Verkauf möglich.
- Gratis Zahlwege: QR-Rechnung und privates TWINT (standardmässig an, andere Nutzer wählen ihre eigenen Wege), Abgleich von Hand oder über den hochgeladenen Kontoauszug. Kreditkarten sind nie gratis.
- Shop für digitale und physische Produkte, in der App und auf einer öffentlichen Seite, Bestellungen in der App, eigene Mails, Entwürfe für AGB und Impressum.
- Bankdaten und TWINT-Nummer nur auf dem Gerät, nie im Repository.
- Tennis-Buchung: sofort buchen; Noah legt pro Angebot fest, ob vor Ort oder online bezahlt wird; Schüler können bis 24 h vorher absagen, Noah jederzeit.

## Regel «Was fällt weg oder rutscht tiefer»

Hintergrund: Die Release-Analyse vom 14.10. prüfte 137 Releases und rund 180 Funktionen. Etwa 160 waren in Ordnung; 16 Funde zeigten Funktionen, die spätere Releases versteckt oder tiefer gelegt hatten. Ursachen: Nebenwirkungen des Design-Refresh (7 Funde), Ersatz ohne Rückfrage (zum Beispiel «wie letzte Tour» in 0.114, Schnellstart statt Tagestour in 0.119) und neue Kacheln, die alte nach unten drückten. Noahs Antwort «1a 2a 3a 4a»: Bilder für alle wichtigen und mittleren Funde (Paket «Wieder sichtbar»), Tagestour nur noch als Schnellstart, die neue PR-Regel, Meditation vorziehen.
